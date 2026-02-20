import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Payment, { mapPaymentMethodToAsaasBillingType, PaymentMethod } from '@/models/Payment';
import User from '@/models/User';
import asaas, { 
  getOrCreateCustomer, 
  createPixPayment, 
  createBoletoPayment,
  createCreditCardPayment,
  createUndefinedPayment,
  getPixQrCode,
  getBoletoIdentification,
  AsaasCreditCard,
  AsaasCreditCardHolderInfo,
  cleanCpfCnpj,
  isValidCpf,
  isValidCnpj,
  asaasConfig,
} from '@/lib/asaas';

const JWT_SECRET = process.env.JWT_SECRET || 'fayapoint-secret';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    await dbConnect();
    const user = await User.findById(decoded.id);
    return user;
  } catch {
    return null;
  }
}

// =============================================================================
// POST - Create Payment
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check if Asaas is configured
    if (!asaasConfig.isConfigured) {
      return NextResponse.json(
        { error: 'Gateway de pagamento não configurado' },
        { status: 503 }
      );
    }

    // Authenticate user
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      items,
      method,
      cpfCnpj,
      phone,
      address,
      creditCard,
      installments,
    } = body as {
      items: Array<{
        id?: string;
        slug?: string;
        type: 'course' | 'service' | 'subscription' | 'product' | 'pod';
        name: string;
        description?: string;
        quantity: number;
        price: number;
      }>;
      method: PaymentMethod;
      cpfCnpj?: string;
      phone?: string;
      address?: {
        postalCode?: string;
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
      };
      creditCard?: {
        holderName: string;
        number: string;
        expiryMonth: string;
        expiryYear: string;
        ccv: string;
      };
      installments?: number;
    };

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum item no carrinho' },
        { status: 400 }
      );
    }

    // Validate CPF/CNPJ for Brazilian payments
    const cleanedCpfCnpj = cpfCnpj ? cleanCpfCnpj(cpfCnpj) : '';
    if (cleanedCpfCnpj) {
      const isValid = cleanedCpfCnpj.length === 11 
        ? isValidCpf(cleanedCpfCnpj)
        : isValidCnpj(cleanedCpfCnpj);
      
      if (!isValid) {
        return NextResponse.json(
          { error: 'CPF/CNPJ inválido' },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal; // Add discounts/fees logic here if needed

    // Generate order number
    const orderNumber = await (Payment as typeof Payment & { generateOrderNumber: () => Promise<string> }).generateOrderNumber();

    // Prepare items for storage
    const paymentItems = items.map(item => ({
      productId: item.id,
      productSlug: item.slug,
      type: item.type,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity,
    }));

    // Create or get Asaas customer
    let asaasCustomer;
    try {
      asaasCustomer = await getOrCreateCustomer({
        name: user.name,
        email: user.email,
        cpfCnpj: cleanedCpfCnpj || '00000000000', // Fallback for required field
        phone: phone,
        mobilePhone: phone,
        externalReference: String(user._id),
        address: address?.street,
        addressNumber: address?.number,
        complement: address?.complement,
        province: address?.neighborhood,
        postalCode: address?.postalCode,
      });
    } catch (error) {
      console.error('[Payment] Error creating Asaas customer:', error);
      return NextResponse.json(
        { error: 'Erro ao criar cliente no gateway de pagamento' },
        { status: 500 }
      );
    }

    // Create payment in Asaas
    let asaasPayment;
    const description = `Pedido ${orderNumber} - ${items.map(i => i.name).join(', ')}`;
    const externalReference = orderNumber;
    const successUrl = `${process.env.NEXTAUTH_URL || 'https://fayai.shop'}/pt-BR/checkout/success?order=${orderNumber}`;

    try {
      switch (method) {
        case 'pix':
          asaasPayment = await createPixPayment(asaasCustomer.id!, total, {
            description,
            externalReference,
            callback: { successUrl, autoRedirect: true },
          });
          break;

        case 'boleto':
          asaasPayment = await createBoletoPayment(asaasCustomer.id!, total, {
            description,
            externalReference,
            callback: { successUrl, autoRedirect: true },
            // Add 5% discount for payment within 3 days
            discount: { value: 5, dueDateLimitDays: 3, type: 'PERCENTAGE' },
            // 2% monthly interest after due date
            interest: { value: 2 },
            // 1% fine for late payment
            fine: { value: 1, type: 'PERCENTAGE' },
          });
          break;

        case 'credit_card':
          if (!creditCard || !address) {
            return NextResponse.json(
              { error: 'Dados do cartão e endereço são obrigatórios' },
              { status: 400 }
            );
          }

          const cardData: AsaasCreditCard = {
            holderName: creditCard.holderName,
            number: creditCard.number.replace(/\D/g, ''),
            expiryMonth: creditCard.expiryMonth,
            expiryYear: creditCard.expiryYear,
            ccv: creditCard.ccv,
          };

          const holderInfo: AsaasCreditCardHolderInfo = {
            name: creditCard.holderName,
            email: user.email,
            cpfCnpj: cleanedCpfCnpj,
            postalCode: address.postalCode || '',
            addressNumber: address.number || '',
            addressComplement: address.complement,
            phone: phone,
            mobilePhone: phone,
          };

          asaasPayment = await createCreditCardPayment(
            asaasCustomer.id!,
            total,
            cardData,
            holderInfo,
            {
              description,
              externalReference,
              installmentCount: installments && installments > 1 ? installments : undefined,
              installmentValue: installments && installments > 1 ? total / installments : undefined,
              callback: { successUrl, autoRedirect: true },
            }
          );
          break;

        case 'undefined':
        default:
          // Let customer choose payment method via Asaas checkout
          asaasPayment = await createUndefinedPayment(asaasCustomer.id!, total, {
            description,
            externalReference,
            callback: { successUrl, autoRedirect: true },
          });
          break;
      }
    } catch (error) {
      console.error('[Payment] Error creating Asaas payment:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao criar cobrança' },
        { status: 500 }
      );
    }

    // Get PIX QR Code or Boleto data
    let pixData;
    let boletoData;

    if (method === 'pix' && asaasPayment.id) {
      try {
        const qrCode = await getPixQrCode(asaasPayment.id);
        pixData = {
          qrCodeBase64: qrCode.encodedImage,
          qrCodePayload: qrCode.payload,
          expirationDate: new Date(qrCode.expirationDate),
        };
      } catch (error) {
        console.error('[Payment] Error getting PIX QR Code:', error);
      }
    }

    if (method === 'boleto' && asaasPayment.id) {
      try {
        const boleto = await getBoletoIdentification(asaasPayment.id);
        boletoData = {
          barCode: boleto.barCode,
          digitableLine: boleto.identificationField,
          bankSlipUrl: asaasPayment.bankSlipUrl,
          dueDate: new Date(asaasPayment.dueDate),
        };
      } catch (error) {
        console.error('[Payment] Error getting boleto data:', error);
      }
    }

    // Credit card data (masked)
    let creditCardData;
    if (method === 'credit_card' && creditCard) {
      creditCardData = {
        lastFourDigits: creditCard.number.slice(-4),
        holderName: creditCard.holderName,
        installments: installments || 1,
        installmentValue: installments ? total / installments : total,
      };
    }

    // Save payment to database
    const payment = new Payment({
      orderNumber,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (user as any)._id,
      userEmail: user.email,
      userName: user.name,
      customerCpfCnpj: cleanedCpfCnpj,
      customerPhone: phone,
      customerAddress: address,
      provider: 'asaas',
      providerPaymentId: asaasPayment.id,
      providerCustomerId: asaasCustomer.id,
      method,
      status: asaasPayment.status === 'CONFIRMED' || asaasPayment.status === 'RECEIVED' 
        ? 'paid' 
        : 'pending',
      items: paymentItems,
      subtotal,
      discount: 0,
      fees: 0,
      total,
      currency: 'BRL',
      pixData,
      boletoData,
      creditCardData,
      paymentUrl: asaasPayment.invoiceUrl,
      invoiceUrl: asaasPayment.invoiceUrl,
      externalReference: orderNumber,
      source: 'checkout',
      webhookEvents: [{
        event: 'PAYMENT_CREATED',
        receivedAt: new Date(),
        data: { asaasPaymentId: asaasPayment.id },
      }],
    });

    await payment.save();

    // Save billing info to user profile for autofill
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDoc = user as any;
    if (!userDoc.billing) userDoc.billing = {};
    
    // Only save if we have new data
    if (cleanedCpfCnpj && !userDoc.billing.cpfCnpj) {
      userDoc.billing.cpfCnpj = cleanedCpfCnpj;
    }
    if (phone && !userDoc.billing.phone) {
      userDoc.billing.phone = phone;
    }
    if (address?.postalCode && !userDoc.billing.postalCode) {
      userDoc.billing.postalCode = address.postalCode;
    }
    if (address?.number && !userDoc.billing.addressNumber) {
      userDoc.billing.addressNumber = address.number;
    }
    if (address?.street && !userDoc.billing.address) {
      userDoc.billing.address = address.street;
    }
    if (address?.city && !userDoc.billing.city) {
      userDoc.billing.city = address.city;
    }
    if (address?.state && !userDoc.billing.state) {
      userDoc.billing.state = address.state;
    }
    // Always update Asaas customer ID
    if (asaasCustomer.id) {
      userDoc.billing.asaasCustomerId = asaasCustomer.id;
    }
    
    // Save user with billing info
    try {
      await userDoc.save();
    } catch (error) {
      console.error('[Payment] Error saving user billing info:', error);
      // Don't fail the payment, just log
    }

    // Return response
    return NextResponse.json({
      success: true,
      orderNumber,
      paymentId: payment._id,
      status: payment.status,
      method,
      total,
      paymentUrl: asaasPayment.invoiceUrl,
      pixData: pixData ? {
        qrCodeBase64: pixData.qrCodeBase64,
        qrCodePayload: pixData.qrCodePayload,
        expirationDate: pixData.expirationDate,
      } : undefined,
      boletoData: boletoData ? {
        barCode: boletoData.barCode,
        digitableLine: boletoData.digitableLine,
        bankSlipUrl: boletoData.bankSlipUrl,
        dueDate: boletoData.dueDate,
      } : undefined,
      // For credit card, payment might be immediately confirmed
      isPaid: payment.status === 'paid',
    });

  } catch (error) {
    console.error('[Payment] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Get User Payments
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { userId: (user as any)._id };
    if (status) query.status = status;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Payment.countDocuments(query),
    ]);

    return NextResponse.json({
      payments,
      total,
      hasMore: skip + payments.length < total,
    });

  } catch (error) {
    console.error('[Payment] GET Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
