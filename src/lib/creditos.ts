import User from '@/models/User';
import { CREDIT_COSTS, CREDIT_PACKS, TIER_CONFIGS, type CreditAction } from '@/lib/course-tiers';

/**
 * Os créditos, com quantidade (03/08/2026).
 *
 * ## Por que esta função existe
 *
 * O gasto morava inteiro dentro do `POST /api/credits`, e cobrava sempre UMA
 * unidade da ação. Serve para "uma imagem", "uma tentativa de quiz". Não serve
 * para o Ateliê, onde o preço é o curso inteiro — trinta capítulos, trinta
 * unidades, uma decisão só do aluno.
 *
 * Fazer o Ateliê chamar `/api/credits` trinta vezes seria trinta idas ao banco
 * e, pior, trinta oportunidades de a conta parar pela metade. Então a regra sai
 * da rota e vira função, e a rota passa a ser um dos dois chamadores.
 *
 * ## A ordem de consumo, e por que ela é essa
 *
 * Primeiro a mensalidade, depois os pacotes comprados, do mais velho para o
 * mais novo. É o contrário do que o caixa gostaria e o certo para o aluno: o
 * crédito da mensalidade expira na virada do ciclo de qualquer jeito, o pacote
 * comprado dura 90 dias. Gastar o pacote primeiro faria a pessoa perder crédito
 * que ela pagou enquanto sobrava crédito que ela ia perder de graça.
 */

export interface Saldo {
  /** Mensalidade + pacotes válidos. É o número que o aluno vê. */
  total: number;
  mensal: number;
  comprado: number;
}

interface UsuarioComCreditos {
  credits?: {
    balance?: number;
    purchasedCredits?: Array<{ amount: number; expiresAt: Date }>;
  };
}

export function saldoDe(user: UsuarioComCreditos, agora: Date = new Date()): Saldo {
  const mensal = user.credits?.balance || 0;
  const comprado = (user.credits?.purchasedCredits || [])
    .filter((p) => new Date(p.expiresAt) > agora)
    .reduce((s, p) => s + p.amount, 0);
  return { total: mensal + comprado, mensal, comprado };
}

/** Marca do lançamento de boas-vindas no extrato. É ela que garante o "uma vez só". */
const ACAO_BOAS_VINDAS = 'welcome_grant';

/**
 * Garante que a pessoa recebeu o crédito de boas-vindas (03/08/2026).
 *
 * ## Por que aqui e não no cadastro
 *
 * O cadastro não dá crédito nenhum hoje, e mexer nele deixaria de fora todo
 * mundo que já se cadastrou — justamente as pessoas que já estão no site e
 * ainda não viram a personalização funcionar. Concedendo na primeira vez que a
 * pessoa OLHA o saldo, os antigos entram no mesmo caminho dos novos, sem
 * migração e sem script.
 *
 * ## Como o "uma vez só" é garantido
 *
 * Pelo extrato, não por uma flag nova: se já existe um lançamento
 * `welcome_grant` no histórico, não concede de novo. O extrato é a mesma coisa
 * que o aluno lê na tela, então a regra e a prova são o mesmo dado — não há
 * como uma dizer sim e a outra não.
 *
 * ⚠️ Vale para QUALQUER plano, não só o gratuito. Quem assina já recebe a
 * alocação do plano pelo webhook de pagamento; o de boas-vindas é o primeiro
 * empurrão, e negá-lo a quem pagou seria punir o assinante.
 */
export async function garantirBoasVindas(userId: string): Promise<number> {
  const user = await User.findById(userId).select('credits subscription');
  if (!user) return 0;

  const jaRecebeu = (user.credits?.history || []).some(
    (h: { action?: string }) => h.action === ACAO_BOAS_VINDAS,
  );
  if (jaRecebeu) return 0;

  const valor = TIER_CONFIGS.free.monthlyCredits;
  await User.findByIdAndUpdate(userId, {
    $inc: { 'credits.balance': valor },
    $push: {
      'credits.history': {
        $each: [
          {
            action: ACAO_BOAS_VINDAS,
            amount: valor,
            description: `Boas-vindas: ${valor} créditos (= R$${valor}) para personalizar seu primeiro curso`,
            createdAt: new Date(),
          },
        ],
        $slice: -200,
      },
    },
  });
  return valor;
}

