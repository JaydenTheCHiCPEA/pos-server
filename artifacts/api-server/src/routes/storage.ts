/**
 * Storage sync routes — bidirectional JSON blob store for the offline-first POS app.
 *
 * GET  /api/storage       — pull all synced keys from Neon
 * POST /api/storage/sync  — merge client payload into the database
 */
import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, storageTable } from "../../../../lib/db/src";
import { logger } from "../lib/logger";
import { mergeStorageValue } from "../lib/merge";
import { ensureStorageTable } from "../lib/db-init";

const router = Router();

// POST /api/storage/sync — merge incoming client data into Neon
router.post("/storage/sync", async (req, res) => {
  const payload = req.body?.storage;
  if (!payload || typeof payload !== "object") {
    logger.warn("POST /storage/sync rejected — missing storage payload");
    return res.status(400).json({ error: "missing storage payload" });
  }

  const keys = Object.keys(payload);
  logger.info({ keyCount: keys.length }, "POST /storage/sync — merging client data");

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

    logger.info({ keyCount: keys.length }, "POST /storage/sync — saved successfully");
    return res.json({ ok: true, keys });
  } catch (err) {
    logger.error({ err, keys }, "POST /storage/sync — database error");
    return res.status(500).json({ error: "failed to save storage" });
  }
});

// GET /api/storage — return all stored JSON blobs for client pull
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
