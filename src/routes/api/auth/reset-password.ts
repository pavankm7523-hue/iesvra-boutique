import { createFileRoute } from "@tanstack/react-router";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";
import { hashPassword } from "@/lib/password.server";
import { verifyPasswordResetOtp } from "@/lib/passwordReset.server";

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
          const { email, newPassword, otp } = body || {};

          if (!email || !newPassword || !otp) {
            return new Response(
              JSON.stringify({ success: false, error: "Email, OTP, and new password are required." }),
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
          if (!(await verifyPasswordResetOtp(normalizedEmail, String(otp), true))) {
            return new Response(JSON.stringify({ success: false, error: "Invalid or expired OTP." }), { status: 401, headers: { "Content-Type": "application/json" } });
          }
          const newHash = await hashPassword(String(newPassword));

          const users = (await getMetadataFromDb("global_registered_users")) || [];
          const userIndex = Array.isArray(users)
            ? users.findIndex((u: any) => (u.email || "").toLowerCase() === normalizedEmail)
            : -1;

          if (userIndex !== -1) {
            users[userIndex].passwordHash = newHash;
            await saveMetadataToDb("global_registered_users", users);
          } else if (!isAdminEmail(normalizedEmail)) {
            return new Response(JSON.stringify({ success: false, error: "Account not found." }), { status: 404, headers: { "Content-Type": "application/json" } });
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
