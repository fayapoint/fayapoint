import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PERSONA_FIELDS = ['industry', 'toneOfVoice', 'marketingGoals', 'contentTypes', 'experienceLevel'] as const;
const XP_PER_STEP = 25;
const XP_COMPLETION_BONUS = 50;

function calculateCompletionPercent(persona: Record<string, unknown>): number {
  let filled = 0;
  for (const field of PERSONA_FIELDS) {
    const value = persona[field];
    if (Array.isArray(value) ? value.length > 0 : !!value) {
      filled++;
    }
  }
  return Math.round((filled / PERSONA_FIELDS.length) * 100);
}

/**
 * GET /api/user/social-persona
 * Returns the user's socialPersona from the User model.
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

    const persona = user.socialPersona || {
      industry: [],
      toneOfVoice: [],
      marketingGoals: [],
      contentTypes: [],
      experienceLevel: '',
      topHashtags: [],
      contentThemes: [],
      audienceInsights: '',
      writingStyle: '',
      postingFrequency: '',
      primaryInterests: [],
      recommendedCourses: [],
      recommendationReasoning: [],
      personaVersion: 0,
      weights: { profile: 34, social: 33, custom: 33 },
      completionPercent: 0,
    };

    return NextResponse.json({ socialPersona: persona });
  } catch (error) {
    console.error('Social persona GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * PUT /api/user/social-persona
 * Updates the user's socialPersona with partial fields.
 * Awards XP on first completion.
 */
export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const wasFirstVersion = user.socialPersona.personaVersion === 0;

    // Merge incoming fields into existing socialPersona
    const updatableFields = [
      'industry', 'toneOfVoice', 'marketingGoals', 'contentTypes',
      'experienceLevel', 'topHashtags', 'contentThemes', 'audienceInsights',
      'writingStyle', 'postingFrequency', 'primaryInterests', 'weights',
    ];

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        (user.socialPersona as Record<string, unknown>)[field] = body[field];
      }
    }

    // Calculate completion percent based on the 5 visual selection fields
    const personaObj = user.socialPersona as unknown as Record<string, unknown>;
    user.socialPersona.completionPercent = calculateCompletionPercent(personaObj);

    // Increment personaVersion
    user.socialPersona.personaVersion += 1;

    // Award XP if this is the first time completing persona (was version 0)
    if (wasFirstVersion) {
      // Count how many steps are filled for step-based XP
      let filledSteps = 0;
      for (const field of PERSONA_FIELDS) {
        const value = personaObj[field];
        if (Array.isArray(value) ? value.length > 0 : !!value) {
          filledSteps++;
        }
      }

      const stepXp = filledSteps * XP_PER_STEP;
      const bonusXp = filledSteps === PERSONA_FIELDS.length ? XP_COMPLETION_BONUS : 0;
      const totalXp = stepXp + bonusXp;

      if (totalXp > 0) {
        user.progress.xp += totalXp;
        user.progress.weeklyXp += totalXp;
        user.progress.monthlyXp += totalXp;
      }
    }

    await user.save();

    return NextResponse.json({ socialPersona: user.socialPersona });
  } catch (error) {
    console.error('Social persona PUT error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar persona' }, { status: 500 });
  }
}
