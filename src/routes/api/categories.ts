import { createFileRoute } from "@tanstack/react-router";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/categories")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const categories = await getMetadataFromDb("global_categories");
          return new Response(JSON.stringify(categories || []), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
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
          const list = await request.json();
          if (!Array.isArray(list)) {
            return new Response(JSON.stringify({ error: "Invalid data. Expected an array of categories." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const success = await saveMetadataToDb("global_categories", list);
          return new Response(JSON.stringify({ success }), {
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
