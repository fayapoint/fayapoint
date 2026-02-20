import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Verify authentication
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    let decoded: { id: string } | string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    if (typeof decoded === 'string' || !decoded.id) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // Fetch user to check plan
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Check if user has Pro access
    const plan = user.subscription?.plan || 'free';
    if (!['pro', 'business', 'starter'].includes(plan)) {
      return NextResponse.json(
        { error: 'Este recurso requer um plano Pro ou superior' },
        { status: 403 }
      );
    }

    // Get message from request
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensagem inválida' },
        { status: 400 }
      );
    }

    // Prepare system prompt
    const systemPrompt = `Você é o assistente de IA da FayAi Academy, uma plataforma de cursos sobre Inteligência Artificial, automação e ferramentas digitais.

Seu papel é:
- Ajudar alunos com dúvidas sobre cursos e conteúdos
- Explicar conceitos de IA, automação, ChatGPT, Midjourney, n8n, etc.
- Dar dicas práticas sobre uso de ferramentas de IA
- Motivar e engajar os alunos em sua jornada de aprendizado
- Responder de forma clara, amigável e em português brasileiro

Informações sobre o usuário:
- Nome: ${user.name}
- Nível: ${user.progress?.level || 1}
- Plano: ${plan}

Mantenha as respostas concisas mas úteis. Use emojis moderadamente para tornar a conversa mais engajadora.`;

    // Call OpenRouter API
    const apiKey = OPENROUTER_API_KEY.trim();
    const authValue = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authValue,
        'HTTP-Referer': 'https://fayai.shop',
        'X-Title': 'FayAi AI Academy',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter error:', errorData);
      return NextResponse.json(
        { error: 'Erro ao processar mensagem' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const assistantResponse = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta.';

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
