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
            const errorText = await res.text();
            console.error("[api-reverse-geocode] Ola Maps Reverse Geocode error:", res.status, errorText);
            return new Response(JSON.stringify({ results: [] }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
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
          console.error("[api-reverse-geocode] Unexpected error:", error);
          return new Response(JSON.stringify({ results: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
