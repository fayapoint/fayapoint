import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const POPULAR_COURSES = [
  { slug: 'chatgpt-masterclass', reasoning: 'Curso mais popular da plataforma, essencial para quem quer dominar IA generativa.' },
  { slug: 'prompt-engineering', reasoning: 'Habilidade fundamental para extrair o máximo de qualquer modelo de IA.' },
  { slug: 'n8n-automacao-avancada', reasoning: 'Automatize fluxos de trabalho e conecte ferramentas sem precisar programar.' },
  { slug: 'primeiras-automacoes', reasoning: 'Ponto de partida ideal para quem está começando com automação.' },
  { slug: 'crie-agentes-de-ia-autonomos', reasoning: 'Aprenda a criar agentes de IA que trabalham de forma autônoma.' },
];

/**
 * GET /api/recommendations
 * Returns personalized course recommendations based on AI analysis,
 * or popular courses as fallback.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id).select('socialPersona');

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const persona = user.socialPersona;

    // If user has AI-generated recommendations, return those
    if (persona?.recommendedCourses?.length > 0) {
      const recommendations = persona.recommendedCourses.map((slug: string, i: number) => ({
        slug,
        reasoning: persona.recommendationReasoning?.[i] || '',
      }));

      return NextResponse.json({
        recommendations,
        source: 'ai' as const,
      });
    }

    // Fallback to popular courses
    return NextResponse.json({
      recommendations: POPULAR_COURSES,
      source: 'popular' as const,
    });
  } catch (error) {
    console.error('Recommendations GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
