import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
  useAnimatedStyle,
} from 'react-native-reanimated';
import type { ConversionResult } from '../types';
import { formatDuration } from '../core/formatter';
import { useLocaleStore } from '../store/localeStore';
import { colors } from '../theme';

function getResultFontSize(text: string): number {
  const len = text.length;
  if (len <= 10) return 48;
  if (len <= 16) return 40;
  if (len <= 22) return 32;
  return 26;
}

type Props = {
  result: ConversionResult;
  /** Required for locale-aware formatting (same value as profile.weeklyHours). */
  weeklyHours: number;
  size?: 'sm' | 'lg';
};

export function DurationBadge({ result, weeklyHours, size = 'lg' }: Props) {
  const { locale } = useLocaleStore();
  const isLarge = size === 'lg';

  // ── Count-up animation (lg only) ─────────────────────────────────────────
  // Small badges (history cards) display instantly — no animation needed.
  const rafRef = useRef<number | null>(null);
  const [displayedMinutes, setDisplayedMinutes] = useState(result.durationMinutes);

  // Reanimated: subtitle fade-in 200ms after the 800ms count-up ends
  const subtitleOpacity = useSharedValue(isLarge ? 0 : 1);
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));

  useEffect(() => {
    if (!isLarge) {
      setDisplayedMinutes(result.durationMinutes);
      return;
    }

    // Cancel any running frame loop before starting a new one
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const target   = result.durationMinutes;
    const startMs  = Date.now();
    const DURATION = 800; // ms

    setDisplayedMinutes(0);
    subtitleOpacity.value = 0;

    const tick = () => {
      const elapsed = Date.now() - startMs;
      const t       = Math.min(elapsed / DURATION, 1);
      const eased   = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setDisplayedMinutes(target * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    // Subtitle fades in 200ms after the count-up finishes (800 + 200 = 1000ms delay)
    subtitleOpacity.value = withDelay(1000, withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    }));

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [result.durationMinutes, isLarge]);

  // Format the currently-animated value; accessibility always reads the final value
  const formatted      = formatDuration(displayedMinutes, weeklyHours, locale);
  const accessibleText = formatDuration(result.durationMinutes, weeklyHours, locale);

  // Use the final (stable) text to compute font size so it doesn't jump during animation
  const dynamicFontSize: TextStyle | null = isLarge
    ? { fontSize: getResultFontSize(accessibleText), lineHeight: getResultFontSize(accessibleText) + 8 }
    : null;

  // CAS02: subtitle shows compact "X min" hint for durations < 60 min only
  const subtitle =
    result.durationMinutes < 60
      ? `${Math.round(result.durationMinutes)} min`
      : null;

  return (
    <View
      style={[styles.container, isLarge && styles.containerLarge]}
      accessibilityLabel={accessibleText}
      accessibilityRole="text"
    >
      <Text
        style={[isLarge ? styles.durationLarge : styles.durationSmall, dynamicFontSize]}
        allowFontScaling={false}
        numberOfLines={isLarge ? 2 : 1}
      >
        {formatted}
      </Text>
      {isLarge && subtitle !== null && (
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          {subtitle}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  containerLarge: {
    justifyContent: 'center',
    width: '100%',
  },
  durationLarge: {
    fontWeight: '900',
    color: colors.primary,
    fontSize: 48,        // overridden at runtime by dynamicFontSize
    letterSpacing: -1,
    textAlign: 'center',
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
