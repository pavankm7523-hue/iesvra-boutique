import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [{ title: "Terms & Conditions - IESVRA" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="bg-background text-foreground min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <h1 className="font-display text-4xl text-navy-deep mb-8 font-semibold">
          Terms & Conditions
        </h1>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>Last updated: June 1, 2026</p>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">1. Agreement to Terms</h2>
          <p>
            By accessing our website and purchasing our products, you agree to be bound by these
            Terms and Conditions and our Privacy Policy. If you do not agree with any part of these
            terms, please do not use our website.
          </p>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">
            2. Products and Pricing
          </h2>
          <p>
            We reserve the right to modify or discontinue any product at any time. We also reserve
            the right to change prices at any time without notice. All descriptions of products or
            product pricing are subject to change at anytime without notice, at the sole discretion
            of us. We reserve the right to discontinue any product at any time.
          </p>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">
            3. Shipping and Delivery
          </h2>
          <p>
            Delivery times are estimates and commence from the date of shipping, rather than the
            date of order. Delivery times are to be used as a guide only and are subject to the
            acceptance and approval of your order.
          </p>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">4. Returns and Refunds</h2>
          <p>
            We accept returns within 14 days of receipt, provided the items are unused, in their
            original packaging, and in resalable condition. To initiate a return, please contact our
            support team. Refunds will be processed to the original method of payment.
          </p>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">5. Governing Law</h2>
          <p>
            These Terms and Conditions and any separate agreements whereby we provide you services
            shall be governed by and construed in accordance with the laws of India.
          </p>
        </div>
      </div>
    </div>
  );
}
