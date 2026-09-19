"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";
import { useAuth } from "./AuthContext";

export interface ShiftData {
  id: string;
  cashierName: string;
  startingCash: number;
  expectedCash: number;
  actualCash?: number;
  discrepancy?: number;
  totalSales: number;
  totalTransactions: number;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt?: string;
  notes?: string;
}

interface ShiftContextType {
  currentShift: ShiftData | null;
  isOpen: boolean;
  openShift: (startingCash: number, cashierName: string) => void;
  closeShift: (actualCash: number, notes?: string) => ShiftData;
  recordSale: (amount: number, isCash: boolean) => void;
}

const ShiftContext = createContext<ShiftContextType | null>(null);

export function ShiftProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentShift, setCurrentShift] = useState<ShiftData | null>(null);

  const orgId = user?.organizationId || "org-demo-1";
  const shiftKey = `nstok_${orgId}_active_shift`;

  useEffect(() => {
    const saved = loadFromLocalStorage<ShiftData | null>(shiftKey, {
      id: `shift-init-${Date.now()}`,
      cashierName: user?.name || "Kasir Utama",
      startingCash: 200000,
      expectedCash: 200000,
      totalSales: 0,
      totalTransactions: 0,
      status: "OPEN",
      openedAt: new Date().toISOString(),
    });
    setCurrentShift(saved);
  }, [orgId, shiftKey, user?.name]);

  const openShift = (startingCash: number, cashierName: string) => {
    const newShift: ShiftData = {
      id: `shift-${Date.now()}`,
      cashierName,
      startingCash,
      expectedCash: startingCash,
      totalSales: 0,
      totalTransactions: 0,
      status: "OPEN",
      openedAt: new Date().toISOString(),
    };
    setCurrentShift(newShift);
    saveToLocalStorage(shiftKey, newShift);
  };

  const closeShift = (actualCash: number, notes?: string): ShiftData => {
    if (!currentShift) throw new Error("No active shift");
    const closed: ShiftData = {
      ...currentShift,
      actualCash,
      discrepancy: actualCash - currentShift.expectedCash,
      status: "CLOSED",
      closedAt: new Date().toISOString(),
      notes,
    };
    setCurrentShift(closed);
    saveToLocalStorage(shiftKey, closed);
    return closed;
  };

  const recordSale = (amount: number, isCash: boolean) => {
    if (!currentShift || currentShift.status !== "OPEN") return;
    setCurrentShift((prev) => {
      if (!prev) return null;
      const updated: ShiftData = {
        ...prev,
        totalSales: prev.totalSales + amount,
        totalTransactions: prev.totalTransactions + 1,
        expectedCash: isCash ? prev.expectedCash + amount : prev.expectedCash,
      };
      saveToLocalStorage(shiftKey, updated);
      return updated;
    });
  };

  return (
    <ShiftContext.Provider
      value={{
        currentShift,
        isOpen: currentShift?.status === "OPEN",
        openShift,
        closeShift,
        recordSale,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error("useShift must be used within a ShiftProvider");
  }
  return context;
}
