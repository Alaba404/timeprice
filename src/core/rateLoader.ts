import type { ExchangeRates, RateCache } from '../types';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MMKV_KEY = 'exchange_rate_cache';
const API_URL = 'https://open.er-api.com/v6/latest/EUR';

// Fallback rates (EUR-based, approximate) used when offline and no cache exists
const FALLBACK_RATES: ExchangeRates = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  XOF: 655.96,
  MAD: 10.85,
  TND: 3.32,
  CAD: 1.47,
};

// ─── Storage abstraction ───────────────────────────────────────────────────────
// react-native-mmkv@4 requires NitroModules, which is not available in Expo Go.
// We use a try/catch so the app still works without persistence in Expo Go.

type KVStorage = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
};

function buildStorage(): KVStorage {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    return createMMKV({ id: 'timeprice-rates' });
  } catch {
    // Expo Go: in-memory fallback (no disk persistence, rates re-fetched on each launch)
    const _map = new Map<string, string>();
    return {
      getString: (key) => _map.get(key),
      set: (key, value) => { _map.set(key, value); },
      delete: (key) => { _map.delete(key); },
    };
  }
}

const storage: KVStorage = buildStorage();

// ─── Cache helpers ────────────────────────────────────────────────────────────

function readCache(): RateCache | null {
  const raw = storage.getString(MMKV_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RateCache;
  } catch {
    return null;
  }
}

function writeCache(rates: ExchangeRates): void {
  const cache: RateCache = { rates, fetchedAt: Date.now() };
  storage.set(MMKV_KEY, JSON.stringify(cache));
}

function isCacheStale(cache: RateCache): boolean {
  return Date.now() - cache.fetchedAt > CACHE_TTL_MS;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns EUR-based exchange rates.
 *
 * Strategy:
 *  1. Cache fresh  → return immediately (no network)
 *  2. Cache stale  → try fetch, update cache, return fetched; on error return stale cache
 *  3. No cache     → try fetch, cache result; on error return FALLBACK_RATES
 */
export async function loadExchangeRates(): Promise<ExchangeRates> {
  const cache = readCache();

  if (cache && !isCacheStale(cache)) {
    return cache.rates;
  }

  try {
    const response = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = (await response.json()) as { rates: ExchangeRates };
    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error('Malformed API response');
    }

    writeCache(data.rates);
    return data.rates;
  } catch {
    // Offline or error: return stale cache if available, else hardcoded fallback
    return cache?.rates ?? FALLBACK_RATES;
  }
}

/** Force-invalidate the cache (useful in tests or settings reset). */
export function clearRateCache(): void {
  storage.delete(MMKV_KEY);
}

/** Returns cached rates synchronously (null if no cache). Used in the render path. */
export function getCachedRatesSync(): ExchangeRates | null {
  const cache = readCache();
  return cache?.rates ?? null;
}
