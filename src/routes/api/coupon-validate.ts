import { createFileRoute } from "@tanstack/react-router";
import { calculateCouponDiscount, normalizeCoupon } from "@/lib/coupons";
import { fetchAllOrdersFromDb, getMetadataFromDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/coupon-validate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const code = String(body?.code || "").trim().toUpperCase();
          const subtotal = Math.max(0, Number(body?.subtotal) || 0);
          const shipping = Math.max(0, Number(body?.shipping) || 0);
          const email = String(body?.email || "").trim().toLowerCase();
          const stored = await getMetadataFromDb("global_coupons");
          const coupon = Array.isArray(stored)
            ? stored.map(normalizeCoupon).find((item) => item.code === code && item.active)
            : undefined;
          if (!coupon) return Response.json({ error: "Invalid or inactive coupon code." }, { status: 404 });
          if (subtotal < coupon.minimumOrder) {
            return Response.json({ error: `Minimum order of ₹${coupon.minimumOrder} is required.` }, { status: 409 });
          }
          if (coupon.firstOrderOnly && email) {
            const orders = await fetchAllOrdersFromDb();
            const hasPreviousOrder = orders.some((order) =>
              order.customerEmail?.toLowerCase() === email && order.status !== "Cancelled"
            );
            if (hasPreviousOrder) return Response.json({ error: "This coupon is only valid on the first order." }, { status: 409 });
          }
          const result = calculateCouponDiscount(coupon, subtotal, shipping);
          return Response.json({ valid: true, coupon, ...result });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Coupon validation failed." }, { status: 500 });
        }
      },
    },
  },
});
