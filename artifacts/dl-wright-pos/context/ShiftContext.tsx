import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { loadData, saveData } from "@/utils/storage";
import { generateId } from "@/utils/format";
import { useAuth } from "@/context/AuthContext";
import { useSync } from "@/context/SyncContext";
import { EMPTY_SHIFTS } from "@/utils/empty-data";
import type { Shift, CashMovement } from "@/types";

interface ShiftContextValue {
  currentShift: Shift | null;
  allShifts: Shift[];
  isClocked: boolean;
  clockIn: (employeeId: string, employeeName: string, openingCash: number) => void;
  clockOut: (actualCash: number) => void;
  addCashMovement: (type: "in" | "out", amount: number, note: string) => void;
  recordSale: (total: number) => void;
  getExpectedCash: (shift?: Shift | null) => number;
  wipeAllData: () => Promise<void>;
}

export const ShiftContext = createContext<ShiftContextValue | null>(null);

function computeExpectedCash(shift: Shift): number {
  const cashIn = shift.cashMovements
    .filter((m) => m.type === "in")
    .reduce((a, m) => a + m.amount, 0);
  const cashOut = shift.cashMovements
    .filter((m) => m.type === "out")
    .reduce((a, m) => a + m.amount, 0);
  return shift.openingCash + cashIn - cashOut + shift.salesTotal;
}

function closeStaleOpenShift(shift: Shift, endTime: string): Shift {
  const expected = computeExpectedCash(shift);
  return {
    ...shift,
    endTime,
    closingCash: expected,
    expectedCash: expected,
    cashDifference: 0,
    status: "closed",
  };
}

export function ShiftProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { registerReload } = useSync();
  const [sessionShiftId, setSessionShiftId] = useState<string | null>(null);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);

  const reloadFromStorage = useCallback(async () => {
    const shifts = await loadData<Shift[]>("shifts", []);
    setAllShifts(shifts);
    if (sessionShiftId) {
      const active = shifts.find((s) => s.id === sessionShiftId && s.status === "open") ?? null;
      setCurrentShift(active);
      if (!active) setSessionShiftId(null);
    }
  }, [sessionShiftId]);

  useEffect(() => {
    void reloadFromStorage();
  }, [reloadFromStorage]);

  useEffect(() => registerReload(reloadFromStorage), [registerReload, reloadFromStorage]);

  // End shift session on sign-out so the timer resets on next login.
  useEffect(() => {
    if (!currentUser) {
      setSessionShiftId(null);
      setCurrentShift(null);
    }
  }, [currentUser]);

  function save(shifts: Shift[]) {
    setAllShifts(shifts);
    saveData("shifts", shifts);
  }

  function clockIn(employeeId: string, employeeName: string, openingCash: number) {
    const now = new Date().toISOString();
    const cleaned = allShifts.map((s) =>
      s.employeeId === employeeId && s.status === "open" ? closeStaleOpenShift(s, now) : s,
    );

    const shift: Shift = {
      id: generateId(),
      employeeId,
      employeeName,
      startTime: now,
      endTime: null,
      openingCash,
      closingCash: null,
      expectedCash: null,
      cashDifference: null,
      cashMovements: [],
      salesCount: 0,
      salesTotal: 0,
      status: "open",
    };

    setSessionShiftId(shift.id);
    setCurrentShift(shift);
    save([...cleaned, shift]);
  }

  function clockOut(actualCash: number) {
    if (!currentShift) return;
    const expected = getExpectedCash(currentShift);
    const updated: Shift = {
      ...currentShift,
      endTime: new Date().toISOString(),
      closingCash: actualCash,
      expectedCash: expected,
      cashDifference: actualCash - expected,
      status: "closed",
    };
    setSessionShiftId(null);
    setCurrentShift(null);
    const all = allShifts.map((s) => (s.id === updated.id ? updated : s));
    save(all);
  }

  function addCashMovement(type: "in" | "out", amount: number, note: string) {
    if (!currentShift) return;
    const movement: CashMovement = {
      id: generateId(),
      type,
      amount,
      note,
      timestamp: new Date().toISOString(),
    };
    const updated: Shift = {
      ...currentShift,
      cashMovements: [...currentShift.cashMovements, movement],
    };
    setCurrentShift(updated);
    const all = allShifts.map((s) => (s.id === updated.id ? updated : s));
    save(all);
  }

  function recordSale(total: number) {
    if (!currentShift) return;
    const updated: Shift = {
      ...currentShift,
      salesCount: currentShift.salesCount + 1,
      salesTotal: currentShift.salesTotal + total,
    };
    setCurrentShift(updated);
    const all = allShifts.map((s) => (s.id === updated.id ? updated : s));
    save(all);
  }

  function getExpectedCash(shift: Shift | null = currentShift): number {
    if (!shift) return 0;
    return computeExpectedCash(shift);
  }

  async function wipeAllData(): Promise<void> {
    setSessionShiftId(null);
    setCurrentShift(null);
    setAllShifts(EMPTY_SHIFTS);
    await saveData("shifts", EMPTY_SHIFTS);
  }

  return (
    <ShiftContext.Provider
      value={{
        currentShift,
        allShifts,
        isClocked: sessionShiftId !== null && currentShift !== null,
        clockIn,
        clockOut,
        addCashMovement,
        recordSale,
        getExpectedCash,
        wipeAllData,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const ctx = useContext(ShiftContext);
  if (!ctx) throw new Error("useShift must be inside ShiftProvider");
  return ctx;
}
