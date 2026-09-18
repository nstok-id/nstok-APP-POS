"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";

export type BusinessArchetype = "FNB" | "RETAIL" | "SALON" | "SERVICES" | "WHOLESALE" | "HYBRID";

export interface BusinessModeInfo {
  type: BusinessArchetype;
  name: string;
  badge: string;
  icon: string;
  features: string[];
}

export const ARCHETYPES: Record<BusinessArchetype, BusinessModeInfo> = {
  FNB: {
    type: "FNB",
    name: "Restoran & Kafe",
    badge: "F&B",
    icon: "UtensilsCrossed",
    features: ["Denah Meja", "Kitchen Display (KDS)", "Split Bill", "Modifier Menu"],
  },
  RETAIL: {
    type: "RETAIL",
    name: "Minimarket & Retail",
    badge: "Retail",
    icon: "ShoppingBag",
    features: ["Barcode Scanner", "Cetak Label", "Multi-Satuan", "Low Stock Alert"],
  },
  SALON: {
    type: "SALON",
    name: "Salon & Barbershop",
    badge: "Salon/Spa",
    icon: "Scissors",
    features: ["Booking Appointment", "Komisi Terapis", "Paket Perawatan"],
  },
  SERVICES: {
    type: "SERVICES",
    name: "Bengkel & Jasa Servis",
    badge: "Bengkel",
    icon: "Wrench",
    features: ["Work Order (SPK)", "Pelacakan Plat/IMEI", "Estimasi Biaya"],
  },
  WHOLESALE: {
    type: "WHOLESALE",
    name: "Grosir & Distributor",
    badge: "Grosir",
    icon: "Boxes",
    features: ["Harga Bertingkat", "Jatuh Tempo (TOP)", "Surat Jalan"],
  },
  HYBRID: {
    type: "HYBRID",
    name: "Toko Hybrid Multi-Channel",
    badge: "Hybrid",
    icon: "Globe",
    features: ["Sinkronisasi Online", "Cetak Resi", "Multi-Warehouse"],
  },
};

interface BusinessModeContextType {
  mode: BusinessArchetype;
  modeInfo: BusinessModeInfo;
  setMode: (mode: BusinessArchetype) => void;
}

const BusinessModeContext = createContext<BusinessModeContextType | null>(null);

const MODE_STORAGE_KEY = "nstok_business_mode_v3";

export function BusinessModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<BusinessArchetype>("FNB");

  useEffect(() => {
    const saved = loadFromLocalStorage<BusinessArchetype>(MODE_STORAGE_KEY, "FNB");
    setModeState(saved);
  }, []);

  const setMode = (newMode: BusinessArchetype) => {
    setModeState(newMode);
    saveToLocalStorage(MODE_STORAGE_KEY, newMode);
  };

  return (
    <BusinessModeContext.Provider
      value={{
        mode,
        modeInfo: ARCHETYPES[mode],
        setMode,
      }}
    >
      {children}
    </BusinessModeContext.Provider>
  );
}

export function useBusinessMode() {
  const context = useContext(BusinessModeContext);
  if (!context) {
    throw new Error("useBusinessMode must be used within a BusinessModeProvider");
  }
  return context;
}
