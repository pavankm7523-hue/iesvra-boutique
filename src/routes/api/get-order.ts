import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/get-order")(({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const orderId = url.searchParams.get("id");

          if (!orderId) {
            return new Response(JSON.stringify({ error: "Missing order id" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const supaUrl = (process.env.SUPABASE_URL || "").trim();
          const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

          if (!supaUrl || !key) {
            return new Response(
              JSON.stringify({ error: "Server configuration error." }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const res = await fetch(
            `${supaUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
            {
              headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
              },
            }
          );

          if (!res.ok) {
            const errText = await res.text();
            return new Response(
              JSON.stringify({ error: `DB error: ${res.status} ${errText}` }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const list = await res.json();
          if (!list || list.length === 0) {
            return new Response(JSON.stringify(null), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          const row = list[0];
          const order = {
            id: String(row.id || ""),
            customerName: String(row.customer_name || ""),
            customerEmail: String(row.customer_email || ""),
            customerPhone: String(row.customer_phone || ""),
            shippingAddress: String(row.shipping_address || ""),
            items: Array.isArray(row.items)
              ? row.items
              : typeof row.items === "string"
              ? JSON.parse(row.items)
              : [],
            subtotal: Number(row.subtotal) || 0,
            shipping: Number(row.shipping) || 0,
            total: Number(row.total) || 0,
            date: String(row.date || ""),
            status: row.status || "Processing",
            paymentStatus: row.payment_status || undefined,
            trackingId: row.tracking_id || undefined,
            source: row.source || "website",
            latitude: row.latitude != null ? Number(row.latitude) : null,
            longitude: row.longitude != null ? Number(row.longitude) : null,
          };

          return new Response(JSON.stringify(order), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: err.message || "Unexpected error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
}) as any);
