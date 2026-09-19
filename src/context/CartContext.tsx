"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, Customer } from "@/db/schema";
import { useWorkspaceSettings } from "./WorkspaceSettingsContext";
import { useAuth } from "./AuthContext";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent?: number;
  itemNotes?: string;
  appliedPrice: number; // Effective price (wholesale or normal)
}

export interface HoldBill {
  id: string;
  tableNumber?: string;
  customerName?: string;
  customer?: Customer | null;
  items: CartItem[];
  savedAt: string;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  selectedCustomer: Customer | null;
  tableNumber: string;
  orderNotes: string;
  discountPercent: number;
  discountAmount: number;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  holdBills: HoldBill[];
  addToCart: (product: Product, qty?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setTableNumber: (table: string) => void;
  setOrderNotes: (notes: string) => void;
  setDiscountPercent: (percent: number) => void;
  setDiscountAmount: (amount: number) => void;
  holdCurrentBill: (notes?: string) => boolean;
  restoreHoldBill: (billId: string) => void;
  deleteHoldBill: (billId: string) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { calculateTax, applyRounding } = useWorkspaceSettings();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [tableNumber, setTableNumber] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [holdBills, setHoldBills] = useState<HoldBill[]>([]);

  const orgId = user?.organizationId || "org-demo-1";
  const cartKey = `nstok_${orgId}_active_cart`;
  const holdKey = `nstok_${orgId}_hold_bills`;

  useEffect(() => {
    const savedCart = loadFromLocalStorage<CartItem[]>(cartKey, []);
    const savedHold = loadFromLocalStorage<HoldBill[]>(holdKey, []);
    setItems(savedCart);
    setHoldBills(savedHold);
  }, [orgId, cartKey, holdKey]);

  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    saveToLocalStorage(cartKey, newItems);
  };

  const addToCart = (product: Product, qty: number = 1) => {
    const sellingPrice = parseFloat(product.sellingPrice);
    const wholesalePrice = product.wholesalePrice ? parseFloat(product.wholesalePrice) : sellingPrice;
    const minWholesaleQty = product.minWholesaleQty || 999999;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === product.id);
      let newItems: CartItem[];

      if (existingIndex >= 0) {
        newItems = [...prev];
        const newQty = newItems[existingIndex].quantity + qty;
        const effectivePrice = newQty >= minWholesaleQty ? wholesalePrice : sellingPrice;
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newQty,
          appliedPrice: effectivePrice,
        };
      } else {
        const effectivePrice = qty >= minWholesaleQty ? wholesalePrice : sellingPrice;
        newItems = [
          ...prev,
          {
            product,
            quantity: qty,
            appliedPrice: effectivePrice,
          },
        ];
      }

      saveToLocalStorage(cartKey, newItems);
      return newItems;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) => {
      const newItems = prev.map((item) => {
        if (item.product.id === productId) {
          const sellingPrice = parseFloat(item.product.sellingPrice);
          const wholesalePrice = item.product.wholesalePrice ? parseFloat(item.product.wholesalePrice) : sellingPrice;
          const minWholesaleQty = item.product.minWholesaleQty || 999999;
          const effectivePrice = quantity >= minWholesaleQty ? wholesalePrice : sellingPrice;
          return { ...item, quantity, appliedPrice: effectivePrice };
        }
        return item;
      });
      saveToLocalStorage(cartKey, newItems);
      return newItems;
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => {
      const newItems = prev.filter((i) => i.product.id !== productId);
      saveToLocalStorage(cartKey, newItems);
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    setSelectedCustomer(null);
    setTableNumber("");
    setOrderNotes("");
    setDiscountPercent(0);
    setDiscountAmount(0);
    saveToLocalStorage(cartKey, []);
  };

  const subtotal = items.reduce((sum, item) => sum + item.appliedPrice * item.quantity, 0);
  const totalDiscount = discountAmount > 0 ? discountAmount : Math.round(subtotal * (discountPercent / 100));
  const subtotalAfterDiscount = Math.max(0, subtotal - totalDiscount);
  const taxAmount = calculateTax(subtotalAfterDiscount);
  const grandTotal = applyRounding(subtotalAfterDiscount + taxAmount);

  const holdCurrentBill = (notes?: string): boolean => {
    if (items.length === 0) return false;
    const newBill: HoldBill = {
      id: `bill-${Date.now()}`,
      tableNumber,
      customerName: selectedCustomer?.name,
      customer: selectedCustomer,
      items: [...items],
      savedAt: new Date().toLocaleTimeString("id-ID"),
      notes: notes || orderNotes,
    };
    const updated = [newBill, ...holdBills];
    setHoldBills(updated);
    saveToLocalStorage(holdKey, updated);
    clearCart();
    return true;
  };

  const restoreHoldBill = (billId: string) => {
    const bill = holdBills.find((b) => b.id === billId);
    if (!bill) return;
    setItems(bill.items);
    setSelectedCustomer(bill.customer || null);
    setTableNumber(bill.tableNumber || "");
    setOrderNotes(bill.notes || "");
    deleteHoldBill(billId);
    saveToLocalStorage(cartKey, bill.items);
  };

  const deleteHoldBill = (billId: string) => {
    const updated = holdBills.filter((b) => b.id !== billId);
    setHoldBills(updated);
    saveToLocalStorage(holdKey, updated);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        selectedCustomer,
        tableNumber,
        orderNotes,
        discountPercent,
        discountAmount,
        subtotal,
        taxAmount,
        grandTotal,
        holdBills,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        setSelectedCustomer,
        setTableNumber,
        setOrderNotes,
        setDiscountPercent,
        setDiscountAmount,
        holdCurrentBill,
        restoreHoldBill,
        deleteHoldBill,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
