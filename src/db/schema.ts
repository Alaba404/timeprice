import * as SQLite from 'expo-sqlite';
import type { ConversionEntry } from '../types';

const DB_NAME = 'timeprice.db';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync(DB_NAME);
  }
  return _db;
}

// ─── Migrations ───────────────────────────────────────────────────────────────

const MIGRATIONS: Array<{ version: number; sql: string }> = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS conversions (
        id               TEXT PRIMARY KEY NOT NULL,
        profileId        TEXT NOT NULL,
        priceAmount      REAL NOT NULL,
        priceCurrency    TEXT NOT NULL,
        convertedCurrency TEXT NOT NULL,
        durationMinutes  REAL NOT NULL,
        label            TEXT,
        category         TEXT NOT NULL DEFAULT 'other',
        source           TEXT NOT NULL DEFAULT 'manual',
        createdAt        INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_conversions_createdAt ON conversions(createdAt DESC);
      CREATE INDEX IF NOT EXISTS idx_conversions_profileId ON conversions(profileId);
      CREATE INDEX IF NOT EXISTS idx_conversions_category  ON conversions(category);
    `,
  },
];

export function runMigrations(): void {
  const db = getDb();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  const row = db.getFirstSync<{ version: number }>(
    'SELECT MAX(version) as version FROM schema_version',
  );
  const currentVersion = row?.version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      db.execSync(migration.sql);
      db.runSync(
        'INSERT OR REPLACE INTO schema_version (version) VALUES (?)',
        migration.version,
      );
    }
  }
}

// ─── CRUD helpers ─────────────────────────────────────────────────────────────

export function insertConversion(entry: ConversionEntry): void {
  const db = getDb();
  db.runSync(
    `INSERT INTO conversions
      (id, profileId, priceAmount, priceCurrency, convertedCurrency,
       durationMinutes, label, category, source, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    entry.id,
    entry.profileId,
    entry.priceAmount,
    entry.priceCurrency,
    entry.convertedCurrency,
    entry.durationMinutes,
    entry.label ?? null,
    entry.category,
    entry.source,
    entry.createdAt,
  );
}

export function deleteConversion(id: string): void {
  getDb().runSync('DELETE FROM conversions WHERE id = ?', id);
}

export function getAllConversions(limit = 500): ConversionEntry[] {
  return getDb().getAllSync<ConversionEntry>(
    'SELECT * FROM conversions ORDER BY createdAt DESC LIMIT ?',
    limit,
  );
}

export function getConversionsByCategory(
  category: ConversionEntry['category'],
  limit = 100,
): ConversionEntry[] {
  return getDb().getAllSync<ConversionEntry>(
    'SELECT * FROM conversions WHERE category = ? ORDER BY createdAt DESC LIMIT ?',
    category,
    limit,
  );
}

export function getConversionsForMonth(year: number, month: number): ConversionEntry[] {
  // month is 1-based
  const start = new Date(year, month - 1, 1).getTime();
  const end   = new Date(year, month, 0, 23, 59, 59, 999).getTime();
  return getDb().getAllSync<ConversionEntry>(
    'SELECT * FROM conversions WHERE createdAt BETWEEN ? AND ? ORDER BY createdAt DESC',
    start,
    end,
  );
}

export function getConversionCount(): number {
  const row = getDb().getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM conversions',
  );
  return row?.count ?? 0;
}

/** Delete oldest entries, keeping only the most recent `keep` rows. */
export function pruneHistory(keep: number): void {
  getDb().runSync(
    `DELETE FROM conversions
     WHERE id NOT IN (
       SELECT id FROM conversions ORDER BY createdAt DESC LIMIT ?
     )`,
    keep,
  );
}
