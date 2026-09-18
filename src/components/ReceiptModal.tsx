"use client";

import React from "react";
import { Printer, MessageSquare, Check, X, Store } from "lucide-react";
import { Transaction } from "@/db/schema";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { CartItem } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function ReceiptModal({
  transaction,
  isOpen,
  onClose,
}: {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { settings, formatCurrency } = useWorkspaceSettings();

  if (!isOpen || !transaction) return null;

  const items: CartItem[] = JSON.parse(transaction.itemsJson || "[]");

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `*STRUK PEMBAYARAN ${settings.businessName.toUpperCase()}*%0A` +
      `No. Nota: ${transaction.invoiceNumber}%0A` +
      `Kasir: ${transaction.cashierName}%0A` +
      `Tanggal: ${new Date(transaction.createdAt).toLocaleString("id-ID")}%0A%0A` +
      `*Item Pembelian:*%0A` +
      items.map((i) => `- ${i.product.name} x${i.quantity} = ${formatCurrency(i.appliedPrice * i.quantity)}`).join("%0A") +
      `%0A%0A*Total Belanja:* ${formatCurrency(parseFloat(transaction.grandTotal))}%0A` +
      `Metode Bayar: ${transaction.paymentMethod}%0A%0A` +
      `${settings.receiptFooter || "Terima kasih atas kunjungan Anda!"}`;

    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 bg-muted/40 border-b border-border m-0">
          <DialogTitle className="flex items-center justify-between text-sm">
            <span>Struk Pembayaran Sukses</span>
            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 font-bold">
              LUNAS
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Thermal Receipt Paper Style Preview */}
        <div className="p-6 bg-slate-50 dark:bg-zinc-900 font-mono text-xs text-foreground space-y-3 max-h-[60vh] overflow-y-auto border-y border-dashed border-border">
          {/* Header */}
          <div className="text-center space-y-1">
            <h3 className="font-extrabold text-sm tracking-wider">{settings.businessName}</h3>
            <p className="text-[11px] text-muted-foreground">{settings.businessAddress}</p>
            <p className="text-[10px] text-muted-foreground">Telp: {settings.phone}</p>
          </div>

          <div className="border-b border-dashed border-border py-1 text-[10px] text-muted-foreground flex justify-between">
            <span>{transaction.invoiceNumber}</span>
            <span>{new Date(transaction.createdAt).toLocaleTimeString("id-ID")}</span>
          </div>

          <div className="text-[10px] text-muted-foreground flex justify-between">
            <span>Kasir: {transaction.cashierName}</span>
            <span>Plg: {transaction.customerName || "Umum"}</span>
          </div>

          {/* Items */}
          <div className="space-y-1 py-2 border-y border-dashed border-border">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <div className="max-w-[180px] truncate">
                  <p className="font-bold text-foreground">{item.product.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.quantity} × {formatCurrency(item.appliedPrice)}</p>
                </div>
                <span className="font-semibold text-foreground">
                  {formatCurrency(item.appliedPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span>{formatCurrency(parseFloat(transaction.subtotal))}</span>
            </div>
            {parseFloat(transaction.discount) > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Diskon:</span>
                <span>-{formatCurrency(parseFloat(transaction.discount))}</span>
              </div>
            )}
            {parseFloat(transaction.tax) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>PPN:</span>
                <span>{formatCurrency(parseFloat(transaction.tax))}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-border">
              <span>TOTAL:</span>
              <span>{formatCurrency(parseFloat(transaction.grandTotal))}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Bayar ({transaction.paymentMethod}):</span>
              <span>{formatCurrency(parseFloat(transaction.paidAmount))}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Kembalian:</span>
              <span>{formatCurrency(parseFloat(transaction.changeAmount))}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-3 border-t border-dashed border-border text-[10px] text-muted-foreground whitespace-pre-line">
            {settings.receiptFooter}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-card flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 text-xs">
            Selesai
          </Button>
          <Button variant="secondary" onClick={handleShareWhatsApp} className="flex-1 text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20">
            <MessageSquare className="w-3.5 h-3.5 mr-1" />
            <span>Kirim WA</span>
          </Button>
          <Button onClick={handlePrint} className="flex-1 text-xs font-bold">
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span>Cetak Thermal</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
