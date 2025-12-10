/**
 * Order Fulfillment Service
 * 
 * Handles automatic fulfillment for all product types:
 * - Digital: Courses, subscriptions, downloads
 * - POD: Print-on-Demand via Printify/Prodigi
 * - Dropshipping: Third-party fulfillment
 * - Physical: Our own inventory
 */

import FulfillmentOrder, { 
  IFulfillmentOrder, 
  IFulfillmentItem,
  FulfillmentStatus,
  ISupplierOrder,
  IDigitalDelivery 
} from '@/models/FulfillmentOrder';
import User from '@/models/User';
import Payment from '@/models/Payment';
import PODOrder, { generateOrderNumber as generatePODOrderNumber } from '@/models/PODOrder';
import StoreProduct from '@/models/StoreProduct';
import DropshippingProduct from '@/models/DropshippingProduct';
import { sendFulfillmentEmail, FulfillmentEmailType } from './email-service';
import { shareGoogleDriveFolder, getCourseGoogleDriveFolder } from './google-drive';
import { 
  createOrder as createProdigiOrder, 
  buildProdigiOrder,
  ProdigiShippingMethod 
} from './prodigi-api';
import { createPrintifyOrder, getPrintifyShopId } from './printify-api';
import dbConnect from './mongodb';

// =============================================================================
// TYPES
// =============================================================================

export interface FulfillmentResult {
  success: boolean;
  fulfillmentOrderId?: string;
  status: FulfillmentStatus;
  message: string;
  details?: Record<string, unknown>;
}

export interface CourseContent {
  type: 'database' | 'google_drive';
  googleDriveFolderId?: string;
  downloadLinks?: Array<{
    name: string;
    url: string;
  }>;
}

// =============================================================================
// MAIN FULFILLMENT PROCESSOR
// =============================================================================

/**
 * Process fulfillment for a paid order
 * Called when payment is confirmed via webhook
 */
