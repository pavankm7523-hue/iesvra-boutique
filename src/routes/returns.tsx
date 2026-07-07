import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [{ title: "Return & Refund Policy - IESVRA" }],
  }),
  component: ReturnPolicy,
});

function ReturnPolicy() {
  return (
    <div className="bg-background text-foreground min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <h1 className="font-display text-4xl text-navy-deep mb-8 font-semibold">Return & Refund Policy</h1>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>Last updated: June 1, 2026</p>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">1. Easy 7-Day Returns</h2>
          <p>
            We want you to love your purchase. If you are not entirely satisfied, we offer a hassle-free <strong>7-day return policy</strong> from the date of delivery.
          </p>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">2. Conditions for Return</h2>
          <p>
            To be eligible for a return, the product must be:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Unused, unwashed, and in the same condition as received.</li>
            <li>In its original packaging with all tags, user manuals, and warranty cards intact.</li>
            <li>Accompanied by the original invoice or proof of purchase.</li>
          </ul>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">3. Refund Process</h2>
          <p>
            Once we receive and inspect your returned product, we will process your refund within 5 to 7 business days. The refund will be credited back to your original payment method (or as store credit if requested).
          </p>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">4. Non-Returnable Items</h2>
          <p>
            Certain items are non-returnable due to hygiene or health reasons (e.g. personal care items, cosmetics, innerwear). Please check the product details page before placing your order.
          </p>
        </div>
      </div>
    </div>
  );
}
