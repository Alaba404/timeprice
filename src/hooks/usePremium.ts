import { useEffect, useState } from 'react';
import type Purchases from 'react-native-purchases';
import type { CustomerInfo } from 'react-native-purchases';
import type { PremiumFeature } from '../types';

// react-native-purchases uses native modules not available in Expo Go.
// We load it lazily at runtime so missing native code doesn't crash the bundle.
let _Purchases: typeof Purchases | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  _Purchases = (require('react-native-purchases') as { default: typeof Purchases }).default;
} catch {
  // Expo Go or environments without RevenueCat native module → free tier
}

const PREMIUM_FEATURES = new Set<PremiumFeature>([
  'scanner',
  'widget',
  'csv_export',
  'dashboard',
  'unlimited_history',
  'multi_profile',
]);

type UsePremiumResult = {
  isPremium: boolean;
  canUse: (feature: PremiumFeature) => boolean;
  customerInfo: CustomerInfo | null;
  loading: boolean;
};

export function usePremium(): UsePremiumResult {
  const [isPremium, setIsPremium] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_Purchases) {
      // No native module available → immediately resolve as free tier
      setLoading(false);
      return;
    }

    let cancelled = false;
    let listener: { remove: () => void } | null = null;

    try {
      _Purchases.getCustomerInfo()
        .then((info) => {
          if (!cancelled) {
            const active = info.entitlements.active;
            setIsPremium('premium' in active);
            setCustomerInfo(info);
          }
        })
        .catch(() => {
          // Offline or unconfigured — default to free tier
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      listener = _Purchases.addCustomerInfoUpdateListener((info) => {
        if (!cancelled) {
          setIsPremium('premium' in info.entitlements.active);
          setCustomerInfo(info);
        }
      });
    } catch {
      // Native RevenueCat module not available (Expo Go / dev build without plugin)
      setLoading(false);
    }

    return () => {
      cancelled = true;
      listener?.remove();
    };
  }, []);

  const canUse = (feature: PremiumFeature): boolean => {
    if (!PREMIUM_FEATURES.has(feature)) return true;
    return isPremium;
  };

  return { isPremium, canUse, customerInfo, loading };
}
