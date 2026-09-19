"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, Plus, Award, Phone, Mail, Edit, Trash2, Loader2, Sparkles } from "lucide-react";
import { Customer } from "@/db/schema";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";
import { getStarterCustomers } from "@/lib/starter-templates";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { cloudGetCustomers, cloudSaveCustomer, cloudDeleteCustomer } from "@/app/actions/cloud-sync";
import { HeaderKasir } from "@/components/HeaderKasir";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, Badge } from "@/components/ui/atoms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function CustomersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { formatCurrency } = useWorkspaceSettings();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const orgId = user?.organizationId || "org-demo-1";
  const CUSTOMERS_STORAGE_KEY = `nstok_${orgId}_customers`;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const defaultCustomers = getStarterCustomers(orgId);
      const local = loadFromLocalStorage<Customer[]>(CUSTOMERS_STORAGE_KEY, defaultCustomers);
      setCustomers(local);

      // Asynchronously fetch live data from Supabase Cloud DB
      cloudGetCustomers(orgId).then((cloudData) => {
        if (cloudData && cloudData.length > 0) {
          setCustomers(cloudData);
          saveToLocalStorage(CUSTOMERS_STORAGE_KEY, cloudData);
        } else if (local.length > 0) {
          for (const c of local) {
            cloudSaveCustomer(c).catch(() => {});
          }
        }
      }).catch((e) => console.warn("Cloud customer fetch warning:", e));
    }
  }, [user, authLoading, orgId, router, CUSTOMERS_STORAGE_KEY]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || "");
    setAddress(c.address || "");
    setNotes(c.notes || "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    if (editingCustomer) {
      const updatedCust: Customer = {
        ...editingCustomer,
        name,
        phone,
        email: email || null,
        address: address || null,
        notes: notes || null,
        updatedAt: new Date(),
      };
      const updated = customers.map((c) => (c.id === editingCustomer.id ? updatedCust : c));
      setCustomers(updated);
      saveToLocalStorage(CUSTOMERS_STORAGE_KEY, updated);
      await cloudSaveCustomer(updatedCust);
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        organizationId: orgId,
        name,
        phone,
        email: email || null,
        address: address || null,
        notes: notes || null,
        tier: "BRONZE",
        loyaltyPoints: 0,
        totalSpent: "0",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updated = [newCust, ...customers];
      setCustomers(updated);
      saveToLocalStorage(CUSTOMERS_STORAGE_KEY, updated);
      await cloudSaveCustomer(newCust);
    }

    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus data pelanggan ini dari CRM toko?")) {
      const updated = customers.filter((c) => c.id !== id);
      setCustomers(updated);
      saveToLocalStorage(CUSTOMERS_STORAGE_KEY, updated);
      await cloudDeleteCustomer(id);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
      </div>
    );
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <HeaderKasir />

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                Toko: {user.organizationName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Pelanggan & Program Loyalitas (CRM)
            </h1>
          </div>

          <Button onClick={openAddModal} className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            <span>Tambah Member Baru</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan nama pelanggan, no telepon, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Customers Table */}
        <Card className="overflow-hidden border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">Kontak (HP/Email)</th>
                  <th className="py-3 px-4">Tier Member</th>
                  <th className="py-3 px-4">Poin Loyalitas</th>
                  <th className="py-3 px-4">Total Belanja</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Tidak ada pelanggan ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground text-sm">{c.name}</div>
                        {c.notes && <div className="text-[11px] text-muted-foreground">{c.notes}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-foreground font-mono">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span>{c.phone}</span>
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span>{c.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            c.tier === "GOLD"
                              ? "default"
                              : "secondary"
                          }
                          className="font-bold"
                        >
                          {c.tier}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-purple-500">
                        {c.loyaltyPoints} Poin
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground">
                        {formatCurrency(parseInt(c.totalSpent || "0"))}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal Add/Edit Customer */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"}</DialogTitle>
              <DialogDescription>
                Daftarkan member baru untuk mendapatkan poin loyalitas belanja.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-3.5 py-2">
              <div>
                <label className="text-xs font-semibold text-foreground">Nama Lengkap</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">No. Telepon / WhatsApp</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Email (Opsional)</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@email.com"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Alamat (Opsional)</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Mawar No. 10"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Catatan / Preferensi</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Suka kopi less sugar / pelanggan langganan"
                  className="mt-1"
                />
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Simpan Pelanggan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
