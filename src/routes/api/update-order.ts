import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/update-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { id, status, trackingId } = body;

          if (!id) {
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

          // Build patch data
          const patch: any = {};
          if (status !== undefined) patch.status = status;
          if (trackingId !== undefined) patch.tracking_id = trackingId;

          // Perform PATCH request to Supabase
          const res = await fetch(
            `${supaUrl}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`,
            {
              method: "PATCH",
              headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
                Prefer: "return=representation",
              },
              body: JSON.stringify(patch),
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
            return new Response(
              JSON.stringify({ error: "Order not found" }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }

          if (status === "Delivered") {
            const deliveryDates = await getMetadataFromDb("global_order_delivery_dates");
            const nextDeliveryDates = {
              ...(deliveryDates && typeof deliveryDates === "object" ? deliveryDates : {}),
              [id]: deliveryDates?.[id] || new Date().toISOString(),
            };
            await saveMetadataToDb("global_order_delivery_dates", nextDeliveryDates);
          }

          // Return success
          return new Response(JSON.stringify({ success: true }), {
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
