import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
  useAnimatedStyle,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { nanoid } from 'nanoid/non-secure';
import { PriceInput } from '../../src/components/PriceInput';
import { DurationBadge } from '../../src/components/DurationBadge';
import { ProfileSelector } from '../../src/components/ProfileSelector';
import { useConverter } from '../../src/hooks/useConverter';
import { useHistoryStore } from '../../src/store/historyStore';
import { useProfileStore } from '../../src/store/profileStore';
import { usePremium } from '../../src/hooks/usePremium';
import { useLocaleStore } from '../../src/store/localeStore';
import { t } from '../../src/i18n';
import { colors } from '../../src/theme';
import {
  ALL_CURRENCIES,
  DEFAULT_USER_CURRENCIES,
  getCurrency,
  formatPriceDisplay,
  type CurrencyInfo,
} from '../../src/core/currencies';
import { convertCurrency } from '../../src/core/converter';
import type { Category, ConversionEntry } from '../../src/types';

// Category value + icon only — labels come from t() at render time
const CATEGORY_VALUES: { value: Category; icon: string }[] = [
  { value: 'food',      icon: '🍔' },
  { value: 'transport', icon: '🚗' },
  { value: 'housing',   icon: '🏠' },
  { value: 'tech',      icon: '💻' },
  { value: 'clothing',  icon: '👕' },
  { value: 'leisure',   icon: '🎮' },
  { value: 'health',    icon: '💊' },
  { value: 'other',     icon: '📦' },
];

// ── Logo ────────────────────────────────────────────────────────────────────
function OwodaLogo() {
  return (
    <View style={logo.row}>
      <View style={logo.mark}>
        <Text style={logo.markInner}>◎</Text>
        <Text style={logo.markOverlay}>₣</Text>
      </View>
      <View style={logo.wordmark}>
        <Text style={logo.name}>OWODA</Text>
        <Text style={logo.tagline}>{t('converter.tagline')}</Text>
      </View>
    </View>
  );
}

const logo = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  mark:       { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  markInner:  { position: 'absolute', fontSize: 36, color: colors.primary, fontWeight: '900' },
  markOverlay:{ position: 'absolute', fontSize: 16, color: colors.accent,  fontWeight: '900', marginTop: 2 },
  wordmark:   { flex: 1 },
  name:       { fontSize: 22, fontWeight: '900', color: colors.primary, letterSpacing: 3 },
  tagline:    { fontSize: 10, color: colors.accent, fontWeight: '600', letterSpacing: 0.3, marginTop: 1 },
});

