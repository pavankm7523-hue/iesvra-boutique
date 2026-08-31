import { createFileRoute } from "@tanstack/react-router";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";
import { requireAdmin } from "@/lib/session.server";

export const Route = createFileRoute("/api/hero")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const banners = await getMetadataFromDb("global_hero_banners");
          return new Response(JSON.stringify(banners || []), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-store, no-cache, must-revalidate",
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
        const forbidden = requireAdmin(request); if (forbidden) return forbidden;
        try {
          const list = await request.json();
          if (!Array.isArray(list)) {
            return new Response(JSON.stringify({ error: "Invalid data. Expected an array of hero banners." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const success = await saveMetadataToDb("global_hero_banners", list);
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
