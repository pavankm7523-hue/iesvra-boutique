import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/save-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const order = await request.json();

          if (!order || !order.id || !order.customerName) {
            return new Response(
              JSON.stringify({ error: "Invalid order data." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const url = (process.env.SUPABASE_URL || "").trim();
          const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

          if (!url || !key) {
            return new Response(
              JSON.stringify({ error: "Server configuration error: missing Supabase credentials." }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          // Optional Plus Membership verification log for audit
          const appliedCoupon = String(order.appliedCoupon || order.couponCode || "").toUpperCase();
          if (appliedCoupon.includes("IESVRAPLUS")) {
            console.log("[save-order] Order includes IESVRA Plus perk:", order.customerEmail);
          }

          // Convert camelCase order to snake_case for Supabase
          const dbData = {
            id: order.id,
            customer_name: order.customerName,
            customer_email: order.customerEmail,
            customer_phone: order.customerPhone,
            shipping_address: order.shippingAddress,
            items: Array.isArray(order.items) ? order.items : [],
            subtotal: Number(order.subtotal) || 0,
            shipping: Number(order.shipping) || 0,
            total: Number(order.total) || 0,
            date: order.date,
            status: order.status || "Processing",
            payment_status: order.paymentStatus || "Pending - COD",
            tracking_id: order.trackingId || null,
            source: order.source || "website",
            latitude: order.latitude != null ? Number(order.latitude) : null,
            longitude: order.longitude != null ? Number(order.longitude) : null,
          };

          console.log("[save-order] Inserting order:", dbData.id);

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

          console.log("[save-order] Supabase response status:", res.status);

          if (!res.ok) {
            const errorText = await res.text();
            console.error("[save-order] Supabase error:", errorText);
            return new Response(
              JSON.stringify({ error: `Database error: ${res.status} ${errorText}` }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const list = await res.json();
          const savedRow = list && list.length > 0 ? list[0] : dbData;

          // Decrement product stock for each ordered item
          try {
            const currentProducts = await getMetadataFromDb("global_products");
            if (Array.isArray(currentProducts) && currentProducts.length > 0) {
              const orderItems = Array.isArray(order.items) ? order.items : [];
              let updated = false;
              const updatedProducts = currentProducts.map((p: any) => {
                const matchItem = orderItems.find(
                  (it: any) => String(it.id || it.productId) === String(p.id)
                );
                if (matchItem) {
                  const qty = Number(matchItem.quantity) || 1;
                  const currentStock = typeof p.stock === "number" ? p.stock : 50;
                  const newStock = Math.max(0, currentStock - qty);
                  updated = true;
                  return { ...p, stock: newStock };
                }
                return p;
              });

              if (updated) {
                await saveMetadataToDb("global_products", updatedProducts);
                console.log("[save-order] Successfully decremented stock for order items.");
              }
            }
          } catch (stockErr) {
            console.error("[save-order] Failed to update product stock:", stockErr);
          }

          // Return camelCase order to client
          const savedOrder = {
            id: String(savedRow.id || order.id),
            customerName: String(savedRow.customer_name || order.customerName),
            customerEmail: String(savedRow.customer_email || order.customerEmail),
            customerPhone: String(savedRow.customer_phone || order.customerPhone),
            shippingAddress: String(savedRow.shipping_address || order.shippingAddress),
            items: Array.isArray(savedRow.items) ? savedRow.items : order.items,
            subtotal: Number(savedRow.subtotal) || order.subtotal,
            shipping: Number(savedRow.shipping) || order.shipping,
            total: Number(savedRow.total) || order.total,
            date: String(savedRow.date || order.date),
            status: savedRow.status || order.status,
            paymentStatus: savedRow.payment_status || order.paymentStatus,
            trackingId: savedRow.tracking_id || order.trackingId,
            source: savedRow.source || order.source || "website",
            latitude: savedRow.latitude != null ? Number(savedRow.latitude) : null,
            longitude: savedRow.longitude != null ? Number(savedRow.longitude) : null,
          };

          return new Response(JSON.stringify(savedOrder), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("[save-order] Unexpected error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Failed to save order." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
