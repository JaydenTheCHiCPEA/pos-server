/**
 * Storage sync routes — bidirectional JSON blob store for the offline-first POS app.
 *
 * GET  /api/storage       — pull all synced keys from Neon
<<<<<<< HEAD
 * POST /api/storage/sync  — replace server values with client snapshot (last-write-wins)
 * POST /api/storage/wipe  — admin-only full data reset
=======
 * POST /api/storage/sync  — merge client payload into the database
>>>>>>> 044d5891246a55b19f65c682d0836a79ef42346e
 */
import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, storageTable } from "../../../../lib/db/src";
import { logger } from "../lib/logger";
<<<<<<< HEAD
import { replaceStorageValue } from "../lib/merge";
import { ensureStorageTable, writeEmptyStorage } from "../lib/db-init";
import { requireAuth, type AuthedRequest } from "../middleware/auth";

const router = Router();

type StoredUser = {
  id: string;
  role: string;
};

async function loadUsers(): Promise<StoredUser[]> {
  const rows = await db.select().from(storageTable).where(eq(storageTable.key, "users"));
  const row = rows[0];
  if (!row?.value) return [];
  return row.value as StoredUser[];
}

// POST /api/storage/sync — replace incoming keys with client snapshot
=======
import { mergeStorageValue } from "../lib/merge";
import { ensureStorageTable } from "../lib/db-init";

const router = Router();

// POST /api/storage/sync — merge incoming client data into Neon
>>>>>>> 044d5891246a55b19f65c682d0836a79ef42346e
router.post("/storage/sync", async (req, res) => {
  const payload = req.body?.storage;
  if (!payload || typeof payload !== "object") {
    logger.warn("POST /storage/sync rejected — missing storage payload");
    return res.status(400).json({ error: "missing storage payload" });
  }

  const keys = Object.keys(payload);
<<<<<<< HEAD
  logger.info({ keyCount: keys.length }, "POST /storage/sync — replacing client data");
=======
  logger.info({ keyCount: keys.length }, "POST /storage/sync — merging client data");
>>>>>>> 044d5891246a55b19f65c682d0836a79ef42346e

  try {
    await ensureStorageTable();
    const existingRows = await db.select().from(storageTable);
    const existingMap = new Map(existingRows.map((row) => [row.key, row.value]));

    for (const [key, value] of Object.entries(payload)) {
<<<<<<< HEAD
      const replaced = replaceStorageValue(existingMap.get(key), value);
      await db
        .insert(storageTable)
        .values({ key, value: replaced, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: storageTable.key,
          set: { value: replaced, updatedAt: new Date() },
=======
      const merged = mergeStorageValue(existingMap.get(key), value);
      await db
        .insert(storageTable)
        .values({ key, value: merged, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: storageTable.key,
          set: { value: merged, updatedAt: new Date() },
>>>>>>> 044d5891246a55b19f65c682d0836a79ef42346e
        });
    }

    logger.info({ keyCount: keys.length }, "POST /storage/sync — saved successfully");
    return res.json({ ok: true, keys });
  } catch (err) {
    logger.error({ err, keys }, "POST /storage/sync — database error");
    return res.status(500).json({ error: "failed to save storage" });
  }
});

<<<<<<< HEAD
// POST /api/storage/wipe — admin-only full reset to empty business data
router.post("/storage/wipe", requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;

  try {
    const users = await loadUsers();
    const admin = users.find((u) => u.id === authed.userId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Only admins can wipe all data" });
    }

    await writeEmptyStorage();
    logger.info({ userId: admin.id }, "Storage wiped by admin");
    return res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /storage/wipe — database error");
    return res.status(500).json({ error: "failed to wipe storage" });
  }
});

=======
>>>>>>> 044d5891246a55b19f65c682d0836a79ef42346e
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
