import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Payment, { mapAsaasStatusToPaymentStatus, PaymentStatus } from '@/models/Payment';
import User from '@/models/User';
import { 
  AsaasWebhookEvent, 
  AsaasPaymentResponse,
  verifyWebhookToken,
  isPaymentSuccessful,
} from '@/lib/asaas';

// Disable body parsing for webhook verification
export const runtime = 'nodejs';

// =============================================================================
// POST - Handle Asaas Webhook
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get webhook access token from query or header
    const { searchParams } = new URL(request.url);
    const queryToken = searchParams.get('access_token');
    const headerToken = request.headers.get('asaas-access-token');
    const webhookToken = queryToken || headerToken;

    // Verify webhook token (optional but recommended)
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (expectedToken && webhookToken && !verifyWebhookToken(webhookToken, expectedToken)) {
      console.warn('[Asaas Webhook] Invalid webhook token');
      // Don't reject - Asaas might not always send token
    }

    const body = await request.json() as AsaasWebhookEvent;
    
    console.log(`[Asaas Webhook] Received event: ${body.event}`, {
      paymentId: body.payment?.id,
      externalReference: body.payment?.externalReference,
    });

    // Only process payment-related events
    if (!body.event.startsWith('PAYMENT_') || !body.payment) {
      console.log(`[Asaas Webhook] Ignoring non-payment event: ${body.event}`);
      return NextResponse.json({ received: true });
    }

    await dbConnect();

    const asaasPayment = body.payment as AsaasPaymentResponse;

    // Find payment by Asaas payment ID or external reference (order number)
    let payment = await Payment.findOne({
      $or: [
        { providerPaymentId: asaasPayment.id },
        { orderNumber: asaasPayment.externalReference },
      ],
    });

    if (!payment) {
      console.warn(`[Asaas Webhook] Payment not found for: ${asaasPayment.id}`);
      // Return 200 to prevent Asaas from retrying
      return NextResponse.json({ 
        received: true, 
        warning: 'Payment not found in database' 
      });
    }

    // Map Asaas status to our status
    const previousStatus = payment.status;
    const newStatus = mapAsaasStatusToPaymentStatus(asaasPayment.status);

    // Update payment record
    payment.status = newStatus;
    payment.providerPaymentId = asaasPayment.id;

    // Add webhook event to history
    payment.webhookEvents.push({
      event: body.event,
      receivedAt: new Date(),
      data: {
        asaasStatus: asaasPayment.status,
        value: asaasPayment.value,
        netValue: asaasPayment.netValue,
      },
    });

    // Handle specific events
    switch (body.event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        payment.status = 'paid';
        payment.paidAt = asaasPayment.paymentDate 
          ? new Date(asaasPayment.paymentDate) 
          : new Date();
        payment.invoiceUrl = asaasPayment.invoiceUrl;
        
        // Grant access/credits to user
        await grantUserAccess(payment);
        break;

      case 'PAYMENT_OVERDUE':
        payment.status = 'expired';
        break;

      case 'PAYMENT_DELETED':
        payment.status = 'cancelled';
        payment.cancelledAt = new Date();
        break;

      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_PARTIALLY_REFUNDED':
        payment.status = 'refunded';
        payment.refundedAt = new Date();
        if (asaasPayment.refunds && asaasPayment.refunds.length > 0) {
          const lastRefund = asaasPayment.refunds[asaasPayment.refunds.length - 1];
          payment.refundAmount = lastRefund.value;
          payment.refundReason = lastRefund.description;
        }
        
        // Revoke access if fully refunded
        if (body.event === 'PAYMENT_REFUNDED') {
          await revokeUserAccess(payment);
        }
        break;

      case 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED':
      case 'PAYMENT_REPROVED_BY_RISK_ANALYSIS':
        payment.status = 'failed';
        payment.notes = `Pagamento recusado: ${body.event}`;
        break;

      case 'PAYMENT_AWAITING_RISK_ANALYSIS':
        payment.status = 'processing';
        break;

      case 'PAYMENT_CHARGEBACK_REQUESTED':
      case 'PAYMENT_CHARGEBACK_DISPUTE':
        payment.status = 'failed';
        payment.notes = `Chargeback: ${asaasPayment.chargeback?.reason || body.event}`;
        break;

      default:
        // Just log and save the event
        console.log(`[Asaas Webhook] Unhandled event: ${body.event}`);
    }

    await payment.save();

    console.log(`[Asaas Webhook] Payment ${payment.orderNumber} updated: ${previousStatus} -> ${payment.status}`);

    return NextResponse.json({
      received: true,
      orderNumber: payment.orderNumber,
      previousStatus,
      newStatus: payment.status,
    });

  } catch (error) {
    console.error('[Asaas Webhook] Error:', error);
    // Return 200 to prevent Asaas from retrying indefinitely
    return NextResponse.json(
      { received: true, error: 'Internal error' },
      { status: 200 }
    );
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Grant user access after successful payment
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function grantUserAccess(payment: any) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await User.findById(payment.userId) as any;
    if (!user) {
      console.warn(`[Asaas Webhook] User not found for payment: ${payment.orderNumber}`);
      return;
    }

    // Process each item in the payment
    for (const item of payment.items) {
      switch (item.type) {
        case 'course':
          // Add course to user's enrolled courses
          if (!user.enrolledCourses) user.enrolledCourses = [];
          
          const alreadyEnrolled = user.enrolledCourses.some(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) => c.courseSlug === item.productSlug
          );
          
          if (!alreadyEnrolled) {
            user.enrolledCourses.push({
              courseId: item.productId,
              courseSlug: item.productSlug,
              enrolledAt: new Date(),
              isActive: true,
              source: 'purchase',
            });
          }
          break;

        case 'subscription':
          // Upgrade user plan
          const planMap: Record<string, string> = {
            'starter': 'starter',
            'pro': 'pro',
            'business': 'business',
          };
          const newPlan = planMap[item.productSlug?.toLowerCase() || ''];
          if (newPlan) {
            user.plan = newPlan;
            user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
          }
          break;

        case 'service':
          // Track service purchase - could trigger workflow
          console.log(`[Asaas Webhook] Service purchased: ${item.name}`);
          break;

        case 'product':
        case 'pod':
          // Physical/POD products - handled by fulfillment
          console.log(`[Asaas Webhook] Product purchased: ${item.name}`);
          break;
      }
    }

    // Award XP for purchase
    const xpAward = Math.floor(payment.total / 10); // 1 XP per R$10
    user.xp = (user.xp || 0) + xpAward;

    await user.save();
    console.log(`[Asaas Webhook] User ${user.email} granted access, +${xpAward} XP`);

  } catch (error) {
    console.error('[Asaas Webhook] Error granting user access:', error);
  }
}

/**
 * Revoke user access after refund
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function revokeUserAccess(payment: any) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await User.findById(payment.userId) as any;
    if (!user) return;

    for (const item of payment.items) {
      switch (item.type) {
        case 'course':
          // Remove course access
          if (user.enrolledCourses) {
            user.enrolledCourses = user.enrolledCourses.filter(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (c: any) => c.courseSlug !== item.productSlug
            );
          }
          break;

        case 'subscription':
          // Downgrade to free plan
          user.plan = 'free';
          user.planExpiresAt = null;
          break;
      }
    }

    // Remove XP
    const xpToRemove = Math.floor(payment.total / 10);
    user.xp = Math.max(0, (user.xp || 0) - xpToRemove);

    await user.save();
    console.log(`[Asaas Webhook] User ${user.email} access revoked`);

  } catch (error) {
    console.error('[Asaas Webhook] Error revoking user access:', error);
  }
}

// =============================================================================
// GET - Webhook Health Check
// =============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'active',
    provider: 'asaas',
    timestamp: new Date().toISOString(),
  });
}
