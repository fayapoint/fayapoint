import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { syncProductPrices, type MarginConfig } from '@/lib/dropshipping';

async function requireAdmin() {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  if (!['admin', 'superadmin'].includes(authUser.role)) return null;
  return authUser;
}

// =============================================================================
// POST - Trigger price sync (admin or cron)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Allow cron access via secret header
    const cronSecret = request.headers.get('x-cron-secret');
    const isAuthorizedCron = cronSecret === process.env.CRON_SECRET;

    if (!isAuthorizedCron) {
      const admin = await requireAdmin();
      if (!admin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const config: Partial<MarginConfig> = body.config || {};

    const results = await syncProductPrices({
      minimumMarginPercent: config.minimumMarginPercent ?? 30,
      targetMarginPercent: config.targetMarginPercent ?? 50,
      maxPriceBRL: config.maxPriceBRL ?? 500,
      autoAdjust: config.autoAdjust ?? true,
      roundTo: config.roundTo ?? 0.99,
    });

    const summary = {
      total: results.length,
      updated: results.filter(r => r.action === 'updated').length,
      disabled: results.filter(r => r.action === 'disabled').length,
      noChange: results.filter(r => r.action === 'no_change').length,
      errors: results.filter(r => r.action === 'error').length,
    };

    return NextResponse.json({ success: true, summary, results });
  } catch (error) {
    console.error('[Dropshipping Sync] Error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
