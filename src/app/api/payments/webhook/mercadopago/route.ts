import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import {
  getMPPayment,
  mapMPStatusToPaymentStatus,
  mapMPMethodToPaymentMethod,
} from '@/lib/mercadopago';
import { processFulfillment } from '@/lib/fulfillment';

export const runtime = 'nodejs';

// =============================================================================
// POST - Handle Mercado Pago Webhook (IPN)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[MP Webhook] Received:', {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
    });

    // Mercado Pago sends different notification types
    // We only care about payment notifications
    if (body.type !== 'payment' || !body.data?.id) {
      return NextResponse.json({ received: true });
    }

    const mpPaymentId = Number(body.data.id);

    // Fetch full payment details from Mercado Pago API
    const mpPayment = await getMPPayment(mpPaymentId);

    if (!mpPayment) {
      console.warn(`[MP Webhook] Could not fetch payment: ${mpPaymentId}`);
      return NextResponse.json({ received: true, warning: 'Payment not found in MP' });
    }

    await dbConnect();

    // Find our payment by external_reference (order number) or provider ID
    let payment = await Payment.findOne({
      $or: [
        { provider: 'mercadopago', providerPaymentId: String(mpPaymentId) },
        { orderNumber: mpPayment.external_reference },
      ],
    });

    if (!payment) {
      console.warn(`[MP Webhook] Payment not found in DB for MP ID: ${mpPaymentId}, ref: ${mpPayment.external_reference}`);
      return NextResponse.json({ received: true, warning: 'Payment not found in database' });
    }

    const previousStatus = payment.status;
    const newStatus = mapMPStatusToPaymentStatus(mpPayment.status || '');
    const receivedAmount = Number(mpPayment.transaction_amount);

    // The notification is verified against Mercado Pago's API, but fulfillment
    // still requires the paid amount to match our server-side order snapshot.
    if (newStatus === 'paid' &&
        (!Number.isFinite(receivedAmount) || Math.abs(receivedAmount - payment.total) >= 0.01)) {
      payment.status = 'failed';
      payment.notes = `Valor divergente no Mercado Pago: recebido=${receivedAmount}, esperado=${payment.total}`;
      payment.webhookEvents.push({
        event: 'MP_AMOUNT_MISMATCH',
        receivedAt: new Date(),
        data: { receivedAmount, expectedAmount: payment.total },
      });
      await payment.save();
      console.error(`[MP Webhook] Amount mismatch for ${payment.orderNumber}`);
      return NextResponse.json({ received: true, error: 'Amount mismatch' });
    }

    // Update payment record
    payment.status = newStatus;
    payment.providerPaymentId = String(mpPaymentId);
    payment.method = mapMPMethodToPaymentMethod(mpPayment.payment_method_id || '');

    // Add webhook event
    payment.webhookEvents.push({
      event: `MP_${body.action || mpPayment.status}`,
      receivedAt: new Date(),
      data: {
        mpStatus: mpPayment.status,
        mpStatusDetail: mpPayment.status_detail,
        value: mpPayment.transaction_amount,
        netValue: mpPayment.transaction_details?.net_received_amount,
      },
    });

    // Handle payment confirmed/approved
    if (newStatus === 'paid' && previousStatus !== 'paid') {
      payment.paidAt = mpPayment.date_approved
        ? new Date(mpPayment.date_approved)
        : new Date();

      // Grant user access
      await grantUserAccess(payment);

      // Trigger fulfillment
      try {
        const result = await processFulfillment(payment._id.toString());
        payment.webhookEvents.push({
          event: 'FULFILLMENT_TRIGGERED',
          receivedAt: new Date(),
          data: {
            fulfillmentOrderId: result.fulfillmentOrderId,
            status: result.status,
            success: result.success,
          },
        });
      } catch (err) {
        console.error(`[MP Webhook] Fulfillment error for ${payment.orderNumber}:`, err);
        payment.webhookEvents.push({
          event: 'FULFILLMENT_ERROR',
          receivedAt: new Date(),
          data: { error: err instanceof Error ? err.message : 'Unknown error' },
        });
      }
    }

    // Handle refund
    if (newStatus === 'refunded') {
      payment.refundedAt = new Date();
      if (mpPayment.transaction_amount_refunded) {
        payment.refundAmount = mpPayment.transaction_amount_refunded;
      }
      await revokeUserAccess(payment);
    }

    // Handle cancellation
    if (newStatus === 'cancelled') {
      payment.cancelledAt = new Date();
    }

    // Update PIX data if available
    if (mpPayment.point_of_interaction?.transaction_data) {
      const txData = mpPayment.point_of_interaction.transaction_data;
      if (txData.qr_code_base64) {
        payment.pixData = {
          qrCodeBase64: txData.qr_code_base64,
          qrCodePayload: txData.qr_code || undefined,
          expirationDate: mpPayment.date_of_expiration
            ? new Date(mpPayment.date_of_expiration)
            : undefined,
        };
      }
    }

    await payment.save();

    console.log(`[MP Webhook] Payment ${payment.orderNumber} updated: ${previousStatus} -> ${payment.status}`);

    return NextResponse.json({
      received: true,
      orderNumber: payment.orderNumber,
      previousStatus,
      newStatus: payment.status,
    });
  } catch (error) {
    console.error('[MP Webhook] Error:', error);
    return NextResponse.json({ received: true, error: 'Internal error' }, { status: 200 });
  }
}

