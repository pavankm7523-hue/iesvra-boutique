import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/geocode")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const urlObj = new URL(request.url);
          const address = urlObj.searchParams.get("address") || "";
          const apiKey = process.env.VITE_OLA_MAPS_API_KEY || (import.meta as any).env?.VITE_OLA_MAPS_API_KEY || "";

          console.log("[api-geocode] Incoming address:", address);
          console.log("[api-geocode] API Key length:", apiKey ? apiKey.length : 0);

          if (!address) {
            return new Response(JSON.stringify(null), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const geocodeUrl = `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(
            address
          )}&api_key=${apiKey}`;

          const res = await fetch(geocodeUrl, {
            headers: {
              "Referer": "https://www.iesvra.com/",
              "Origin": "https://www.iesvra.com"
            }
          });

          console.log("[api-geocode] Ola Geocode status:", res.status);
          const data = await res.json();

          if (!res.ok) {
            console.warn("[api-geocode] Ola Maps geocode failed, falling back to Nominatim OSM:", res.status);
            const nominatimRes = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&countrycodes=in&limit=1&addressdetails=1`,
              {
                headers: {
                  "User-Agent": "IeswaraBoutique/1.0 (contact@iesvra.com)",
                  "Accept-Language": "en"
                }
              }
            );
            if (nominatimRes.ok) {
              const osmList = await nominatimRes.json();
              if (osmList && osmList.length > 0) {
                const item = osmList[0];
                return new Response(
                  JSON.stringify({
                    geocodingResults: [
                      {
                        formatted_address: item.display_name,
                        geometry: {
                          location: {
                            lat: parseFloat(item.lat),
                            lng: parseFloat(item.lon)
                          }
                        }
                      }
                    ]
                  }),
                  {
                    status: 200,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                  }
                );
              }
            }

            return new Response(JSON.stringify(null), {
              status: 200,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
          }

          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        } catch (error: any) {
          console.error("[api-geocode] Unexpected error, trying Nominatim:", error);
          try {
            const urlObj = new URL(request.url);
            const address = urlObj.searchParams.get("address") || "";
            if (address) {
              const nominatimRes = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&countrycodes=in&limit=1&addressdetails=1`,
                {
                  headers: {
                    "User-Agent": "IeswaraBoutique/1.0 (contact@iesvra.com)",
                    "Accept-Language": "en"
                  }
                }
              );
              if (nominatimRes.ok) {
                const osmList = await nominatimRes.json();
                if (osmList && osmList.length > 0) {
                  const item = osmList[0];
                  return new Response(
                    JSON.stringify({
                      geocodingResults: [
                        {
                          formatted_address: item.display_name,
                          geometry: {
                            location: {
                              lat: parseFloat(item.lat),
                              lng: parseFloat(item.lon)
                            }
                          }
                        }
                      ]
                    }),
                    {
                      status: 200,
                      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    }
                  );
                }
              }
            }
          } catch {}
          return new Response(JSON.stringify(null), {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }
      },
    },
  },
});
