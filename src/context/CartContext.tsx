import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type CartItemType = "stem" | "pack";

export interface CartItem {
  id: string; // stem id (number as string) or pack Firebase id
  type: CartItemType;
  title: string;
  producer: string;
  ipfsHash?: string; // for stems — audio preview
  previewUrl?: string; // for packs — audio preview
  fileUrl?: string; // for packs — download URL
  personalPrice?: bigint; // for stems
  commercialPrice?: bigint; // for stems
  royaltyRate?: number; // for stems
  licenseType?: 0 | 1; // for stems
  price?: string; // for packs — ETH price as string
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  totalPrice: bigint;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  isInCart: () => false,
  totalPrice: 0n,
  itemCount: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    if (items.find((i) => i.id === item.id)) return;
    setItems((prev) => [...prev, item]);
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => setItems([]);

  const isInCart = (id: string): boolean => !!items.find((i) => i.id === id);

  // calculate total — stems use bigint, packs use string ETH
  const totalPrice = items.reduce((sum, item) => {
    if (item.type === "stem") {
      const price =
        item.licenseType === 0 ? item.personalPrice! : item.commercialPrice!;
      return sum + price;
    } else {
      // convert ETH string to wei bigint
      const wei = BigInt(Math.round(Number(item.price) * 1e18));
      return sum + wei;
    }
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

export function useCart() {
  return useContext(CartContext);
}
