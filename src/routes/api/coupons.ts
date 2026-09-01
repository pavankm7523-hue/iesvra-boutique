import { createFileRoute } from "@tanstack/react-router";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";
import { requireAdmin } from "@/lib/session.server";
import { normalizeCoupon } from "@/lib/coupons";

const KEY = "global_coupons";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, canonical(item)]));
  }
  return value;
}

export const Route = createFileRoute("/api/coupons")({
  server: {
    handlers: {
      GET: async () => {
        const stored = await getMetadataFromDb(KEY);
        const coupons = Array.isArray(stored) ? stored.map(normalizeCoupon) : [];
        return Response.json(coupons.filter((coupon) => coupon.code), {
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        });
      },
      POST: async ({ request }) => {
        const forbidden = requireAdmin(request); if (forbidden) return forbidden;
        try {
          const body = await request.json();
          if (!Array.isArray(body)) return Response.json({ error: "Expected a coupon list." }, { status: 400 });
          const coupons = body.map(normalizeCoupon);
          if (coupons.some((coupon) => !coupon.code || !coupon.title)) {
            return Response.json({ error: "Every coupon needs a code and title." }, { status: 400 });
          }
          if (new Set(coupons.map((coupon) => coupon.code)).size !== coupons.length) {
            return Response.json({ error: "Coupon codes must be unique." }, { status: 409 });
          }
          const success = await saveMetadataToDb(KEY, coupons);
          const persisted = await getMetadataFromDb(KEY);
          const verified = success && JSON.stringify(canonical(persisted)) === JSON.stringify(canonical(coupons));
          if (!verified) return Response.json({ error: "Coupon changes were not confirmed by the database." }, { status: 409 });
          return Response.json({ success: true, count: coupons.length });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Coupon save failed." }, { status: 500 });
        }
      },
    },
  },
});
