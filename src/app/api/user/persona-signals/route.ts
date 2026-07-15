import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/persona-signals — coleta LEVE de informações do usuário
 * a partir de minigames, perfil e do vidente da persona (14/07/2026).
 *
 * Diferente do PUT /api/user/social-persona (que substitui campos), aqui o
 * merge é ADITIVO e idempotente: valores repetidos não duplicam nada.
 * Tudo alimenta o MESMO socialPersona que o USS usa para gerar conteúdo —
 * cada resposta deixa o conteúdo do aluno mais pessoal.
 *
 * Body: { source: string, signals: {
 *   industry?: string[], toneOfVoice?: string[], marketingGoals?: string[],
 *   contentTypes?: string[], experienceLevel?: string,
 *   interests?: string[], facts?: string[]
 * } }
 */

const ARRAY_FIELDS = ['industry', 'toneOfVoice', 'marketingGoals', 'contentTypes'] as const;
const MAX_ITEMS = 30;
const XP_REWARD = 10;

const clean = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0 && x.length <= 60).map((x) => x.trim()).slice(0, 8)
    : [];

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

    const body = await request.json().catch(() => ({}));
    const signals = (body?.signals || {}) as Record<string, unknown>;
    const source = typeof body?.source === 'string' ? body.source.slice(0, 40) : 'unknown';

    let added = 0;
    const persona = user.socialPersona as unknown as Record<string, unknown>;

    for (const field of ARRAY_FIELDS) {
      const incoming = clean(signals[field]);
      if (incoming.length === 0) continue;
      const current = new Set<string>((persona[field] as string[]) || []);
      for (const v of incoming) {
        if (!current.has(v) && current.size < MAX_ITEMS) {
          current.add(v);
          added++;
        }
      }
      persona[field] = [...current];
    }

    // Interesses valem duplo: persona (USS) + profile (recomendações do portal)
    const interests = clean(signals.interests);
    if (interests.length > 0) {
      const primary = new Set<string>((persona.primaryInterests as string[]) || []);
      const profileInterests = new Set<string>(user.profile?.interests || []);
      for (const v of interests) {
        if (!primary.has(v) && primary.size < MAX_ITEMS) {
          primary.add(v);
          added++;
        }
        profileInterests.add(v);
      }
      persona.primaryInterests = [...primary];
      user.profile = user.profile || ({} as typeof user.profile);
      user.profile.interests = [...profileInterests];
    }

    // Nível só preenche se ainda não existir — o usuário refina depois no builder
    const level = typeof signals.experienceLevel === 'string' ? signals.experienceLevel.trim() : '';
    if (level && !persona.experienceLevel) {
      persona.experienceLevel = level.slice(0, 30);
      added++;
    }

    // Fatos livres viram frases dedupadas no audienceInsights (o RAG do USS lê isso)
    const facts = clean(signals.facts);
    if (facts.length > 0) {
      const existing = String(persona.audienceInsights || '');
      const fresh = facts.filter((f) => !existing.includes(f));
      if (fresh.length > 0) {
        persona.audienceInsights = [existing, ...fresh].filter(Boolean).join(' · ').slice(0, 2000);
        added += fresh.length;
      }
    }

    // Recompensa honesta: só quando aprendemos algo NOVO sobre a pessoa
    let xpAwarded = 0;
    if (added > 0) {
      persona.lastAnalyzed = new Date();
      xpAwarded = XP_REWARD;
      user.progress.xp += xpAwarded;
      user.progress.weeklyXp += xpAwarded;
      user.progress.monthlyXp += xpAwarded;
      console.log(`[persona-signals] +${added} sinais de ${source} para ${user.email}`);
    }

    await user.save();

    return NextResponse.json({
      learned: added,
      xpAwarded,
      totalXp: user.progress.xp,
      completionPercent: user.socialPersona.completionPercent,
    });
  } catch (error) {
    console.error('[persona-signals] Error:', error);
    return NextResponse.json({ error: 'Erro ao salvar sinais' }, { status: 500 });
  }
}
