import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Heart, ShieldCheck, Gem } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [{ title: "About Us - IESVRA" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <div className="bg-navy-deep py-20 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8')] bg-cover bg-center" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl text-white mb-6">Our Story</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Founded with a passion for quality and design, IESVRA is your premier destination
            for everyday essentials that don't compromise on excellence.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold text-navy-deep mb-6">
              More than just a boutique
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                At IESVRA, we believe that the objects we interact with every day should bring
                joy, functionality, and lasting value to our lives. That's why we meticulously
                curate our collection, working directly with artisans and top-tier manufacturers
                globally.
              </p>
              <p>
                Our journey began in 2020, born from a simple observation: finding high-quality,
                beautifully designed lifestyle products at fair prices was harder than it should be.
              </p>
              <p>
                Today, we serve thousands of happy customers, offering everything from cutting-edge
                audio gear to wellness essentials, all united by our core philosophy of accessible
                luxury.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1555529771-835f59fc5efe?auto=format&fit=crop&q=80"
              alt="Apparel"
              className="rounded-lg object-cover h-64 w-full"
            />
            <img
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80"
              alt="Audio"
              className="rounded-lg object-cover h-64 w-full mt-8"
            />
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl font-semibold text-navy-deep mb-4">
              Our Core Values
            </h2>
            <p className="text-muted-foreground">
              The principles that guide everything we do, from product selection to customer
              service.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Gem,
                title: "Uncompromising Quality",
                desc: "We never settle for second best. Every product is rigorously tested.",
              },
              {
                icon: Heart,
                title: "Customer First",
                desc: "Your satisfaction is our primary metric for success.",
              },
              {
                icon: Sparkles,
                title: "Thoughtful Design",
                desc: "Aesthetics matter. We choose products that look as good as they function.",
              },
              {
                icon: ShieldCheck,
                title: "Integrity",
                desc: "Honest pricing, transparent policies, and secure transactions.",
              },
            ].map((v, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl text-center shadow-sm border border-border"
              >
                <div className="h-12 w-12 rounded-full bg-gold/15 flex items-center justify-center text-gold mx-auto mb-4">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-navy-deep mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
