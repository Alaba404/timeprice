import type { UserProfile, ConversionResult, ExchangeRates } from '../types';
import { formatDuration } from './formatter';

// ─── Salary normalisation helpers ────────────────────────────────────────────

const WEEKS_PER_YEAR = 52;

/**
 * Converts any salary frequency to an annual gross/net amount.
 * weeklyHours is needed to convert hourly and daily frequencies.
 */
function toAnnualSalary(
  amount: number,
  frequency: UserProfile['frequency'],
  weeklyHours: number,
): number {
  switch (frequency) {
    case 'annual':
      return amount;
    case 'monthly':
      return amount * 12;
    case 'weekly':
      return amount * WEEKS_PER_YEAR;
    case 'daily':
      return amount * (WEEKS_PER_YEAR * 5);
    case 'hourly':
      // annual = hourlyRate × hoursPerWeek × weeksPerYear
      return amount * WEEKS_PER_YEAR * weeklyHours;
    default: {
      // Exhaustiveness guard — TypeScript will catch unhandled cases at compile time
      const _exhaustive: never = frequency;
      return _exhaustive;
    }
  }
}

// ─── Core: hourly rate ────────────────────────────────────────────────────────

/**
 * Computes the real hourly rate for a given profile, in the profile's currency.
 *
 * ── Formula ──────────────────────────────────────────────────────────────────
 *
 *   hourlyRate = annualSalary / realAnnualHours
 *
 *   annualSalary    = salary normalised to annual (see toAnnualSalary)
 *
 *   workingDays     = WEEKS_PER_YEAR × 5 − paidVacationDays
 *                   = 52 × 5 − vacDays  (e.g. 260 − 21 = 239)
 *
 *   annualWorkHours = workingDays × (weeklyHours / 5)
 *                   (= hours per day × days worked per year)
 *
 *   commuteHours    = workingDays × commuteDailyMinutes / 60   [if enabled]
 *                   (unpaid commute time "costs" real life time)
 *
 *   realAnnualHours = annualWorkHours + commuteHours
 *
 * ── Example (160 000 XOF/month, 40 h/week, 21 vacation days, no commute) ──
 *
 *   annualSalary    = 160 000 × 12    = 1 920 000 XOF
 *   workingDays     = 260 − 21        = 239 days
 *   annualWorkHours = 239 × 8         = 1 912 h
 *   hourlyRate      = 1 920 000 / 1 912 ≈ 1 004 XOF/h
 *
 *   Note: the simple approximation (monthly / (hours/week × 4 weeks)) gives
 *   160 000 / 160 = 1 000 XOF/h.  The formula above is more precise because
 *   it accounts for the exact number of working days after deducting vacation.
 *   With 0 vacation days: 260 × 8 = 2 080 h → 1 920 000 / 2 080 = 923 XOF/h.
 *
 * ── Why is "de travail" different from calendar hours? ──────────────────────
 *   A "work-day" = weeklyHours / 5 hours (e.g. 8 h for a 40 h/week contract).
 *   Vacation days reduce the number of working days in the year; the result is
 *   a higher hourly rate because the same annual salary is earned in fewer hours.
 */
export function computeHourlyRate(profile: UserProfile): number {
  if (profile.weeklyHours <= 0) return 0;

  const salary = profile.useNetSalary ? profile.netSalary : profile.grossSalary;
  if (salary <= 0) return 0;

  const annualSalary = toAnnualSalary(salary, profile.frequency, profile.weeklyHours);

  // Working days per year (Monday–Friday only)
  const workingDaysPerYear = WEEKS_PER_YEAR * 5 - profile.paidVacationDays;
  if (workingDaysPerYear <= 0) return 0;

  // Paid hours actually worked per year (excluding vacation)
  const annualWorkHours = workingDaysPerYear * (profile.weeklyHours / 5);

  // Add commute time if requested (commute is unpaid time that "costs" real life time)
  const commuteHoursPerYear = profile.includeCommute
    ? (workingDaysPerYear * profile.commuteDailyMinutes) / 60
    : 0;

  const realAnnualHours = annualWorkHours + commuteHoursPerYear;
  if (realAnnualHours <= 0) return 0;

  return annualSalary / realAnnualHours;
}

// ─── Core: price → time conversion ───────────────────────────────────────────

/**
 * Converts a price in any currency into work duration using the profile's real hourly rate.
 *
 * @param price           Amount to convert (must be ≥ 0)
 * @param priceCurrency   ISO 4217 code of the price currency
 * @param profile         User profile
 * @param exchangeRates   EUR-based exchange rates map (fallback 1:1 if missing)
 */
export function convertPrice(
  price: number,
  priceCurrency: string,
  profile: UserProfile,
  exchangeRates: ExchangeRates,
): ConversionResult {
  // Clamp negative prices to 0 — a price cannot be negative
  const safePrice = Math.max(0, price);

  const hourlyRate = computeHourlyRate(profile);

  // Convert price to profile currency via EUR base
  // rate[X] = how many X per 1 EUR
  // priceInEUR = safePrice / rate[priceCurrency]  (or safePrice if priceCurrency === 'EUR')
  // priceInProfile = priceInEUR * rate[profileCurrency]
  const priceInProfileCurrency = convertCurrency(
    safePrice,
    priceCurrency,
    profile.currency,
    exchangeRates,
  );

  // Edge case: hourlyRate is 0 (salary not configured yet)
  const durationMinutes =
    hourlyRate > 0 ? (priceInProfileCurrency / hourlyRate) * 60 : 0;

  const breakdown = minutesToBreakdown(durationMinutes, profile.weeklyHours);

  return {
    durationMinutes,
    durationFormatted: formatDuration(durationMinutes, profile.weeklyHours),
    hourlyRate,
    priceInProfileCurrency,
    breakdown,
  };
}

// ─── Currency helpers ─────────────────────────────────────────────────────────

/**
 * Converts an amount between two currencies using EUR-based rates.
 * Falls back to 1:1 if a rate is missing (offline / exotic currency).
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates,
): number {
  if (fromCurrency === toCurrency) return amount;

  // Normalise to EUR first
  const fromRate = rates[fromCurrency] ?? 1;
  const toRate = rates[toCurrency] ?? 1;

  // rate[X] = amount of X per 1 EUR  →  EUR = amount / fromRate
  const amountInEur = amount / fromRate;
  return amountInEur * toRate;
}

// ─── Duration breakdown ───────────────────────────────────────────────────────

/**
 * Splits a total number of minutes into a human-readable breakdown.
 * A work "day" = weeklyHours / 5 hours.
 */
export function minutesToBreakdown(
  totalMinutes: number,
  weeklyHours: number,
): { hours: number; minutes: number; days: number; weeks: number } {
  const safeMinutes = Math.max(0, totalMinutes);
  const dailyWorkMinutes = (weeklyHours / 5) * 60;
  const weeklyWorkMinutes = dailyWorkMinutes * 5;

  const weeks = Math.floor(safeMinutes / weeklyWorkMinutes);
  const remainAfterWeeks = safeMinutes % weeklyWorkMinutes;

  const days = Math.floor(remainAfterWeeks / dailyWorkMinutes);
  const remainAfterDays = remainAfterWeeks % dailyWorkMinutes;

  const hours = Math.floor(remainAfterDays / 60);
  const minutes = Math.round(remainAfterDays % 60);

  return { weeks, days, hours, minutes };
}