// ── Currency row in modal ───────────────────────────────────────────────────
function CurrencyRow({
  info,
  selected,
  onSelect,
  onRemove,
}: {
  info: CurrencyInfo;
  selected: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  const { locale } = useLocaleStore();
  const currencyName = locale === 'en' ? info.nameEn : info.nameFr;

  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[styles.currencyItem, selected && styles.currencyItemActive]}
      accessibilityRole="radio"
      accessibilityLabel={info.code}
      accessibilityState={{ checked: selected }}
    >
      <Text style={styles.currencyFlag}>{info.flag}</Text>
      <View style={styles.currencyInfo}>
        <Text style={[styles.currencyCode, selected && styles.currencyCodeActive]}>
          {info.code}{info.badge ? ` · ${info.badge}` : ''}
        </Text>
        <Text style={styles.currencyName}>{currencyName}</Text>
      </View>
      {selected && (
        <View style={styles.currencyCheck}>
          <Text style={styles.currencyCheckText}>✓</Text>
        </View>
      )}
      {!selected && onRemove && (
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation?.(); onRemove(); }}
          style={styles.currencyRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`${t('converter.removeLabel')} ${info.code}`}
        >
          <Text style={styles.currencyRemoveText}>✕</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────
export default function ConverterScreen() {
  const router = useRouter();
  const { convert, rates } = useConverter();
  const addEntry = useHistoryStore((s) => s.addEntry);
  const getActiveProfile = useProfileStore((s) => s.getActiveProfile);
  const { isPremium, canUse } = usePremium();
  const entriesCount = useHistoryStore((s) => s.entries.length);

  const { locale } = useLocaleStore();

  const [rawPrice, setRawPrice] = useState('');
  const [currency, setCurrency] = useState('XOF');
  const [category, setCategory] = useState<Category>('other');
  // The user's personal currency list (manageable)
  const [userCurrencies, setUserCurrencies] = useState<string[]>(DEFAULT_USER_CURRENCIES);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [addCurrencyModalVisible, setAddCurrencyModalVisible] = useState(false);

  const price = parseFloat(rawPrice.replace(',', '.')) || 0;
  const profile = getActiveProfile();
  const result = profile && price > 0 ? convert(price, currency) : null;

  // ── Guide banner — once per session, after 3rd saved conversion ─────────
  const [showGuideBanner, setShowGuideBanner]   = useState(false);
  const guideBannerShownRef                     = useRef(false);
  const bannerTranslateY                        = useSharedValue(-80);
  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerTranslateY.value }],
  }));

  useEffect(() => {
    if (!isPremium && entriesCount >= 3 && !guideBannerShownRef.current) {
      guideBannerShownRef.current = true;
      setShowGuideBanner(true);
    }
  }, [entriesCount, isPremium]);

  useEffect(() => {
    if (showGuideBanner) {
      bannerTranslateY.value = withTiming(0, {
        duration: 350,
        easing: Easing.out(Easing.back(1.4)),
      });
    } else {
      bannerTranslateY.value = withTiming(-80, { duration: 200 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGuideBanner]);

  const dismissBanner = useCallback(() => setShowGuideBanner(false), []);

  // ── Haptics + "de travail" fade-in on each new result ───────────────────
  const ofWorkOpacity = useSharedValue(0);
  const ofWorkStyle   = useAnimatedStyle(() => ({ opacity: ofWorkOpacity.value }));

  useEffect(() => {
    if (result) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      ofWorkOpacity.value = 0;
      ofWorkOpacity.value = withDelay(
        1000,
        withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) }),
      );
    } else {
      ofWorkOpacity.value = 0;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.durationMinutes]);

  const handleSave = useCallback(() => {
    if (!result || !profile) return;
    Keyboard.dismiss();
    const entry: ConversionEntry = {
      id: nanoid(),
      profileId: profile.id,
      priceAmount: price,
      priceCurrency: currency,
      convertedCurrency: profile.currency,
      durationMinutes: result.durationMinutes,
      category,
      source: 'manual',
      createdAt: Date.now(),
    };

    const saved = addEntry(entry, isPremium);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!saved) {
      // Free-tier limit reached — tell the user and open the paywall
      Alert.alert(
        t('converter.limitTitle'),
        t('converter.limitBody'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: 'Premium →',
            onPress: () => router.push('/paywall'),
          },
        ],
      );
      return;
    }

    Alert.alert('✓', t('converter.saved'));
    setRawPrice('');
  }, [result, profile, price, currency, category, isPremium, addEntry, router]);

  const handleScan = useCallback(() => {
    Keyboard.dismiss();
    if (!canUse('scanner')) { router.push('/paywall'); return; }
    router.push('/scanner');
  }, [canUse, router]);

  const handleRemoveCurrency = useCallback((code: string) => {
    if (userCurrencies.length <= 1) return;
    setUserCurrencies((prev) => prev.filter((c) => c !== code));
    if (currency === code) setCurrency(userCurrencies.find((c) => c !== code) ?? 'XOF');
  }, [userCurrencies, currency]);

  const handleCurrencySelect = useCallback((newCode: string) => {
    if (rawPrice !== '' && newCode !== currency) {
      const currentAmount = parseFloat(rawPrice.replace(',', '.'));
      if (!isNaN(currentAmount) && currentAmount > 0) {
        const converted = convertCurrency(currentAmount, currency, newCode, rates);
        const noCents = newCode === 'XOF' || newCode === 'XAF';
        const rounded = noCents ? Math.round(converted) : Math.round(converted * 100) / 100;
        setRawPrice(String(rounded));
      }
    }
    setCurrency(newCode);
    setCurrencyModalVisible(false);
  }, [rawPrice, currency, rates]);

  const handleAddCurrency = useCallback((code: string) => {
    if (!userCurrencies.includes(code)) {
      setUserCurrencies((prev) => [...prev, code]);
    }
    setAddCurrencyModalVisible(false);
    handleCurrencySelect(code);
  }, [userCurrencies, handleCurrencySelect]);

  const activeCurrencyInfo = getCurrency(currency);
  const availableToAdd = ALL_CURRENCIES.filter((c) => !userCurrencies.includes(c.code));

  // Amount equivalent to 50 000 XOF in the active currency, rounded to a clean figure
  const chipAmount = useMemo(() => {
    const BASE_XOF = 50_000;
    if (currency === 'XOF' || currency === 'XAF') return BASE_XOF;
    const converted = convertCurrency(BASE_XOF, 'XOF', currency, rates);
    if (converted >= 10_000) return Math.round(converted / 1_000) * 1_000;
    if (converted >= 1_000)  return Math.round(converted / 100) * 100;
    if (converted >= 100)    return Math.round(converted / 10) * 10;
    if (converted >= 10)     return Math.round(converted);
    return Math.round(converted * 10) / 10;
  }, [currency, rates]);

  if (!profile) {
    return (
      <SafeAreaView style={styles.noProfileSafe}>
        <View style={styles.noProfileContent}>
          <View style={styles.noProfileIconWrap}>
            <Text style={styles.noProfileIcon}>◎</Text>
            <Text style={styles.noProfileIconOverlay}>₣</Text>
          </View>
          <Text style={styles.noProfileTitle}>{t('converter.welcome')}</Text>
          <Text style={styles.noProfileSub}>{t('converter.noProfile')}</Text>
          <TouchableOpacity onPress={() => router.push('/onboarding')} style={styles.configureButton} accessibilityRole="button">
            <Text style={styles.configureButtonText}>{t('onboarding.finish')} →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Guide banner — slides in from top after 3rd conversion ──────── */}
      {showGuideBanner && (
        <Animated.View style={[styles.guideBanner, bannerStyle]}>
          <TouchableOpacity
            onPress={() => { dismissBanner(); router.push('/paywall'); }}
            style={styles.guideBannerContent}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.guideBannerText}>
              {t('premium.guideBanner')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={dismissBanner}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t('premium.close')}
          >
            <Text style={styles.guideBannerClose}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.flex}>
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <OwodaLogo />
              <ProfileSelector />

              {/* Price input card */}
              <View style={styles.inputCard}>
                <Text style={styles.inputCardLabel}>{t('converter.amountLabel')}</Text>
                <PriceInput
                  value={rawPrice}
                  onChangeText={setRawPrice}
                  currencyInfo={activeCurrencyInfo}
                  onCurrencyPress={() => setCurrencyModalVisible(true)}
                />
              </View>

              {/* Chip exemple — visible uniquement quand le champ est vide */}
              {rawPrice === '' && (
                <TouchableOpacity
                  onPress={() => setRawPrice(String(chipAmount))}
                  style={styles.exampleChip}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`💡 ${locale === 'en' ? 'Try with' : 'Essaie avec'} ${formatPriceDisplay(chipAmount, currency)}`}
                >
                  <Text style={styles.exampleChipText}>
                    {`💡 ${locale === 'en' ? 'Try with' : 'Essaie avec'} ${formatPriceDisplay(chipAmount, currency)}`}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Result */}
              <View style={styles.resultCard}>
                {result ? (
                  <>
                    <Text style={styles.resultLabel}>{t('converter.equates')}</Text>
                    <DurationBadge result={result} weeklyHours={profile.weeklyHours} size="lg" />
                    <Animated.Text style={[styles.resultSub, ofWorkStyle]}>
                      {t('converter.ofWorkTime')}
                    </Animated.Text>
                  </>
                ) : (
                  <View style={styles.resultPlaceholder}>
                    <Text style={styles.resultPlaceholderEmoji}>⏱</Text>
                    <Text style={styles.resultPlaceholderText}>{t('converter.hint')}</Text>
                  </View>
                )}
              </View>

              {/* Categories */}
              <View style={styles.categorySection}>
                <Text style={styles.categoryLabel}>{t('converter.category')}</Text>
                <View style={styles.categoryRow}>
                  {CATEGORY_VALUES.map((c) => {
                    const label = t(`converter.categories.${c.value}`);
                    return (
                      <TouchableOpacity
                        key={c.value}
                        onPress={() => { setCategory(c.value); Keyboard.dismiss(); }}
                        style={[styles.categoryChip, category === c.value && styles.categoryChipActive]}
                        accessibilityRole="radio"
                        accessibilityLabel={label}
                        accessibilityState={{ checked: category === c.value }}
                      >
                        <Text style={styles.categoryEmoji}>{c.icon}</Text>
                        <Text style={category === c.value ? styles.categoryTextActive : styles.categoryTextInactive}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Action buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={handleScan}
                style={styles.scanButton}
                accessibilityRole="button"
                accessibilityLabel={t('converter.scan')}
              >
                <Text style={styles.scanEmoji}>📷</Text>
                {!canUse('scanner') && (
                  <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={!result}
                style={[styles.saveButton, !result && styles.saveButtonDisabled]}
                accessibilityRole="button"
                accessibilityLabel={t('converter.save')}
                accessibilityState={{ disabled: !result }}
              >
                <Text style={[styles.saveButtonText, !result && styles.saveButtonTextDisabled]}>
                  {t('converter.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* ── Currency manager modal ──────────────────────────────────────── */}
      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCurrencyModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>{t('converter.currency')}</Text>
                <Text style={styles.modalSubtitle}>
                  {t('converter.currencyHint')}
                </Text>

                <FlatList
                  data={userCurrencies}
                  keyExtractor={(item) => item}
                  style={styles.currencyList}
                  renderItem={({ item: code }) => (
                    <CurrencyRow
                      info={getCurrency(code)}
                      selected={currency === code}
                      onSelect={() => handleCurrencySelect(code)}
                      onRemove={userCurrencies.length > 1 ? () => handleRemoveCurrency(code) : undefined}
                    />
                  )}
                />

                {/* Add currency button */}
                <TouchableOpacity
                  onPress={() => setAddCurrencyModalVisible(true)}
                  style={styles.addCurrencyButton}
                  accessibilityRole="button"
                  accessibilityLabel={t('converter.addCurrency')}
                >
                  <Text style={styles.addCurrencyText}>+ {t('converter.addCurrency')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCurrencyModalVisible(false)}
                  style={styles.modalCancel}
                  accessibilityRole="button"
                >
                  <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Add currency modal ──────────────────────────────────────────── */}
      <Modal
        visible={addCurrencyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddCurrencyModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAddCurrencyModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>{t('converter.addCurrency')}</Text>
                <FlatList
                  data={availableToAdd}
                  keyExtractor={(item) => item.code}
                  style={styles.currencyList}
                  renderItem={({ item }) => (
                    <CurrencyRow
                      info={item}
                      selected={false}
                      onSelect={() => handleAddCurrency(item.code)}
                    />
                  )}
                />
                <TouchableOpacity
                  onPress={() => setAddCurrencyModalVisible(false)}
                  style={styles.modalCancel}
                  accessibilityRole="button"
                >
                  <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:   { flex: 1, backgroundColor: colors.bg },
  flex:       { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  // Guide banner
  guideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3A2A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    zIndex: 100,
  },
  guideBannerContent: { flex: 1 },
  guideBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  guideBannerClose: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: '700',
  },

  // No profile
  noProfileSafe: { flex: 1, backgroundColor: colors.bg },
  noProfileContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  noProfileIconWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  noProfileIcon: { position: 'absolute', fontSize: 72, color: colors.primary, fontWeight: '900' },
  noProfileIconOverlay: { position: 'absolute', fontSize: 32, color: colors.accent, fontWeight: '900' },
  noProfileTitle: { fontSize: 26, fontWeight: '800', color: colors.textDark, textAlign: 'center', marginBottom: 12 },
  noProfileSub: { fontSize: 15, color: colors.textMid, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  configureButton: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 40, paddingVertical: 16 },
  configureButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },

  // Input card
  inputCard: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 14, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  inputCardLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },

  // Example chip
  exampleChip: {
    alignSelf: 'center',
    backgroundColor: '#E8F8F0',
    borderWidth: 1,
    borderColor: colors.primary + '60',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 10,
    marginTop: -4,
  },
  exampleChipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Result
  resultCard: { backgroundColor: colors.primaryTint, borderRadius: 20, paddingVertical: 28, paddingHorizontal: 20, marginBottom: 20, alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary + '30' },
  resultLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },
  resultSub: { fontSize: 13, color: colors.textMid, marginTop: 8, fontWeight: '500' },
  resultPlaceholder: { alignItems: 'center', gap: 10 },
  resultPlaceholderEmoji: { fontSize: 36, opacity: 0.35 },
  resultPlaceholderText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // Categories
  categorySection: { marginBottom: 12 },
  categoryLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
  // gap + flexWrap: 'wrap' is unreliable on Android 11 (Yoga layout engine).
  // Use marginRight + marginBottom on each chip instead.
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, backgroundColor: colors.card, borderColor: colors.border, marginRight: 8, marginBottom: 8 },
  categoryChipActive: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  categoryEmoji: { fontSize: 13 },
  categoryTextActive: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  categoryTextInactive: { color: colors.textMid, fontSize: 12, fontWeight: '500' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.bg },
  scanButton: { width: 54, height: 54, borderRadius: 14, backgroundColor: colors.accentTint, borderWidth: 1.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  scanEmoji: { fontSize: 22 },
  proBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 },
  proBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800' },
  saveButton: { flex: 1, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  saveButtonDisabled: { backgroundColor: colors.border, shadowOpacity: 0, elevation: 0 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  saveButtonTextDisabled: { color: colors.textMuted },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(13,31,15,0.45)' },
  modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: colors.textDark, fontWeight: '800', fontSize: 20, marginBottom: 4 },
  modalSubtitle: { color: colors.textMuted, fontSize: 12, marginBottom: 16 },
  currencyList: { flexGrow: 0, maxHeight: 340 },
  currencyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12, marginBottom: 2, gap: 12 },
  currencyItemActive: { backgroundColor: colors.primaryTint },
  currencyFlag: { fontSize: 24, width: 32, textAlign: 'center' },
  currencyInfo: { flex: 1 },
  currencyCode: { color: colors.textDark, fontSize: 15, fontWeight: '700' },
  currencyCodeActive: { color: colors.primary },
  currencyName: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  currencyCheck: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  currencyCheckText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  currencyRemove: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  currencyRemoveText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  addCurrencyButton: { marginTop: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.primaryTint, borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary + '40' },
  addCurrencyText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  modalCancel: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  modalCancelText: { color: colors.textMuted, fontWeight: '600', fontSize: 15 },
});
