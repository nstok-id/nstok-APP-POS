"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { HeaderKasir } from "@/components/HeaderKasir";
import { Card, Badge } from "@/components/ui/atoms";
import { Product, Transaction, Customer } from "@/db/schema";
import { loadFromLocalStorage } from "@/lib/dual-persistence";
import { getStarterProducts, getStarterCustomers } from "@/lib/starter-templates";
import { 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Users, 
  Package, 
  ArrowUpRight, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  FileText,
  Loader2,
  Store
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { formatCurrency } = useWorkspaceSettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const orgId = user?.organizationId || "org-demo-1";
  const PRODUCTS_STORAGE_KEY = `nstok_${orgId}_products`;
  const TRANSACTIONS_STORAGE_KEY = `nstok_${orgId}_transactions`;
  const CUSTOMERS_STORAGE_KEY = `nstok_${orgId}_customers`;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const defaultProducts = getStarterProducts((user.businessType as any) || "FNB", orgId);
      const defaultCustomers = getStarterCustomers(orgId);

      setProducts(loadFromLocalStorage<Product[]>(PRODUCTS_STORAGE_KEY, defaultProducts));
      setCustomers(loadFromLocalStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, defaultCustomers));
      setTransactions(loadFromLocalStorage<Transaction[]>(TRANSACTIONS_STORAGE_KEY, []));
    }
  }, [user, authLoading, orgId, router, PRODUCTS_STORAGE_KEY, CUSTOMERS_STORAGE_KEY, TRANSACTIONS_STORAGE_KEY]);

  if (authLoading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
      </div>
    );
  }

  // Calculate live metrics
  const completedTrx = transactions.filter((t) => t.status === "COMPLETED");
  const totalOmzet = completedTrx.reduce((acc, t) => acc + parseFloat(t.grandTotal || "0"), 0);
  const totalNota = completedTrx.length;
  const avgBasketSize = totalNota > 0 ? Math.round(totalOmzet / totalNota) : 0;
  const totalPoints = customers.reduce((acc, c) => acc + (c.loyaltyPoints || 0), 0);
  const lowStockCount = products.filter((p) => p.stock <= (p.minStockAlert || 5)).length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <HeaderKasir />

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        {/* Workspace Title Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                Workspace: {user.organizationName}
              </span>
              <span className="text-xs text-muted-foreground">• Vertikal {user.businessType}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Dashboard Ringkasan Toko
            </h1>
          </div>

          <button
            onClick={() => router.push("/pos")}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Store className="w-4 h-4" />
            <span>Buka Kasir POS</span>
          </button>
        </div>

        {/* 4 Main Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 relative overflow-hidden bg-card border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Omzet Penjualan
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground mt-2">
              {formatCurrency(totalOmzet)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-bold">100% Real-Time</span> dari transaksi kasir
            </p>
          </Card>

          <Card className="p-5 relative overflow-hidden bg-card border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Nota Selesai
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground mt-2">
              {totalNota} Nota
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Rata-rata: <span className="font-semibold text-foreground">{formatCurrency(avgBasketSize)}</span>/nota
            </p>
          </Card>

          <Card className="p-5 relative overflow-hidden bg-card border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                CRM & Pelanggan Member
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground mt-2">
              {customers.length} Member
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Total Poin Loyalitas: <span className="font-semibold text-purple-500">{totalPoints} Poin</span>
            </p>
          </Card>

          <Card className="p-5 relative overflow-hidden bg-card border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Katalog & Stok Barang
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground mt-2">
              {products.length} Menu/SKU
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {lowStockCount > 0 ? (
                <span className="text-amber-500 font-bold">{lowStockCount} barang stok menipis</span>
              ) : (
                <span className="text-emerald-500">Semua stok aman</span>
              )}
            </p>
          </Card>
        </div>

        {/* Live Recent Transactions Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-500" />
              <span>Riwayat Transaksi Terkini Toko ({transactions.length})</span>
            </h3>
            <span className="text-xs text-muted-foreground">Otomatis sinkron dengan kasir POS</span>
          </div>

          <Card className="overflow-hidden border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">No. Struk</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Metode Bayar</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Belum ada transaksi di toko ini. Mulai lakukan transaksi di halaman Kasir POS.
                      </td>
                    </tr>
                  ) : (
                    transactions.slice(0, 10).map((trx) => (
                      <tr key={trx.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          #{trx.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(trx.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium">
                          {trx.customerName || "Pelanggan Walk-in"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-muted text-foreground text-[10px] font-bold">
                            {trx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground">
                          {formatCurrency(parseFloat(trx.grandTotal || "0"))}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {trx.status === "VOIDED" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" /> VOID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> SUKSES
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
