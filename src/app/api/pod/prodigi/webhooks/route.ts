/**
 * Prodigi Webhooks Handler
 * Receives callbacks from Prodigi when order status changes
 * 
 * Prodigi uses CloudEvents format for callbacks:
 * - com.prodigi.order.status.stage.changed#InProgress
 * - com.prodigi.order.status.stage.changed#Complete
 * - com.prodigi.order.status.stage.changed#Cancelled
 * - com.prodigi.order.shipment.created
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProdigiOrder, { mapProdigiStatusToInternal } from '@/models/ProdigiOrder';
import User from '@/models/User';
import { parseCallbackType, ProdigiCallbackEvent } from '@/lib/prodigi-api';

// POST - Handle Prodigi callback
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const event: ProdigiCallbackEvent = await request.json();

    console.log('[Prodigi Webhook] Received event:', {
      type: event.type,
      subject: event.subject,
      time: event.time,
    });

    // Parse event type
    const { object, path, newValue } = parseCallbackType(event.type);

    // Only handle order events
    if (object !== 'order') {
      console.log('[Prodigi Webhook] Ignoring non-order event:', object);
      return NextResponse.json({ received: true, handled: false });
    }

    const prodigiOrderId = event.subject;
    const orderData = event.data?.order;

    if (!prodigiOrderId || !orderData) {
      console.error('[Prodigi Webhook] Missing order data');
      return NextResponse.json({ error: 'Missing order data' }, { status: 400 });
    }

    // Find our order
    const order = await ProdigiOrder.findOne({ prodigiOrderId });

    if (!order) {
      console.error('[Prodigi Webhook] Order not found:', prodigiOrderId);
      // Return 200 anyway to prevent Prodigi from retrying
      return NextResponse.json({ received: true, orderNotFound: true });
    }

    console.log('[Prodigi Webhook] Processing order:', order.orderNumber);

    // Update order status
    const previousStatus = order.status;
    order.prodigiStatus = orderData.status;
    order.status = mapProdigiStatusToInternal(
      orderData.status.stage,
      orderData.status.details
    );
    order.lastCallbackReceived = new Date();

    // Handle specific status changes
    if (path.includes('stage') && newValue) {
      switch (newValue) {
        case 'InProgress':
          // Order is being processed
          if (!order.sentToProductionAt && orderData.status.details.inProduction !== 'NotStarted') {
            order.sentToProductionAt = new Date();
          }
          break;

        case 'Complete':
          // Order completed (all items shipped)
          order.deliveredAt = new Date();
          
          // Update creator earnings
          if (order.creatorId) {
            await updateCreatorEarnings(order.creatorId.toString(), order.totalCreatorCommission);
          }
          break;

        case 'Cancelled':
          order.cancelledAt = new Date();
          break;
      }
    }

    // Handle shipment updates
    if (orderData.shipments && orderData.shipments.length > 0) {
      order.shipments = orderData.shipments.map(s => ({
        prodigiShipmentId: s.id,
        status: s.status,
        carrier: s.carrier,
        trackingNumber: s.tracking?.number,
        trackingUrl: s.tracking?.url,
        dispatchDate: s.dispatchDate ? new Date(s.dispatchDate) : undefined,
        fulfillmentLocation: s.fulfillmentLocation,
        items: s.items.map(i => i.itemId),
      }));

      // Check if any shipment is shipped
      const hasShipped = orderData.shipments.some(s => s.status === 'Shipped');
      if (hasShipped && !order.shippedAt) {
        order.shippedAt = new Date();
        order.status = 'shipped';
      }
    }

    // Handle charges updates
    if (orderData.charges && orderData.charges.length > 0) {
      order.charges = orderData.charges.map(c => ({
        prodigiChargeId: c.id,
        chargeType: c.chargeType,
        invoiceNumber: c.prodigiInvoiceNumber,
        amount: parseFloat(c.totalCost.amount),
        currency: c.totalCost.currency,
      }));

      // Calculate total cost from charges
      let subtotalGBP = 0;
      let shippingGBP = 0;
      orderData.charges.forEach(charge => {
        if (charge.chargeType === 'Item') {
          subtotalGBP += parseFloat(charge.totalCost.amount);
        } else if (charge.chargeType === 'Shipping') {
          shippingGBP += parseFloat(charge.totalCost.amount);
        }
      });

      if (subtotalGBP > 0) {
        order.subtotalGBP = subtotalGBP;
        order.shippingGBP = shippingGBP;
        order.totalCostGBP = subtotalGBP + shippingGBP;
      }
    }

    // Update item statuses
    if (orderData.items) {
      orderData.items.forEach(prodigiItem => {
        const orderItem = order.items.find(
          i => i.prodigiItemId === prodigiItem.id || i.sku === prodigiItem.sku
        );
        if (orderItem) {
          orderItem.prodigiItemId = prodigiItem.id;
          // Map Prodigi item status to our status
          const statusMap: Record<string, 'complete' | 'inProgress' | 'error' | 'NotYetDownloaded'> = {
            'Ok': 'complete',
            'Invalid': 'error',
            'NotYetDownloaded': 'NotYetDownloaded',
          };
          orderItem.assetStatus = statusMap[prodigiItem.status] || 'inProgress';
        }
      });
    }

    await order.save();

    console.log('[Prodigi Webhook] Order updated:', {
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus: order.status,
      stage: orderData.status.stage,
    });

    // Return success
    return NextResponse.json({
      received: true,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus: order.status,
      processed: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Prodigi Webhook] Error:', error);
    // Return 200 to prevent Prodigi from retrying on our errors
    return NextResponse.json({
      received: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// GET - Health check / webhook verification
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'prodigi-webhooks',
    timestamp: new Date().toISOString(),
  });
}

// Helper to update creator earnings
async function updateCreatorEarnings(creatorId: string, commission: number) {
  try {
    await User.updateOne(
      { _id: creatorId },
      {
        $inc: {
          'podEarnings.totalEarnings': commission,
          'podEarnings.pendingEarnings': commission, // Will be moved to available after payout
          'podEarnings.totalSales': commission,
          'podEarnings.totalOrders': 1,
        },
      }
    );
    console.log('[Prodigi Webhook] Updated creator earnings:', { creatorId, commission });
  } catch (error) {
    console.error('[Prodigi Webhook] Error updating creator earnings:', error);
  }
}
