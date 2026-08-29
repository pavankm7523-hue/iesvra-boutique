import { createFileRoute } from "@tanstack/react-router";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/products")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const products = await getMetadataFromDb("global_products");
          return new Response(JSON.stringify(products || []), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
              "Pragma": "no-cache",
              "Expires": "0",
            },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      POST: async ({ request }) => {
        try {
          const payload = await request.json();
          let list: any[];

          if (Array.isArray(payload)) {
            // Backward compatibility for existing bulk category operations.
            list = payload;
          } else if (payload?.action === "upsert" && payload.product?.id) {
            const current = await getMetadataFromDb("global_products");
            const existing = Array.isArray(current) ? current : [];
            list = [payload.product, ...existing.filter((product: any) => product?.id !== payload.product.id)];
          } else if (payload?.action === "delete" && payload.id) {
            const current = await getMetadataFromDb("global_products");
            const existing = Array.isArray(current) ? current : [];
            list = existing.filter((product: any) => product?.id !== payload.id);
          } else {
            return new Response(JSON.stringify({ error: "Invalid product mutation." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const success = await saveMetadataToDb("global_products", list);
          return new Response(JSON.stringify({ success, count: list.length }), {
            status: success ? 200 : 500,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
