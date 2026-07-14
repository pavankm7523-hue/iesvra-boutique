import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/autocomplete")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const urlObj = new URL(request.url);
          const query = urlObj.searchParams.get("query") || urlObj.searchParams.get("q") || "";
          const apiKey = process.env.VITE_OLA_MAPS_API_KEY || (import.meta as any).env?.VITE_OLA_MAPS_API_KEY || "";

          if (!query || query.trim().length < 3) {
            return new Response(JSON.stringify({ predictions: [] }), {
              status: 200,
              headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              },
            });
          }

          const autocompleteUrl = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(
            query.trim()
          )}&api_key=${apiKey}`;

          const res = await fetch(autocompleteUrl, {
            headers: {
              "Referer": "https://www.iesvra.com/",
              "Origin": "https://www.iesvra.com"
            }
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error("[api-autocomplete] Ola Maps Autocomplete error:", res.status, errorText);
            return new Response(JSON.stringify({ predictions: [] }), {
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
          console.error("[api-autocomplete] Unexpected error:", error);
          return new Response(JSON.stringify({ predictions: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
