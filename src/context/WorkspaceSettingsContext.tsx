"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";
import { useAuth } from "./AuthContext";

export interface WorkspaceSettingsData {
  businessName: string;
  businessAddress: string;
  phone: string;
  email: string;
  npwp: string;
  currency: string;
  taxPercentage: number;
  taxEnabled: boolean;
  roundingRule: 'NONE' | 'UP_100' | 'NEAREST_100';
  receiptPaperSize: '58mm' | '80mm';
  receiptHeader: string;
  receiptFooter: string;
  receiptShowLogo: boolean;
  lowStockThresholdDefault: number;
  approvalDiscountThresholdPercent: number;
  approvalRequireVoid: boolean;
  sessionTimeoutMinutes: number;
  activeModules: string[];
}

export const DEFAULT_SETTINGS: WorkspaceSettingsData = {
  businessName: "OmniPOS Usaha Saya",
  businessAddress: "Jl. Jenderal Sudirman No. 88, Jakarta Selatan",
  phone: "0812-3456-7890",
  email: "kontak@omnipos.id",
  npwp: "01.234.567.8-901.000",
  currency: "IDR",
  taxPercentage: 11,
  taxEnabled: true,
  roundingRule: "NONE",
  receiptPaperSize: "58mm",
  receiptHeader: "Terima Kasih Atas Kunjungan Anda!",
  receiptFooter: "Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.\nFollow IG: @omnipos.official",
  receiptShowLogo: true,
  lowStockThresholdDefault: 5,
  approvalDiscountThresholdPercent: 20,
  approvalRequireVoid: true,
  sessionTimeoutMinutes: 525600, // 525.600 menit = 1 Tahun (365 Hari)
  activeModules: ["fnb_kds", "tables", "loyalty"],
};

interface WorkspaceSettingsContextType {
  settings: WorkspaceSettingsData;
  updateSettings: (newSettings: Partial<WorkspaceSettingsData>) => void;
  resetSettings: () => void;
  formatCurrency: (amount: number) => string;
  calculateTax: (subtotal: number) => number;
  applyRounding: (amount: number) => number;
  syncStatus: {
    isSyncing: boolean;
    lastSynced: string;
  };
  triggerForceSync: () => Promise<void>;
}

const WorkspaceSettingsContext = createContext<WorkspaceSettingsContextType | null>(null);

export function WorkspaceSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<WorkspaceSettingsData>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    lastSynced: "Baru saja",
  });

  const getStorageKey = () => {
    return user?.organizationId ? `nstok_${user.organizationId}_settings` : "nstok_workspace_settings_v3";
  };

  useEffect(() => {
    const key = getStorageKey();
    const initialWithOrgName: WorkspaceSettingsData = {
      ...DEFAULT_SETTINGS,
      businessName: user?.organizationName || DEFAULT_SETTINGS.businessName,
      email: user?.email || DEFAULT_SETTINGS.email,
    };
    const saved = loadFromLocalStorage<WorkspaceSettingsData>(key, initialWithOrgName);
    setSettings(saved);
    setIsLoaded(true);
  }, [user?.organizationId, user?.organizationName]);

  const updateSettings = (newSettings: Partial<WorkspaceSettingsData>) => {
    const key = getStorageKey();
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveToLocalStorage(key, updated);
      return updated;
    });

    // Simulate background dual-sync
    setSyncStatus({ isSyncing: true, lastSynced: "Sedang sinkron..." });
    setTimeout(() => {
      setSyncStatus({ isSyncing: false, lastSynced: new Date().toLocaleTimeString("id-ID") });
    }, 500);
  };

  const resetSettings = () => {
    const key = getStorageKey();
    const initialWithOrgName: WorkspaceSettingsData = {
      ...DEFAULT_SETTINGS,
      businessName: user?.organizationName || DEFAULT_SETTINGS.businessName,
    };
    setSettings(initialWithOrgName);
    saveToLocalStorage(key, initialWithOrgName);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTax = (subtotal: number): number => {
    if (!settings.taxEnabled || settings.taxPercentage <= 0) return 0;
    return Math.round(subtotal * (settings.taxPercentage / 100));
  };

  const applyRounding = (amount: number): number => {
    if (settings.roundingRule === "UP_100") {
      return Math.ceil(amount / 100) * 100;
    }
    if (settings.roundingRule === "NEAREST_100") {
      return Math.round(amount / 100) * 100;
    }
    return amount;
  };

  const triggerForceSync = async () => {
    setSyncStatus({ isSyncing: true, lastSynced: "Menyinkronkan cloud..." });
    await new Promise((r) => setTimeout(r, 800));
    setSyncStatus({ isSyncing: false, lastSynced: new Date().toLocaleTimeString("id-ID") });
  };

  return (
    <WorkspaceSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        formatCurrency,
        calculateTax,
        applyRounding,
        syncStatus,
        triggerForceSync,
      }}
    >
      {children}
    </WorkspaceSettingsContext.Provider>
  );
}

export function useWorkspaceSettings() {
  const context = useContext(WorkspaceSettingsContext);
  if (!context) {
    throw new Error("useWorkspaceSettings must be used within a WorkspaceSettingsProvider");
  }
  return context;
}
