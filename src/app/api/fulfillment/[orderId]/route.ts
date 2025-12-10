import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FulfillmentOrder from '@/models/FulfillmentOrder';
import { updateTracking, markDelivered } from '@/lib/fulfillment';
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
// GET - Get fulfillment order details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Find by order ID or order number
    const fulfillmentOrder = await FulfillmentOrder.findOne({
      $or: [
        { _id: orderId },
        { orderNumber: orderId },
      ],
    });
    
    if (!fulfillmentOrder) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }
    
    // Check user has access (owner or admin)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((fulfillmentOrder as any).userId.toString() !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      order: {
        orderNumber: fulfillmentOrder.orderNumber,
        status: fulfillmentOrder.status,
        deliveryType: fulfillmentOrder.deliveryType,
        items: fulfillmentOrder.items,
        timeline: fulfillmentOrder.timeline,
        shipping: fulfillmentOrder.shipping,
        digitalDelivery: fulfillmentOrder.digitalDelivery,
        supplierOrders: fulfillmentOrder.supplierOrders.map(so => ({
          provider: so.provider,
          providerStatus: so.providerStatus,
          submittedAt: so.submittedAt,
          estimatedShipDate: so.estimatedShipDate,
        })),
        createdAt: fulfillmentOrder.createdAt,
        processedAt: fulfillmentOrder.processedAt,
        completedAt: fulfillmentOrder.completedAt,
      },
    });
    
  } catch (error) {
    console.error('[Fulfillment API] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedido' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT - Update fulfillment order (admin only)
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const body = await request.json();
    const { action, trackingInfo, status } = body;
    
    await dbConnect();
    
    switch (action) {
      case 'update_tracking':
        if (!trackingInfo) {
          return NextResponse.json(
            { error: 'Informações de rastreio são obrigatórias' },
            { status: 400 }
          );
        }
        
        const trackingResult = await updateTracking(orderId, trackingInfo);
        return NextResponse.json(trackingResult);
        
      case 'mark_delivered':
        const deliveredResult = await markDelivered(orderId);
        return NextResponse.json(deliveredResult);
        
      case 'update_status':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fulfillmentOrder = await FulfillmentOrder.findById(orderId) as any;
        if (!fulfillmentOrder) {
          return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
        }
        
        await fulfillmentOrder.updateStatus(status, `Status atualizado para ${status}`);
        
        return NextResponse.json({
          success: true,
          status: fulfillmentOrder.status,
        });
        
      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('[Fulfillment API] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    );
  }
}
