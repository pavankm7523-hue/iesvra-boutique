import { createFileRoute } from "@tanstack/react-router";
import { readSession } from "@/lib/session.server";

export const Route = createFileRoute("/api/auth/session")({ server: { handlers: {
  GET: async ({ request }) => new Response(JSON.stringify({ user: readSession(request) }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  }),
} } });
