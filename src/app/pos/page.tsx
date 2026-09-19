"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HeaderKasir } from "@/components/HeaderKasir";
import { ProductGrid } from "@/components/ProductGrid";
import { CartSidebar } from "@/components/CartSidebar";
import { PaymentModal } from "@/components/PaymentModal";
import { ReceiptModal } from "@/components/ReceiptModal";
import { SupervisorApprovalModal } from "@/components/SupervisorApprovalModal";
import { TransactionHistoryModal } from "@/components/TransactionHistoryModal";
import { Product, Transaction, Customer } from "@/db/schema";
import { getStarterProducts, getStarterCustomers } from "@/lib/starter-templates";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";
import { useCart } from "@/context/CartContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { History, Plus, Loader2, ShoppingBag, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  cloudGetProducts,
  cloudGetCustomers,
  cloudGetTransactions,
  cloudCreateTransaction,
  cloudSaveProduct,
  cloudDeleteProduct,
  cloudSaveCustomer,
} from "@/app/actions/cloud-sync";

export default function PosPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { items, grandTotal, setDiscountPercent, setDiscountAmount } = useCart();
  const { settings, formatCurrency } = useWorkspaceSettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [pendingDiscountValue, setPendingDiscountValue] = useState<number | null>(null);
  const [pendingVoidTrx, setPendingVoidTrx] = useState<Transaction | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // New Product Form state
  const [newProdName, setNewProdName] = useState("");
  const [newProdSku, setNewProdSku] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Minuman");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdStock, setNewProdStock] = useState("50");

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

      const loadedProducts = loadFromLocalStorage<Product[]>(PRODUCTS_STORAGE_KEY, defaultProducts);
      const loadedCustomers = loadFromLocalStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, defaultCustomers);
      const loadedTrx = loadFromLocalStorage<Transaction[]>(TRANSACTIONS_STORAGE_KEY, []);

      setProducts(loadedProducts);
      setCustomers(loadedCustomers);
      setTransactions(loadedTrx);

      // Async live fetch from Cloud DB (Supabase)
      cloudGetProducts(orgId).then((cloudProds) => {
        if (cloudProds && cloudProds.length > 0) {
          setProducts(cloudProds);
          saveToLocalStorage(PRODUCTS_STORAGE_KEY, cloudProds);
        } else if (cloudProds && cloudProds.length === 0 && loadedProducts.length > 0) {
          // Seed cloud with initial starter products
          loadedProducts.forEach((p) => cloudSaveProduct(p).catch(() => {}));
        }
      }).catch(() => {});

      cloudGetCustomers(orgId).then((cloudCusts) => {
        if (cloudCusts && cloudCusts.length > 0) {
          setCustomers(cloudCusts);
          saveToLocalStorage(CUSTOMERS_STORAGE_KEY, cloudCusts);
        }
      }).catch(() => {});

      cloudGetTransactions(orgId).then((cloudTrx) => {
        if (cloudTrx) {
          setTransactions(cloudTrx);
          saveToLocalStorage(TRANSACTIONS_STORAGE_KEY, cloudTrx);
        }
      }).catch(() => {});
    }
  }, [user, authLoading, orgId, router, PRODUCTS_STORAGE_KEY, CUSTOMERS_STORAGE_KEY, TRANSACTIONS_STORAGE_KEY]);

  const handlePaymentSuccess = (trx: Transaction) => {
    const updatedTrx = [trx, ...transactions];
    setTransactions(updatedTrx);
    saveToLocalStorage(TRANSACTIONS_STORAGE_KEY, updatedTrx);

    // Save to Cloud DB (Supabase)
    cloudCreateTransaction(trx).catch((err) => console.warn("Cloud create trx warning:", err));

    // Deduct stock for sold items
    const soldItems = JSON.parse(trx.itemsJson || "[]");
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const sold = soldItems.find((s: any) => s.product.id === p.id);
        if (sold) {
          return { ...p, stock: Math.max(0, p.stock - sold.quantity) };
        }
        return p;
      });
      saveToLocalStorage(PRODUCTS_STORAGE_KEY, updated);
      return updated;
    });

    // If customer selected, add loyalty points (1 pt per 10k)
    if (trx.customerId) {
      const trxAmount = parseFloat(trx.grandTotal || "0");
      setCustomers((prev) => {
        const updated = prev.map((c) => {
          if (c.id === trx.customerId) {
            const addedPoints = Math.floor(trxAmount / 10000);
            const currentSpent = parseFloat(c.totalSpent || "0") || 0;
            const updatedCust = {
              ...c,
              loyaltyPoints: (c.loyaltyPoints || 0) + addedPoints,
              totalSpent: (currentSpent + trxAmount).toString(),
            };
            cloudSaveCustomer(updatedCust).catch(() => {});
            return updatedCust;
          }
          return c;
        });
        saveToLocalStorage(CUSTOMERS_STORAGE_KEY, updated);
        return updated;
      });
    }

    setActiveTransaction(trx);
    setReceiptModalOpen(true);
  };

  const handleOpenDiscountApproval = (discountVal: number) => {
    setPendingDiscountValue(discountVal);
    setApprovalModalOpen(true);
  };

  const handleApproved = () => {
    if (pendingDiscountValue !== null) {
      setDiscountPercent(pendingDiscountValue);
      setDiscountAmount(0);
      setPendingDiscountValue(null);
    } else if (pendingVoidTrx !== null) {
      // Execute void
      const updated = transactions.map((t) =>
        t.id === pendingVoidTrx.id
          ? { ...t, status: "VOIDED" as const, voidReason: "Dibatalkan oleh Kasir & Disetujui Supervisor" }
          : t
      );
      setTransactions(updated);
      saveToLocalStorage(TRANSACTIONS_STORAGE_KEY, updated);

      // Restore stock
      const voidItems = JSON.parse(pendingVoidTrx.itemsJson || "[]");
      setProducts((prev) => {
        const restored = prev.map((p) => {
          const item = voidItems.find((s: any) => s.product.id === p.id);
          if (item) {
            return { ...p, stock: p.stock + item.quantity };
          }
          return p;
        });
        saveToLocalStorage(PRODUCTS_STORAGE_KEY, restored);
        return restored;
      });

      setPendingVoidTrx(null);
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      organizationId: orgId,
      outletId: "outlet-1",
      name: newProdName,
      sku: newProdSku || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: null,
      category: newProdCategory,
      costPrice: (parseFloat(newProdPrice) * 0.6).toString(),
      sellingPrice: newProdPrice,
      wholesalePrice: null,
      minWholesaleQty: 10,
      stock: parseInt(newProdStock) || 0,
      unit: "pcs",
      minStockAlert: settings.lowStockThresholdDefault || 5,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updated = [newProduct, ...products];
    setProducts(updated);
    saveToLocalStorage(PRODUCTS_STORAGE_KEY, updated);
    cloudSaveProduct(newProduct).catch(() => {});

    setNewProdName("");
    setNewProdSku("");
    setNewProdPrice("");
    setNewProdStock("50");
    setAddProductModalOpen(false);
  };

  const handleDeleteProduct = (prodId: string) => {
    const updated = products.filter((p) => p.id !== prodId);
    setProducts(updated);
    saveToLocalStorage(PRODUCTS_STORAGE_KEY, updated);
    cloudDeleteProduct(prodId).catch(() => {});
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      {/* Top Header */}
      <HeaderKasir
        onOpenHistory={() => setHistoryModalOpen(true)}
      />

      {/* Main Split Screen */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Full: Product Grid */}
        <div className="flex-1 overflow-y-auto bg-muted/20 p-3 sm:p-4 pb-28 lg:pb-4 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">Etalase Kasir</h2>
              <p className="text-xs text-muted-foreground">
                Toko: <span className="font-semibold text-emerald-500">{user.organizationName}</span> • Vertikal: {user.businessType}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryModalOpen(true)}
                className="gap-1 text-xs cursor-pointer h-8"
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat ({transactions.length})</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setAddProductModalOpen(true)}
                className="gap-1 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Menu</span>
              </Button>
            </div>
          </div>

          <ProductGrid 
            products={products} 
            onDeleteProduct={handleDeleteProduct}
          />
        </div>

        {/* Right: Cart Sidebar (Desktop only: lg:flex) */}
        <div className="hidden lg:flex w-96 border-l border-border bg-card flex-col shadow-lg shrink-0">
          <CartSidebar
            customersList={customers}
            onCheckout={() => setPaymentModalOpen(true)}
            onOpenApprovalModal={handleOpenDiscountApproval}
          />
        </div>
      </div>

      {/* Floating Bottom Cart Action Bar for Mobile & Tablets (lg:hidden) */}
      {items.length > 0 && (
        <div 
          className="lg:hidden fixed bottom-14 inset-x-3 z-30 animate-in slide-in-from-bottom duration-200"
          style={{ bottom: "calc(3.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <button
            onClick={() => setMobileCartOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white shadow-2xl shadow-emerald-950/60 flex items-center justify-between font-bold text-xs sm:text-sm cursor-pointer border border-emerald-400/40"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white text-emerald-700 flex items-center justify-center font-black text-xs">
                {items.reduce((a, b) => a + b.quantity, 0)}
              </span>
              <span className="truncate max-w-[130px] sm:max-w-none">{items.length} Menu</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">{formatCurrency(grandTotal)}</span>
              <span className="text-[11px] bg-emerald-700/80 px-2.5 py-1 rounded-xl flex items-center gap-1 font-bold">
                Keranjang & Bayar →
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Mobile Slide-Up Cart Bottom Sheet Drawer (lg:hidden) */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileCartOpen(false)}
          />
          <div 
            className="relative z-50 bg-card border-t border-border rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-foreground">
                  Keranjang ({items.reduce((a, b) => a + b.quantity, 0)} Item)
                </span>
              </div>
              <button
                onClick={() => setMobileCartOpen(false)}
                className="p-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[calc(90vh-3.5rem)]">
              <CartSidebar
                customersList={customers}
                onCheckout={() => {
                  setMobileCartOpen(false);
                  setPaymentModalOpen(true);
                }}
                onOpenApprovalModal={(disc) => {
                  setMobileCartOpen(false);
                  handleOpenDiscountApproval(disc);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        transaction={activeTransaction}
      />

      {/* Supervisor Approval Modal */}
      <SupervisorApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => {
          setApprovalModalOpen(false);
          setPendingDiscountValue(null);
          setPendingVoidTrx(null);
        }}
        onApproved={handleApproved}
        actionTitle={pendingVoidTrx ? "Otorisasi Pembatalan Nota (Void)" : "Otorisasi Diskon Khusus"}
        actionDescription={
          pendingVoidTrx
            ? `Masukkan PIN/Sandi Supervisor untuk membatalkan nota #${pendingVoidTrx.invoiceNumber}`
            : `Masukkan PIN/Sandi Supervisor untuk memberikan diskon ${pendingDiscountValue}%`
        }
      />

      {/* Transaction History Modal */}
      <TransactionHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        transactions={transactions}
        onReprint={(trx) => {
          setActiveTransaction(trx);
          setReceiptModalOpen(true);
        }}
        onRequestVoid={(trx) => {
          setPendingVoidTrx(trx);
          setApprovalModalOpen(true);
        }}
      />

      {/* Quick Add Product Modal */}
      <Dialog open={addProductModalOpen} onOpenChange={setAddProductModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Menu / Barang Baru</DialogTitle>
            <DialogDescription>
              Tambahkan item baru langsung ke katalog kasir {user.organizationName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProduct} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Nama Menu / Produk</label>
              <Input
                placeholder="Contoh: Caramel Latte Special"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Kategori</label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-md border border-input bg-background"
                >
                  <option value="Minuman">Minuman</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Camilan">Camilan</option>
                  <option value="Sembako">Sembako</option>
                  <option value="Sparepart">Sparepart</option>
                  <option value="Layanan">Layanan</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">SKU / Kode (Opsional)</label>
                <Input
                  placeholder="Auto-generated"
                  value={newProdSku}
                  onChange={(e) => setNewProdSku(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Harga Jual (Rp)</label>
                <Input
                  type="number"
                  placeholder="25000"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Stok Awal</label>
                <Input
                  type="number"
                  placeholder="50"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddProductModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Simpan & Tambahkan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
