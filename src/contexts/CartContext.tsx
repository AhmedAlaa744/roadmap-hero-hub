import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "@/data/mockData";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("garak-cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("garak-cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, qty = 1) => {
    const stockCap = Math.max(0, Number(product.stock ?? 0));
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const nextQty = stockCap > 0 ? Math.min(existing.quantity + qty, stockCap) : existing.quantity + qty;
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, product, quantity: nextQty }
            : i
        );
      }
      const nextQty = stockCap > 0 ? Math.min(qty, stockCap) : qty;
      return [...prev, { product, quantity: nextQty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) return removeFromCart(productId);
    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i;
        const cap = Math.max(0, Number(i.product.stock ?? 0));
        const capped = cap > 0 ? Math.min(qty, cap) : qty;
        return { ...i, quantity: capped };
      })
    );
  };

  const setCartItems = (next: CartItem[]) => setItems(next);

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
};
