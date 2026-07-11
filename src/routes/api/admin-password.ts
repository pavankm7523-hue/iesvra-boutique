import { createFileRoute } from "@tanstack/react-router";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/admin-password")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const passData = await getMetadataFromDb("global_admin_password");
          return new Response(JSON.stringify(passData || null), {
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
          const { password } = await request.json();
          if (!password) {
            return new Response(JSON.stringify({ error: "Missing password." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const success = await saveMetadataToDb("global_admin_password", password);
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
