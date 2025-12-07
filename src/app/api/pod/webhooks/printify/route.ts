/**
 * Printify Webhook Handler
 * Receives events from Printify:
 * - order:created - New order placed
 * - order:updated - Order status changed
 * - order:sent-to-production - Order being printed
 * - order:shipment:created - Order shipped with tracking
 * - order:shipment:delivered - Order delivered
 * - product:deleted - Product removed
 * - product:publish:started - Product publishing started
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import PODOrder, { generateOrderNumber, calculateCommissionSplit } from '@/models/PODOrder';
import UserPODProduct from '@/models/UserPODProduct';
import StoreProduct from '@/models/StoreProduct';
import User from '@/models/User';

// Webhook secret for verification (should be set in Printify dashboard)
const WEBHOOK_SECRET = process.env.PRINTIFY_WEBHOOK_SECRET || '';

// Verify webhook signature
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('[Webhook] No PRINTIFY_WEBHOOK_SECRET set, skipping verification');
    return true; // Skip verification if no secret configured
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// POST - Handle Printify webhooks
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-printify-signature') || '';

    // Verify signature
    if (WEBHOOK_SECRET && !verifyWebhookSignature(payload, signature)) {
      console.error('[Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    await dbConnect();

    const event = JSON.parse(payload);
    const { type, resource } = event;

    console.log('[Webhook] Received event:', type, 'Resource ID:', resource?.id);

    switch (type) {
      case 'order:created':
        await handleOrderCreated(event);
        break;

      case 'order:updated':
        await handleOrderUpdated(event);
        break;

      case 'order:sent-to-production':
        await handleOrderSentToProduction(event);
        break;

      case 'order:shipment:created':
        await handleShipmentCreated(event);
        break;

      case 'order:shipment:delivered':
        await handleShipmentDelivered(event);
        break;

      case 'product:deleted':
        await handleProductDeleted(event);
        break;

      case 'product:publish:started':
        await handleProductPublishStarted(event);
        break;

      default:
        console.log('[Webhook] Unhandled event type:', type);
    }

    return NextResponse.json({ success: true, received: type });

  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle order created event
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderCreated(event: any) {
  const { resource } = event;
  const printifyOrderId = resource.id;
  const shopId = resource.data?.shop_id;

  console.log('[Webhook] Order created:', printifyOrderId);

  // Check if we already have this order
  const existingOrder = await PODOrder.findOne({ printifyOrderId });
  if (existingOrder) {
    console.log('[Webhook] Order already exists, skipping');
    return;
  }

  // Get order details from the webhook data
  const orderData = resource.data;
  if (!orderData) {
    console.log('[Webhook] No order data in webhook');
    return;
  }

  // Find the POD product and creator for each line item
  for (const lineItem of orderData.line_items || []) {
    const printifyProductId = lineItem.product_id;
    
    // Find store product with this Printify product ID
    const storeProduct = await StoreProduct.findOne({
      'podInfo.printifyProductId': printifyProductId,
    });

    if (!storeProduct || !storeProduct.podInfo?.isPOD) {
      console.log('[Webhook] Store product not found for:', printifyProductId);
      continue;
    }

    // Get the creator
    const creator = await User.findById(storeProduct.podInfo.creatorId);
    if (!creator) {
      console.log('[Webhook] Creator not found');
      continue;
    }

    // Calculate commission
    const baseCost = storeProduct.podInfo.baseCost || 0;
    const sellingPrice = storeProduct.price;
    const commissionRate = storeProduct.podInfo.commissionRate || 70;
    const { profit, creatorCommission, platformFee } = calculateCommissionSplit(
      sellingPrice * lineItem.quantity,
      baseCost * lineItem.quantity,
      commissionRate
    );

    // Create POD order
    const podOrder = new PODOrder({
      orderNumber: generateOrderNumber(),
      printifyOrderId,
      shopId: shopId || storeProduct.podInfo.printifyShopId,
      
      // Customer info (from Printify)
      customerId: creator._id, // Placeholder, should be actual customer
      customerEmail: orderData.address_to?.email || 'customer@example.com',
      customerName: `${orderData.address_to?.first_name || ''} ${orderData.address_to?.last_name || ''}`.trim(),
      customerPhone: orderData.address_to?.phone,
      
      shippingAddress: {
        firstName: orderData.address_to?.first_name || '',
        lastName: orderData.address_to?.last_name || '',
        company: orderData.address_to?.company,
        address1: orderData.address_to?.address1 || '',
        address2: orderData.address_to?.address2,
        city: orderData.address_to?.city || '',
        region: orderData.address_to?.region || '',
        zip: orderData.address_to?.zip || '',
        country: orderData.address_to?.country || '',
        countryCode: orderData.address_to?.country || 'BR',
      },
      
      items: [{
        podProductId: storeProduct.podInfo.podProductId,
        storeProductId: storeProduct._id,
        printifyProductId,
        printifyVariantId: lineItem.variant_id,
        title: lineItem.metadata?.title || storeProduct.name,
        variantLabel: lineItem.metadata?.variant_label || 'Default',
        quantity: lineItem.quantity,
        baseCost: baseCost * lineItem.quantity,
        sellingPrice: sellingPrice * lineItem.quantity,
        profit,
        creatorCommission,
        platformFee,
        shippingCost: lineItem.shipping_cost || 0,
        sku: lineItem.sku || storeProduct.sku,
        mockupImage: storeProduct.thumbnail,
        status: 'pending',
        printifyStatus: lineItem.status,
      }],
      
      subtotal: sellingPrice * lineItem.quantity,
      shippingTotal: orderData.total_shipping || 0,
      taxTotal: orderData.total_tax || 0,
      discountTotal: 0,
      grandTotal: orderData.total_price || (sellingPrice * lineItem.quantity),
      currency: 'BRL',
      
      totalCreatorCommission: creatorCommission,
      totalPlatformFee: platformFee,
      commissionRate,
      
      creatorId: creator._id,
      creatorEmail: creator.email,
      creatorName: creator.name,
      
      status: 'confirmed',
      paymentStatus: 'paid', // Assuming paid if order created
      
      shippingMethod: orderData.shipping_method === 3 ? 'printify_express' : 'standard',
      shippingMethodId: orderData.shipping_method || 1,
      isPrintifyExpress: orderData.is_printify_express || false,
      
      paidAt: new Date(),
    });

    await podOrder.save();
    console.log('[Webhook] POD Order created:', podOrder.orderNumber);

    // Update creator's earnings
    await User.findByIdAndUpdate(creator._id, {
      $inc: {
        'podEarnings.pendingEarnings': creatorCommission,
        'podEarnings.totalSales': sellingPrice * lineItem.quantity,
        'podEarnings.totalOrders': 1,
      },
    });

    // Update store product sold count
    await StoreProduct.findByIdAndUpdate(storeProduct._id, {
      $inc: { soldCount: lineItem.quantity },
    });

    // Update POD product stats
    await UserPODProduct.findByIdAndUpdate(storeProduct.podInfo.podProductId, {
      $inc: {
        sales: lineItem.quantity,
        revenue: sellingPrice * lineItem.quantity,
      },
    });
  }
}

// Handle order updated event
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderUpdated(event: any) {
  const { resource } = event;
  const printifyOrderId = resource.id;
  const status = resource.data?.status;

  console.log('[Webhook] Order updated:', printifyOrderId, 'Status:', status);

  const podOrder = await PODOrder.findOne({ printifyOrderId });
  if (!podOrder) {
    console.log('[Webhook] POD Order not found');
    return;
  }

  // Map Printify status to our status
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'on-hold': 'pending',
    'sending-to-production': 'processing',
    'in-production': 'in_production',
    'canceled': 'cancelled',
    'fulfilled': 'delivered',
    'partially-fulfilled': 'shipped',
    'has-issues': 'failed',
  };

  const newStatus = statusMap[status] || podOrder.status;
  
  await PODOrder.findByIdAndUpdate(podOrder._id, {
    status: newStatus,
    'items.$[].printifyStatus': status,
  });

  console.log('[Webhook] Order status updated to:', newStatus);
}

// Handle order sent to production
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderSentToProduction(event: any) {
  const { resource } = event;
  const printifyOrderId = resource.id;

  console.log('[Webhook] Order sent to production:', printifyOrderId);

  await PODOrder.findOneAndUpdate(
    { printifyOrderId },
    {
      status: 'in_production',
      sentToProductionAt: new Date(),
      'items.$[].status': 'in_production',
    }
  );
}

// Handle shipment created
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleShipmentCreated(event: any) {
  const { resource } = event;
  const printifyOrderId = resource.id;
  const shipmentData = resource.data;

  console.log('[Webhook] Shipment created:', printifyOrderId);

  const carrier = shipmentData?.carrier?.code || 'Unknown';
  const trackingNumber = shipmentData?.carrier?.tracking_number || '';
  const trackingUrl = shipmentData?.carrier?.tracking_url || 
    `https://track.aftership.com/${trackingNumber}`;

  await PODOrder.findOneAndUpdate(
    { printifyOrderId },
    {
      status: 'shipped',
      shippedAt: new Date(),
      'items.$[].status': 'shipped',
      $push: {
        shipments: {
          carrier,
          trackingNumber,
          trackingUrl,
          shippedAt: new Date(),
          status: 'shipped',
        },
      },
    }
  );
}

// Handle shipment delivered
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleShipmentDelivered(event: any) {
  const { resource } = event;
  const printifyOrderId = resource.id;
  const deliveredAt = resource.data?.delivered_at;

  console.log('[Webhook] Shipment delivered:', printifyOrderId);

  const podOrder = await PODOrder.findOneAndUpdate(
    { printifyOrderId },
    {
      status: 'delivered',
      deliveredAt: deliveredAt ? new Date(deliveredAt) : new Date(),
      'items.$[].status': 'delivered',
      'shipments.$[].status': 'delivered',
      'shipments.$[].deliveredAt': deliveredAt ? new Date(deliveredAt) : new Date(),
    },
    { new: true }
  );

  if (podOrder) {
    // Move pending earnings to total earnings (commission is now payable)
    await User.findByIdAndUpdate(podOrder.creatorId, {
      $inc: {
        'podEarnings.totalEarnings': podOrder.totalCreatorCommission,
        'podEarnings.pendingEarnings': -podOrder.totalCreatorCommission,
      },
    });
  }
}

// Handle product deleted
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleProductDeleted(event: any) {
  const { resource } = event;
  const printifyProductId = resource.id;

  console.log('[Webhook] Product deleted:', printifyProductId);

  // Update store product
  await StoreProduct.findOneAndUpdate(
    { 'podInfo.printifyProductId': printifyProductId },
    {
      isActive: false,
      'podInfo.printifySyncStatus': 'not_synced',
    }
  );

  // Update POD product
  await UserPODProduct.findOneAndUpdate(
    { 'providers.providerProductId': printifyProductId },
    {
      status: 'archived',
      isPublished: false,
    }
  );
}

// Handle product publish started
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleProductPublishStarted(event: any) {
  const { resource } = event;
  const printifyProductId = resource.id;
  const publishDetails = resource.data?.publish_details;

  console.log('[Webhook] Product publish started:', printifyProductId, publishDetails);

  await StoreProduct.findOneAndUpdate(
    { 'podInfo.printifyProductId': printifyProductId },
    {
      'podInfo.publishedToPrintify': true,
      'podInfo.printifySyncStatus': 'synced',
      'podInfo.lastSyncedAt': new Date(),
    }
  );
}

// GET - Verify webhook endpoint (Printify may ping this)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Printify webhook endpoint active',
    timestamp: new Date().toISOString(),
  });
}
