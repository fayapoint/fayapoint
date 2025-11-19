"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "service-cart-items";

type ServiceCartState = Record<string, number>;

type ServiceCartContextValue = {
  items: ServiceCartState;
  setItemQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
};

const ServiceCartContext = createContext<ServiceCartContextValue | undefined>(undefined);

export function ServiceCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ServiceCartState>({});

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (error) {
      console.warn("Failed to read cart from storage", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("Failed to persist cart", error);
    }
  }, [items]);

  const value = useMemo<ServiceCartContextValue>(() => {
    function setItemQuantity(key: string, quantity: number) {
      setItems((prev) => {
        if (quantity <= 0) {
          const { [key]: _removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [key]: quantity };
      });
    }

    function clearCart() {
      setItems({});
    }

    const itemCount = Object.values(items).reduce((total, qty) => total + qty, 0);

    return { items, setItemQuantity, clearCart, itemCount };
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