export async function processFulfillment(paymentId: string): Promise<FulfillmentResult> {
  await dbConnect();
  
  try {
    // Get payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return {
        success: false,
        status: 'failed',
        message: 'Payment not found',
      };
    }
    
    // Check if already fulfilled
    const existingFulfillment = await FulfillmentOrder.findOne({ 
      paymentId: payment._id 
    });
    
    if (existingFulfillment && existingFulfillment.status === 'delivered') {
      return {
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fulfillmentOrderId: (existingFulfillment as any)._id.toString(),
        status: 'delivered',
        message: 'Already fulfilled',
      };
    }
    
    // Create or get fulfillment order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fulfillmentOrder: any = existingFulfillment;
    if (!fulfillmentOrder) {
      fulfillmentOrder = await FulfillmentOrder.createFromPayment(payment);
    }
    
    // Update status to processing
    await fulfillmentOrder.updateStatus('processing', 'Iniciando processamento do pedido');
    
    // Process each item based on type
    const results: Array<{
      item: IFulfillmentItem;
      success: boolean;
      message: string;
    }> = [];
    
    for (let i = 0; i < fulfillmentOrder.items.length; i++) {
      const item = fulfillmentOrder.items[i];
      let result;
      
      switch (item.type) {
        case 'course':
          result = await fulfillCourse(fulfillmentOrder, item, i);
          break;
          
        case 'subscription':
          result = await fulfillSubscription(fulfillmentOrder, item, i);
          break;
          
        case 'pod':
          result = await fulfillPOD(fulfillmentOrder, item, i);
          break;
          
        case 'product':
          result = await fulfillProduct(fulfillmentOrder, item, i);
          break;
          
        case 'service':
          result = await fulfillService(fulfillmentOrder, item, i);
          break;
          
        default:
          result = { success: false, message: `Unknown item type: ${item.type}` };
      }
      
      results.push({ item, ...result });
    }
    
    // Determine overall status
    const allSucceeded = results.every(r => r.success);
    const hasPhysical = fulfillmentOrder.items.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (i: any) => i.fulfillmentType === 'pod' || 
           i.fulfillmentType === 'dropshipping' || 
           i.fulfillmentType === 'physical'
    );
    
    // Update fulfillment status
    if (allSucceeded) {
      if (hasPhysical) {
        // Physical items need shipping - status depends on supplier
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const podItems = fulfillmentOrder.items.filter((i: any) => i.fulfillmentType === 'pod');
        if (podItems.length > 0) {
          await fulfillmentOrder.updateStatus(
            'awaiting_supplier',
            'Pedido enviado para produção'
          );
        }
      } else {
        // All digital - immediately delivered
        await fulfillmentOrder.updateStatus('delivered', 'Acesso liberado com sucesso');
        fulfillmentOrder.completedAt = new Date();
        await fulfillmentOrder.save();
      }
    } else {
      await fulfillmentOrder.updateStatus(
        'failed',
        'Erro no processamento: ' + results.filter(r => !r.success).map(r => r.message).join(', ')
      );
    }
    
    // Send confirmation email
    await sendFulfillmentEmail(
      fulfillmentOrder.userEmail,
      allSucceeded ? 
        (hasPhysical ? 'order_confirmed' : 'order_delivered') : 
        'order_failed',
      {
        userName: fulfillmentOrder.userName,
        orderNumber: fulfillmentOrder.orderNumber,
        items: fulfillmentOrder.items,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        digitalDelivery: fulfillmentOrder.digitalDelivery as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        shipping: fulfillmentOrder.shipping as any,
      }
    );
    
    // Record email sent
    fulfillmentOrder.emailsSent.push({
      type: allSucceeded ? 'confirmation' : 'failure',
      sentAt: new Date(),
      status: 'sent',
    });
    await fulfillmentOrder.save();
    
    return {
      success: allSucceeded,
      fulfillmentOrderId: fulfillmentOrder._id.toString(),
      status: fulfillmentOrder.status,
      message: allSucceeded ? 'Fulfillment completed' : 'Fulfillment failed',
      details: { results },
    };
    
  } catch (error) {
    console.error('[Fulfillment] Error:', error);
    return {
      success: false,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// COURSE FULFILLMENT
// =============================================================================

/**
 * Fulfill course access
 * - Grant enrollment
 * - Share Google Drive folder if available
 * - Send access email
 */
async function fulfillCourse(
  fulfillmentOrder: IFulfillmentOrder,
  item: IFulfillmentItem,
  itemIndex: number
): Promise<{ success: boolean; message: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await User.findById(fulfillmentOrder.userId) as any;
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    // Get course info from database
    const courseProduct = await StoreProduct.findOne({ 
      slug: item.productSlug,
      category: 'courses'
    });
    
    // Grant enrollment
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
    
    await user.save();
    
    // Set up digital delivery
    const digitalDelivery: IDigitalDelivery = {
      type: 'course_access',
      courseSlug: item.productSlug,
      accessUrl: `https://fayapoint.com/pt-BR/portal?tab=courses&course=${item.productSlug}`,
    };
    
    // Check for Google Drive content
    const googleDriveFolderId = await getCourseGoogleDriveFolder(item.productSlug || '');
    
    if (googleDriveFolderId) {
      try {
        const shareLink = await shareGoogleDriveFolder(googleDriveFolderId, user.email);
        digitalDelivery.googleDrive = {
          folderId: googleDriveFolderId,
          shareLink,
          sharedAt: new Date(),
        };
      } catch (error) {
        console.error('[Fulfillment] Error sharing Google Drive:', error);
        // Continue even if Drive sharing fails
      }
    }
    
    // Check for download links in course content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (courseProduct?.fullDescription && (courseProduct as any).courseContent?.downloadLinks) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      digitalDelivery.downloadLinks = (courseProduct as any).courseContent.downloadLinks;
    }
    
    // Update item in fulfillment order
    fulfillmentOrder.items[itemIndex].status = 'delivered';
    fulfillmentOrder.items[itemIndex].deliveredAt = new Date();
    fulfillmentOrder.items[itemIndex].digitalDelivery = digitalDelivery;
    
    // Set main digital delivery if first item
    if (!fulfillmentOrder.digitalDelivery) {
      fulfillmentOrder.digitalDelivery = digitalDelivery;
    }
    
    await fulfillmentOrder.save();
    
    console.log(`[Fulfillment] Course ${item.productSlug} access granted to ${user.email}`);
    
    return { success: true, message: 'Course access granted' };
    
  } catch (error) {
    console.error('[Fulfillment] Course fulfillment error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Course fulfillment failed' 
    };
  }
}

// =============================================================================
// SUBSCRIPTION FULFILLMENT
// =============================================================================

/**
 * Fulfill subscription plan
 * - Upgrade user plan
 * - Set expiration date
 */
