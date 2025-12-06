import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order, { IOrderItem } from '@/models/Order';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Helper to verify auth token
async function verifyAuth(): Promise<{ userId: string; error?: never } | { error: NextResponse; userId?: never }> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    if (!decoded.id) {
      return {
        error: NextResponse.json({ error: 'Token inválido' }, { status: 401 })
      };
    }
    return { userId: decoded.id };
  } catch {
    return {
      error: NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    };
  }
}

// GET - Fetch user's orders
export async function GET() {
  try {
    const auth = await verifyAuth();
    if (auth.error) return auth.error;

    await dbConnect();

    const orders = await Order.find({ userId: auth.userId })
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
    const auth = await verifyAuth();
    if (auth.error) return auth.error;

    await dbConnect();

    // Get user details
    const user = await User.findById(auth.userId);
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
      userId: new mongoose.Types.ObjectId(auth.userId),
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
      await User.findByIdAndUpdate(auth.userId, {
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
