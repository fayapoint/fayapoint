import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Subscription, { SUBSCRIPTION_PLANS } from '@/models/Subscription';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();

    const decoded = await getAuthUser();
    if (!decoded) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Get active subscription from Subscription model
    const activeSubscription = await Subscription.findOne({
      userId: user._id,
      status: 'active',
    }).sort({ createdAt: -1 });

    // Build plans list with free tier
    const plans = [
      {
        id: 'free',
        name: 'Gratuito',
        slug: 'free',
        monthlyPrice: 0,
        yearlyPrice: 0,
        monthlyCredits: 0,
        features: [
          '3 capítulos grátis por curso',
          'Acesso limitado para experimentar',
        ],
      },
      SUBSCRIPTION_PLANS.explorador,
      SUBSCRIPTION_PLANS.profissional,
      SUBSCRIPTION_PLANS.expert,
    ];

    return NextResponse.json({
      currentPlan: user.subscription?.plan || 'free',
      status: user.subscription?.status || 'active',
      expiresAt: user.subscription?.expiresAt,
      credits: user.credits || { balance: 0, monthlyAllocation: 0, totalSpent: 0, totalPurchased: 0 },
      subscription: activeSubscription
        ? {
            id: activeSubscription._id,
            planName: activeSubscription.planName,
            value: activeSubscription.value,
            cycle: activeSubscription.cycle,
            billingType: activeSubscription.billingType,
            nextDueDate: activeSubscription.nextDueDate,
            status: activeSubscription.status,
            creditCardLastFour: activeSubscription.creditCardLastFour,
            creditCardBrand: activeSubscription.creditCardBrand,
          }
        : null,
      plans,
    });
  } catch (error) {
    console.error('Subscription GET error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const decoded = await getAuthUser();
    if (!decoded) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { planId } = await request.json();

    if (!planId || !['starter', 'pro', 'business', 'explorador', 'profissional', 'expert'].includes(planId)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];

    // Return checkout info - actual payment handled by Asaas webhook
    return NextResponse.json({
      success: true,
      checkoutUrl: `/checkout/${planId}`,
      plan: {
        id: planId,
        name: selectedPlan.name,
        monthlyPrice: selectedPlan.monthlyPrice,
        yearlyPrice: selectedPlan.yearlyPrice,
      },
    });
  } catch (error) {
    console.error('Subscription POST error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
