"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, Plus, Award, Phone, Mail, Edit, Trash2 } from "lucide-react";
import { Customer } from "@/db/schema";
import { INITIAL_CUSTOMERS } from "@/db/index";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { HeaderKasir } from "@/components/HeaderKasir";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, Badge } from "@/components/ui/atoms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const CUSTOMERS_STORAGE_KEY = "nstok_customers_v3";

export default function CustomersPage() {
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

  useEffect(() => {
    setCustomers(loadFromLocalStorage(CUSTOMERS_STORAGE_KEY, INITIAL_CUSTOMERS));
  }, []);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    if (editingCustomer) {
      const updated = customers.map((c) =>
        c.id === editingCustomer.id
          ? { ...c, name, phone, email, address, notes, updatedAt: new Date() }
          : c
      );
      setCustomers(updated);
      saveToLocalStorage(CUSTOMERS_STORAGE_KEY, updated);
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        organizationId: "org-demo-1",
        name,
        phone,
        email: email || null,
        address: address || null,
        loyaltyPoints: 0,
        totalSpent: "0",
        tier: "BRONZE",
        notes: notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updated = [newCust, ...customers];
      setCustomers(updated);
      saveToLocalStorage(CUSTOMERS_STORAGE_KEY, updated);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus data member ini?")) {
      const updated = customers.filter((c) => c.id !== id);
      setCustomers(updated);
      saveToLocalStorage(CUSTOMERS_STORAGE_KEY, updated);
    }
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <HeaderKasir />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Database Pelanggan & Loyalitas CRM</h1>
            <p className="text-xs text-muted-foreground">Pencatatan member, akumulasi poin belanja, dan tingkatan loyalitas.</p>
          </div>
          <Button onClick={openAddModal} className="text-xs font-bold shrink-0">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Tambah Member Baru</span>
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari nama, WhatsApp, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Nama Member</th>
                  <th className="py-3 px-4 font-semibold">Kontak</th>
                  <th className="py-3 px-4 font-semibold">Tingkatan (Tier)</th>
                  <th className="py-3 px-4 font-semibold">Poin Loyalitas</th>
                  <th className="py-3 px-4 font-semibold">Total Belanja (CLV)</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((cust) => (
                  <tr key={cust.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-foreground">{cust.name}</p>
                      {cust.notes && <p className="text-[10px] text-muted-foreground truncate max-w-xs">{cust.notes}</p>}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <p className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3 text-primary" /> {cust.phone}</p>
                      {cust.email && <p className="text-[10px]">{cust.email}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={cust.tier === "GOLD" ? "warning" : cust.tier === "SILVER" ? "secondary" : "outline"}>
                        {cust.tier}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-primary">{cust.loyaltyPoints} Pts</td>
                    <td className="py-3 px-4 font-bold text-foreground">{formatCurrency(parseFloat(cust.totalSpent))}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEditModal(cust)} className="p-1.5 hover:bg-muted rounded text-primary">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(cust.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Ubah Data Member" : "Tambah Member CRM"}</DialogTitle>
            <DialogDescription>Masukkan profil pelanggan untuk pendaftaran program loyalitas.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-xs font-semibold">Nama Pelanggan</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold">No. WhatsApp / HP</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="0812..." className="mt-1 text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold">Email (Opsional)</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold">Alamat (Opsional)</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold">Catatan Khusus</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Preferensi kopi, treatment favorit, dll" className="mt-1 text-xs" />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
              <Button type="submit" className="font-bold">Simpan Member</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
