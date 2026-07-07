import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [{ title: "Contact Us - IESVRA" }],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="bg-background text-foreground min-h-screen pb-16">
      <div className="bg-cream py-16 text-center px-4">
        <h1 className="font-display text-4xl md:text-5xl text-navy-deep mb-4">Contact Us</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          We'd love to hear from you. Please fill out the form below or reach out to us directly.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 grid md:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-border">
          <h2 className="text-2xl font-semibold mb-6 text-navy-deep">Send us a message</h2>
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">First Name</label>
                <input
                  type="text"
                  className="w-full h-11 px-4 rounded-md border border-input bg-background focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  placeholder="John"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Last Name</label>
                <input
                  type="text"
                  className="w-full h-11 px-4 rounded-md border border-input bg-background focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email Address</label>
              <input
                type="email"
                className="w-full h-11 px-4 rounded-md border border-input bg-background focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Message</label>
              <textarea
                rows={5}
                className="w-full p-4 rounded-md border border-input bg-background focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors resize-none"
                placeholder="How can we help you?"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-navy-deep text-white h-12 rounded-md font-semibold hover:bg-navy transition"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Contact Details */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-navy-deep">Contact Information</h2>
            <p className="text-muted-foreground mb-8">
              Whether you have a question about features, trials, pricing, need a demo, or anything
              else, our team is ready to answer all your questions.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-navy-deep">Store Location</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  R.N SINGH ROAD
                  <br />
                  KANKARBAGH MAIN ROAD
                  <br />
                  PATNA BIHAR 800020
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-navy-deep">Phone</h4>
                <p className="text-sm text-muted-foreground mt-1">+91 70613 33200</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-navy-deep">Email</h4>
                <p className="text-sm text-muted-foreground mt-1">support.iesvra@gmail.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-navy-deep">Business Hours</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Mon - Sat: 10:00 AM - 7:00 PM
                  <br />
                  Sunday: Closed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
