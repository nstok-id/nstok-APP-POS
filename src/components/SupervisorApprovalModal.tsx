"use client";

import React, { useState } from "react";
import { ShieldAlert, CheckCircle, XCircle, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function SupervisorApprovalModal({
  isOpen,
  onClose,
  onApproved,
  actionTitle = "Otorisasi Supervisor Diperlukan",
  actionDescription = "Tindakan ini memerlukan verifikasi PIN / Kata Sandi dari Supervisor atau Owner.",
}: {
  isOpen: boolean;
  onClose: () => void;
  onApproved: () => void;
  actionTitle?: string;
  actionDescription?: string;
}) {
  const { verifySupervisor } = useAuth();
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (verifySupervisor(pin)) {
      setPin("");
      onApproved();
      onClose();
    } else {
      setErrorMsg("PIN atau Kata Sandi Supervisor salah (Coba '1234' atau 'supervisor').");
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center mb-2 mx-auto">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <DialogTitle className="text-center text-sm font-bold">{actionTitle}</DialogTitle>
          <DialogDescription className="text-center text-xs">
            {actionDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground">PIN / Sandi Supervisor</label>
            <div className="relative mt-1">
              <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="password"
                placeholder="Masukkan PIN (Default: 1234)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="pl-9 text-center font-mono tracking-widest text-base"
                autoFocus
              />
            </div>
            {errorMsg && (
              <p className="text-[11px] font-semibold text-red-500 mt-1.5 text-center">{errorMsg}</p>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-xs">
              Batal
            </Button>
            <Button type="submit" className="flex-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white">
              Verifikasi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
