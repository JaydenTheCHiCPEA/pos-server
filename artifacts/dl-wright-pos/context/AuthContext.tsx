import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { loadData, saveData } from "@/utils/storage";
import { generateId } from "@/utils/format";
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
    const user = freshUsers.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password && u.active
    );
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }

  function logout() {
    setCurrentUser(null);
  }

  function addUser(u: Omit<User, "id">) {
    const newUser = { ...u, id: generateId() };
    const updated = [...users, newUser];
    setUsers(updated);
    saveData("users", updated);
  }

  function updateUser(id: string, u: Partial<User>) {
    const updated = users.map(usr => usr.id === id ? { ...usr, ...u } : usr);
    setUsers(updated);
    saveData("users", updated);
    if (currentUser?.id === id) setCurrentUser(prev => prev ? { ...prev, ...u } : prev);
  }

  function deleteUser(id: string) {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    saveData("users", updated);
  }

  function hasPermission(p: keyof Permissions): boolean {
    return currentUser?.permissions[p] === true;
  }

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, addUser, updateUser, deleteUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
