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
    <header className="h-14 bg-zinc-900 border-b border-zinc-800 px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 select-none shrink-0">
      {/* Left: Brand & Business Name (Category placed cleanly underneath) */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        <div 
          onClick={() => router.push("/pos")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
            nS
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-xs sm:text-sm font-black tracking-tight text-zinc-100 truncate max-w-[140px] sm:max-w-[220px]">
              {user?.organizationName || settings.businessName}
            </h1>
            <div className="flex items-center gap-1 mt-0.5 text-[10.5px] font-bold text-emerald-400">
              {getArchetypeIcon(mode)}
              <span className="truncate max-w-[130px] sm:max-w-[180px]">
                {ARCHETYPES[mode]?.name || user?.businessType || mode}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Shift Status, Sync & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Shift Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
          <Clock className="w-3 h-3 text-zinc-400" />
          <span className={`text-[11px] font-bold ${isOpen ? "text-emerald-400" : "text-amber-400"}`}>
            {isOpen ? "Shift Aktif" : "Shift Tutup"}
          </span>
        </div>

        {/* Sync Status Button */}
        <button
          onClick={triggerForceSync}
          disabled={syncStatus.isSyncing}
          className="flex items-center gap-1 p-1.5 rounded-xl hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors border border-transparent hover:border-zinc-700 cursor-pointer"
          title="Dual Persistence Sync"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${syncStatus.isSyncing ? "animate-spin" : ""}`} />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 border-l border-zinc-800 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-bold text-zinc-200 truncate max-w-[110px]">{user?.name}</p>
              <p className="text-[10px] text-zinc-400">{user?.role}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-60 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-zinc-800 text-xs">
                <p className="font-bold text-zinc-100 truncate">{user?.name}</p>
                <p className="text-[11px] text-zinc-400 font-mono truncate">{user?.email}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    {user?.role}
                  </span>
                  <span className="text-[10px] text-zinc-400 truncate max-w-[100px]">
                    {user?.organizationName}
                  </span>
                </div>
              </div>

              <div className="space-y-0.5 text-xs font-semibold">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-red-400 hover:bg-red-500/10 text-left transition-colors cursor-pointer"
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
