import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Subscription, { SUBSCRIPTION_PLANS } from '@/models/Subscription';
import User from '@/models/User';
import asaas, { asaasConfig } from '@/lib/asaas';

// =============================================================================
// GET - Get Single Subscription
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const subscription = await Subscription.findOne({
      _id: id,
      userId: authUser.id,
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    // Fetch latest data from Asaas
    let asaasData = null;
    let payments = null;
    
    try {
      asaasData = await asaas.getSubscription(subscription.asaasSubscriptionId);
      payments = await asaas.getSubscriptionPayments(subscription.asaasSubscriptionId);
    } catch {
      // Ignore Asaas errors
    }

    return NextResponse.json({
      subscription,
      asaasData,
      payments: payments?.data || [],
    });

  } catch (error) {
    console.error('[Subscription] GET Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT - Update Subscription (change plan, payment method, etc.)
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!asaasConfig.isConfigured) {
      return NextResponse.json(
        { error: 'Gateway de pagamento não configurado' },
        { status: 503 }
      );
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { cycle, billingType, creditCardToken } = body;

    await dbConnect();

    const subscription = await Subscription.findOne({
      _id: id,
      userId: authUser.id,
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    const nextCycle = cycle ?? subscription.cycle;
    if (nextCycle !== 'monthly' && nextCycle !== 'yearly') {
      return NextResponse.json({ error: 'Ciclo do plano inválido' }, { status: 400 });
    }

    if (billingType && !['pix', 'boleto', 'credit_card'].includes(billingType)) {
      return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 });
    }

    const plan = SUBSCRIPTION_PLANS[
      subscription.planSlug as keyof typeof SUBSCRIPTION_PLANS
    ];
    if (!plan) {
      return NextResponse.json(
        { error: 'Plano da assinatura não encontrado' },
        { status: 409 }
      );
    }

    // Recalculate on every update. A client can choose a supported cycle or
    // payment method, but can never choose the amount charged.
    const canonicalValue = nextCycle === 'yearly'
      ? plan.yearlyPrice
      : plan.monthlyPrice;

    // Build update data for Asaas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      value: canonicalValue,
      cycle: nextCycle.toUpperCase(),
    };

    if (billingType) {
      updateData.billingType = billingType.toUpperCase();
    }
    if (creditCardToken) {
      updateData.creditCardToken = creditCardToken;
    }

    // Update in Asaas
    try {
      const asaasResult = await asaas.updateSubscription(
        subscription.asaasSubscriptionId,
        updateData
      );

      // Update local record
      subscription.value = canonicalValue;
      subscription.cycle = nextCycle;
      if (billingType) subscription.billingType = billingType;
      if (creditCardToken) subscription.creditCardToken = creditCardToken;
      if (asaasResult.nextDueDate) {
        subscription.nextDueDate = new Date(asaasResult.nextDueDate);
      }

      subscription.webhookEvents.push({
        event: 'SUBSCRIPTION_UPDATED_BY_USER',
        receivedAt: new Date(),
        data: updateData,
      });

      await subscription.save();

      return NextResponse.json({
        success: true,
        subscription,
        asaasData: asaasResult,
      });

    } catch (error) {
      console.error('[Subscription] Update error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao atualizar assinatura' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Subscription] PUT Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Cancel Subscription
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!asaasConfig.isConfigured) {
      return NextResponse.json(
        { error: 'Gateway de pagamento não configurado' },
        { status: 503 }
      );
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const subscription = await Subscription.findOne({
      _id: id,
      userId: authUser.id,
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json({ error: 'Assinatura já cancelada' }, { status: 400 });
    }

    // Cancel in Asaas
    try {
      await asaas.cancelSubscription(subscription.asaasSubscriptionId);
    } catch (error) {
      console.error('[Subscription] Cancel error in Asaas:', error);
      // Continue with local cancellation even if Asaas fails
    }

    // Update local record
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.webhookEvents.push({
      event: 'SUBSCRIPTION_CANCELLED_BY_USER',
      receivedAt: new Date(),
    });

    await subscription.save();

    // Downgrade user plan to free
    const userDoc = await User.findById(authUser.id);
    if (userDoc) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userAny = userDoc as any;
      if (userAny.subscription) {
        userAny.subscription.plan = 'free';
        userAny.subscription.status = 'cancelled';
      }
      await userAny.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
      subscription,
    });

  } catch (error) {
    console.error('[Subscription] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
