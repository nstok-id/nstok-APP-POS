"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Lock, Mail, User, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth, Role } from "@/context/AuthContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { updateSettings } = useWorkspaceSettings();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("owner@omnipos.id");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState<Role>("OWNER");
  const [userName, setUserName] = useState("Bambang Pemilik");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isRegister) {
      // Auto-provisioning workspace for new owner without requiring businessName upfront
      const initialBizName = userName ? `Toko ${userName}` : "Toko Baru Saya";
      updateSettings({ businessName: initialBizName });
      await login(email, "OWNER", initialBizName);
      router.push("/business-select");
    } else {
      await login(email, role);
      router.push("/pos");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-b from-primary/10 to-transparent border-b border-border/50 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mx-auto shadow-md shadow-primary/20">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            nstok-app-POS
          </h1>
          <p className="text-xs text-muted-foreground">
            OmniPOS Multi-Tenant Workspace & Real-Time Sync
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isRegister ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Masuk Sesi Staf / Kasir
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isRegister ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Daftar Akun Baru (Owner)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isRegister ? (
            <div>
              <label className="text-xs font-semibold text-foreground">Nama Pemilik / Akun</label>
              <div className="relative mt-1">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Nama Lengkap Anda"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  className="pl-9 text-xs"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-foreground">Peran Pengguna (Role)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs font-medium focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="OWNER">👑 Owner (Pemilik Workspace - Akses Penuh)</option>
                <option value="MANAGER">👔 Outlet Manager</option>
                <option value="SUPERVISOR">🛡️ Supervisor</option>
                <option value="KASIR">💳 Kasir Operasional (POS Only)</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-foreground">Alamat Email</label>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Kata Sandi</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full font-bold text-xs h-10 mt-2 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{isRegister ? "Daftar & Pilih Jenis Usaha" : "Masuk ke Sistem POS"}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          {isRegister && (
            <p className="text-[11px] text-muted-foreground text-center">
              Setelah mendaftar, Anda akan langsung memilih jenis usaha dan nama toko di halaman selanjutnya.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
