import process from "node:process";
import type { Order } from "./orders";

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url || !key) {
    throw new Error(
      "CRITICAL: Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are missing in environment variables."
    );
  }

  return { url, key };
}

function toCamelCase(dbOrder: any): Order {
  return {
    id: dbOrder.id,
    customerName: dbOrder.customer_name,
    customerEmail: dbOrder.customer_email,
    customerPhone: dbOrder.customer_phone,
    shippingAddress: dbOrder.shipping_address,
    items: dbOrder.items,
    subtotal: Number(dbOrder.subtotal),
    shipping: Number(dbOrder.shipping),
    total: Number(dbOrder.total),
    date: dbOrder.date,
    status: dbOrder.status,
    paymentStatus: dbOrder.payment_status,
    trackingId: dbOrder.tracking_id || undefined,
  };
}

function toSnakeCase(order: Partial<Order>): any {
  const dbData: any = {};
  if (order.id !== undefined) dbData.id = order.id;
  if (order.customerName !== undefined) dbData.customer_name = order.customerName;
  if (order.customerEmail !== undefined) dbData.customer_email = order.customerEmail;
  if (order.customerPhone !== undefined) dbData.customer_phone = order.customerPhone;
  if (order.shippingAddress !== undefined) dbData.shipping_address = order.shippingAddress;
  if (order.items !== undefined) dbData.items = order.items;
  if (order.subtotal !== undefined) dbData.subtotal = order.subtotal;
  if (order.shipping !== undefined) dbData.shipping = order.shipping;
  if (order.total !== undefined) dbData.total = order.total;
  if (order.date !== undefined) dbData.date = order.date;
  if (order.status !== undefined) dbData.status = order.status;
  if (order.paymentStatus !== undefined) dbData.payment_status = order.paymentStatus;
  if (order.trackingId !== undefined) dbData.tracking_id = order.trackingId;
  return dbData;
}

export async function fetchAllOrdersFromDb(): Promise<Order[]> {
  const { url, key } = getSupabaseConfig();
  const res = await fetch(`${url}/rest/v1/orders?select=*`, {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch orders from database: ${res.status} ${errorText}`);
  }

  const list = await res.json();
  // Sort descending by date/id
  return list.map(toCamelCase).sort((a: Order, b: Order) => b.id.localeCompare(a.id));
}

export async function fetchOrderByIdFromDb(orderId: string): Promise<Order | null> {
  const { url, key } = getSupabaseConfig();
  const res = await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=*`, {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch order ${orderId}: ${res.status} ${errorText}`);
  }

  const list = await res.json();
  if (list.length === 0) return null;
  return toCamelCase(list[0]);
}

export async function insertOrderIntoDb(order: Order): Promise<Order> {
  const { url, key } = getSupabaseConfig();
  const dbData = toSnakeCase(order);

  const res = await fetch(`${url}/rest/v1/orders`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(dbData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to save order to database: ${res.status} ${errorText}`);
  }

  try {
    const list = await res.json();
    if (list && list.length > 0) {
      return toCamelCase(list[0]);
    }
  } catch (e) {
    console.warn("Could not parse returned order representation, returning input order directly:", e);
  }
  return order;
}

export async function updateOrderInDb(orderId: string, patch: Partial<Order>): Promise<Order> {
  const { url, key } = getSupabaseConfig();
  const dbData = toSnakeCase(patch);

  const res = await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(dbData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update order ${orderId}: ${res.status} ${errorText}`);
  }

  const list = await res.json();
  if (list.length === 0) {
    throw new Error(`Order ${orderId} not found for update.`);
  }
  return toCamelCase(list[0]);
}
