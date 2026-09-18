"use client";

import React, { useState, useEffect } from "react";
import { Truck, Search, Plus, Phone, Mail, MapPin, Edit, Trash2 } from "lucide-react";
import { Supplier } from "@/db/schema";
import { INITIAL_SUPPLIERS } from "@/db/index";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";
import { HeaderKasir } from "@/components/HeaderKasir";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/atoms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const SUPPLIERS_STORAGE_KEY = "nstok_suppliers_v3";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("TOP 14 Hari");

  useEffect(() => {
    setSuppliers(loadFromLocalStorage(SUPPLIERS_STORAGE_KEY, INITIAL_SUPPLIERS));
  }, []);

  const openAddModal = () => {
    setEditingSupplier(null);
    setName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setAddress("");
    setPaymentTerms("Cash");
    setModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contactPerson || "");
    setPhone(s.phone || "");
    setEmail(s.email || "");
    setAddress(s.address || "");
    setPaymentTerms(s.paymentTerms || "Cash");
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingSupplier) {
      const updated = suppliers.map((s) =>
        s.id === editingSupplier.id
          ? { ...s, name, contactPerson, phone, email, address, paymentTerms }
          : s
      );
      setSuppliers(updated);
      saveToLocalStorage(SUPPLIERS_STORAGE_KEY, updated);
    } else {
      const newSup: Supplier = {
        id: `sup-${Date.now()}`,
        organizationId: "org-demo-1",
        name,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        paymentTerms: paymentTerms || "Cash",
        createdAt: new Date(),
      };
      const updated = [newSup, ...suppliers];
      setSuppliers(updated);
      saveToLocalStorage(SUPPLIERS_STORAGE_KEY, updated);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus data supplier ini?")) {
      const updated = suppliers.filter((s) => s.id !== id);
      setSuppliers(updated);
      saveToLocalStorage(SUPPLIERS_STORAGE_KEY, updated);
    }
  };

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
    (s.phone && s.phone.includes(search))
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <HeaderKasir />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Manajemen Pemasok & Vendor (Suppliers)</h1>
            <p className="text-xs text-muted-foreground">Pencatatan data vendor bahan baku dan termin pembayaran.</p>
          </div>
          <Button onClick={openAddModal} className="text-xs font-bold shrink-0">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Tambah Supplier Baru</span>
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari nama supplier atau kontak..."
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
                  <th className="py-3 px-4 font-semibold">Nama Perusahaan</th>
                  <th className="py-3 px-4 font-semibold">Contact Person</th>
                  <th className="py-3 px-4 font-semibold">Kontak (Telp / Email)</th>
                  <th className="py-3 px-4 font-semibold">Termin Pembayaran</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((sup) => (
                  <tr key={sup.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-foreground">{sup.name}</p>
                      {sup.address && <p className="text-[10px] text-muted-foreground truncate max-w-xs">{sup.address}</p>}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{sup.contactPerson || "-"}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {sup.phone && <p className="font-mono">{sup.phone}</p>}
                      {sup.email && <p className="text-[10px]">{sup.email}</p>}
                    </td>
                    <td className="py-3 px-4 font-semibold text-primary">{sup.paymentTerms}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEditModal(sup)} className="p-1.5 hover:bg-muted rounded text-primary">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(sup.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-red-500">
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
            <DialogTitle>{editingSupplier ? "Ubah Data Supplier" : "Tambah Supplier Baru"}</DialogTitle>
            <DialogDescription>Masukkan profil vendor pasokan barang / bahan baku.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-xs font-semibold">Nama Perusahaan / Toko Supplier</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold">Contact Person (PIC)</label>
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="mt-1 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold">Nomor Telepon</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 text-xs" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold">Alamat Gudang / Kantor</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold">Termin Pembayaran</label>
              <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Cash / TOP 14 Hari / TOP 30 Hari" className="mt-1 text-xs" />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
              <Button type="submit" className="font-bold">Simpan Supplier</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
