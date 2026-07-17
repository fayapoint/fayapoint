import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generate } from '@/lib/ai/provider';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userId = authUser.id;

    // Check if user has Pro access
    const plan = user.subscription?.plan || 'free';
    if (!['pro', 'business', 'starter', 'explorador', 'profissional', 'expert'].includes(plan)) {
      return NextResponse.json(
        { error: 'Este recurso requer um plano Pro ou superior' },
        { status: 403 }
      );
    }

    // Get message + histórico da conversa (últimas mensagens do cliente)
    const body = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensagem inválida' },
        { status: 400 }
      );
    }

    // ── Tutor FayAI (Fase 6.2): contexto de persona + cursos do aluno ──
    const persona = user.socialPersona;
    const personaLines = [
      persona?.industry?.length ? `Setor: ${persona.industry.join(', ')}` : '',
      persona?.marketingGoals?.length ? `Objetivos: ${persona.marketingGoals.join(', ')}` : '',
      persona?.experienceLevel ? `Nível com IA: ${persona.experienceLevel}` : '',
      persona?.contentTypes?.length ? `Produz: ${persona.contentTypes.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrolled = (user.enrolledCourses || []).filter((c: any) => c.isActive);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coursesLine = enrolled.map((c: any) => c.courseSlug).slice(0, 8).join(', ');

    const systemPrompt = `Você é o Tutor FayAI — o tutor pessoal da FayAi Academy, plataforma brasileira de cursos de Inteligência Artificial.

Seu papel de TUTOR (não só assistente):
- Tirar dúvidas sobre os cursos e conceitos de IA (ChatGPT, geração de imagem, automação, agentes)
- Sempre que fizer sentido, dar o exemplo NO CONTEXTO do aluno (setor/objetivos abaixo), nunca genérico
- Sugerir o próximo passo concreto na plataforma (continuar um capítulo, refazer um quiz, testar no Studio AI)
- Responder em português brasileiro, claro e direto; emojis com moderação
- Se não souber algo específico de um curso, seja honesto e aponte onde encontrar no portal

Sobre o aluno:
- Nome: ${user.name}
- Nível ${user.progress?.level || 1} · Plano ${plan}
${personaLines ? personaLines : '- Persona ainda não preenchida (sugira completar em Meu Perfil → Sua Persona quando fizer sentido)'}
${coursesLine ? `- Cursos matriculados: ${coursesLine}` : ''}

Mantenha as respostas concisas mas úteis.`;

    // Histórico: últimas 8 trocas enviadas pelo cliente (role/content)
    const historyMessages = Array.isArray(history)
      ? history
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .slice(-8)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, 4000) }))
      : [];

    // Provider unificado (fallback free→budget; o antigo 'openrouter/free' não é um modelo válido)
    const ai = await generate({
      tier: plan === 'expert' ? 'budget' : 'free',
      maxTokens: 1024,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: message },
      ],
    });

    const assistantResponse = ai.content || 'Desculpe, não consegui processar sua pergunta.';

    // Update user's AI chat count
    await User.findByIdAndUpdate(userId, {
      $inc: { 'gamification.totalAiChats': 1 },
    });

    return NextResponse.json({
      response: assistantResponse,
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
