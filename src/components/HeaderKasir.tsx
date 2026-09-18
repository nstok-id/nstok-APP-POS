"use client";

import React, { useState } from "react";
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Scissors, 
  Wrench, 
  Boxes, 
  Globe, 
  Clock, 
  Cloud, 
  RefreshCw, 
  Sparkles,
  ChevronDown,
  UserCheck
} from "lucide-react";
import { useBusinessMode, BusinessArchetype, ARCHETYPES } from "@/context/BusinessModeContext";
import { useShift } from "@/context/ShiftContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { useAuth } from "@/context/AuthContext";

export function HeaderKasir() {
  const { mode, setMode } = useBusinessMode();
  const { currentShift, isOpen } = useShift();
  const { syncStatus, triggerForceSync } = useWorkspaceSettings();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getArchetypeIcon = (type: BusinessArchetype) => {
    switch (type) {
      case "FNB": return <UtensilsCrossed className="w-4 h-4" />;
      case "RETAIL": return <ShoppingBag className="w-4 h-4" />;
      case "SALON": return <Scissors className="w-4 h-4" />;
      case "SERVICES": return <Wrench className="w-4 h-4" />;
      case "WHOLESALE": return <Boxes className="w-4 h-4" />;
      case "HYBRID": return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <header className="h-14 bg-card border-b border-border px-4 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Business Mode Selector */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold transition-all"
          >
            {getArchetypeIcon(mode)}
            <span>Mode: {ARCHETYPES[mode].name}</span>
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl p-1.5 z-50 space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">Pilih Arketipe Bisnis</p>
              {(Object.keys(ARCHETYPES) as BusinessArchetype[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setMode(type);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    mode === type ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted text-foreground"
                  }`}
                >
                  {getArchetypeIcon(type)}
                  <span>{ARCHETYPES[type].name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vertical Features Badges */}
        <div className="hidden md:flex items-center gap-1.5">
          {ARCHETYPES[mode].features.map((feat) => (
            <span key={feat} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Shift Status & Dual Sync Status */}
      <div className="flex items-center gap-3">
        {/* Shift Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/60 border border-border text-xs">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Shift:</span>
          <span className={`font-semibold ${isOpen ? "text-green-600 dark:text-green-400" : "text-amber-600"}`}>
            {isOpen ? `Aktif (${currentShift?.cashierName})` : "Tutup"}
          </span>
        </div>

        {/* Sync Status Button */}
        <button
          onClick={triggerForceSync}
          disabled={syncStatus.isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-muted text-xs text-muted-foreground transition-colors border border-transparent hover:border-border"
          title="Dual Persistence Sync"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${syncStatus.isSyncing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline text-[11px]">Sync: {syncStatus.lastSynced}</span>
        </button>

        {/* User Role Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="hidden lg:block text-left leading-tight">
            <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
