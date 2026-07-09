import { createFileRoute } from "@tanstack/react-router";
import Razorpay from "razorpay";
import process from "node:process";

// Helper to construct Razorpay client dynamically using process.env
const getRazorpayInstance = () => {
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay API keys are not configured in environment variables.");
  }
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

export const Route = createFileRoute("/api/create-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { amount } = body; // total amount in paise

          if (!amount || typeof amount !== "number" || amount <= 0) {
            return new Response(
              JSON.stringify({ error: "Invalid amount. Must be a positive number in paise." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const razorpay = getRazorpayInstance();

          const options = {
            amount: Math.round(amount),
            currency: "INR",
            receipt: `rcpt_${Math.floor(100000 + Math.random() * 900000)}`,
          };

          const order = await razorpay.orders.create(options);

          return new Response(JSON.stringify({ order_id: order.id, key_id: process.env.RAZORPAY_KEY_ID || "" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("Error creating Razorpay order:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Failed to create Razorpay order." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
