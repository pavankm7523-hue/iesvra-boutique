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
            console.error("[api-geocode] Ola Maps geocode failed:", res.status, data);
            return new Response(JSON.stringify(null), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("[api-geocode] Unexpected error:", error);
          return new Response(JSON.stringify(null), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
