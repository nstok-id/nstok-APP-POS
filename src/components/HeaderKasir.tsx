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
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  Store,
  Menu,
  X
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
  const pathname = usePathname();
  const { mode, setMode } = useBusinessMode();
  const { currentShift, isOpen } = useShift();
  const { syncStatus, triggerForceSync, settings } = useWorkspaceSettings();
  const { user, logout } = useAuth();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  const navLinks = [
    { label: "Kasir POS", path: "/pos", icon: ShoppingCart },
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Inventory", path: "/inventory", icon: Package },
    { label: "Customers", path: "/customers", icon: Users },
    { label: "Tim", path: "/team", icon: ShieldCheck },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari akun?")) {
      logout();
    }
  };

  return (
    <header className="h-14 bg-card border-b border-border px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Brand & Business Mode */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="lg:hidden p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Store Title */}
        <div 
          onClick={() => router.push("/pos")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
            nS
          </div>
          <div className="hidden sm:block leading-tight">
            <h1 className="text-xs font-black tracking-tight text-foreground truncate max-w-[140px]">
              {user?.organizationName || settings.businessName}
            </h1>
            <span className="text-[10px] text-emerald-500 font-bold uppercase">
              {user?.businessType || mode}
            </span>
          </div>
        </div>

        {/* Business Mode Dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold transition-all cursor-pointer"
          >
            {getArchetypeIcon(mode)}
            <span className="hidden md:inline text-[11px]">{ARCHETYPES[mode].name}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-52 bg-card border border-border rounded-2xl shadow-2xl p-1.5 z-50 space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">Vertikal Bisnis</p>
              {(Object.keys(ARCHETYPES) as BusinessArchetype[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setMode(type);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                    mode === type ? "bg-emerald-600 text-white font-bold" : "hover:bg-muted text-foreground"
                  }`}
                >
                  {getArchetypeIcon(type)}
                  <span>{ARCHETYPES[type].name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Desktop Navigation Bar */}
      <nav className="hidden lg:flex items-center gap-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.path;
          return (
            <button
              key={link.path}
              onClick={() => router.push(link.path)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right: Shift Status, Sync & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Shift Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border text-xs">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className={`text-[11px] font-bold ${isOpen ? "text-emerald-500" : "text-amber-500"}`}>
            {isOpen ? "Shift Aktif" : "Shift Tutup"}
          </span>
        </div>

        {/* Sync Status Button */}
        <button
          onClick={triggerForceSync}
          disabled={syncStatus.isSyncing}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted text-xs text-muted-foreground transition-colors border border-transparent hover:border-border cursor-pointer"
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
            <div className="hidden md:block text-left leading-tight">
              <p className="text-xs font-bold text-foreground truncate max-w-[110px]">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground">{user?.role}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-60 bg-card border border-border rounded-2xl shadow-2xl p-2 z-50 space-y-2">
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
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push("/business-select");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-foreground hover:bg-muted text-left transition-colors cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Ganti / Atur Toko</span>
                </button>

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

      {/* Mobile Nav Slide Overlay */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-x-0 top-14 bg-card border-b border-border shadow-2xl p-4 z-40 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <p className="text-[10px] font-bold text-muted-foreground uppercase px-2">Menu Halaman</p>
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => {
                    setMobileNavOpen(false);
                    router.push(link.path);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-muted/60 text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
