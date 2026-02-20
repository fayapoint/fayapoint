/**
 * useDashboard Hook
 * 
 * Centralized dashboard data fetching with client-side caching
 * to reduce serverless function calls.
 * 
 * OPTIMIZATION: 5-minute cache + request deduplication
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Simple in-memory cache
interface CacheEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp: number;
}

const dashboardCache: CacheEntry = {
  data: null,
  timestamp: 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DashboardData = any; // Using any for flexibility, type properly in actual use

interface UseDashboardReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<DashboardData | null>;
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(dashboardCache.data);
  const [isLoading, setIsLoading] = useState(!dashboardCache.data);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchDashboard = useCallback(async (force = false): Promise<DashboardData | null> => {
    // Check cache first (unless forced refresh)
    const now = Date.now();
    if (!force && dashboardCache.data && (now - dashboardCache.timestamp) < CACHE_DURATION) {
      if (mountedRef.current) {
        setData(dashboardCache.data);
        setIsLoading(false);
      }
      return dashboardCache.data;
    }

    // Prevent duplicate fetches
    if (fetchingRef.current) {
      return dashboardCache.data;
    }
    fetchingRef.current = true;

    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('fayai_token') 
      : null;
      
    if (!token) {
      if (mountedRef.current) {
        setError('No token');
        setIsLoading(false);
      }
      fetchingRef.current = false;
      return null;
    }

    try {
      const res = await fetch('/api/user/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        if (mountedRef.current) {
          setError('Unauthorized');
          setIsLoading(false);
        }
        fetchingRef.current = false;
        return null;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch dashboard');
      }

      const result = await res.json();
      
      // Update cache
      dashboardCache.data = result;
      dashboardCache.timestamp = now;
      
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
      
      return result;
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
      return null;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchDashboard();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchDashboard]);

  return { 
    data, 
    isLoading, 
    error, 
    refetch: () => fetchDashboard(true) 
  };
}

// Export a function to invalidate cache (useful after mutations)
export function invalidateDashboardCache(): void {
  dashboardCache.data = null;
  dashboardCache.timestamp = 0;
}

// Export a function to check cache status
export function getDashboardCacheStatus(): { isCached: boolean; age: number } {
  const now = Date.now();
  const age = dashboardCache.timestamp ? now - dashboardCache.timestamp : -1;
  return {
    isCached: !!dashboardCache.data && age < CACHE_DURATION,
    age,
  };
}
