"use client";

import { useEffect, useMemo, useState } from "react";
import type { ServicePrice } from "@/types/pricing";

interface UseServicePricesResult {
  prices: ServicePrice[];
  loading: boolean;
  error: string | null;
  groupedByCategory: Record<string, ServicePrice[]>;
  groupedByService: Record<string, ServicePrice[]>;
}

export function useServicePrices(serviceSlug?: string): UseServicePricesResult {
  const [prices, setPrices] = useState<ServicePrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchPrices() {
      try {
        setLoading(true);
        const query = serviceSlug ? `?serviceSlug=${serviceSlug}` : "";
        const res = await fetch(`/api/service-prices${query}`);
        if (!res.ok) {
          throw new Error("Failed to fetch service prices");
        }
        const data = await res.json();
        if (isMounted) {
          setPrices(data.prices ?? []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message);
          setPrices([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPrices();

    return () => {
      isMounted = false;
    };
  }, [serviceSlug]);

  const groupedByCategory = useMemo(() => {
    return prices.reduce<Record<string, ServicePrice[]>>((acc, item) => {
      acc[item.category] = acc[item.category] ? [...acc[item.category], item] : [item];
      return acc;
    }, {});
  }, [prices]);

  const groupedByService = useMemo(() => {
    return prices.reduce<Record<string, ServicePrice[]>>((acc, item) => {
      acc[item.serviceSlug] = acc[item.serviceSlug]
        ? [...acc[item.serviceSlug], item]
        : [item];
      return acc;
    }, {});
  }, [prices]);

  return { prices, loading, error, groupedByCategory, groupedByService };
}
