/**
 * Prodigi Orders API
 * Create, list, and manage orders through Prodigi
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import ProdigiOrder, { 
  generateProdigiOrderNumber, 
  calculateProdigiCommissionSplit,
  mapProdigiStatusToInternal,
} from '@/models/ProdigiOrder';
import {
  createOrder,
  getOrder,
  getOrders,
  cancelOrder,
  buildProdigiOrder,
  convertProdigiCost,
  calculateEstimatedDelivery,
  generateIdempotencyKey,
  ProdigiShippingMethod,
  ProdigiRecipient,
} from '@/lib/prodigi-api';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fayapoint.com';

// Exchange rates
const GBP_TO_BRL = parseFloat(process.env.GBP_TO_BRL || '6.30');

// Helper to get user from token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    await dbConnect();
    const user = await User.findById(decoded.id).lean();
    return user;
  } catch {
    return null;
  }
}

// GET - List orders
export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await getUserFromToken(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');

    // Get single order by ID
    if (orderId) {
      const order = await ProdigiOrder.findOne({
        _id: orderId,
        $or: [
          { customerId: user._id },
          { creatorId: user._id },
        ],
      }).lean();

      if (!order) {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
      }

      // If order has prodigiOrderId, fetch latest status from Prodigi
      if (order.prodigiOrderId) {
        try {
          const prodigiResponse = await getOrder(order.prodigiOrderId);
          if (prodigiResponse.order) {
            // Update local order with latest status
            const prodigiOrder = prodigiResponse.order;
            await ProdigiOrder.updateOne(
              { _id: order._id },
              {
                $set: {
                  prodigiStatus: prodigiOrder.status,
                  status: mapProdigiStatusToInternal(
                    prodigiOrder.status.stage,
                    prodigiOrder.status.details
                  ),
                  shipments: prodigiOrder.shipments?.map(s => ({
                    prodigiShipmentId: s.id,
                    status: s.status,
                    carrier: s.carrier,
                    trackingNumber: s.tracking?.number,
                    trackingUrl: s.tracking?.url,
                    dispatchDate: s.dispatchDate ? new Date(s.dispatchDate) : undefined,
                    fulfillmentLocation: s.fulfillmentLocation,
                    items: s.items.map(i => i.itemId),
                  })) || [],
                  charges: prodigiOrder.charges?.map(c => ({
                    prodigiChargeId: c.id,
                    chargeType: c.chargeType,
                    invoiceNumber: c.prodigiInvoiceNumber,
                    amount: parseFloat(c.totalCost.amount),
                    currency: c.totalCost.currency,
                  })) || [],
                },
              }
            );

            // Fetch updated order
            const updatedOrder = await ProdigiOrder.findById(order._id).lean();
            return NextResponse.json({ order: updatedOrder });
          }
        } catch (syncError) {
          console.error('[Prodigi Orders] Error syncing order status:', syncError);
          // Continue with cached order
        }
      }

      return NextResponse.json({ order });
    }

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {
      $or: [
        { customerId: user._id },
        { creatorId: user._id },
      ],
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    // Get orders with pagination
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      ProdigiOrder.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProdigiOrder.countDocuments(query),
    ]);

    // Get stats
    const stats = await ProdigiOrder.aggregate([
      { $match: { $or: [{ customerId: user._id }, { creatorId: user._id }] } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          processing: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
          inProduction: { $sum: { $cond: [{ $eq: ['$status', 'in_production'] }, 1, 0] } },
          shipped: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          totalRevenue: { $sum: '$grandTotalBRL' },
          totalProfit: { $sum: '$totalProfitBRL' },
          totalCommission: { $sum: '$totalCreatorCommission' },
        },
      },
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: stats[0] || {
        total: 0,
        pending: 0,
        processing: 0,
        inProduction: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0,
        totalProfit: 0,
        totalCommission: 0,
      },
    });
  } catch (error) {
    console.error('[Prodigi Orders] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await getUserFromToken(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      items, // Array of { sku, imageUrl, copies, attributes, sellingPriceBRL }
      recipient, // { name, email, phone, address }
      shippingMethod = 'Standard',
      customerNotes,
      source = 'website',
      creatorId, // Optional - for dropshipping through a creator
    } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items são obrigatórios' }, { status: 400 });
    }

    if (!recipient || !recipient.name || !recipient.address) {
      return NextResponse.json({ error: 'Destinatário é obrigatório' }, { status: 400 });
    }

    // Generate order numbers
    const orderNumber = generateProdigiOrderNumber();
    const merchantReference = `FP-${orderNumber}`;
    const idempotencyKey = generateIdempotencyKey();

    // Build recipient for Prodigi
    const prodigiRecipient: ProdigiRecipient = {
      name: recipient.name,
      email: recipient.email,
      phoneNumber: recipient.phone,
      address: {
        line1: recipient.address.line1,
        line2: recipient.address.line2,
        townOrCity: recipient.address.city,
        stateOrCounty: recipient.address.state,
        postalOrZipCode: recipient.address.postalCode,
        countryCode: recipient.address.countryCode || 'BR',
      },
    };

    // Build order request
    const prodigiOrderRequest = buildProdigiOrder({
      merchantReference,
      recipient: prodigiRecipient,
      items: items.map((item: { sku: string; imageUrl: string; copies?: number; attributes?: Record<string, string>; sellingPriceBRL?: number }) => ({
        sku: item.sku,
        imageUrl: item.imageUrl,
        copies: item.copies || 1,
        attributes: item.attributes || {},
        customerPrice: item.sellingPriceBRL,
        customerCurrency: 'BRL',
      })),
      shippingMethod: shippingMethod as ProdigiShippingMethod,
      callbackUrl: `${WEBHOOK_BASE_URL}/api/pod/prodigi/webhooks`,
      metadata: {
        fayapointOrderNumber: orderNumber,
        customerId: user._id.toString(),
        customerEmail: user.email,
        source,
      },
    });

    // Create order in Prodigi
    console.log('[Prodigi] Creating order:', merchantReference);
    const prodigiResponse = await createOrder(prodigiOrderRequest);

    if (!prodigiResponse.order) {
      throw new Error('Prodigi did not return order object');
    }

    const prodigiOrder = prodigiResponse.order;
    console.log('[Prodigi] Order created:', prodigiOrder.id);

    // Calculate costs and commissions
    let subtotalGBP = 0;
    let shippingGBP = 0;
    
    // Get costs from charges if available
    prodigiOrder.charges?.forEach(charge => {
      if (charge.chargeType === 'Item') {
        subtotalGBP += parseFloat(charge.totalCost.amount);
      } else if (charge.chargeType === 'Shipping') {
        shippingGBP += parseFloat(charge.totalCost.amount);
      }
    });

    // If no charges yet, estimate from items
    if (subtotalGBP === 0) {
      prodigiOrder.items.forEach(item => {
        // Estimate based on typical pricing - would need actual quote for precise
        subtotalGBP += 15 * item.copies; // Placeholder
      });
    }

    const totalCostGBP = subtotalGBP + shippingGBP;
    const subtotalBRL = subtotalGBP * GBP_TO_BRL;
    const shippingBRL = shippingGBP * GBP_TO_BRL;

    // Calculate selling prices and profit
    let grandTotalBRL = 0;
    const orderItems = items.map((item: { sku: string; imageUrl: string; name?: string; copies?: number; attributes?: Record<string, string>; sellingPriceBRL?: number; baseCostGBP?: number }, index: number) => {
      const prodigiItem = prodigiOrder.items[index];
      const baseCostGBP = item.baseCostGBP || 15; // Estimate if not provided
      const baseCostBRL = baseCostGBP * GBP_TO_BRL;
      const sellingPriceBRL = item.sellingPriceBRL || baseCostBRL * 1.45; // 45% margin default
      const copies = item.copies || 1;
      
      const totalSellingPrice = sellingPriceBRL * copies;
      grandTotalBRL += totalSellingPrice;

      const { profit, creatorCommission, platformFee } = calculateProdigiCommissionSplit(
        totalSellingPrice,
        baseCostBRL * copies,
        70 // 70% to creator
      );

      return {
        prodigiItemId: prodigiItem?.id,
        sku: item.sku,
        name: item.name || item.sku,
        copies,
        sizing: 'fillPrintArea' as const,
        attributes: item.attributes || {},
        assetUrl: item.imageUrl,
        assetStatus: prodigiItem?.status,
        baseCostGBP: baseCostGBP * copies,
        baseCostBRL: baseCostBRL * copies,
        sellingPriceBRL: totalSellingPrice,
        profitBRL: profit,
        creatorId: creatorId ? creatorId : undefined,
        creatorCommission,
        platformFee,
      };
    });

    // Add shipping to grand total
    const shippingChargeBRL = shippingBRL * 1.1; // 10% markup
    grandTotalBRL += shippingChargeBRL;

    // Calculate delivery estimates
    const delivery = calculateEstimatedDelivery(
      shippingMethod as ProdigiShippingMethod,
      recipient.address.countryCode || 'BR'
    );
    const now = new Date();

    // Total profit and commission
    const totalProfitBRL = orderItems.reduce((sum: number, item: { profitBRL: number }) => sum + item.profitBRL, 0);
    const totalCreatorCommission = orderItems.reduce((sum: number, item: { creatorCommission: number }) => sum + item.creatorCommission, 0);
    const totalPlatformFee = orderItems.reduce((sum: number, item: { platformFee: number }) => sum + item.platformFee, 0);

    // Save order to database
    const newOrder = new ProdigiOrder({
      orderNumber,
      prodigiOrderId: prodigiOrder.id,
      prodigiMerchantReference: merchantReference,
      prodigiIdempotencyKey: idempotencyKey,
      
      customerId: user._id,
      customerEmail: user.email,
      customerName: user.name || recipient.name,
      customerPhone: recipient.phone,
      
      shippingAddress: {
        name: recipient.name,
        line1: recipient.address.line1,
        line2: recipient.address.line2,
        city: recipient.address.city,
        stateOrCounty: recipient.address.state,
        postalOrZipCode: recipient.address.postalCode,
        countryCode: recipient.address.countryCode || 'BR',
        country: recipient.address.country || 'Brasil',
        email: recipient.email,
        phone: recipient.phone,
      },
      
      items: orderItems,
      
      prodigiStatus: prodigiOrder.status,
      status: mapProdigiStatusToInternal(
        prodigiOrder.status.stage,
        prodigiOrder.status.details
      ),
      paymentStatus: 'pending',
      
      shippingMethod,
      shipments: [],
      charges: prodigiOrder.charges?.map(c => ({
        prodigiChargeId: c.id,
        chargeType: c.chargeType,
        invoiceNumber: c.prodigiInvoiceNumber,
        amount: parseFloat(c.totalCost.amount),
        currency: c.totalCost.currency,
      })) || [],
      
      subtotalGBP,
      shippingGBP,
      totalCostGBP,
      
      subtotalBRL,
      shippingBRL: shippingChargeBRL,
      taxBRL: 0,
      discountBRL: 0,
      grandTotalBRL,
      
      totalProfitBRL,
      totalCreatorCommission,
      totalPlatformFee,
      commissionRate: 70,
      
      creatorId: creatorId || undefined,
      source,
      
      callbackUrl: `${WEBHOOK_BASE_URL}/api/pod/prodigi/webhooks`,
      
      estimatedDeliveryMin: new Date(now.getTime() + delivery.minDays * 24 * 60 * 60 * 1000),
      estimatedDeliveryMax: new Date(now.getTime() + delivery.maxDays * 24 * 60 * 60 * 1000),
      
      customerNotes,
      metadata: {
        prodigiOutcome: prodigiResponse.outcome,
      },
    });

    await newOrder.save();

    return NextResponse.json({
      success: true,
      message: 'Pedido criado com sucesso',
      order: {
        _id: newOrder._id,
        orderNumber: newOrder.orderNumber,
        prodigiOrderId: newOrder.prodigiOrderId,
        status: newOrder.status,
        grandTotalBRL: newOrder.grandTotalBRL,
        estimatedDelivery: {
          minDays: delivery.minDays,
          maxDays: delivery.maxDays,
          minDate: newOrder.estimatedDeliveryMin,
          maxDate: newOrder.estimatedDeliveryMax,
        },
        items: newOrder.items.length,
      },
    });
  } catch (error) {
    console.error('[Prodigi Orders] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar pedido' },
      { status: 500 }
    );
  }
}

// PUT - Update order (cancel, etc.)
export async function PUT(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await getUserFromToken(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { orderId, action } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório' }, { status: 400 });
    }

    const order = await ProdigiOrder.findOne({
      _id: orderId,
      $or: [{ customerId: user._id }, { creatorId: user._id }],
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Handle cancel action
    if (action === 'cancel') {
      if (!order.prodigiOrderId) {
        return NextResponse.json({ error: 'Pedido não pode ser cancelado' }, { status: 400 });
      }

      // Cancel in Prodigi
      try {
        await cancelOrder(order.prodigiOrderId);
        
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.prodigiStatus.stage = 'Cancelled';
        await order.save();

        return NextResponse.json({
          success: true,
          message: 'Pedido cancelado com sucesso',
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
          },
        });
      } catch (cancelError) {
        console.error('[Prodigi] Cancel error:', cancelError);
        return NextResponse.json(
          { error: 'Não foi possível cancelar o pedido. O pedido pode já estar em produção.' },
          { status: 400 }
        );
      }
    }

    // Handle sync action (refresh status from Prodigi)
    if (action === 'sync') {
      if (!order.prodigiOrderId) {
        return NextResponse.json({ error: 'Pedido não tem ID Prodigi' }, { status: 400 });
      }

      const prodigiResponse = await getOrder(order.prodigiOrderId);
      if (!prodigiResponse.order) {
        return NextResponse.json({ error: 'Pedido não encontrado no Prodigi' }, { status: 404 });
      }

      const prodigiOrder = prodigiResponse.order;

      order.prodigiStatus = prodigiOrder.status;
      order.status = mapProdigiStatusToInternal(
        prodigiOrder.status.stage,
        prodigiOrder.status.details
      );
      
      // Update shipments
      if (prodigiOrder.shipments?.length) {
        order.shipments = prodigiOrder.shipments.map(s => ({
          prodigiShipmentId: s.id,
          status: s.status,
          carrier: s.carrier,
          trackingNumber: s.tracking?.number,
          trackingUrl: s.tracking?.url,
          dispatchDate: s.dispatchDate ? new Date(s.dispatchDate) : undefined,
          fulfillmentLocation: s.fulfillmentLocation,
          items: s.items.map(i => i.itemId),
        }));

        // Update shipped date if shipped
        if (order.status === 'shipped' && !order.shippedAt) {
          order.shippedAt = new Date();
        }
      }

      // Update charges
      if (prodigiOrder.charges?.length) {
        order.charges = prodigiOrder.charges.map(c => ({
          prodigiChargeId: c.id,
          chargeType: c.chargeType,
          invoiceNumber: c.prodigiInvoiceNumber,
          amount: parseFloat(c.totalCost.amount),
          currency: c.totalCost.currency,
        }));
      }

      await order.save();

      return NextResponse.json({
        success: true,
        message: 'Status atualizado',
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          prodigiStatus: order.prodigiStatus,
          shipments: order.shipments,
        },
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('[Prodigi Orders] Update error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    );
  }
}
