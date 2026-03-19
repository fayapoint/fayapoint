/**
 * POD Orders API
 * Manages orders for POD products including:
 * - List creator's orders
 * - Get order details
 * - Calculate shipping costs
 * - Track order status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import PODOrder from '@/models/PODOrder';
import { calculateShipping, getShops, sendOrderToProduction } from '@/lib/printify-api';

// GET - List orders for creator or get order details
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get single order details
    if (orderId) {
      const order = await PODOrder.findOne({
        _id: orderId,
        creatorId: authUser.id,
      }).populate('items.podProductId', 'title slug primaryMockup');

      if (!order) {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ order });
    }

    // List orders with filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { creatorId: authUser.id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      PODOrder.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.podProductId', 'title slug primaryMockup')
        .lean(),
      PODOrder.countDocuments(query),
    ]);

    // Calculate stats
    const allOrders = await PODOrder.find({ creatorId: authUser.id }).lean();
    const stats = {
      total: allOrders.length,
      pending: allOrders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length,
      inProduction: allOrders.filter(o => o.status === 'in_production').length,
      shipped: allOrders.filter(o => o.status === 'shipped').length,
      delivered: allOrders.filter(o => o.status === 'delivered').length,
      cancelled: allOrders.filter(o => ['cancelled', 'refunded'].includes(o.status)).length,
      totalRevenue: allOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0),
      totalCommission: allOrders.reduce((sum, o) => sum + (o.totalCreatorCommission || 0), 0),
      pendingCommission: allOrders
        .filter(o => !['delivered', 'cancelled', 'refunded'].includes(o.status))
        .reduce((sum, o) => sum + (o.totalCreatorCommission || 0), 0),
    };

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });

  } catch (error) {
    console.error('[Orders API] Error:', error);
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
  }
}

// POST - Calculate shipping or create sample order
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'calculate_shipping': {
        // Calculate shipping costs for given items and address
        const { items, address } = body;

        if (!items?.length || !address) {
          return NextResponse.json({ error: 'Items e endereço são obrigatórios' }, { status: 400 });
        }

        const shops = await getShops();
        if (!shops.length) {
          return NextResponse.json({ error: 'Nenhuma loja Printify configurada' }, { status: 400 });
        }

        const lineItems = items.map((item: { printifyProductId: string; printifyVariantId: number; quantity: number }) => ({
          product_id: item.printifyProductId,
          variant_id: item.printifyVariantId,
          quantity: item.quantity,
        }));

        const shippingCosts = await calculateShipping(
          shops[0].id,
          lineItems,
          {
            country: address.countryCode || 'BR',
            region: address.region || '',
            zip: address.zip || '',
          }
        );

        return NextResponse.json({
          shipping: {
            standard: shippingCosts.standard / 100, // Convert from cents
            express: shippingCosts.express / 100,
            economy: shippingCosts.economy / 100,
            printifyExpress: shippingCosts.priority / 100,
          },
          currency: 'USD',
          estimatedDelivery: {
            standard: { min: 15, max: 30 },
            express: { min: 7, max: 14 },
            economy: { min: 25, max: 45 },
            printifyExpress: { min: 5, max: 10 },
          },
        });
      }

      case 'send_to_production': {
        // Manually send order to production
        const { orderId } = body;

        if (!orderId) {
          return NextResponse.json({ error: 'ID do pedido é obrigatório' }, { status: 400 });
        }

        const order = await PODOrder.findOne({
          _id: orderId,
          creatorId: authUser.id,
        });

        if (!order) {
          return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
        }

        if (!order.printifyOrderId) {
          return NextResponse.json({ error: 'Pedido não tem ID do Printify' }, { status: 400 });
        }

        const shops = await getShops();
        if (!shops.length) {
          return NextResponse.json({ error: 'Nenhuma loja Printify configurada' }, { status: 400 });
        }

        await sendOrderToProduction(shops[0].id, order.printifyOrderId);

        order.status = 'processing';
        order.sentToProductionAt = new Date();
        await order.save();

        return NextResponse.json({
          success: true,
          message: 'Pedido enviado para produção',
          order,
        });
      }

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

  } catch (error) {
    console.error('[Orders API] Error:', error);
    return NextResponse.json({ error: 'Erro no processamento' }, { status: 500 });
  }
}
