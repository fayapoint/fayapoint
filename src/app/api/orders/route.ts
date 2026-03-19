import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Order, { IOrderItem } from '@/models/Order';
import User from '@/models/User';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

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
    const { items, totalAmount, discountAmount, couponCode, paymentMethod, shippingAddress, notes } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Itens do pedido são obrigatórios' },
        { status: 400 }
      );
    }

    // Validate each item
    const validatedItems: IOrderItem[] = items.map((item: IOrderItem) => ({
      id: item.id,
      type: item.type,
      name: item.name,
      quantity: item.quantity || 1,
      price: item.price,
      image: item.image,
      details: item.details,
    }));

    // Create order
    const order = await Order.create({
      userId: new mongoose.Types.ObjectId(authUser.id),
      userEmail: user.email,
      userName: user.name,
      items: validatedItems,
      totalAmount,
      discountAmount: discountAmount || 0,
      couponCode,
      status: 'pending',
      paymentMethod,
      shippingAddress,
      notes,
    });

    // Update stock for store products (type: 'product')
    const storeProductsCol = mongoose.connection.db?.collection('storeproducts');
    if (storeProductsCol) {
      for (const item of validatedItems) {
        if (item.type === 'product' && item.id) {
          try {
            // Try to update by ObjectId first
            const filter = ObjectId.isValid(item.id) 
              ? { _id: new ObjectId(item.id) }
              : { slug: item.id };
            await storeProductsCol.updateOne(
              filter,
              { 
                $inc: { 
                  stock: -(item.quantity || 1),
                  soldCount: (item.quantity || 1)
                }
              }
            );
          } catch (stockError) {
            console.error('Error updating stock for product:', item.id, stockError);
          }
        }
      }
    }

    // Award XP for purchase (10 XP per R$100 spent)
    const xpAwarded = Math.floor(totalAmount / 100) * 10;
    if (xpAwarded > 0) {
      await User.findByIdAndUpdate(authUser.id, {
        $inc: { xp: xpAwarded }
      });
    }

    return NextResponse.json({
      success: true,
      order: {
        _id: order._id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      },
      xpAwarded,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    );
  }
}
