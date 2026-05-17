import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useHistoryStore } from '../../src/store/historyStore';
import { usePremium } from '../../src/hooks/usePremium';
import { useProfileStore } from '../../src/store/profileStore';
import { useLocaleStore } from '../../src/store/localeStore';
import { ConversionCard, CARD_HEIGHT } from '../../src/components/ConversionCard';
import { formatDuration } from '../../src/core/formatter';
import { t } from '../../src/i18n';
import { colors } from '../../src/theme';
import type { Category, ConversionEntry } from '../../src/types';

// ── Layout constants ──────────────────────────────────────────────────────────
// Keeping heights in one place makes getItemLayout exact and easy to maintain.
const SECTION_HEADER_HEIGHT = 40; // paddingVertical(8*2) + text(11) + marginTop(8) ≈ 40
// CARD_HEIGHT (82) is imported from ConversionCard so both sides stay in sync.

// ── Category filter chips ─────────────────────────────────────────────────────
const CATEGORY_VALUES: Array<{ value: Category | 'all'; icon: string }> = [
  { value: 'all',       icon: '🔍' },
  { value: 'food',      icon: '🍔' },
  { value: 'transport', icon: '🚗' },
  { value: 'housing',   icon: '🏠' },
  { value: 'tech',      icon: '💻' },
  { value: 'clothing',  icon: '👕' },
  { value: 'leisure',   icon: '🎮' },
  { value: 'health',    icon: '💊' },
  { value: 'other',     icon: '📦' },
];

// ── Flat list row types ───────────────────────────────────────────────────────
type FlatRow =
  | { type: 'header'; title: string; id: string }
  | { type: 'item';   entry: ConversionEntry;    id: string };

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupToFlat(entries: ConversionEntry[], dateLocale: string): FlatRow[] {
  // Group by calendar day
  const map = new Map<string, ConversionEntry[]>();
  for (const entry of entries) {
    const key = new Date(entry.createdAt).toLocaleDateString(dateLocale, {
      weekday: 'long', day: 'numeric', month: 'long',
    });
    const existing = map.get(key) ?? [];
    existing.push(entry);
    map.set(key, existing);
  }
  // Flatten: [header, item, item, header, item, …]
  const rows: FlatRow[] = [];
  for (const [title, group] of map) {
    rows.push({ type: 'header', title, id: `h-${title}` });
    for (const entry of group) {
      rows.push({ type: 'item', entry, id: entry.id });
    }
  }
  return rows;
}

