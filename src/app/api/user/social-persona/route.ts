import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { montarDossie, type PersonaProfunda } from '@/lib/persona';

export const dynamic = 'force-dynamic';

const PERSONA_FIELDS = ['industry', 'toneOfVoice', 'marketingGoals', 'contentTypes', 'experienceLevel'] as const;
const XP_PER_STEP = 25;
const XP_COMPLETION_BONUS = 50;
/** Aprofundar a persona também vale XP — é o trabalho mais chato e o mais útil. */
const XP_BLOCO_PROFUNDO = 20;

/**
 * Dois vocabulários para a mesma coisa, e isso não era estilo: era um bug.
 *
 * O painel mandava `industries/tones/goals/level`; o modelo guarda
 * `industry/toneOfVoice/marketingGoals/experienceLevel`. Como o painel também
 * usava POST numa rota que só tinha GET e PUT, **nada nunca foi salvo** — a
 * persona parecia rasa porque estava vazia, não porque o formulário fosse
 * curto. Aceitar os dois nomes evita que qualquer chamador antigo volte a
 * escrever no vazio.
 */
const APELIDOS: Record<string, string> = {
  industries: 'industry',
  tones: 'toneOfVoice',
  goals: 'marketingGoals',
  level: 'experienceLevel',
};

const CAMPOS_RASOS = [
  'industry', 'toneOfVoice', 'marketingGoals', 'contentTypes',
  'experienceLevel', 'topHashtags', 'contentThemes', 'audienceInsights',
  'writingStyle', 'postingFrequency', 'primaryInterests', 'weights',
];

/**
 * Blocos profundos: substituídos inteiros, mas só os que vierem no corpo.
 *
 * ⚠️ `negocio` entrou em 03/08/2026 e esta lista é o portão: um bloco que não
 * está aqui é descartado em silêncio na gravação. O painel salvaria, a tela
 * mostraria sucesso e o dado sumiria — o pior tipo de defeito, porque não
 * aparece em lugar nenhum até alguém reparar que a confiança não sobe.
 */
const BLOCOS = ['identidade', 'voz', 'publico', 'estrategia', 'aprendizado', 'negocio'] as const;

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

function normalizar(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...body };
  for (const [de, para] of Object.entries(APELIDOS)) {
    if (out[de] !== undefined && out[para] === undefined) {
      out[para] = out[de];
      delete out[de];
    }
  }
  return out;
}

/** Um bloco profundo preenchido = pelo menos um campo com conteúdo. */
function blocoTemConteudo(bloco: unknown): boolean {
  if (!bloco || typeof bloco !== 'object') return false;
  return Object.values(bloco as Record<string, unknown>).some((v) =>
    Array.isArray(v) ? v.length > 0 : typeof v === 'number' ? true : typeof v === 'boolean' ? true : !!v
  );
}

/**
 * GET /api/user/social-persona
 * Devolve a persona e o dossiê já montado — o painel não recalcula confiança
 * no cliente, senão duas leituras da mesma pessoa poderiam discordar.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id).select('socialPersona name image');

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const persona = (user.socialPersona || {}) as unknown as PersonaProfunda;
    const dossie = montarDossie(persona, { nome: user.name, temFoto: !!user.image, avatar: user.image });

    return NextResponse.json({ socialPersona: persona, dossie, avatar: user.image || null });
  } catch (error) {
    console.error('Social persona GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * PUT/POST /api/user/social-persona
 * Atualiza a persona com os campos enviados. XP na primeira vez e a cada
 * bloco profundo novo — a recompensa acompanha o esforço real.
 */
async function salvar(request: Request) {
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

    const body = normalizar(await request.json().catch(() => ({})));
    const persona = user.socialPersona as unknown as Record<string, unknown>;

    for (const field of CAMPOS_RASOS) {
      if (body[field] !== undefined) persona[field] = body[field];
    }

    // Blocos profundos: merge campo a campo, para que o painel possa salvar
    // uma pergunta por vez sem apagar as respostas anteriores do mesmo bloco.
    for (const bloco of BLOCOS) {
      const incoming = body[bloco];
      if (!incoming || typeof incoming !== 'object') continue;
      const atual = (persona[bloco] || {}) as Record<string, unknown>;
      for (const [k, v] of Object.entries(incoming as Record<string, unknown>)) {
        if (v !== undefined) atual[k] = v;
      }
      persona[bloco] = atual;
    }

    persona.completionPercent = calculateCompletionPercent(persona);
    persona.personaVersion = ((persona.personaVersion as number) || 0) + 1;

    /**
     * XP pago pelo que é NOVO, e nunca duas vezes pelo mesmo.
     *
     * A versão anterior pagava só quando `personaVersion === 0`: quem
     * respondesse uma pergunta do dossiê antes de fechar o construtor perdia o
     * XP dos cinco passos para sempre. Trocar por "pague sempre que estiver
     * preenchido" seria o erro oposto — o mesmo do check-in que dava +15 a
     * cada carregamento: desmarcar e remarcar viraria uma fazenda de XP.
     *
     * O contador guarda quantos passos e quantos blocos já foram PAGOS. Só o
     * que passa desse teto rende, e ele nunca desce.
     */
    let passosPreenchidos = 0;
    for (const field of PERSONA_FIELDS) {
      const value = persona[field];
      if (Array.isArray(value) ? value.length > 0 : !!value) passosPreenchidos++;
    }
    const blocosPreenchidos = BLOCOS.filter((b) => blocoTemConteudo(persona[b])).length;

    const passosPagos = (persona.xpPassosPagos as number) || 0;
    const blocosPagos = (persona.xpBlocosPagos as number) || 0;
    const passosNovos = Math.max(0, passosPreenchidos - passosPagos);
    const blocosNovos = Math.max(0, blocosPreenchidos - blocosPagos);

    let xp = passosNovos * XP_PER_STEP + blocosNovos * XP_BLOCO_PROFUNDO;
    // O bônus de conclusão sai uma vez só, na primeira vez que os cinco fecham.
    if (passosPreenchidos === PERSONA_FIELDS.length && passosPagos < PERSONA_FIELDS.length) {
      xp += XP_COMPLETION_BONUS;
    }

    persona.xpPassosPagos = Math.max(passosPagos, passosPreenchidos);
    persona.xpBlocosPagos = Math.max(blocosPagos, blocosPreenchidos);

    if (xp > 0) {
      user.progress.xp += xp;
      user.progress.weeklyXp += xp;
      user.progress.monthlyXp += xp;
    }

    user.markModified('socialPersona');
    await user.save();

    const dossie = montarDossie(persona as PersonaProfunda, { nome: user.name, temFoto: !!user.image, avatar: user.image });
    return NextResponse.json({ socialPersona: persona, dossie, xpAwarded: xp });
  } catch (error) {
    console.error('Social persona save error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar persona' }, { status: 500 });
  }
}

export const PUT = salvar;
export const POST = salvar;
