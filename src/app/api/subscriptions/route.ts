import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Subscription, {
  SUBSCRIPTION_PLANS,
  mapAsaasCycleToSubscriptionCycle,
  mapSubscriptionCycleToAsaas,
  mapAsaasStatusToSubscriptionStatus,
} from '@/models/Subscription';
import User from '@/models/User';
import asaas, {
  getOrCreateCustomer,
  createSubscription as createAsaasSubscription,
  listSubscriptions as listAsaasSubscriptions,
  tokenizeCreditCard,
  getSubscriptionPayments,
  getPixQrCode,
  AsaasCreditCard,
  AsaasCreditCardHolderInfo,
  cleanCpfCnpj,
  isValidCpf,
  isValidCnpj,
  asaasConfig,
  getDefaultDueDate,
} from '@/lib/asaas';

// =============================================================================
// POST - Create Subscription
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    if (!asaasConfig.isConfigured) {
      return NextResponse.json(
        { error: 'Gateway de pagamento não configurado' },
        { status: 503 }
      );
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const {
      planSlug,
      cycle = 'monthly',
      billingType = 'credit_card',
      cpfCnpj,
      phone,
      address,
      creditCard,
      saveCard = true,
    } = body as {
      planSlug: string;
      cycle?: 'monthly' | 'yearly';
      billingType?: 'pix' | 'boleto' | 'credit_card';
      cpfCnpj?: string;
      phone?: string;
      address?: {
        postalCode?: string;
        number?: string;
        complement?: string;
      };
      creditCard?: {
        holderName: string;
        number: string;
        expiryMonth: string;
        expiryYear: string;
        ccv: string;
      };
      saveCard?: boolean;
    };

    // Validate plan
    console.log('[Subscription] planSlug received:', planSlug);
    console.log('[Subscription] Available plans:', Object.keys(SUBSCRIPTION_PLANS));
    
    const plan = SUBSCRIPTION_PLANS[planSlug as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan) {
      console.error('[Subscription] Invalid plan:', planSlug);
      return NextResponse.json({ error: `Plano inválido: ${planSlug}` }, { status: 400 });
    }
    
    console.log('[Subscription] Plan found:', plan.name, 'Price:', plan.monthlyPrice, '/', plan.yearlyPrice);

    // Validate CPF/CNPJ
    const cleanedCpfCnpj = cpfCnpj ? cleanCpfCnpj(cpfCnpj) : '';
    if (cleanedCpfCnpj) {
      const isValid = cleanedCpfCnpj.length === 11 
        ? isValidCpf(cleanedCpfCnpj)
        : isValidCnpj(cleanedCpfCnpj);
      
      if (!isValid) {
        return NextResponse.json({ error: 'CPF/CNPJ inválido' }, { status: 400 });
      }
    }

    // Determine price based on cycle
    const value = cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const asaasCycle = cycle === 'yearly' ? 'YEARLY' : 'MONTHLY';

    // Create or get Asaas customer
    let asaasCustomer;
    try {
      asaasCustomer = await getOrCreateCustomer({
        name: user.name,
        email: user.email,
        cpfCnpj: cleanedCpfCnpj || '00000000000',
        phone: phone,
        mobilePhone: phone,
        externalReference: String(user._id),
        postalCode: address?.postalCode,
        addressNumber: address?.number,
        complement: address?.complement,
      });
    } catch (error) {
      console.error('[Subscription] Error creating customer:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';

      // Provide user-friendly message for known errors
      const isApiKeyError = errorMsg.toLowerCase().includes('chave de api') || errorMsg.toLowerCase().includes('api key');
      const isCpfError = errorMsg.toLowerCase().includes('cpf') || errorMsg.toLowerCase().includes('cnpj');

      let userMessage = `Erro ao criar cliente no gateway: ${errorMsg}`;
      if (isApiKeyError) {
        userMessage = 'Pagamento temporariamente indisponível via Asaas. Tente usar MercadoPago como alternativa.';
      } else if (isCpfError) {
        userMessage = 'CPF/CNPJ inválido. Verifique se o número informado está correto.';
      }

      return NextResponse.json(
        { error: userMessage },
        { status: 500 }
      );
    }

    // Build subscription data
    // Asaas requires callback URL domain to match the domain in account settings.
    // Always use the canonical production domain for Asaas callbacks.
    const siteUrl = 'https://fayai.com.br';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionData: any = {
      customer: asaasCustomer.id!,
      billingType: billingType.toUpperCase(),
      value,
      nextDueDate: getDefaultDueDate(0),
      cycle: asaasCycle,
      description: `Assinatura ${plan.name} - FayAi`,
      externalReference: `sub-${user._id}-${planSlug}`,
      // Overdue settings: auto-fine + auto-cancel after 10 days
      fine: { value: 2, type: 'PERCENTAGE' },      // 2% fine for late payment
      interest: { value: 1 },                       // 1% monthly interest
      callback: {
        successUrl: `${siteUrl}/pt-BR/portal?tab=assinatura&status=success`,
        autoRedirect: true,
      },
    };

    // Add credit card data if provided
    let creditCardToken: string | undefined;
    if (billingType === 'credit_card' && creditCard && address) {
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

      // Tokenize card if requested
      if (saveCard) {
        try {
          const clientIp = request.headers.get('x-forwarded-for') || 
                          request.headers.get('x-real-ip') || 
                          '0.0.0.0';
          
          const tokenResult = await tokenizeCreditCard(
            asaasCustomer.id!,
            cardData,
            holderInfo,
            clientIp.split(',')[0].trim()
          );
          
          creditCardToken = tokenResult.creditCardToken;
          subscriptionData.creditCardToken = creditCardToken;
          subscriptionData.creditCardHolderInfo = holderInfo;
        } catch (error) {
          console.error('[Subscription] Error tokenizing card:', error);
          // Fall back to regular card data
          subscriptionData.creditCard = cardData;
          subscriptionData.creditCardHolderInfo = holderInfo;
        }
      } else {
        subscriptionData.creditCard = cardData;
        subscriptionData.creditCardHolderInfo = holderInfo;
      }
    }

    // Create subscription in Asaas
    let asaasSubscription;
    try {
      asaasSubscription = await createAsaasSubscription(subscriptionData);
    } catch (error) {
      console.error('[Subscription] Error creating subscription:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao criar assinatura' },
        { status: 500 }
      );
    }

    // Save subscription to database
    const subscription = new Subscription({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      planId: plan.id,
      planName: plan.name,
      planSlug: plan.slug,
      asaasSubscriptionId: asaasSubscription.id,
      asaasCustomerId: asaasCustomer.id!,
      status: mapAsaasStatusToSubscriptionStatus(asaasSubscription.status),
      billingType,
      value,
      cycle: mapAsaasCycleToSubscriptionCycle(asaasCycle),
      description: asaasSubscription.description,
      startDate: new Date(),
      nextDueDate: new Date(asaasSubscription.nextDueDate),
      creditCardToken,
      creditCardLastFour: creditCard?.number.slice(-4),
      creditCardBrand: undefined,
      externalReference: subscriptionData.externalReference,
      webhookEvents: [{
        event: 'SUBSCRIPTION_CREATED',
        receivedAt: new Date(),
        data: { asaasSubscriptionId: asaasSubscription.id },
      }],
    });

    await subscription.save();

    // IMPORTANT: Do NOT activate the plan here. The plan should only be
    // activated when payment is CONFIRMED via webhook (PAYMENT_RECEIVED).
    // For credit card, Asaas may auto-approve, but we still rely on webhook.
    // For PIX/Boleto, payment is definitely pending at this point.
    //
    // What we DO save: billing info (for autofill) and the Asaas customer ID
    // and subscription ID (for tracking), with status = 'pending'.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDoc = user as any;
    if (!userDoc.subscription) userDoc.subscription = {};
    userDoc.subscription.plan = 'free'; // Keep as free until payment confirmed
    userDoc.subscription.status = 'pending';
    userDoc.subscription.pendingPlan = plan.slug; // What they'll get once paid
    userDoc.subscription.asaasSubscriptionId = asaasSubscription.id;

    // Save billing info for autofill
    if (!userDoc.billing) userDoc.billing = {};
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
    if (asaasCustomer.id) {
      userDoc.billing.asaasCustomerId = asaasCustomer.id;
    }

    await userDoc.save();

    // For PIX/Boleto subscriptions, get the first payment details
    let pixData;
    let boletoData;
    let paymentUrl;
    let firstPaymentId;
    
    if (billingType === 'pix' || billingType === 'boleto') {
      try {
        // Wait a moment for Asaas to create the first payment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the first payment from the subscription
        const payments = await getSubscriptionPayments(asaasSubscription.id);
        console.log('[Subscription] First payments:', payments);
        
        if (payments.data && payments.data.length > 0) {
          const firstPayment = payments.data[0];
          firstPaymentId = firstPayment.id;
          paymentUrl = firstPayment.invoiceUrl;
          
          if (billingType === 'pix' && firstPayment.id) {
            try {
              const qrCode = await getPixQrCode(firstPayment.id);
              pixData = {
                qrCodeBase64: qrCode.encodedImage,
                qrCodePayload: qrCode.payload,
                expirationDate: qrCode.expirationDate,
              };
            } catch (pixError) {
              console.error('[Subscription] Error getting PIX QR:', pixError);
            }
          }
          
          if (billingType === 'boleto' && firstPayment.bankSlipUrl) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const paymentAny = firstPayment as any;
            boletoData = {
              barCode: paymentAny.nossoNumero || '',
              digitableLine: paymentAny.identificationField || '',
              bankSlipUrl: firstPayment.bankSlipUrl,
              dueDate: firstPayment.dueDate,
            };
          }
        }
      } catch (error) {
        console.error('[Subscription] Error fetching first payment:', error);
      }
    }

    // Generate order number for display
    const orderNumber = `SUB-${Date.now().toString(36).toUpperCase()}`;

    // Return response compatible with checkout PaymentResult
    return NextResponse.json({
      success: true,
      orderNumber,
      paymentId: subscription._id,
      status: 'pending',
      method: billingType,
      total: value,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      paymentUrl: paymentUrl || (asaasSubscription as any).paymentLink,
      pixData,
      boletoData,
      isPaid: false,
      subscription: {
        id: subscription._id,
        asaasSubscriptionId: asaasSubscription.id,
        firstPaymentId,
        plan: plan.name,
        value,
        cycle,
        status: subscription.status,
        nextDueDate: subscription.nextDueDate,
      },
    });

  } catch (error) {
    console.error('[Subscription] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Get User Subscriptions
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeAsaasData = searchParams.get('includeAsaas') === 'true';

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { userId: user._id };
    if (status) query.status = status;

    const subscriptions = await Subscription.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Optionally fetch latest data from Asaas
    if (includeAsaasData && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        try {
          const asaasData = await asaas.getSubscription(sub.asaasSubscriptionId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sub as any).asaasData = asaasData;
        } catch {
          // Ignore errors fetching Asaas data
        }
      }
    }

    // Get available plans
    const plans = Object.values(SUBSCRIPTION_PLANS);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDoc = user as any;
    
    return NextResponse.json({
      subscriptions,
      plans,
      currentPlan: userDoc.subscription?.plan || 'free',
    });

  } catch (error) {
    console.error('[Subscription] GET Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
