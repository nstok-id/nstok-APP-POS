"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Scissors, 
  Wrench, 
  Boxes, 
  Globe, 
  Clock, 
  RefreshCw, 
  ChevronDown,
  LogOut,
  Store
} from "lucide-react";
import { useBusinessMode, BusinessArchetype, ARCHETYPES } from "@/context/BusinessModeContext";
import { useShift } from "@/context/ShiftContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { useAuth } from "@/context/AuthContext";

interface HeaderKasirProps {
  onOpenHistory?: () => void;
}

export function HeaderKasir({ onOpenHistory }: HeaderKasirProps) {
  const router = useRouter();
  const { mode } = useBusinessMode();
  const { isOpen } = useShift();
  const { syncStatus, triggerForceSync, settings } = useWorkspaceSettings();
  const { user, logout } = useAuth();
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getArchetypeIcon = (type: BusinessArchetype) => {
    switch (type) {
      case "FNB": return <UtensilsCrossed className="w-3.5 h-3.5" />;
      case "RETAIL": return <ShoppingBag className="w-3.5 h-3.5" />;
      case "SALON": return <Scissors className="w-3.5 h-3.5" />;
      case "SERVICES": return <Wrench className="w-3.5 h-3.5" />;
      case "WHOLESALE": return <Boxes className="w-3.5 h-3.5" />;
      case "HYBRID": return <Globe className="w-3.5 h-3.5" />;
    }
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari akun?")) {
      logout();
    }
  };

  return (
    <header className="h-14 bg-card border-b border-border px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 select-none shrink-0">
      {/* Left: Brand & Business Mode Switcher */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Store Title */}
        <div 
          onClick={() => router.push("/pos")}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
            nS
          </div>
          <div className="leading-tight">
            <h1 className="text-xs font-black tracking-tight text-foreground truncate max-w-[150px] sm:max-w-[200px]">
              {user?.organizationName || settings.businessName}
            </h1>
            <span className="text-[10px] text-emerald-500 font-bold uppercase">
              {user?.businessType || mode}
            </span>
          </div>
        </div>

        {/* Static Locked Business Type Badge (1 Akun = 1 Jenis Bisnis) */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 text-foreground border border-border text-xs font-semibold select-none">
          {getArchetypeIcon(mode)}
          <span className="text-[11px] font-bold">{ARCHETYPES[mode]?.name || mode}</span>
        </div>
      </div>

      {/* Right: Shift Status, Sync & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Shift Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/60 border border-border text-xs">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className={`text-[11px] font-bold ${isOpen ? "text-emerald-500" : "text-amber-500"}`}>
            {isOpen ? "Shift Aktif" : "Shift Tutup"}
          </span>
        </div>

        {/* Sync Status Button */}
        <button
          onClick={triggerForceSync}
          disabled={syncStatus.isSyncing}
          className="flex items-center gap-1 p-1.5 rounded-xl hover:bg-muted text-xs text-muted-foreground transition-colors border border-transparent hover:border-border cursor-pointer"
          title="Dual Persistence Sync"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${syncStatus.isSyncing ? "animate-spin" : ""}`} />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-bold text-foreground truncate max-w-[110px]">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground">{user?.role}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-60 bg-card border border-border rounded-2xl shadow-2xl p-2 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-border text-xs">
                <p className="font-bold text-foreground truncate">{user?.name}</p>
                <p className="text-[11px] text-muted-foreground font-mono truncate">{user?.email}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                    {user?.role}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                    {user?.organizationName}
                  </span>
                </div>
              </div>

              <div className="space-y-0.5 text-xs font-semibold">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-red-500 hover:bg-red-500/10 text-left transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
