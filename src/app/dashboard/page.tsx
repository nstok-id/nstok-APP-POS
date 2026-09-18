"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Receipt, 
  ShoppingBag, 
  Users, 
  Package, 
  ArrowUpRight, 
  DollarSign,
  Calendar,
  ShieldAlert
} from "lucide-react";
import { Transaction, Product, Customer } from "@/db/schema";
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS } from "@/db/index";
import { loadFromLocalStorage } from "@/lib/dual-persistence";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { HeaderKasir } from "@/components/HeaderKasir";
import { Card, Badge } from "@/components/ui/atoms";

export default function DashboardPage() {
  const { formatCurrency, settings } = useWorkspaceSettings();
  const { user, canAccess } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    setTransactions(loadFromLocalStorage("nstok_transactions_v3", []));
    setProducts(loadFromLocalStorage("nstok_products_v3", INITIAL_PRODUCTS));
    setCustomers(loadFromLocalStorage("nstok_customers_v3", INITIAL_CUSTOMERS));
  }, []);

  // RBAC Guard
  if (!canAccess(["OWNER", "MANAGER"])) {
    return (
      <div className="flex-1 flex flex-col h-screen">
        <HeaderKasir />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">403 - Akses Terbatas</h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            Halaman Dashboard analitik hanya dapat diakses oleh Owner dan Manager. Sesi kasir operasional dialihkan ke menu kasir.
          </p>
        </div>
      </div>
    );
  }

  const completedTrx = transactions.filter((t) => t.status === "COMPLETED");
  const totalRevenue = completedTrx.reduce((sum, t) => sum + parseFloat(t.grandTotal), 0);
  const totalBills = completedTrx.length;
  const avgBasketSize = totalBills > 0 ? Math.round(totalRevenue / totalBills) : 0;
  const totalStockQty = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <HeaderKasir />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Dashboard & Metrik Penjualan Live</h1>
            <p className="text-xs text-muted-foreground">Ringkasan transaksi dan analitik real-time workspace {settings.businessName}.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
              Live Sync Active
            </Badge>
          </div>
        </div>

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Omzet Penjualan Live</span>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{formatCurrency(totalRevenue)}</p>
            <p className="text-[11px] text-green-600 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>Real-time dari {totalBills} transaksi</span>
            </p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Total Nota Sukses</span>
              <Receipt className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{totalBills} Nota</p>
            <p className="text-[11px] text-muted-foreground">Transaksi berhasil di kasir</p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Rata-Rata Nota (Basket Size)</span>
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{formatCurrency(avgBasketSize)}</p>
            <p className="text-[11px] text-muted-foreground">Rata-rata nilai belanja per tamu</p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Master Stok & Member</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{customers.length} Member</p>
            <p className="text-[11px] text-muted-foreground">{products.length} SKU ({totalStockQty} unit fisik)</p>
          </Card>
        </div>

        {/* Live Transaction Feed Table */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-foreground">Aktivitas Transaksi Kasir Terbaru (Live Feed)</h2>
            <span className="text-xs text-muted-foreground">10 Transaksi Terakhir</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-muted-foreground border-b border-border bg-muted/30">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">No. Nota</th>
                  <th className="py-2.5 px-3 font-semibold">Waktu</th>
                  <th className="py-2.5 px-3 font-semibold">Kasir</th>
                  <th className="py-2.5 px-3 font-semibold">Pelanggan</th>
                  <th className="py-2.5 px-3 font-semibold">Metode</th>
                  <th className="py-2.5 px-3 font-semibold">Total Tagihan</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Belum ada aktivitas transaksi pada workspace ini.
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 10).map((trx) => (
                    <tr key={trx.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-foreground">{trx.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{new Date(trx.createdAt).toLocaleTimeString("id-ID")}</td>
                      <td className="py-2.5 px-3">{trx.cashierName}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{trx.customerName || "Umum"}</td>
                      <td className="py-2.5 px-3 font-medium">{trx.paymentMethod}</td>
                      <td className="py-2.5 px-3 font-bold text-foreground">{formatCurrency(parseFloat(trx.grandTotal))}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trx.status === "COMPLETED"
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        }`}>
                          {trx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
