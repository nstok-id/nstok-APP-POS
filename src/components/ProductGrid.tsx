"use client";

import React, { useState } from "react";
import { Search, Barcode, Plus, Tag, AlertCircle, Check, Trash2 } from "lucide-react";
import { Product } from "@/db/schema";
import { useCart } from "@/context/CartContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/atoms";

export function ProductGrid({ 
  products,
  onAddNewProduct,
  onDeleteProduct
}: { 
  products: Product[];
  onAddNewProduct?: () => void;
  onDeleteProduct?: (id: string) => void;
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
    <div className="flex flex-col h-full space-y-3">
      {/* Search & Category Tabs */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari menu, SKU, atau scan barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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
              {cat === "ALL" ? "Semua Menu" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border rounded-xl text-center p-6 space-y-2">
            <Tag className="w-8 h-8 text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">Tidak ada produk ditemukan</p>
            <p className="text-[11px] text-muted-foreground">Coba ubah kata kunci pencarian atau kategori.</p>
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
                    <div className="flex items-center gap-1">
                      {onDeleteProduct && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProduct(product.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive rounded"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {inCartQty > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold text-[11px] flex items-center justify-center shadow-xs">
                          {inCartQty}
                        </span>
                      )}
                    </div>
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
