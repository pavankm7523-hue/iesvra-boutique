import { createFileRoute } from "@tanstack/react-router";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/users")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const users = await getMetadataFromDb("global_registered_users");
          return new Response(JSON.stringify(users || []), {
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
            return new Response(JSON.stringify({ error: "Invalid data. Expected an array of users." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const success = await saveMetadataToDb("global_registered_users", list);
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
