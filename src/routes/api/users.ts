import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/users")({
  server: {
    handlers: {
      GET: async () => new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }),
      POST: async () => new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }),
    },
  },
});
