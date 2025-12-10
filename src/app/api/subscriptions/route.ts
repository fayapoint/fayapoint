import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
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
  AsaasCreditCard,
  AsaasCreditCardHolderInfo,
  cleanCpfCnpj,
  isValidCpf,
  isValidCnpj,
  asaasConfig,
  getDefaultDueDate,
} from '@/lib/asaas';

const JWT_SECRET = process.env.JWT_SECRET || 'fayapoint-secret';

// =============================================================================
// HELPER
// =============================================================================

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

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

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
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
    const plan = SUBSCRIPTION_PLANS[planSlug as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

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
      return NextResponse.json(
        { error: 'Erro ao criar cliente no gateway' },
        { status: 500 }
      );
    }

    // Build subscription data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionData: any = {
      customer: asaasCustomer.id!,
      billingType: billingType.toUpperCase(),
      value,
      nextDueDate: getDefaultDueDate(0),
      cycle: asaasCycle,
      description: `Assinatura ${plan.name} - FayaPoint`,
      externalReference: `sub-${user._id}-${planSlug}`,
      callback: {
        successUrl: `${process.env.NEXTAUTH_URL || 'https://fayapoint.com'}/pt-BR/portal?tab=assinatura&status=success`,
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

    // Update user plan and save billing info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDoc = user as any;
    if (!userDoc.subscription) userDoc.subscription = {};
    userDoc.subscription.plan = plan.slug;
    userDoc.subscription.status = 'active';
    userDoc.subscription.expiresAt = new Date(Date.now() + (cycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
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

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription._id,
        asaasSubscriptionId: asaasSubscription.id,
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
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeAsaasData = searchParams.get('includeAsaas') === 'true';

    await dbConnect();

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
