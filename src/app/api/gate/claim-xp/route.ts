import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { MAX_LANDING_XP, CATEGORIES } from '@/data/landing/examples';

const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.id as string));

// Mesma curva de nível do /api/user/checkin
const getLevelFromXp = (xp: number): number => {
  let level = 1;
  let xpRequired = 100;
  while (xp >= xpRequired) {
    level++;
    xpRequired = Math.floor(100 * Math.pow(1.5, level - 1));
  }
  return level;
};

/**
 * Credita na conta o XP ganho no minigame da landing (uma única vez) e
 * semeia o socialPersona com as categorias que a pessoa explorou —
 * o primeiro passo do "aprender com o usuário" da visão FayAI.
 */
export async function POST(request: Request) {
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

    if (user.gamification?.landingXpClaimed) {
      return NextResponse.json({ claimed: false, reason: 'already-claimed' });
    }

    const body = await request.json().catch(() => ({}));
    const xp = Math.min(Math.max(Number(body?.xp) || 0, 0), MAX_LANDING_XP);
    const categories: string[] = Array.isArray(body?.categories)
      ? body.categories.filter((c: unknown) => typeof c === 'string' && VALID_CATEGORIES.has(c))
      : [];

    if (xp === 0) {
      return NextResponse.json({ claimed: false, reason: 'no-xp' });
    }

    user.progress = user.progress || {};
    user.progress.xp = (user.progress.xp || 0) + xp;
    user.progress.weeklyXp = (user.progress.weeklyXp || 0) + xp;
    user.progress.monthlyXp = (user.progress.monthlyXp || 0) + xp;
    user.progress.level = getLevelFromXp(user.progress.xp);

    // Semeia interesses com o que a pessoa explorou na landing
    if (categories.length > 0) {
      const interests = new Set<string>(user.profile?.interests || []);
      const primary = new Set<string>(user.socialPersona?.primaryInterests || []);
      for (const c of categories) {
        interests.add(c);
        primary.add(c);
      }
      user.profile = user.profile || {};
      user.profile.interests = [...interests];
      if (user.socialPersona) {
        user.socialPersona.primaryInterests = [...primary];
      }
    }

    user.gamification = user.gamification || {};
    user.gamification.landingXpClaimed = true;
    await user.save();

    return NextResponse.json({
      claimed: true,
      xp,
      totalXp: user.progress.xp,
      level: user.progress.level,
    });
  } catch (error) {
    console.error('[CLAIM-XP]', error);
    return NextResponse.json({ error: 'Erro ao resgatar XP' }, { status: 500 });
  }
}
