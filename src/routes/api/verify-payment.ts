import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";
import process from "node:process";

export const Route = createFileRoute("/api/verify-payment")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

          if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return new Response(
              JSON.stringify({ error: "Missing required parameters for verification." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const LIVE_RAZORPAY_KEY_SECRET = "gqYPsTl2GE9U5rgNuYI6oyOB";
          // Strip UTF-8 BOM (\uFEFF) that PowerShell/Windows may add to env vars
          const envKey = (process.env.RAZORPAY_KEY_ID || "").replace(/^\uFEFF/, "").trim();
          const envSecret = (process.env.RAZORPAY_KEY_SECRET || "").replace(/^\uFEFF/, "").trim();
          const keySecret = (envSecret && !envKey.startsWith("rzp_test_")) ? envSecret : LIVE_RAZORPAY_KEY_SECRET;

          // Signature verification: hmac = SHA256(order_id + "|" + payment_id, secret)
          const hmac = crypto.createHmac("sha256", keySecret);
          hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
          const generatedSignature = hmac.digest("hex");

          if (generatedSignature === razorpay_signature) {
            return new Response(JSON.stringify({ status: "success", verified: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } else {
            return new Response(
              JSON.stringify({ status: "failure", verified: false, error: "Invalid signature" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }
        } catch (error: any) {
          console.error("Error verifying payment signature:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Failed to verify signature." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
