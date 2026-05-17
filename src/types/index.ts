// ─── User Profile ────────────────────────────────────────────────────────────

export type SalaryFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'annual';

export type UserProfile = {
  id: string;
  name: string;
  grossSalary: number;
  netSalary: number;
  frequency: SalaryFrequency;
  currency: string;             // ISO 4217 e.g. "EUR"
  weeklyHours: number;          // default 35
  paidVacationDays: number;     // default 25
  includeCommute: boolean;
  commuteDailyMinutes: number;
  useNetSalary: boolean;
  createdAt: number;            // Unix timestamp ms
  isDefault: boolean;
};

// ─── Conversion ───────────────────────────────────────────────────────────────

export type Category =
  | 'food'
  | 'transport'
  | 'housing'
  | 'tech'
  | 'clothing'
  | 'leisure'
  | 'health'
  | 'other';

export type ConversionSource = 'manual' | 'scanner' | 'share_extension';

export type ConversionEntry = {
  id: string;
  profileId: string;
  priceAmount: number;
  priceCurrency: string;
  convertedCurrency: string;
  durationMinutes: number;
  label?: string;
  category: Category;
  source: ConversionSource;
  createdAt: number;
};

export type DurationBreakdown = {
  hours: number;
  minutes: number;
  days: number;
  weeks: number;
};

export type ConversionResult = {
  durationMinutes: number;
  durationFormatted: string;
  hourlyRate: number;
  priceInProfileCurrency: number;
  breakdown: DurationBreakdown;
};

// ─── Exchange Rates ───────────────────────────────────────────────────────────

/** Keys are ISO 4217 codes, values are rate relative to EUR base */
export type ExchangeRates = Record<string, number>;

export type RateCache = {
  rates: ExchangeRates;
  fetchedAt: number; // Unix timestamp ms
};

// ─── i18n ─────────────────────────────────────────────────────────────────────

export type Locale = 'fr' | 'en';

// ─── Premium ──────────────────────────────────────────────────────────────────

export type PremiumFeature =
  | 'scanner'
  | 'widget'
  | 'csv_export'
  | 'dashboard'
  | 'unlimited_history'
  | 'multi_profile';
