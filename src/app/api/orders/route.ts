import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Order, { IOrderItem } from '@/models/Order';
import User from '@/models/User';
import mongoose from 'mongoose';
import {
  calculateCheckoutSubtotal,
  calculateCheckoutOriginalSubtotal,
  CheckoutCatalogError,
  resolveCheckoutItems,
} from '@/lib/checkout-catalog';

// GET - Fetch user's orders
export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    const orders = await Order.find({ userId: authUser.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}

// POST - Create a new order
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    // Get user details
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { paymentMethod, shippingAddress, notes } = body;

    // This legacy endpoint creates only a pending order. Catalog data is still
    // resolved server-side so it cannot mint fake revenue, stock changes or XP.
    const catalogItems = await resolveCheckoutItems(body.items, {
      subscriptionPlan: user.subscription?.plan,
      subscriptionActive: user.subscription?.status === 'active',
    });
    const validatedItems: IOrderItem[] = catalogItems.map((item) => {
      if (item.type !== 'course' && item.type !== 'service' && item.type !== 'product') {
        throw new CheckoutCatalogError('Tipo de item inválido para pedido', 'INVALID_ORDER_ITEM');
      }
      return {
        id: item.productId || item.productSlug || '',
        type: item.type,
        name: item.name,
        quantity: item.quantity,
        price: item.unitPrice,
        details: item.productSlug ? { productSlug: item.productSlug } : undefined,
      };
    });
    const totalAmount = calculateCheckoutSubtotal(catalogItems);
    const originalSubtotal = calculateCheckoutOriginalSubtotal(catalogItems);

    // Create order
    const order = await Order.create({
      userId: new mongoose.Types.ObjectId(authUser.id),
      userEmail: user.email,
      userName: user.name,
      items: validatedItems,
      totalAmount,
      discountAmount: Math.round((originalSubtotal - totalAmount) * 100) / 100,
      status: 'pending',
      paymentMethod,
      shippingAddress,
      notes,
    });

    return NextResponse.json({
      success: true,
      order: {
        _id: order._id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      },
      xpAwarded: 0,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutCatalogError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    );
  }
}
