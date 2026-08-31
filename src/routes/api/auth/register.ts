import { createFileRoute } from "@tanstack/react-router";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";
import { hashPassword } from "@/lib/password.server";
import { sessionCookie } from "@/lib/session.server";

function isAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return (
    normalized === "arenterprisess409@gmail.com" ||
    normalized === "ishvaraindiaa@gmail.com" ||
    normalized === "admin@iesvra.com"
  );
}

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { name, email, password } = body || {};

          if (!name || !email || !password) {
            return new Response(
              JSON.stringify({ success: false, error: "Name, email, and password are required." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          if (String(password).length < 8) {
            return new Response(
              JSON.stringify({ success: false, error: "Password must be at least 8 characters long." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const normalizedEmail = String(email).trim().toLowerCase();
          const trimmedName = String(name).trim();

          const users = (await getMetadataFromDb("global_registered_users")) || [];
          const exists = Array.isArray(users) && users.some(
            (u: any) => (u.email || "").toLowerCase() === normalizedEmail
          );

          if (exists) {
            return new Response(
              JSON.stringify({ success: false, error: "An account with this email already exists. Please log in." }),
              { status: 409, headers: { "Content-Type": "application/json" } }
            );
          }

          const role: "admin" | "user" = isAdminEmail(normalizedEmail) ? "admin" : "user";
          const newUser = {
            name: trimmedName,
            email: normalizedEmail,
            passwordHash: await hashPassword(String(password)),
            role,
          };

          users.push(newUser);
          await saveMetadataToDb("global_registered_users", users);

          return new Response(
            JSON.stringify({
              success: true,
              user: {
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json", "Set-Cookie": sessionCookie({ name: newUser.name, email: newUser.email, role: newUser.role }) } }
          );
        } catch (err: any) {
          console.error("[/api/auth/register] Error:", err);
          return new Response(
            JSON.stringify({ success: false, error: err.message || "Failed to register account." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
