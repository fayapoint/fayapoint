import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import User from '@/models/User';
import asaas, { asaasConfig } from '@/lib/asaas';

const JWT_SECRET = process.env.JWT_SECRET || 'fayapoint-secret';

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    await dbConnect();
    return await User.findById(decoded.id);
  } catch {
    return null;
  }
}

// =============================================================================
// GET - Get Single Subscription
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const subscription = await Subscription.findOne({
      _id: id,
      userId: user._id,
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

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { value, cycle, billingType, creditCardToken } = body;

    await dbConnect();

    const subscription = await Subscription.findOne({
      _id: id,
      userId: user._id,
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    // Build update data for Asaas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    
    if (value !== undefined) updateData.value = value;
    if (cycle) {
      updateData.cycle = cycle.toUpperCase();
    }
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
      if (value !== undefined) subscription.value = value;
      if (cycle) subscription.cycle = cycle;
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

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const subscription = await Subscription.findOne({
      _id: id,
      userId: user._id,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDoc = user as any;
    if (userDoc.subscription) {
      userDoc.subscription.plan = 'free';
      userDoc.subscription.status = 'cancelled';
    }
    await userDoc.save();

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
