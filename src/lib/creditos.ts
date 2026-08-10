import User from '@/models/User';
import { registrarCredito } from '@/lib/uso';
import {
  CREDIT_COSTS,
  CREDIT_PACKS,
  TIER_CONFIGS,
  resolvePlan,
  type CreditAction,
} from '@/lib/course-tiers';

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
  // Também na linha do tempo de uso: `credits.history` guarda só os últimos
  // 200 lançamentos e não sabe em que sessão nem em que rota aconteceu.
  registrarCredito({
    userId,
    action: ACAO_BOAS_VINDAS,
    credits: valor,
    descricao: `Boas-vindas: ${valor} créditos`,
  });
  return valor;
}

/** Marca do refill mensal no extrato. */
const ACAO_REFILL = 'monthly_refill';

/**
 * A data do próximo ciclo: o mesmo dia do mês seguinte.
 *
 * ⚠️ `setMonth(+1)` sozinho transborda: 31/01 vira 03/03, porque fevereiro não
 * tem 31. Quem assinou dia 31 teria o ciclo andando para frente todo mês até
 * escorregar de mês inteiro. O `Math.min` com o último dia do mês de destino
 * ancora o dia 31 no dia 28/29 de fevereiro e o devolve ao 31 em março.
 */
function proximoCiclo(desde: Date): Date {
  const d = new Date(desde);
  const diaDesejado = d.getDate();
  const alvo = new Date(d.getFullYear(), d.getMonth() + 1, 1, d.getHours(), d.getMinutes(), d.getSeconds());
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  alvo.setDate(Math.min(diaDesejado, ultimoDia));
  return alvo;
}

/**
 * Repõe a alocação mensal do assinante quando o ciclo vira (03/08/2026).
 *
 * ## O buraco que esta função fecha
 *
 * A economia nova promete "400 créditos por mês" ao Expert, e a promessa é
 * mensal. Mas o único lugar que aplicava `monthlyCredits` era o webhook de
 * pagamento. Se o provedor não dispara webhook em toda renovação — e o
 * histórico do site não prova que dispara — o assinante paga o segundo mês e
 * não recebe crédito nenhum. Era uma promessa mensal sem mecanismo que a
 * cumprisse.
 *
 * ## Por que não é um cron
 *
 * Um cron para isto precisaria de infraestrutura nova (a VPS já carrega 7),
 * varreria a base inteira todo dia para achar os poucos que viraram o ciclo, e
 * falharia em silêncio — que é exatamente como o cron das capas do blog passou
 * seis dias quebrado sem ninguém saber. Concedendo na hora em que a pessoa OLHA
 * o saldo, o gatilho é o próprio uso: crédito só vale quando alguém entra para
 * gastá-lo, e quem não entrou não perdeu nada, porque o ciclo é ancorado na
 * última reposição e não no calendário.
 *
 * É o mesmo desenho de `garantirBoasVindas`, pelas mesmas razões: nenhuma
 * migração, os 20 usuários que já existem entram pelo mesmo caminho dos novos,
 * e a regra e a prova (o extrato) são o mesmo dado.
 *
 * ## Repõe, não soma
 *
 * `$set` e não `$inc`. O crédito da mensalidade expira na virada do ciclo — é a
 * regra que a ordem de consumo de `debitar()` já assume ao gastar a mensalidade
 * antes do pacote comprado. Somar faria o assinante inativo acumular 4.800
 * créditos no ano e transformaria a mensalidade num estoque, quebrando a razão
 * de o pacote comprado durar 90 dias.
 *
 * ⚠️ Os pacotes COMPRADOS não são tocados: eles têm validade própria e foram
 * pagos à parte.
 *
 * ## Só assinante ativo
 *
 * Plano gratuito não tem ciclo — recebe o empurrão único de boas-vindas e
 * pronto. E `status` diferente de `active` (pagamento atrasado, cancelado)
 * não repõe: repor crédito a quem parou de pagar é dar o produto de graça.
 */
