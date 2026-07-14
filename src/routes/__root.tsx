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
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "IESVRA" },
      { name: "description", content: "IESVRA - Everyday essentials, extraordinary deals." },
      { name: "author", content: "IESVRA" },
      { property: "og:title", content: "IESVRA" },
      {
        property: "og:description",
        content: "IESVRA - Everyday essentials, extraordinary deals.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://iesvra.com/favicon.png" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "IESVRA" },
      {
        name: "twitter:description",
        content: "IESVRA - Everyday essentials, extraordinary deals.",
      },
      { name: "twitter:image", content: "https://iesvra.com/favicon.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", href: "/favicon-32x32.png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/favicon-192x192.png" },
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
    "logo": "https://iesvra.com/favicon.png",
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
              (typeof process !== "undefined" ? process.env?.GOOGLE_CLIENT_ID : null) || "825754182940-32tep8cm2tku2cdpfmd29adhn8q8j4du.apps.googleusercontent.com"
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
        <Toaster position="bottom-right" richColors closeButton />

        {/* Floating WhatsApp Button */}
        <a
          href="https://wa.me/917061333200"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            width: "58px",
            height: "58px",
            borderRadius: "50%",
            backgroundColor: "#25D366",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(37,211,102,0.45)",
            textDecoration: "none",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.12)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 28px rgba(37,211,102,0.6)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(37,211,102,0.45)";
          }}
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
