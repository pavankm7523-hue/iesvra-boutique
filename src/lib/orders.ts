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
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Cancelled - Refund Pending';
  paymentStatus?: 'Paid' | 'Pending - COD';
  trackingId?: string;
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
    const parsed: Order[] = raw ? JSON.parse(raw) : [];
    
    // Auto-heal/backfill trackingId for older orders
    let updated = false;
    const healed = parsed.map(o => {
      if (!o.trackingId) {
        o.trackingId = `AZ${Math.floor(100000000 + Math.random() * 900000000)}IN`;
        updated = true;
      }
      return o;
    });

    if (updated) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(healed));
    }
    return healed;
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
      console.error("Failed to send order confirmation email via Resend:", err);
    });
}

export function sendAdminOrderNotification(order: Order) {
  if (typeof window === "undefined") return;

  fetch("/api/notify-admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Admin notify HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      console.log("Admin order notification sent:", data);
    })
    .catch((err) => {
      console.error("Admin order notification failed (non-blocking):", err);
    });
}

export function sendOrderShippedEmail(order: Order) {
  if (typeof window === "undefined") return;

  fetch("/api/send-shipped-email", {
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
      console.log("Order shipped email triggered successfully via Resend:", data);
    })
    .catch((err) => {
      console.error("Failed to send order shipped email via Resend:", err);
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
    trackingId: `AZ${Math.floor(100000000 + Math.random() * 900000000)}IN`,
  };

  orders.unshift(newOrder); // Add to the beginning
  saveOrders(orders);
  clearCart(); // Clear cart after placing order
  
  // Send customer confirmation email
  sendOrderConfirmationEmail(newOrder);
  
  // Send admin notification email
  sendAdminOrderNotification(newOrder);
  
  return newOrder;
}

export function updateOrderStatus(orderId: string, status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Cancelled - Refund Pending') {
  const orders = getOrders();
  const oldOrder = orders.find(o => o.id === orderId);
  const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
  saveOrders(updated);

  // If status is changed to Shipped, send the notification email automatically
  if (status === 'Shipped' && oldOrder && oldOrder.status !== 'Shipped') {
    const freshOrder = updated.find(o => o.id === orderId);
    if (freshOrder) {
      sendOrderShippedEmail(freshOrder);
    }
  }
}

export function updateOrderTracking(orderId: string, trackingId: string) {
  const orders = getOrders();
  const updated = orders.map((o) => (o.id === orderId ? { ...o, trackingId } : o));
  saveOrders(updated);

  // Sync with mobile app local storage
  if (typeof window !== "undefined") {
    try {
      const mobileRaw = localStorage.getItem("iesvra_orders");
      if (mobileRaw) {
        const mobileOrders = JSON.parse(mobileRaw);
        const mobileUpdated = mobileOrders.map((o: any) => {
          if (o.orderId === orderId) {
            return { ...o, trackingId };
          }
          return o;
        });
        localStorage.setItem("iesvra_orders", JSON.stringify(mobileUpdated));
      }
    } catch (e) {
      console.error("Failed to sync tracking ID to mobile app orders", e);
    }
  }

  // Trigger dispatch email notification
  const order = updated.find((o) => o.id === orderId);
  if (order) {
    sendOrderShippedEmail(order);
  }
}

export function cancelOrder(orderId: string): boolean {
  const orders = getOrders();
  const order = orders.find((o) => o.id.toLowerCase() === orderId.toLowerCase());
  if (!order) return false;
  if (order.status !== 'Processing') return false;

  const newStatus = order.paymentStatus === 'Paid' ? 'Cancelled - Refund Pending' : 'Cancelled';
  
  const updated = orders.map((o) => 
    o.id.toLowerCase() === orderId.toLowerCase() 
      ? { ...o, status: newStatus as any } 
      : o
  );
  saveOrders(updated);
  return true;
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
