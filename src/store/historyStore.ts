import { create } from 'zustand';
import {
  insertConversion,
  deleteConversion,
  getAllConversions,
  getConversionsForMonth,
  getConversionCount,
} from '../db/schema';
import type { ConversionEntry, Category } from '../types';

/** Maximum number of saved conversions for free-tier users. */
export const FREE_TIER_LIMIT = 7;

type HistoryState = {
  entries: ConversionEntry[];
  hydrated: boolean;

  hydrate: () => void;
  /**
   * Try to persist a new conversion.
   * Returns `true`  if saved successfully.
   * Returns `false` if the free-tier limit was reached (entry NOT saved).
   */
  addEntry: (entry: ConversionEntry, isPremium: boolean) => boolean;
  removeEntry: (id: string) => void;
  getByCategory: (category: Category) => ConversionEntry[];
  getForMonth: (year: number, month: number) => ConversionEntry[];
  clear: () => void;
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  hydrated: false,

  hydrate: () => {
    const entries = getAllConversions(500);
    set({ entries, hydrated: true });
  },

  addEntry: (entry, isPremium) => {
    // ── Guard: check BEFORE writing ──────────────────────────────────────────
    // We read the count from SQLite so every device gets the same consistent
    // value regardless of in-memory state (avoids race conditions on first
    // render or after cold boot).
    if (!isPremium) {
      const count = getConversionCount();
      if (count >= FREE_TIER_LIMIT) {
        return false; // limit reached — caller must show the paywall
      }
    }

    insertConversion(entry);
    // Reload from DB to keep in-memory state in sync
    const entries = getAllConversions(500);
    set({ entries });
    return true;
  },

  removeEntry: (id) => {
    deleteConversion(id);
    set({ entries: get().entries.filter((e) => e.id !== id) });
  },

  getByCategory: (category) =>
    get().entries.filter((e) => e.category === category),

  getForMonth: (year, month) => getConversionsForMonth(year, month),

  clear: () => {
    const db = require('../db/schema').getDb();
    db.runSync('DELETE FROM conversions');
    set({ entries: [] });
  },
}));
