export type CurrencyInfo = {
  code: string;
  flag: string;
  nameFr: string;
  nameEn: string;
  /** Short label shown alongside the code (e.g. "CFA") */
  badge?: string;
};

export const ALL_CURRENCIES: CurrencyInfo[] = [
  // ── Afrique de l'Ouest ──────────────────────────────────────────────────
  { code: 'XOF', flag: '🌍', nameFr: 'Franc CFA Afrique de l\'Ouest', nameEn: 'CFA Franc West Africa', badge: 'CFA' },
  { code: 'GNF', flag: '🇬🇳', nameFr: 'Franc guinéen', nameEn: 'Guinean Franc' },
  { code: 'NGN', flag: '🇳🇬', nameFr: 'Naira nigérian', nameEn: 'Nigerian Naira' },
  { code: 'GHS', flag: '🇬🇭', nameFr: 'Cédi ghanéen', nameEn: 'Ghanaian Cedi' },
  { code: 'SLL', flag: '🇸🇱', nameFr: 'Leone sierra-léonais', nameEn: 'Sierra Leonean Leone' },
  // ── Afrique Centrale ────────────────────────────────────────────────────
  { code: 'XAF', flag: '🌍', nameFr: 'Franc CFA Afrique Centrale', nameEn: 'CFA Franc Central Africa', badge: 'CFA' },
  { code: 'CDF', flag: '🇨🇩', nameFr: 'Franc congolais', nameEn: 'Congolese Franc' },
  // ── Afrique du Nord ─────────────────────────────────────────────────────
  { code: 'MAD', flag: '🇲🇦', nameFr: 'Dirham marocain', nameEn: 'Moroccan Dirham' },
  { code: 'TND', flag: '🇹🇳', nameFr: 'Dinar tunisien', nameEn: 'Tunisian Dinar' },
  { code: 'DZD', flag: '🇩🇿', nameFr: 'Dinar algérien', nameEn: 'Algerian Dinar' },
  { code: 'EGP', flag: '🇪🇬', nameFr: 'Livre égyptienne', nameEn: 'Egyptian Pound' },
  // ── Afrique de l'Est / Australe ─────────────────────────────────────────
  { code: 'KES', flag: '🇰🇪', nameFr: 'Shilling kényan', nameEn: 'Kenyan Shilling' },
  { code: 'ZAR', flag: '🇿🇦', nameFr: 'Rand sud-africain', nameEn: 'South African Rand' },
  { code: 'ETB', flag: '🇪🇹', nameFr: 'Birr éthiopien', nameEn: 'Ethiopian Birr' },
  { code: 'TZS', flag: '🇹🇿', nameFr: 'Shilling tanzanien', nameEn: 'Tanzanian Shilling' },
  // ── International ───────────────────────────────────────────────────────
  { code: 'EUR', flag: '🇪🇺', nameFr: 'Euro', nameEn: 'Euro' },
  { code: 'USD', flag: '🇺🇸', nameFr: 'Dollar américain', nameEn: 'US Dollar' },
  { code: 'GBP', flag: '🇬🇧', nameFr: 'Livre sterling', nameEn: 'British Pound' },
  { code: 'CAD', flag: '🇨🇦', nameFr: 'Dollar canadien', nameEn: 'Canadian Dollar' },
  { code: 'CHF', flag: '🇨🇭', nameFr: 'Franc suisse', nameEn: 'Swiss Franc' },
  { code: 'CNY', flag: '🇨🇳', nameFr: 'Yuan chinois', nameEn: 'Chinese Yuan' },
  { code: 'AED', flag: '🇦🇪', nameFr: 'Dirham des Émirats', nameEn: 'UAE Dirham' },
];

export const DEFAULT_USER_CURRENCIES = ['XOF', 'XAF', 'EUR', 'USD', 'GBP', 'MAD', 'GNF'];

export function getCurrency(code: string): CurrencyInfo {
  return (
    ALL_CURRENCIES.find((c) => c.code === code) ?? {
      code,
      flag: '💱',
      nameFr: code,
      nameEn: code,
    }
  );
}
