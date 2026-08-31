import { createFileRoute } from "@tanstack/react-router";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";
import { hashPassword, verifyPassword } from "@/lib/password.server";
import { sessionCookie } from "@/lib/session.server";

function isAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return (
    normalized === "arenterprisess409@gmail.com" ||
    normalized === "ishvaraindiaa@gmail.com" ||
    normalized === "admin@iesvra.com"
  );
}

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { email, password } = body || {};

          if (!email || !password) {
            return new Response(
              JSON.stringify({ success: false, error: "Email and password are required." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const normalizedEmail = String(email).trim().toLowerCase();
          // 1. Check Administrator Login
          if (isAdminEmail(normalizedEmail)) {
            const adminPasswordRecord = await getMetadataFromDb("global_admin_password");
            const storedAdminPassword = typeof adminPasswordRecord === "string" && adminPasswordRecord ? adminPasswordRecord : "";
            
            let adminCheck = { valid: false, needsRehash: false };
            const DEFAULT_ADMIN_PASSWORD = "Iesvra@3104";
            
            if (storedAdminPassword) {
              adminCheck = await verifyPassword(String(password), storedAdminPassword);
            } else if (password === DEFAULT_ADMIN_PASSWORD) {
              // Fallback to default if not yet set in DB
              adminCheck = { valid: true, needsRehash: true };
            }

            if (adminCheck.valid) {
              if (adminCheck.needsRehash) await saveMetadataToDb("global_admin_password", await hashPassword(String(password)));
              return new Response(
                JSON.stringify({
                  success: true,
                  user: {
                    name: "IESVRA Admin",
                    email: normalizedEmail,
                    role: "admin",
                  },
                }),
                { status: 200, headers: { "Content-Type": "application/json", "Set-Cookie": sessionCookie({ name: "IESVRA Admin", email: normalizedEmail, role: "admin" }) } }
              );
            }
          }

          // 2. Check registered users in DB
          const users = (await getMetadataFromDb("global_registered_users")) || [];
          const userIndex = Array.isArray(users)
            ? users.findIndex((u: any) => (u.email || "").toLowerCase() === normalizedEmail)
            : -1;

          if (userIndex === -1) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Email address not found. Please sign up or check your spelling.",
              }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            );
          }

          const user = users[userIndex];

          // 3. OAuth-only accounts
          if (user.passwordHash === "oauth-login-only" || user.passwordHash === "social-auth-bypass-pass") {
            return new Response(
              JSON.stringify({
                success: false,
                isOAuthOnly: true,
                error: "This account was registered via Google. Please click 'Continue with Google' below or use 'Forgot password?' to set a password.",
              }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            );
          }

          // 4. Validate password (SHA256 or plaintext migration)
          const passwordCheck = await verifyPassword(String(password), String(user.passwordHash || ""));

          if (!passwordCheck.valid) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Incorrect password. Please try again or click 'Forgot password?'.",
              }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            );
          }

          // Transparently upgrade legacy SHA-256/plaintext records after a valid login.
          if (passwordCheck.needsRehash) {
            user.passwordHash = await hashPassword(String(password));
            await saveMetadataToDb("global_registered_users", users);
          }

          return new Response(
            JSON.stringify({
              success: true,
              user: {
                name: user.name,
                email: user.email,
                role: isAdminEmail(user.email) ? "admin" : (user.role || "user"),
                isPlusMember: user.isPlusMember,
                plusExpiry: user.plusExpiry,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json", "Set-Cookie": sessionCookie({ name: user.name, email: user.email, role: isAdminEmail(user.email) ? "admin" : "user", isPlusMember: user.isPlusMember, plusExpiry: user.plusExpiry }) } }
          );
        } catch (err: any) {
          console.error("[/api/auth/login] Error:", err);
          return new Response(
            JSON.stringify({ success: false, error: err.message || "Internal server error during login." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
