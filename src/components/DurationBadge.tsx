import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, type NativeSyntheticEvent, type TextLayoutEventData } from 'react-native';
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

const BASE_FONT = 48;
const FONT_STEP = 4;
const FONT_MIN  = 22;

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

  // ── Responsive font size — lg only ───────────────────────────────────────
  // A hidden measurement Text (position:absolute, opacity:0) renders accessibleText
  // at the current lgFontSize. onTextLayout fires after each render; if the text
  // still wraps to more than 1 line, lgFontSize drops by FONT_STEP. Converges in
  // at most (BASE_FONT - FONT_MIN) / FONT_STEP ≈ 7 iterations. No infinite loop:
  // the size only decreases and is clamped at FONT_MIN.
  const [lgFontSize, setLgFontSize] = useState(BASE_FONT);
  const prevAccessibleTextRef = useRef('');

  useEffect(() => {
    if (!isLarge) return;
    // Reset to base font whenever the final text changes so we re-measure from scratch
    if (accessibleText !== prevAccessibleTextRef.current) {
      prevAccessibleTextRef.current = accessibleText;
      setLgFontSize(BASE_FONT);
    }
  }, [accessibleText, isLarge]);

  const handleMeasureLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      // More than 1 line at current size → shrink by one step
      if (e.nativeEvent.lines.length > 1 && lgFontSize > FONT_MIN) {
        setLgFontSize((prev) => Math.max(prev - FONT_STEP, FONT_MIN));
      }
    },
    [lgFontSize],
  );

  // CAS02: subtitle shows compact "X min" hint for durations < 60 min only
  const subtitle =
    result.durationMinutes < 60
      ? `${Math.round(result.durationMinutes)} min`
      : null;

  const lgStyle = isLarge
    ? { fontSize: lgFontSize, lineHeight: lgFontSize + 8 }
    : null;

  return (
    <View
      style={[styles.container, isLarge && styles.containerLarge]}
      accessibilityLabel={accessibleText}
      accessibilityRole="text"
    >
      {/* Hidden measurement layer — absolutely positioned so it does not
          affect the container's height. Measures accessibleText (the stable
          final value) not the animated formatted text. */}
      {isLarge && (
        <View style={styles.measureLayer} pointerEvents="none">
          <Text
            style={[styles.durationLarge, lgStyle]}
            allowFontScaling={false}
            onTextLayout={handleMeasureLayout}
          >
            {accessibleText}
          </Text>
        </View>
      )}

      {/* Visible animated text — always rendered at the already-measured size */}
      <Text
        style={[
          isLarge ? styles.durationLarge : styles.durationSmall,
          lgStyle,
        ]}
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
  // Absolutely positioned, opacity 0 — used only for onTextLayout measurement.
  // left:0 + right:0 gives it the full container width on all platforms.
  measureLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
  },
  durationLarge: {
    fontWeight: '900',
    color: colors.primary,
    fontSize: BASE_FONT,
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
