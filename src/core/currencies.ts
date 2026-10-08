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
  { code: 'XOF', flag: '🌍', nameFr: 'Franc CFA (BCEAO)', nameEn: 'Franc CFA (BCEAO)', badge: 'F CFA' },
  { code: 'GNF', flag: '🇬🇳', nameFr: 'Franc guinéen', nameEn: 'Guinean Franc' },
  { code: 'NGN', flag: '🇳🇬', nameFr: 'Naira nigérian', nameEn: 'Nigerian Naira' },
  { code: 'GHS', flag: '🇬🇭', nameFr: 'Cédi ghanéen', nameEn: 'Ghanaian Cedi' },
  { code: 'SLL', flag: '🇸🇱', nameFr: 'Leone sierra-léonais', nameEn: 'Sierra Leonean Leone' },
  // ── Afrique Centrale ────────────────────────────────────────────────────
  { code: 'XAF', flag: '🌍', nameFr: 'Franc CFA (BEAC)', nameEn: 'Franc CFA (BEAC)', badge: 'F CFA' },
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

export const DEFAULT_USER_CURRENCIES = ['XOF', 'XAF', 'NGN', 'EUR', 'USD'];

const COUNTRY_CURRENCY: Record<string, string> = {
  // XOF zone (BCEAO)
  SN: 'XOF', CI: 'XOF', ML: 'XOF', BF: 'XOF', BJ: 'XOF', TG: 'XOF', NE: 'XOF', GW: 'XOF',
  // XAF zone (BEAC)
  CM: 'XAF', CF: 'XAF', TD: 'XAF', CG: 'XAF', GQ: 'XAF', GA: 'XAF',
  // Other African currencies
  NG: 'NGN', GN: 'GNF', GH: 'GHS', SL: 'SLL',
  CD: 'CDF', MA: 'MAD', TN: 'TND', DZ: 'DZD', EG: 'EGP',
  KE: 'KES', ZA: 'ZAR', ET: 'ETB', TZ: 'TZS',
  // International
  US: 'USD', GB: 'GBP', CA: 'CAD', CH: 'CHF', CN: 'CNY', AE: 'AED',
  // Euro zone
  FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR', BE: 'EUR',
  NL: 'EUR', AT: 'EUR', FI: 'EUR', IE: 'EUR', LU: 'EUR',
};

/** Returns the most likely currency code for a BCP 47 languageTag (e.g. "fr-SN", "en-US"). Falls back to EUR. */
export function getCurrencyFromLocale(languageTag: string): string {
  const parts = languageTag.split('-');
  const country = parts.length >= 2 ? parts[parts.length - 1].toUpperCase() : '';
  return COUNTRY_CURRENCY[country] ?? 'EUR';
}

/**
 * Returns the currency label to display alongside an amount or input field.
 * XOF/XAF: "F CFA · XOF" / "F CFA · XAF" — disambiguates the two CFA zones.
 * Others: badge if defined, otherwise the ISO code.
 */
export function getCurrencyLabel(currency: string): string {
  const info = getCurrency(currency);
  if (currency === 'XOF' || currency === 'XAF') {
    return `${info.badge} · ${currency}`;
  }
  return info.badge ?? currency;
}

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

/**
 * Format a price amount for display:
 * - Uses the badge label (e.g. "CFA") instead of the raw code ("XOF")
 * - XOF/XAF: no decimals, space as thousands separator → "25 000 F CFA · XOF"
 * - Other currencies: up to 2 decimals, space separator → "85.50 USD"
 */
export function formatPriceDisplay(amount: number, currency: string): string {
  const label = getCurrencyLabel(currency);
  const noCents = currency === 'XOF' || currency === 'XAF';

  if (noCents) {
    const str = Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${str} ${label}`;
  }

  const val = Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2);
  const [intPart, decPart] = val.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const str = decPart ? `${formattedInt}.${decPart}` : formattedInt;
  return `${str} ${label}`;
}
