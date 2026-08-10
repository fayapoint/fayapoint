import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { CREDIT_PACKS } from '@/lib/course-tiers';

/**
 * POST /api/credits/purchase — **concessão manual** de um pacote de créditos.
 *
 * ## ⚠️ O que esta rota deixou de ser (10/08/2026)
 *
 * Ela era a rota de COMPRA, e a compra não funcionava. Para quem não é admin,
 * devolvia:
 *
 * ```
 * { requiresPayment: true, checkoutUrl: `/checkout/credits/${packId}` }
 * ```
 *
 * **`/checkout/credits/<packId>` nunca existiu.** O único checkout do site é
 * `/checkout/[plan]`, de um segmento só — dois segmentos dão 404. Quem clicasse
 * em comprar crédito caía numa página inexistente, e nada no banco registrava a
 * tentativa. Confere com a medição de 10/08/2026: `totalPurchased` = **0**
 * somando os 23 usuários, e nenhum pacote em nenhuma conta.
 *
 * ## Onde a compra mora agora
 *
 * No mesmo checkout de tudo o mais: o pacote entra no carrinho como item
 * `type: 'credits'`, `/checkout/cart` cobra por PIX, boleto, cartão ou
 * MercadoPago, e o **webhook** credita o saldo em `grantUserAccess`. O caminho
 * do dinheiro passa a ser um só — o que já tem recibo, idempotência e estorno.
 *
 * ⚠️ **Crédito só é lançado por webhook de pagamento confirmado, ou aqui, por
 * um admin.** Não existe caminho em que o cliente credite a si mesmo: era
 * exatamente o que o `adminOverride` do corpo da requisição permitia — bastava
 * mandar `{"packId":"pack-500","adminOverride":true}` para ganhar 650 créditos
 * (R$650) de graça, porque a condição era `if (!adminOverride && role !== 'admin')`.
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    // O papel vem do BANCO, não do token nem do corpo. Um token antigo de quem
    // deixou de ser admin não deve continuar valendo para dar dinheiro.
    const solicitante = await User.findById(authUser.id).select('role');
    if (!solicitante || solicitante.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Créditos são creditados pelo pagamento confirmado.',
          checkoutUrl: '/checkout/cart',
          packs: CREDIT_PACKS,
        },
        { status: 403 },
      );
    }

    const { packId, userId, motivo } = await request.json();

    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json(
        { error: 'Pacote inválido', availablePacks: CREDIT_PACKS },
        { status: 400 },
      );
    }

    // Sem `userId`, o admin credita a si mesmo — que é o caso de teste.
    const alvoId = userId || authUser.id;
    const alvo = await User.findById(alvoId).select('email');
    if (!alvo) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + pack.expiresInDays);

    await User.findByIdAndUpdate(alvoId, {
      $push: {
        'credits.purchasedCredits': { amount: pack.credits, purchasedAt: now, expiresAt },
        'credits.history': {
          $each: [{
            action: 'credit_grant',
            amount: pack.credits,
            // A descrição é o extrato do aluno. "Concedido pela equipe" é
            // honesto; chamar de "compra" o que ninguém pagou faria o extrato
            // mentir para as duas partes.
            description: motivo
              ? `${pack.credits} créditos concedidos pela equipe — ${motivo}`
              : `${pack.credits} créditos concedidos pela equipe`,
            createdAt: now,
          }],
          $slice: -200,
        },
      },
      $inc: { 'credits.totalPurchased': pack.credits },
    });

    console.log(`[Credits] admin ${authUser.id} concedeu ${pack.credits} a ${alvo.email}`);

    return NextResponse.json({
      success: true,
      creditsAdded: pack.credits,
      expiresAt,
      userEmail: alvo.email,
      message: `${pack.credits} créditos adicionados a ${alvo.email}. Válidos até ${expiresAt.toLocaleDateString('pt-BR')}.`,
    });
  } catch (error) {
    console.error('Credit purchase error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
