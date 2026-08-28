import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/diag")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(JSON.stringify({
          status: "ok",
          supabaseUrlExists: !!process.env.SUPABASE_URL,
          supabaseKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }
});
