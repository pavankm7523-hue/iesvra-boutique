import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/send-shipped-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { order } = body;

          if (!order || !order.id || !order.trackingId) {
            return new Response(
              JSON.stringify({ error: "Missing order details or tracking ID." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const apiKey = (process.env.RESEND_API_KEY || "").trim();
          if (!apiKey) {
            console.warn("RESEND_API_KEY environment variable is not configured. Skipping email send.");
            return new Response(
              JSON.stringify({ warning: "Resend API key is missing. Email skipped." }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          const trackingLink = `https://track.amazon.in/tracking/${order.trackingId}`;

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your Order Has Been Shipped - IESVRA</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8f9fb; font-family: 'Inter', system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fb; padding: 40px 0;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
                      <!-- Header -->
                      <tr>
                        <td align="center" style="background-color: #13192b; padding: 40px 20px; border-bottom: 4px solid #e6b96e;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 0.05em; font-family: 'Outfit', sans-serif; text-transform: uppercase;">IESVRA</h1>
                          <p style="color: #e6b96e; margin: 8px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Order Shipped</p>
                        </td>
                      </tr>
                      
                      <!-- Message -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="margin: 0 0 20px 0; font-size: 16px; color: #13192b; line-height: 1.6;">
                            Hi <strong>${order.customerName}</strong>,
                          </p>
                          <p style="margin: 0 0 30px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                            Great news! Your order **#${order.id}** has been shipped and is on its way to you via **Amazon Shipping**.
                          </p>
                          
                          <!-- Tracking Block -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0; padding: 20px; text-align: center;">
                            <tr>
                              <td>
                                <p style="margin: 0 0 6px 0; font-size: 12px; color: #166534; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Amazon Shipping AWB / Tracking ID</p>
                                <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #14532d; font-family: monospace; letter-spacing: 0.05em;">${order.trackingId}</p>
                                <a href="${trackingLink}" target="_blank" style="background-color: #166534; color: #ffffff; padding: 12px 24px; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; box-shadow: 0 4px 6px rgba(22, 101, 52, 0.2);">Track Package</a>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Details Grid -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px; background-color: #f8f9fb; border-radius: 12px; border: 1px solid #e5e7eb; padding: 20px;">
                            <tr>
                              <td style="padding-bottom: 10px; font-size: 14px; color: #6b7280;">Order ID:</td>
                              <td style="padding-bottom: 10px; font-size: 14px; font-weight: 700; color: #13192b; text-align: right;">${order.id}</td>
                            </tr>
                            <tr>
                              <td style="padding-bottom: 10px; font-size: 14px; color: #6b7280;">Carrier:</td>
                              <td style="padding-bottom: 10px; font-size: 14px; color: #13192b; text-align: right; font-weight: 600;">Amazon Shipping</td>
                            </tr>
                            <tr>
                              <td style="font-size: 14px; color: #6b7280;">Delivery Address:</td>
                              <td style="font-size: 14px; color: #13192b; text-align: right; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${order.shippingAddress}</td>
                            </tr>
                          </table>

                          <!-- Website tracking option -->
                          <p style="margin: 0 0 20px 0; font-size: 13px; color: #6b7280; line-height: 1.6; text-align: center;">
                            You can also view your order status and details directly on our website using our Track Order page:
                          </p>
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td align="center" style="padding-bottom: 20px;">
                                <a href="https://www.iesvra.com/track-order?orderId=${order.id}" target="_blank" style="background-color: #7a8b7b; color: #ffffff; padding: 10px 20px; font-size: 12px; font-weight: 700; text-decoration: none; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block;">View order details</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td align="center" style="background-color: #f8f9fb; padding: 30px 20px; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0 0 10px 0; font-size: 14px; color: #13192b; font-weight: 700; letter-spacing: 0.05em;">IESVRA BOUTIQUE</p>
                          <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                            This email was sent to ${order.customerEmail}. If you have any questions or require assistance, please reply to this email or contact support.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `;

          const resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: "IESVRA Shipping <orders@iesvra.com>",
              to: order.customerEmail.trim(),
              subject: `🚚 Your IESVRA Order #${order.id} Has Been Shipped!`,
              html: emailHtml
            })
          });

          const resendData = await resendRes.json();
          if (!resendRes.ok) {
            console.error("Resend API failed with error response:", resendData);
            return new Response(JSON.stringify({ error: resendData.message || "Resend email delivery failed." }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          return new Response(JSON.stringify({ success: true, id: resendData.id }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (error: any) {
          console.error("Resend endpoint runtime error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Failed to process request." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
  }
});
