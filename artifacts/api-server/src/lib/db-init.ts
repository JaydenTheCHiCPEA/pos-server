/**
<<<<<<< HEAD
 * Database bootstrap — creates the storage table on startup.
 * Empty databases stay empty; no demo or seed data is inserted.
 */
import { db, pool, storageTable } from "../../../../lib/db/src";
import { logger } from "./logger";
import { EMPTY_SEED_PAYLOAD } from "./empty-data";
=======
 * Database bootstrap — creates the storage table and seeds demo data on first run.
 */
import { db, pool, storageTable } from "../../../../lib/db/src";
import { logger } from "./logger";
import { DEMO_SEED_PAYLOAD } from "./demo-data";
>>>>>>> 044d5891246a55b19f65c682d0836a79ef42346e

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

<<<<<<< HEAD
/** Replace all storage rows with empty business structures. */
export async function writeEmptyStorage(): Promise<void> {
  await db.delete(storageTable);

  for (const [key, value] of Object.entries(EMPTY_SEED_PAYLOAD)) {
=======
/** Insert demo POS data when the database has no rows yet. */
export async function seedDatabaseIfEmpty(): Promise<void> {
  const rows = await db.select().from(storageTable);

  if (rows.length > 0) {
    logger.info({ rowCount: rows.length }, "Database already has data — skipping seed");
    return;
  }

  logger.info("Empty database detected — seeding demo accounts and store data");

  for (const [key, value] of Object.entries(DEMO_SEED_PAYLOAD)) {
>>>>>>> 044d5891246a55b19f65c682d0836a79ef42346e
    await db
      .insert(storageTable)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: storageTable.key,
        set: { value, updatedAt: new Date() },
      });
  }

<<<<<<< HEAD
  logger.info({ keys: Object.keys(EMPTY_SEED_PAYLOAD) }, "Storage reset to empty business data");
=======
  logger.info(
    { keys: Object.keys(DEMO_SEED_PAYLOAD) },
    "Demo data seeded (admin/admin123, manager/manager123, cashier1/cashier123, cashier2/cash456)",
  );
>>>>>>> 044d5891246a55b19f65c682d0836a79ef42346e
}

/** Full DB init — call once before accepting requests. */
export async function initializeDatabase(): Promise<void> {
  await ensureStorageTable();
<<<<<<< HEAD
  const rows = await db.select().from(storageTable);
  if (rows.length === 0) {
    logger.info("Empty database — no seed data inserted");
  } else {
    logger.info({ rowCount: rows.length }, "Database ready");
  }
=======
  await seedDatabaseIfEmpty();
>>>>>>> 044d5891246a55b19f65c682d0836a79ef42346e
}
