"use client";

import React, { useState } from "react";
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
  Store
} from "lucide-react";
import { useBusinessMode, BusinessArchetype, ARCHETYPES } from "@/context/BusinessModeContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BusinessSelectPage() {
  const router = useRouter();
  const { mode, setMode } = useBusinessMode();
  const { settings, updateSettings } = useWorkspaceSettings();

  const [customBusinessName, setCustomBusinessName] = useState(settings.businessName || "Kopi & Usaha Saya");

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

  const handleSelectAndProceed = (type: BusinessArchetype) => {
    setMode(type);
    if (customBusinessName) {
      updateSettings({ businessName: customBusinessName });
    }
    router.push("/pos");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Pilih Jenis Usaha & Konfigurasi Toko Anda
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Sistem nstok-app-POS akan otomatis mengaktifkan modul khusus (KDS Dapur, Denah Meja, Barcode Scanner, Work Order, atau Tiered Pricing) sesuai pilihan Anda.
          </p>
        </div>

        {/* Business Name Input Card */}
        <div className="max-w-md mx-auto p-4 rounded-2xl border border-border bg-card shadow-xs space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Store className="w-4 h-4 text-primary" />
            <span>Nama Bisnis / Toko Anda</span>
          </label>
          <Input
            placeholder="Contoh: Kopi Kenangan, Minimarket Berkah, dll"
            value={customBusinessName}
            onChange={(e) => setCustomBusinessName(e.target.value)}
            className="text-xs font-medium"
          />
        </div>

        {/* Archetype Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(ARCHETYPES) as BusinessArchetype[]).map((type) => {
            const info = ARCHETYPES[type];
            const isSelected = mode === type;

            return (
              <div
                key={type}
                onClick={() => setMode(type)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      {getArchetypeIcon(type)}
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-foreground">{info.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Arketipe Vertikal {info.badge}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {info.features.map((feat) => (
                      <span key={feat} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => handleSelectAndProceed(type)}
                  className="w-full text-xs font-bold cursor-pointer"
                >
                  Pilih & Masuk ke Kasir
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
