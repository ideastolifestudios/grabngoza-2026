"use client";
import {
  createContext, useContext, useEffect, useState, useCallback, useRef,
} from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/lib/types";

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, size: string, quantity?: number) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  persistCartForRecovery: (email: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "grabngoza_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const cartIdRef = useRef<string>(
    typeof window !== "undefined"
      ? (localStorage.getItem("grabngoza_cart_id") || `cart_${Date.now()}_${Math.random().toString(36).slice(2)}`)
      : `cart_${Date.now()}`
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
      localStorage.setItem("grabngoza_cart_id", cartIdRef.current);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((product: Product, size: string, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.size === size);
      return existing
        ? prev.map((i) => i.product.id === product.id && i.size === size ? { ...i, quantity: i.quantity + quantity } : i)
        : [...prev, { product, size, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: string, size: string) => {
    setItems((prev) => prev.filter((i) => !(i.product.id === productId && i.size === size)));
  }, []);

  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity <= 0) { removeItem(productId, size); return; }
    setItems((prev) => prev.map((i) => i.product.id === productId && i.size === size ? { ...i, quantity } : i));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  // Persist cart to Firestore for abandoned cart recovery
  const persistCartForRecovery = useCallback(async (email: string) => {
    if (!email || items.length === 0) return;
    try {
      await setDoc(doc(db, "carts", cartIdRef.current), {
        email,
        items: items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          productImage: i.product.image,
          price: i.product.price,
          size: i.size,
          quantity: i.quantity,
        })),
        totalPrice: items.reduce((s, i) => s + i.product.price * i.quantity, 0),
        updatedAt: serverTimestamp(),
        emailSent: false,
        converted: false,
      });
    } catch (e) {
      console.warn("Cart persistence failed:", e);
    }
  }, [items]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, isOpen, openCart, closeCart, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, persistCartForRecovery }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}