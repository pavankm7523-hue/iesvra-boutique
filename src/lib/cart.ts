import { useState, useEffect } from "react";
import type { Product } from "./products";

export interface CartItem {
  id: string;
  name: string;
  sub: string;
  price: number;
  mrp: number;
  image: string;
  category: string;
  color: string;
  quantity: number;
  bannerId?: string;
  saleEndDate?: string;
  normalPrice?: number;
  isDigital?: boolean;
  type?: string;
}

const CART_KEY = "ishvara_cart";
const EVENT_NAME = "ishvara_cart_changed";

function triggerCartChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse cart", e);
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    triggerCartChange();
  } catch (e) {
    console.error("Failed to save cart", e);
  }
}

export function addToCart(product: Product, color: string, quantity = 1, bannerId?: string, saleEndDate?: string, normalPrice?: number) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id && item.color === color && item.bannerId === bannerId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      sub: product.sub,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      category: product.categories[0] || "Uncategorized",
      color,
      quantity,
      bannerId,
      saleEndDate,
      normalPrice,
      isDigital: product.isDigital,
      type: product.type
    });
  }

  saveCart(cart);
}

export function removeFromCart(id: string, color: string) {
  const cart = getCart();
  const updated = cart.filter((item) => !(item.id === id && item.color === color));
  saveCart(updated);
}

export function updateCartQuantity(id: string, color: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(id, color);
    return;
  }

  const cart = getCart();
  const item = cart.find((i) => i.id === id && i.color === color);
  if (item) {
    item.quantity = quantity;
    saveCart(cart);
  }
}

export function clearCart() {
  saveCart([]);
}

export function useCartItems(): CartItem[] {
  const [items, setItems] = useState<CartItem[]>(() => getCart());

  useEffect(() => {
    const handleUpdate = () => {
      validateCartExpirations();
    };

    const validateCartExpirations = () => {
      const currentCart = getCart();
      let hasChanges = false;
      const now = new Date();

      // Read current products list from localStorage to verify live prices
      let latestProducts: Product[] = [];
      try {
        const stored = localStorage.getItem("ishvara_products_v11");
        if (stored) {
          latestProducts = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Failed to parse products from localStorage inside cart hook", e);
      }

      const validatedCart = currentCart.map(item => {
        const dbProduct = latestProducts.find(p => p.id === item.id);
        
        let targetPrice = item.price;
        let targetMrp = item.mrp;
        
        if (dbProduct) {
          // If the price in the database changed, and this isn't an active flash sale item
          if (dbProduct.price !== item.price) {
            const isSaleActive = item.saleEndDate && now <= new Date(item.saleEndDate);
            if (!isSaleActive) {
              targetPrice = dbProduct.price;
              targetMrp = dbProduct.mrp;
              hasChanges = true;
            }
          }
        }

        // Expire old flash sale items
        if (item.saleEndDate && item.normalPrice !== undefined) {
          if (now > new Date(item.saleEndDate)) {
            hasChanges = true;
            import("sonner").then(({ toast }) => {
              toast.info(`Special price for ${item.name} has expired. Price updated to ₹${item.normalPrice}`);
            });
            return {
              ...item,
              price: dbProduct ? dbProduct.price : item.normalPrice,
              mrp: dbProduct ? dbProduct.mrp : item.normalPrice,
              saleEndDate: undefined,
              bannerId: undefined,
            };
          }
        }
        
        if (item.price !== targetPrice || item.mrp !== targetMrp) {
          return {
            ...item,
            price: targetPrice,
            mrp: targetMrp
          };
        }
        return item;
      });

      if (hasChanges) {
        saveCart(validatedCart); // Trigger re-sync
      } else {
        setItems(currentCart);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener(EVENT_NAME, handleUpdate);
      window.addEventListener("ishvara_products_changed", handleUpdate);
      validateCartExpirations();
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(EVENT_NAME, handleUpdate);
        window.removeEventListener("ishvara_products_changed", handleUpdate);
      }
    };
  }, []);

  return items;
}

export function useCartCount(): number {
  const items = useCartItems();
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
