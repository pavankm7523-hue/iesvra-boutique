import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  ScrollRestoration,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background px-4 py-16">
      <div className="max-w-lg w-full text-center bg-white p-8 sm:p-12 rounded-3xl border border-border shadow-xl shadow-navy-deep/5">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="font-display text-4xl font-extrabold text-primary">404</span>
        </div>
        
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-deep">
          Page Not Found
        </h1>
        
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Oops! The page or product you're looking for might have been moved, deleted, or never existed.
        </p>

        {/* Quick Links / CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/95 hover:shadow-lg active:scale-95"
          >
            Back to Home
          </Link>
          <Link
            to="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-input bg-background px-6 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-accent hover:text-white active:scale-95"
          >
            Explore Catalog
          </Link>
        </div>

        {/* Popular Quick Navigation */}
        <div className="mt-10 pt-8 border-t border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Popular Destinations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link to="/shop" className="text-xs px-3 py-1.5 rounded-lg bg-muted text-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors">
              🛍️ All Products
            </Link>
            <Link to="/track-order" className="text-xs px-3 py-1.5 rounded-lg bg-muted text-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors">
              🚚 Track Order
            </Link>
            <Link to="/contact" className="text-xs px-3 py-1.5 rounded-lg bg-muted text-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors">
              💬 Customer Care
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background px-4 py-16">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-border shadow-lg">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl font-bold">
          !
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We encountered an unexpected error loading this section. Please try again.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" },
      { name: "theme-color", content: "#6B46C1" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { title: "IESVRA | Everyday Essentials & Extraordinary Deals" },
      { name: "description", content: "Discover premium quality lifestyle products, trendy gadgets, home essentials & extraordinary deals at IESVRA Boutique." },
      { name: "keywords", content: "IESVRA, online shopping, gadgets, electronics, home essentials, deals, AR Enterprises" },
      { name: "author", content: "IESVRA" },
      { property: "og:site_name", content: "IESVRA Boutique" },
      { property: "og:title", content: "IESVRA | Everyday Essentials & Extraordinary Deals" },
      {
        property: "og:description",
        content: "Discover premium quality lifestyle products, trendy gadgets, home essentials & extraordinary deals at IESVRA Boutique.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://iesvra.com/iesvra-logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "IESVRA | Everyday Essentials & Extraordinary Deals" },
      {
        name: "twitter:description",
        content: "Discover premium quality lifestyle products, trendy gadgets, home essentials & extraordinary deals at IESVRA Boutique.",
      },
      { name: "twitter:image", content: "https://iesvra.com/iesvra-logo.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap",
      },
      { rel: "shortcut icon", href: "/favicon.ico" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", href: "/favicon-48x48.png", sizes: "48x48" },
      { rel: "icon", type: "image/png", href: "/favicon-96x96.png", sizes: "96x96" },
      { rel: "icon", type: "image/png", href: "/favicon-32x32.png", sizes: "32x32" },
      { rel: "icon", type: "image/png", href: "/favicon-192x192.png", sizes: "192x192" },
      { rel: "icon", type: "image/png", href: "/favicon-512x512.png", sizes: "512x512" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "IESVRA",
    "url": "https://iesvra.com",
    "logo": "https://iesvra.com/iesvra-logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-7061333200",
      "contactType": "customer service"
    }
  };

  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.GOOGLE_CLIENT_ID = ${JSON.stringify(
              (typeof process !== "undefined" ? process.env?.GOOGLE_CLIENT_ID : null) || "129499608888-ffjcvvrv58mjm3g0avv4h0ehpt7ft98f.apps.googleusercontent.com"
            )};`
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Dynamically load Google Maps JavaScript API if key is present
  useEffect(() => {
    if (typeof window === "undefined") return;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || localStorage.getItem("IESVRA_google_maps_key") || "";
    if (!apiKey) return;

    if ((window as any).google?.maps?.places) return; // already loaded

    const scriptId = "google-maps-sdk";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=en`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex flex-col">
          <ScrollRestoration />
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
        <Footer />
        <BottomNav />
        <Toaster position="bottom-right" richColors closeButton />

        {/* Floating WhatsApp Button */}
        <a
          href="https://wa.me/917061333200"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-[86px] md:bottom-6 right-4.5 md:right-6 z-[9999] w-[56px] h-[56px] rounded-full bg-[#25D366] flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.45)] no-underline transition-all duration-200 hover:scale-110 active:scale-95"
        >
          {/* Pulse ring */}
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              backgroundColor: "#25D366",
              opacity: 0.4,
              animation: "whatsapp-pulse 2s ease-out infinite",
            }}
          />
          {/* WhatsApp SVG icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="32"
            height="32"
            fill="white"
            style={{ position: "relative", zIndex: 1 }}
          >
            <path d="M16 2C8.268 2 2 8.268 2 16c0 2.47.644 4.786 1.768 6.797L2 30l7.438-1.732A13.926 13.926 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6a11.555 11.555 0 0 1-5.893-1.608l-.422-.25-4.414 1.027 1.053-4.292-.277-.44A11.556 11.556 0 0 1 4.4 16C4.4 9.59 9.59 4.4 16 4.4S27.6 9.59 27.6 16 22.41 27.6 16 27.6zm6.34-8.646c-.347-.174-2.057-1.015-2.377-1.13-.32-.116-.553-.174-.786.174-.233.347-.903 1.13-1.107 1.363-.204.232-.407.26-.754.087-.347-.174-1.463-.539-2.787-1.72-1.03-.918-1.724-2.052-1.927-2.4-.203-.346-.021-.534.152-.706.157-.155.348-.406.522-.609.174-.203.232-.347.348-.58.116-.232.058-.435-.029-.609-.087-.174-.786-1.896-1.077-2.595-.283-.682-.572-.59-.786-.6l-.668-.012c-.232 0-.61.087-.928.434-.319.347-1.22 1.19-1.22 2.902s1.249 3.366 1.423 3.598c.174.232 2.457 3.753 5.953 5.264.832.36 1.481.574 1.987.735.835.266 1.596.228 2.198.138.67-.1 2.057-.841 2.348-1.654.29-.813.29-1.51.203-1.655-.086-.144-.319-.232-.667-.406z" />
          </svg>
        </a>

        <style>{`
          @keyframes whatsapp-pulse {
            0% { transform: scale(1); opacity: 0.4; }
            70% { transform: scale(1.6); opacity: 0; }
            100% { transform: scale(1.6); opacity: 0; }
          }
        `}</style>
      </div>
    </QueryClientProvider>
  );
}
