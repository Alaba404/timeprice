import { computeHourlyRate, convertPrice, convertCurrency, minutesToBreakdown } from '../src/core/converter';
import type { UserProfile, ExchangeRates } from '../src/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const EUR_RATES: ExchangeRates = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  XOF: 655.96,
  MAD: 10.85,
  TND: 3.32,
  CAD: 1.47,
};

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'test-1',
    name: 'Test User',
    grossSalary: 36000,
    netSalary: 28000,
    frequency: 'annual',
    currency: 'EUR',
    weeklyHours: 35,
    paidVacationDays: 25,
    includeCommute: false,
    commuteDailyMinutes: 0,
    useNetSalary: false,
    createdAt: Date.now(),
    isDefault: true,
    ...overrides,
  };
}

// ─── computeHourlyRate ────────────────────────────────────────────────────────

describe('computeHourlyRate', () => {
  test('standard French salaried worker (35h/week, 25 vacation days, gross)', () => {
    const profile = makeProfile();
    // workingDays = 52*5 - 25 = 235
    // annualWorkHours = 235 * 7 = 1645
    // hourlyRate = 36000 / 1645 ≈ 21.88
    const rate = computeHourlyRate(profile);
    expect(rate).toBeCloseTo(21.88, 1);
  });

  test('uses net salary when useNetSalary is true', () => {
    const profile = makeProfile({ useNetSalary: true });
    const rate = computeHourlyRate(profile);
    // 28000 / 1645 ≈ 17.02
    expect(rate).toBeCloseTo(17.02, 1);
  });

  test('adds commute time to denominator', () => {
    const profile = makeProfile({ includeCommute: true, commuteDailyMinutes: 60 });
    // commuteHoursPerYear = 235 * 1h = 235h
    // realHours = 1645 + 235 = 1880
    // rate = 36000 / 1880 ≈ 19.15
    const rate = computeHourlyRate(profile);
    expect(rate).toBeCloseTo(19.15, 1);
  });

  test('returns 0 when salary is 0', () => {
    const profile = makeProfile({ grossSalary: 0, netSalary: 0 });
    expect(computeHourlyRate(profile)).toBe(0);
  });

  test('returns 0 when weeklyHours is 0', () => {
    const profile = makeProfile({ weeklyHours: 0 });
    expect(computeHourlyRate(profile)).toBe(0);
  });

  test('handles freelancer with 4h/week (edge case)', () => {
    const profile = makeProfile({ weeklyHours: 4, grossSalary: 10000, paidVacationDays: 0 });
    // workingDays = 260, annualWorkHours = 260 * 0.8 = 208
    // rate = 10000 / 208 ≈ 48.08
    const rate = computeHourlyRate(profile);
    expect(rate).toBeCloseTo(48.08, 1);
  });

  test('monthly salary converts correctly', () => {
    const profile = makeProfile({ grossSalary: 3000, frequency: 'monthly' });
    // annual = 36000 — same as base fixture
    const rateMonthly = computeHourlyRate(profile);
    const rateAnnual = computeHourlyRate(makeProfile({ grossSalary: 36000, frequency: 'annual' }));
    expect(rateMonthly).toBeCloseTo(rateAnnual, 5);
  });

  test('hourly salary converts correctly', () => {
    // If hourly rate is declared as 20€/h we should get back ~20€/h (slight difference from vacation)
    const profile = makeProfile({ grossSalary: 20, frequency: 'hourly', paidVacationDays: 0 });
    const rate = computeHourlyRate(profile);
    // with 0 vacation days rate should equal input
    expect(rate).toBeCloseTo(20, 4);
  });

  test('paidVacationDays equal to all working days returns 0', () => {
    const profile = makeProfile({ paidVacationDays: 260 });
    expect(computeHourlyRate(profile)).toBe(0);
  });
});

// ─── convertPrice ─────────────────────────────────────────────────────────────

