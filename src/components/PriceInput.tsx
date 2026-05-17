import React, { useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { colors } from '../theme';
import type { CurrencyInfo } from '../core/currencies';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  currencyInfo: CurrencyInfo;
  onCurrencyPress: () => void;
};

// Keep exporting for other screens that might use a simple string list
export const DISPLAY_CURRENCIES = ['XOF', 'XAF', 'EUR', 'USD', 'GBP', 'MAD', 'GNF', 'CAD', 'NGN', 'GHS'];

export function PriceInput({ value, onChangeText, currencyInfo, onCurrencyPress }: Props) {
  const inputRef = useRef<TextInput>(null);

  const inputProps: TextInputProps = {
    keyboardType: 'decimal-pad',
    value,
    onChangeText,
    placeholder: '0',
    placeholderTextColor: colors.border,
    style: [styles.textInput, { fontVariant: ['tabular-nums'] } as object],
    autoFocus: false,
  };

  return (
    <View style={styles.container} accessibilityLabel="Champ de saisie du prix">
      <TouchableOpacity
        onPress={onCurrencyPress}
        style={styles.currencyButton}
        accessibilityLabel={`Devise : ${currencyInfo.code}. Appuyer pour changer.`}
        accessibilityRole="button"
      >
        <Text style={styles.currencyFlag}>{currencyInfo.flag}</Text>
        <Text style={styles.currencyCode}>
          {currencyInfo.code}{currencyInfo.badge ? ` · ${currencyInfo.badge}` : ''}
        </Text>
        <Text style={styles.currencyChevron}>▾</Text>
      </TouchableOpacity>

      <TextInput ref={inputRef} accessibilityLabel="Montant du prix" {...inputProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryTint,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.primary + '50',
  },
  currencyFlag: {
    fontSize: 18,
  },
  currencyCode: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  currencyChevron: {
    color: colors.primary,
    fontSize: 10,
    marginTop: 1,
  },
  textInput: {
    flex: 1,
    color: colors.textDark,
    fontSize: 42,
    fontWeight: '800',
  },
});
