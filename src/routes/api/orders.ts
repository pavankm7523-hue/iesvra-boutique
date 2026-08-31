import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

function parseItems(raw: any): any[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  if (Array.isArray(raw)) return raw;
  return [];
}

function toCamelCase(dbOrder: any) {
  return {
    id: String(dbOrder.id || ""),
    customerName: String(dbOrder.customer_name || dbOrder.name || ""),
    customerEmail: String(dbOrder.customer_email || dbOrder.email || ""),
    customerPhone: String(dbOrder.customer_phone || dbOrder.phone || ""),
    shippingAddress: String(dbOrder.shipping_address || dbOrder.address || ""),
    items: parseItems(dbOrder.items),
    subtotal: Number(dbOrder.subtotal) || 0,
    shipping: Number(dbOrder.shipping) || 0,
    total: Number(dbOrder.total) || 0,
    date: String(dbOrder.date || ""),
    status: dbOrder.status || "Processing",
    paymentStatus: dbOrder.payment_status || "Pending - COD",
    trackingId: dbOrder.tracking_id || undefined,
    source: dbOrder.source || "website",
    latitude: dbOrder.latitude !== undefined && dbOrder.latitude !== null ? Number(dbOrder.latitude) : null,
    longitude: dbOrder.longitude !== undefined && dbOrder.longitude !== null ? Number(dbOrder.longitude) : null,
  };
}

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const email = url.searchParams.get("email")?.trim().toLowerCase();

          const supaUrl = (process.env.SUPABASE_URL || "").trim();
          const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

          if (!supaUrl || !key) {
            return new Response(
              JSON.stringify({ error: "Database configuration missing." }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          let queryUrl = `${supaUrl}/rest/v1/orders?select=*&order=id.desc`;
          if (email) {
            queryUrl = `${supaUrl}/rest/v1/orders?customer_email=ilike.${encodeURIComponent(email)}&order=id.desc&select=*`;
          }

          const res = await fetch(queryUrl, {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
            },
          });

          if (!res.ok) {
            const errText = await res.text();
            return new Response(
              JSON.stringify({ error: `DB error: ${res.status} ${errText}` }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const rawList = await res.json();
          // Filter out metadata and history records
          const filtered = Array.isArray(rawList)
            ? rawList
                .filter((r: any) => !r.id?.startsWith("global_") && !r.id?.startsWith("history_") && !r.id?.startsWith("backup_"))
                .map(toCamelCase)
            : [];

          return new Response(JSON.stringify(filtered), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          });
        } catch (err: any) {
          console.error("[/api/orders] Error:", err);
          return new Response(
            JSON.stringify({ error: err.message || "Failed to load orders." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