async function fulfillSubscription(
  fulfillmentOrder: IFulfillmentOrder,
  item: IFulfillmentItem,
  itemIndex: number
): Promise<{ success: boolean; message: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await User.findById(fulfillmentOrder.userId) as any;
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    // Map plan slug to plan name
    const planMap: Record<string, string> = {
      'starter': 'starter',
      'pro': 'pro',
      'business': 'business',
    };
    
    const planSlug = item.productSlug?.toLowerCase() || '';
    const newPlan = planMap[planSlug];
    
    if (newPlan) {
      user.plan = newPlan;
      user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await user.save();
      
      // Set digital delivery
      const digitalDelivery: IDigitalDelivery = {
        type: 'subscription',
        subscriptionPlan: newPlan,
        accessUrl: 'https://fayapoint.com/pt-BR/portal',
        expiresAt: user.planExpiresAt,
      };
      
      fulfillmentOrder.items[itemIndex].status = 'delivered';
      fulfillmentOrder.items[itemIndex].deliveredAt = new Date();
      fulfillmentOrder.items[itemIndex].digitalDelivery = digitalDelivery;
      
      if (!fulfillmentOrder.digitalDelivery) {
        fulfillmentOrder.digitalDelivery = digitalDelivery;
      }
      
      await fulfillmentOrder.save();
      
      console.log(`[Fulfillment] Subscription ${newPlan} activated for ${user.email}`);
      
      return { success: true, message: `Plan ${newPlan} activated` };
    }
    
    return { success: false, message: 'Invalid subscription plan' };
    
  } catch (error) {
    console.error('[Fulfillment] Subscription fulfillment error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Subscription fulfillment failed' 
    };
  }
}

// =============================================================================
// POD (PRINT-ON-DEMAND) FULFILLMENT
// =============================================================================

/**
 * Fulfill POD product
 * - Send order to Printify or Prodigi
 * - Track production status
 */
async function fulfillPOD(
  fulfillmentOrder: IFulfillmentOrder,
  item: IFulfillmentItem,
  itemIndex: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Get store product with POD info
    const storeProduct = await StoreProduct.findOne({ 
      slug: item.productSlug 
    });
    
    if (!storeProduct?.podInfo?.isPOD) {
      return { success: false, message: 'POD product info not found' };
    }
    
    const podInfo = storeProduct.podInfo;
    const shipping = fulfillmentOrder.shipping;
    
    if (!shipping?.address) {
      return { success: false, message: 'Shipping address required for POD' };
    }
    
    let supplierOrder: ISupplierOrder;
    
    // Determine provider and create order
    if (podInfo.printifyProductId) {
      // Printify order
      supplierOrder = await createPrintifySupplierOrder(
        fulfillmentOrder,
        item,
        storeProduct,
        shipping
      );
    } else {
      // Prodigi order (default for wall art, etc.)
      supplierOrder = await createProdigiSupplierOrder(
        fulfillmentOrder,
        item,
        storeProduct,
        shipping
      );
    }
    
    // Add supplier order to fulfillment
    fulfillmentOrder.supplierOrders.push(supplierOrder);
    
    // Update item status
    fulfillmentOrder.items[itemIndex].status = supplierOrder.providerOrderId ? 
      'awaiting_supplier' : 'failed';
    
    await fulfillmentOrder.save();
    
    // Create PODOrder record for commission tracking
    if (supplierOrder.providerOrderId && podInfo.creatorId) {
      await createPODOrderRecord(
        fulfillmentOrder,
        item,
        storeProduct,
        supplierOrder
      );
    }
    
    if (supplierOrder.providerOrderId) {
      console.log(`[Fulfillment] POD order submitted to ${supplierOrder.provider}: ${supplierOrder.providerOrderId}`);
      return { success: true, message: `POD order submitted to ${supplierOrder.provider}` };
    }
    
    return { success: false, message: 'Failed to create POD order' };
    
  } catch (error) {
    console.error('[Fulfillment] POD fulfillment error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'POD fulfillment failed' 
    };
  }
}

/**
 * Create Printify supplier order
 */
