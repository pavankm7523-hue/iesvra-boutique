import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/reverse-geocode")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const urlObj = new URL(request.url);
          const lat = urlObj.searchParams.get("lat") || "";
          const lng = urlObj.searchParams.get("lng") || "";
          const apiKey = process.env.VITE_OLA_MAPS_API_KEY || (import.meta as any).env?.VITE_OLA_MAPS_API_KEY || "";

          if (!lat || !lng) {
            return new Response(JSON.stringify({ error: "Missing latitude or longitude parameters" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const reverseGeocodeUrl = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}&api_key=${apiKey}`;

          const res = await fetch(reverseGeocodeUrl, {
            headers: {
              "Referer": "https://www.iesvra.com/",
              "Origin": "https://www.iesvra.com"
            }
          });

          if (!res.ok) {
            console.warn("[api-reverse-geocode] Ola Maps Reverse Geocode failed, falling back to Nominatim OSM:", res.status);
            const nominatimRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en&addressdetails=1`,
              {
                headers: {
                  "User-Agent": "IeswaraBoutique/1.0 (contact@iesvra.com)",
                  "Accept-Language": "en"
                }
              }
            );
            if (nominatimRes.ok) {
              const osmData = await nominatimRes.json();
              return new Response(
                JSON.stringify({
                  results: [
                    {
                      formatted_address: osmData.display_name,
                      address_components: osmData.address,
                    }
                  ]
                }),
                {
                  status: 200,
                  headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                  },
                }
              );
            }

            return new Response(JSON.stringify({ results: [] }), {
              status: 200,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
          }

          const data = await res.json();
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            },
          });
        } catch (error: any) {
          console.error("[api-reverse-geocode] Unexpected error, trying Nominatim:", error);
          try {
            const urlObj = new URL(request.url);
            const lat = urlObj.searchParams.get("lat") || "";
            const lng = urlObj.searchParams.get("lng") || "";
            if (lat && lng) {
              const nominatimRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en&addressdetails=1`,
                {
                  headers: {
                    "User-Agent": "IeswaraBoutique/1.0 (contact@iesvra.com)",
                    "Accept-Language": "en"
                  }
                }
              );
              if (nominatimRes.ok) {
                const osmData = await nominatimRes.json();
                return new Response(
                  JSON.stringify({
                    results: [
                      {
                        formatted_address: osmData.display_name,
                        address_components: osmData.address,
                      }
                    ]
                  }),
                  {
                    status: 200,
                    headers: { 
                      "Content-Type": "application/json",
                      "Access-Control-Allow-Origin": "*"
                    },
                  }
                );
              }
            }
          } catch {}
          return new Response(JSON.stringify({ results: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }
      },
    },
  },
});
