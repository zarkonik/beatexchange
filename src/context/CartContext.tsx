import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// ── 1. Cart Item type ──────────────────────
export interface CartItem {
  id: number;
  title: string;
  producer: string;
  ipfsHash: string;
  personalPrice: bigint;
  commercialPrice: bigint;
  royaltyRate: number;
  licenseType: 0 | 1; // 0 = Personal, 1 = Commercial
}

// ── 2. Context shape ───────────────────────
interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  isInCart: (id: number) => boolean;
  totalPrice: bigint;
  itemCount: number;
}

// ── 3. Create context ──────────────────────
const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  isInCart: () => false,
  totalPrice: 0n,
  itemCount: 0,
});

// ── 4. Provider ────────────────────────────
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    // don't add duplicates
    if (items.find((i) => i.id === item.id)) return;
    setItems((prev) => [...prev, item]);
  };

  const removeFromCart = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (id: number): boolean => {
    return !!items.find((i) => i.id === id);
  };

  // sum up all prices based on chosen license type
  const totalPrice = items.reduce((sum, item) => {
    const price =
      item.licenseType === 0 ? item.personalPrice : item.commercialPrice;
    return sum + price;
  }, 0n);

  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        totalPrice,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ── 5. Custom hook ─────────────────────────
export function useCart() {
  return useContext(CartContext);
}
