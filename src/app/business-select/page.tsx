"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Scissors, 
  Wrench, 
  Boxes, 
  Globe, 
  ArrowRight,
  CheckCircle2,
  Store,
  Sparkles,
  Loader2
} from "lucide-react";
import { useBusinessMode, BusinessArchetype, ARCHETYPES } from "@/context/BusinessModeContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { useAuth } from "@/context/AuthContext";

export default function BusinessSelectPage() {
  const router = useRouter();
  const { user, updateUserWorkspace, isLoading: authLoading } = useAuth();
  const { mode, setMode } = useBusinessMode();
  const { updateSettings } = useWorkspaceSettings();

  const [selectedType, setSelectedType] = useState<BusinessArchetype>("FNB");
  const [customBusinessName, setCustomBusinessName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    // 1 Akun = 1 Jenis Bisnis: jika sudah pernah onboarding, kunci dan langsung arahkan ke POS
    if (user?.hasCompletedOnboarding && user?.businessType) {
      router.push("/pos");
      return;
    }

    if (user?.organizationName) {
      setCustomBusinessName(user.organizationName);
    } else {
      setCustomBusinessName("Usaha Baru Saya");
    }
    if (user?.businessType && ARCHETYPES[user.businessType as BusinessArchetype]) {
      setSelectedType(user.businessType as BusinessArchetype);
    }
  }, [user, authLoading, router]);

  const getArchetypeIcon = (type: BusinessArchetype) => {
    switch (type) {
      case "FNB": return <UtensilsCrossed className="w-6 h-6" />;
      case "RETAIL": return <ShoppingBag className="w-6 h-6" />;
      case "SALON": return <Scissors className="w-6 h-6" />;
      case "SERVICES": return <Wrench className="w-6 h-6" />;
      case "WHOLESALE": return <Boxes className="w-6 h-6" />;
      case "HYBRID": return <Globe className="w-6 h-6" />;
    }
  };

  const handleSelectAndProceed = async () => {
    if (!customBusinessName.trim()) {
      alert("Silakan masukkan nama bisnis / toko Anda.");
      return;
    }

    setIsSubmitting(true);
    try {
      setMode(selectedType);
      updateSettings({ businessName: customBusinessName.trim() });
      await updateUserWorkspace(customBusinessName.trim(), selectedType);

      setTimeout(() => {
        router.push("/pos");
      }, 400);
    } catch (e) {
      console.error("Error setting business type:", e);
      router.push("/pos");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
          <p className="text-xs">Memuat konfigurasi workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto p-4 sm:p-8 py-8 sm:py-12 bg-zinc-950 text-zinc-100 font-sans flex flex-col justify-start items-center">
      <div className="w-full max-w-4xl space-y-6 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Onboarding Toko Baru: {user.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Pilih Jenis Usaha & Konfigurasi Toko Anda
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
            Sistem nstok-APP-pos akan otomatis menyiapkan template produk dan mengaktifkan modul khusus (KDS Dapur, Denah Meja, Barcode Scanner, Work Order, atau Tiered Pricing) untuk workspace toko Anda.
          </p>
        </div>

        {/* Business Name Input Card */}
        <div className="max-w-md mx-auto p-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 shadow-xl space-y-2 backdrop-blur-sm">
          <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Nama Bisnis / Toko Anda</span>
          </label>
          <input
            placeholder="Contoh: Kopi Kenangan, Minimarket Berkah, dll"
            value={customBusinessName}
            onChange={(e) => setCustomBusinessName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        {/* Archetype Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(ARCHETYPES) as BusinessArchetype[]).map((type) => {
            const info = ARCHETYPES[type];
            const isSelected = selectedType === type;

            return (
              <div
                key={type}
                onClick={() => setSelectedType(type)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/80"
                    : "border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800/50"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isSelected ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                    }`}>
                      {getArchetypeIcon(type)}
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  </div>

                  <div>
                    <h3 className="font-black text-base text-white">{info.name}</h3>
                    <span className="text-[11px] font-bold text-emerald-400">Vertikal {info.badge}</span>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-zinc-800/80">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                      Modul Otomatis:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {info.features.map((feat) => (
                        <span key={feat} className="text-[10px] bg-zinc-950 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md">
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleSelectAndProceed}
            disabled={isSubmitting}
            className="w-full sm:w-auto min-w-[280px] py-3.5 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Mulai Menggunakan POS Toko</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
