import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useProfileStore } from '../store/profileStore';
import { t } from '../i18n';
import { colors } from '../theme';

/**
 * Horizontal profile switcher shown on the converter screen.
 *
 * - 1 profile  → single non-interactive pill showing the profile name
 * - N profiles → scrollable row of tappable pills; active one is highlighted
 */
export function ProfileSelector() {
  const profiles  = useProfileStore((s) => s.profiles);
  const activeId  = useProfileStore((s) => s.activeProfileId);
  const setActive = useProfileStore((s) => s.setActiveProfile);

  // Nothing to show until at least one profile exists
  if (profiles.length === 0) return null;

  const multi = profiles.length > 1;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEnabled={multi}
      style={styles.scroll}
      contentContainerStyle={styles.contentContainer}
    >
      {profiles.map((p) => {
        const isActive = p.id === activeId;
        return (
          <TouchableOpacity
            key={p.id}
            onPress={() => multi && !isActive && setActive(p.id)}
            disabled={!multi || isActive}
            style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
            accessibilityRole="radio"
            accessibilityLabel={`${t('converter.profileLabel')} : ${p.name}`}
            accessibilityState={{ checked: isActive }}
            activeOpacity={multi && !isActive ? 0.65 : 1}
          >
            <Text
              style={isActive ? styles.chipTextActive : styles.chipTextInactive}
              numberOfLines={1}
            >
              {p.name}
            </Text>
            {/* Chevron appears on the active chip only when there are multiple profiles */}
            {isActive && multi && (
              <Text style={styles.chevron}>▾</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    marginBottom: 14,
  },
  contentContainer: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    maxWidth: 200,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    flexShrink: 1,
  },
  chipTextInactive: {
    color: colors.textMid,
    fontWeight: '500',
    fontSize: 13,
    flexShrink: 1,
  },
  chevron: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    lineHeight: 14,
    flexShrink: 0,
  },
});
