import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

export const Route = createFileRoute("/api/address-suggestions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const urlObj = new URL(request.url);
          const query = urlObj.searchParams.get("query") || urlObj.searchParams.get("q") || "";
          const apiKey = process.env.VITE_OLA_MAPS_API_KEY || (import.meta as any).env?.VITE_OLA_MAPS_API_KEY || "";

          console.log("[api-suggestions] Incoming query:", query);
          console.log("[api-suggestions] API Key length:", apiKey ? apiKey.length : 0);

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

          console.log("[api-suggestions] Ola Autocomplete status:", res.status);
          const data = await res.json();
          console.log("[api-suggestions] Ola Autocomplete predictions count:", data?.predictions?.length);

          if (!res.ok) {
            console.error("[api-suggestions] Ola Autocomplete error body:", data);
            return new Response(JSON.stringify({ predictions: [] }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            },
          });
        } catch (error: any) {
          console.error("[api-suggestions] Unexpected error:", error);
          return new Response(JSON.stringify({ predictions: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
