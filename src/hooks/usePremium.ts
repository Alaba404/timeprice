import { useEffect, useState } from 'react';
import type Purchases from 'react-native-purchases';
import type { CustomerInfo } from 'react-native-purchases';
import type { PremiumFeature } from '../types';
import { isRcConfigured } from '../rcConfig';

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
  'csv_export',
  'dashboard',
  'unlimited_history',
  'multi_profile',
]);

type UsePremiumResult = {
  isPremium: boolean;
  /** True during the free trial (RevenueCat periodType TRIAL). */
  isTrial: boolean;
  /** Days remaining until full access (0 if not in trial). */
  trialDaysRemaining: number;
  canUse: (feature: PremiumFeature) => boolean;
  customerInfo: CustomerInfo | null;
  loading: boolean;
  /**
   * True only for a confirmed paying subscriber — isPremium AND not in trial AND not loading.
   * Fail-closed: loading, free, trial, or any uncertain state → false.
   * Use this as the single gate for guide access (read + PDF download).
   */
  hasGuideAccess: boolean;
};

/** Compute trial state from a CustomerInfo snapshot. */
function deriveTrialState(info: CustomerInfo): { isPremium: boolean; isTrial: boolean; trialDaysRemaining: number } {
  const entitlement = info.entitlements.active['premium'];
  if (!entitlement) return { isPremium: false, isTrial: false, trialDaysRemaining: 0 };

  // RevenueCat types vary by SDK version — check both the boolean field and periodType string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ent = entitlement as any;
  const inTrial: boolean =
    ent.isTrialPeriod === true ||
    String(ent.periodType ?? '').toUpperCase() === 'TRIAL';

  let trialDaysRemaining = 0;
  if (inTrial) {
    const expDateStr: string | null | undefined = ent.expirationDate;
    if (expDateStr) {
      const daysLeft = (new Date(expDateStr).getTime() - Date.now()) / 86_400_000;
      trialDaysRemaining = Math.max(0, Math.ceil(daysLeft));
    }
  }

  return { isPremium: true, isTrial: inTrial, trialDaysRemaining };
}

export function usePremium(): UsePremiumResult {
  const [isPremium, setIsPremium] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const applyInfo = (info: CustomerInfo) => {
    const derived = deriveTrialState(info);
    setIsPremium(derived.isPremium);
    setIsTrial(derived.isTrial);
    setTrialDaysRemaining(derived.trialDaysRemaining);
    setCustomerInfo(info);
  };

  useEffect(() => {
    if (!_Purchases || !isRcConfigured()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let listener: { remove: () => void } | null = null;

    try {
      _Purchases.getCustomerInfo()
        .then((info) => {
          if (!cancelled) applyInfo(info);
        })
        .catch(() => {
          // Offline or unconfigured — default to free tier
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      // addCustomerInfoUpdateListener return type varies by SDK version
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const maybeListener: any = _Purchases.addCustomerInfoUpdateListener((info) => {
        if (!cancelled) applyInfo(info);
      });
      if (maybeListener && typeof maybeListener.remove === 'function') {
        listener = maybeListener as { remove: () => void };
      }
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

  const hasGuideAccess = isPremium === true && isTrial === false && loading === false;

  return { isPremium, isTrial, trialDaysRemaining, canUse, customerInfo, loading, hasGuideAccess };
}
