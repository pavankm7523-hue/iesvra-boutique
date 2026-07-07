import { useState, useEffect } from "react";
import type { Product } from "./products";

export interface WishlistItem {
  id: string;
  name: string;
  sub: string;
  price: number;
  mrp: number;
  image: string;
  category: string;
}

const WISHLIST_KEY = "ishvara_wishlist";
const EVENT_NAME = "ishvara_wishlist_changed";

function triggerWishlistChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

export function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse wishlist", e);
    return [];
  }
}

function saveWishlist(wishlist: WishlistItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    triggerWishlistChange();
  } catch (e) {
    console.error("Failed to save wishlist", e);
  }
}

export function addToWishlist(product: Product) {
  const wishlist = getWishlist();
  const exists = wishlist.some((item) => item.id === product.id);
  if (!exists) {
    wishlist.push({
      id: product.id,
      name: product.name,
      sub: product.sub,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      category: product.categories[0] || "Uncategorized",
    });
    saveWishlist(wishlist);
  }
}

export function removeFromWishlist(id: string) {
  const wishlist = getWishlist();
  const updated = wishlist.filter((item) => item.id !== id);
  saveWishlist(updated);
}

export function toggleWishlist(product: Product): boolean {
  const wishlist = getWishlist();
  const exists = wishlist.some((item) => item.id === product.id);
  if (exists) {
    removeFromWishlist(product.id);
    return false; // removed
  } else {
    addToWishlist(product);
    return true; // added
  }
}

export function isInWishlist(id: string): boolean {
  return getWishlist().some((item) => item.id === id);
}

export function useWishlistItems(): WishlistItem[] {
  const [items, setItems] = useState<WishlistItem[]>(() => getWishlist());

  useEffect(() => {
    const handleUpdate = () => {
      setItems(getWishlist());
    };

    if (typeof window !== "undefined") {
      window.addEventListener(EVENT_NAME, handleUpdate);
      setItems(getWishlist());
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(EVENT_NAME, handleUpdate);
      }
    };
  }, []);

  return items;
}

export function useWishlistCount(): number {
  const items = useWishlistItems();
  return items.length;
}

export function useIsInWishlist(productId: string): boolean {
  const items = useWishlistItems();
  return items.some((item) => item.id === productId);
}
