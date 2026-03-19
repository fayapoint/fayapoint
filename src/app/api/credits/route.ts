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

    return NextResponse.json({
      balance: (user.credits?.balance || 0) + purchasedBalance,
      monthlyBalance: user.credits?.balance || 0,
      purchasedBalance,
      monthlyAllocation: tierConfig.monthlyCredits,
      lastRefillDate: user.credits?.lastRefillDate,
      totalSpent: user.credits?.totalSpent || 0,
      totalPurchased: user.credits?.totalPurchased || 0,
      plan: userPlan,
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
 * POST /api/credits
 * Spend credits on an action
 * Body: { action: CreditAction, description?: string }
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { action, description } = await request.json();

    if (!action || !CREDIT_COSTS[action as CreditAction]) {
      return NextResponse.json(
        { error: 'Ação inválida', validActions: Object.keys(CREDIT_COSTS) },
        { status: 400 }
      );
    }

    const cost = CREDIT_COSTS[action as CreditAction];

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Calculate total available credits (monthly + valid purchased)
    const now = new Date();
    const monthlyBalance = user.credits?.balance || 0;
    const validPurchased = (user.credits?.purchasedCredits || []).filter(
      (p: { expiresAt: Date }) => new Date(p.expiresAt) > now
    );
    const purchasedBalance = validPurchased.reduce(
      (sum: number, p: { amount: number }) => sum + p.amount, 0
    );
    const totalBalance = monthlyBalance + purchasedBalance;

    if (totalBalance < cost) {
      return NextResponse.json({
        error: 'Créditos insuficientes',
        required: cost,
        available: totalBalance,
        packs: CREDIT_PACKS,
      }, { status: 402 });
    }

    // Deduct from monthly balance first, then purchased packs (oldest first)
    let remaining: number = cost;
    let newMonthlyBalance = monthlyBalance;

    if (newMonthlyBalance >= remaining) {
      newMonthlyBalance -= remaining;
      remaining = 0;
    } else {
      remaining -= newMonthlyBalance;
      newMonthlyBalance = 0;
    }

    // Deduct from purchased packs (FIFO — oldest first)
    const updatedPurchased = [...validPurchased];
    for (let i = 0; i < updatedPurchased.length && remaining > 0; i++) {
      const pack = updatedPurchased[i];
      if (pack.amount >= remaining) {
        pack.amount -= remaining;
        remaining = 0;
      } else {
        remaining -= pack.amount;
        pack.amount = 0;
      }
    }

    // Remove depleted packs
    const finalPurchased = updatedPurchased.filter(
      (p: { amount: number }) => p.amount > 0
    );

    const historyEntry = {
      action,
      amount: -cost,
      description: description || `${action} (-${cost} créditos)`,
      createdAt: now,
    };

    await User.findByIdAndUpdate(authUser.id, {
      $set: {
        'credits.balance': newMonthlyBalance,
        'credits.purchasedCredits': finalPurchased,
      },
      $inc: { 'credits.totalSpent': cost },
      $push: { 'credits.history': { $each: [historyEntry], $slice: -200 } },
    });

    return NextResponse.json({
      success: true,
      spent: cost,
      remainingBalance: newMonthlyBalance + finalPurchased.reduce(
        (s: number, p: { amount: number }) => s + p.amount, 0
      ),
      action,
    });
  } catch (error) {
    console.error('Credits POST error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
