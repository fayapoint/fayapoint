import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { createMPPreference, mpConfig } from '@/lib/mercadopago';

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
    const { planSlug, planName, price, cycle } = body as {
      planSlug: string;
      planName: string;
      price: number;
      cycle?: 'monthly' | 'yearly';
    };

    if (!planSlug || !planName || !price || price <= 0) {
      return NextResponse.json({ error: 'Dados do plano inválidos' }, { status: 400 });
    }

    const externalReference = `mp-sub-${user._id}-${planSlug}-${Date.now()}`;
    const cycleLabel = cycle === 'yearly' ? 'Anual' : 'Mensal';

    const preference = await createMPPreference(
      [
        {
          title: `Plano ${planName} — ${cycleLabel}`,
          description: `Assinatura FayAi ${planName} (${cycleLabel})`,
          quantity: 1,
          unitPrice: price,
        },
      ],
      {
        externalReference,
        payerEmail: user.email,
      }
    );

    const redirectUrl = mpConfig.isSandbox
      ? preference.sandboxInitPoint
      : preference.initPoint;

    return NextResponse.json({
      success: true,
      preferenceId: preference.preferenceId,
      redirectUrl,
    });
  } catch (error) {
    console.error('[MP Preference] Error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: `Erro ao criar preferência MercadoPago: ${errorMsg}` },
      { status: 500 }
    );
  }
}
