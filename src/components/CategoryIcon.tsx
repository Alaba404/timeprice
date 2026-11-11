/*
 * CategoryIcon — Lucide SVG icon in a colored tile.
 * All categories share colors.primaryTint background.
 */
import React from 'react';
import { View } from 'react-native';
import type { Category } from '../types';
import { Icon, type IconName } from './Icon';
import { colors } from '../theme';

const CATEGORY_ICON: Record<Category, IconName> = {
  food:      'utensils',
  transport: 'car',
  housing:   'house',
  tech:      'laptop',
  clothing:  'shirt',
  leisure:   'gamepad-2',
  health:    'pill',
  other:     'package',
};

type Props = { category: string | undefined };

function CategoryIconInner({ category }: Props) {
  const key = (category ?? '').toLowerCase().trim() as Category;
  const iconName: IconName = CATEGORY_ICON[key] ?? 'package';

  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primaryTint,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={iconName} size={22} color={colors.primary} />
    </View>
  );
}

export const CategoryIcon = React.memo(CategoryIconInner);
