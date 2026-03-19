import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { CREDIT_PACKS } from '@/lib/course-tiers';

/**
 * POST /api/credits/purchase
 * Purchase a credit pack
 * Body: { packId: string }
 *
 * Note: This creates the credit pack record. Actual payment is handled
 * by the Asaas webhook or checkout flow. This endpoint can be called
 * after payment confirmation, or by admin/mission-control.
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { packId, adminOverride } = await request.json();

    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json(
        { error: 'Pacote inválido', availablePacks: CREDIT_PACKS },
        { status: 400 }
      );
    }

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Admin can bypass payment check
    if (!adminOverride && user.role !== 'admin') {
      // In production, verify payment was completed via Asaas/payment gateway
      // For now, return checkout URL
      return NextResponse.json({
        requiresPayment: true,
        checkoutUrl: `/checkout/credits/${packId}`,
        pack: {
          id: pack.id,
          credits: pack.credits,
          price: pack.priceReais,
        },
      });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + pack.expiresInDays);

    const purchaseEntry = {
      amount: pack.credits,
      purchasedAt: now,
      expiresAt,
    };

    const historyEntry = {
      action: 'credit_purchase',
      amount: pack.credits,
      description: `Compra de ${pack.credits} créditos (R$${pack.priceReais})`,
      createdAt: now,
    };

    await User.findByIdAndUpdate(authUser.id, {
      $push: {
        'credits.purchasedCredits': purchaseEntry,
        'credits.history': { $each: [historyEntry], $slice: -200 },
      },
      $inc: { 'credits.totalPurchased': pack.credits },
    });

    return NextResponse.json({
      success: true,
      creditsAdded: pack.credits,
      expiresAt,
      message: `${pack.credits} créditos adicionados! Válidos até ${expiresAt.toLocaleDateString('pt-BR')}.`,
    });
  } catch (error) {
    console.error('Credit purchase error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
