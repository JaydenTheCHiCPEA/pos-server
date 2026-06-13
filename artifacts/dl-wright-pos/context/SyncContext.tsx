import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  addSyncLog,
  checkServerHealth,
  clearSyncLogs,
  getServerUrl,
  isSyncPending,
  loadSyncLogs,
  registerLogListener,
  registerSyncTrigger,
  syncBothDirections,
  SYNC_STORAGE_KEYS,
  type SyncLogEntry,
} from "@/utils/storage";

interface SyncContextValue {
  logs: SyncLogEntry[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingSync: boolean;
  serverUrl: string;
  syncNow: () => Promise<boolean>;
  clearLogs: () => Promise<void>;
  registerReload: (fn: () => Promise<void>) => () => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

const SYNC_DEBOUNCE_MS = 2500;
const RETRY_INTERVAL_MS = 45000;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(false);

  const reloadCallbacks = useRef<Set<() => Promise<void>>>(new Set());
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncingRef = useRef(false);

  const serverUrl = getServerUrl();

  const registerReload = useCallback((fn: () => Promise<void>) => {
    reloadCallbacks.current.add(fn);
    return () => {
      reloadCallbacks.current.delete(fn);
    };
  }, []);

  const reloadAll = useCallback(async () => {
    await Promise.all([...reloadCallbacks.current].map((fn) => fn()));
  }, []);

  const refreshPending = useCallback(async () => {
    setPendingSync(await isSyncPending());
  }, []);

  const runSync = useCallback(async (): Promise<boolean> => {
    if (syncingRef.current) return false;
    if (!serverUrl) {
      await addSyncLog("warn", "Sync skipped — EXPO_PUBLIC_DOMAIN not set");
      return false;
    }

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const online = await checkServerHealth(serverUrl);
      setIsOnline(online);

      if (!online) {
        await addSyncLog("warn", "Offline — changes saved locally, will sync when online");
        setPendingSync(true);
        return false;
      }

      const result = await syncBothDirections(serverUrl, SYNC_STORAGE_KEYS);
      if (result.ok) {
        setLastSyncAt(new Date().toISOString());
        setPendingSync(false);
        await reloadAll();
        return true;
      }
      setPendingSync(true);
      return false;
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [reloadAll, serverUrl]);

  const scheduleSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      void runSync().then(refreshPending);
    }, SYNC_DEBOUNCE_MS);
  }, [runSync, refreshPending]);

  useEffect(() => {
    registerSyncTrigger(scheduleSync);
    registerLogListener((entry) => {
      setLogs((prev) => [entry, ...prev].slice(0, 150));
    });

    void loadSyncLogs().then(setLogs);
    void refreshPending();

    if (serverUrl) {
      void addSyncLog("info", "App started", `Server: ${serverUrl}`);
      void runSync();
    } else {
      void addSyncLog("warn", "No server URL configured — set EXPO_PUBLIC_DOMAIN");
    }

    const interval = setInterval(() => {
      void isSyncPending().then((p) => {
        if (p) void runSync().then(refreshPending);
      });
    }, RETRY_INTERVAL_MS);

    const onAppState = (state: AppStateStatus) => {
      if (state === "active") {
        void runSync().then(refreshPending);
      }
    };
    const sub = AppState.addEventListener("change", onAppState);

    return () => {
      registerSyncTrigger(() => {});
      registerLogListener(() => {});
      if (syncTimer.current) clearTimeout(syncTimer.current);
      clearInterval(interval);
      sub.remove();
    };
  }, [runSync, scheduleSync, refreshPending, serverUrl]);

  const syncNow = useCallback(async () => {
    const ok = await runSync();
    await refreshPending();
    return ok;
  }, [runSync, refreshPending]);

  const clearLogs = useCallback(async () => {
    await clearSyncLogs();
    setLogs([]);
  }, []);

  return (
    <SyncContext.Provider
      value={{
        logs,
        isOnline,
        isSyncing,
        lastSyncAt,
        pendingSync,
        serverUrl,
        syncNow,
        clearLogs,
        registerReload,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be inside SyncProvider");
  return ctx;
}
