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

function parseItems(raw: any): any[] {
  // Supabase JSONB can return items as a string or as an array.
  // Normalize to a plain JS array either way.
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  if (Array.isArray(raw)) return raw;
  return [];
}

function toCamelCase(dbOrder: any): Order {
  return {
    id: String(dbOrder.id || ""),
    customerName: String(dbOrder.customer_name || ""),
    customerEmail: String(dbOrder.customer_email || ""),
    customerPhone: String(dbOrder.customer_phone || ""),
    shippingAddress: String(dbOrder.shipping_address || ""),
    items: parseItems(dbOrder.items),
    subtotal: Number(dbOrder.subtotal) || 0,
    shipping: Number(dbOrder.shipping) || 0,
    total: Number(dbOrder.total) || 0,
    date: String(dbOrder.date || ""),
    status: (dbOrder.status || "Processing") as Order["status"],
    paymentStatus: (dbOrder.payment_status || undefined) as Order["paymentStatus"],
    trackingId: dbOrder.tracking_id ? String(dbOrder.tracking_id) : undefined,
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

  // Ensure items is always a plain array (never a string) before sending to Supabase
  if (typeof dbData.items === "string") {
    try { dbData.items = JSON.parse(dbData.items); } catch { dbData.items = []; }
  }

  console.log("[db] Inserting order:", order.id, "items count:", Array.isArray(dbData.items) ? dbData.items.length : "?");

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

  console.log("[db] Supabase insert response status:", res.status);

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[db] Supabase insert failed:", res.status, errorText);
    throw new Error(`Failed to save order to database: ${res.status} ${errorText}`);
  }

  try {
    const list = await res.json();
    if (list && list.length > 0) {
      return toCamelCase(list[0]);
    }
  } catch (e) {
    console.warn("[db] Could not parse returned order representation, returning sanitized input order:", e);
  }
  // Return a sanitized version of the input order (primitive types only, no complex objects)
  return toCamelCase({
    id: order.id,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    shipping_address: order.shippingAddress,
    items: order.items,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    date: order.date,
    status: order.status,
    payment_status: order.paymentStatus,
    tracking_id: order.trackingId,
  });
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

export async function getMetadataFromDb(keyStr: string): Promise<any | null> {
  const { url, key } = getSupabaseConfig();
  const res = await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(keyStr)}&select=*`, {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) {
    return null;
  }

  const list = await res.json();
  if (list.length === 0) return null;
  
  // If it's a string, try parsing it, otherwise return directly
  const raw = list[0].items;
  if (!raw) return null;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw;
}

export async function saveMetadataToDb(keyStr: string, data: any): Promise<boolean> {
  const { url, key } = getSupabaseConfig();
  const mockRecord = {
    id: keyStr,
    customer_name: "Metadata Store",
    customer_email: "metadata@iesvra.com",
    customer_phone: "0000000000",
    shipping_address: "Global System Configuration",
    items: data, // JSONB
    subtotal: 0,
    shipping: 0,
    total: 0,
    date: new Date().toISOString(),
    status: "Processing",
    payment_status: "Pending"
  };

  // Upsert pattern
  await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(keyStr)}`, {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });

  const res = await fetch(`${url}/rest/v1/orders`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(mockRecord)
  });

  return res.ok;
}
