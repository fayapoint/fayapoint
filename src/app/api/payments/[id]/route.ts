import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { getPayment as getAsaasPayment, getPixQrCode, getBoletoIdentification } from '@/lib/asaas';

const JWT_SECRET = process.env.JWT_SECRET || 'fayapoint-secret';

// =============================================================================
// HELPER
// =============================================================================

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET) as any;
    await dbConnect();
    return await User.findById(decoded.id);
  } catch {
    return null;
  }
}

// =============================================================================
// GET - Get Payment Details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    // Find payment by ID or order number
    const payment = await Payment.findOne({
      $or: [
        { _id: id },
        { orderNumber: id },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (user as any)._id,
    }).lean();

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    // If payment is pending, try to refresh data from Asaas
    if (payment.status === 'pending' && payment.providerPaymentId) {
      try {
        const asaasPayment = await getAsaasPayment(payment.providerPaymentId);
        
        // Update PIX data if needed
        if (payment.method === 'pix' && !payment.pixData?.qrCodePayload) {
          const pixQrCode = await getPixQrCode(payment.providerPaymentId);
          payment.pixData = {
            qrCodeBase64: pixQrCode.encodedImage,
            qrCodePayload: pixQrCode.payload,
            expirationDate: new Date(pixQrCode.expirationDate),
          };
        }

        // Update boleto data if needed
        if (payment.method === 'boleto' && !payment.boletoData?.digitableLine) {
          const boletoData = await getBoletoIdentification(payment.providerPaymentId);
          payment.boletoData = {
            barCode: boletoData.barCode,
            digitableLine: boletoData.identificationField,
            bankSlipUrl: asaasPayment.bankSlipUrl,
            dueDate: new Date(asaasPayment.dueDate),
          };
        }

        // Check if status changed
        if (asaasPayment.status === 'RECEIVED' || asaasPayment.status === 'CONFIRMED') {
          payment.status = 'paid';
          payment.paidAt = asaasPayment.paymentDate 
            ? new Date(asaasPayment.paymentDate) 
            : new Date();
        }
      } catch (error) {
        console.error('[Payment] Error refreshing from Asaas:', error);
      }
    }

    return NextResponse.json({
      payment: {
        id: payment._id,
        orderNumber: payment.orderNumber,
        status: payment.status,
        method: payment.method,
        items: payment.items,
        subtotal: payment.subtotal,
        discount: payment.discount,
        total: payment.total,
        currency: payment.currency,
        pixData: payment.pixData,
        boletoData: payment.boletoData,
        creditCardData: payment.creditCardData 
          ? {
              lastFourDigits: payment.creditCardData.lastFourDigits,
              installments: payment.creditCardData.installments,
              installmentValue: payment.creditCardData.installmentValue,
            }
          : undefined,
        paymentUrl: payment.paymentUrl,
        invoiceUrl: payment.invoiceUrl,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
        expiresAt: payment.expiresAt,
      },
    });

  } catch (error) {
    console.error('[Payment] GET Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// =============================================================================
// DELETE - Cancel Payment
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const payment = await Payment.findOne({
      $or: [{ _id: id }, { orderNumber: id }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (user as any)._id,
      status: 'pending',
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado ou não pode ser cancelado' },
        { status: 404 }
      );
    }

    // Cancel in Asaas if exists
    if (payment.providerPaymentId) {
      try {
        const { cancelPayment } = await import('@/lib/asaas');
        await cancelPayment(payment.providerPaymentId);
      } catch (error) {
        console.error('[Payment] Error cancelling in Asaas:', error);
      }
    }

    payment.status = 'cancelled';
    payment.cancelledAt = new Date();
    await payment.save();

    return NextResponse.json({
      success: true,
      message: 'Pagamento cancelado com sucesso',
    });

  } catch (error) {
    console.error('[Payment] DELETE Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