/**
 * O preço de N unidades de uma ação.
 *
 * `quantidade` aceita fração de propósito: o caderno de personagem cobra
 * proporcional ao número de ângulos que saíram (3 de 4 = 0,75 × R$40 = R$30).
 * O total é arredondado porque crédito é inteiro — e, na paridade de R$1, um
 * crédito quebrado seria um centavo quebrado na cara do aluno.
 */
export function custoDe(action: CreditAction, quantidade = 1): number {
  return Math.round(CREDIT_COSTS[action] * Math.max(0, quantidade));
}

export interface ResultadoDebito {
  ok: boolean;
  gasto: number;
  restante: number;
  /** Preenchido só quando `ok` é falso. */
  faltam?: number;
  packs?: typeof CREDIT_PACKS;
}

/**
 * Cobra `quantidade` unidades de `action` e devolve o saldo restante.
 *
 * Não lança quando falta crédito — devolve `ok: false` com quanto falta, porque
 * "seu saldo não dá" é uma resposta de produto (leva ao pacote ou ao upgrade),
 * não um erro de programa.
 *
 * ⚠️ Quem chama deve ter conferido o saldo ANTES de gastar recurso caro. Esta
 * função é a caixa registradora, não a portaria: ela debita o que já foi
 * entregue. O Ateliê confere o orçamento inteiro antes de acionar o modelo e
 * só chama aqui no fim, com o número de capítulos REALMENTE escritos.
 */
export async function debitar(
  userId: string,
  action: CreditAction,
  quantidade: number,
  descricao: string,
): Promise<ResultadoDebito> {
  const custo = custoDe(action, quantidade);
  const user = await User.findById(userId);
  if (!user) return { ok: false, gasto: 0, restante: 0, faltam: custo };

  const agora = new Date();
  const saldo = saldoDe(user, agora);
  if (custo === 0) return { ok: true, gasto: 0, restante: saldo.total };
  if (saldo.total < custo) {
    return {
      ok: false,
      gasto: 0,
      restante: saldo.total,
      faltam: custo - saldo.total,
      packs: CREDIT_PACKS,
    };
  }

  // Mensalidade primeiro.
  let falta = custo;
  let mensal = saldo.mensal;
  const tirado = Math.min(mensal, falta);
  mensal -= tirado;
  falta -= tirado;

  // Depois os pacotes, do mais velho para o mais novo.
  const pacotes = (user.credits?.purchasedCredits || [])
    .filter((p: { expiresAt: Date }) => new Date(p.expiresAt) > agora)
    .sort(
      (a: { purchasedAt?: Date }, b: { purchasedAt?: Date }) =>
        new Date(a.purchasedAt || 0).getTime() - new Date(b.purchasedAt || 0).getTime(),
    )
    .map((p: { amount: number; expiresAt: Date; purchasedAt?: Date }) => ({ ...p }));

  for (const pacote of pacotes) {
    if (falta <= 0) break;
    const usa = Math.min(pacote.amount, falta);
    pacote.amount -= usa;
    falta -= usa;
  }

  const restantes = pacotes.filter((p: { amount: number }) => p.amount > 0);

  await User.findByIdAndUpdate(userId, {
    $set: {
      'credits.balance': mensal,
      'credits.purchasedCredits': restantes,
    },
    $inc: { 'credits.totalSpent': custo },
    // O histórico é o extrato do aluno; sem descrição ele vira uma coluna de
    // números que não explica para onde o crédito foi.
    $push: {
      'credits.history': {
        $each: [{ action, amount: -custo, description: descricao, createdAt: agora }],
        $slice: -200,
      },
    },
  });

  const restante = mensal + restantes.reduce((s: number, p: { amount: number }) => s + p.amount, 0);
  return { ok: true, gasto: custo, restante };
}
