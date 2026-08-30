import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const Route = createFileRoute("/api/send-review-request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { order } = await request.json();
          if (!order?.id || !order?.customerEmail || !Array.isArray(order?.items)) {
            return Response.json({ error: "Missing order, email, or products." }, { status: 400 });
          }

          const apiKey = (process.env.RESEND_API_KEY || "").trim();
          if (!apiKey) return Response.json({ warning: "Resend API key is missing. Email skipped." });

          const uniqueItems = Array.from(new Map(order.items.map((item: any) => [item.id, item])).values()) as any[];
          const productLinks = uniqueItems.map((item) => {
            const reviewUrl = `https://www.iesvra.com/product/${encodeURIComponent(item.id)}#customer-reviews`;
            return `<li style="margin:14px 0"><strong>${escapeHtml(item.name)}</strong><br><a href="${reviewUrl}" style="color:#6B46C1;font-weight:700">Write a review &amp; add photos</a></li>`;
          }).join("");

          const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#13192b">
            <h1>Your IESVRA order has arrived</h1>
            <p>Hi ${escapeHtml(order.customerName)},</p>
            <p>We hope you love order <strong>#${escapeHtml(order.id)}</strong>. Share your experience and attach up to 5 photos of the product you received—your review helps other shoppers.</p>
            <ul style="padding-left:20px">${productLinks}</ul>
            <p>Thank you for shopping with IESVRA.</p>
          </div>`;

          const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "IESVRA <orders@iesvra.com>",
              to: String(order.customerEmail).trim(),
              subject: `How was your IESVRA order #${order.id}? Add photos to your review`,
              html,
            }),
          });
          const data = await resendResponse.json();
          return Response.json(resendResponse.ok ? { success: true, id: data.id } : { error: data.message || "Email delivery failed." }, { status: resendResponse.ok ? 200 : 500 });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
        }
      },
    },
  },
});
