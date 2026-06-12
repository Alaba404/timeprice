/**
 * Human-readable duration formatting.
 *
 * Boundaries use work-time units:
 *   1 work-day = weeklyHours / 5 hours
 *   1 work-week = 5 work-days
 *   1 work-month = 4 work-weeks (≈ 20 work-days)
 *
 * Ranges:
 *   < 1 min          → "moins d'une minute" / "less than a minute"
 *   < 1h             → "42 minutes"
 *   ≥ 1h, < 1 day   → "3h 12min"
 *   ≥ 1d, < 5d      → "2 jours 4h"   / "2 days 4h"
 *   ≥ 5d, < 20d     → "1 semaine 3 jours" / "1 week 3 days"
 *   ≥ 20d, < 12mo   → "2 mois 1 semaine"  / "2 months 1 week"
 *   ≥ 12mo           → "3 ans 6 mois"     / "3 years 6 months"
 */

type Locale = 'fr' | 'en';

// ---------------------------------------------------------------------------
// Unit helpers — defined inline to avoid i18n coupling in a pure-utility file
// ---------------------------------------------------------------------------

function plural(n: number, singular: string, plural: string): string {
  return n > 1 ? `${n} ${plural}` : `${n} ${singular}`;
}

interface Units {
  lessThanMinute: string;
  minutes: (n: number) => string;
  hour: string;   // suffix: "3h" — same in both languages
  min: string;    // suffix: "12min"
  days: (n: number) => string;
  weeks: (n: number) => string;
  months: (n: number) => string;
  years: (n: number) => string;
}

const UNITS: Record<Locale, Units> = {
  fr: {
    lessThanMinute: "moins d'une minute",
    minutes: (n) => plural(n, 'minute', 'minutes'),
    hour: 'h',
    min: 'min',
    days:   (n) => plural(n, 'jour', 'jours'),
    weeks:  (n) => plural(n, 'semaine', 'semaines'),
    months: (n) => `${n} mois`,              // "mois" invariable en pluriel
    years:  (n) => plural(n, 'an', 'ans'),
  },
  en: {
    lessThanMinute: 'less than a minute',
    minutes: (n) => plural(n, 'minute', 'minutes'),
    hour: 'h',
    min: 'min',
    days:   (n) => plural(n, 'day', 'days'),
    weeks:  (n) => plural(n, 'week', 'weeks'),
    months: (n) => plural(n, 'month', 'months'),
    years:  (n) => plural(n, 'year', 'years'),
  },
};

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

export function formatDuration(
  totalMinutes: number,
  weeklyHours: number,
  locale: Locale = 'fr',
): string {
  const u = UNITS[locale] ?? UNITS.fr;

  if (totalMinutes < 1) return u.lessThanMinute;

  const dailyWorkMinutes  = (weeklyHours / 5) * 60;
  const weeklyWorkMinutes = dailyWorkMinutes * 5;
  const monthlyWorkMinutes = weeklyWorkMinutes * 4; // 4 work-weeks ≈ 1 month

  const totalDays   = totalMinutes / dailyWorkMinutes;
  const totalWeeks  = totalMinutes / weeklyWorkMinutes;
  const totalMonths = totalMinutes / monthlyWorkMinutes;
  const yearlyWorkMinutes = monthlyWorkMinutes * 12;

  // ≥ 12 work-months → years + remainder months (weeks dropped at this scale)
  if (totalMonths >= 12) {
    const yr = Math.floor(totalMonths / 12);
    const remainMo = Math.floor(
      (totalMinutes - yr * yearlyWorkMinutes) / monthlyWorkMinutes,
    );
    return remainMo > 0
      ? `${u.years(yr)} ${u.months(remainMo)}`
      : u.years(yr);
  }

  // ≥ 20 work-days → months + remainder weeks
  if (totalDays >= 20) {
    const mo = Math.floor(totalMonths);
    const remainWeeks = Math.floor(
      (totalMinutes - mo * monthlyWorkMinutes) / weeklyWorkMinutes,
    );
    return remainWeeks > 0
      ? `${u.months(mo)} ${u.weeks(remainWeeks)}`
      : u.months(mo);
  }

  // ≥ 5 work-days → weeks
  if (totalDays >= 5) {
    const w = Math.floor(totalWeeks);
    const remainDays = Math.floor(totalDays - w * 5);
    return remainDays > 0
      ? `${u.weeks(w)} ${u.days(remainDays)}`
      : u.weeks(w);
  }

  // ≥ 1 work-day → days (checked BEFORE the 60-min threshold)
  if (totalDays >= 1) {
    const d = Math.floor(totalDays);
    const remainMinutes = totalMinutes - d * dailyWorkMinutes;
    const h = Math.floor(remainMinutes / 60);
    return h > 0
      ? `${u.days(d)} ${h}${u.hour}`
      : u.days(d);
  }

  // ≥ 1 hour (but < 1 work-day)
  if (totalMinutes >= 60) {
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    return m > 0 ? `${h}${u.hour} ${m}${u.min}` : `${h}${u.hour}`;
  }

  // < 1 hour
  return u.minutes(Math.round(totalMinutes));
}

// ---------------------------------------------------------------------------
// formatDurationShort  (widget / badges)
// ---------------------------------------------------------------------------

export function formatDurationShort(
  totalMinutes: number,
  weeklyHours: number,
  locale: Locale = 'fr',
): string {
  if (totalMinutes < 1) return '<1min';

  const u = UNITS[locale] ?? UNITS.fr;
  const dailyWorkMinutes   = (weeklyHours / 5) * 60;
  const weeklyWorkMinutes  = dailyWorkMinutes * 5;
  const monthlyWorkMinutes = weeklyWorkMinutes * 4;

  const totalDays  = totalMinutes / dailyWorkMinutes;
  const totalWeeks = totalMinutes / weeklyWorkMinutes;

  if (totalDays >= 20) {
    return u.months(Math.floor(totalMinutes / monthlyWorkMinutes));
  }
  if (totalDays >= 5) {
    return u.weeks(Math.floor(totalWeeks));
  }
  if (totalDays >= 1) {
    return `${Math.floor(totalDays)}${locale === 'en' ? 'd' : 'j'}`;
  }
  if (totalMinutes >= 60) {
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    return m > 0 ? `${h}${u.hour}${m}` : `${h}${u.hour}`;
  }
  return `${Math.round(totalMinutes)}min`;
}

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------

/**
 * Formats a number as currency string with locale-aware separators.
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'fr-FR',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
