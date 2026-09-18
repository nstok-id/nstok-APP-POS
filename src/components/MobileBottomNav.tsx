"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  ShoppingBag, 
  LayoutDashboard, 
  Package, 
  Users, 
  MoreHorizontal,
  Settings,
  UsersRound,
  Truck,
  LogOut,
  Store,
  X,
  Clock,
  RefreshCw
} from "lucide-react";
import { useAuth, Role } from "@/context/AuthContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { useCart } from "@/context/CartContext";
import { useShift } from "@/context/ShiftContext";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, canAccess } = useAuth();
  const { settings, syncStatus, triggerForceSync } = useWorkspaceSettings();
  const { items } = useCart();
  const { isOpen } = useShift();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Do not render bottom nav on login, invite, or onboarding
  if (pathname === "/login" || pathname.startsWith("/accept-invite") || pathname === "/business-select") {
    return null;
  }

  const primaryTabs = [
    {
      name: "Kasir",
      href: "/pos",
      icon: ShoppingBag,
      allowedRoles: ["OWNER", "MANAGER", "SUPERVISOR", "KASIR", "STAFF_DAPUR", "TEKNISI"] as Role[],
      badge: items.length > 0 ? items.reduce((acc, i) => acc + i.quantity, 0) : undefined,
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      allowedRoles: ["OWNER", "MANAGER"] as Role[],
    },
    {
      name: "Inventori",
      href: "/inventory",
      icon: Package,
      allowedRoles: ["OWNER", "MANAGER", "SUPERVISOR"] as Role[],
    },
    {
      name: "Pelanggan",
      href: "/customers",
      icon: Users,
      allowedRoles: ["OWNER", "MANAGER", "SUPERVISOR", "KASIR"] as Role[],
    },
  ].filter((t) => canAccess(t.allowedRoles));

  return (
    <>
      {/* Fixed Bottom Navigation Bar (Mobile / Tablet only: lg:hidden) */}
      <nav 
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-2 py-1.5 flex items-center justify-around shadow-2xl select-none"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {primaryTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                isActive
                  ? "text-emerald-500 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110 text-emerald-500" : ""}`} />
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 bg-emerald-600 text-white font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? "font-bold text-emerald-500" : "font-medium"}`}>
                {tab.name}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />
              )}
            </Link>
          );
        })}

        {/* More Menu Drawer Trigger */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer ${
            drawerOpen ? "text-emerald-500 font-bold" : ""
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Menu</span>
        </button>
      </nav>

      {/* Slide-Up More Menu Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <div 
            className="relative z-50 bg-card border-t border-border rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-300"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{settings.businessName}</h3>
                  <p className="text-[11px] text-muted-foreground">{user?.role} • {user?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status Pill Bar */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-muted/50 border border-border flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Status Shift</p>
                  <p className={`font-bold ${isOpen ? "text-emerald-500" : "text-amber-500"}`}>
                    {isOpen ? "Shift Aktif" : "Shift Tutup"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => triggerForceSync()}
                disabled={syncStatus.isSyncing}
                className="p-2.5 rounded-xl bg-muted/50 border border-border flex items-center gap-2 text-left cursor-pointer hover:bg-muted"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-500 ${syncStatus.isSyncing ? "animate-spin" : ""}`} />
                <div>
                  <p className="text-[10px] text-muted-foreground">Dual Sync</p>
                  <p className="font-bold text-foreground">{syncStatus.isSyncing ? "Sinkron..." : "Tersinkron"}</p>
                </div>
              </button>
            </div>

            {/* Menu Links */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase px-1">Manajemen & Pengaturan</p>

              {canAccess(["OWNER", "MANAGER"]) && (
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    router.push("/team");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground text-left transition-colors cursor-pointer"
                >
                  <UsersRound className="w-4 h-4 text-emerald-500" />
                  <span className="flex-1">Manajemen Tim & Karyawan</span>
                </button>
              )}

              {canAccess(["OWNER", "MANAGER"]) && (
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    router.push("/suppliers");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground text-left transition-colors cursor-pointer"
                >
                  <Truck className="w-4 h-4 text-emerald-500" />
                  <span className="flex-1">Pemasok & Supplier</span>
                </button>
              )}

              {canAccess(["OWNER", "MANAGER"]) && (
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    router.push("/settings");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground text-left transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-emerald-500" />
                  <span className="flex-1">Pengaturan Toko & POS</span>
                </button>
              )}

              <button
                onClick={() => {
                  setDrawerOpen(false);
                  router.push("/business-select");
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground text-left transition-colors cursor-pointer"
              >
                <Store className="w-4 h-4 text-emerald-500" />
                <span className="flex-1">Ganti Vertikal / Konfigurasi Toko</span>
              </button>
            </div>

            {/* Logout */}
            <div className="pt-2 border-t border-border">
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
