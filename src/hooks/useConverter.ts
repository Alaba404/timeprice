import { useMemo } from 'react';
import { convertPrice } from '../core/converter';
import { useExchangeRate } from './useExchangeRate';
import { useProfileStore } from '../store/profileStore';
import type { ConversionResult } from '../types';

type UseConverterResult = {
  convert: (price: number, currency: string) => ConversionResult | null;
  rates: ReturnType<typeof useExchangeRate>['rates'];
  ratesLoading: boolean;
};

export function useConverter(): UseConverterResult {
  const { rates, loading: ratesLoading } = useExchangeRate();
  const getActiveProfile = useProfileStore((s) => s.getActiveProfile);
  const profile = getActiveProfile();

  const convert = useMemo(
    () =>
      (price: number, currency: string): ConversionResult | null => {
        if (!profile) return null;
        // This runs synchronously — no network in the render path
        return convertPrice(price, currency, profile, rates);
      },
    [profile, rates],
  );

  return { convert, rates, ratesLoading };
}
