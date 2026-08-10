import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import {
  CREDIT_COSTS,
  CreditAction,
  CREDIT_PACKS,
  TIER_CONFIGS,
  resolvePlan,
  SubscriptionPlan,
} from '@/lib/course-tiers';
import { garantirCreditos, saldoParaGastar, debitar, custoDe } from '@/lib/creditos';

/**
 * GET /api/credits
 * Returns current credit balance, history, and available packs
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    // As duas concessões automáticas ANTES de ler o documento — senão a
    // primeira visita do mês mostraria o saldo velho e o crédito novo só
    // apareceria no F5. Ver `garantirRefillMensal` em lib/creditos: é a leitura
    // do saldo que faz o ciclo virar, porque não existe cron.
    await garantirCreditos(authUser.id);

    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const userPlan = resolvePlan(user.subscription?.plan || 'free');
    const tierConfig = TIER_CONFIGS[userPlan];

    // Clean up expired purchased credits
    const now = new Date();
    const validPurchased = (user.credits?.purchasedCredits || []).filter(
      (p: { expiresAt: Date }) => new Date(p.expiresAt) > now
    );

    const purchasedBalance = validPurchased.reduce(
      (sum: number, p: { amount: number }) => sum + p.amount, 0
    );

    // Quando o próximo ciclo repõe. Só faz sentido para assinante ativo — o
    // plano gratuito recebe o empurrão único de boas-vindas e não tem ciclo.
    let nextRefillDate: Date | null = null;
    if (userPlan !== 'free' && user.subscription?.status === 'active' && user.credits?.lastRefillDate) {
      const d = new Date(user.credits.lastRefillDate);
      const alvo = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
      alvo.setDate(Math.min(d.getDate(), ultimoDia));
      nextRefillDate = alvo;
    }

    return NextResponse.json({
      balance: (user.credits?.balance || 0) + purchasedBalance,
      monthlyBalance: user.credits?.balance || 0,
      purchasedBalance,
      monthlyAllocation: tierConfig.monthlyCredits,
      lastRefillDate: user.credits?.lastRefillDate,
      nextRefillDate,
      // Cada pacote com a própria validade: sem isto o aluno vê "120 comprados"
      // e não sabe que 100 deles vencem semana que vem.
      purchasedPacks: validPurchased.map((p: { amount: number; purchasedAt?: Date; expiresAt: Date }) => ({
        amount: p.amount,
        purchasedAt: p.purchasedAt,
        expiresAt: p.expiresAt,
      })),
      totalSpent: user.credits?.totalSpent || 0,
      totalPurchased: user.credits?.totalPurchased || 0,
      plan: userPlan,
      planStatus: user.subscription?.status || 'active',
      costs: CREDIT_COSTS,
      packs: CREDIT_PACKS,
      history: (user.credits?.history || []).slice(-50),  // last 50 entries
    });
  } catch (error) {
    console.error('Credits GET error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/credits — gasta crédito numa ação.
 * Body: { action: CreditAction, quantity?: number, description?: string }
 *
 * ## ⚠️ Por que este corpo encolheu para uma chamada (10/08/2026)
 *
 * A rota carregava **sua própria cópia** da conta de débito: ordem de consumo,
 * varredura de pacotes vencidos, FIFO, remoção de pacote zerado, extrato. A
 * mesma conta que `debitar()` faz em `lib/creditos.ts` — e que existe lá
 * justamente porque o Ateliê precisava dela e copiar seria errado.
 *
 * Duas cópias da regra de dinheiro divergiram, como duas cópias sempre
 * divergem. O que a cópia daqui não tinha:
 *
 * 1. **Não chamava `garantirCreditos` antes de conferir o saldo.** É o defeito
 *    exato que `saldoParaGastar` foi criado para tornar impossível: se o ciclo
 *    do assinante virou e ele foi direto gastar, a conferência acontecia contra
 *    o saldo do mês passado e ele ouvia *"créditos insuficientes"* no dia em que
 *    ganhou os créditos do mês.
 * 2. **Não aceitava quantidade.** Cobrava sempre uma unidade, então nenhuma
 *    ação cobrada por volume (capítulo, ângulo do caderno) podia usar esta rota.
 * 3. **Arredondamento próprio** — `custoDe` arredonda; aqui não havia nada.
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { action, quantity, description } = await request.json();

    // ⚠️ `!CREDIT_COSTS[action]` era o teste antigo, e ele REJEITA ação de custo
    // zero (`ai_chat_message`), porque 0 é falso. `in` pergunta a coisa certa:
    // a ação existe no catálogo?
    if (typeof action !== 'string' || !(action in CREDIT_COSTS)) {
      return NextResponse.json(
        { error: 'Ação inválida', validActions: Object.keys(CREDIT_COSTS) },
        { status: 400 }
      );
    }

    const unidades = typeof quantity === 'number' && quantity > 0 ? quantity : 1;

    await dbConnect();

    const custo = custoDe(action as CreditAction, unidades);
    const saldo = await saldoParaGastar(authUser.id);
    if (saldo.total < custo) {
      return NextResponse.json({
        error: 'Créditos insuficientes',
        required: custo,
        available: saldo.total,
        faltam: custo - saldo.total,
        packs: CREDIT_PACKS,
        checkoutUrl: '/checkout/cart',
      }, { status: 402 });
    }

    const r = await debitar(
      authUser.id,
      action as CreditAction,
      unidades,
      description || `${action} (-${custo} créditos)`,
    );

    if (!r.ok) {
      // Corrida: alguém gastou entre a conferência e a cobrança.
      return NextResponse.json({
        error: 'Créditos insuficientes',
        required: custo,
        available: r.restante,
        faltam: r.faltam,
        packs: CREDIT_PACKS,
        checkoutUrl: '/checkout/cart',
      }, { status: 402 });
    }

    return NextResponse.json({
      success: true,
      spent: r.gasto,
      remainingBalance: r.restante,
      action,
    });
  } catch (error) {
    console.error('Credits POST error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
