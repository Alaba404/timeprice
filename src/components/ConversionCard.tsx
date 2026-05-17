import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CategoryIcon } from './CategoryIcon';
import type { ConversionEntry } from '../types';
import { formatDuration } from '../core/formatter';
import { useProfileStore } from '../store/profileStore';
import { useLocaleStore } from '../store/localeStore';
import { t } from '../i18n';
import { colors } from '../theme';

// ─── CARD_HEIGHT ──────────────────────────────────────────────────────────────
// Exported so history.tsx can feed getItemLayout without measuring each cell.
//
// Layout breakdown (all values must match the StyleSheet below):
//   card.paddingTop    14
//   CategoryIcon.height 44   ← tallest child (self-contained 44×44 view)
//   card.paddingBottom 14
//   card.marginBottom  10
//   ──────────────────────
//   TOTAL              82
export const CARD_HEIGHT = 82;

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  entry: ConversionEntry;
  onPress?: () => void;
  onDelete?: () => void;
};

// ─── Component ───────────────────────────────────────────────────────────────

function ConversionCardInner({ entry, onPress, onDelete }: Props) {
  const getActiveProfile = useProfileStore((s) => s.getActiveProfile);
  const { locale } = useLocaleStore();
  const profile = getActiveProfile();
  const weeklyHours = profile?.weeklyHours ?? 35;

  const dateLocale = locale === 'en' ? 'en-GB' : 'fr-FR';
  const dateStr = new Date(entry.createdAt).toLocaleDateString(dateLocale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.card}
      activeOpacity={0.75}
      accessibilityLabel={
        `${entry.priceAmount} ${entry.priceCurrency}, ` +
        `${formatDuration(entry.durationMinutes, weeklyHours, locale)}`
      }
      accessibilityRole="button"
    >
      {/* Single icon system — CategoryIcon is self-contained (44×44).
          No emoji, no fallback state, no font-loading guards here. */}
      <CategoryIcon category={entry.category} />

      {/* Text block */}
      <View style={styles.textSection}>
        <Text style={styles.price} numberOfLines={1}>
          {entry.priceAmount.toFixed(2)} {entry.priceCurrency}
        </Text>
        <Text style={styles.date} numberOfLines={1}>
          {dateStr}
        </Text>
      </View>

      {/* Duration */}
      <View style={styles.durationWrap}>
        <Text style={styles.duration} numberOfLines={1}>
          {formatDuration(entry.durationMinutes, weeklyHours, locale)}
        </Text>
        <Text style={styles.durationLabel} numberOfLines={1}>
          {t('converter.durationLabel')}
        </Text>
      </View>

      {/* Delete button — only rendered when the prop is supplied */}
      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.delete')}
        >
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

/**
 * Memoised by entry identity.
 *
 * Entries are immutable once written, so comparing by `id` is sufficient.
 * This prevents FlatList from re-rendering cards that haven't changed when
 * sibling state (filters, new entries) causes a parent render.
 */
export const ConversionCard = React.memo(
  ConversionCardInner,
  (prev, next) => prev.entry.id === next.entry.id,
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  textSection: {
    flex: 1,
    gap: 3,
    overflow: 'hidden', // clip long text so durationWrap is never pushed off
  },
  price: {
    color: colors.textDark,
    fontWeight: '700',
    fontSize: 14,
  },
  date: {
    color: colors.textMuted,
    fontSize: 11,
  },
  durationWrap: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
  duration: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  durationLabel: {
    color: colors.textMuted,
    fontSize: 10,
  },
  deleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deleteBtnText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
    textAlign: 'center',
  },
});
