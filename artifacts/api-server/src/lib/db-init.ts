/**
 * Database bootstrap — creates the storage table on startup.
 * Empty databases stay empty; no demo or seed data is inserted.
 */
import { db, pool, storageTable } from "../../../../lib/db/src";
import { logger } from "./logger";
import { EMPTY_SEED_PAYLOAD } from "./empty-data";

/** Create the `storage` table if it does not exist (safe to run on every startup). */
export async function ensureStorageTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS storage (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

/** Replace all storage rows with empty business structures. */
export async function writeEmptyStorage(): Promise<void> {
  await db.delete(storageTable);

  for (const [key, value] of Object.entries(EMPTY_SEED_PAYLOAD)) {
    await db
      .insert(storageTable)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: storageTable.key,
        set: { value, updatedAt: new Date() },
      });
  }

  logger.info({ keys: Object.keys(EMPTY_SEED_PAYLOAD) }, "Storage reset to empty business data");
}

/** Full DB init — call once before accepting requests. */
export async function initializeDatabase(): Promise<void> {
  await ensureStorageTable();
  const rows = await db.select().from(storageTable);
  if (rows.length === 0) {
    logger.info("Empty database — no seed data inserted");
  } else {
    logger.info({ rowCount: rows.length }, "Database ready");
  }
}
