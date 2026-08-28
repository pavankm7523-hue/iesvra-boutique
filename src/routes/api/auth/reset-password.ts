import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function isAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return (
    normalized === "arenterprisess409@gmail.com" ||
    normalized === "ishvaraindiaa@gmail.com" ||
    normalized === "admin@iesvra.com"
  );
}

export const Route = createFileRoute("/api/auth/reset-password")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { email, newPassword } = body || {};

          if (!email || !newPassword) {
            return new Response(
              JSON.stringify({ success: false, error: "Email and new password are required." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          if (String(newPassword).length < 8) {
            return new Response(
              JSON.stringify({ success: false, error: "Password must be at least 8 characters long." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const normalizedEmail = String(email).trim().toLowerCase();
          const newHash = hashPassword(newPassword);

          const users = (await getMetadataFromDb("global_registered_users")) || [];
          const userIndex = Array.isArray(users)
            ? users.findIndex((u: any) => (u.email || "").toLowerCase() === normalizedEmail)
            : -1;

          if (userIndex !== -1) {
            users[userIndex].passwordHash = newHash;
            await saveMetadataToDb("global_registered_users", users);
          } else {
            // User did not exist in array yet, create new record
            users.push({
              name: normalizedEmail.split("@")[0],
              email: normalizedEmail,
              passwordHash: newHash,
              role: isAdminEmail(normalizedEmail) ? "admin" : "user",
            });
            await saveMetadataToDb("global_registered_users", users);
          }

          if (isAdminEmail(normalizedEmail)) {
            await saveMetadataToDb("global_admin_password", newHash);
          }

          return new Response(
            JSON.stringify({ success: true, message: "Password updated successfully." }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err: any) {
          console.error("[/api/auth/reset-password] Error:", err);
          return new Response(
            JSON.stringify({ success: false, error: err.message || "Failed to reset password." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
