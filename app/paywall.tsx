import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type PurchasesType from 'react-native-purchases';
import type { PurchasesPackage } from '@revenuecat/purchases-typescript-internal';
import { t } from '../src/i18n';
import { colors } from '../src/theme';
import { useProfileStore } from '../src/store/profileStore';

let Purchases: typeof PurchasesType | null = null;
try {
  Purchases = (require('react-native-purchases') as { default: typeof PurchasesType }).default;
} catch {}

// ── Pricing tiers ─────────────────────────────────────────────────────────────
// One entry per currency. `packageId` must match the RevenueCat package
// identifier configured in the dashboard (Offerings → Package identifier).
// Fallback: if no matching package is found, the first available one is used.
type PricingTier = {
  currency: string;
  flag: string;
  amount: string;   // display string (no calculation — defined by design)
  packageId: string; // RevenueCat package identifier
};

const PRICING: PricingTier[] = [
  { currency: 'XOF', flag: '🌍', amount: '2 990 CFA', packageId: 'annual_xof' },
  { currency: 'XAF', flag: '🌍', amount: '2 990 XAF', packageId: 'annual_xaf' },
  { currency: 'EUR', flag: '🇪🇺', amount: '4,99 €',    packageId: 'annual_eur' },
  { currency: 'USD', flag: '🇺🇸', amount: '$4.99',     packageId: 'annual_usd' },
  { currency: 'NGN', flag: '🇳🇬', amount: '₦ 2 500',   packageId: 'annual_ngn' },
];

// ── Comparison table rows ─────────────────────────────────────────────────────
type CompPremiumType = 'check' | 'value' | 'gift';
const COMP_ROWS: Array<{ labelKey: string; free: string; premium: string; type: CompPremiumType }> = [
  { labelKey: 'premium.comp.history',  free: '7',  premium: '∞',  type: 'value' },
  { labelKey: 'premium.comp.scanner',  free: '—',  premium: '✓',  type: 'check' },
  { labelKey: 'premium.comp.widget',   free: '—',  premium: '✓',  type: 'check' },
  { labelKey: 'premium.comp.dashboard',free: '—',  premium: '✓',  type: 'check' },
  { labelKey: 'premium.comp.csv',      free: '—',  premium: '✓',  type: 'check' },
  { labelKey: 'premium.comp.profiles', free: '—',  premium: '✓',  type: 'check' },
  { labelKey: 'premium.comp.guide',    free: '—',  premium: '🎁', type: 'gift'  },
];

