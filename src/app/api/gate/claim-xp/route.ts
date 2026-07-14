import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import CourseProgress from '@/models/CourseProgress';
import { getAuthUser } from '@/lib/auth';
import {
  MAGIC_EXAMPLES,
  MAX_LANDING_XP,
  XP_PER_EXAMPLE,
  XP_BONUS_ACERTO,
  CATEGORIES,
} from '@/data/landing/examples';

const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.id as string));
const VALID_EXAMPLE_IDS = new Set(MAGIC_EXAMPLES.map((e) => e.id));

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
 * GET — estado do minigame para o usuário logado na home (P0):
 * quais exemplos já foram creditados, XP real da conta e progresso da trilha.
 * É a fonte que permite à landing tratar o aluno como aluno.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();
    const [user, courses] = await Promise.all([
      User.findById(authUser.id)
        .select('progress.xp progress.level progress.currentStreak progress.longestStreak gamification.gateExamples gamification.achievements gamification.totalImagesGenerated')
        .lean(),
      CourseProgress.find({ userId: authUser.id }).select('progressPercent').lean(),
    ]);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const xp = user.progress?.xp || 0;
    const anyCourse = courses.length > 0;
    const halfCourse = courses.some((c) => (c.progressPercent || 0) >= 50);
    const fullCourse = courses.some((c) => (c.progressPercent || 0) >= 100);

    // Mesmos critérios do TrailMap do portal — gamificação honesta, uma fonte só
    const trailDone = [
      xp >= 50,
      anyCourse,
      halfCourse,
      (user.gamification?.totalImagesGenerated || 0) >= 1,
      (user.gamification?.achievements?.length || 0) >= 1,
      Math.max(user.progress?.currentStreak || 0, user.progress?.longestStreak || 0) >= 3,
      fullCourse,
      fullCourse,
    ].filter(Boolean).length;

    return NextResponse.json({
      playedIds: user.gamification?.gateExamples || [],
      totalXp: xp,
      level: user.progress?.level || getLevelFromXp(xp),
      trail: { done: trailDone, total: 8 },
    });
  } catch (error) {
    console.error('[CLAIM-XP][GET]', error);
    return NextResponse.json({ error: 'Erro ao carregar estado' }, { status: 500 });
  }
}

/**
 * POST — dois modos:
 *
 * 1. Incremental (P0, home logada): { exampleId, acertou, category? } →
 *    credita +50/+75 NA HORA, idempotente por (userId, exampleId) via
 *    gamification.gateExamples. O esforço do aluno nunca é jogado fora.
 *
 * 2. Bulk legado (anônimo → cadastro): { xp, categories } → resgata a
 *    jornada do localStorage uma única vez (landingXpClaimed) e semeia o
 *    socialPersona — fluxo original, intocado.
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json().catch(() => ({}));

    // ---------- Modo incremental (jogada individual do usuário logado) ----------
    if (typeof body?.exampleId === 'string') {
      const exampleId = body.exampleId;
      if (!VALID_EXAMPLE_IDS.has(exampleId)) {
        return NextResponse.json({ error: 'Exemplo inválido' }, { status: 400 });
      }
      const acertou = body?.acertou === true;
      const xpGain = XP_PER_EXAMPLE + (acertou ? XP_BONUS_ACERTO : 0);
      const category =
        typeof body?.category === 'string' && VALID_CATEGORIES.has(body.category)
          ? body.category
          : null;

      // Idempotência atômica: só credita se o exampleId ainda não está na lista
      const updated = await User.findOneAndUpdate(
        { _id: authUser.id, 'gamification.gateExamples': { $ne: exampleId } },
        {
          $push: { 'gamification.gateExamples': exampleId },
          $inc: {
            'progress.xp': xpGain,
            'progress.weeklyXp': xpGain,
            'progress.monthlyXp': xpGain,
          },
          ...(category ? { $addToSet: { 'profile.interests': category } } : {}),
        },
        { new: true }
      );

      if (!updated) {
        // Já creditado antes — devolve o estado real sem duplicar (modo treino)
        const user = await User.findById(authUser.id).select('progress.xp progress.level').lean();
        return NextResponse.json({
          credited: false,
          reason: 'already-credited',
          totalXp: user?.progress?.xp || 0,
          level: user?.progress?.level || 1,
        });
      }

      const newLevel = getLevelFromXp(updated.progress?.xp || 0);
      if (newLevel !== updated.progress?.level) {
        updated.progress.level = newLevel;
        await updated.save();
      }

      return NextResponse.json({
        credited: true,
        xp: xpGain,
        totalXp: updated.progress?.xp || 0,
        level: newLevel,
      });
    }

    // ---------- Modo bulk legado (resgate único pós-cadastro) ----------
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.gamification?.landingXpClaimed) {
      return NextResponse.json({ claimed: false, reason: 'already-claimed' });
    }

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

    // Os exemplos vistos anonimamente também contam como jogados —
    // evita re-farm dos mesmos exemplos depois do cadastro.
    const seenIds: string[] = Array.isArray(body?.seenIds)
      ? body.seenIds.filter((id: unknown) => typeof id === 'string' && VALID_EXAMPLE_IDS.has(id as string))
      : [];
    if (seenIds.length > 0) {
      const played = new Set<string>(user.gamification?.gateExamples || []);
      for (const id of seenIds) played.add(id);
      user.gamification = user.gamification || {};
      user.gamification.gateExamples = [...played];
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
