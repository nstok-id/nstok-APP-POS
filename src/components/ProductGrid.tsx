"use client";

import React, { useState } from "react";
import { Search, Barcode, Plus, Tag, AlertCircle, Check } from "lucide-react";
import { Product } from "@/db/schema";
import { useCart } from "@/context/CartContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/atoms";

export function ProductGrid({ 
  products,
  onAddNewProduct
}: { 
  products: Product[];
  onAddNewProduct?: () => void;
}) {
  const { addToCart, items } = useCart();
  const { formatCurrency } = useWorkspaceSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getItemQuantityInCart = (productId: string) => {
    const found = items.find((i) => i.product.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-4 space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari nama barang, SKU, atau scan barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-10 rounded-xl"
          />
          <Barcode className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        {onAddNewProduct && (
          <button
            onClick={onAddNewProduct}
            className="flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {cat === "ALL" ? "Semua Kategori" : cat}
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="font-semibold text-sm">Produk tidak ditemukan</p>
            <p className="text-xs">Coba kata kunci lain atau pilih kategori Semua.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {filteredProducts.map((product) => {
              const inCartQty = getItemQuantityInCart(product.id);
              const isLowStock = product.stock <= product.minStockAlert;
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product, 1)}
                  className={`group relative rounded-xl border border-border bg-card p-3.5 flex flex-col justify-between transition-all select-none cursor-pointer hover:border-primary/50 hover:shadow-md ${
                    isOutOfStock ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider truncate">
                      {product.category}
                    </span>
                    {inCartQty > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold text-[11px] flex items-center justify-center shadow-xs">
                        {inCartQty}
                      </span>
                    )}
                  </div>

                  {/* Product Title & SKU */}
                  <div className="space-y-1 mb-3">
                    <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {product.sku}
                    </p>
                  </div>

                  {/* Bottom: Price & Stock Status */}
                  <div className="pt-2 border-t border-border flex items-end justify-between">
                    <div>
                      <p className="text-xs font-bold text-primary">
                        {formatCurrency(parseFloat(product.sellingPrice))}
                      </p>
                      {product.wholesalePrice && (
                        <p className="text-[10px] text-muted-foreground">
                          Grosir: {formatCurrency(parseFloat(product.wholesalePrice))} (≥{product.minWholesaleQty})
                        </p>
                      )}
                    </div>

                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      isOutOfStock
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                        : isLowStock
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {isOutOfStock ? "Habis" : `${product.stock} ${product.unit}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