describe('convertPrice', () => {
  test('10€ coffee for a 36k salaried worker', () => {
    const result = convertPrice(10, 'EUR', makeProfile(), EUR_RATES);
    // hourlyRate ≈ 21.88, durationMinutes = (10/21.88)*60 ≈ 27.4
    expect(result.durationMinutes).toBeCloseTo(27.4, 0);
    expect(result.priceInProfileCurrency).toBeCloseTo(10, 5);
  });

  test('USD price converts to EUR before calculation', () => {
    // $10.80 = ~10€ at rate 1.08
    const result = convertPrice(10.80, 'USD', makeProfile(), EUR_RATES);
    expect(result.priceInProfileCurrency).toBeCloseTo(10, 1);
  });

  test('negative price is clamped to 0', () => {
    const result = convertPrice(-50, 'EUR', makeProfile(), EUR_RATES);
    expect(result.durationMinutes).toBe(0);
    expect(result.priceInProfileCurrency).toBe(0);
  });

  test('price in exotic XOF currency (FCFA)', () => {
    // 6559.6 XOF ≈ 10 EUR (6559.6 / 655.96)
    const result = convertPrice(6559.6, 'XOF', makeProfile(), EUR_RATES);
    expect(result.priceInProfileCurrency).toBeCloseTo(10, 0);
  });

  test('unknown currency falls back to 1:1 with EUR', () => {
    const result = convertPrice(10, 'ZZZ', makeProfile(), EUR_RATES);
    // ZZZ not in rates → fallback 1:1 → 10 ZZZ treated as 10 EUR
    expect(result.priceInProfileCurrency).toBeCloseTo(10, 5);
  });

  test('returns zero duration when hourlyRate is 0', () => {
    const result = convertPrice(100, 'EUR', makeProfile({ grossSalary: 0 }), EUR_RATES);
    expect(result.durationMinutes).toBe(0);
  });

  test('profile in USD, price in EUR', () => {
    const usdProfile = makeProfile({ currency: 'USD', grossSalary: 50000 });
    const result = convertPrice(100, 'EUR', usdProfile, EUR_RATES);
    // 100 EUR → 108 USD
    expect(result.priceInProfileCurrency).toBeCloseTo(108, 0);
  });
});

// ─── convertCurrency ──────────────────────────────────────────────────────────

describe('convertCurrency', () => {
  test('same currency returns same amount', () => {
    expect(convertCurrency(100, 'EUR', 'EUR', EUR_RATES)).toBe(100);
  });

  test('EUR to USD', () => {
    expect(convertCurrency(100, 'EUR', 'USD', EUR_RATES)).toBeCloseTo(108, 2);
  });

  test('USD to EUR', () => {
    expect(convertCurrency(108, 'USD', 'EUR', EUR_RATES)).toBeCloseTo(100, 1);
  });

  test('USD to GBP (cross-rate via EUR)', () => {
    // 108 USD → 100 EUR → 86 GBP
    expect(convertCurrency(108, 'USD', 'GBP', EUR_RATES)).toBeCloseTo(86, 1);
  });
});

// ─── minutesToBreakdown ───────────────────────────────────────────────────────

describe('minutesToBreakdown', () => {
  test('90 minutes = 1h30 (35h week → 7h day)', () => {
    const b = minutesToBreakdown(90, 35);
    expect(b.hours).toBe(1);
    expect(b.minutes).toBe(30);
    expect(b.days).toBe(0);
    expect(b.weeks).toBe(0);
  });

  test('one full work-day (420min for 35h week)', () => {
    const b = minutesToBreakdown(420, 35);
    expect(b.days).toBe(1);
    expect(b.hours).toBe(0);
  });

  test('one full work-week (2100min for 35h week)', () => {
    const b = minutesToBreakdown(2100, 35);
    expect(b.weeks).toBe(1);
    expect(b.days).toBe(0);
  });

  test('negative minutes clamps to 0', () => {
    const b = minutesToBreakdown(-100, 35);
    expect(b.hours).toBe(0);
    expect(b.minutes).toBe(0);
  });
});
