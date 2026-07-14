import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/auth/google-callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const code = url.searchParams.get("code");
          if (!code) {
            return new Response("Authorization code is missing.", { status: 400 });
          }

          const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
          const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
          if (!clientId || !clientSecret || clientId === "your_google_client_id_here") {
            return new Response("Server is missing Google Client configuration.", { status: 500 });
          }

          const origin = url.origin;
          const redirectUri = `${origin}/api/auth/google-callback`;

          // Exchange code for tokens
          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
              grant_type: "authorization_code",
            }),
          });

          if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            return new Response(`Token exchange failed: ${errText}`, { status: 500 });
          }

          const tokens = await tokenRes.json();
          const accessToken = tokens.access_token;
          if (!accessToken) {
            return new Response("Access token is missing from token response.", { status: 500 });
          }

          // Fetch Google User Info
          const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!userRes.ok) {
            const errText = await userRes.text();
            return new Response(`Userinfo fetch failed: ${errText}`, { status: 500 });
          }

          const userInfo = await userRes.json();
          const email = userInfo.email;
          const name = userInfo.name || email.split("@")[0];

          if (!email) {
            return new Response("User email not returned by Google.", { status: 400 });
          }

          const normalizedEmail = email.trim().toLowerCase();

          // Check if email is designated as auto-admin
          const isAdmin =
            normalizedEmail === "arenterprisess409@gmail.com" ||
            normalizedEmail === "ishvaraindiaa@gmail.com" ||
            normalizedEmail === "admin@iesvra.com";
          const role = isAdmin ? "admin" : "user";

          // Sync user to database
          const globalUsers = (await getMetadataFromDb("global_registered_users")) || [];
          let existingUser = globalUsers.find(
            (u: any) => u.email.toLowerCase() === normalizedEmail
          );

          if (!existingUser) {
            existingUser = {
              name,
              email: normalizedEmail,
              passwordHash: "oauth-login-only", // Distinct placeholder to restrict password logins
              role,
            };
            globalUsers.push(existingUser);
            await saveMetadataToDb("global_registered_users", globalUsers);
          } else if (existingUser.passwordHash === "social-auth-bypass-pass") {
            // Upgrade legacy social bypass users to oauth-login-only for security
            existingUser.passwordHash = "oauth-login-only";
            await saveMetadataToDb("global_registered_users", globalUsers);
          }

          const redirectPath = existingUser.role === "admin" ? "/admin" : "/";
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Authenticating...</title>
              </head>
              <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #1e293b; background-color: #f8fafc;">
                <div style="text-align: center;">
                  <h3 style="margin-bottom: 0.5rem;">Authenticating with Google...</h3>
                  <p style="color: #64748b; font-size: 0.875rem;">Logging in as ${existingUser.name}</p>
                </div>
                <script>
                  try {
                    const session = ${JSON.stringify({
                      name: existingUser.name,
                      email: existingUser.email,
                      role: existingUser.role,
                    })};
                    localStorage.setItem("ishvara_auth", JSON.stringify(session));
                    
                    // Dispatch custom event to notify listeners on the same origin (if any)
                    try {
                      window.dispatchEvent(new CustomEvent("ishvara_auth_changed"));
                    } catch (e) {}

                    // If opened as a popup (e.g. mobile app preview), message the opener and close
                    if (window.opener) {
                      window.opener.postMessage({ 
                        type: 'GOOGLE_AUTH_SUCCESS', 
                        name: session.name, 
                        email: session.email 
                      }, '*');
                      window.close();
                    } else {
                      // Redirect back to home/admin for standard redirect flow
                      window.location.replace("${redirectPath}");
                    }
                  } catch (err) {
                    console.error("Local storage sync error:", err);
                    document.body.innerHTML = '<div style="color: red; padding: 2rem;">Authentication failed: ' + err.message + '</div>';
                  }
                </script>
              </body>
            </html>
          `;

          return new Response(html, {
            headers: {
              "Content-Type": "text/html",
            },
          });
        } catch (error: any) {
          console.error("[google-callback] Unexpected error:", error);
          return new Response(`Unexpected authentication error: ${error.message || error}`, { status: 500 });
        }
      },
    },
  },
});
