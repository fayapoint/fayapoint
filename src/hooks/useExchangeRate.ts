"use client";

import { useEffect, useState } from "react";

interface ExchangeRate {
  usd: number;
  brl: number;
  rate: number;
  source: string;
}

const DEFAULT_RATE: ExchangeRate = {
  usd: 1,
  brl: 5.75,
  rate: 5.75,
  source: "default",
};

// Module-level cache shared across all hook instances
let cachedRate: ExchangeRate | null = null;
let fetchPromise: Promise<ExchangeRate> | null = null;

async function fetchRate(): Promise<ExchangeRate> {
  try {
    const res = await fetch("/api/exchange-rate", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      cachedRate = data;
      return data;
    }
  } catch {
    // ignore
  }
  return DEFAULT_RATE;
}

/**
 * Hook to get the live US$1 → BRL exchange rate.
 * Returns { usd: 1, brl: number, rate: number, loading: boolean }
 * The BRL value is the price we charge for the monthly offer (US$1 converted).
 */
export function useExchangeRate() {
  const [data, setData] = useState<ExchangeRate>(cachedRate || DEFAULT_RATE);
  const [loading, setLoading] = useState(!cachedRate);

  useEffect(() => {
    if (cachedRate) {
      setData(cachedRate);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetchRate().finally(() => {
        fetchPromise = null;
      });
    }

    fetchPromise.then((rate) => {
      setData(rate);
      setLoading(false);
    });
  }, []);

  return {
    ...data,
    loading,
    /** The monthly offer price in BRL (US$1 converted) */
    monthlyOfferPrice: data.brl,
    /** Format as "R$ X,XX" */
    formattedBrl: `R$ ${data.brl.toFixed(2).replace(".", ",")}`,
    /** Format conversion display like "US$1 = R$ 5,72" */
    conversionDisplay: `US$1 = R$ ${data.brl.toFixed(2).replace(".", ",")}`,
  };
}
