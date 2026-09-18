"use client";

import React, { useState, useEffect } from "react";
import { HeaderKasir } from "@/components/HeaderKasir";
import { ProductGrid } from "@/components/ProductGrid";
import { CartSidebar } from "@/components/CartSidebar";
import { PaymentModal } from "@/components/PaymentModal";
import { ReceiptModal } from "@/components/ReceiptModal";
import { SupervisorApprovalModal } from "@/components/SupervisorApprovalModal";
import { TransactionHistoryModal } from "@/components/TransactionHistoryModal";
import { Product, Transaction, Customer } from "@/db/schema";
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS } from "@/db/index";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";
import { useCart } from "@/context/CartContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const PRODUCTS_STORAGE_KEY = "nstok_products_v3";
const TRANSACTIONS_STORAGE_KEY = "nstok_transactions_v3";
const CUSTOMERS_STORAGE_KEY = "nstok_customers_v3";

export default function PosPage() {
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

  useEffect(() => {
    const loadedProducts = loadFromLocalStorage<Product[]>(PRODUCTS_STORAGE_KEY, INITIAL_PRODUCTS);
    const loadedCustomers = loadFromLocalStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, INITIAL_CUSTOMERS);
    const loadedTrx = loadFromLocalStorage<Transaction[]>(TRANSACTIONS_STORAGE_KEY, []);
    setProducts(loadedProducts);
    setCustomers(loadedCustomers);
    setTransactions(loadedTrx);
  }, []);

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
      organizationId: "org-demo-1",
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
    setAddProductModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      <HeaderKasir />

      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* Main Product Catalog Section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Quick Floating Top Bar for POS specific actions */}
          <div className="px-4 pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setHistoryModalOpen(true)}
                className="text-xs h-8"
              >
                <History className="w-3.5 h-3.5 mr-1" />
                <span>Riwayat Transaksi</span>
              </Button>
            </div>
          </div>

          <ProductGrid
            products={products}
            onAddNewProduct={() => setAddProductModalOpen(true)}
          />
        </div>

        {/* Right Cart Sidebar */}
        <CartSidebar
          onCheckout={() => setPaymentModalOpen(true)}
          onOpenApprovalModal={handleOpenDiscountApproval}
          customersList={customers}
        />
      </div>

      {/* Payment Dialog */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Receipt Dialog */}
      <ReceiptModal
        transaction={activeTransaction}
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
      />

      {/* Supervisor Approval Dialog */}
      <SupervisorApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => {
          setApprovalModalOpen(false);
          setPendingDiscountValue(null);
          setPendingVoidTrx(null);
        }}
        onApproved={handleApproved}
        actionTitle={
          pendingDiscountValue !== null
            ? `Otorisasi Diskon Besar (${pendingDiscountValue}%)`
            : "Otorisasi Pembatalan (Void) Nota"
        }
        actionDescription={
          pendingDiscountValue !== null
            ? `Diskon sebesar ${pendingDiscountValue}% melebihi batas standar (${settings.approvalDiscountThresholdPercent}%). Diperlukan otorisasi Supervisor.`
            : "Pembatalan nota akan memulihkan sisa stok barang dan mengurangi omzet. Diperlukan persetujuan Supervisor."
        }
      />

      {/* Transaction History Dialog */}
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

      {/* Add Product Modal */}
      <Dialog open={addProductModalOpen} onOpenChange={setAddProductModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Menu / Barang Cepat</DialogTitle>
            <DialogDescription>Tambahkan barang baru langsung ke etalase kasir.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProduct} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Nama Barang</label>
              <Input
                placeholder="Contoh: Green Tea Latte"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-foreground">Kategori</label>
                <Input
                  placeholder="Minuman / Makanan"
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Harga Jual (Rp)</label>
                <Input
                  type="number"
                  placeholder="20000"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-foreground">SKU / Kode (Opsional)</label>
                <Input
                  placeholder="BEV-009"
                  value={newProdSku}
                  onChange={(e) => setNewProdSku(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Stok Awal</label>
                <Input
                  type="number"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setAddProductModalOpen(false)}>Batal</Button>
              <Button type="submit" className="font-bold">Simpan ke Katalog</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
