import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/send-confirmation")({
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
          if (!apiKey) {
            console.warn("RESEND_API_KEY environment variable is not configured. Skipping email send.");
            return new Response(
              JSON.stringify({ warning: "Resend API key is missing. Email skipped." }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          // Build HTML email items list matching brand styling
          const itemsListHtml = order.items
            .map(
              (item: any) => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; vertical-align: top;">
                  <div style="font-weight: 600; color: #13192b; font-size: 14px;">${item.name}</div>
                  ${item.color && item.color !== "Standard" ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Color: ${item.color}</div>` : ""}
                </td>
                <td style="padding: 12px 0; text-align: center; color: #13192b; font-size: 14px;">${item.quantity}</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #13192b; font-size: 14px;">₹${item.price.toLocaleString()}</td>
              </tr>
            `
            )
            .join("");

          // Clean, high-premium HTML design with Navy (#13192b), Gold (#e6b96e), and Sage (#7a8b7b) accents
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Order Confirmation - IESVRA</title>
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
                          <p style="color: #e6b96e; margin: 8px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Order Confirmed</p>
                        </td>
                      </tr>
                      
                      <!-- Message -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="margin: 0 0 20px 0; font-size: 16px; color: #13192b; line-height: 1.6;">
                            Hi <strong>${order.customerName}</strong>,
                          </p>
                          <p style="margin: 0 0 30px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                            Thank you for shopping at **IESVRA**! Your order has been placed successfully and is currently being processed. Below is a summary of your purchase.
                          </p>
                          
                          <!-- Details Grid -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px; background-color: #fdfbf7; border-radius: 12px; border: 1px solid #f1ece4; padding: 20px;">
                            <tr>
                              <td style="padding-bottom: 10px; font-size: 14px; color: #6b7280;">Order ID:</td>
                              <td style="padding-bottom: 10px; font-size: 14px; font-weight: 700; color: #13192b; text-align: right;">${order.id}</td>
                            </tr>
                            <tr>
                              <td style="padding-bottom: 10px; font-size: 14px; color: #6b7280;">Order Date:</td>
                              <td style="padding-bottom: 10px; font-size: 14px; color: #13192b; text-align: right;">${order.date}</td>
                            </tr>
                            <tr>
                              <td style="padding-bottom: 10px; font-size: 14px; color: #6b7280;">Payment Mode:</td>
                              <td style="padding-bottom: 10px; font-size: 14px; color: #13192b; text-align: right; text-transform: capitalize;">${order.paymentStatus === "Paid" ? "Online Payment (Razorpay)" : "Cash on Delivery (COD)"}</td>
                            </tr>
                            <tr>
                              <td style="font-size: 14px; color: #6b7280;">Payment Status:</td>
                              <td style="font-size: 14px; font-weight: 700; color: ${order.paymentStatus === "Paid" ? "#10b981" : "#f59e0b"}; text-align: right;">${order.paymentStatus}</td>
                            </tr>
                          </table>
                          
                          <!-- Items Table -->
                          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #13192b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #13192b; padding-bottom: 8px;">Items Ordered</h3>
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                            <thead>
                              <tr style="border-bottom: 1px solid #13192b;">
                                <th align="left" style="padding-bottom: 8px; font-size: 12px; color: #6b7280; text-transform: uppercase;">Product</th>
                                <th align="center" style="padding-bottom: 8px; font-size: 12px; color: #6b7280; text-transform: uppercase;">Qty</th>
                                <th align="right" style="padding-bottom: 8px; font-size: 12px; color: #6b7280; text-transform: uppercase;">Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${itemsListHtml}
                            </tbody>
                          </table>
                          
                          <!-- Calculations -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 40px; border-top: 2px solid #e5e7eb; padding-top: 15px;">
                            <tr>
                              <td style="padding-bottom: 8px; font-size: 14px; color: #6b7280;">Subtotal:</td>
                              <td style="padding-bottom: 8px; font-size: 14px; color: #13192b; text-align: right;">₹${order.subtotal.toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td style="padding-bottom: 8px; font-size: 14px; color: #6b7280;">Shipping & Delivery:</td>
                              <td style="padding-bottom: 8px; font-size: 14px; color: #10b981; text-align: right; font-weight: 600;">Free</td>
                            </tr>
                            <tr style="font-size: 18px; font-weight: 800; color: #13192b;">
                              <td style="padding-top: 12px; border-top: 1px solid #e5e7eb;">Total:</td>
                              <td style="padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: right; color: #13192b;">₹${order.total.toLocaleString()}</td>
                            </tr>
                          </table>
                          
                          <!-- Shipping Address -->
                          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #13192b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #13192b; padding-bottom: 8px;">Delivery Details</h3>
                          <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 700; color: #13192b;">${order.customerName}</p>
                          <p style="margin: 0 0 5px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">${order.shippingAddress}</p>
                          <p style="margin: 0 0 30px 0; font-size: 14px; color: #4b5563;">Phone: ${order.customerPhone}</p>
                          
                          <!-- Action Button -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td align="center" style="padding: 10px 0 20px 0;">
                                <a href="https://www.iesvra.com/track-order?orderId=${order.id}" target="_blank" style="background-color: #7a8b7b; color: #ffffff; padding: 14px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; box-shadow: 0 4px 6px rgba(122, 139, 123, 0.25);">Track Your Order</a>
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
                            This email was sent to ${order.customerEmail}. If you have any questions or require assistance, please contact our customer support.
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

          // Trigger Resend API
          const resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: "IESVRA <orders@iesvra.com>",
              to: order.customerEmail.trim(),
              subject: `Your IESVRA Order Confirmation #${order.id}`,
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
