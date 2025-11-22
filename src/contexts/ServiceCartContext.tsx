"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "service-cart-items-v2";

export type CartItemType = "service" | "course";

export interface CartItem {
  id: string;
  type: CartItemType;
  name: string;
  quantity: number;
  price: number;
  // Service specific
  serviceSlug?: string;
  unitLabel?: string;
  track?: string;
  // Course specific
  slug?: string;
  image?: string;
}

type ServiceCartState = Record<string, CartItem>;

type ServiceCartContextValue = {
  items: ServiceCartState;
  setItemQuantity: (key: string, quantity: number) => void; // Legacy/Simple update
  addItem: (item: CartItem) => void; // Add or Update
  removeItem: (key: string) => void;
  clearCart: () => void;
  itemCount: number;
  cartTotal: number;
};

const ServiceCartContext = createContext<ServiceCartContextValue | undefined>(undefined);

export function ServiceCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ServiceCartState>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      } else {
        // Migration from old format if needed, or just ignore
        const oldSaved = window.localStorage.getItem("service-cart-items");
        if (oldSaved) {
          // We can't easily migrate without metadata, so we might just clear it
          // or try to keep keys but they won't have names/prices.
          // Let's just start fresh to avoid issues.
          window.localStorage.removeItem("service-cart-items");
        }
      }
    } catch (error) {
      console.warn("Failed to read cart from storage", error);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("Failed to persist cart", error);
    }
  }, [items, mounted]);

  const value = useMemo<ServiceCartContextValue>(() => {
    function setItemQuantity(key: string, quantity: number) {
      setItems((prev) => {
        if (quantity <= 0) {
          const { [key]: _removed, ...rest } = prev;
          return rest;
        }
        // Only update if item exists, otherwise we need full details (use addItem)
        if (prev[key]) {
          return { ...prev, [key]: { ...prev[key], quantity } };
        }
        return prev; // Cannot add new item without details via this method
      });
    }

    function addItem(item: CartItem) {
      setItems((prev) => {
        const existing = prev[item.id];
        if (existing) {
          return {
            ...prev,
            [item.id]: { ...existing, quantity: existing.quantity + item.quantity }
          };
        }
        return { ...prev, [item.id]: item };
      });
    }

    function removeItem(key: string) {
      setItems((prev) => {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      });
    }

    function clearCart() {
      setItems({});
    }

    const itemCount = Object.values(items).reduce((total, item) => total + item.quantity, 0);
    const cartTotal = Object.values(items).reduce((total, item) => total + (item.price * item.quantity), 0);

    return { items, setItemQuantity, addItem, removeItem, clearCart, itemCount, cartTotal };
  }, [items]);

  return <ServiceCartContext.Provider value={value}>{children}</ServiceCartContext.Provider>;
}

export function useServiceCart() {
  const context = useContext(ServiceCartContext);
  if (!context) {
    throw new Error("useServiceCart must be used within a ServiceCartProvider");
  }
  return context;
}
