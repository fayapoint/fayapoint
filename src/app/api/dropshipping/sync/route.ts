import { NextRequest, NextResponse } from 'next/server';
import { porSegredoDeServico } from '@/lib/guarda-de-servico';
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
    // `CRON_SECRET` não existe no ambiente: a comparação nunca casava e a rota
    // sempre caía no `requireAdmin()` abaixo — protegida, mas por acidente. Agora
    // usa o segredo que existe, com o portão de admin como segunda barreira.
    if (!porSegredoDeServico(request, ['x-social-secret', 'x-cron-secret'])) {
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
