"use client";

import React, { useState, useEffect } from "react";
import { Package, Search, Plus, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { Product } from "@/db/schema";
import { INITIAL_PRODUCTS } from "@/db/index";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { HeaderKasir } from "@/components/HeaderKasir";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, Badge } from "@/components/ui/atoms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const PRODUCTS_STORAGE_KEY = "nstok_products_v3";

export default function InventoryPage() {
  const { formatCurrency, settings } = useWorkspaceSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Minuman");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [minStockAlert, setMinStockAlert] = useState("5");

  useEffect(() => {
    setProducts(loadFromLocalStorage(PRODUCTS_STORAGE_KEY, INITIAL_PRODUCTS));
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setSku(`SKU-${Date.now().toString().slice(-4)}`);
    setCategory("Minuman");
    setCostPrice("");
    setSellingPrice("");
    setStock("50");
    setUnit("pcs");
    setMinStockAlert((settings.lowStockThresholdDefault || 5).toString());
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setCostPrice(p.costPrice);
    setSellingPrice(p.sellingPrice);
    setStock(p.stock.toString());
    setUnit(p.unit);
    setMinStockAlert(p.minStockAlert.toString());
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sellingPrice) return;

    if (editingProduct) {
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name,
              sku,
              category,
              costPrice: costPrice || "0",
              sellingPrice,
              stock: parseInt(stock) || 0,
              unit,
              minStockAlert: parseInt(minStockAlert) || 5,
              updatedAt: new Date(),
            }
          : p
      );
      setProducts(updated);
      saveToLocalStorage(PRODUCTS_STORAGE_KEY, updated);
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        organizationId: "org-demo-1",
        outletId: "outlet-1",
        name,
        sku,
        barcode: null,
        category,
        costPrice: costPrice || "0",
        sellingPrice,
        wholesalePrice: null,
        minWholesaleQty: 10,
        stock: parseInt(stock) || 0,
        unit,
        minStockAlert: parseInt(minStockAlert) || 5,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updated = [newProd, ...products];
      setProducts(updated);
      saveToLocalStorage(PRODUCTS_STORAGE_KEY, updated);
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus produk ini dari master barang?")) {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      saveToLocalStorage(PRODUCTS_STORAGE_KEY, updated);
    }
  };

  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <HeaderKasir />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Katalog Master Inventori & Stok</h1>
            <p className="text-xs text-muted-foreground">Kelola SKU, HPP, harga jual, dan batas stok minimum.</p>
          </div>
          <Button onClick={openAddModal} className="text-xs font-bold shrink-0">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Tambah Produk Baru</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Cari nama barang atau SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat ? "bg-primary text-primary-foreground font-bold" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat === "ALL" ? "Semua Kategori" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table Card */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">SKU / Nama Produk</th>
                  <th className="py-3 px-4 font-semibold">Kategori</th>
                  <th className="py-3 px-4 font-semibold">HPP (Modal)</th>
                  <th className="py-3 px-4 font-semibold">Harga Jual</th>
                  <th className="py-3 px-4 font-semibold">Sisa Stok</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((prod) => {
                  const isLow = prod.stock <= prod.minStockAlert;
                  return (
                    <tr key={prod.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-foreground">{prod.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{prod.sku}</p>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{prod.category}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatCurrency(parseFloat(prod.costPrice))}</td>
                      <td className="py-3 px-4 font-bold text-primary">{formatCurrency(parseFloat(prod.sellingPrice))}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          prod.stock <= 0
                            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : isLow
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                        }`}>
                          {prod.stock} {prod.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 hover:bg-muted rounded text-primary"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit / Add Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Ubah Informasi Produk" : "Tambah Produk Baru"}</DialogTitle>
            <DialogDescription>Lengkapi detail produk untuk master inventori workspace.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-xs font-semibold">Nama Produk</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold">SKU</label>
                <Input value={sku} onChange={(e) => setSku(e.target.value)} required className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold">Kategori</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} required className="mt-1 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold">Harga Beli HPP (Rp)</label>
                <Input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold">Harga Jual (Rp)</label>
                <Input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required className="mt-1 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold">Jumlah Stok</label>
                <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold">Satuan</label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold">Batas Min. Alert</label>
                <Input type="number" value={minStockAlert} onChange={(e) => setMinStockAlert(e.target.value)} className="mt-1 text-xs" />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
              <Button type="submit" className="font-bold">Simpan Produk</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
