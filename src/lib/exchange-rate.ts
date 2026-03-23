/**
 * USD → BRL live exchange rate with server-side caching.
 * Uses the free AwesomeAPI (economia.awesomeapi.com.br) — no API key needed.
 * Fallback: Banco Central do Brasil (BCB) PTAX rate.
 * Cache: 1 hour (rates don't change that fast and we don't want to hammer the API).
 */

interface ExchangeRateCache {
  rate: number;
  fetchedAt: number;
  source: string;
}

// In-memory cache (persists across requests in the same Node process)
let cache: ExchangeRateCache | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Reasonable fallback if all APIs fail (updated manually as a safety net)
const FALLBACK_RATE = 5.75;

/**
 * Get the current USD → BRL exchange rate.
 * Cached for 1 hour server-side.
 */
export async function getUsdToBrlRate(): Promise<ExchangeRateCache> {
  // Return cached if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache;
  }

  // Try AwesomeAPI first
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const rate = parseFloat(data.USDBRL?.bid);
      if (rate && rate > 3 && rate < 10) {
        cache = { rate, fetchedAt: Date.now(), source: 'awesomeapi' };
        return cache;
      }
    }
  } catch (e) {
    console.warn('[ExchangeRate] AwesomeAPI failed:', e);
  }

  // Fallback: try BCB PTAX
  try {
    const today = new Date();
    // BCB format: MM-DD-YYYY, but weekends/holidays have no data, try last 3 days
    for (let i = 0; i < 3; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dateStr}'&$format=json`;

      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        const values = data?.value;
        if (values && values.length > 0) {
          const rate = values[values.length - 1].cotacaoCompra;
          if (rate && rate > 3 && rate < 10) {
            cache = { rate, fetchedAt: Date.now(), source: 'bcb-ptax' };
            return cache;
          }
        }
      }
    }
  } catch (e) {
    console.warn('[ExchangeRate] BCB PTAX failed:', e);
  }

  // Use stale cache if available
  if (cache) {
    console.warn('[ExchangeRate] Using stale cache from', new Date(cache.fetchedAt).toISOString());
    return cache;
  }

  // Last resort: hardcoded fallback
  console.warn('[ExchangeRate] All sources failed, using fallback rate:', FALLBACK_RATE);
  cache = { rate: FALLBACK_RATE, fetchedAt: Date.now(), source: 'fallback' };
  return cache;
}

/**
 * Convert US$1 to BRL, rounded to nearest R$0.01.
 * Ensures minimum R$5 for Asaas compatibility.
 */
export async function getOneDollarInBrl(): Promise<{ brl: number; rate: number; source: string }> {
  const { rate, source } = await getUsdToBrlRate();
  const brl = Math.max(5, Math.round(rate * 100) / 100); // Ensure R$5 minimum
  return { brl, rate, source };
}
