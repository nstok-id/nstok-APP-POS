"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShoppingBag, 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  UsersRound, 
  Settings, 
  LogOut,
  Store,
  ReceiptText
} from "lucide-react";
import { useAuth, Role } from "@/context/AuthContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: Role[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Kasir POS",
    href: "/pos",
    icon: ShoppingBag,
    allowedRoles: ["OWNER", "MANAGER", "SUPERVISOR", "KASIR", "STAFF_DAPUR", "TEKNISI"],
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    name: "Inventori Stok",
    href: "/inventory",
    icon: Package,
    allowedRoles: ["OWNER", "MANAGER", "SUPERVISOR"],
  },
  {
    name: "Pelanggan & CRM",
    href: "/customers",
    icon: Users,
    allowedRoles: ["OWNER", "MANAGER", "SUPERVISOR", "KASIR"],
  },
  {
    name: "Pemasok",
    href: "/suppliers",
    icon: Truck,
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    name: "Manajemen Tim",
    href: "/team",
    icon: UsersRound,
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    name: "Pengaturan Toko",
    href: "/settings",
    icon: Settings,
    allowedRoles: ["OWNER", "MANAGER"],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout, canAccess } = useAuth();
  const { settings } = useWorkspaceSettings();

  // If on login or invite page, do not render sidebar
  if (pathname === "/login" || pathname.startsWith("/accept-invite") || pathname === "/business-select") {
    return null;
  }

  const visibleNavItems = NAV_ITEMS.filter((item) => canAccess(item.allowedRoles));

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col justify-between h-screen shrink-0 sticky top-0">
      <div>
        {/* Workspace Brand Header */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
            <Store className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h2 className="font-bold text-sm truncate text-foreground">{settings.businessName}</h2>
            <p className="text-xs text-muted-foreground truncate">{user?.role || "KASIR"} • {user?.name}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer & Logout */}
      <div className="p-3 border-t border-border">
        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 mb-2 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">Ekosistem nStok</p>
            <p className="text-xs font-medium text-foreground">v3.0.0 Unified POS</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Dual Persistence Active" />
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </aside>
  );
}
