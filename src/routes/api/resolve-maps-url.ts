import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/resolve-maps-url")(({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const urlObj = new URL(request.url);
          const targetUrl = urlObj.searchParams.get("url");

          if (!targetUrl) {
            return new Response(JSON.stringify({ error: "Missing url parameter" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          console.log("[resolve-maps-url] Resolving:", targetUrl);

          // 1. Resolve redirect to get place name from long URL
          const headRes = await fetch(targetUrl, {
            method: "GET", // Use GET to make sure redirects are followed or intercepted correctly
            redirect: "manual",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            },
          });

          let longUrl = headRes.headers.get("location") || targetUrl;
          console.log("[resolve-maps-url] Long URL:", longUrl);

          let queryVal = "";
          const placeMatch = longUrl.match(/\/place\/([^/]+)/);
          if (placeMatch) {
            queryVal = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
          } else {
            const tempUrl = new URL(longUrl);
            queryVal = tempUrl.searchParams.get("q") || tempUrl.searchParams.get("query") || "";
          }

          if (!queryVal) {
            return new Response(JSON.stringify({ error: "Could not parse place name from URL" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          console.log("[resolve-maps-url] Extracted Place Name:", queryVal);

          // 2. Fetch Google Maps embed HTML using the place name
          const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(queryVal)}&output=embed`;
          const embedRes = await fetch(embedUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            },
          });
          const html = await embedRes.text();

          // 3. Extract coordinates using regex from initEmbed call
          // Search for a format like: "Place Name",[lat, lon]
          const genericCoordsRegex = /"([^"]+)",\[([0-9.-]+),([0-9.-]+)\]/g;
          let match;
          let lat = null;
          let lon = null;

          while ((match = genericCoordsRegex.exec(html)) !== null) {
            lat = parseFloat(match[2]);
            lon = parseFloat(match[3]);
          }

          // Fallback: search for generic lat/lon matches in coordinates arrays
          if (!lat || !lon) {
            const broadMatch = html.match(/,\[([0-9]{2}\.[0-9]+),([0-9]{2}\.[0-9]+)\]/);
            if (broadMatch) {
              lat = parseFloat(broadMatch[1]);
              lon = parseFloat(broadMatch[2]);
            }
          }

          if (!lat || !lon) {
            return new Response(JSON.stringify({ error: "Could not extract coordinates from Google Maps embed" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          console.log("[resolve-maps-url] Found coordinates:", lat, lon);

          // 4. Reverse geocode coordinates using Nominatim to get structured address details
          const reverseUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en&addressdetails=1`;
          const reverseRes = await fetch(reverseUrl, {
            headers: {
              "User-Agent": "IESVRA-Boutique-App/1.0",
            },
          });

          if (!reverseRes.ok) {
            // Return raw coordinates and place name if reverse geocoding fails
            return new Response(JSON.stringify({
              lat,
              lon,
              displayName: queryVal,
              line1: queryVal.split(",")[0] || "",
              city: "Patna",
              state: "Bihar",
            }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          const data = await reverseRes.json();
          const addr = data.address || {};

          const road = addr.road || addr.pedestrian || addr.street || "";
          const houseNumber = addr.house_number || "";
          const suburb = addr.suburb || addr.neighbourhood || addr.city_district || "";
          const city = addr.city || addr.town || addr.village || addr.county || "";
          const state = addr.state || "";
          const pincode = addr.postcode || "";

          const result = {
            lat,
            lon,
            displayName: queryVal || data.display_name,
            line1: [houseNumber, road].filter(Boolean).join(" ") || queryVal.split(",")[0] || "",
            line2: suburb || "",
            city,
            state,
            pincode,
          };

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (err: any) {
          console.error("[resolve-maps-url] Error:", err);
          return new Response(JSON.stringify({ error: err.message || "Failed to resolve maps URL" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
}) as any);
