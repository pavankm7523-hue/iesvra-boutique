import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/get-order")({
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
            `${supaUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
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

          const order = list[0];
          // Convert database snake_case fields back to CamelCase for the frontend
          const result = {
            id: order.id,
            name: order.name,
            email: order.email,
            phone: order.phone,
            addressLine1: order.address_line1,
            addressLine2: order.address_line2,
            city: order.city,
            state: order.state,
            pincode: order.pincode,
            deliverySpeed: order.delivery_speed,
            paymentMethod: order.payment_method,
            items: order.items,
            subtotal: order.subtotal,
            shipping: order.shipping,
            total: order.total,
            date: order.date,
            status: order.status,
            paymentStatus: order.payment_status,
            trackingId: order.tracking_id,
            latitude: order.latitude,
            longitude: order.longitude,
          };

          return new Response(JSON.stringify(result), {
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
});
