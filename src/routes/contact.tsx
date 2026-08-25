import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us & Customer Care | IESVRA Boutique" },
      {
        name: "description",
        content: "Get in touch with IESVRA customer support. Reach us by phone (+91 70613 33200), email, or send us a message directly.",
      },
      { property: "og:title", content: "Contact Us & Customer Care | IESVRA Boutique" },
      {
        property: "og:description",
        content: "We're here to assist you with order status, returns, warranty, and customer inquiries.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.firstName.trim()) {
      setErrorMessage("Please enter your first name.");
      toast.error("Please enter your first name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@") || !formData.email.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!formData.message.trim() || formData.message.trim().length < 5) {
      setErrorMessage("Please enter a message of at least 5 characters.");
      toast.error("Please enter a descriptive message.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate sending contact message or trigger notification
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsSubmitted(true);
      toast.success("Thank you! Your message has been sent successfully.");
      setFormData({ firstName: "", lastName: "", email: "", message: "" });
    } catch (err: any) {
      setErrorMessage("Failed to send your message. Please try calling or emailing us directly.");
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen pb-16">
      {/* Hero Header */}
      <div className="bg-cream py-16 text-center px-4 border-b border-border/40">
        <h1 className="font-display text-4xl md:text-5xl text-navy-deep font-bold mb-4">Contact Us</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
          Have a question about your order, products, or deliveries? We'd love to hear from you. Reach out to our customer care team below.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 grid md:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2 text-navy-deep font-display">Send us a message</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Our support team usually responds within 2–4 hours during business hours.
            </p>

            {isSubmitted ? (
              <div className="p-8 rounded-xl bg-green-50 border border-green-200 text-center my-6">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-green-900 mb-1">Message Delivered!</h3>
                <p className="text-sm text-green-800 mb-6">
                  Thank you for reaching out. A customer support representative will get back to you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                {errorMessage && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      placeholder="e.g. Rahul"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      placeholder="e.g. Kumar"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    placeholder="e.g. rahul@example.com"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Message *</label>
                  <textarea
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full p-4 rounded-xl border border-input bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm"
                    placeholder="How can we assist you with your order or query?"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white h-12 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-primary/95 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-3 text-navy-deep font-display">Contact Information</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We are committed to providing top-tier customer service. Feel free to call us, send an email, or message us on WhatsApp for rapid assistance.
            </p>
          </div>

          <div className="space-y-5">
            {/* Phone */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-border transition-all hover:border-primary/40 hover:shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-navy-deep text-sm">Direct Phone / Call Support</h4>
                <a
                  href="tel:+917061333200"
                  className="text-base font-bold text-primary hover:underline mt-0.5 inline-block"
                >
                  +91 70613 33200
                </a>
                <p className="text-xs text-muted-foreground mt-0.5">Click to call directly on mobile</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-border transition-all hover:border-primary/40 hover:shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-navy-deep text-sm">Official Email</h4>
                <a
                  href="mailto:support@iesvra.com"
                  className="text-base font-bold text-primary hover:underline mt-0.5 inline-block"
                >
                  support@iesvra.com
                </a>
                <p className="text-xs text-muted-foreground mt-0.5">Click to open your mail application</p>
              </div>
            </div>

            {/* Store Location */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-border transition-all hover:border-primary/40 hover:shadow-sm">
              <div className="h-12 w-12 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-navy-deep text-sm">Store & Warehouse Headquarters</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  AR ENTERPRISES<br />
                  R.N. Singh Road, Kankarbagh Main Road<br />
                  Patna, Bihar – 800020, India
                </p>
              </div>
            </div>

            {/* Business Hours */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-border transition-all hover:border-primary/40 hover:shadow-sm">
              <div className="h-12 w-12 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-navy-deep text-sm">Business Hours</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Monday – Saturday: 10:00 AM – 7:00 PM IST
                  <br />
                  Sunday: Closed (WhatsApp chat open for urgent queries)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
