import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [{ title: "Shipping Policy - IESVRA" }],
  }),
  component: ShippingPolicy,
});

function ShippingPolicy() {
  return (
    <div className="bg-background text-foreground min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <h1 className="font-display text-4xl text-navy-deep mb-8 font-semibold">Shipping Policy</h1>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>Last updated: June 1, 2026</p>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">1. Shipping Coverage</h2>
          <p>
            We offer shipping across all major locations in India. All orders are packed securely in our warehouse and dispatched through trusted courier partners.
          </p>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">2. Shipping Charges</h2>
          <p>
            We offer <strong>Free Shipping</strong> on all orders above ₹499. For orders below ₹499, a standard shipping fee of ₹49 applies.
          </p>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">3. Delivery Timelines</h2>
          <p>
            Standard delivery takes 3 to 7 business days from the date of dispatch, depending on your location. Metro cities usually receive deliveries within 2 to 4 business days.
          </p>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">4. Order Tracking</h2>
          <p>
            Once your order is shipped, you will receive a tracking ID via email or SMS. You can also track your order directly on our website using our dedicated Track Order page.
          </p>
        </div>
      </div>
    </div>
  );
}
