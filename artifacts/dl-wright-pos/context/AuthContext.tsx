import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { loadData, saveData } from "@/utils/storage";
import { generateId } from "@/utils/format";
import { serverLogin, serverRegister, clearServerAuth } from "@/utils/api";
import { checkServerHealth, getServerUrl } from "@/utils/storage";
import { useSync } from "@/context/SyncContext";
import type { User, UserRole, Permissions } from "@/types";

const ADMIN_PERMISSIONS: Permissions = {
  acceptPayments: true, applyDiscounts: true, applyRestrictedDiscounts: true,
  changeTaxes: true, manageOpenTickets: true, voidSavedItems: true,
  openCashDrawer: true, viewCosts: true, viewReceipts: true, performRefunds: true,
  accessBackOffice: true, manageItems: true, manageEmployees: true,
  viewReports: true, manageSettings: true,
};
const MANAGER_PERMISSIONS: Permissions = {
  acceptPayments: true, applyDiscounts: true, applyRestrictedDiscounts: true,
  changeTaxes: true, manageOpenTickets: true, voidSavedItems: true,
  openCashDrawer: true, viewCosts: true, viewReceipts: true, performRefunds: true,
  accessBackOffice: true, manageItems: true, manageEmployees: false,
  viewReports: true, manageSettings: false,
};
const CASHIER_PERMISSIONS: Permissions = {
  acceptPayments: true, applyDiscounts: true, applyRestrictedDiscounts: false,
  changeTaxes: false, manageOpenTickets: false, voidSavedItems: false,
  openCashDrawer: true, viewCosts: false, viewReceipts: true, performRefunds: false,
  accessBackOffice: false, manageItems: false, manageEmployees: false,
  viewReports: false, manageSettings: false,
};

export const DEFAULT_USERS: User[] = [
  { id: "u1", username: "admin", password: "admin123", name: "Admin User", role: "admin", salary: 0, hourlyRate: 0, permissions: ADMIN_PERMISSIONS, active: true },
  { id: "u2", username: "manager", password: "manager123", name: "Sarah Johnson", role: "manager", salary: 4500, hourlyRate: 25, permissions: MANAGER_PERMISSIONS, active: true },
  { id: "u3", username: "cashier1", password: "cashier123", name: "John Smith", role: "cashier", salary: 2500, hourlyRate: 12, permissions: CASHIER_PERMISSIONS, active: true },
  { id: "u4", username: "cashier2", password: "cash456", name: "Lisa Davis", role: "cashier", salary: 2500, hourlyRate: 12, permissions: CASHIER_PERMISSIONS, active: true },
];

export function getDefaultPermissions(role: UserRole): Permissions {
  if (role === "admin") return { ...ADMIN_PERMISSIONS };
  if (role === "manager") return { ...MANAGER_PERMISSIONS };
  return { ...CASHIER_PERMISSIONS };
}

interface AuthContextValue {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  register: (name: string, username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  addUser: (u: Omit<User, "id">) => void;
  updateUser: (id: string, u: Partial<User>) => void;
  deleteUser: (id: string) => void;
  hasPermission: (p: keyof Permissions) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { registerReload } = useSync();
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const reloadFromStorage = useCallback(async () => {
    const loaded = await loadData<User[]>("users", DEFAULT_USERS);
    setUsers(loaded);
    setCurrentUser((prev) => {
      if (!prev) return prev;
      return loaded.find((u) => u.id === prev.id) ?? prev;
    });
  }, []);

  useEffect(() => {
    void reloadFromStorage();
  }, [reloadFromStorage]);

  useEffect(() => registerReload(reloadFromStorage), [registerReload, reloadFromStorage]);

  async function login(username: string, password: string): Promise<boolean> {
    const freshUsers = await loadData<User[]>("users", users);
    const localUser = freshUsers.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password && u.active,
    );

    // Try server login when online — validates against Neon and stores auth token
    const serverUrl = getServerUrl();
    if (serverUrl && await checkServerHealth(serverUrl)) {
      const result = await serverLogin(username, password);
      if (result.ok && result.user) {
        // Merge server user into local list (keep password for offline re-login)
        const serverUser = { ...result.user, password } as User;
        const merged = freshUsers.some((u) => u.id === serverUser.id)
          ? freshUsers.map((u) => (u.id === serverUser.id ? { ...u, ...serverUser, password } : u))
          : [...freshUsers, serverUser];
        setUsers(merged);
        saveData("users", merged);
        setCurrentUser(serverUser);
        return true;
      }
    }

    // Offline or server unavailable — local credential check
    if (localUser) {
      setCurrentUser(localUser);
      return true;
    }
    return false;
  }

  async function register(name: string, username: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const freshUsers = await loadData<User[]>("users", users);

    if (freshUsers.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return { ok: false, error: "Username already exists" };
    }

    if (password.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters" };
    }

    const newUser: User = {
      id: generateId(),
      username: username.toLowerCase(),
      password,
      name,
      role: "admin",
      salary: 0,
      hourlyRate: 0,
      permissions: { ...ADMIN_PERMISSIONS },
      active: true,
    };

    const updated = [...freshUsers, newUser];
    setUsers(updated);
    await saveData("users", updated);

    // Register on server when online
    const serverUrl = getServerUrl();
    if (serverUrl && await checkServerHealth(serverUrl)) {
      const result = await serverRegister(name, username, password);
      if (!result.ok) {
        console.log("[Auth] Server register failed — saved locally, will sync later", result.error);
      }
    }

    setCurrentUser(newUser);
    return { ok: true };
  }

  function logout() {
    setCurrentUser(null);
    void clearServerAuth();
  }

  function addUser(u: Omit<User, "id">) {
    const newUser = { ...u, id: generateId() };
    const updated = [...users, newUser];
    setUsers(updated);
    saveData("users", updated);
  }

  function updateUser(id: string, u: Partial<User>) {
    const updated = users.map((usr) => (usr.id === id ? { ...usr, ...u } : usr));
    setUsers(updated);
    saveData("users", updated);
    if (currentUser?.id === id) setCurrentUser((prev) => (prev ? { ...prev, ...u } : prev));
  }

  function deleteUser(id: string) {
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    saveData("users", updated);
  }

  function hasPermission(p: keyof Permissions): boolean {
    return currentUser?.permissions[p] === true;
  }

  return (
    <AuthContext.Provider value={{ currentUser, users, login, register, logout, addUser, updateUser, deleteUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
