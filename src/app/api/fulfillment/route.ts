import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FulfillmentOrder from '@/models/FulfillmentOrder';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to get user from token
async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    return decoded;
  } catch {
    return null;
  }
}

// =============================================================================
// GET - List user's fulfillment orders
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    await dbConnect();
    
    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { userId: user.id };
    if (status) {
      query.status = status;
    }
    
    // Get orders with pagination
    const [orders, total] = await Promise.all([
      FulfillmentOrder.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FulfillmentOrder.countDocuments(query),
    ]);
    
    // Format response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedOrders = orders.map((order: any) => ({
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      deliveryType: order.deliveryType,
      fulfillmentType: order.fulfillmentType,
      items: order.items.map((item: { name: string; quantity: number; status: string; type: string }) => ({
        name: item.name,
        quantity: item.quantity,
        status: item.status,
        type: item.type,
      })),
      shipping: order.shipping ? {
        carrier: order.shipping.carrier,
        trackingNumber: order.shipping.trackingNumber,
        trackingUrl: order.shipping.trackingUrl,
        estimatedDelivery: order.shipping.estimatedDelivery,
      } : null,
      digitalDelivery: order.digitalDelivery,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
    }));
    
    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('[Fulfillment API] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}
