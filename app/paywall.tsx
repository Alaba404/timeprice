import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type PurchasesType from 'react-native-purchases';
import type { PurchasesPackage } from '@revenuecat/purchases-typescript-internal';
import { t } from '../src/i18n';
import { colors, fonts } from '../src/theme';
import { OwodaSymbole } from '../src/components/OwodaSymbole';
import { Icon, type IconName } from '../src/components/Icon';
import { isRcConfigured } from '../src/rcConfig';
let Purchases: typeof PurchasesType | null = null;
try {
  Purchases = (require('react-native-purchases') as { default: typeof PurchasesType }).default;
} catch {}

// ── Comparison table rows ─────────────────────────────────────────────────────
type CompPremiumType = 'check' | 'value' | 'gift';
const COMP_ROWS: Array<{ labelKey: string; free: string; premium: string; type: CompPremiumType }> = [
  { labelKey: 'premium.comp.history',  free: '7',  premium: '∞',  type: 'value' },
  { labelKey: 'premium.comp.dashboard',free: '—',  premium: '✓',  type: 'check' },
  { labelKey: 'premium.comp.csv',      free: '—',  premium: '✓',  type: 'check' },
  { labelKey: 'premium.comp.profiles', free: '—',  premium: '✓',  type: 'check' },
  { labelKey: 'premium.comp.guide',    free: '—',  premium: '🎁', type: 'gift'  },
];

// 'guide' is not a gated feature — it's a paywall bonus displayed last
const FEATURE_LIST: Array<{ key: string; icon: IconName; isBonus?: boolean }> = [
  { key: 'csv_export',        icon: 'chart-column' },
  { key: 'dashboard',         icon: 'trending-up'  },
  { key: 'unlimited_history', icon: 'infinity'     },
  { key: 'multi_profile',     icon: 'users'        },
  { key: 'guide',             icon: 'gift', isBonus: true },
];