// 'guide' is not a gated feature — it's a paywall bonus displayed last
const FEATURE_LIST: Array<{ key: string; icon: string; isBonus?: boolean }> = [
  { key: 'scanner',           icon: '📷' },
  { key: 'widget',            icon: '🔲' },
  { key: 'csv_export',        icon: '📊' },
  { key: 'dashboard',         icon: '📈' },
  { key: 'unlimited_history', icon: '∞'  },
  { key: 'multi_profile',     icon: '👥' },
  { key: 'guide',             icon: '🎁', isBonus: true },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Find the best RevenueCat package for the selected tier. */
function findPackage(
  packages: PurchasesPackage[],
  packageId: string,
): PurchasesPackage {
  return (
    packages.find((p) => p.identifier === packageId) ??
    packages[0]
  );
}

/** Guess the most relevant pricing tier from the active profile currency. */
function defaultTierIndex(profileCurrency: string | undefined): number {
  const idx = PRICING.findIndex((p) => p.currency === profileCurrency);
  return idx >= 0 ? idx : 0; // fallback: XOF
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function PaywallScreen() {
  const router = useRouter();
  const getActiveProfile = useProfileStore((s) => s.getActiveProfile);
  const profile = getActiveProfile();

  const [selectedIndex, setSelectedIndex] = useState(
    defaultTierIndex(profile?.currency),
  );
  const [loading, setLoading] = useState(false);

  const selectedTier = PRICING[selectedIndex];

  const handlePurchase = async () => {
    if (!Purchases) {
      Alert.alert(t('common.error'), t('premium.purchaseUnavailable'));
      return;
    }
    setLoading(true);
    try {
      const offerings = await Purchases.getOfferings();
      const allPackages = offerings.current?.availablePackages ?? [];
      if (allPackages.length === 0) {
        Alert.alert(t('common.error'), t('premium.offerUnavailable'));
        return;
      }
      const pkg = findPackage(allPackages, selectedTier.packageId);
      await Purchases.purchasePackage(pkg);
      router.back();
    } catch (e: unknown) {
      // User cancelled — no alert needed
      if (
        e instanceof Error &&
        (e.message.toLowerCase().includes('cancel') ||
          e.message.toLowerCase().includes('usercancel'))
      ) {
        return;
      }
      Alert.alert(t('common.error'), t('premium.purchaseFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!Purchases) return;
    setLoading(true);
    try {
      await Purchases.restorePurchases();
      Alert.alert('✓', t('premium.restored'));
      router.back();
    } catch {
      Alert.alert(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Close */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel={t('premium.close')}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroMark}>
            <Text style={styles.heroMarkInner}>◎</Text>
            <Text style={styles.heroMarkOverlay}>₣</Text>
          </View>
          <Text style={styles.heroTitle}>{t('premium.unlockTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('premium.unlockSubtitle')}</Text>
          {/* Guide offer badge */}
          <View style={styles.guideBadge}>
            <Text style={styles.guideBadgeText}>{t('premium.guideOffer')}</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          {FEATURE_LIST.map((f, idx) => (
            <View
              key={f.key}
              style={[
                styles.featureRow,
                idx < FEATURE_LIST.length - 1 && styles.featureRowBorder,
                f.isBonus && styles.featureRowBonus,
              ]}
            >
              <View style={[styles.featureIconWrap, f.isBonus && styles.featureIconWrapBonus]}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View style={styles.featureLabelWrap}>
                <Text style={[styles.featureLabel, f.isBonus && styles.featureLabelBonus]}>
                  {t(`premium.features.${f.key}`)}
                </Text>
                {f.isBonus && (
                  <Text style={styles.featureValueStrike}>
                    {t('premium.guideValue')}
                  </Text>
                )}
              </View>
              <View style={[styles.featureCheck, f.isBonus && styles.featureCheckBonus]}>
                <Text style={styles.featureCheckText}>{f.isBonus ? '🎁' : '✓'}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Comparison table: Gratuit vs Premium */}
        <View style={styles.compTable}>
          {/* Header */}
          <View style={styles.compHeader}>
            <View style={styles.compFeatureCell} />
            <View style={styles.compHeaderFree}>
              <Text style={styles.compHeaderFreeText}>{t('premium.comp.headerFree')}</Text>
            </View>
            <View style={styles.compHeaderPremium}>
              <Text style={styles.compHeaderPremiumText}>{t('premium.comp.headerPremium')}</Text>
            </View>
          </View>
          {/* Rows */}
          {COMP_ROWS.map((row, idx) => (
            <View
              key={row.labelKey}
              style={[styles.compRow, idx % 2 === 0 ? styles.compRowEven : styles.compRowOdd]}
            >
              <View style={styles.compFeatureCell}>
                <Text style={styles.compFeatureText}>{t(row.labelKey)}</Text>
              </View>
              <View style={styles.compValueCell}>
                <Text style={styles.compFreeText}>{row.free}</Text>
              </View>
              <View style={styles.compValueCell}>
                <Text style={
                  row.type === 'check' ? styles.compPremiumCheck
                  : row.type === 'gift' ? styles.compPremiumGift
                  : styles.compPremiumValue
                }>
                  {row.premium}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing selector */}
        <Text style={styles.pricingLabel}>{t('settings.frequency')}</Text>
        <View style={styles.pricingGrid}>
          {PRICING.map((tier, idx) => {
            const active = selectedIndex === idx;
            return (
              <TouchableOpacity
                key={tier.currency}
                onPress={() => setSelectedIndex(idx)}
                style={[styles.pricingCard, active && styles.pricingCardActive]}
                accessibilityRole="radio"
                accessibilityLabel={`${tier.currency} ${tier.amount}`}
                accessibilityState={{ checked: active }}
                activeOpacity={0.75}
              >
                {active && (
                  <View style={styles.pricingCheckBadge}>
                    <Text style={styles.pricingCheckText}>✓</Text>
                  </View>
                )}
                <Text style={styles.pricingFlag}>{tier.flag}</Text>
                <Text style={[styles.pricingCurrency, active && styles.pricingCurrencyActive]}>
                  {tier.currency}
                </Text>
                <Text style={[styles.pricingAmount, active && styles.pricingAmountActive]}>
                  {tier.amount}
                </Text>
                <Text style={[styles.pricingPer, active && styles.pricingPerActive]}>
                  {t('premium.perYear')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={handlePurchase}
          disabled={loading}
          style={[styles.ctaButton, loading && styles.ctaButtonLoading]}
          accessibilityRole="button"
          accessibilityLabel={t('premium.cta')}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.ctaText}>{t('premium.cta')}</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.ctaSubtext}>{t('premium.annualBilling')}</Text>

        <TouchableOpacity
          onPress={handleRestore}
          disabled={loading}
          style={styles.restoreButton}
          accessibilityRole="button"
          accessibilityLabel={t('premium.restore')}
        >
          <Text style={styles.restoreText}>{t('premium.restore')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1, paddingHorizontal: 24 },
  scrollContent: { paddingTop: 52, paddingBottom: 60 },

  closeButton: { position: 'absolute', top: 12, right: 0, padding: 8 },
  closeText: { color: colors.textMuted, fontSize: 20, fontWeight: '600' },

  // Hero
  hero: { alignItems: 'center', marginBottom: 28 },
  heroMark: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  heroMarkInner: { position: 'absolute', fontSize: 72, color: colors.primary, fontWeight: '900' },
  heroMarkOverlay: { position: 'absolute', fontSize: 30, color: colors.accent, fontWeight: '900' },
  heroTitle: { color: colors.textDark, fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 10, letterSpacing: -0.5 },
  heroSubtitle: { color: colors.textMid, textAlign: 'center', fontSize: 15, lineHeight: 22, marginBottom: 14 },
  guideBadge: {
    backgroundColor: '#D4AF3720',
    borderWidth: 1,
    borderColor: '#D4AF3780',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
  },
  guideBadgeText: { color: '#9E7C00', fontSize: 13, fontWeight: '700', textAlign: 'center' },

  // Features list
  featuresCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  featureRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  featureRowBonus: { backgroundColor: '#D4AF3712' },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconWrapBonus: { backgroundColor: '#D4AF3725' },
  featureIcon: { fontSize: 18, lineHeight: 22, textAlign: 'center' },
  featureLabelWrap: { flex: 1 },
  featureLabel: { color: colors.textDark, fontSize: 14, fontWeight: '500' },
  featureLabelBonus: { fontWeight: '700', color: '#6B5400' },
  featureValueStrike: {
    color: colors.textMuted,
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCheckBonus: { backgroundColor: 'transparent' },
  featureCheckText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  // Pricing grid
  pricingLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 2,
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  pricingCard: {
    // Each card is ~45% width so 2 fit per row; 5th card fills a row alone
    minWidth: '44%',
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  pricingCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  pricingCheckBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingCheckText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  pricingFlag: { fontSize: 22, lineHeight: 28, textAlign: 'center' },
  pricingCurrency: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  pricingCurrencyActive: { color: colors.primary },
  pricingAmount: { color: colors.textDark, fontSize: 15, fontWeight: '800' },
  pricingAmountActive: { color: colors.primaryDark },
  pricingPer: { color: colors.textMuted, fontSize: 10 },
  pricingPerActive: { color: colors.primary },

  // Comparison table
  compTable: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 24,
  },
  compHeader: { flexDirection: 'row' },
  compHeaderFree: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compHeaderFreeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  compHeaderPremium: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compHeaderPremiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  compRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.divider },
  compRowEven: { backgroundColor: colors.card },
  compRowOdd:  { backgroundColor: colors.bg },
  compFeatureCell: { flex: 2, paddingVertical: 9, paddingHorizontal: 12, justifyContent: 'center' },
  compFeatureText: { fontSize: 12, color: colors.textMid, fontWeight: '500' },
  compValueCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9 },
  compFreeText:      { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  compPremiumCheck:  { fontSize: 13, color: colors.primary,   fontWeight: '900' },
  compPremiumValue:  { fontSize: 13, color: colors.primary,   fontWeight: '900' },
  compPremiumGift:   { fontSize: 15 },

  // CTA
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonLoading: { opacity: 0.7 },
  ctaText: { color: '#FFFFFF', fontWeight: '900', fontSize: 17, letterSpacing: 0.2 },
  ctaSubtext: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 16 },

  restoreButton: { alignItems: 'center', paddingVertical: 12 },
  restoreText: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
});
