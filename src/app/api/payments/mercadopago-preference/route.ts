import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { createMPPreference, mpConfig } from '@/lib/mercadopago';
import { SUBSCRIPTION_PLANS } from '@/models/Subscription';
import Payment, { type IPaymentItem } from '@/models/Payment';
import {
  calculateCheckoutSubtotal,
  CheckoutCatalogError,
  resolveCheckoutItems,
} from '@/lib/checkout-catalog';

// Plan details for rich MP checkout
const PLAN_DETAILS: Record<string, {
  emoji: string;
  features: string[];
  pictureUrl: string;
}> = {
  explorador: {
    emoji: '🧭',
    features: ['3 cursos iniciantes/mês', '100 créditos IA', 'Certificados verificáveis', '10% desconto'],
    pictureUrl: 'https://fayai.com.br/images/plans/explorador-thumb.png',
  },
  profissional: {
    emoji: '🚀',
    features: ['8 cursos todos os níveis/mês', '300 créditos IA', 'Suporte prioritário', '20% desconto'],
    pictureUrl: 'https://fayai.com.br/images/plans/profissional-thumb.png',
  },
  expert: {
    emoji: '👑',
    features: ['14 cursos todos os níveis/mês', '800 créditos IA', 'Suporte VIP', '50% desconto', 'Consultoria mensal'],
    pictureUrl: 'https://fayai.com.br/images/plans/expert-thumb.png',
  },
};

/**
 * POST /api/payments/mercadopago-preference
 * Creates a MercadoPago Checkout Pro preference and returns the redirect URL.
 * Used when user chooses "MercadoPago" as payment method in checkout.
 */
export async function POST(request: NextRequest) {
  try {
    if (!mpConfig.isConfigured) {
      return NextResponse.json(
        { error: 'MercadoPago não configurado' },
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
    const { planSlug, cycle = 'monthly', items } = body as {
      planSlug?: string;
      cycle?: 'monthly' | 'yearly';
      items?: unknown;
    };

    let checkoutItems: IPaymentItem[];
    let checkoutTitle: string;
    let checkoutDescription: string;
    let pictureUrl = 'https://fayai.com.br/images/fayai-logo-social.png';

    if (Array.isArray(items)) {
      checkoutItems = await resolveCheckoutItems(items);
      checkoutTitle = checkoutItems.length === 1
        ? checkoutItems[0].name
        : `Pedido FayAi (${checkoutItems.length} itens)`;
      checkoutDescription = checkoutItems.map((item) => item.name).join(' • ');
    } else {
      if (cycle !== 'monthly' && cycle !== 'yearly') {
        return NextResponse.json({ error: 'Ciclo do plano inválido' }, { status: 400 });
      }

      const plan = SUBSCRIPTION_PLANS[planSlug as keyof typeof SUBSCRIPTION_PLANS];
      if (!plan) {
        return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
      }

      // Price and plan name always come from the server-side plan table.
      const canonicalSlug = plan.slug;
      const price = cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
      const cycleLabel = cycle === 'yearly' ? 'Anual' : 'Mensal';
      const planDetail = PLAN_DETAILS[canonicalSlug];
      pictureUrl = planDetail?.pictureUrl || pictureUrl;

      const featureList = planDetail?.features.join(' • ') || '';
      checkoutTitle = `FayAi ${plan.name} — ${cycleLabel}`;
      checkoutDescription = [
        `Assinatura FayAi Academia de IA — Plano ${plan.name} (${cycleLabel})`,
        featureList ? `Inclui: ${featureList}` : '',
        'Acesso imediato após pagamento. Garantia de 7 dias.',
      ].filter(Boolean).join('. ');
      checkoutItems = [{
        productId: `${canonicalSlug}:${cycle}`,
        productSlug: canonicalSlug,
        type: 'subscription',
        name: checkoutTitle,
        description: checkoutDescription,
        quantity: 1,
        unitPrice: price,
        totalPrice: price,
      }];
    }

    const total = calculateCheckoutSubtotal(checkoutItems);
    const orderNumber = await Payment.generateOrderNumber();

    // Persist the authoritative order before creating an external checkout so
    // a very fast webhook can always find its local payment record.
    const payment = await Payment.create({
      orderNumber,
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      provider: 'mercadopago',
      method: 'undefined',
      status: 'pending',
      items: checkoutItems,
      subtotal: total,
      discount: 0,
      fees: 0,
      total,
      currency: 'BRL',
      externalReference: orderNumber,
      source: 'mercadopago_checkout_pro',
      webhookEvents: [{
        event: 'MP_PREFERENCE_REQUESTED',
        receivedAt: new Date(),
      }],
    });

    let preference;
    try {
      preference = await createMPPreference(
        [
          {
            title: checkoutTitle,
            description: checkoutDescription,
            quantity: 1,
            unitPrice: total,
            pictureUrl,
          },
        ],
        {
          externalReference: orderNumber,
          payerEmail: user.email,
        }
      );
      payment.webhookEvents.push({
        event: 'MP_PREFERENCE_CREATED',
        receivedAt: new Date(),
        data: { preferenceId: preference.preferenceId },
      });
      await payment.save();
    } catch (error) {
      payment.status = 'failed';
      payment.notes = error instanceof Error ? error.message : 'Falha ao criar preferência';
      payment.webhookEvents.push({
        event: 'MP_PREFERENCE_FAILED',
        receivedAt: new Date(),
      });
      await payment.save();
      throw error;
    }

    const redirectUrl = mpConfig.isSandbox
      ? preference.sandboxInitPoint
      : preference.initPoint;

    return NextResponse.json({
      success: true,
      orderNumber,
      paymentId: payment._id,
      total,
      preferenceId: preference.preferenceId,
      redirectUrl,
    });
  } catch (error) {
    if (error instanceof CheckoutCatalogError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('[MP Preference] Error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: `Erro ao criar preferência MercadoPago: ${errorMsg}` },
      { status: 500 }
    );
  }
}