function buildCSV(entries: ConversionEntry[]): string {
  const header = 'id,date,label,priceAmount,priceCurrency,durationMinutes,category,source\n';
  const rows = entries.map((e) =>
    [
      e.id,
      new Date(e.createdAt).toISOString(),
      `"${(e.label ?? '').replace(/"/g, '""')}"`,
      e.priceAmount,
      e.priceCurrency,
      e.durationMinutes.toFixed(2),
      e.category,
      e.source,
    ].join(','),
  );
  return header + rows.join('\n');
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const router      = useRouter();
  const entries     = useHistoryStore((s) => s.entries);
  const removeEntry = useHistoryStore((s) => s.removeEntry);
  const { canUse }  = usePremium();
  const { locale }  = useLocaleStore();
  const getActiveProfile = useProfileStore((s) => s.getActiveProfile);
  const profile     = getActiveProfile();
  const weeklyHours = profile?.weeklyHours ?? 35;

  const [filter, setFilter] = useState<Category | 'all'>('all');

  const dateLocale = locale === 'en' ? 'en-GB' : 'fr-FR';

  // Category filter labels — re-evaluated on locale change
  const categoryFilters = useMemo(
    () =>
      CATEGORY_VALUES.map((c) => ({
        ...c,
        label:
          c.value === 'all'
            ? t('history.all')
            : t(`converter.categories.${c.value}`),
      })),
    [locale],
  );

  const filtered = useMemo(
    () => (filter === 'all' ? entries : entries.filter((e) => e.category === filter)),
    [entries, filter],
  );

  // Flat list rows (header + items interleaved)
  const flatData = useMemo(
    () => groupToFlat(filtered, dateLocale),
    [filtered, dateLocale],
  );

  // Precomputed offsets — O(n) once, makes getItemLayout O(1)
  const itemLayouts = useMemo(() => {
    let offset = 0;
    return flatData.map((row) => {
      const height = row.type === 'header' ? SECTION_HEADER_HEIGHT : CARD_HEIGHT;
      const layout = { offset, height, index: 0 }; // index filled by getItemLayout
      offset += height;
      return layout;
    });
  }, [flatData]);

  const totalMinutes = useMemo(
    () => filtered.reduce((sum, e) => sum + e.durationMinutes, 0),
    [filtered],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(t('history.deleteConfirm'), undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => removeEntry(id) },
      ]);
    },
    [removeEntry],
  );

  const handleExportCSV = useCallback(async () => {
    if (!canUse('csv_export')) {
      Alert.alert(t('history.premiumTitle'), t('history.premiumBody'));
      return;
    }
    const csv = buildCSV(entries);
    const path = `${FileSystem.cacheDirectory}owoda_history.csv`;
    await FileSystem.writeAsStringAsync(path, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(path, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
    });
  }, [entries, canUse]);

  // Stable delete handler keyed by entry id — avoids creating a new function
  // reference on every render, which would bypass React.memo on ConversionCard
  // even though its comparator ignores onDelete.
  const makeDeleteHandler = useCallback(
    (id: string) => () => handleDelete(id),
    [handleDelete],
  );

  const renderRow = useCallback(
    ({ item }: { item: FlatRow }) => {
      if (item.type === 'header') {
        return <Text style={styles.sectionHeader}>{item.title}</Text>;
      }
      return (
        <ConversionCard
          entry={item.entry}
          onDelete={makeDeleteHandler(item.entry.id)}
        />
      );
    },
    [handleDelete, makeDeleteHandler],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('history.title')}</Text>
        <TouchableOpacity
          onPress={handleExportCSV}
          style={styles.exportButton}
          accessibilityRole="button"
          accessibilityLabel={t('history.exportCSV')}
        >
          <Text style={styles.exportText}>↑ CSV</Text>
          {!canUse('csv_export') && <Text style={styles.proBadge}>PRO</Text>}
        </TouchableOpacity>
      </View>

      {/* Summary */}
      {filtered.length > 0 && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryCount}>
            {filtered.length} {t('history.conversions')}
          </Text>
          <Text style={styles.summaryTotal}>
            {t('history.total')} : {formatDuration(totalMinutes, weeklyHours, locale)}
          </Text>
        </View>
      )}

      {/* Category filter chips (horizontal FlatList) */}
      <FlatList
        horizontal
        data={categoryFilters}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContent}
        style={styles.filterList}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            onPress={() => setFilter(f.value)}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
            accessibilityRole="radio"
            accessibilityLabel={f.label}
            accessibilityState={{ checked: filter === f.value }}
          >
            <Text style={styles.filterEmoji}>{f.icon}</Text>
            <Text
              style={
                filter === f.value ? styles.filterTextActive : styles.filterTextInactive
              }
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Main list */}
      {entries.length === 0 ? (
        /* ── Rich empty state (zero conversions ever) ────────────────────── */
        <View style={styles.emptyContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.emptyIcon}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>{t('history.emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('history.emptySubtitle')}</Text>
          <TouchableOpacity
            onPress={() => router.navigate('/(tabs)')}
            style={styles.emptyButton}
            accessibilityRole="button"
            accessibilityLabel={t('history.emptyAction')}
          >
            <Text style={styles.emptyButtonText}>{t('history.emptyAction')}</Text>
          </TouchableOpacity>
        </View>
      ) : flatData.length === 0 ? (
        /* ── No results for active filter ────────────────────────────────── */
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>{t('history.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item) => item.id}
          renderItem={renderRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          // ── Stability ─────────────────────────────────────────────────────
          // OFF: clipping unmounted cells corrupts emoji layout on Android 11
          // (view recycling discards the emoji bitmap between renders).
          removeClippedSubviews={false}
          // ── Performance ───────────────────────────────────────────────────
          // Higher batch sizes keep more cells alive in memory so the scroller
          // never encounters blank frames during fast flicks.
          // Trade-off: more JS work on the initial render; acceptable for a
          // history list that is unlikely to exceed 200 entries.
          maxToRenderPerBatch={20}
          initialNumToRender={20}
          windowSize={10}
          updateCellsBatchingPeriod={50}
          // ── O(1) layout ───────────────────────────────────────────────────
          // flatData mixes section headers (40 px) and cards (82 px).
          // A uniform length would produce wrong offsets past any header.
          // We precompute exact offsets once in itemLayouts (O(n) on filter
          // change) and read them in O(1) here.
          getItemLayout={(_data, index) => ({
            length: itemLayouts[index]?.height ?? CARD_HEIGHT,
            offset: itemLayouts[index]?.offset ?? 0,
            index,
          })}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: colors.textDark, fontSize: 26, fontWeight: '800' },
  exportButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  exportText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  proBadge: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  summaryBox: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.primaryTint,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  summaryCount: { color: colors.textMid, fontSize: 14, fontWeight: '500' },
  summaryTotal: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  filterList: { flexGrow: 0, marginBottom: 8 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 4, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: colors.card,
    borderColor: colors.border,
    marginHorizontal: 2,
  },
  filterChipActive: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  filterEmoji: { fontSize: 12 },
  filterTextActive:   { color: colors.primary, fontSize: 12, fontWeight: '700' },
  filterTextInactive: { color: colors.textMid,  fontSize: 12, fontWeight: '500' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 0 },
  // Rich empty state — zero conversions
  emptyIcon: { width: 80, height: 80, opacity: 0.3, marginBottom: 20 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  // Filter-empty state (entries exist but none match filter)
  emptyEmoji: { fontSize: 40, opacity: 0.3 },
  emptyText:  { color: colors.textMuted, fontSize: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionHeader: {
    // Must match SECTION_HEADER_HEIGHT (40px) as closely as possible
    height: SECTION_HEADER_HEIGHT,
    paddingTop: 16,        // top spacing counts toward the 40px
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
});
