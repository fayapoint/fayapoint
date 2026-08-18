import { NextRequest, NextResponse } from 'next/server';
import { porSegredoDeServico } from '@/lib/guarda-de-servico';
import dbConnect from '@/lib/mongodb';
import { processAutoOrder } from '@/lib/dropshipping';

// =============================================================================
// POST - Auto-order from supplier after payment confirmation
// Called by webhook handlers or admin
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    /**
     * ⚠️ ESTA ROTA GASTA DINHEIRO: ela manda o pedido ao fornecedor.
     *
     * A guarda comparava com `CRON_SECRET` e `INTERNAL_API_KEY`, e **nenhuma das
     * duas existe no ambiente** (conferido com `netlify env:list`, 18/08/2026).
     * Não abriu por sorte: `headers.get()` devolve `null`, variável ausente é
     * `undefined`, e `null === undefined` é falso. Guarda que só segura por
     * acidente de tipo cai na primeira refatoração que troque `headers.get()` por
     * outra coisa — e aqui o prejuízo é pedido de verdade, com cartão de verdade.
     *
     * Agora usa o segredo que EXISTE e falha fechada por regra. Os nomes antigos
     * de cabeçalho continuam aceitos, para não quebrar cron já configurado.
     */
    if (!porSegredoDeServico(request, ['x-social-secret', 'x-cron-secret', 'x-internal-key'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId } = await request.json();
    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId required' }, { status: 400 });
    }

    await dbConnect();
    const result = await processAutoOrder(paymentId);

    if (!result) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      orderNumber: result.orderNumber,
      itemsOrdered: result.items.filter(i => i.status === 'ordered').length,
      itemsFailed: result.items.filter(i => i.status === 'failed').length,
      profit: result.profit,
      details: result,
    });
  } catch (error) {
    console.error('[Auto-Order] Error:', error);
    return NextResponse.json({ error: 'Auto-order failed' }, { status: 500 });
  }
}
