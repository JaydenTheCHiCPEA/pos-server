/**
 * Database bootstrap — creates the storage table and seeds demo data on first run.
 */
import { db, pool, storageTable } from "../../../../lib/db/src";
import { logger } from "./logger";
import { DEMO_SEED_PAYLOAD } from "./demo-data";

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

/** Insert demo POS data when the database has no rows yet. */
export async function seedDatabaseIfEmpty(): Promise<void> {
  const rows = await db.select().from(storageTable);

  if (rows.length > 0) {
    logger.info({ rowCount: rows.length }, "Database already has data — skipping seed");
    return;
  }

  logger.info("Empty database detected — seeding demo accounts and store data");

  for (const [key, value] of Object.entries(DEMO_SEED_PAYLOAD)) {
    await db
      .insert(storageTable)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: storageTable.key,
        set: { value, updatedAt: new Date() },
      });
  }

  logger.info(
    { keys: Object.keys(DEMO_SEED_PAYLOAD) },
    "Demo data seeded (admin/admin123, manager/manager123, cashier1/cashier123, cashier2/cash456)",
  );
}

/** Full DB init — call once before accepting requests. */
export async function initializeDatabase(): Promise<void> {
  await ensureStorageTable();
  await seedDatabaseIfEmpty();
}
