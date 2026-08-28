import { createFileRoute } from "@tanstack/react-router";
import { fetchOrderByIdFromDb, getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";
import type { ReturnRequest, ReturnRequestType } from "@/lib/returnRequests";

const REQUESTS_METADATA_KEY = "global_return_requests";
const DELIVERY_DATES_METADATA_KEY = "global_order_delivery_dates";

async function getRequests(): Promise<ReturnRequest[]> {
  const stored = await getMetadataFromDb(REQUESTS_METADATA_KEY);
  return Array.isArray(stored) ? stored : [];
}

function productPolicy(product: any, item: any) {
  return {
    returnWindowDays: Math.max(0, Number(item.returnWindowDays ?? product?.returnWindowDays ?? 7)),
    isRefundable: item.isRefundable ?? product?.isRefundable ?? true,
    replacementWindowDays: Math.max(0, Number(item.replacementWindowDays ?? product?.replacementWindowDays ?? 7)),
    isReplaceable: item.isReplaceable ?? product?.isReplaceable ?? true,
  };
}

export const Route = createFileRoute("/api/return-requests")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
          const requests = await getRequests();
          const filtered = email
            ? requests.filter((item) => item.customerEmail.toLowerCase() === email)
            : requests;
          return Response.json(filtered.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)));
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Failed to load requests." }, { status: 500 });
        }
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const requests = await getRequests();

          if (body.action === "review") {
            const index = requests.findIndex((item) => item.id === body.id);
            if (index < 0) return Response.json({ error: "Request not found." }, { status: 404 });
            if (requests[index].status !== "Pending") {
              return Response.json({ error: "Only pending requests can be reviewed." }, { status: 409 });
            }
            if (!(["Approved", "Rejected"] as const).includes(body.status)) {
              return Response.json({ error: "Invalid review status." }, { status: 400 });
            }
            if (body.status === "Rejected" && !String(body.rejectionReason || "").trim()) {
              return Response.json({ error: "A rejection reason is required." }, { status: 400 });
            }

            const current = requests[index];
            const updated: ReturnRequest = {
              ...current,
              status: body.status,
              reviewedAt: new Date().toISOString(),
              rejectionReason: body.status === "Rejected" ? String(body.rejectionReason).trim() : undefined,
              downstreamAction: body.status === "Approved"
                ? current.requestType === "return"
                  ? "Manual refund processing required — no automatic refund was triggered."
                  : "Manual replacement dispatch required — no shipment was created."
                : undefined,
            };
            requests[index] = updated;
            if (!(await saveMetadataToDb(REQUESTS_METADATA_KEY, requests))) {
              return Response.json({ error: "Could not save the review decision." }, { status: 500 });
            }
            return Response.json(updated);
          }

          if (body.action !== "create") return Response.json({ error: "Invalid action." }, { status: 400 });
          const order = await fetchOrderByIdFromDb(String(body.orderId || ""));
          if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
          if (order.status !== "Delivered") {
            return Response.json({ error: "Returns and replacements are available only after delivery." }, { status: 409 });
          }
          if (order.customerEmail.toLowerCase() !== String(body.customerEmail || "").trim().toLowerCase()) {
            return Response.json({ error: "This order does not belong to the signed-in customer." }, { status: 403 });
          }

          const item = order.items.find((candidate) => candidate.id === body.productId);
          if (!item) return Response.json({ error: "Product was not found in this order." }, { status: 404 });
          const requestType = body.requestType as ReturnRequestType;
          if (!(["return", "replacement"] as const).includes(requestType)) {
            return Response.json({ error: "Invalid request type." }, { status: 400 });
          }
          const reason = String(body.reason || "").trim();
          if (reason.length < 5) return Response.json({ error: "Please provide a reason (at least 5 characters)." }, { status: 400 });

          const products = await getMetadataFromDb("global_products");
          const product = Array.isArray(products) ? products.find((candidate: any) => candidate.id === item.id) : null;
          const policy = productPolicy(product, item);
          const windowDays = requestType === "return" ? policy.returnWindowDays : policy.replacementWindowDays;
          const isAllowed = requestType === "return" ? policy.isRefundable : policy.isReplaceable;
          if (!isAllowed) {
            return Response.json({ error: requestType === "return" ? "This product is non-refundable." : "This product is non-replaceable." }, { status: 409 });
          }

          const deliveryDates = await getMetadataFromDb(DELIVERY_DATES_METADATA_KEY);
          const deliveredAt = deliveryDates?.[order.id] || order.date;
          const daysSinceDelivery = Math.max(0, Math.floor((Date.now() - new Date(deliveredAt).getTime()) / 86_400_000));
          if (!Number.isFinite(daysSinceDelivery) || daysSinceDelivery > windowDays) {
            return Response.json({ error: `The ${windowDays}-day ${requestType} window has closed.` }, { status: 409 });
          }
          const duplicate = requests.some((candidate) =>
            candidate.orderId === order.id
            && candidate.productId === item.id
            && candidate.requestType === requestType
            && candidate.status !== "Rejected"
          );
          if (duplicate) return Response.json({ error: `A ${requestType} request already exists for this product.` }, { status: 409 });

          const created: ReturnRequest = {
            id: `RET-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
            orderId: order.id,
            productId: item.id,
            productName: item.name,
            productImage: item.image,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            reason,
            requestType,
            requestedAt: new Date().toISOString(),
            status: "Pending",
          };
          requests.unshift(created);
          if (!(await saveMetadataToDb(REQUESTS_METADATA_KEY, requests))) {
            return Response.json({ error: "Could not save the request." }, { status: 500 });
          }
          return Response.json(created, { status: 201 });
        } catch (error) {
          console.error("[return requests API] failed", error);
          return Response.json({ error: error instanceof Error ? error.message : "Unexpected request error." }, { status: 500 });
        }
      },
    },
  },
});
