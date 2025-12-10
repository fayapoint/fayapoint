import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FulfillmentOrder from '@/models/FulfillmentOrder';
import PODOrder from '@/models/PODOrder';
import User from '@/models/User';
import { sendFulfillmentEmail } from '@/lib/email-service';
import crypto from 'crypto';

// Verify Printify webhook signature
function verifyPrintifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');
  
  return signature === expectedSignature;
}

// =============================================================================
// POST - Handle Printify Webhook
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-printify-signature') || '';
    const webhookSecret = process.env.PRINTIFY_WEBHOOK_SECRET || '';
    
    // Verify signature if secret is configured
    if (webhookSecret && signature) {
      if (!verifyPrintifySignature(rawBody, signature, webhookSecret)) {
        console.warn('[Printify Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    const body = JSON.parse(rawBody);
    const { type, resource } = body;
    
    console.log(`[Printify Webhook] Received event: ${type}`, {
      resourceType: resource?.type,
      resourceId: resource?.id,
    });
    
    await dbConnect();
    
    // Handle different event types
    switch (type) {
      case 'order:created':
        await handleOrderCreated(resource.data);
        break;
        
      case 'order:updated':
        await handleOrderUpdated(resource.data);
        break;
        
      case 'order:sent-to-production':
        await handleOrderInProduction(resource.data);
        break;
        
      case 'order:shipment:created':
        await handleShipmentCreated(resource.data);
        break;
        
      case 'order:shipment:delivered':
        await handleShipmentDelivered(resource.data);
        break;
        
      case 'product:deleted':
        console.log(`[Printify Webhook] Product deleted: ${resource.id}`);
        break;
        
      case 'product:publish:started':
        console.log(`[Printify Webhook] Product publish started: ${resource.id}`);
        break;
        
      default:
        console.log(`[Printify Webhook] Unhandled event: ${type}`);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('[Printify Webhook] Error:', error);
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
async function handleOrderCreated(data: any) {
  const { id: printifyOrderId, external_id: orderNumber, status } = data;
  
  // Update fulfillment order
  const fulfillmentOrder = await FulfillmentOrder.findOne({
    'supplierOrders.providerOrderId': printifyOrderId,
  });
  
  if (fulfillmentOrder) {
    const supplierOrder = fulfillmentOrder.supplierOrders.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (so: any) => so.providerOrderId === printifyOrderId
    );
    
    if (supplierOrder) {
      supplierOrder.providerStatus = status;
      supplierOrder.confirmedAt = new Date();
      supplierOrder.lastSyncAt = new Date();
    }
    
    fulfillmentOrder.timeline.push({
      status: 'processing',
      timestamp: new Date(),
      message: 'Pedido confirmado pelo fornecedor Printify',
      notified: false,
    });
    
    await fulfillmentOrder.save();
  }
  
  console.log(`[Printify Webhook] Order created: ${printifyOrderId} (${orderNumber})`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderUpdated(data: any) {
  const { id: printifyOrderId, status, line_items } = data;
  
  // Update fulfillment order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fulfillmentOrder = await FulfillmentOrder.findOne({
    'supplierOrders.providerOrderId': printifyOrderId,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
  
  if (fulfillmentOrder) {
    const supplierOrder = fulfillmentOrder.supplierOrders.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (so: any) => so.providerOrderId === printifyOrderId
    );
    
    if (supplierOrder) {
      supplierOrder.providerStatus = status;
      supplierOrder.lastSyncAt = new Date();
    }
    
    // Map Printify status to internal status
    let internalStatus = fulfillmentOrder.status;
    switch (status) {
      case 'pending':
      case 'on-hold':
        internalStatus = 'processing';
        break;
      case 'in-production':
        internalStatus = 'in_production';
        break;
      case 'fulfilled':
      case 'shipped':
        internalStatus = 'shipped';
        break;
      case 'canceled':
        internalStatus = 'cancelled';
        break;
    }
    
    if (fulfillmentOrder.status !== internalStatus) {
      await fulfillmentOrder.updateStatus(internalStatus, `Status atualizado: ${status}`);
    }
    
    await fulfillmentOrder.save();
  }
  
  // Update POD order
  const podOrder = await PODOrder.findOne({ printifyOrderId });
  if (podOrder) {
    podOrder.status = status === 'in-production' ? 'in_production' : 
                      status === 'fulfilled' ? 'shipped' :
                      status === 'canceled' ? 'cancelled' : podOrder.status;
    
    // Update line items status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    line_items?.forEach((li: any) => {
      const item = podOrder.items.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (i: any) => i.printifyProductId === li.product_id
      );
      if (item) {
        item.printifyStatus = li.status;
        if (li.sent_to_production_at) {
          item.sentToProductionAt = new Date(li.sent_to_production_at);
        }
      }
    });
    
    await podOrder.save();
  }
  
  console.log(`[Printify Webhook] Order updated: ${printifyOrderId} -> ${status}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderInProduction(data: any) {
  const { id: printifyOrderId, sent_to_production_at } = data;
  
  // Update fulfillment order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fulfillmentOrder = await FulfillmentOrder.findOne({
    'supplierOrders.providerOrderId': printifyOrderId,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
  
  if (fulfillmentOrder) {
    fulfillmentOrder.status = 'in_production';
    
    const supplierOrder = fulfillmentOrder.supplierOrders.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (so: any) => so.providerOrderId === printifyOrderId
    );
    
    if (supplierOrder) {
      supplierOrder.providerStatus = 'in-production';
      supplierOrder.lastSyncAt = new Date();
    }
    
    fulfillmentOrder.timeline.push({
      status: 'in_production',
      timestamp: new Date(),
      message: 'Pedido em produção',
      notified: false,
    });
    
    await fulfillmentOrder.save();
  }
  
  // Update POD order
  const podOrder = await PODOrder.findOne({ printifyOrderId });
  if (podOrder) {
    podOrder.status = 'in_production';
    podOrder.sentToProductionAt = sent_to_production_at ? 
      new Date(sent_to_production_at) : new Date();
    await podOrder.save();
  }
  
  console.log(`[Printify Webhook] Order in production: ${printifyOrderId}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleShipmentCreated(data: any) {
  const { 
    id: printifyOrderId, 
    shipments,
    address_to 
  } = data;
  
  if (!shipments || shipments.length === 0) return;
  
  const shipment = shipments[0]; // Usually one shipment per order
  
  // Update fulfillment order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fulfillmentOrder = await FulfillmentOrder.findOne({
    'supplierOrders.providerOrderId': printifyOrderId,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
  
  if (fulfillmentOrder) {
    fulfillmentOrder.status = 'shipped';
    
    // Update shipping info
    if (fulfillmentOrder.shipping) {
      fulfillmentOrder.shipping.carrier = shipment.carrier;
      fulfillmentOrder.shipping.trackingNumber = shipment.number;
      fulfillmentOrder.shipping.trackingUrl = shipment.url;
    }
    
    const supplierOrder = fulfillmentOrder.supplierOrders.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (so: any) => so.providerOrderId === printifyOrderId
    );
    
    if (supplierOrder) {
      supplierOrder.providerStatus = 'shipped';
      supplierOrder.actualShipDate = new Date();
      supplierOrder.lastSyncAt = new Date();
    }
    
    fulfillmentOrder.timeline.push({
      status: 'shipped',
      timestamp: new Date(),
      message: `Pedido enviado via ${shipment.carrier}`,
      details: {
        carrier: shipment.carrier,
        trackingNumber: shipment.number,
        trackingUrl: shipment.url,
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
          carrier: shipment.carrier,
          trackingNumber: shipment.number,
          trackingUrl: shipment.url,
        },
      }
    );
  }
  
  // Update POD order
  const podOrder = await PODOrder.findOne({ printifyOrderId });
  if (podOrder) {
    podOrder.status = 'shipped';
    podOrder.shippedAt = new Date();
    podOrder.shipments.push({
      carrier: shipment.carrier,
      trackingNumber: shipment.number,
      trackingUrl: shipment.url,
      shippedAt: new Date(),
      status: 'shipped',
    });
    await podOrder.save();
  }
  
  console.log(`[Printify Webhook] Shipment created: ${printifyOrderId} via ${shipment.carrier}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleShipmentDelivered(data: any) {
  const { id: printifyOrderId, shipments } = data;
  
  if (!shipments || shipments.length === 0) return;
  
  const shipment = shipments[0];
  
  // Update fulfillment order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fulfillmentOrder = await FulfillmentOrder.findOne({
    'supplierOrders.providerOrderId': printifyOrderId,
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
  const podOrder = await PODOrder.findOne({ printifyOrderId });
  if (podOrder) {
    podOrder.status = 'delivered';
    podOrder.deliveredAt = new Date();
    
    // Update shipment
    const existingShipment = podOrder.shipments.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => s.trackingNumber === shipment.number
    );
    if (existingShipment) {
      existingShipment.status = 'delivered';
      existingShipment.deliveredAt = new Date();
    }
    
    await podOrder.save();
    
    // Finalize creator earnings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const creator = await User.findById(podOrder.creatorId) as any;
    if (creator?.podEarnings) {
      const commission = podOrder.totalCreatorCommission;
      creator.podEarnings.pendingEarnings = Math.max(0, creator.podEarnings.pendingEarnings - commission);
      creator.podEarnings.totalEarnings += commission;
      await creator.save();
      
      console.log(`[Printify Webhook] Creator earnings finalized: ${creator.email} +R$${commission.toFixed(2)}`);
    }
  }
  
  console.log(`[Printify Webhook] Shipment delivered: ${printifyOrderId}`);
}
