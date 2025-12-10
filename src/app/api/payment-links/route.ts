import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import asaas, {
  createPaymentLink,
  listPaymentLinks,
  asaasConfig,
} from '@/lib/asaas';

const JWT_SECRET = process.env.JWT_SECRET || 'fayapoint-secret';

// =============================================================================
// HELPER
// =============================================================================

async function getAdminFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    await dbConnect();
    const user = await User.findById(decoded.id);
    // Only admins can manage payment links
    if (user?.role !== 'admin') return null;
    return user;
  } catch {
    return null;
  }
}

// =============================================================================
// POST - Create Payment Link
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    if (!asaasConfig.isConfigured) {
      return NextResponse.json(
        { error: 'Gateway de pagamento não configurado' },
        { status: 503 }
      );
    }

    const admin = await getAdminFromToken(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar links de pagamento' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      value,
      billingType = 'UNDEFINED',
      chargeType = 'DETACHED',
      endDate,
      dueDateLimitDays = 10,
      subscriptionCycle,
      maxInstallmentCount = 12,
      externalReference,
      notificationEnabled = true,
      isAddressRequired = false,
      successUrl,
    } = body as {
      name: string;
      description?: string;
      value?: number;
      billingType?: 'UNDEFINED' | 'BOLETO' | 'CREDIT_CARD' | 'PIX';
      chargeType?: 'DETACHED' | 'RECURRENT' | 'INSTALLMENT';
      endDate?: string;
      dueDateLimitDays?: number;
      subscriptionCycle?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
      maxInstallmentCount?: number;
      externalReference?: string;
      notificationEnabled?: boolean;
      isAddressRequired?: boolean;
      successUrl?: string;
    };

    if (!name) {
      return NextResponse.json(
        { error: 'Nome do link é obrigatório' },
        { status: 400 }
      );
    }

    // Build payment link data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const linkData: any = {
      name,
      description,
      billingType,
      chargeType,
      dueDateLimitDays,
      notificationEnabled,
      isAddressRequired,
    };

    if (value) linkData.value = value;
    if (endDate) linkData.endDate = endDate;
    if (externalReference) linkData.externalReference = externalReference;

    // Add cycle for recurring payments
    if (chargeType === 'RECURRENT' && subscriptionCycle) {
      linkData.subscriptionCycle = subscriptionCycle;
    }

    // Add max installments for installment payments
    if (chargeType === 'INSTALLMENT') {
      linkData.maxInstallmentCount = maxInstallmentCount;
    }

    // Add success callback
    if (successUrl) {
      linkData.callback = {
        successUrl,
        autoRedirect: true,
      };
    }

    // Create payment link in Asaas
    try {
      const paymentLink = await createPaymentLink(linkData);

      return NextResponse.json({
        success: true,
        paymentLink: {
          id: paymentLink.id,
          name: paymentLink.name,
          description: paymentLink.description,
          value: paymentLink.value,
          url: paymentLink.url,
          active: paymentLink.active,
          chargeType: paymentLink.chargeType,
          billingType: paymentLink.billingType,
          viewCount: paymentLink.viewCount,
        },
      });

    } catch (error) {
      console.error('[PaymentLinks] Create error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao criar link de pagamento' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[PaymentLinks] POST Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - List Payment Links
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    if (!asaasConfig.isConfigured) {
      return NextResponse.json(
        { error: 'Gateway de pagamento não configurado' },
        { status: 503 }
      );
    }

    const admin = await getAdminFromToken(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem listar links de pagamento' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    const options: { active?: boolean; offset?: number; limit?: number } = {
      offset,
      limit,
    };

    if (active !== null) {
      options.active = active === 'true';
    }

    try {
      const result = await listPaymentLinks(options);

      return NextResponse.json({
        paymentLinks: result.data.map(link => ({
          id: link.id,
          name: link.name,
          description: link.description,
          value: link.value,
          url: link.url,
          active: link.active,
          chargeType: link.chargeType,
          billingType: link.billingType,
          viewCount: link.viewCount,
          deleted: link.deleted,
          endDate: link.endDate,
        })),
        totalCount: result.totalCount,
        hasMore: offset + result.data.length < result.totalCount,
      });

    } catch (error) {
      console.error('[PaymentLinks] List error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao listar links' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[PaymentLinks] GET Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
