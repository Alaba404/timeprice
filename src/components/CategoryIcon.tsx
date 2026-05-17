/**
 * CategoryIcon — emojis dans un conteneur coloré.
 *
 * Les logs de diagnostic (session CAS15) ont confirmé que le mapping
 * catégorie → icône est 100 % correct.  Le problème était un bug de rendu
 * Android : MaterialCommunityIcons affiche un glyphe rectangulaire quand
 * la TTF n'est pas encore disponible pour certaines cellules du premier batch.
 *
 * On revient aux emojis avec les paramètres critiques Android :
 *   • lineHeight: 28  → centre le glyphe verticalement dans son box
 *   • pas de font personnalisée → l'emoji system font est toujours disponible
 *   • React.memo        → évite les re-renders inutiles dans la FlatList
 */
import React from 'react';
import { View, Text } from 'react-native';
import type { Category } from '../types';

// ─── Configuration ────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<Category, { emoji: string; bg: string }> = {
  food:      { emoji: '🍔', bg: '#FF6B3520' },
  transport: { emoji: '🚗', bg: '#2196F320' },
  housing:   { emoji: '🏠', bg: '#4CAF5020' },
  tech:      { emoji: '💻', bg: '#9C27B020' },
  clothing:  { emoji: '👕', bg: '#E91E6320' },
  leisure:   { emoji: '🎮', bg: '#FF980020' },
  health:    { emoji: '💊', bg: '#F4433620' },
  other:     { emoji: '📦', bg: '#607D8B20' },
};

const FALLBACK = CATEGORY_CONFIG['other'];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = { category: string | undefined };

function CategoryIconInner({ category }: Props) {
  const key = (category ?? '').toLowerCase().trim() as Category;
  const config = CATEGORY_CONFIG[key] ?? FALLBACK;

  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: config.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 22,
          lineHeight: 28,   // obligatoire sur Android pour centrer les emojis
          textAlign: 'center',
          includeFontPadding: false,  // Android: supprime le padding caché
        }}
        allowFontScaling={false}      // bloque le scaling système
      >
        {config.emoji}
      </Text>
    </View>
  );
}

export const CategoryIcon = React.memo(CategoryIconInner);
