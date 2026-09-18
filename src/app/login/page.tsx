"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Lock, Mail, User, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        if (!userName.trim() || !email.trim() || !password) {
          setErrorMessage("Semua kolom formulir pendaftaran wajib diisi.");
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMessage("Kata sandi minimal 6 karakter.");
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMessage("Konfirmasi kata sandi tidak cocok.");
          setIsLoading(false);
          return;
        }

        const res = await register(userName, email, password, "OWNER");
        if (res.success) {
          setSuccessMessage("Pendaftaran berhasil! Mengalihkan ke langkah pemilihan bisnis...");
          setTimeout(() => {
            router.push("/business-select");
          }, 600);
        } else {
          setErrorMessage(res.error || "Gagal mendaftarkan akun.");
        }
      } else {
        if (!email.trim() || !password) {
          setErrorMessage("Email dan kata sandi wajib diisi.");
          setIsLoading(false);
          return;
        }

        const res = await login(email, password);
        if (res.success) {
          setSuccessMessage("Login berhasil! Mengalihkan...");
          setTimeout(() => {
            if (res.needsOnboarding) {
              router.push("/business-select");
            } else {
              router.push("/pos");
            }
          }, 500);
        } else {
          setErrorMessage(res.error || "Email atau kata sandi tidak cocok.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-emerald-500/10 to-transparent border-b border-zinc-800/80 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-black text-xl mx-auto shadow-lg shadow-emerald-500/20">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            nstok-APP-pos
          </h1>
          <p className="text-xs text-zinc-400">
            Sistem Kasir Multi-Tenant & Multi-Bisnis Terpadu
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 p-1.5">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isRegister
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Masuk Sesi Akun
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isRegister
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Daftar Akun Baru (Owner)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Nama Lengkap Pemilik
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Contoh: Bpk. Hendra Gunawan"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Alamat Email {isRegister ? "Bisnis" : "Kasir / Staf"}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{isLoading ? "Memproses..." : isRegister ? "Daftar & Lanjut Pilih Bisnis" : "Masuk ke Kasir POS"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Info */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800/80 text-center">
          <p className="text-[11px] text-zinc-500">
            {isRegister
              ? "Pilihan jenis bisnis & nama toko akan diatur pada langkah berikutnya."
              : "Sistem otomatis mengarahkan ke workspace & katalog toko Anda."}
          </p>
        </div>
      </div>
    </div>
  );
}
