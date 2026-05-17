import { formatDuration, formatDurationShort, formatCurrency } from '../src/core/formatter';

const WH = 35; // 35h/week → 7h/day

describe('formatDuration', () => {
  test('0 minutes → "moins d\'une minute"', () => {
    expect(formatDuration(0, WH)).toBe("moins d'une minute");
  });

  test('0.5 minutes → "moins d\'une minute"', () => {
    expect(formatDuration(0.5, WH)).toBe("moins d'une minute");
  });

  test('1 minute', () => {
    expect(formatDuration(1, WH)).toBe('1 minute');
  });

  test('42 minutes', () => {
    expect(formatDuration(42, WH)).toBe('42 minutes');
  });

  test('59 minutes', () => {
    expect(formatDuration(59, WH)).toBe('59 minutes');
  });

  test('60 minutes = 1h', () => {
    expect(formatDuration(60, WH)).toBe('1h');
  });

  test('192 minutes = 3h12', () => {
    expect(formatDuration(192, WH)).toBe('3h 12min');
  });

  test('exact 7h (420min) = 1 jour', () => {
    // 420min = 1 work day for 35h/week
    expect(formatDuration(420, WH)).toBe('1 jour');
  });

  test('7h30 = 1 jour 0h (rounds to day boundary)', () => {
    // 450 min, dailyWorkMinutes = 420 → 1 day + 30min → 1 jour 0h (h = floor(30/60) = 0)
    expect(formatDuration(450, WH)).toBe('1 jour');
  });

  test('2 full days + 2h', () => {
    // 2 * 420 + 120 = 960 min
    expect(formatDuration(960, WH)).toBe('2 jours 2h');
  });

  test('1 week = 5 work-days (2100min)', () => {
    expect(formatDuration(2100, WH)).toBe('1 semaine');
  });

  test('1 week + 2 days', () => {
    // 2100 + 2*420 = 2940
    expect(formatDuration(2940, WH)).toBe('1 semaine 2 jours');
  });

  test('2 months (8 weeks = 40 work-days)', () => {
    // monthlyWorkMinutes = 4 * 2100 = 8400; 2 months = 16800 min
    expect(formatDuration(16800, WH)).toBe('2 mois');
  });

  test('2 months 1 week', () => {
    // 16800 + 2100 = 18900
    expect(formatDuration(18900, WH)).toBe('2 mois 1 semaine');
  });

  test('freelancer with 4h/week — 1h work-day threshold', () => {
    // dailyWorkHours = 4/5 = 0.8h = 48 min
    // 50 minutes > 48 min daily → shows "1 jour"
    expect(formatDuration(50, 4)).toBe('1 jour');
  });
});

describe('formatDurationShort', () => {
  test('0 min → "<1min"', () => {
    expect(formatDurationShort(0, WH)).toBe('<1min');
  });

  test('30 min → "30min"', () => {
    expect(formatDurationShort(30, WH)).toBe('30min');
  });

  test('192 min → "3h12"', () => {
    expect(formatDurationShort(192, WH)).toBe('3h12');
  });

  test('420 min → "1j"', () => {
    expect(formatDurationShort(420, WH)).toBe('1j');
  });

  test('2100 min → "1sem"', () => {
    expect(formatDurationShort(2100, WH)).toBe('1sem');
  });

  test('8400 min → "1mois"', () => {
    expect(formatDurationShort(8400, WH)).toBe('1mois');
  });
});

describe('formatCurrency', () => {
  test('EUR French locale — contains the amount', () => {
    const result = formatCurrency(1234.56, 'EUR', 'fr-FR');
    // Intl renders "1 234,56 €" — symbol varies by runtime; check amount presence
    expect(result).toMatch(/1[\s ]?234/);
    expect(result).toMatch(/€|EUR/);
  });

  test('USD English locale — contains amount and symbol', () => {
    const result = formatCurrency(1234.56, 'USD', 'en-US');
    expect(result).toContain('1,234.56');
    expect(result).toMatch(/\$|USD/);
  });

  test('unknown currency code falls back gracefully', () => {
    const result = formatCurrency(42.5, 'ZZZ');
    // Fallback path: "42.50 ZZZ"
    expect(result).toContain('42');
    expect(result).toContain('ZZZ');
  });
});
