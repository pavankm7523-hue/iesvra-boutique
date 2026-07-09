import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/newsletter/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { email } = body;

          if (!email || typeof email !== "string" || !email.includes("@")) {
            return new Response(
              JSON.stringify({ error: "Please provide a valid email address." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const apiKey = (process.env.RESEND_API_KEY || "").trim();
          if (!apiKey) {
            console.warn("RESEND_API_KEY environment variable is not configured. Simulating success.");
            return new Response(
              JSON.stringify({ success: true, message: "Subscription simulated successfully (no Resend API key)." }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          // 1. Get or create Resend Newsletter Audience
          let audienceId = "";
          try {
            const listRes = await fetch("https://api.resend.com/audiences", {
              headers: {
                "Authorization": `Bearer ${apiKey}`
              }
            });
            const listData = await listRes.json();

            if (listRes.ok && listData.data && listData.data.length > 0) {
              // Use first existing audience list
              audienceId = listData.data[0].id;
            } else {
              // Create a new newsletter list if none exist
              const createAudienceRes = await fetch("https://api.resend.com/audiences", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${apiKey}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: "Newsletter" })
              });
              const createAudienceData = await createAudienceRes.json();
              if (createAudienceRes.ok && createAudienceData.id) {
                audienceId = createAudienceData.id;
              } else {
                throw new Error(createAudienceData.message || "Failed to create audience list on Resend.");
              }
            }
          } catch (audienceErr: any) {
            console.error("Error managing Resend audiences:", audienceErr);
            // Fall back or report error
            return new Response(
              JSON.stringify({ error: "Failed to verify subscription database list in Resend." }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          // 2. Add Contact to Audience List
          try {
            const addContactRes = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                email: email.trim(),
                unsubscribed: false
              })
            });
            const addContactData = await addContactRes.json();

            if (!addContactRes.ok) {
              // If the email is already subscribed, Resend might return 409 or similar message
              const errMsg = addContactData.message || "";
              if (errMsg.toLowerCase().includes("already") || addContactRes.status === 409) {
                console.log("Contact already exists in audience. Proceeding with confirmation email.");
              } else {
                console.error("Resend create contact error:", addContactData);
                return new Response(
                  JSON.stringify({ error: addContactData.message || "Failed to register subscription." }),
                  { status: 500, headers: { "Content-Type": "application/json" } }
                );
              }
            }
          } catch (contactErr: any) {
            console.error("Error adding contact to Resend:", contactErr);
            return new Response(
              JSON.stringify({ error: "Failed to persist newsletter contact details." }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          // 3. Send confirmation / welcome email
          const welcomeEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to the IESVRA Newsletter</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8f9fb; font-family: 'Inter', system-ui, -apple-system, sans-serif;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fb; padding: 40px 0;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
                      <!-- Header -->
                      <tr>
                        <td align="center" style="background-color: #13192b; padding: 40px 20px; border-bottom: 4px solid #e6b96e;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">IESVRA</h1>
                          <p style="color: #e6b96e; margin: 8px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Newsletter Subscription</p>
                        </td>
                      </tr>
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <h2 style="color: #13192b; font-size: 20px; margin-top: 0; margin-bottom: 16px; font-weight: 700;">Welcome to the IESVRA Community!</h2>
                          <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
                            Thank you for subscribing to the IESVRA newsletter. You're now on the list to receive exclusive sneak peeks, early access to new arrivals, and special boutique discounts.
                          </p>
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fcfbf9; border-radius: 12px; border: 1px solid #f1ece4; padding: 20px; margin-bottom: 30px; text-align: center;">
                            <tr>
                              <td>
                                <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Your Subscriber Email</p>
                                <p style="margin: 6px 0 0 0; font-size: 16px; font-weight: 700; color: #13192b;">${email.trim()}</p>
                              </td>
                            </tr>
                          </table>
                          <p style="font-size: 14px; color: #7a8b7b; font-style: italic; line-height: 1.6; margin-bottom: 0;">
                            Warm regards,<br>
                            <strong>The IESVRA Team</strong>
                          </p>
                        </td>
                      </tr>
                      <!-- Footer -->
                      <tr>
                        <td align="center" style="background-color: #f8f9fb; padding: 30px 20px; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0 0 10px 0; font-size: 13px; color: #13192b; font-weight: 700; letter-spacing: 0.05em;">IESVRA BOUTIQUE</p>
                          <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                            You received this email because you subscribed to our newsletter on our website. If you'd like to unsubscribe, you can click the unsubscribe link in any future email.
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
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: "IESVRA <newsletter@iesvra.com>",
              to: email.trim(),
              subject: "Welcome to the IESVRA Newsletter!",
              html: welcomeEmailHtml
            })
          });

          if (!emailRes.ok) {
            const emailData = await emailRes.json();
            console.warn("Resend Welcome email notification failed to send:", emailData);
            // We still return 200 OK because the contact registration succeeded.
          }

          return new Response(JSON.stringify({ success: true, message: "Subscription completed!" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (error: any) {
          console.error("Newsletter subscription endpoint runtime error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Failed to process request." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
  }
});
