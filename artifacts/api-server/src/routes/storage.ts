import { Router } from "express";
import { pool } from "../../../../lib/db/src";
import { db, storageTable } from "../../../../lib/db/src";
import { logger } from "../lib/logger";

const router = Router();

async function ensureStorageTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS storage (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

function mergeArraysById<T extends { id?: string }>(base: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of base) {
    if (item && typeof item === "object" && item.id != null) {
      map.set(String(item.id), item);
    }
  }
  for (const item of incoming) {
    if (item && typeof item === "object" && item.id != null) {
      map.set(String(item.id), item);
    }
  }
  return Array.from(map.values());
}

function mergeStorageValue(current: unknown, incoming: unknown): unknown {
  if (Array.isArray(current) && Array.isArray(incoming)) {
    return mergeArraysById(current as { id?: string }[], incoming as { id?: string }[]);
  }

  if (Array.isArray(incoming) && !current) {
    return incoming;
  }

  if (
    incoming &&
    typeof incoming === "object" &&
    !Array.isArray(incoming) &&
    current &&
    typeof current === "object" &&
    !Array.isArray(current)
  ) {
    return { ...(current as object), ...(incoming as object) };
  }

  return incoming ?? current;
}

// POST /api/storage/sync
// Body: { storage: { key1: any, key2: any, ... } }
// For array values we append items that do not have a matching `id` already present.
router.post("/storage/sync", async (req, res) => {
  const payload = req.body?.storage;
  if (!payload || typeof payload !== "object") {
    logger.warn("POST /storage/sync rejected — missing storage payload");
    return res.status(400).json({ error: "missing storage payload" });
  }

  const keys = Object.keys(payload);
  logger.info({ keys, keyCount: keys.length }, "POST /storage/sync — merging data");

  try {
    await ensureStorageTable();
    const existingRows = await db.select().from(storageTable);
    const existingMap = new Map(existingRows.map((row) => [row.key, row.value]));

    for (const [key, value] of Object.entries(payload)) {
      const merged = mergeStorageValue(existingMap.get(key), value);
      await db
        .insert(storageTable)
        .values({ key, value: merged, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: storageTable.key,
          set: { value: merged, updatedAt: new Date() },
        });
    }

    logger.info({ keys, keyCount: keys.length }, "POST /storage/sync — saved successfully");
    return res.json({ ok: true, keys });
  } catch (err) {
    logger.error({ err, keys }, "POST /storage/sync — database error");
    return res.status(500).json({ error: "failed to save storage" });
  }
});

// GET /api/storage - return the entire stored JSON
router.get("/storage", async (_req, res) => {
  try {
    await ensureStorageTable();
    const rows = await db.select().from(storageTable);
    const storage: Record<string, unknown> = {};
    for (const row of rows) {
      storage[row.key] = row.value;
    }
    logger.info({ keyCount: rows.length }, "GET /storage — returning data");
    return res.json({ storage });
  } catch (err) {
    logger.error({ err }, "GET /storage — database error");
    return res.status(500).json({ error: "failed to read storage" });
  }
});

export default router;
