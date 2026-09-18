"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UsersRound, CheckCircle2, AlertCircle, ArrowRight, Store, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "INV-SAMPLE-TOKEN-99218";
  const { register, login } = useAuth();

  const [staffName, setStaffName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // Mock Org info from invitation token
  const inviteOrgName = "OmniPOS Kopi & Bakery";
  const assignedRole = "KASIR";

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const email = `${staffName.toLowerCase().replace(/\s+/g, "")}@omnipos.id`;
    await register(staffName, email, password, "KASIR");
    setIsJoined(true);

    setTimeout(() => {
      router.push("/pos");
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mx-auto">
            <UsersRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Undangan Bergabung Tim</h1>
          <p className="text-xs text-muted-foreground">
            Anda diundang untuk bergabung ke workspace toko:
          </p>
          <div className="p-3 rounded-xl bg-muted/60 border border-border inline-block">
            <p className="font-bold text-sm text-foreground flex items-center justify-center gap-1.5">
              <Store className="w-4 h-4 text-primary" />
              <span>{inviteOrgName}</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Peran yang Ditugaskan: <span className="font-semibold text-primary">{assignedRole}</span></p>
          </div>
        </div>

        {isJoined ? (
          <div className="p-6 text-center space-y-2 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto animate-bounce" />
            <p className="font-bold text-sm text-green-800 dark:text-green-300">Berhasil Bergabung!</p>
            <p className="text-xs text-green-700 dark:text-green-400">Mengarahkan ke layar kasir POS...</p>
          </div>
        ) : (
          <form onSubmit={handleAccept} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground">Nama Lengkap Staf</label>
              <Input
                placeholder="Contoh: Rian Kasir"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Buat Kata Sandi Akun</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>Akun Anda akan langsung terhubung ke toko pengundang tanpa membuat workspace ganda.</span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full font-bold text-xs h-10 shadow-md bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1.5"
            >
              <span>{isSubmitting ? "Menghubungkan..." : "Konfirmasi & Bergabung ke Toko"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs">Memuat undangan...</div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
