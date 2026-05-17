import React, { useMemo } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { useHistoryStore } from '../../src/store/historyStore';
import { usePremium } from '../../src/hooks/usePremium';
import { useProfileStore } from '../../src/store/profileStore';
import { useLocaleStore } from '../../src/store/localeStore';
import { formatDuration } from '../../src/core/formatter';
import { t } from '../../src/i18n';
import { colors } from '../../src/theme';
import type { Category, ConversionEntry } from '../../src/types';

const CATEGORY_COLORS: Record<Category, string> = {
  food: '#F59E0B', transport: '#3B82F6', housing: '#8B5CF6',
  tech: '#10B981', clothing: '#EC4899', leisure: '#F97316',
  health: '#06B6D4', other: '#6B7280',
};

// Category keys for t() — evaluated at render time, always locale-aware
const CATEGORY_KEYS: Category[] = ['food', 'transport', 'housing', 'tech', 'clothing', 'leisure', 'health', 'other'];

const BAR_CHART_HEIGHT = 160;
const BAR_CHART_WIDTH = Dimensions.get('window').width - 80;

type CategoryStat = { category: Category; minutes: number; count: number };

function computeStats(entries: ConversionEntry[]): CategoryStat[] {
  const map = new Map<Category, { minutes: number; count: number }>();
  for (const e of entries) {
    const existing = map.get(e.category) ?? { minutes: 0, count: 0 };
    map.set(e.category, { minutes: existing.minutes + e.durationMinutes, count: existing.count + 1 });
  }
  return Array.from(map.entries())
    .map(([category, s]) => ({ category, ...s }))
    .sort((a, b) => b.minutes - a.minutes);
}

