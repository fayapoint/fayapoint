import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Payment, { PaymentMethod, type PaymentProvider } from '@/models/Payment';
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
import {
  createMPPayment,
  mpConfig,
  type MPPaymentMethod,
} from '@/lib/mercadopago';
import {
  calculateCheckoutSubtotal,
  CheckoutCatalogError,
  resolveCheckoutItems,
} from '@/lib/checkout-catalog';

// =============================================================================
// POST - Create Payment
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Provider selection (default: asaas, can be mercadopago)
    const requestedProvider = body.provider ?? 'asaas';
    if (requestedProvider !== 'asaas' && requestedProvider !== 'mercadopago') {
      return NextResponse.json(
        { error: 'Provedor de pagamento inválido' },
        { status: 400 }
      );
    }
    const selectedProvider: PaymentProvider = requestedProvider;
    let provider: PaymentProvider = selectedProvider;

    // Check if selected provider is configured
    if (selectedProvider === 'asaas' && !asaasConfig.isConfigured) {
      if (mpConfig.isConfigured) {
        // Auto-fallback to mercadopago
        provider = 'mercadopago';
      } else {
        return NextResponse.json(
          { error: 'Gateway de pagamento não configurado' },
          { status: 503 }
        );
      }
    }
    if (selectedProvider === 'mercadopago' && !mpConfig.isConfigured) {
      if (asaasConfig.isConfigured) {
        provider = 'asaas';
      } else {
        return NextResponse.json(
          { error: 'Gateway de pagamento não configurado' },
          { status: 503 }
        );
      }
    }
    // Authenticate user
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const {
      method,
      cpfCnpj,
      phone,
      address,
      creditCard,
      installments,
    } = body as {
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

    if (!['pix', 'boleto', 'credit_card', 'undefined'].includes(method)) {
      return NextResponse.json(
        { error: 'Forma de pagamento inválida' },
        { status: 400 }
      );
    }

    if (installments !== undefined &&
        (!Number.isInteger(installments) || installments < 1 || installments > 12)) {
      return NextResponse.json(
        { error: 'Número de parcelas inválido' },
        { status: 400 }
      );
    }

    // Resolve names, availability and prices from the server-side catalog.
    // Client-provided prices are used only to detect a stale cart.
    const paymentItems = await resolveCheckoutItems(body.items);

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
    const subtotal = calculateCheckoutSubtotal(paymentItems);
    const total = subtotal; // Add discounts/fees logic here if needed

    // Generate order number
    const orderNumber = await (Payment as typeof Payment & { generateOrderNumber: () => Promise<string> }).generateOrderNumber();

    // =================================================================
    // MERCADO PAGO FLOW
    // =================================================================
    if (provider === 'mercadopago') {
      const nameParts = user.name.split(' ');
      const mpResult = await createMPPayment(total, {
        description: `Pedido ${orderNumber} - ${paymentItems.map(i => i.name).join(', ')}`,
        externalReference: orderNumber,
        method: method === 'undefined' ? 'pix' : method as MPPaymentMethod,
        payer: {
          email: user.email,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          cpf: cleanedCpfCnpj || '00000000000',
          phone,
          address: address ? {
            zipCode: address.postalCode || '',
            street: address.street || '',
            number: address.number || '',
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
          } : undefined,
        },
        creditCard: creditCard ? {
          token: (body as any).cardToken || '',
          installments: installments || 1,
          issuerId: (body as any).issuerId || '',
          paymentMethodId: (body as any).paymentMethodId || '',
        } : undefined,
      });

      const payment = new Payment({
        orderNumber,
        userId: (user as any)._id,
        userEmail: user.email,
        userName: user.name,
        customerCpfCnpj: cleanedCpfCnpj,
        customerPhone: phone,
        customerAddress: address,
        provider: 'mercadopago',
        providerPaymentId: String(mpResult.id),
        method,
        status: mpResult.status === 'approved' ? 'paid' : 'pending',
        items: paymentItems,
        subtotal,
        discount: 0,
        fees: 0,
        total,
        currency: 'BRL',
        pixData: mpResult.pixData,
        boletoData: mpResult.boletoData,
        creditCardData: mpResult.creditCardData,
        externalReference: orderNumber,
        source: 'checkout',
        paidAt: mpResult.status === 'approved' ? new Date() : undefined,
        webhookEvents: [{
          event: 'MP_PAYMENT_CREATED',
          receivedAt: new Date(),
          data: { mpPaymentId: mpResult.id, mpStatus: mpResult.status },
        }],
      });

      await payment.save();

      return NextResponse.json({
        success: true,
        orderNumber,
        paymentId: payment._id,
        status: payment.status,
        method,
        total,
        provider: 'mercadopago',
        pixData: mpResult.pixData,
        boletoData: mpResult.boletoData,
        isPaid: payment.status === 'paid',
      });
    }

    // =================================================================
    // ASAAS FLOW (original)
    // =================================================================

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
    const description = `Pedido ${orderNumber} - ${paymentItems.map(i => i.name).join(', ')}`;
    const externalReference = orderNumber;
    // Asaas requires callback URL domain to match the domain registered in account settings
    const successUrl = `https://fayai.com.br/pt-BR/checkout/success?order=${orderNumber}`;

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
    if (error instanceof CheckoutCatalogError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
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
    const authUser = await getAuthUser();
    if (!authUser) {
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
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

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
