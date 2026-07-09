import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/diag")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(JSON.stringify({
          supabaseUrlExists: !!process.env.SUPABASE_URL,
          supabaseKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          supabaseUrlLength: (process.env.SUPABASE_URL || "").length,
          supabaseKeyLength: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").length,
          supabaseUrlPrefix: (process.env.SUPABASE_URL || "").substring(0, 15),
          supabaseKeyPrefix: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").substring(0, 15),
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }
});
