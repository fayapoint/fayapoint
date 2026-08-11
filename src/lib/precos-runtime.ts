import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import {
  CREDIT_COSTS,
  PACOTES_CURSO,
  TIER_CONFIGS,
  type CreditAction,
  type IdPacote,
  type SubscriptionPlan,
} from '@/lib/course-tiers';

/**
 * OS PREÇOS, VIVOS — a tabela que o Ricardo mexe sem esperar deploy (11/08/2026).
 *
 * ## O problema
 *
 * Ricardo: *"estes valores precisam ser alterados e eu ter controle disso pelo
 * mission control"*.
 *
 * Até aqui todo preço do site era uma constante em `course-tiers.ts`. Mudar 25
 * para 30 custava uma sessão de programação, um build e um deploy — e a
 * consequência real disso não é a demora: é que **o dono do negócio não
 * consegue testar preço**. Uma tabela de preços que só muda com programador é
 * uma tabela congelada.
 *
 * ## O desenho, e a armadilha que ele evita
 *
 * O Mission Control grava um documento em `settings` (`_key: 'credit-pricing'`)
 * — a MESMA coleção e o MESMO padrão que o `quiz-config` já usava.
 *
 * ⚠️ **E é justamente o quiz-config que mostra a armadilha:** o Mission Control
 * gravava aquele documento desde sempre e o site **nunca o lia**
 * (`getQuizConfig()` devolvia as constantes locais e um comentário dizendo *"no
 * futuro isto vai carregar do Mission Control"*). O painel existia, o botão
 * salvava, e nada acontecia no site. Controle que não chega na caixa
 * registradora é enfeite.
 *
 * Então a regra aqui é dura: **toda rota que COBRA usa `getPrecos()`**, nunca
 * `CREDIT_COSTS` direto. As constantes viram o que sempre deveriam ter sido —
 * o padrão de fábrica, usado quando não há documento, quando o banco não
 * responde, e nas telas que só descrevem (as que rodam no navegador).
 *
 * ## Cache de 60 segundos, e por que não mais
 *
 * Sem cache, cada geração de imagem viraria uma ida ao banco antes da ida ao
 * modelo. Com cache longo, o Ricardo muda o preço, atualiza a página e vê o
 * número velho — e conclui, com razão, que o painel não funciona. Um minuto é
 * curto o bastante para o painel parecer instantâneo no uso real e longo o
 * bastante para o banco nem sentir.
 */

export interface PrecosVivos {
  /** Preço de cada ação, em créditos (1 crédito = R$1). */
  custos: Record<CreditAction, number>;
  /** Texto e arte de cada degrau do Ateliê — o preço sai de `custos[acao]`. */
  pacotes: Record<IdPacote, { titulo: string; promessa: string; imagem?: string; emBreve: boolean }>;
  /** Franquia mensal do assistente, por plano. `null` = sem limite. */
  chatMensagensMes: Record<SubscriptionPlan, number | null>;
  /** Quando o Mission Control gravou pela última vez. `null` = padrão de fábrica. */
  atualizadoEm: string | null;
}

const COLECAO = 'settings';
const CHAVE = 'credit-pricing';
const TTL_MS = 60_000;

export function precosPadrao(): PrecosVivos {
  return {
    custos: { ...CREDIT_COSTS },
    pacotes: Object.fromEntries(
      PACOTES_CURSO.map((p) => [
        p.id,
        { titulo: p.titulo, promessa: p.promessa, imagem: p.imagem, emBreve: p.emBreve === true },
      ]),
    ) as PrecosVivos['pacotes'],
    chatMensagensMes: {
      free: TIER_CONFIGS.free.chatMensagensMes,
      explorador: TIER_CONFIGS.explorador.chatMensagensMes,
      profissional: TIER_CONFIGS.profissional.chatMensagensMes,
      // `Infinity` não sobrevive a JSON (vira `null`), então a fronteira já
      // fala a língua do JSON: `null` é "sem limite" em todo o caminho.
      expert: Number.isFinite(TIER_CONFIGS.expert.chatMensagensMes)
        ? TIER_CONFIGS.expert.chatMensagensMes
        : null,
    },
    atualizadoEm: null,
  };
}

