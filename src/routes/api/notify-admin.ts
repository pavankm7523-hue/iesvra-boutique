import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/notify-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { order } = body;

          if (!order || !order.id) {
            return new Response(
              JSON.stringify({ error: "Missing order details." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const apiKey = (process.env.RESEND_API_KEY || "").trim();
          const adminEmail = (process.env.ADMIN_EMAIL || "arenterprisess409@gmail.com").trim();

          if (!apiKey) {
            console.warn("RESEND_API_KEY not set - admin notification skipped.");
            return new Response(
              JSON.stringify({ warning: "No API key - skipped." }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          const itemsHtml = order.items
            .map(
              (item: any) => `
              <tr>
                <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#13192b;">${item.name}${item.color && item.color !== "Standard" ? ` <span style="color:#9ca3af;font-size:11px;">(${item.color})</span>` : ""}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;color:#13192b;">x${item.quantity}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-weight:700;color:#13192b;">₹${(item.price * item.quantity).toLocaleString()}</td>
              </tr>`
            )
            .join("");

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New Order - IESVRA</title></head>
            <body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Inter',system-ui,sans-serif;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f0f2f5;padding:32px 0;">
                <tr><td align="center">
                  <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e5e7eb;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background-color:#13192b;padding:28px 32px;border-bottom:4px solid #e6b96e;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;letter-spacing:0.06em;font-family:'Outfit',sans-serif;text-transform:uppercase;">IESVRA</h1>
                              <p style="color:#e6b96e;margin:4px 0 0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;">Admin Order Notification</p>
                            </td>
                            <td align="right">
                              <div style="background-color:#e6b96e;color:#13192b;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;display:inline-block;">🛒 NEW ORDER</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Alert -->
                    <tr>
                      <td style="padding:24px 32px 16px;">
                        <div style="background:linear-gradient(135deg,#fdf8f0,#fef9f2);border:1px solid #f0e2c4;border-left:4px solid #e6b96e;border-radius:10px;padding:16px 20px;">
                          <p style="margin:0;font-size:15px;font-weight:700;color:#13192b;">A new order has been placed!</p>
                          <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Please review and process the order below. Log in to your admin panel to update the order status.</p>
                        </div>
                      </td>
                    </tr>

                    <!-- Order Details -->
                    <tr>
                      <td style="padding:16px 32px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f8f9fb;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
                          <tr>
                            <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Order ID</td>
                                  <td align="right" style="font-size:14px;font-weight:800;color:#13192b;">${order.id}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Customer</td>
                                  <td align="right" style="font-size:13px;font-weight:600;color:#13192b;">${order.customerName}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Email</td>
                                  <td align="right" style="font-size:13px;color:#4f76f6;">${order.customerEmail}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Phone</td>
                                  <td align="right" style="font-size:13px;font-weight:600;color:#13192b;">${order.customerPhone}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Delivery Address</td>
                                  <td align="right" style="font-size:13px;color:#4b5563;max-width:300px;text-align:right;">${order.shippingAddress}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:16px 20px;">
                              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Payment</td>
                                  <td align="right">
                                    <span style="background-color:${order.paymentStatus === 'Paid' ? '#d1fae5' : '#fef9c3'};color:${order.paymentStatus === 'Paid' ? '#065f46' : '#92400e'};padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase;">${order.paymentStatus || 'COD'}</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Items -->
                    <tr>
                      <td style="padding:16px 32px;">
                        <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;">Order Items</p>
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                          <thead>
                            <tr style="background-color:#f8f9fb;">
                              <th style="padding:10px 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;text-align:left;">Product</th>
                              <th style="padding:10px 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;text-align:center;">Qty</th>
                              <th style="padding:10px 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;text-align:right;">Price</th>
                            </tr>
                          </thead>
                          <tbody>${itemsHtml}</tbody>
                        </table>
                      </td>
                    </tr>

                    <!-- Total -->
                    <tr>
                      <td style="padding:0 32px 24px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#13192b;border-radius:10px;padding:16px 20px;">
                          <tr>
                            <td style="font-size:14px;color:rgba(255,255,255,0.7);">Subtotal</td>
                            <td align="right" style="font-size:14px;color:#ffffff;">₹${order.subtotal.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px;color:rgba(255,255,255,0.7);padding-top:6px;">Shipping</td>
                            <td align="right" style="font-size:14px;color:#ffffff;padding-top:6px;">${order.shipping === 0 ? '<span style="color:#34d399;font-weight:700;">FREE</span>' : `₹${order.shipping}`}</td>
                          </tr>
                          <tr>
                            <td style="padding-top:12px;font-size:16px;font-weight:800;color:#e6b96e;border-top:1px solid rgba(255,255,255,0.15);">Total</td>
                            <td align="right" style="padding-top:12px;font-size:18px;font-weight:800;color:#e6b96e;border-top:1px solid rgba(255,255,255,0.15);">₹${order.total.toLocaleString()}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- CTA -->
                    <tr>
                      <td style="padding:0 32px 32px;text-align:center;">
                        <a href="https://iesvra.com/admin/orders" style="display:inline-block;background:linear-gradient(135deg,#e6b96e,#c99b46);color:#13192b;padding:14px 32px;border-radius:30px;font-weight:800;font-size:13px;text-decoration:none;text-transform:uppercase;letter-spacing:0.1em;">View in Admin Panel →</a>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color:#f8f9fb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
                        <p style="margin:0;font-size:11px;color:#9ca3af;">This is an automated notification from IESVRA. Do not reply to this email.</p>
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
              from: "IESVRA Orders <orders@iesvra.com>",
              to: adminEmail,
              subject: `🛒 New Order #${order.id} — ₹${order.total.toLocaleString()} (${order.paymentStatus || "COD"})`,
              html: emailHtml,
            }),
          });

          const resendData = await resendRes.json();
          if (!resendRes.ok) {
            console.error("Admin notify Resend error:", resendData);
            return new Response(
              JSON.stringify({ error: resendData.message || "Failed to notify admin." }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          return new Response(JSON.stringify({ success: true, id: resendData.id }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("Admin notify endpoint error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Failed to send admin notification." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