// ── Screen ────────────────────────────────────────────────────────────────────
export default function PaywallScreen() {
  const router = useRouter();

  const [annualPkg, setAnnualPkg] = useState<PurchasesPackage | null>(null);
  const [loadingPkg, setLoadingPkg] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [trialEligible, setTrialEligible] = useState(false);

  useEffect(() => {
    const p = Purchases;
    if (!p || !isRcConfigured()) {
      setLoadingPkg(false);
      return;
    }
    void (async () => {
      try {
        const offerings = await p.getOfferings();
        const pkg = offerings.current?.annual ?? null;
        setAnnualPkg(pkg);

        if (pkg) {
          let eligible = false;
          try {
            if (Platform.OS === 'ios') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const result: Record<string, any> = await (p as any).checkTrialOrIntroductoryPriceEligibility([pkg.product.identifier]);
              const entry = result[pkg.product.identifier];
              const statusCode: number = typeof entry === 'object' ? (entry?.status ?? 0) : (entry ?? 0);
              eligible = statusCode === 2; // INTRO_ELIGIBILITY_STATUS_ELIGIBLE
            } else {
              // Android: Google Play free trial phase
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              eligible = !!((pkg.product as any).defaultOption?.freePhase);
            }
          } catch {
            // Can't determine eligibility — default to no trial (safer)
          }
          setTrialEligible(eligible);
        }
      } catch {
        // Offline or unconfigured — pkg stays null
      } finally {
        setLoadingPkg(false);
      }
    })();
  }, []);

  const handlePurchase = async () => {
    const p = Purchases;
    if (!p || !annualPkg) return;
    setPurchasing(true);
    try {
      await p.purchasePackage(annualPkg);
      router.back();
    } catch (e: unknown) {
      if (
        e instanceof Error &&
        (e.message.toLowerCase().includes('cancel') ||
          e.message.toLowerCase().includes('usercancel'))
      ) {
        return;
      }
      Alert.alert(t('common.error'), t('premium.purchaseFailed'));
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    const p = Purchases;
    if (!p) return;
    setPurchasing(true);
    try {
      await p.restorePurchases();
      Alert.alert('✓', t('premium.restored'));
      router.back();
    } catch {
      Alert.alert(t('common.error'));
    } finally {
      setPurchasing(false);
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
            <OwodaSymbole height={80} />
          </View>
          <Text style={styles.heroTitle}>{t('premium.unlockTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('premium.unlockSubtitle')}</Text>
          {/* Guide offer badge */}
          <View style={[styles.guideBadge, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
            <Icon name="gift" size={13} color={colors.night} />
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
                <Icon name={f.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.featureLabelWrap}>
                <Text style={[styles.featureLabel, f.isBonus && styles.featureLabelBonus]}>
                  {t(`premium.features.${f.key}`)}
                </Text>
              </View>
              <View style={[styles.featureCheck, f.isBonus && styles.featureCheckBonus]}>
                {f.isBonus
                  ? <Icon name="gift" size={16} color={colors.primary} />
                  : <Text style={styles.featureCheckText}>✓</Text>}
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
                {row.type === 'gift'
                  ? <Icon name="gift" size={14} color={colors.primary} />
                  : <Text style={
                      row.type === 'check' ? styles.compPremiumCheck : styles.compPremiumValue
                    }>
                      {row.premium}
                    </Text>
                }
              </View>
            </View>
          ))}
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          {loadingPkg ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : annualPkg ? (
            <Text style={styles.priceDisplay}>
              {annualPkg.product.priceString}
              <Text style={styles.pricePerYear}>{t('premium.perYear')}</Text>
            </Text>
          ) : null}
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={handlePurchase}
          disabled={purchasing || loadingPkg || !annualPkg}
          style={[styles.ctaButton, (purchasing || loadingPkg || !annualPkg) && styles.ctaButtonLoading]}
          accessibilityRole="button"
          accessibilityLabel={trialEligible ? t('premium.cta') : t('premium.ctaNoTrial')}
        >
          {purchasing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.ctaText}>
              {trialEligible ? t('premium.cta') : t('premium.ctaNoTrial')}
            </Text>
          )}
        </TouchableOpacity>
        {!loadingPkg && !annualPkg ? (
          <Text style={styles.ctaDisclosure}>{t('premium.offerUnavailable')}</Text>
        ) : !loadingPkg && annualPkg ? (
          <Text style={styles.ctaDisclosure}>
            {trialEligible
              ? t('premium.trialDisclosure', { price: annualPkg.product.priceString })
              : t('premium.disclosureNoTrial', { price: annualPkg.product.priceString })}
          </Text>
        ) : null}
        <Text style={styles.ctaSubtext}>{t('premium.annualBilling')}</Text>

        <TouchableOpacity
          onPress={handleRestore}
          disabled={purchasing}
          style={styles.restoreButton}
          accessibilityRole="button"
          accessibilityLabel={t('premium.restore')}
        >
          <Text style={styles.restoreText}>{t('premium.restore')}</Text>
        </TouchableOpacity>

        <View style={styles.legalLinks}>
          <TouchableOpacity
            onPress={() => Linking.openURL(t('premium.termsUrl'))}
            accessibilityRole="link"
            accessibilityLabel={t('premium.terms')}
          >
            <Text style={styles.legalLink}>{t('premium.terms')}</Text>
          </TouchableOpacity>
          <Text style={styles.legalSep}>·</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(t('premium.privacyUrl'))}
            accessibilityRole="link"
            accessibilityLabel={t('premium.privacy')}
          >
            <Text style={styles.legalLink}>{t('premium.privacy')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1, paddingHorizontal: 24 },
  scrollContent: { paddingTop: 52, paddingBottom: 60 },

  closeButton: { position: 'absolute', top: 12, right: 0, padding: 8 },
  closeText: { color: colors.textMuted, fontSize: 20, fontFamily: fonts.semiBold },

  // Hero
  hero: { alignItems: 'center', marginBottom: 28 },
  heroMark: { marginBottom: 20 },
  heroTitle: { color: colors.textDark, fontSize: 26, fontFamily: fonts.black, textAlign: 'center', marginBottom: 10, letterSpacing: -0.5 },
  heroSubtitle: { color: colors.textMid, fontFamily: fonts.regular, textAlign: 'center', fontSize: 15, lineHeight: 22, marginBottom: 14 },
  guideBadge: {
    backgroundColor: colors.gold + '20',
    borderWidth: 1,
    borderColor: colors.gold + '80',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
  },
  guideBadgeText: { color: colors.night, fontSize: 13, fontFamily: fonts.bold, textAlign: 'center' },

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
  featureRowBonus: { backgroundColor: colors.gold + '12' },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconWrapBonus: { backgroundColor: colors.gold + '25' },
  featureLabelWrap: { flex: 1 },
  featureLabel: { color: colors.textDark, fontSize: 14, fontFamily: fonts.medium },
  featureLabelBonus: { fontFamily: fonts.bold, color: colors.night },
  featureValueStrike: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.regular,
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
  featureCheckText: { color: '#FFFFFF', fontSize: 12, fontFamily: fonts.extraBold },

  // Price display
  priceRow: { alignItems: 'center', marginBottom: 16 },
  priceDisplay: { color: colors.textDark, fontSize: 20, fontFamily: fonts.extraBold },
  pricePerYear: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular },

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
    fontFamily: fonts.bold,
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
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  compRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.divider },
  compRowEven: { backgroundColor: colors.card },
  compRowOdd:  { backgroundColor: colors.bg },
  compFeatureCell: { flex: 2, paddingVertical: 9, paddingHorizontal: 12, justifyContent: 'center' },
  compFeatureText: { fontSize: 12, color: colors.textMid, fontFamily: fonts.medium },
  compValueCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9 },
  compFreeText:      { fontSize: 13, color: colors.textMuted, fontFamily: fonts.semiBold },
  compPremiumCheck:  { fontSize: 13, color: colors.primary,   fontFamily: fonts.black },
  compPremiumValue:  { fontSize: 13, color: colors.primary,   fontFamily: fonts.black },

  // CTA
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
  },
  ctaButtonLoading: { opacity: 0.7 },
  ctaText: { color: '#FFFFFF', fontFamily: fonts.black, fontSize: 17, letterSpacing: 0.2 },
  ctaDisclosure: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.regular, textAlign: 'center', marginBottom: 4, lineHeight: 16 },
  ctaSubtext: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.regular, textAlign: 'center', marginBottom: 16 },

  restoreButton: { alignItems: 'center', paddingVertical: 12 },
  restoreText: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: 14 },
  legalLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, paddingBottom: 4 },
  legalLink: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.medium },
  legalSep: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.regular },
});
