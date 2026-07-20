import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

// ─── Supabase helpers ──────────────────────────────────────────────────────────

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) throw new Error("Supabase credentials missing.");
  return { url, key };
}

const PLUS_KEY = "plus_members"; // row id in the orders table used as metadata store

async function readPlusMembers(url: string, key: string): Promise<any[]> {
  const res = await fetch(
    `${url}/rest/v1/orders?id=eq.${encodeURIComponent(PLUS_KEY)}&select=*`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  if (!res.ok) return [];
  const list = await res.json();
  if (!list || list.length === 0) return [];
  const raw = list[0].items;
  if (!raw) return [];
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return []; } }
  if (Array.isArray(raw)) return raw;
  return [];
}

async function writePlusMembers(url: string, key: string, members: any[]): Promise<boolean> {
  const record = {
    id: PLUS_KEY,
    customer_name: "System Store",
    customer_email: "system@iesvra.com",
    customer_phone: "0000000000",
    shipping_address: "IESVRA Plus Membership Store",
    items: members,
    subtotal: 0,
    shipping: 0,
    total: 0,
    date: new Date().toISOString(),
    status: "Processing",
    payment_status: "Pending",
  };

  // Delete existing row first (upsert pattern used throughout the codebase)
  await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(PLUS_KEY)}`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });

  const res = await fetch(`${url}/rest/v1/orders`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(record),
  });

  return res.ok;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/api/plus-membership")({
  server: {
    handlers: {
      // ── GET /api/plus-membership?email=user@example.com ────────────────────
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const email = (url.searchParams.get("email") || "").trim().toLowerCase();

          if (!email) {
            return new Response(
              JSON.stringify({ error: "email query parameter is required." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const { url: sbUrl, key } = getSupabaseConfig();
          const members = await readPlusMembers(sbUrl, key);
          const record = members.find((m: any) => m.email?.toLowerCase() === email);

          if (!record) {
            return new Response(JSON.stringify({ isMember: false }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          // ✅ Server-side expiry check — client never decides
          const expiry = new Date(record.member_expiry);
          const isExpired = expiry <= new Date();

          if (isExpired) {
            return new Response(
              JSON.stringify({ isMember: false, expired: true, expiry: record.member_expiry }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          return new Response(
            JSON.stringify({
              isMember: true,
              since: record.member_since,
              expiry: record.member_expiry,
              razorpay_payment_id: record.razorpay_payment_id,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err: any) {
          console.error("[plus-membership GET]", err);
          return new Response(
            JSON.stringify({ error: err.message || "Failed to check membership." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },

      // ── POST /api/plus-membership ──────────────────────────────────────────
      // Body: { email, razorpay_payment_id, member_since?, member_expiry? }
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const email = (body.email || "").trim().toLowerCase();
          const paymentId = (body.razorpay_payment_id || "").trim();

          if (!email || !paymentId) {
            return new Response(
              JSON.stringify({ error: "email and razorpay_payment_id are required." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Reject obviously-fake payment IDs (must start with "pay_")
          if (!paymentId.startsWith("pay_")) {
            return new Response(
              JSON.stringify({ error: "Invalid payment ID format." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const now = new Date();
          const oneYearLater = new Date(now);
          oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

          const memberSince = body.member_since || now.toISOString();
          const memberExpiry = body.member_expiry || oneYearLater.toISOString();

          const { url: sbUrl, key } = getSupabaseConfig();
          const members = await readPlusMembers(sbUrl, key);

          // Upsert — update existing entry or append new one
          const existingIdx = members.findIndex((m: any) => m.email?.toLowerCase() === email);
          const newRecord = {
            email,
            razorpay_payment_id: paymentId,
            member_since: memberSince,
            member_expiry: memberExpiry,
          };

          if (existingIdx >= 0) {
            members[existingIdx] = newRecord;
          } else {
            members.push(newRecord);
          }

          const saved = await writePlusMembers(sbUrl, key, members);

          if (!saved) {
            return new Response(
              JSON.stringify({ error: "Failed to save membership to database." }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, email, expiry: memberExpiry }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err: any) {
          console.error("[plus-membership POST]", err);
          return new Response(
            JSON.stringify({ error: err.message || "Failed to save membership." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
