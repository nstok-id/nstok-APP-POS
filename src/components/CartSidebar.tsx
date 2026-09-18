"use client";

import React, { useState } from "react";
import { 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  Bookmark, 
  CreditCard, 
  Percent, 
  Tag, 
  Utensils, 
  FileText,
  AlertCircle
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { useBusinessMode } from "@/context/BusinessModeContext";
import { Customer } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function CartSidebar({
  onCheckout,
  onOpenApprovalModal,
  customersList = [],
  className = ""
}: {
  onCheckout: () => void;
  onOpenApprovalModal: (discountVal: number) => void;
  customersList?: Customer[];
  className?: string;
}) {
  const { 
    items, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    subtotal,
    taxAmount,
    grandTotal,
    discountPercent,
    discountAmount,
    setDiscountPercent,
    setDiscountAmount,
    selectedCustomer,
    setSelectedCustomer,
    tableNumber,
    setTableNumber,
    orderNotes,
    setOrderNotes,
    holdBills,
    holdCurrentBill,
    restoreHoldBill,
    deleteHoldBill
  } = useCart();

  const { formatCurrency, settings } = useWorkspaceSettings();
  const { mode } = useBusinessMode();

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [inputDiscount, setInputDiscount] = useState("");

  const handleApplyDiscount = () => {
    const val = parseFloat(inputDiscount) || 0;
    if (val > settings.approvalDiscountThresholdPercent) {
      // Trigger supervisor approval modal
      setDiscountModalOpen(false);
      onOpenApprovalModal(val);
    } else {
      setDiscountPercent(val);
      setDiscountAmount(0);
      setDiscountModalOpen(false);
    }
  };

  return (
    <aside className={`w-full flex flex-col h-full bg-card ${className}`}>
      {/* Header with Table / Customer / Hold count */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-foreground">Pesanan Kasir</h2>
          <div className="flex items-center gap-1.5">
            {holdBills.length > 0 && (
              <button
                onClick={() => setHoldModalOpen(true)}
                className="px-2 py-1 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-semibold flex items-center gap-1 hover:bg-amber-200 transition-colors"
                title="Buka Nota Gantung"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{holdBills.length} Nota Gantung</span>
              </button>
            )}
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive text-xs transition-colors"
                title="Kosongkan Keranjang"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Customer & Table Selectors */}
        <div className="grid grid-cols-2 gap-2">
          {/* Customer button */}
          <button
            onClick={() => setCustomerModalOpen(true)}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/60 hover:bg-muted text-xs text-left truncate transition-colors border border-border"
          >
            <User className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate font-medium text-foreground">
              {selectedCustomer ? selectedCustomer.name : "Pilih Member"}
            </span>
          </button>

          {/* Table / Order Reference Input */}
          {mode === "FNB" ? (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/60 text-xs border border-border">
              <Utensils className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                placeholder="No. Meja"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full bg-transparent text-xs focus:outline-none text-foreground font-medium"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/60 text-xs border border-border">
              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                placeholder="Catatan Nota"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full bg-transparent text-xs focus:outline-none text-foreground"
              />
            </div>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Tag className="w-8 h-8 mb-2 opacity-40" />
            <p className="font-semibold text-xs">Keranjang masih kosong</p>
            <p className="text-[11px]">Pilih produk dari etalase kasir di sebelah kiri.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="p-2.5 rounded-xl border border-border bg-background flex items-center justify-between gap-2 shadow-2xs"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-foreground truncate">{item.product.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatCurrency(item.appliedPrice)} × {item.quantity}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-bold text-foreground">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Payment Bar */}
      <div className="p-3 border-t border-border bg-card/80 backdrop-blur-xs space-y-2.5">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {/* Discount line */}
          <div className="flex justify-between items-center text-muted-foreground">
            <button
              onClick={() => setDiscountModalOpen(true)}
              className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Percent className="w-3 h-3" />
              <span>Diskon {discountPercent > 0 ? `(${discountPercent}%)` : ""}</span>
            </button>
            <span className={discountPercent > 0 ? "text-red-500 font-semibold" : ""}>
              {discountPercent > 0 ? `-${formatCurrency(Math.round(subtotal * (discountPercent / 100)))}` : "Rp 0"}
            </span>
          </div>

          {/* Tax line */}
          {settings.taxEnabled && (
            <div className="flex justify-between text-muted-foreground">
              <span>PPN ({settings.taxPercentage}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-border flex justify-between items-center">
            <span className="font-bold text-sm text-foreground">Total Tagihan</span>
            <span className="font-extrabold text-base text-primary">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={() => holdCurrentBill()}
            disabled={items.length === 0}
            className="col-span-1 text-xs h-10"
          >
            <Bookmark className="w-3.5 h-3.5 mr-1" />
            <span>Tahan</span>
          </Button>

          <Button
            onClick={onCheckout}
            disabled={items.length === 0}
            className="col-span-2 text-xs font-bold h-10 shadow-md bg-green-600 hover:bg-green-700 text-white"
          >
            <CreditCard className="w-4 h-4 mr-1.5" />
            <span>Bayar (F4)</span>
          </Button>
        </div>
      </div>

      {/* Customer Selection Modal */}
      <Dialog open={customerModalOpen} onOpenChange={setCustomerModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Pelanggan / Member CRM</DialogTitle>
            <DialogDescription>Pilih member untuk mengakumulasi poin loyalitas otomatis.</DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2">
            <button
              onClick={() => {
                setSelectedCustomer(null);
                setCustomerModalOpen(false);
              }}
              className="w-full p-2.5 rounded-lg text-left border border-border hover:bg-muted text-xs font-medium"
            >
              Tanpa Pelanggan (Umum / Guest)
            </button>
            {customersList.map((cust) => (
              <button
                key={cust.id}
                onClick={() => {
                  setSelectedCustomer(cust);
                  setCustomerModalOpen(false);
                }}
                className={`w-full p-2.5 rounded-lg text-left border transition-colors flex items-center justify-between text-xs ${
                  selectedCustomer?.id === cust.id
                    ? "border-primary bg-primary/10 font-bold"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div>
                  <p className="font-semibold text-foreground">{cust.name}</p>
                  <p className="text-[11px] text-muted-foreground">{cust.phone} • {cust.tier}</p>
                </div>
                <span className="text-[11px] font-bold text-primary">{cust.loyaltyPoints} Poin</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hold Bills Modal */}
      <Dialog open={holdModalOpen} onOpenChange={setHoldModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Daftar Nota Gantung</DialogTitle>
            <DialogDescription>Pilih nota yang ingin dipanggil kembali ke kasir.</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {holdBills.map((bill) => (
              <div
                key={bill.id}
                className="p-3 rounded-lg border border-border bg-muted/40 flex items-center justify-between gap-2"
              >
                <div className="text-xs">
                  <p className="font-bold text-foreground">
                    {bill.tableNumber ? `Meja ${bill.tableNumber}` : bill.customerName || "Nota Tanpa Nama"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {bill.items.length} item • Disimpan {bill.savedAt}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => {
                      restoreHoldBill(bill.id);
                      setHoldModalOpen(false);
                    }}
                  >
                    Buka
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteHoldBill(bill.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Modal */}
      <Dialog open={discountModalOpen} onOpenChange={setDiscountModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Atur Diskon Nota</DialogTitle>
            <DialogDescription>
              Diskon di atas {settings.approvalDiscountThresholdPercent}% memerlukan persetujuan Supervisor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Persentase Diskon (%)</label>
              <Input
                type="number"
                placeholder="Contoh: 10"
                value={inputDiscount}
                onChange={(e) => setInputDiscount(e.target.value)}
                className="mt-1"
                min={0}
                max={100}
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20, 25, 30, 50].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setInputDiscount(pct.toString())}
                  className="py-1.5 rounded-lg border border-border text-xs font-bold hover:bg-muted"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDiscountModalOpen(false)}>Batal</Button>
            <Button onClick={handleApplyDiscount}>Terapkan Diskon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
