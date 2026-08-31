import { createFileRoute } from "@tanstack/react-router";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";
import { requireAdmin } from "@/lib/session.server";

function canonicalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalizeJson(item)]),
    );
  }
  return value;
}

function jsonMatches(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(canonicalizeJson(actual)) === JSON.stringify(canonicalizeJson(expected));
}

export const Route = createFileRoute("/api/categories")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const categories = await getMetadataFromDb("global_categories");
          return new Response(JSON.stringify(categories || []), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      POST: async ({ request }) => {
        const forbidden = requireAdmin(request); if (forbidden) return forbidden;
        try {
          const list = await request.json();
          if (!Array.isArray(list)) {
            return new Response(JSON.stringify({ error: "Invalid data. Expected an array of categories." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const success = await saveMetadataToDb("global_categories", list);
          if (!success) {
            return new Response(JSON.stringify({ error: "Category catalog could not be saved." }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const persisted = await getMetadataFromDb("global_categories");
          const verified = jsonMatches(persisted, list);
          if (!verified) {
            console.error("[api/categories] persistence verification mismatch", {
              expectedNames: list.map((category: any) => category?.name).filter(Boolean),
              persistedNames: Array.isArray(persisted)
                ? persisted.map((category: any) => category?.name).filter(Boolean)
                : [],
            });
            return new Response(JSON.stringify({ error: "Category save was not confirmed by the database; please retry." }), {
              status: 409,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ success: true, verified: true, count: list.length }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
