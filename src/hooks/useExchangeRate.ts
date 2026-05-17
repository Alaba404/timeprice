import { useEffect, useState } from 'react';
import { loadExchangeRates, getCachedRatesSync } from '../core/rateLoader';
import type { ExchangeRates } from '../types';

type UseExchangeRateResult = {
  rates: ExchangeRates;
  loading: boolean;
  error: string | null;
};

// Fallback so the render path never blocks on an empty object
const FALLBACK: ExchangeRates = { EUR: 1 };

export function useExchangeRate(): UseExchangeRateResult {
  const [rates, setRates] = useState<ExchangeRates>(
    () => getCachedRatesSync() ?? FALLBACK,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadExchangeRates()
      .then((fetched) => {
        if (!cancelled) {
          setRates(fetched);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unknown error');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { rates, loading, error };
}
