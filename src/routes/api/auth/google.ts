import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/auth/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
        if (!clientId || clientId === "your_google_client_id_here") {
          return new Response(
            `<html>
              <body style="font-family: sans-serif; padding: 2rem; max-width: 500px; margin: auto; color: #1e293b;">
                <div style="border: 1px solid #e2e8f0; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                  <h2 style="color: #ef4444; margin-top: 0;">Configuration Required</h2>
                  <p>Google OAuth is not configured yet.</p>
                  <p>Please edit the <code>.env</code> file in the project root and add your actual credentials:</p>
                  <pre style="background: #f1f5f9; padding: 1rem; border-radius: 4px; overflow-x: auto;">GOOGLE_CLIENT_ID=your_actual_client_id\nGOOGLE_CLIENT_SECRET=your_actual_client_secret</pre>
                  <p style="margin-bottom: 0;"><a href="/login" style="color: #2563eb; text-decoration: none;">&larr; Return to Login</a></p>
                </div>
              </body>
            </html>`,
            { status: 500, headers: { "Content-Type": "text/html" } }
          );
        }

        const url = new URL(request.url);
        const origin = url.origin;
        const redirectUri = `${origin}/api/auth/google-callback`;

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", "openid email profile");
        authUrl.searchParams.set("prompt", "select_account");

        return new Response(null, {
          status: 302,
          headers: {
            Location: authUrl.toString(),
          },
        });
      },
    },
  },
});
