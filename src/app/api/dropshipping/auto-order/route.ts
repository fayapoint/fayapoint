import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { processAutoOrder } from '@/lib/dropshipping';

// =============================================================================
// POST - Auto-order from supplier after payment confirmation
// Called by webhook handlers or admin
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Verify authorization (cron secret or internal call)
    const cronSecret = request.headers.get('x-cron-secret');
    const internalKey = request.headers.get('x-internal-key');
    const isAuthorized =
      cronSecret === process.env.CRON_SECRET ||
      internalKey === process.env.INTERNAL_API_KEY;

    if (!isAuthorized) {
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
