/**
 * Auth routes — login, register (new admin), and admin employee creation.
 * Users are stored in the `storage` table under key `users` (same blob the app syncs).
 */
import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, storageTable } from "../../../../lib/db/src";
import { logger } from "../lib/logger";
import { createSession } from "../lib/sessions";
import { DEMO_USERS } from "../lib/demo-data";
import { mergeArraysById } from "../lib/merge";
import { requireAuth, type AuthedRequest } from "../middleware/auth";

const router = Router();

type StoredUser = {
  id: string;
  username: string;
  password: string;
  name: string;
  role: string;
  salary: number;
  hourlyRate: number;
  permissions: Record<string, boolean>;
  active: boolean;
};

const ADMIN_PERMISSIONS: Record<string, boolean> = {
  acceptPayments: true,
  applyDiscounts: true,
  applyRestrictedDiscounts: true,
  changeTaxes: true,
  manageOpenTickets: true,
  voidSavedItems: true,
  openCashDrawer: true,
  viewCosts: true,
  viewReceipts: true,
  performRefunds: true,
  accessBackOffice: true,
  manageItems: true,
  manageEmployees: true,
  viewReports: true,
  manageSettings: true,
};

const CASHIER_PERMISSIONS: Record<string, boolean> = {
  acceptPayments: true,
  applyDiscounts: true,
  applyRestrictedDiscounts: false,
  changeTaxes: false,
  manageOpenTickets: false,
  voidSavedItems: false,
  openCashDrawer: true,
  viewCosts: false,
  viewReceipts: true,
  performRefunds: false,
  accessBackOffice: false,
  manageItems: false,
  manageEmployees: false,
  viewReports: false,
  manageSettings: false,
};

async function loadUsers(): Promise<StoredUser[]> {
  const rows = await db.select().from(storageTable).where(eq(storageTable.key, "users"));
  const row = rows[0];
  if (!row?.value) return [];
  return row.value as StoredUser[];
}

async function saveUsers(users: StoredUser[]): Promise<void> {
  await db
    .insert(storageTable)
    .values({ key: "users", value: users, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: storageTable.key,
      set: { value: users, updatedAt: new Date() },
    });
}

function sanitizeUser(u: StoredUser) {
  const { password: _pw, ...rest } = u;
  return rest;
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// POST /api/auth/login — validate credentials against stored users
router.post("/auth/login", async (req, res) => {
  const username = String(req.body?.username ?? "").trim();
  const password = String(req.body?.password ?? "");

  if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  }

  try {
    let users = await loadUsers();
    if (users.length === 0) {
      users = DEMO_USERS as StoredUser[];
      await saveUsers(users);
    }

    const user = users.find(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.password === password &&
        u.active,
    );

    if (!user) {
      logger.warn({ username }, "Login failed — invalid credentials");
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = createSession(user.id);
    logger.info({ userId: user.id, username: user.username }, "Login successful");
    return res.json({ ok: true, token, user: sanitizeUser(user) });
  } catch (err) {
    logger.error({ err }, "Login error");
    return res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/register — create a new admin account (store owner signup)
router.post("/auth/register", async (req, res) => {
  const username = String(req.body?.username ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const name = String(req.body?.name ?? "").trim();

  if (!username || !password || !name) {
    return res.status(400).json({ error: "name, username, and password required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const users = await loadUsers();

    if (users.some((u) => u.username.toLowerCase() === username)) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const newUser: StoredUser = {
      id: makeId(),
      username,
      password,
      name,
      role: "admin",
      salary: 0,
      hourlyRate: 0,
      permissions: { ...ADMIN_PERMISSIONS },
      active: true,
    };

    const updated = [...users, newUser];
    await saveUsers(updated);

    const token = createSession(newUser.id);
    logger.info({ userId: newUser.id, username }, "New admin account registered");
    return res.json({ ok: true, token, user: sanitizeUser(newUser) });
  } catch (err) {
    logger.error({ err }, "Register error");
    return res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/users — admin creates cashier/manager (requires auth)
router.post("/auth/users", requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  const username = String(req.body?.username ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const name = String(req.body?.name ?? "").trim();
  const role = String(req.body?.role ?? "cashier");

  if (!username || !password || !name) {
    return res.status(400).json({ error: "name, username, and password required" });
  }

  try {
    const users = await loadUsers();
    const admin = users.find((u) => u.id === authed.userId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create employees" });
    }

    if (users.some((u) => u.username.toLowerCase() === username)) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const permissions =
      role === "admin" ? ADMIN_PERMISSIONS : role === "manager" ? { ...ADMIN_PERMISSIONS, manageEmployees: false, manageSettings: false } : CASHIER_PERMISSIONS;

    const newUser: StoredUser = {
      id: makeId(),
      username,
      password,
      name,
      role,
      salary: Number(req.body?.salary) || 0,
      hourlyRate: Number(req.body?.hourlyRate) || 0,
      permissions,
      active: true,
    };

    const updated = mergeArraysById(users, [newUser]) as StoredUser[];
    await saveUsers(updated);

    logger.info({ createdBy: admin.id, newUserId: newUser.id }, "Employee created");
    return res.json({ ok: true, user: sanitizeUser(newUser) });
  } catch (err) {
    logger.error({ err }, "Create user error");
    return res.status(500).json({ error: "Failed to create user" });
  }
});

export default router;
