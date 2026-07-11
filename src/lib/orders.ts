import type { CartItem } from "./cart";
import { clearCart } from "./cart";
import { useState, useEffect } from "react";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Helper to conditional import server-only database code to avoid bundle errors
const getDbModule = async () => {
  if (typeof window === "undefined") {
    return await import("./db.server");
  }
  return null;
};

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
  source?: 'website' | 'mobile';
  latitude?: number | null;
  longitude?: number | null;
}

const ORDERS_EVENT = "IESVRA_orders_changed";

function triggerOrdersChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORDERS_EVENT));
  }
}

// Server functions to communicate securely with Supabase REST API
export const getOrdersServer = createServerFn({ method: "GET" })
  .handler(async () => {
    const db = await import("./db.server");
    return await db.fetchAllOrdersFromDb();
  });

export const getOrderByIdServer = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .handler(async ({ data: orderId }) => {
    const db = await import("./db.server");
    return await db.fetchOrderByIdFromDb(orderId);
  });

const OrderSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  customerPhone: z.string(),
  shippingAddress: z.string(),
  items: z.array(z.record(z.any())),
  subtotal: z.number(),
  shipping: z.number(),
  total: z.number(),
  date: z.string(),
  status: z.string(),
  paymentStatus: z.string().optional(),
  trackingId: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export const createOrderServer = createServerFn({ method: "POST" })
  .inputValidator(OrderSchema)
  .handler(async ({ data: order }) => {
    const db = await import("./db.server");
    return await db.insertOrderIntoDb(order as any);
  });

export const updateOrderStatusServer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), status: z.string() }))
  .handler(async ({ data }) => {
    const db = await import("./db.server");
    return await db.updateOrderInDb(data.id, { status: data.status as any });
  });

export const updateOrderTrackingServer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), trackingId: z.string() }))
  .handler(async ({ data }) => {
    const db = await import("./db.server");
    return await db.updateOrderInDb(data.id, { trackingId: data.trackingId });
  });

// Client wrappers mapping database models to client hooks
export async function getOrders(): Promise<Order[]> {
  try {
    return await getOrdersServer();
  } catch (e) {
    console.error("Failed to load orders from database:", e);
    return [];
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

export async function createOrder(
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  shippingAddress: string,
  items: CartItem[],
  subtotal: number,
  shipping: number,
  total: number,
  paymentStatus?: 'Paid' | 'Pending - COD',
  latitude?: number | null,
  longitude?: number | null,
  source: 'website' | 'mobile' = 'website'
): Promise<Order> {
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
    source,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
  };

  // Sanitize the order through JSON roundtrip to strip any `undefined` optional
  // fields (e.g. bannerId, saleEndDate on CartItem) before sending.
  const sanitizedOrder = JSON.parse(JSON.stringify(newOrder)) as Order;

  // Use plain fetch to /api/save-order instead of createOrderServer (seroval
  // has issues serializing complex nested objects with optional fields).
  const res = await fetch("/api/save-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sanitizedOrder),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: "Failed to place order." }));
    throw new Error(errData.error || `Server error ${res.status}`);
  }

  const savedOrder = await res.json() as Order;
  clearCart(); // Clear cart after placing order
  triggerOrdersChange();
  
  // Send customer confirmation email
  sendOrderConfirmationEmail(savedOrder);
  
  // Send admin notification email
  sendAdminOrderNotification(savedOrder);
  
  return savedOrder;
}

export async function updateOrderStatus(orderId: string, status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Cancelled - Refund Pending') {
  const oldOrder = await getOrderById(orderId);
  
  // Use direct fetch to /api/update-order to avoid createServerFn SSR caching issues
  const res = await fetch("/api/update-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: orderId, status })
  });
  if (!res.ok) throw new Error("Failed to update order status");
  
  const updatedOrder = await getOrderById(orderId);
  triggerOrdersChange();

  // If status is changed to Shipped, send the notification email automatically
  if (status === 'Shipped' && oldOrder && oldOrder.status !== 'Shipped' && updatedOrder) {
    sendOrderShippedEmail(updatedOrder);
  }
  return updatedOrder;
}

export async function updateOrderTracking(orderId: string, trackingId: string) {
  // Use direct fetch to /api/update-order to avoid createServerFn SSR caching issues
  const res = await fetch("/api/update-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: orderId, trackingId })
  });
  if (!res.ok) throw new Error("Failed to update order tracking");

  const updatedOrder = await getOrderById(orderId);
  triggerOrdersChange();

  // Sync with mobile app local storage if they are on the same client browser
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
  if (updatedOrder) {
    sendOrderShippedEmail(updatedOrder);
  }
  return updatedOrder;
}

export async function deleteOrder(orderId: string): Promise<void> {
  const res = await fetch("/api/delete-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: orderId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete order");
  }
  triggerOrdersChange();
}

export async function cancelOrder(orderId: string): Promise<boolean> {
  const order = await getOrderById(orderId);
  if (!order) return false;
  if (order.status !== 'Processing') return false;

  const newStatus = order.paymentStatus === 'Paid' ? 'Cancelled - Refund Pending' : 'Cancelled';
  
  // Use direct fetch to /api/update-order to avoid createServerFn SSR caching issues
  const res = await fetch("/api/update-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: orderId, status: newStatus })
  });
  if (!res.ok) return false;

  triggerOrdersChange();
  return true;
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    // Use direct fetch to /api/get-order to avoid createServerFn SSR caching issues
    const res = await fetch(`/api/get-order?id=${encodeURIComponent(orderId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data as Order | null;
  } catch (e) {
    console.error(`Failed to get order by ID ${orderId}:`, e);
    return null;
  }
}

export function useOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    try {
      const list = await getOrders();
      setOrders(list);
    } catch (e) {
      console.error("Failed to load orders:", e);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleUpdate = () => {
      fetchOrders();
    };
    window.addEventListener(ORDERS_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(ORDERS_EVENT, handleUpdate);
    };
  }, []);

  return orders;
}
