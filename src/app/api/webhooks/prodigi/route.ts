import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FulfillmentOrder from '@/models/FulfillmentOrder';
import PODOrder from '@/models/PODOrder';
import User from '@/models/User';
import { sendFulfillmentEmail } from '@/lib/email-service';

// =============================================================================
// POST - Handle Prodigi Webhook
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, order } = body;
    
    console.log(`[Prodigi Webhook] Received event: ${event}`, {
      orderId: order?.id,
      merchantReference: order?.merchantReference,
    });
    
    await dbConnect();
    
    // Handle different event types
    switch (event) {
      case 'order.status.changed':
        await handleStatusChanged(order);
        break;
        
      case 'order.shipment.sent':
        await handleShipmentSent(order);
        break;
        
      case 'order.shipment.delivered':
        await handleShipmentDelivered(order);
        break;
        
      case 'order.cancelled':
        await handleOrderCancelled(order);
        break;
        
      default:
        console.log(`[Prodigi Webhook] Unhandled event: ${event}`);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('[Prodigi Webhook] Error:', error);
    return NextResponse.json(
      { received: true, error: 'Internal error' },
      { status: 200 }
    );
  }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleStatusChanged(order: any) {
  const { id: prodigiOrderId, merchantReference, status } = order;
  
  // Update fulfillment order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fulfillmentOrder = await FulfillmentOrder.findOne({
    $or: [
      { 'supplierOrders.providerOrderId': prodigiOrderId },
      { orderNumber: merchantReference },
    ],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
  
  if (fulfillmentOrder) {
    const supplierOrder = fulfillmentOrder.supplierOrders.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (so: any) => so.providerOrderId === prodigiOrderId || so.provider === 'prodigi'
    );
    
    if (supplierOrder) {
      supplierOrder.providerOrderId = prodigiOrderId;
      supplierOrder.providerStatus = status?.stage;
      supplierOrder.lastSyncAt = new Date();
    }
    
    // Map Prodigi status to internal status
    let internalStatus = fulfillmentOrder.status;
    const stage = status?.stage?.toLowerCase();
    
    switch (stage) {
      case 'inprogress':
      case 'in progress':
      case 'awaiting_assets':
        internalStatus = 'processing';
        break;
      case 'complete':
        // Check if shipped
        if (order.shipments?.length > 0) {
          internalStatus = 'shipped';
        }
        break;
      case 'cancelled':
        internalStatus = 'cancelled';
        break;
    }
    
    if (fulfillmentOrder.status !== internalStatus) {
      await fulfillmentOrder.updateStatus(internalStatus, `Status Prodigi: ${stage}`);
    }
    
    fulfillmentOrder.timeline.push({
      status: internalStatus,
      timestamp: new Date(),
      message: `Status atualizado: ${status?.stage || 'Unknown'}`,
      details: status?.issues || [],
      notified: false,
    });
    
    await fulfillmentOrder.save();
  }
  
  console.log(`[Prodigi Webhook] Status changed: ${prodigiOrderId} -> ${status?.stage}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleShipmentSent(order: any) {
  const { id: prodigiOrderId, merchantReference, shipments } = order;
  
  if (!shipments || shipments.length === 0) return;
  
  const shipment = shipments[0];
  
  // Update fulfillment order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fulfillmentOrder = await FulfillmentOrder.findOne({
    $or: [
      { 'supplierOrders.providerOrderId': prodigiOrderId },
      { orderNumber: merchantReference },
    ],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
  
  if (fulfillmentOrder) {
    fulfillmentOrder.status = 'shipped';
    
    // Update shipping info
    if (fulfillmentOrder.shipping) {
      fulfillmentOrder.shipping.carrier = shipment.carrier?.name || 'Prodigi';
      fulfillmentOrder.shipping.trackingNumber = shipment.tracking?.number;
      fulfillmentOrder.shipping.trackingUrl = shipment.tracking?.url;
    }
    
    const supplierOrder = fulfillmentOrder.supplierOrders.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (so: any) => so.providerOrderId === prodigiOrderId || so.provider === 'prodigi'
    );
    
    if (supplierOrder) {
      supplierOrder.providerStatus = 'shipped';
      supplierOrder.actualShipDate = new Date();
      supplierOrder.lastSyncAt = new Date();
    }
    
    fulfillmentOrder.timeline.push({
      status: 'shipped',
      timestamp: new Date(),
      message: `Pedido enviado via ${shipment.carrier?.name || 'transportadora'}`,
      details: {
        carrier: shipment.carrier?.name,
        trackingNumber: shipment.tracking?.number,
        trackingUrl: shipment.tracking?.url,
        dispatchDate: shipment.dispatchDate,
      },
      notified: true,
    });
    
    await fulfillmentOrder.save();
    
    // Send shipping notification email
    await sendFulfillmentEmail(
      fulfillmentOrder.userEmail,
      'order_shipped',
      {
        userName: fulfillmentOrder.userName,
        orderNumber: fulfillmentOrder.orderNumber,
        items: fulfillmentOrder.items,
        shipping: {
          carrier: shipment.carrier?.name || 'Prodigi',
          trackingNumber: shipment.tracking?.number || '',
          trackingUrl: shipment.tracking?.url,
        },
      }
    );
  }
  
  // Update POD order
  const podOrder = await PODOrder.findOne({ 
    $or: [
      { printifyOrderId: prodigiOrderId },
      { orderNumber: merchantReference },
    ],
  });
  
  if (podOrder) {
    podOrder.status = 'shipped';
    podOrder.shippedAt = new Date();
    podOrder.shipments.push({
      carrier: shipment.carrier?.name || 'Prodigi',
      trackingNumber: shipment.tracking?.number || '',
      trackingUrl: shipment.tracking?.url || '',
      shippedAt: new Date(),
      status: 'shipped',
    });
    await podOrder.save();
  }
  
  console.log(`[Prodigi Webhook] Shipment sent: ${prodigiOrderId}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleShipmentDelivered(order: any) {
  const { id: prodigiOrderId, merchantReference, shipments } = order;
  
  // Update fulfillment order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fulfillmentOrder = await FulfillmentOrder.findOne({
    $or: [
      { 'supplierOrders.providerOrderId': prodigiOrderId },
      { orderNumber: merchantReference },
    ],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
  
  if (fulfillmentOrder) {
    fulfillmentOrder.status = 'delivered';
    fulfillmentOrder.completedAt = new Date();
    
    if (fulfillmentOrder.shipping) {
      fulfillmentOrder.shipping.actualDelivery = new Date();
    }
    
    // Update all items to delivered
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fulfillmentOrder.items.forEach((item: any) => {
      item.status = 'delivered';
      item.deliveredAt = new Date();
    });
    
    fulfillmentOrder.timeline.push({
      status: 'delivered',
      timestamp: new Date(),
      message: 'Pedido entregue com sucesso!',
      notified: true,
    });
    
    await fulfillmentOrder.save();
    
    // Send delivery confirmation email
    await sendFulfillmentEmail(
      fulfillmentOrder.userEmail,
      'order_delivered',
      {
        userName: fulfillmentOrder.userName,
        orderNumber: fulfillmentOrder.orderNumber,
        items: fulfillmentOrder.items,
      }
    );
  }
  
  // Update POD order and finalize earnings
  const podOrder = await PODOrder.findOne({ 
    $or: [
      { printifyOrderId: prodigiOrderId },
      { orderNumber: merchantReference },
    ],
  });
  
  if (podOrder) {
    podOrder.status = 'delivered';
    podOrder.deliveredAt = new Date();
    await podOrder.save();
    
    // Finalize creator earnings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const creator = await User.findById(podOrder.creatorId) as any;
    if (creator?.podEarnings) {
      const commission = podOrder.totalCreatorCommission;
      creator.podEarnings.pendingEarnings = Math.max(0, creator.podEarnings.pendingEarnings - commission);
      creator.podEarnings.totalEarnings += commission;
      await creator.save();
      
      console.log(`[Prodigi Webhook] Creator earnings finalized: ${creator.email} +R$${commission.toFixed(2)}`);
    }
  }
  
  console.log(`[Prodigi Webhook] Shipment delivered: ${prodigiOrderId}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderCancelled(order: any) {
  const { id: prodigiOrderId, merchantReference, cancellation } = order;
  
  // Update fulfillment order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fulfillmentOrder = await FulfillmentOrder.findOne({
    $or: [
      { 'supplierOrders.providerOrderId': prodigiOrderId },
      { orderNumber: merchantReference },
    ],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
  
  if (fulfillmentOrder) {
    fulfillmentOrder.status = 'cancelled';
    fulfillmentOrder.cancelledAt = new Date();
    
    fulfillmentOrder.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      message: `Pedido cancelado: ${cancellation?.reason || 'Motivo não informado'}`,
      details: { cancellation },
      notified: false,
    });
    
    await fulfillmentOrder.save();
    
    // Send cancellation notification
    await sendFulfillmentEmail(
      fulfillmentOrder.userEmail,
      'order_failed',
      {
        userName: fulfillmentOrder.userName,
        orderNumber: fulfillmentOrder.orderNumber,
        items: fulfillmentOrder.items,
      }
    );
  }
  
  console.log(`[Prodigi Webhook] Order cancelled: ${prodigiOrderId}`);
}
