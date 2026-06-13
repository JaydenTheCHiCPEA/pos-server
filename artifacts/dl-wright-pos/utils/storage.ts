import AsyncStorage from "@react-native-async-storage/async-storage";

export const SYNC_STORAGE_KEYS = [
  "items",
  "categories",
  "tax_rates",
  "transactions",
  "discount_rules",
  "store",
  "shifts",
  "users",
  "theme_option",
  "currency_symbol",
];

export type SyncLogLevel = "info" | "success" | "warn" | "error";

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  level: SyncLogLevel;
  message: string;
  detail?: string;
}

const LOGS_KEY = "sync_logs";
const PENDING_SYNC_KEY = "sync_pending";
const MAX_LOGS = 150;

let syncTrigger: (() => void) | null = null;
let logListener: ((entry: SyncLogEntry) => void) | null = null;

export function registerSyncTrigger(fn: () => void) {
  syncTrigger = fn;
}

export function registerLogListener(fn: (entry: SyncLogEntry) => void) {
  logListener = fn;
}

export function getServerUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
  if (!domain) return "";
  return domain.replace(/\/$/, "");
}

function makeLogId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export async function addSyncLog(
  level: SyncLogLevel,
  message: string,
  detail?: string,
): Promise<void> {
  const entry: SyncLogEntry = {
    id: makeLogId(),
    timestamp: new Date().toISOString(),
    level,
    message,
    detail,
  };
  logListener?.(entry);
  try {
    const existing = await loadData<SyncLogEntry[]>(LOGS_KEY, []);
    const next = [entry, ...existing].slice(0, MAX_LOGS);
    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(next));
  } catch {
    // ignore log persistence errors
  }
  const prefix = `[Sync ${level.toUpperCase()}]`;
  if (detail) {
    console.log(prefix, message, detail);
  } else {
    console.log(prefix, message);
  }
}

export async function loadSyncLogs(): Promise<SyncLogEntry[]> {
  return loadData<SyncLogEntry[]>(LOGS_KEY, []);
}

export async function clearSyncLogs(): Promise<void> {
  await AsyncStorage.removeItem(LOGS_KEY);
}

export async function isSyncPending(): Promise<boolean> {
  const val = await AsyncStorage.getItem(PENDING_SYNC_KEY);
  return val === "true";
}

async function setSyncPending(pending: boolean): Promise<void> {
  if (pending) {
    await AsyncStorage.setItem(PENDING_SYNC_KEY, "true");
  } else {
    await AsyncStorage.removeItem(PENDING_SYNC_KEY);
  }
}

export async function loadData<T>(key: string, fallback: T): Promise<T> {
  try {
    const json = await AsyncStorage.getItem(key);
    if (json === null) return fallback;
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export async function saveData<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    if (SYNC_STORAGE_KEYS.includes(key)) {
      await setSyncPending(true);
      syncTrigger?.();
    }
  } catch {}
}

export async function clearData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

/** Merge arrays of objects that have an `id` field — incoming values win on conflict. */
export function mergeArraysById<T extends { id?: string }>(
  base: T[],
  incoming: T[],
): T[] {
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

export async function syncAllToServer(
  url: string,
  keys: string[],
): Promise<{ ok: boolean; error?: string }> {
  const base = url.replace(/\/$/, "");
  if (!base) {
    return { ok: false, error: "Server URL not configured (EXPO_PUBLIC_DOMAIN)" };
  }

  try {
    const storage: Record<string, unknown> = {};
    for (const key of keys) {
      try {
        const v = await AsyncStorage.getItem(key);
        storage[key] = v === null ? null : JSON.parse(v);
      } catch {
        storage[key] = null;
      }
    }

    const endpoint = `${base}/api/storage/sync`;
    await addSyncLog("info", `POST ${endpoint}`, `Pushing ${keys.length} keys`);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storage }),
    });

    const txt = await res.text();
    if (!res.ok) {
      await addSyncLog("error", `Push failed (${res.status})`, txt.slice(0, 300));
      return { ok: false, error: `server error: ${res.status} ${txt}` };
    }

    await addSyncLog("success", "Pushed local data to server");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await addSyncLog("error", "Push failed", msg);
    return { ok: false, error: msg };
  }
}

export async function fetchAllFromServer(
  url: string,
  keys: string[],
): Promise<{ ok: boolean; error?: string }> {
  const base = url.replace(/\/$/, "");
  if (!base) {
    return { ok: false, error: "Server URL not configured (EXPO_PUBLIC_DOMAIN)" };
  }

  try {
    const endpoint = `${base}/api/storage`;
    await addSyncLog("info", `GET ${endpoint}`);

    const res = await fetch(endpoint);
    if (!res.ok) {
      await addSyncLog("error", `Pull failed (${res.status})`);
      return { ok: false, error: `server error ${res.status}` };
    }

    const data = await res.json();
    const storage = data?.storage ?? {};
    let mergedCount = 0;

    for (const key of keys) {
      const serverVal = storage[key];
      if (serverVal == null) continue;

      try {
        const localRaw = await AsyncStorage.getItem(key);
        const localVal = localRaw === null ? null : JSON.parse(localRaw);

        if (Array.isArray(localVal) && Array.isArray(serverVal)) {
          const merged = mergeArraysById(
            serverVal as { id?: string }[],
            localVal as { id?: string }[],
          );
          await AsyncStorage.setItem(key, JSON.stringify(merged));
          mergedCount++;
        } else if (Array.isArray(serverVal) && localVal == null) {
          await AsyncStorage.setItem(key, JSON.stringify(serverVal));
          mergedCount++;
        } else if (
          serverVal &&
          typeof serverVal === "object" &&
          !Array.isArray(serverVal) &&
          localVal &&
          typeof localVal === "object" &&
          !Array.isArray(localVal)
        ) {
          const merged = { ...(serverVal as object), ...(localVal as object) };
          await AsyncStorage.setItem(key, JSON.stringify(merged));
          mergedCount++;
        } else if (localVal == null) {
          await AsyncStorage.setItem(key, JSON.stringify(serverVal));
          mergedCount++;
        }
      } catch {
        // ignore per-key errors
      }
    }

    await addSyncLog("success", "Pulled server data", `Merged ${mergedCount} keys`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await addSyncLog("error", "Pull failed", msg);
    return { ok: false, error: msg };
  }
}

export async function syncBothDirections(
  url: string,
  keys: string[],
): Promise<{ ok: boolean; error?: string }> {
  await addSyncLog("info", "Starting sync", url || "(no url)");

  const pull = await fetchAllFromServer(url, keys);
  if (!pull.ok) return pull;

  const push = await syncAllToServer(url, keys);
  if (!push.ok) return push;

  const pullAgain = await fetchAllFromServer(url, keys);
  if (!pullAgain.ok) return pullAgain;

  await setSyncPending(false);
  await addSyncLog("success", "Sync complete");
  return { ok: true };
}

export async function checkServerHealth(url: string): Promise<boolean> {
  const base = url.replace(/\/$/, "");
  if (!base) return false;
  try {
    const res = await fetch(`${base}/api/healthz`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