// =============================================================================
// HELPERS (mirrors asaas webhook pattern)
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function grantUserAccess(payment: any) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await User.findById(payment.userId) as any;
    if (!user) return;

    for (const item of payment.items) {
      switch (item.type) {
        case 'course':
          if (!user.enrolledCourses) user.enrolledCourses = [];
          const enrolled = user.enrolledCourses.some(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) => c.courseSlug === item.productSlug
          );
          if (!enrolled) {
            user.enrolledCourses.push({
              courseId: item.productId,
              courseSlug: item.productSlug,
              enrolledAt: new Date(),
              isActive: true,
              source: 'purchase',
            });
          }
          break;
        case 'subscription': {
          const planMap: Record<string, string> = { starter: 'explorador', pro: 'profissional', business: 'expert', explorador: 'explorador', profissional: 'profissional', expert: 'expert' };
          const plan = planMap[item.productSlug?.toLowerCase() || ''];
          if (plan) {
            const isYearly = item.productId?.endsWith(':yearly');
            if (!user.subscription) user.subscription = {};
            user.subscription.plan = plan;
            user.subscription.status = 'active';
            user.subscription.pendingPlan = undefined;
            user.subscription.expiresAt = new Date(
              Date.now() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000
            );
          }
          break;
        }
      }
    }

    user.xp = (user.xp || 0) + Math.floor(payment.total / 10);
    await user.save();
    console.log(`[MP Webhook] User ${user.email} granted access`);
  } catch (err) {
    console.error('[MP Webhook] Error granting access:', err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function revokeUserAccess(payment: any) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await User.findById(payment.userId) as any;
    if (!user) return;

    for (const item of payment.items) {
      if (item.type === 'course' && user.enrolledCourses) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user.enrolledCourses = user.enrolledCourses.filter((c: any) => c.courseSlug !== item.productSlug);
      }
      if (item.type === 'subscription') {
        if (!user.subscription) user.subscription = {};
        user.subscription.plan = 'free';
        user.subscription.status = 'cancelled';
        user.subscription.expiresAt = null;
      }
    }

    user.xp = Math.max(0, (user.xp || 0) - Math.floor(payment.total / 10));
    await user.save();
  } catch (err) {
    console.error('[MP Webhook] Error revoking access:', err);
  }
}

// =============================================================================
// GET - Health check
// =============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'active',
    provider: 'mercadopago',
    timestamp: new Date().toISOString(),
    supportedEvents: ['payment'],
  });
}