export async function garantirRefillMensal(userId: string, agora: Date = new Date()): Promise<number> {
  const user = await User.findById(userId).select('credits subscription');
  if (!user) return 0;

  const plano = resolvePlan(user.subscription?.plan || 'free');
  if (plano === 'free' || user.subscription?.status !== 'active') return 0;

  const valor = TIER_CONFIGS[plano].monthlyCredits;
  if (!valor) return 0;

  const ultima: Date | undefined = user.credits?.lastRefillDate;
  // Sem data nenhuma, este é o primeiro ciclo que o mecanismo enxerga: é o caso
  // dos assinantes que já existiam quando a economia mudou. Eles recebem agora
  // e passam a ter âncora daqui para frente.
  if (ultima && agora < proximoCiclo(new Date(ultima))) return 0;

  // Compare-and-set: a condição carrega a data que acabamos de ler. Duas
  // requisições simultâneas (a aba do dashboard e a do Ateliê abrindo juntas)
  // entrariam as duas aqui; só a primeira encontra o documento nesse estado e
  // a segunda modifica zero documentos. Sem isto, o assinante ganharia a
  // alocação duas vezes por abrir duas abas.
  const r = await User.updateOne(
    { _id: userId, 'credits.lastRefillDate': ultima ?? { $in: [null, undefined] } },
    {
      $set: {
        'credits.balance': valor,
        'credits.monthlyAllocation': valor,
        'credits.lastRefillDate': agora,
      },
      $push: {
        'credits.history': {
          $each: [
            {
              action: ACAO_REFILL,
              amount: valor,
              description: `Créditos do mês — plano ${TIER_CONFIGS[plano].displayName}: ${valor} créditos (= R$${valor})`,
              createdAt: agora,
            },
          ],
          $slice: -200,
        },
      },
    },
  );

  if (r.modifiedCount > 0) {
    registrarCredito({
      userId,
      action: ACAO_REFILL,
      credits: valor,
      descricao: `Renovação mensal — plano ${TIER_CONFIGS[plano].displayName}`,
    });
    return valor;
  }
  return 0;
}

/**
 * As duas concessões automáticas, num chamador só.
 *
 * Existe para que nenhuma rota que lê saldo precise lembrar de chamar as duas.
 * Esquecer uma delas produz o pior tipo de defeito deste módulo: silencioso,
 * visível só no fim do mês, e do lado do aluno.
 */
export async function garantirCreditos(userId: string): Promise<number> {
  const boasVindas = await garantirBoasVindas(userId);
  const mensal = await garantirRefillMensal(userId);
  return boasVindas + mensal;
}

/**
 * O saldo de quem vai GASTAR — concedido antes de ser lido.
 *
 * ## O defeito que esta função existe para tornar impossível
 *
 * `saldoDe(user)` lê o documento que a rota já tinha em mãos. Isso serve para
 * exibir, e não serve para autorizar um gasto: se o ciclo do assinante virou e
 * ele foi DIRETO gerar — sem abrir a tela de créditos nem o Ateliê, que são as
 * duas telas que concedem — a conferência acontecia contra o saldo do mês
 * passado. O assinante ouvia "crédito insuficiente" no dia em que ganhou os
 * créditos do mês.
 *
 * Medido em 04/08/2026: duas rotas de gasto (`/api/user/caderno` e
 * `/api/user/curso-personalizado`) liam o saldo sem nunca conceder.
 *
 * ⚠️ **Toda rota que vai gastar deve chamar esta função, não `saldoDe`.**
 * `saldoDe` continua existindo para exibição e para o cálculo interno de
 * `debitar`, onde conceder no meio de uma cobrança seria errado.
 */
export async function saldoParaGastar(userId: string): Promise<Saldo> {
  await garantirCreditos(userId);
  const fresco = await User.findById(userId).select('credits');
  return saldoDe((fresco ?? {}) as UsuarioComCreditos);
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

  registrarCredito({
    userId,
    userEmail: user.email,
    action,
    credits: -custo,
    descricao: descricao,
  });

  return { ok: true, gasto: custo, restante };
}
