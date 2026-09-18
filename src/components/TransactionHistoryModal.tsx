"use client";

import React, { useState } from "react";
import { History, Printer, Ban, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { Transaction } from "@/db/schema";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function TransactionHistoryModal({
  isOpen,
  onClose,
  transactions,
  onReprint,
  onRequestVoid,
}: {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onReprint: (trx: Transaction) => void;
  onRequestVoid: (trx: Transaction) => void;
}) {
  const { formatCurrency } = useWorkspaceSettings();
  const [search, setSearch] = useState("");

  const filtered = transactions.filter((t) =>
    t.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    t.cashierName.toLowerCase().includes(search.toLowerCase()) ||
    (t.customerName && t.customerName.toLowerCase().includes(search.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <span>Riwayat Transaksi Terakhir</span>
          </DialogTitle>
          <DialogDescription>
            Lihat riwayat nota, cetak ulang struk, atau ajukan void pembatalan transaksi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Cari nomor nota, kasir, atau pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs"
          />

          <div className="max-h-80 overflow-y-auto space-y-2">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                Belum ada data transaksi yang sesuai.
              </div>
            ) : (
              filtered.map((trx) => (
                <div
                  key={trx.id}
                  className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 text-xs ${
                    trx.status === "VOIDED"
                      ? "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/50 opacity-70"
                      : "border-border bg-card hover:bg-muted/30"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{trx.invoiceNumber}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        trx.status === "COMPLETED"
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      }`}>
                        {trx.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(trx.createdAt).toLocaleString("id-ID")} • Kasir: {trx.cashierName} • {trx.customerName || "Umum"}
                    </p>
                    <p className="text-[11px] font-semibold text-primary">
                      {formatCurrency(parseFloat(trx.grandTotal))} ({trx.paymentMethod})
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReprint(trx)}
                      className="h-8 text-xs"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" /> Cetak
                    </Button>
                    {trx.status !== "VOIDED" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onRequestVoid(trx)}
                        className="h-8 text-xs"
                      >
                        <Ban className="w-3.5 h-3.5 mr-1" /> Void
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
