"use client";

import React, { useState } from "react";
import { 
  Banknote, 
  QrCode, 
  CreditCard, 
  ArrowRightLeft, 
  CheckCircle2, 
  Calculator,
  Receipt
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { useShift } from "@/context/ShiftContext";
import { useAuth } from "@/context/AuthContext";
import { Transaction } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (trx: Transaction) => void;
}) {
  const { grandTotal, subtotal, taxAmount, discountAmount, discountPercent, items, selectedCustomer, tableNumber, orderNotes, clearCart } = useCart();
  const { formatCurrency } = useWorkspaceSettings();
  const { recordSale, currentShift } = useShift();
  const { user } = useAuth();

  const [method, setMethod] = useState<"CASH" | "QRIS" | "CARD" | "TRANSFER">("CASH");
  const [paidAmount, setPaidAmount] = useState<number>(grandTotal);
  const [isProcessing, setIsProcessing] = useState(false);

  // Quick Cash Buttons
  const quickCashOptions = [
    grandTotal,
    Math.ceil(grandTotal / 10000) * 10000,
    Math.ceil(grandTotal / 20000) * 20000,
    Math.ceil(grandTotal / 50000) * 50000,
    Math.ceil(grandTotal / 100000) * 100000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= grandTotal);

  const changeAmount = Math.max(0, paidAmount - grandTotal);
  const isSufficient = method !== "CASH" || paidAmount >= grandTotal;

  const handleProcessPayment = async () => {
    if (!isSufficient) return;
    setIsProcessing(true);

    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
    const effectivePaid = method === "CASH" ? paidAmount : grandTotal;
    const effectiveChange = method === "CASH" ? changeAmount : 0;

    const newTransaction: Transaction = {
      id: `trx-${Date.now()}`,
      organizationId: user?.organizationId || "org-demo-1",
      shiftId: currentShift?.id || null,
      invoiceNumber: invoiceNum,
      cashierId: user?.id || "user-1",
      cashierName: user?.name || "Kasir",
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || "Pelanggan Umum",
      subtotal: subtotal.toString(),
      discount: (discountAmount > 0 ? discountAmount : Math.round(subtotal * (discountPercent / 100))).toString(),
      tax: taxAmount.toString(),
      grandTotal: grandTotal.toString(),
      paymentMethod: method,
      paidAmount: effectivePaid.toString(),
      changeAmount: effectiveChange.toString(),
      status: "COMPLETED",
      itemsJson: JSON.stringify(items),
      tableNumber: tableNumber || null,
      orderNotes: orderNotes || null,
      voidReason: null,
      voidApprovedBy: null,
      createdAt: new Date(),
    };

    // Update active shift sales
    recordSale(grandTotal, method === "CASH");

    // Simulate payment gateway delay
    await new Promise((r) => setTimeout(r, 600));

    setIsProcessing(false);
    clearCart();
    onClose();
    onPaymentSuccess(newTransaction);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-base">
            <span>Pembayaran Transaksi</span>
            <span className="text-xl font-extrabold text-primary">{formatCurrency(grandTotal)}</span>
          </DialogTitle>
          <DialogDescription>
            Pilih metode pembayaran dan masukkan jumlah uang yang diterima.
          </DialogDescription>
        </DialogHeader>

        {/* Payment Method Selector */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { id: "CASH", label: "Tunai", icon: Banknote },
            { id: "QRIS", label: "QRIS", icon: QrCode },
            { id: "CARD", label: "Debit/Kredit", icon: CreditCard },
            { id: "TRANSFER", label: "Transfer", icon: ArrowRightLeft },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = method === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setMethod(item.id as any);
                  if (item.id !== "CASH") setPaidAmount(grandTotal);
                }}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-xs"
                    : "border-border bg-muted/40 hover:bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Payment Body */}
        {method === "CASH" ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground">Uang Diterima (Rp)</label>
              <Input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="text-lg font-bold h-12 text-primary"
                min={grandTotal}
              />
            </div>

            {/* Quick Cash Buttons */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1.5">Pilihan Uang Pas / Pecahan Cepat:</p>
              <div className="flex flex-wrap gap-2">
                {quickCashOptions.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setPaidAmount(amount)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold"
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
            </div>

            {/* Change Calculation Box */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/40 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Kembalian:</span>
              <span className={`text-lg font-extrabold ${changeAmount > 0 ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                {formatCurrency(changeAmount)}
              </span>
            </div>
          </div>
        ) : method === "QRIS" ? (
          <div className="p-6 rounded-xl border border-border bg-muted/30 flex flex-col items-center text-center space-y-3">
            <div className="w-40 h-40 bg-white p-2 rounded-xl shadow-md border border-border flex items-center justify-center">
              <QrCode className="w-36 h-36 text-slate-800" />
            </div>
            <p className="font-bold text-xs text-foreground">QRIS Dinamis Otomatis</p>
            <p className="text-[11px] text-muted-foreground">Scan menggunakan GoPay, OVO, Dana, BCA, atau Mobile Banking apa saja.</p>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
            <p className="text-xs font-semibold text-foreground">Silakan gesek kartu atau proses transfer bank senilai {formatCurrency(grandTotal)}.</p>
            <Input placeholder="Nomor Referensi Transaksi (Opsional)" className="text-xs" />
          </div>
        )}

        <DialogFooter className="mt-6 flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing} className="flex-1">
            Batal
          </Button>
          <Button
            onClick={handleProcessPayment}
            disabled={!isSufficient || isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
          >
            {isProcessing ? "Memproses Transaksi..." : "Selesaikan Bayar (Enter)"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
