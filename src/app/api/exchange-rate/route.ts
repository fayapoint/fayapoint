import { NextResponse } from 'next/server';
import { getOneDollarInBrl } from '@/lib/exchange-rate';

/**
 * GET /api/exchange-rate
 * Returns the current US$1 → BRL conversion.
 * Public endpoint (no auth needed) — cached for 1 hour.
 */
export async function GET() {
  try {
    const { brl, rate, source } = await getOneDollarInBrl();

    return NextResponse.json(
      { usd: 1, brl, rate, source },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('[ExchangeRate API] Error:', error);
    return NextResponse.json(
      { usd: 1, brl: 5.75, rate: 5.75, source: 'error-fallback' },
      { status: 200 } // Still return 200 with fallback so UI doesn't break
    );
  }
}
