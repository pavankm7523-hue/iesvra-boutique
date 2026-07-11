import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";

export const Route = createFileRoute("/api/newsletter/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { email } = body;

          // 1. Basic validation
          if (!email || typeof email !== "string" || !email.includes("@")) {
            return new Response(
              JSON.stringify({ error: "Please enter a valid email address." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const trimmedEmail = email.trim().toLowerCase();

          // 2. Append to a local JSON file in workspace as a local backup
          try {
            const dataDir = path.resolve(process.cwd(), "src/data");
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const subscribersFile = path.join(dataDir, "subscribers.json");
            let subscribersList = [];
            if (fs.existsSync(subscribersFile)) {
              const rawData = fs.readFileSync(subscribersFile, "utf-8");
              subscribersList = JSON.parse(rawData || "[]");
            }

            if (!subscribersList.some((s: any) => s.email === trimmedEmail)) {
              subscribersList.push({
                email: trimmedEmail,
                subscribedAt: new Date().toISOString(),
              });
              fs.writeFileSync(subscribersFile, JSON.stringify(subscribersList, null, 2), "utf-8");
            }
          } catch (fsErr) {
            console.error("Local JSON storage warning (non-fatal):", fsErr);
          }

          // 3. Connect to Resend to create audience contact & send welcome email
          const apiKey = (process.env.RESEND_API_KEY || "").trim();
          if (!apiKey) {
            console.warn("RESEND_API_KEY is not configured. Simulating success in development mode.");
            return new Response(
              JSON.stringify({ success: true, message: "Subscribed successfully (Simulated mode)." }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          // A. Fetch existing audiences to get or create audience ID
          let audienceId = "";
          try {
            const audiencesRes = await fetch("https://api.resend.com/audiences", {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            });

            if (audiencesRes.ok) {
              const audData = await audiencesRes.json();
              if (audData.data && audData.data.length > 0) {
                // Use the first existing audience
                audienceId = audData.data[0].id;
              } else {
                // If no audiences, create a new one named "Newsletter Subscribers"
                const createAudRes = await fetch("https://api.resend.com/audiences", {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ name: "Newsletter Subscribers" }),
                });

                if (createAudRes.ok) {
                  const createAudData = await createAudRes.json();
                  audienceId = createAudData.id;
                }
              }
            }
          } catch (audErr) {
            console.error("Failed to query or create Resend audience:", audErr);
          }

          // B. Add contact to the audience if ID is found
          if (audienceId) {
            try {
              await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: trimmedEmail,
                  unsubscribed: false,
                }),
              });
            } catch (contactErr) {
              console.error("Failed to add contact to Resend audience list:", contactErr);
            }
          }

          // C. Send welcome coupon email to subscriber (with details about our website)
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to the IESVRA Boutique</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8f9fb; font-family: 'Inter', system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fb; padding: 40px 0;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
                      <!-- Header -->
                      <tr>
                        <td align="center" style="background-color: #0b121e; padding: 40px 20px; border-bottom: 4px solid #c9a55c;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 0.1em; font-family: 'Outfit', sans-serif; text-transform: uppercase;">IESVRA</h1>
                          <p style="color: #c9a55c; margin: 8px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em;">Quality Products, Best Prices, Everyday</p>
                        </td>
                      </tr>
                      
                      <!-- Message -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #0b121e; font-weight: 700;">Welcome to the IESVRA Family!</h2>
                          <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569; line-height: 1.6; font-weight: 300;">
                            Thank you for subscribing to the **IESVRA** newsletter. You are now officially a part of our premium shopping circle!
                          </p>
                          <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569; line-height: 1.6; font-weight: 300;">
                            <strong>About Our Store:</strong><br>
                            At <strong>IESVRA</strong>, we curate high-quality products across multiple categories including trendy gadgets, premium home & kitchen essentials, beauty, personal care, and fashion accessories. Our mission is to make premium boutique shopping accessible with top-tier customer service and fast delivery options.
                          </p>
                          <p style="margin: 0 0 30px 0; font-size: 15px; color: #475569; line-height: 1.6; font-weight: 300;">
                            We promise to bring you only the finest details: exclusive early sale access, new curated product drops, and insights into premium essentials.
                          </p>
                          
                          <!-- Promo box -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fdfbf7; border-radius: 12px; border: 1px dashed #c9a55c; padding: 24px; text-align: center; margin-bottom: 30px;">
                            <tr>
                              <td>
                                <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-weight: 600; display: block; margin-bottom: 4px;">Your Welcome Coupon</span>
                                <strong style="font-size: 24px; color: #c9a55c; font-family: 'Outfit', sans-serif; display: block; margin-bottom: 8px;">FIRST15</strong>
                                <span style="font-size: 13px; color: #0b121e; font-weight: 500;">Enjoy 15% OFF on your first boutique checkouts!</span>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Action Button -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td align="center" style="padding-bottom: 10px;">
                                <a href="https://www.iesvra.com/shop" target="_blank" style="background-color: #c9a55c; color: #ffffff; padding: 14px 32px; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">Explore the Shop</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td align="center" style="background-color: #f8f9fb; padding: 30px 20px; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0 0 10px 0; font-size: 13px; color: #0b121e; font-weight: 700; letter-spacing: 0.05em;">IESVRA BOUTIQUE</p>
                          <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                            You received this email because you subscribed to our updates. If you wish to unsubscribe, you can do so by replying to this email.
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

          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "IESVRA <newsletter@iesvra.com>",
              to: trimmedEmail,
              subject: "Welcome to the IESVRA Newsletter!",
              html: emailHtml,
            }),
          });

          if (!emailRes.ok) {
            const emailErrData = await emailRes.json();
            console.error("Resend welcome email failed:", emailErrData);
          }

          // Send admin notification to both admin emails
          const adminEmails = ["arenterprisess409@gmail.com", "ishvaraindiaa@gmail.com"];
          try {
            const adminNotifyRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "IESVRA Alerts <newsletter@iesvra.com>",
                to: adminEmails,
                subject: `🔔 New Newsletter Subscriber: ${trimmedEmail}`,
                html: `
                  <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #0b121e; margin-bottom: 20px;">New Newsletter Subscription</h2>
                    <p>A new user has subscribed to the IESVRA newsletter!</p>
                    <p><strong>Subscriber Email:</strong> <a href="mailto:${trimmedEmail}">${trimmedEmail}</a></p>
                    <p><strong>Subscribed At:</strong> ${new Date().toLocaleString()}</p>
                    <p>The subscriber has been sent the welcome email and FIRST15 welcome coupon code.</p>
                  </div>
                `,
              }),
            });
            if (!adminNotifyRes.ok) {
              const adminErr = await adminNotifyRes.json();
              console.error("Failed to send admin notification email:", adminErr);
            }
          } catch (adminErr) {
            console.error("Resend admin notify email error:", adminErr);
          }

          return new Response(
            JSON.stringify({ success: true, message: "Subscribed successfully." }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err: any) {
          console.error("Newsletter subscription handler error:", err);
          return new Response(
            JSON.stringify({ error: err.message || "Failed to submit subscription request." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
