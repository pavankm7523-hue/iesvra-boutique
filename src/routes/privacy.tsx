import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy & Data Protection | IESVRA Boutique" },
      {
        name: "description",
        content: "Learn how IESVRA protects your privacy, personal information, and transaction security across our platform and mobile applications.",
      },
      { property: "og:title", content: "Privacy Policy & Data Protection | IESVRA Boutique" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="bg-background text-foreground min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <h1 className="font-display text-3xl sm:text-4xl text-navy-deep mb-4 font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective Date: June 1, 2026 | Last Updated: July 25, 2026</p>

        <div className="space-y-6 text-slate-700 leading-relaxed text-sm sm:text-base">
          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-navy-deep mb-3">1. Overview & Data Controller</h2>
            <p>
              IESVRA ("we", "our", or "us") operates the IESVRA web platform and mobile application. We are committed to safeguarding your privacy and ensuring transparency regarding how your personal information is collected, stored, and processed.
            </p>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-navy-deep mb-3">2. Data We Collect & How We Collect It</h2>
            <p className="mb-3">Based on your interactions with our app and services, we collect the following data types:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Contact & Profile Info:</strong> Full Name, Email Address, and Mobile Phone Number provided during user registration, guest checkout, or profile updates.</li>
              <li><strong>Delivery & Location Data:</strong> Physical Shipping Address, City, Postal/PIN Code, and Precise GPS Coordinates / Geolocation (collected via device location services or map pinpoint for order delivery validation).</li>
              <li><strong>Transaction & Purchase History:</strong> Order IDs, items purchased, subtotal, delivery preferences, coupon codes, and membership status (IESVRA Plus).</li>
              <li><strong>Payment Information:</strong> Online payment transaction reference IDs and payment method selected. <em>Note: Full credit/debit card numbers, UPI PINs, and banking credentials are handled directly by Razorpay and are never stored on IESVRA servers.</em></li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-navy-deep mb-3">3. Third-Party Service Providers</h2>
            <p className="mb-3">We share necessary data with trusted third-party service providers solely to perform essential app functions:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase Inc. (Cloud Database & Auth):</strong> Encrypted PostgreSQL cloud storage for account data, order history, and product catalog.</li>
              <li><strong>Razorpay Software Private Limited (Payments):</strong> Payment processing gateway for credit/debit cards, NetBanking, UPI, and Wallet payments.</li>
              <li><strong>Google LLC (Google Sign-In):</strong> Optional single-sign-on OAuth authentication.</li>
              <li><strong>OpenStreetMap / Nominatim (Geocoding):</strong> Reverse geocoding for delivery address autocomplete and pin placement.</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-navy-deep mb-3">4. Data Retention & Security</h2>
            <p>
              Your data is stored securely in our Supabase cloud database with Industry-standard SSL/TLS encryption in transit and at rest. Account and order records are retained for as long as your account remains active or as required by law for tax and accounting compliance.
            </p>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="account-deletion">
            <h2 className="text-lg font-bold text-navy-deep mb-3">5. Account & Data Deletion Policy & Instructions</h2>
            <p className="mb-3">
              We respect your right to control your personal data. Users have the right to request the permanent deletion of their IESVRA account and all associated personal information at any time.
            </p>
            <h3 className="font-bold text-slate-800 text-sm mb-2">How to Request Account & Data Deletion:</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                <strong>Option 1 — Email Request:</strong> Send an email from your registered email address to <a href="mailto:arenterprisess409@gmail.com" className="text-purple-600 font-semibold underline">arenterprisess409@gmail.com</a> or <a href="mailto:privacy@iesvra.com" className="text-purple-600 font-semibold underline">privacy@iesvra.com</a> with the subject line <code>"Account Deletion Request"</code>.
              </li>
              <li>
                <strong>Option 2 — Support Contact:</strong> Submit a request through our <a href="/contact" className="text-purple-600 font-semibold underline">Contact Us Form</a> specifying your account email address.
              </li>
            </ul>
            <h3 className="font-bold text-slate-800 text-sm mb-2">Data Deleted vs. Data Retained:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Data Deleted Permanently:</strong> Your user profile, full name, email address, password hash, saved delivery addresses, phone number, and account preferences will be permanently wiped from our databases within 48 to 72 hours of receiving your request.</li>
              <li><strong>Data Retained:</strong> Non-personally identifiable aggregated transaction records may be retained strictly as required by local tax, billing, and accounting compliance laws.</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-navy-deep mb-3">6. Contact Us</h2>
            <p>
              For any questions or concerns regarding this Privacy Policy, please contact us at:<br/>
              <strong>IESVRA Support Team</strong><br/>
              Email: <a href="mailto:support@iesvra.com" className="text-purple-600 font-semibold underline">support@iesvra.com</a><br/>
              Address: New Jaganpura, Patna, Bihar, India - 800027
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