/**
 * Aceita só número finito e não-negativo.
 *
 * ⚠️ Um preço `NaN` (o que um campo de texto vazio produz depois de
 * `Number("")`… não: produz 0; mas `Number("abc")` produz `NaN`) atravessaria
 * `Math.round` intacto e chegaria ao `$inc` do Mongo, que rejeita o documento
 * inteiro — a cobrança falharia DEPOIS de o modelo já ter sido pago por nós.
 * Preço inválido cai no padrão de fábrica, que é sempre um número.
 */
function numeroValido(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

interface Cache {
  valor: PrecosVivos;
  em: number;
}
declare global {
  // eslint-disable-next-line no-var
  var __precosCache: Cache | undefined;
}

/** Faz o próximo `getPrecos()` reler o banco. O Mission Control chama isto ao salvar. */
export function invalidarPrecos(): void {
  global.__precosCache = undefined;
}

export async function getPrecos(): Promise<PrecosVivos> {
  const agora = Date.now();
  const cache = global.__precosCache;
  if (cache && agora - cache.em < TTL_MS) return cache.valor;

  const base = precosPadrao();

  try {
    await dbConnect();
    const db = mongoose.connection.db;
    const doc = db ? await db.collection(COLECAO).findOne({ _key: CHAVE }) : null;

    if (doc) {
      // ── custos ──────────────────────────────────────────────────────────
      // Só chaves que EXISTEM em `CREDIT_COSTS` entram. Um documento com uma
      // chave inventada (renomeada no painel, sobrada de uma versão antiga)
      // criaria uma ação de preço que nenhuma rota cobra — e `custoDe` de uma
      // ação desconhecida devolveria `NaN`.
      for (const chave of Object.keys(base.custos) as CreditAction[]) {
        const n = numeroValido((doc.custos as Record<string, unknown> | undefined)?.[chave]);
        if (n !== null) base.custos[chave] = n;
      }

      // ── pacotes (texto e arte; o preço vem de `custos`) ──────────────────
      for (const p of PACOTES_CURSO) {
        const salvo = (doc.pacotes as Record<string, Record<string, unknown>> | undefined)?.[p.id];
        if (!salvo) continue;
        if (typeof salvo.titulo === 'string' && salvo.titulo.trim()) base.pacotes[p.id].titulo = salvo.titulo.trim();
        if (typeof salvo.promessa === 'string' && salvo.promessa.trim()) base.pacotes[p.id].promessa = salvo.promessa.trim();
        if (typeof salvo.imagem === 'string') base.pacotes[p.id].imagem = salvo.imagem.trim() || undefined;
        if (typeof salvo.emBreve === 'boolean') base.pacotes[p.id].emBreve = salvo.emBreve;
      }

      // ── franquia do assistente ───────────────────────────────────────────
      for (const plano of Object.keys(base.chatMensagensMes) as SubscriptionPlan[]) {
        const bruto = (doc.chatMensagensMes as Record<string, unknown> | undefined)?.[plano];
        if (bruto === null) {
          base.chatMensagensMes[plano] = null;
          continue;
        }
        const n = numeroValido(bruto);
        if (n !== null) base.chatMensagensMes[plano] = n;
      }

      base.atualizadoEm = typeof doc.updatedAt === 'string' ? doc.updatedAt : null;
    }
  } catch (e) {
    // ⚠️ Banco fora do ar NÃO pode zerar preço nem derrubar uma cobrança. Cai
    // no padrão de fábrica — que é a tabela que estava no ar antes de existir
    // painel nenhum — e segue.
    console.error('[precos-runtime] caindo no padrão de fábrica:', e);
  }

  global.__precosCache = { valor: base, em: agora };
  return base;
}

/** O preço de uma ação agora, já com a tabela viva. */
export async function precoDe(acao: CreditAction): Promise<number> {
  return (await getPrecos()).custos[acao] ?? CREDIT_COSTS[acao];
}

/**
 * A franquia de conversa deste plano. `null` = ilimitado.
 *
 * Vive aqui, e não em `course-tiers.ts`, porque é um número que o Ricardo
 * mexe — e um limite que só muda com deploy é um limite que na prática ninguém
 * ajusta quando o custo do modelo muda.
 */
export async function franquiaDeChat(plano: SubscriptionPlan): Promise<number | null> {
  return (await getPrecos()).chatMensagensMes[plano] ?? null;
}
