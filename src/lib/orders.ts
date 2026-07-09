import type { CartItem } from "./cart";
import { clearCart } from "./cart";
import { useState, useEffect } from "react";

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered';
  paymentStatus?: 'Paid' | 'Pending - COD';
}

const ORDERS_KEY = "IESVRA_orders";
const ORDERS_EVENT = "IESVRA_orders_changed";

function triggerOrdersChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORDERS_EVENT));
  }
}

export function getOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse orders", e);
    return [];
  }
}

export function saveOrders(orders: Order[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    triggerOrdersChange();
  } catch (e) {
    console.error("Failed to save orders", e);
  }
}

export function sendOrderConfirmationEmail(order: Order) {
  if (typeof window === "undefined") return;

  fetch("/api/send-confirmation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ order }),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Server returned status code ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      console.log("Order confirmation email triggered successfully via Resend:", data);
    })
    .catch((err) => {
      // Do not block or fail the order checkout if email fails - just log
      console.error("Failed to send order confirmation email via Resend:", err);
    });
}

export function createOrder(
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  shippingAddress: string,
  items: CartItem[],
  subtotal: number,
  shipping: number,
  total: number,
  paymentStatus?: 'Paid' | 'Pending - COD'
): Order {
  const orders = getOrders();
  const newOrder: Order = {
    id: `ISH-${Math.floor(100000 + Math.random() * 900000)}`,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    items,
    subtotal,
    shipping,
    total,
    date: new Date().toISOString().split("T")[0],
    status: 'Processing',
    paymentStatus: paymentStatus || 'Pending - COD',
  };

  orders.unshift(newOrder); // Add to the beginning
  saveOrders(orders);
  clearCart(); // Clear cart after placing order
  
  // Send email confirmation
  sendOrderConfirmationEmail(newOrder);
  
  return newOrder;
}

export function updateOrderStatus(orderId: string, status: 'Processing' | 'Shipped' | 'Delivered') {
  const orders = getOrders();
  const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
  saveOrders(updated);
}

export function getOrderById(orderId: string): Order | null {
  const orders = getOrders();
  return orders.find((o) => o.id.toLowerCase() === orderId.toLowerCase()) || null;
}

export function useOrdersList() {
  const [orders, setOrders] = useState<Order[]>(() => getOrders());

  useEffect(() => {
    const handleUpdate = () => {
      setOrders(getOrders());
    };
    window.addEventListener(ORDERS_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(ORDERS_EVENT, handleUpdate);
    };
  }, []);

  return orders;
}
