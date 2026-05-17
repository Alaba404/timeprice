import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ConversionResult } from '../types';
import { formatDuration } from '../core/formatter';
import { useLocaleStore } from '../store/localeStore';
import { colors } from '../theme';

type Props = {
  result: ConversionResult;
  /** Required for locale-aware formatting (same value as profile.weeklyHours). */
  weeklyHours: number;
  size?: 'sm' | 'lg';
};

export function DurationBadge({ result, weeklyHours, size = 'lg' }: Props) {
  const { locale } = useLocaleStore();
  const isLarge = size === 'lg';

  // Recompute with the CURRENT locale so language changes are reflected
  // immediately without needing to re-run the conversion.
  const formatted = formatDuration(result.durationMinutes, weeklyHours, locale);

  // CAS02: never display the raw price amount here.
  // The parent screen already renders the "of your work time" label below this
  // component. For durations < 60 min we show a compact "X min" hint; for
  // longer durations the main label is self-explanatory — no subtitle needed.
  const subtitle =
    result.durationMinutes < 60
      ? `${Math.round(result.durationMinutes)} min`
      : null;

  return (
    <View
      style={styles.container}
      accessibilityLabel={formatted}
      accessibilityRole="text"
    >
      <Text
        style={isLarge ? styles.durationLarge : styles.durationSmall}
        adjustsFontSizeToFit
        allowFontScaling
      >
        {formatted}
      </Text>
      {isLarge && subtitle !== null && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  durationLarge: {
    fontWeight: '900',
    color: colors.primary,
    fontSize: 48,
    letterSpacing: -1,
  },
  durationSmall: {
    fontWeight: '800',
    color: colors.primary,
    fontSize: 22,
  },
  subtitle: {
    color: colors.textMid,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
});
