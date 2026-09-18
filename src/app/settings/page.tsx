"use client";

import React, { useState } from "react";
import { 
  Settings, 
  Building2, 
  Store, 
  Receipt, 
  Coins, 
  UsersRound, 
  ShieldCheck, 
  Bell, 
  Puzzle, 
  RefreshCw,
  Check,
  Save,
  ShieldAlert,
  Download
} from "lucide-react";
import { HeaderKasir } from "@/components/HeaderKasir";
import { useWorkspaceSettings, WorkspaceSettingsData } from "@/context/WorkspaceSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, Badge } from "@/components/ui/atoms";
import { Checkbox } from "@/components/ui/dialog";

type SettingsTab = 
  | "profile" 
  | "outlet" 
  | "tax" 
  | "receipt" 
  | "staff" 
  | "approval" 
  | "notif" 
  | "modules" 
  | "sync";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings, syncStatus, triggerForceSync } = useWorkspaceSettings();
  const { user, canAccess } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [formData, setFormData] = useState<WorkspaceSettingsData>(settings);
  const [saveToast, setSaveToast] = useState(false);

  // RBAC Route Guard
  if (!canAccess(["OWNER", "MANAGER"])) {
    return (
      <div className="flex-1 flex flex-col h-screen">
        <HeaderKasir />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">403 - Akses Terbatas</h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            Halaman Pengaturan Toko hanya dapat diakses oleh Owner dan Manager. Sesi kasir operasional dialihkan ke menu kasir.
          </p>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleExportCSV = () => {
    const transactions = localStorage.getItem("nstok_transactions_v3") || "[]";
    const blob = new Blob([transactions], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-nstok-pos-${Date.now()}.json`;
    a.click();
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "profile", label: "1. Profil Bisnis", icon: Building2 },
    { id: "outlet", label: "2. Outlet & Cabang", icon: Store },
    { id: "tax", label: "3. Pajak & Mata Uang", icon: Coins },
    { id: "receipt", label: "4. Struk & Cetak", icon: Receipt },
    { id: "staff", label: "5. Staff & Role", icon: UsersRound },
    { id: "approval", label: "6. Approval & Keamanan", icon: ShieldCheck },
    { id: "notif", label: "7. Notifikasi", icon: Bell },
    { id: "modules", label: "8. Modul Bisnis Aktif", icon: Puzzle },
    { id: "sync", label: "9. Data & Sinkronisasi", icon: RefreshCw },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <HeaderKasir />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Pusat Kendali Pengaturan Workspace (`/settings`)</h1>
            <p className="text-xs text-muted-foreground">Konfigurasi preferensi bisnis, pajak, struk thermal, dan keamanan operasional.</p>
          </div>
          {saveToast && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 text-xs font-bold animate-in fade-in">
              <Check className="w-4 h-4 text-green-600" />
              <span>Pengaturan Berhasil Disimpan & Sinkron!</span>
            </div>
          )}
        </div>

        {/* Settings Grid Layout: Tabs on Left, Content on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Navigation Tabs */}
          <Card className="p-2 space-y-1 lg:col-span-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </Card>

          {/* Right Tab Content Form */}
          <Card className="p-6 lg:col-span-3">
            <form onSubmit={handleSave} className="space-y-6">
              {/* TAB 1: PROFIL BISNIS */}
              {activeTab === "profile" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">🏢 Profil Bisnis & Toko</h3>
                  <div>
                    <label className="text-xs font-semibold">Nama Bisnis / Toko</label>
                    <Input
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      required
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Alamat Lengkap</label>
                    <Input
                      value={formData.businessAddress}
                      onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold">No. WhatsApp / Telepon</label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold">Email Resmi</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold">NPWP Usaha (Opsional)</label>
                    <Input
                      value={formData.npwp}
                      onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                      placeholder="00.000.000.0-000.000"
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: OUTLET & CABANG */}
              {activeTab === "outlet" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">🏬 Outlet & Cabang Toko</h3>
                  <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2 text-xs">
                    <p className="font-bold text-foreground">Cabang Utama (Default)</p>
                    <p className="text-muted-foreground">Gudang & Toko Pusat: {formData.businessAddress}</p>
                    <p className="text-[11px] text-primary font-semibold">Jam Operasional: 08:00 - 22:00 WIB</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Multi-cabang dapat dihubungkan ke akun master ini.</p>
                </div>
              )}

              {/* TAB 3: PAJAK & MATA UANG */}
              {activeTab === "tax" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">💰 Pajak PPN & Aturan Pembulatan</h3>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="tax-enabled"
                      checked={formData.taxEnabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, taxEnabled: checked })}
                    />
                    <label htmlFor="tax-enabled" className="text-xs font-semibold cursor-pointer">
                      Aktifkan Pajak Pertambahan Nilai (PPN) pada Checkout Kasir
                    </label>
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Tarif Pajak (%)</label>
                    <Input
                      type="number"
                      value={formData.taxPercentage}
                      onChange={(e) => setFormData({ ...formData, taxPercentage: parseFloat(e.target.value) || 0 })}
                      min={0}
                      max={100}
                      disabled={!formData.taxEnabled}
                      className="mt-1 text-xs max-w-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Aturan Pembulatan Kembalian</label>
                    <select
                      value={formData.roundingRule}
                      onChange={(e) => setFormData({ ...formData, roundingRule: e.target.value as any })}
                      className="mt-1 w-full max-w-xs h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs"
                    >
                      <option value="NONE">Tanpa Pembulatan (Sesuai Nominal Asli)</option>
                      <option value="UP_100">Bulatkan ke Atas ke Ratusan Terdekat</option>
                      <option value="NEAREST_100">Bulatkan ke Ratusan Terdekat (Normal)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 4: STRUK & CETAK */}
              {activeTab === "receipt" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">🖨️ Format Struk Kasir & Printer Thermal</h3>
                  <div>
                    <label className="text-xs font-semibold">Ukuran Kertas Printer Thermal</label>
                    <select
                      value={formData.receiptPaperSize}
                      onChange={(e) => setFormData({ ...formData, receiptPaperSize: e.target.value as any })}
                      className="mt-1 w-full max-w-xs h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs"
                    >
                      <option value="58mm">58mm (Printer Kasir Portabel / Bluetooth)</option>
                      <option value="80mm">80mm (Printer Thermal Lebar Standar Resto/Retail)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Header Struk (Pesan Atas)</label>
                    <Input
                      value={formData.receiptHeader}
                      onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Footer Struk (Pesan Bawah / Sosmed)</label>
                    <textarea
                      value={formData.receiptFooter}
                      onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-input bg-background p-2 text-xs focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: STAFF & ROLE */}
              {activeTab === "staff" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">👥 Pengaturan Hak Akses Staf</h3>
                  <p className="text-xs text-muted-foreground">
                    Gunakan menu <a href="/team" className="text-primary underline font-bold">Manajemen Tim (`/team`)</a> untuk mengundang atau memberhentikan pegawai secara lengkap.
                  </p>
                </div>
              )}

              {/* TAB 6: APPROVAL & KEAMANAN */}
              {activeTab === "approval" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">🛡️ Batas Otorisasi Supervisor & Keamanan</h3>
                  <div>
                    <label className="text-xs font-semibold">Batas Diskon Kasir Tanpa Approval Supervisor (%)</label>
                    <Input
                      type="number"
                      value={formData.approvalDiscountThresholdPercent}
                      onChange={(e) => setFormData({ ...formData, approvalDiscountThresholdPercent: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={100}
                      className="mt-1 text-xs max-w-xs"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Diskon di atas persentase ini akan memicu modal PIN supervisor.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="req-void"
                      checked={formData.approvalRequireVoid}
                      onCheckedChange={(checked) => setFormData({ ...formData, approvalRequireVoid: checked })}
                    />
                    <label htmlFor="req-void" className="text-xs font-semibold cursor-pointer">
                      Wajibkan Otorisasi Supervisor saat Pembatalan (Void) Nota Transaksi
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 7: NOTIFIKASI */}
              {activeTab === "notif" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">🔔 Peringatan & Notifikasi</h3>
                  <div>
                    <label className="text-xs font-semibold">Batas Default Stok Menipis (*Low Stock Threshold*)</label>
                    <Input
                      type="number"
                      value={formData.lowStockThresholdDefault}
                      onChange={(e) => setFormData({ ...formData, lowStockThresholdDefault: parseInt(e.target.value) || 5 })}
                      min={1}
                      className="mt-1 text-xs max-w-xs"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Nilai default batas minimum saat menambah produk baru.</p>
                  </div>
                </div>
              )}

              {/* TAB 8: MODUL BISNIS AKTIF */}
              {activeTab === "modules" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">🧩 Toggle Modul Vertikal Tambahan</h3>
                  <div className="space-y-3">
                    {[
                      { id: "fnb_kds", label: "Kitchen Display System (KDS Dapur Resto)" },
                      { id: "tables", label: "Denah Meja & Split Bill Interaktif" },
                      { id: "booking", label: "Kalender Booking Salon & Terapis" },
                      { id: "work_order", label: "Work Order (SPK) Reparasi Bengkel" },
                      { id: "wholesale", label: "Tiered Pricing Grosir & B2B" },
                    ].map((mod) => (
                      <div key={mod.id} className="flex items-center gap-2">
                        <Checkbox
                          id={mod.id}
                          checked={formData.activeModules.includes(mod.id)}
                          onCheckedChange={(checked) => {
                            const updated = checked
                              ? [...formData.activeModules, mod.id]
                              : formData.activeModules.filter((m) => m !== mod.id);
                            setFormData({ ...formData, activeModules: updated });
                          }}
                        />
                        <label htmlFor={mod.id} className="text-xs font-medium cursor-pointer">
                          {mod.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 9: DATA & SINKRONISASI */}
              {activeTab === "sync" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">🔄 Dual Persistence & Ekspor Data</h3>
                  <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2 text-xs">
                    <p className="font-bold text-foreground">Status Sinkronisasi Real-Time:</p>
                    <p className="text-muted-foreground">Dual Persistence: <span className="font-bold text-green-600">Aktif (PostgreSQL + LocalStorage)</span></p>
                    <p className="text-muted-foreground">Terakhir Sinkron: {syncStatus.lastSynced}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={triggerForceSync} className="text-xs">
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      <span>Paksa Sinkronisasi Cloud</span>
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleExportCSV} className="text-xs">
                      <Download className="w-3.5 h-3.5 mr-1" />
                      <span>Ekspor Backup JSON</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Save Bottom Bar */}
              <div className="pt-6 border-t border-border flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetSettings} className="text-xs">
                  Reset Default
                </Button>
                <Button type="submit" className="font-bold text-xs bg-primary text-primary-foreground shadow-md">
                  <Save className="w-4 h-4 mr-1.5" />
                  <span>Simpan Perubahan Pengaturan</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
