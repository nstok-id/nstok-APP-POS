"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Search, Plus, AlertTriangle, Edit, Trash2, Loader2 } from "lucide-react";
import { Product } from "@/db/schema";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";
import { getStarterProducts } from "@/lib/starter-templates";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { cloudGetProducts, cloudSaveProduct, cloudDeleteProduct } from "@/app/actions/cloud-sync";
import { HeaderKasir } from "@/components/HeaderKasir";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, Badge } from "@/components/ui/atoms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function InventoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
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

  const orgId = user?.organizationId || "org-demo-1";
  const PRODUCTS_STORAGE_KEY = `nstok_${orgId}_products`;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const defaultProducts = getStarterProducts((user.businessType as any) || "FNB", orgId);
      const local = loadFromLocalStorage<Product[]>(PRODUCTS_STORAGE_KEY, defaultProducts);
      setProducts(local);

      // Asynchronously fetch live data from Supabase Cloud DB
      cloudGetProducts(orgId).then((cloudData) => {
        if (cloudData && cloudData.length > 0) {
          setProducts(cloudData);
          saveToLocalStorage(PRODUCTS_STORAGE_KEY, cloudData);
        } else if (local.length > 0) {
          // Seed cloud if empty
          for (const p of local) {
            cloudSaveProduct(p).catch(() => {});
          }
        }
      }).catch((e) => console.warn("Cloud product fetch warning:", e));
    }
  }, [user, authLoading, orgId, router, PRODUCTS_STORAGE_KEY]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sellingPrice) return;

    if (editingProduct) {
      const updatedProd: Product = {
        ...editingProduct,
        name,
        sku,
        category,
        costPrice: costPrice || "0",
        sellingPrice,
        stock: parseInt(stock) || 0,
        unit,
        minStockAlert: parseInt(minStockAlert) || 5,
        updatedAt: new Date(),
      };
      const updated = products.map((p) => (p.id === editingProduct.id ? updatedProd : p));
      setProducts(updated);
      saveToLocalStorage(PRODUCTS_STORAGE_KEY, updated);
      await cloudSaveProduct(updatedProd);
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        organizationId: orgId,
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
      await cloudSaveProduct(newProd);
    }

    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini dari katalog toko?")) {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      saveToLocalStorage(PRODUCTS_STORAGE_KEY, updated);
      await cloudDeleteProduct(id);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
      </div>
    );
  }

  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <HeaderKasir />

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                Toko: {user.organizationName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Manajemen Produk & Stok
            </h1>
          </div>

          <Button onClick={openAddModal} className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Baru</span>
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama produk atau SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat === "ALL" ? "Semua Kategori" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Table */}
        <Card className="overflow-hidden border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4">SKU / Kategori</th>
                  <th className="py-3 px-4">Harga Modal</th>
                  <th className="py-3 px-4">Harga Jual</th>
                  <th className="py-3 px-4">Stok Fisik</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Tidak ada produk ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLowStock = p.stock <= (p.minStockAlert || 5);
                    return (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-foreground text-sm">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground">Satuan: {p.unit}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-foreground font-medium">{p.sku}</span>
                          <div className="text-[11px] text-muted-foreground">{p.category}</div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatCurrency(parseFloat(p.costPrice || "0"))}
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground">
                          {formatCurrency(parseFloat(p.sellingPrice))}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold text-sm ${isLowStock ? "text-red-500" : "text-emerald-500"}`}>
                              {p.stock} {p.unit}
                            </span>
                            {isLowStock && (
                              <span className="p-1 rounded bg-red-500/10 text-red-500" title="Stok Menipis!">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                              title="Edit Produk"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Dialog Add/Edit Product */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Informasi Produk" : "Tambah Produk Baru"}</DialogTitle>
              <DialogDescription>
                Kelola master produk dan stok untuk workspace toko {user.organizationName}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-3.5 py-2">
              <div>
                <label className="text-xs font-semibold text-foreground">Nama Produk</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kopi Susu Aren"
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Kategori</label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Minuman / Makanan / dll"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">SKU / Kode Barang</label>
                  <Input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="SKU-001"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Harga Modal (HPP)</label>
                  <Input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="8000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Harga Jual (Rp)</label>
                  <Input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="18000"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Stok Fisik</label>
                  <Input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="50"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Satuan</label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="cup/pcs"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Min. Alert</label>
                  <Input
                    type="number"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    placeholder="5"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Simpan Produk
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
