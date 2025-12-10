import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import asaas, {
  createInvoice,
  listInvoices,
  getInvoice,
  authorizeInvoice,
  cancelInvoice,
  asaasConfig,
  getDefaultDueDate,
} from '@/lib/asaas';

const JWT_SECRET = process.env.JWT_SECRET || 'fayapoint-secret';

// Default tax configuration for services
const DEFAULT_TAXES = {
  retainIss: false,
  cofins: 0,
  csll: 0,
  inss: 0,
  ir: 0,
  pis: 0,
  iss: 5.0, // 5% ISS for most services
};

// Municipal service for software/consulting
const DEFAULT_MUNICIPAL_SERVICE = {
  municipalServiceCode: '1.01',
  municipalServiceName: 'Análise e desenvolvimento de sistemas',
};

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
    if (user?.role !== 'admin') return null;
    return user;
  } catch {
    return null;
  }
}

// =============================================================================
// POST - Create Invoice (NFS-e)
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
        { error: 'Apenas administradores podem criar notas fiscais' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      paymentId,
      serviceDescription,
      observations,
      value,
      effectiveDate,
      taxes = DEFAULT_TAXES,
      municipalServiceCode = DEFAULT_MUNICIPAL_SERVICE.municipalServiceCode,
      municipalServiceName = DEFAULT_MUNICIPAL_SERVICE.municipalServiceName,
      deductions = 0,
      autoAuthorize = true,
    } = body as {
      paymentId?: string;
      serviceDescription: string;
      observations: string;
      value: number;
      effectiveDate?: string;
      taxes?: typeof DEFAULT_TAXES;
      municipalServiceCode?: string;
      municipalServiceName?: string;
      deductions?: number;
      autoAuthorize?: boolean;
    };

    if (!serviceDescription || !observations || !value) {
      return NextResponse.json(
        { error: 'Descrição do serviço, observações e valor são obrigatórios' },
        { status: 400 }
      );
    }

    // Build invoice data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoiceData: any = {
      serviceDescription,
      observations,
      value,
      deductions,
      effectiveDate: effectiveDate || getDefaultDueDate(0),
      municipalServiceCode,
      municipalServiceName,
      taxes,
    };

    // Link to payment if provided
    if (paymentId) {
      // Find our payment record to get Asaas payment ID
      await dbConnect();
      const payment = await Payment.findById(paymentId);
      if (payment?.providerPaymentId) {
        invoiceData.payment = payment.providerPaymentId;
      }
    }

    // Create invoice in Asaas
    try {
      let invoice = await createInvoice(invoiceData);

      // Auto-authorize if requested
      if (autoAuthorize && invoice.status === 'SCHEDULED') {
        invoice = await authorizeInvoice(invoice.id);
      }

      return NextResponse.json({
        success: true,
        invoice: {
          id: invoice.id,
          status: invoice.status,
          statusDescription: invoice.statusDescription,
          value: invoice.value,
          effectiveDate: invoice.effectiveDate,
          serviceDescription: invoice.serviceDescription,
          pdfUrl: invoice.pdfUrl,
          xmlUrl: invoice.xmlUrl,
          number: invoice.number,
          validationCode: invoice.validationCode,
        },
      });

    } catch (error) {
      console.error('[Invoices] Create error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao criar nota fiscal' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Invoices] POST Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - List Invoices
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
        { error: 'Apenas administradores podem listar notas fiscais' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'SCHEDULED' | 'AUTHORIZED' | 'CANCELED' | 'ERROR' | null;
    const payment = searchParams.get('payment');
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    const options: {
      status?: 'SCHEDULED' | 'AUTHORIZED' | 'PROCESSING_CANCELLATION' | 'CANCELED' | 'CANCELLATION_DENIED' | 'ERROR';
      payment?: string;
      offset?: number;
      limit?: number;
    } = {
      offset,
      limit,
    };

    if (status) options.status = status;
    if (payment) options.payment = payment;

    try {
      const result = await listInvoices(options);

      return NextResponse.json({
        invoices: result.data.map(invoice => ({
          id: invoice.id,
          status: invoice.status,
          statusDescription: invoice.statusDescription,
          value: invoice.value,
          effectiveDate: invoice.effectiveDate,
          serviceDescription: invoice.serviceDescription,
          pdfUrl: invoice.pdfUrl,
          xmlUrl: invoice.xmlUrl,
          number: invoice.number,
          validationCode: invoice.validationCode,
          payment: invoice.payment,
        })),
        totalCount: result.totalCount,
        hasMore: offset + result.data.length < result.totalCount,
      });

    } catch (error) {
      console.error('[Invoices] List error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao listar notas fiscais' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Invoices] GET Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
