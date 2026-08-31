import { createFileRoute } from "@tanstack/react-router";
import { clearSessionCookie } from "@/lib/session.server";

export const Route = createFileRoute("/api/auth/logout")({ server: { handlers: {
  POST: async () => new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie(), "Cache-Control": "no-store" },
  }),
} } });
