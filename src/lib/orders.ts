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

  const itemsListText = order.items
    .map(
      (item) =>
        `- ${item.name} ${item.color && item.color !== "Standard" ? `(Color: ${item.color})` : ""} - ${item.quantity}x @ ₹${item.price.toLocaleString()} = ₹${(
          item.price * item.quantity
        ).toLocaleString()}`
    )
    .join("\n");

  const bodyContent = `Hi ${order.customerName},\n\nThank you for shopping at IESVRA! Your order has been placed successfully and is currently being processed.\n\n=== ORDER DETAILS ===\nOrder ID: ${order.id}\nDate: ${order.date}\nPayment Status: Confirmed / Paid\n\n=== ITEMS PURCHASED ===\n${itemsListText}\n\nSubtotal: ₹${order.subtotal.toLocaleString()}\nShipping: ${order.shipping === 0 ? "Free" : `₹${order.shipping.toLocaleString()}`}\nTotal Amount: ₹${order.total.toLocaleString()}\n\n=== SHIPPING ADDRESS ===\n${order.shippingAddress}\nPhone Number: ${order.customerPhone}\n\n=== TRACK YOUR ORDER ===\nYou can track the shipping progress of your package by visiting:\n${window.location.origin}/track-order?orderId=${order.id}\n\nThank you for your trust in IESVRA.\n\nWarm regards,\nIESVRA Boutique Support`;

  fetch(`https://formsubmit.co/ajax/${order.customerEmail.trim()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      _subject: `IESVRA - Order Confirmation #${order.id}`,
      name: "IESVRA Boutique Support",
      message: bodyContent,
      _template: "box",
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Order confirmation email sent successfully via FormSubmit:", data);
    })
    .catch((err) => {
      console.error("Failed to send order confirmation email:", err);
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
  total: number
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
