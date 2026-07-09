import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/send-otp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { email, otp } = body;

          if (!email || typeof email !== "string" || !email.includes("@")) {
            return new Response(
              JSON.stringify({ error: "A valid email address is required." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          if (!otp || typeof otp !== "string") {
            return new Response(
              JSON.stringify({ error: "OTP is required." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const apiKey = (process.env.RESEND_API_KEY || "").trim();
          if (!apiKey) {
            console.warn("RESEND_API_KEY not set — OTP email skipped.");
            return new Response(
              JSON.stringify({ warning: "Email service not configured." }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>IESVRA Password Reset OTP</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Inter',system-ui,sans-serif;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f0f2f5;padding:40px 0;">
                <tr><td align="center">
                  <table border="0" cellpadding="0" cellspacing="0" width="520" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e5e7eb;">

                    <!-- Header -->
                    <tr>
                      <td style="background-color:#0b121e;padding:28px 32px;border-bottom:4px solid #e6b96e;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;letter-spacing:0.06em;font-family:'Outfit',sans-serif;text-transform:uppercase;">IESVRA</h1>
                              <p style="color:#e6b96e;margin:4px 0 0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;">Account Security</p>
                            </td>
                            <td align="right">
                              <div style="background-color:#e6b96e;color:#0b121e;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;display:inline-block;">🔐 OTP Code</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:32px;">
                        <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0b121e;">Password Reset Request</p>
                        <p style="margin:0 0 28px;font-size:13px;color:#6b7280;line-height:1.6;">
                          We received a request to reset the password for your IESVRA account. Use the verification code below to proceed. This code is valid for <strong>10 minutes</strong>.
                        </p>

                        <!-- OTP Box -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                          <tr>
                            <td align="center">
                              <div style="background:linear-gradient(135deg,#fdf8f0,#fef9f2);border:2px dashed #e6b96e;border-radius:14px;padding:28px 24px;display:inline-block;min-width:200px;text-align:center;">
                                <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#9ca3af;font-weight:600;">Your OTP Code</p>
                                <p style="margin:0;font-size:42px;font-weight:900;color:#0b121e;letter-spacing:0.2em;font-family:'Courier New',monospace;">${otp}</p>
                              </div>
                            </td>
                          </tr>
                        </table>

                        <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
                          <p style="margin:0;font-size:12px;color:#b91c1c;font-weight:600;">⚠️ Security Notice</p>
                          <p style="margin:6px 0 0;font-size:12px;color:#dc2626;line-height:1.5;">
                            Never share this code with anyone. IESVRA will never ask for your OTP via phone or email. If you did not request this, please ignore this email — your account is safe.
                          </p>
                        </div>

                        <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                          This OTP was requested for <strong style="color:#0b121e;">${email}</strong>. If this wasn't you, no action is needed.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color:#f8f9fb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
                        <p style="margin:0;font-size:11px;color:#9ca3af;">© 2026 IESVRA. This is an automated security email.</p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
          `;

          const resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "IESVRA Security <no-reply@iesvra.com>",
              to: email.trim().toLowerCase(),
              subject: `🔐 Your IESVRA Password Reset Code: ${otp}`,
              html: emailHtml,
            }),
          });

          const resendData = await resendRes.json();
          if (!resendRes.ok) {
            console.error("Resend OTP email error:", resendData);
            return new Response(
              JSON.stringify({ error: resendData.message || "Failed to send OTP email." }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          console.log(`OTP email sent to ${email} — Resend ID: ${resendData.id}`);
          return new Response(
            JSON.stringify({ success: true, id: resendData.id }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err: any) {
          console.error("OTP send endpoint error:", err);
          return new Response(
            JSON.stringify({ error: err.message || "Internal server error." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
