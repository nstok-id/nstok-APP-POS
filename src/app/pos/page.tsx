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
import { History, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function PosPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { setDiscountPercent, setDiscountAmount } = useCart();
  const { settings } = useWorkspaceSettings();

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
    }
  }, [user, authLoading, orgId, router, PRODUCTS_STORAGE_KEY, CUSTOMERS_STORAGE_KEY, TRANSACTIONS_STORAGE_KEY]);

  const handlePaymentSuccess = (trx: Transaction) => {
    const updatedTrx = [trx, ...transactions];
    setTransactions(updatedTrx);
    saveToLocalStorage(TRANSACTIONS_STORAGE_KEY, updatedTrx);

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
            return {
              ...c,
              loyaltyPoints: (c.loyaltyPoints || 0) + addedPoints,
              totalSpent: (currentSpent + trxAmount).toString(),
            };
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
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* Top Header */}
      <HeaderKasir
        onOpenHistory={() => setHistoryModalOpen(true)}
      />

      {/* Main Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Product Grid */}
        <div className="flex-1 overflow-y-auto bg-muted/20 p-4 relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Etalase Kasir</h2>
              <p className="text-xs text-muted-foreground">
                Toko: <span className="font-semibold text-emerald-500">{user.organizationName}</span> • Vertikal: {user.businessType}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryModalOpen(true)}
                className="gap-1 text-xs cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat ({transactions.length})</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setAddProductModalOpen(true)}
                className="gap-1 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white"
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

        {/* Right: Cart Sidebar */}
        <div className="w-96 border-l border-border bg-card flex flex-col shadow-lg">
          <CartSidebar
            customersList={customers}
            onCheckout={() => setPaymentModalOpen(true)}
            onOpenApprovalModal={handleOpenDiscountApproval}
          />
        </div>
      </div>

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