async function createPrintifySupplierOrder(
  fulfillmentOrder: IFulfillmentOrder,
  item: IFulfillmentItem,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storeProduct: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipping: any
): Promise<ISupplierOrder> {
  const shopId = await getPrintifyShopId();
  const podInfo = storeProduct.podInfo;
  
  const printifyOrderData = {
    external_id: fulfillmentOrder.orderNumber,
    label: fulfillmentOrder.orderNumber,
    line_items: [{
      product_id: podInfo.printifyProductId,
      variant_id: item.printifyVariantId || podInfo.variants?.[0]?.printifyVariantId,
      quantity: item.quantity,
    }],
    shipping_method: 1, // Standard
    is_printify_express: false,
    is_economy_shipping: false,
    address_to: {
      first_name: shipping.address.name.split(' ')[0],
      last_name: shipping.address.name.split(' ').slice(1).join(' ') || '',
      email: fulfillmentOrder.userEmail,
      phone: shipping.address.phone || '',
      country: shipping.address.countryCode || 'BR',
      region: shipping.address.state,
      address1: `${shipping.address.street}${shipping.address.number ? ', ' + shipping.address.number : ''}`,
      address2: shipping.address.complement || '',
      city: shipping.address.city,
      zip: shipping.address.postalCode,
    },
    send_shipping_notification: true,
  };
  
  try {
    const printifyOrder = await createPrintifyOrder(shopId, printifyOrderData);
    
    return {
      provider: 'printify',
      providerOrderId: printifyOrder.id,
      providerStatus: printifyOrder.status,
      submittedAt: new Date(),
      cost: podInfo.baseCost * item.quantity,
      currency: 'BRL',
      lastSyncAt: new Date(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawResponse: printifyOrder as any,
    };
  } catch (error) {
    console.error('[Fulfillment] Printify order error:', error);
    return {
      provider: 'printify',
      cost: podInfo.baseCost * item.quantity,
      currency: 'BRL',
    };
  }
}

/**
 * Create Prodigi supplier order
 */
async function createProdigiSupplierOrder(
  fulfillmentOrder: IFulfillmentOrder,
  item: IFulfillmentItem,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storeProduct: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipping: any
): Promise<ISupplierOrder> {
  const podInfo = storeProduct.podInfo;
  
  // Build Prodigi order
  const prodigiOrderData = buildProdigiOrder({
    merchantReference: fulfillmentOrder.orderNumber,
    recipient: {
      name: shipping.address.name,
      email: fulfillmentOrder.userEmail,
      phoneNumber: shipping.address.phone,
      address: {
        line1: `${shipping.address.street}${shipping.address.number ? ', ' + shipping.address.number : ''}`,
        line2: shipping.address.complement,
        townOrCity: shipping.address.city,
        stateOrCounty: shipping.address.state,
        postalOrZipCode: shipping.address.postalCode,
        countryCode: shipping.address.countryCode || 'BR',
      },
    },
    items: [{
      sku: storeProduct.sku,
      imageUrl: podInfo.designUrl || storeProduct.thumbnail,
      copies: item.quantity,
      customerPrice: item.totalPrice,
      customerCurrency: 'BRL',
    }],
    shippingMethod: 'Standard' as ProdigiShippingMethod,
    callbackUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/prodigi`,
    metadata: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fulfillmentOrderId: (fulfillmentOrder as any)._id?.toString() || '',
      itemIndex: item.productId,
    },
  });
  
  try {
    const prodigiResponse = await createProdigiOrder(prodigiOrderData);
    const prodigiOrder = prodigiResponse.order;
    
    return {
      provider: 'prodigi',
      providerOrderId: prodigiOrder?.id,
      providerStatus: prodigiOrder?.status?.stage,
      submittedAt: new Date(),
      cost: podInfo.baseCost * item.quantity,
      currency: 'BRL',
      lastSyncAt: new Date(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawResponse: prodigiOrder as any,
    };
  } catch (error) {
    console.error('[Fulfillment] Prodigi order error:', error);
    return {
      provider: 'prodigi',
      cost: podInfo.baseCost * item.quantity,
      currency: 'BRL',
    };
  }
}

/**
 * Create PODOrder record for commission tracking
 */
async function createPODOrderRecord(
  fulfillmentOrder: IFulfillmentOrder,
  item: IFulfillmentItem,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storeProduct: any,
  supplierOrder: ISupplierOrder
): Promise<void> {
  const podInfo = storeProduct.podInfo;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const creator = await User.findById(podInfo.creatorId) as any;
  
  if (!creator) return;
  
  const shipping = fulfillmentOrder.shipping;
  if (!shipping?.address) return;
  
  // Calculate commission
  const profit = item.totalPrice - (podInfo.baseCost * item.quantity);
  const commissionRate = podInfo.commissionRate || 70;
  const creatorCommission = Math.round((profit * commissionRate / 100) * 100) / 100;
  const platformFee = profit - creatorCommission;
  
  const podOrder = new PODOrder({
    orderNumber: generatePODOrderNumber(),
    printifyOrderId: supplierOrder.providerOrderId,
    shopId: podInfo.printifyShopId || 0,
    
    customerId: fulfillmentOrder.userId,
    customerEmail: fulfillmentOrder.userEmail,
    customerName: fulfillmentOrder.userName,
    
    shippingAddress: {
      firstName: shipping.address.name.split(' ')[0],
      lastName: shipping.address.name.split(' ').slice(1).join(' ') || '',
      address1: `${shipping.address.street}${shipping.address.number ? ', ' + shipping.address.number : ''}`,
      address2: shipping.address.complement || '',
      city: shipping.address.city,
      region: shipping.address.state,
      zip: shipping.address.postalCode,
      country: shipping.address.country || 'Brasil',
      countryCode: shipping.address.countryCode || 'BR',
    },
    
    items: [{
      podProductId: podInfo.podProductId,
      storeProductId: storeProduct._id,
      printifyProductId: podInfo.printifyProductId || '',
      printifyVariantId: item.printifyVariantId || 0,
      title: item.name,
      variantLabel: 'Default',
      quantity: item.quantity,
      baseCost: podInfo.baseCost,
      sellingPrice: item.unitPrice,
      profit: profit / item.quantity,
      creatorCommission: creatorCommission / item.quantity,
      platformFee: platformFee / item.quantity,
      shippingCost: 0,
      sku: storeProduct.sku,
      mockupImage: storeProduct.thumbnail,
      status: 'pending',
    }],
    
    subtotal: item.totalPrice,
    grandTotal: item.totalPrice,
    
    totalCreatorCommission: creatorCommission,
    totalPlatformFee: platformFee,
    commissionRate,
    
    creatorId: podInfo.creatorId,
    creatorEmail: creator.email,
    creatorName: creator.name,
    
    status: 'confirmed',
    paymentStatus: 'paid',
    paidAt: new Date(),
  });
  
  await podOrder.save();
  
  // Update creator's pending earnings
  if (!creator.podEarnings) {
    creator.podEarnings = {
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      totalSales: 0,
      totalOrders: 0,
      totalProducts: 0,
    };
  }
  
  creator.podEarnings.pendingEarnings += creatorCommission;
  creator.podEarnings.totalSales += item.totalPrice;
  creator.podEarnings.totalOrders += 1;
  
  await creator.save();
  
  console.log(`[Fulfillment] POD order created, creator earns R$${creatorCommission.toFixed(2)}`);
}

// =============================================================================
// PHYSICAL/DROPSHIPPING PRODUCT FULFILLMENT
// =============================================================================

/**
 * Fulfill physical product
 * - Check if dropshipping or own inventory
 * - Place order with supplier or prepare for shipping
 */
async function fulfillProduct(
  fulfillmentOrder: IFulfillmentOrder,
  item: IFulfillmentItem,
  itemIndex: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Get store product
    const storeProduct = await StoreProduct.findOne({ slug: item.productSlug });
    
    if (!storeProduct) {
      return { success: false, message: 'Product not found' };
    }
    
    // Check if it's a dropshipping product
    if (storeProduct.category === 'dropshipping') {
      return await fulfillDropshipping(fulfillmentOrder, item, itemIndex, storeProduct);
    }
    
    // Physical inventory - mark as processing (manual fulfillment)
    fulfillmentOrder.items[itemIndex].status = 'processing';
    
    // Add timeline event
    fulfillmentOrder.timeline.push({
      status: 'processing',
      timestamp: new Date(),
      message: `Produto ${item.name} aguardando preparação para envio`,
      notified: false,
    });
    
    await fulfillmentOrder.save();
    
    // TODO: Integrate with inventory system
    // TODO: Generate shipping label
    
    console.log(`[Fulfillment] Physical product ${item.productSlug} marked for manual fulfillment`);
    
    return { success: true, message: 'Product queued for shipping' };
    
  } catch (error) {
    console.error('[Fulfillment] Product fulfillment error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Product fulfillment failed' 
    };
  }
}

/**
 * Fulfill dropshipping product
 */
async function fulfillDropshipping(
  fulfillmentOrder: IFulfillmentOrder,
  item: IFulfillmentItem,
  itemIndex: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storeProduct: any
): Promise<{ success: boolean; message: string }> {
  // Get dropshipping product info
  const dropshippingProduct = await DropshippingProduct.findOne({
    storeProductId: storeProduct._id
  });
  
  if (!dropshippingProduct) {
    // Mark for manual processing
    fulfillmentOrder.items[itemIndex].status = 'processing';
    fulfillmentOrder.timeline.push({
      status: 'processing',
      timestamp: new Date(),
      message: `Produto dropshipping ${item.name} requer processamento manual`,
      notified: false,
    });
    await fulfillmentOrder.save();
    return { success: true, message: 'Queued for manual dropshipping' };
  }
  
  // Add supplier order (manual - will be placed by admin)
  const supplierOrder: ISupplierOrder = {
    provider: 'other',
    cost: dropshippingProduct.priceBRL * item.quantity,
    currency: 'BRL',
  };
  
  fulfillmentOrder.supplierOrders.push(supplierOrder);
  fulfillmentOrder.items[itemIndex].status = 'awaiting_supplier';
  
  fulfillmentOrder.timeline.push({
    status: 'awaiting_supplier',
    timestamp: new Date(),
    message: `Pedido de ${item.name} aguardando compra no fornecedor ${dropshippingProduct.sourceName}`,
    details: {
      source: dropshippingProduct.sourceName,
      sourceUrl: dropshippingProduct.sourceUrl,
      externalId: dropshippingProduct.externalId,
    },
    notified: false,
  });
  
  await fulfillmentOrder.save();
  
  console.log(`[Fulfillment] Dropshipping product ${item.productSlug} queued from ${dropshippingProduct.sourceName}`);
  
  return { success: true, message: 'Dropshipping order queued' };
}

// =============================================================================
// SERVICE FULFILLMENT
// =============================================================================

/**
 * Fulfill service purchase
 * - Record purchase
 * - Send confirmation
 * - Schedule follow-up
 */
async function fulfillService(
  fulfillmentOrder: IFulfillmentOrder,
  item: IFulfillmentItem,
  itemIndex: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Services are delivered via consultation/project
    fulfillmentOrder.items[itemIndex].status = 'delivered';
    fulfillmentOrder.items[itemIndex].deliveredAt = new Date();
    
    const digitalDelivery: IDigitalDelivery = {
      type: 'email',
      accessUrl: 'https://fayapoint.com/pt-BR/contato',
    };
    
    fulfillmentOrder.items[itemIndex].digitalDelivery = digitalDelivery;
    
    fulfillmentOrder.timeline.push({
      status: 'delivered',
      timestamp: new Date(),
      message: `Serviço ${item.name} contratado - nossa equipe entrará em contato em breve`,
      notified: false,
    });
    
    await fulfillmentOrder.save();
    
    // TODO: Create task in project management system
    // TODO: Send notification to sales team
    
    console.log(`[Fulfillment] Service ${item.productSlug} purchased by ${fulfillmentOrder.userEmail}`);
    
    return { success: true, message: 'Service purchase confirmed' };
    
  } catch (error) {
    console.error('[Fulfillment] Service fulfillment error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Service fulfillment failed' 
    };
  }
}

// =============================================================================
// TRACKING UPDATES
// =============================================================================

/**
 * Update fulfillment order with tracking info
 */
export async function updateTracking(
  fulfillmentOrderId: string,
  trackingInfo: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
    estimatedDelivery?: Date;
  }
): Promise<FulfillmentResult> {
  await dbConnect();
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fulfillmentOrder = await FulfillmentOrder.findById(fulfillmentOrderId) as any;
    if (!fulfillmentOrder) {
      return { success: false, status: 'failed', message: 'Fulfillment order not found' };
    }
    
    if (fulfillmentOrder.shipping) {
      fulfillmentOrder.shipping.carrier = trackingInfo.carrier;
      fulfillmentOrder.shipping.trackingNumber = trackingInfo.trackingNumber;
      fulfillmentOrder.shipping.trackingUrl = trackingInfo.trackingUrl || 
        generateTrackingUrl(trackingInfo.carrier, trackingInfo.trackingNumber);
      fulfillmentOrder.shipping.estimatedDelivery = trackingInfo.estimatedDelivery;
    }
    
    await fulfillmentOrder.updateStatus('shipped', 'Pedido enviado');
    
    // Send tracking email
    await sendFulfillmentEmail(
      fulfillmentOrder.userEmail,
      'order_shipped',
      {
        userName: fulfillmentOrder.userName,
        orderNumber: fulfillmentOrder.orderNumber,
        items: fulfillmentOrder.items,
        shipping: {
          ...fulfillmentOrder.shipping,
          carrier: trackingInfo.carrier,
          trackingNumber: trackingInfo.trackingNumber,
          trackingUrl: fulfillmentOrder.shipping?.trackingUrl,
        },
      }
    );
    
    fulfillmentOrder.emailsSent.push({
      type: 'tracking',
      sentAt: new Date(),
      status: 'sent',
    });
    
    await fulfillmentOrder.save();
    
    return {
      success: true,
      fulfillmentOrderId,
      status: 'shipped',
      message: 'Tracking updated',
    };
    
  } catch (error) {
    console.error('[Fulfillment] Update tracking error:', error);
    return {
      success: false,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Failed to update tracking',
    };
  }
}

/**
 * Mark order as delivered
 */
export async function markDelivered(
  fulfillmentOrderId: string
): Promise<FulfillmentResult> {
  await dbConnect();
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fulfillmentOrder = await FulfillmentOrder.findById(fulfillmentOrderId) as any;
    if (!fulfillmentOrder) {
      return { success: false, status: 'failed', message: 'Fulfillment order not found' };
    }
    
    if (fulfillmentOrder.shipping) {
      fulfillmentOrder.shipping.actualDelivery = new Date();
    }
    
    // Update all item statuses
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fulfillmentOrder.items.forEach((item: any) => {
      item.status = 'delivered';
      item.deliveredAt = new Date();
    });
    
    await fulfillmentOrder.updateStatus('delivered', 'Pedido entregue');
    
    // Update creator earnings if POD
    for (const supplierOrder of fulfillmentOrder.supplierOrders) {
      if (supplierOrder.provider === 'printify' || supplierOrder.provider === 'prodigi') {
        await finalizePODEarnings(fulfillmentOrder.orderNumber);
      }
    }
    
    // Send delivery confirmation
    await sendFulfillmentEmail(
      fulfillmentOrder.userEmail,
      'order_delivered',
      {
        userName: fulfillmentOrder.userName,
        orderNumber: fulfillmentOrder.orderNumber,
        items: fulfillmentOrder.items,
      }
    );
    
    fulfillmentOrder.emailsSent.push({
      type: 'delivered',
      sentAt: new Date(),
      status: 'sent',
    });
    
    await fulfillmentOrder.save();
    
    return {
      success: true,
      fulfillmentOrderId,
      status: 'delivered',
      message: 'Order marked as delivered',
    };
    
  } catch (error) {
    console.error('[Fulfillment] Mark delivered error:', error);
    return {
      success: false,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Failed to mark delivered',
    };
  }
}

/**
 * Finalize POD creator earnings (move from pending to total)
 */
async function finalizePODEarnings(orderNumber: string): Promise<void> {
  const podOrder = await PODOrder.findOne({ orderNumber });
  if (!podOrder) return;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const creator = await User.findById(podOrder.creatorId) as any;
  if (!creator || !creator.podEarnings) return;
  
  const commission = podOrder.totalCreatorCommission;
  
  creator.podEarnings.pendingEarnings = Math.max(0, creator.podEarnings.pendingEarnings - commission);
  creator.podEarnings.totalEarnings += commission;
  
  await creator.save();
  
  console.log(`[Fulfillment] POD earnings finalized: ${creator.email} earned R$${commission.toFixed(2)}`);
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate tracking URL based on carrier
 */
function generateTrackingUrl(carrier: string, trackingNumber: string): string {
  const carrierUrls: Record<string, string> = {
    'correios': `https://rastreamento.correios.com.br/app/index.php?codigo=${trackingNumber}`,
    'jadlog': `https://www.jadlog.com.br/siteInstitucional/tracking.jad?codigo=${trackingNumber}`,
    'fedex': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    'dhl': `https://www.dhl.com/br-pt/home/rastreamento.html?tracking-id=${trackingNumber}`,
    'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
  };
  
  return carrierUrls[carrier.toLowerCase()] || 
    `https://track.aftership.com/${trackingNumber}`;
}

export default {
  processFulfillment,
  updateTracking,
  markDelivered,
};