function BarChart({ stats }: { stats: CategoryStat[] }) {
  if (stats.length === 0) return null;
  const maxMinutes = Math.max(...stats.map((s) => s.minutes), 1);
  const barWidth = Math.floor(BAR_CHART_WIDTH / stats.length) - 6;

  return (
    <Svg width={BAR_CHART_WIDTH} height={BAR_CHART_HEIGHT} accessibilityLabel={t('dashboard.byCategory')}>
      {stats.map((s, i) => {
        const barH = Math.max(4, (s.minutes / maxMinutes) * (BAR_CHART_HEIGHT - 24));
        const x = i * (barWidth + 6) + 2;
        const y = BAR_CHART_HEIGHT - barH - 18;
        return (
          <G key={s.category}>
            <Rect x={x} y={y} width={barWidth} height={barH} rx={6} fill={CATEGORY_COLORS[s.category]} opacity={0.85} />
            <SvgText x={x + barWidth / 2} y={BAR_CHART_HEIGHT - 2} fontSize={8} fill={colors.textMuted} textAnchor="middle">
              {s.category.slice(0, 4)}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export default function DashboardScreen() {
  const { canUse } = usePremium();
  const getActiveProfile = useProfileStore((s) => s.getActiveProfile);
  const getForMonth = useHistoryStore((s) => s.getForMonth);
  const { locale } = useLocaleStore();
  const profile = getActiveProfile();
  const weeklyHours = profile?.weeklyHours ?? 35;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;

  const thisMonthEntries = useMemo(() => getForMonth(currentYear, currentMonth), [getForMonth, currentYear, currentMonth]);
  const lastMonthEntries = useMemo(() => getForMonth(prevYear, prevMonth), [getForMonth, prevYear, prevMonth]);
  const thisMonthMinutes = useMemo(() => thisMonthEntries.reduce((s, e) => s + e.durationMinutes, 0), [thisMonthEntries]);
  const lastMonthMinutes = useMemo(() => lastMonthEntries.reduce((s, e) => s + e.durationMinutes, 0), [lastMonthEntries]);

  const deltaPct = lastMonthMinutes > 0
    ? Math.round(((thisMonthMinutes - lastMonthMinutes) / lastMonthMinutes) * 100)
    : null;

  const stats = useMemo(() => computeStats(thisMonthEntries), [thisMonthEntries]);
  const top5 = useMemo(() => [...thisMonthEntries].sort((a, b) => b.durationMinutes - a.durationMinutes).slice(0, 5), [thisMonthEntries]);

  // Locale-aware month name
  const dateLocale = locale === 'en' ? 'en-GB' : 'fr-FR';
  const monthName = now.toLocaleDateString(dateLocale, { month: 'long' });

  // Category labels computed from i18n at render time
  const categoryLabel = (cat: Category) => t(`converter.categories.${cat}`);

  if (!canUse('dashboard')) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.upsellContainer}>
          <View style={styles.upsellIconWrap}>
            <Text style={styles.upsellIcon}>📊</Text>
          </View>
          <Text style={styles.upsellTitle}>{t('dashboard.title')}</Text>
          <Text style={styles.upsellBody}>{t('dashboard.premiumBody')}</Text>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>✦ PREMIUM</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('dashboard.title')}</Text>

        {/* Total this month */}
        <View style={styles.heroCard}>
          <Text style={styles.heroCardLabel}>{t('dashboard.totalTimeThisMonth')} — {monthName}</Text>
          <Text style={styles.heroCardValue}>
            {thisMonthMinutes > 0 ? formatDuration(thisMonthMinutes, weeklyHours, locale) : '–'}
          </Text>
          {deltaPct !== null && (
            <View style={[styles.deltaBadge, deltaPct > 0 ? styles.deltaBadgeUp : styles.deltaBadgeDown]}>
              <Text style={[styles.deltaText, deltaPct > 0 ? styles.deltaTextUp : styles.deltaTextDown]}>
                {deltaPct > 0 ? `▲ +${deltaPct}%` : `▼ ${deltaPct}%`} {t('dashboard.vsLastMonth')}
              </Text>
            </View>
          )}
        </View>

        {/* Bar chart */}
        {stats.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('dashboard.byCategory')}</Text>
            <BarChart stats={stats} />
            <View style={styles.legend}>
              {stats.slice(0, 5).map((s) => (
                <View key={s.category} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[s.category] }]} />
                  <Text style={styles.legendText}>{categoryLabel(s.category)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={[styles.card, styles.emptyCard]}>
            <Text style={styles.emptyText}>{t('dashboard.noData')}</Text>
          </View>
        )}

        {/* Top 5 */}
        {top5.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('dashboard.topPurchases')}</Text>
            {top5.map((e, idx) => (
              <View key={e.id} style={[styles.topRow, idx < top5.length - 1 && styles.topRowBorder]}>
                <Text style={styles.topRank}>{idx + 1}</Text>
                <View style={styles.topInfo}>
                  <Text style={styles.topLabel} numberOfLines={1}>
                    {e.label ?? `${e.priceAmount} ${e.priceCurrency}`}
                  </Text>
                  <Text style={styles.topCategory}>{categoryLabel(e.category)}</Text>
                </View>
                <Text style={styles.topDuration}>{formatDuration(e.durationMinutes, weeklyHours, locale)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 16, paddingBottom: 40 },
  title: { color: colors.textDark, fontSize: 26, fontWeight: '800', marginBottom: 20 },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  heroCardLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  heroCardValue: { color: '#FFFFFF', fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  deltaBadge: { alignSelf: 'flex-start', marginTop: 10, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  deltaBadgeUp: { backgroundColor: 'rgba(255,80,80,0.25)' },
  deltaBadgeDown: { backgroundColor: 'rgba(255,255,255,0.2)' },
  deltaText: { fontSize: 13, fontWeight: '700' },
  deltaTextUp: { color: '#FFAAAA' },
  deltaTextDown: { color: 'rgba(255,255,255,0.9)' },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: colors.divider },
  cardTitle: { color: colors.textDark, fontWeight: '800', marginBottom: 14, fontSize: 15 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.textMid, fontSize: 11, fontWeight: '500' },
  emptyCard: { alignItems: 'center' },
  emptyText: { color: colors.textMuted },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  topRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  topRank: { color: colors.textMuted, width: 20, fontSize: 13, fontWeight: '700' },
  topInfo: { flex: 1 },
  topLabel: { color: colors.textDark, fontSize: 14, fontWeight: '600' },
  topCategory: { color: colors.textMuted, fontSize: 11 },
  topDuration: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  upsellContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  upsellIconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  upsellIcon: { fontSize: 36 },
  upsellTitle: { color: colors.textDark, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  upsellBody: { color: colors.textMid, textAlign: 'center', lineHeight: 22 },
  premiumBadge: { backgroundColor: colors.accentTint, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1.5, borderColor: colors.accent },
  premiumBadgeText: { color: colors.accentDark, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
});
