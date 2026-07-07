import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [{ title: "Frequently Asked Questions - IESVRA" }],
  }),
  component: FAQPage,
});

function FAQPage() {
  return (
    <div className="bg-background text-foreground min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <h1 className="font-display text-4xl text-navy-deep mb-8 font-semibold">Frequently Asked Questions</h1>

        <div className="space-y-6 mt-8">
          <div className="border border-border/40 rounded-xl p-6 bg-white shadow-sm">
            <h3 className="font-semibold text-lg text-navy-deep mb-2">How can I track my order?</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You can track your order status easily by clicking the "Track Order" link in our header or footer, entering your Order ID, and clicking "Track Now".
            </p>
          </div>

          <div className="border border-border/40 rounded-xl p-6 bg-white shadow-sm">
            <h3 className="font-semibold text-lg text-navy-deep mb-2">What payment methods do you accept?</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We accept a wide range of secure payment options, including UPI (GPay, PhonePe, Paytm), credit/debit cards (Visa, Mastercard, RuPay), and net banking.
            </p>
          </div>

          <div className="border border-border/40 rounded-xl p-6 bg-white shadow-sm">
            <h3 className="font-semibold text-lg text-navy-deep mb-2">How long will it take to get my order?</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Standard delivery takes 3 to 7 business days from the dispatch date depending on location. Metro cities usually receive deliveries within 2 to 4 business days.
            </p>
          </div>

          <div className="border border-border/40 rounded-xl p-6 bg-white shadow-sm">
            <h3 className="font-semibold text-lg text-navy-deep mb-2">What is your return policy?</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We offer a 7-day hassle-free return policy. Products must be unused and in original packaging with tags intact. Please visit our Return & Refund Policy page for more details.
            </p>
          </div>

          <div className="border border-border/40 rounded-xl p-6 bg-white shadow-sm">
            <h3 className="font-semibold text-lg text-navy-deep mb-2">How can I contact customer support?</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You can contact our friendly support team by visiting the "Contact Us" page or emailing us directly at support.iesvra@gmail.com. We are happy to help!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
