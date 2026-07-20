import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useProducts, useCategories } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { addToCart } from "@/lib/cart";
import {
  ShieldCheck,
  Truck,
  RefreshCw,
  Award,
  ArrowRight,
  Zap,
  Globe,
  Map,
  Search,
  Mic,
  MoreHorizontal,
  Smartphone,
  Crown,
  Headphones,
  MapPin,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IESVRA — India's Smartest Shopping App" },
      {
        name: "description",
        content:
          "Experience smart shopping like never before with IESVRA. 15 min delivery, best prices, quality products everyday.",
      },
    ],
  }),
  component: Home,
});

export function Home() {
  const navigate = useNavigate();
  const { isLoaded, bestSellersList, products } = useProducts();
  const { categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Voice Search Handler
  const handleVoiceSearch = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice search is not supported in your browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Listening... speak your search term");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
        toast.success(`Searching for: "${transcript}"`);
        navigate({ to: "/shop", search: { q: transcript } });
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error("Could not recognize voice input. Please try again.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
      toast.error("Voice recognition failed to start.");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: "/shop", search: { q: searchQuery.trim() } });
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail.trim() || !subscriberEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsSubscribing(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscriberEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to subscribe.");
      toast.success("Thanks for subscribing!");
      setSubscriberEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to subscribe. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };



  return (
    <div className="bg-[#F6F7FB] text-slate-800 font-sans pb-20 md:pb-12">
      {/* ========================================================
          1. HERO BANNER (MATCHING REFERENCE SCREENSHOT)
         ======================================================== */}
      <section className="w-full bg-gradient-to-r from-[#4C1D95] via-[#5B21B6] to-[#7C3AED] text-white pt-6 pb-8 md:pt-10 md:pb-12 relative overflow-hidden select-none">
        {/* Glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-10">
            
            {/* Left Content */}
            <div className="flex-1 text-center md:text-left space-y-4 max-w-xl">
              {/* App Brand Header */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
                <span className="font-extrabold tracking-tight text-white text-xs sm:text-sm">
                  IESVRA<sup className="text-[9px] font-normal font-sans">®</sup>
                </span>
                <span className="text-white/40 text-xs">—</span>
                <span className="text-[11px] font-medium text-purple-100 tracking-wide">
                  India's Smartest Shopping App
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.08] tracking-tight uppercase">
                SMART SHOPPING, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-300 to-white drop-shadow-sm">
                  FASTER DELIVERY!
                </span>
              </h1>

              {/* Subtitle Pill Button */}
              <div className="pt-1">
                <span className="inline-block bg-gradient-to-r from-[#1A0938] to-[#2E0B5B] text-amber-300 px-5 py-2 rounded-full text-xs sm:text-sm font-extrabold tracking-wider border border-amber-400/40 shadow-lg">
                  SHOP MORE, <span className="text-white">SAVE MORE,</span> GET MORE!
                </span>
              </div>
            </div>

            {/* Right Graphic: 3D Render Illustration */}
            <div className="flex-1 w-full max-w-md sm:max-w-lg flex items-center justify-center relative select-none">
              <img
                src="/hero-banner-3d.png"
                alt="IESVRA Smart Shopping Rider & App"
                className="w-full h-auto max-h-[300px] sm:max-h-[380px] object-contain drop-shadow-2xl hover:scale-102 transition-transform duration-500"
              />
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================
          2. DELIVERY SLA BADGES STRIP (4 PILLARS)
         ======================================================== */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-4 sm:-mt-6 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          
          {/* Badge 1: 15 Min Delivery */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-pink-200/80 flex items-center gap-3 transition-transform hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center shrink-0 text-pink-600">
              <Zap className="h-5 w-5 fill-pink-500" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[10px] sm:text-xs font-extrabold text-pink-600 tracking-wider uppercase">
                UNDER 15 KM
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                15 MIN <span className="font-bold text-slate-600 text-[10px] sm:text-xs block sm:inline">DELIVERY</span>
              </div>
            </div>
          </div>

          {/* Badge 2: 1 Day Delivery */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-sky-200/80 flex items-center gap-3 transition-transform hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0 text-sky-600">
              <Truck className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[10px] sm:text-xs font-extrabold text-sky-600 tracking-wider uppercase">
                IN CITY
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                1 DAY <span className="font-bold text-slate-600 text-[10px] sm:text-xs block sm:inline">DELIVERY</span>
              </div>
            </div>
          </div>

          {/* Badge 3: 2-3 Days Delivery */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-indigo-200/80 flex items-center gap-3 transition-transform hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-600">
              <Map className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[10px] sm:text-xs font-extrabold text-indigo-600 tracking-wider uppercase">
                ALL INDIA
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                2-3 DAYS <span className="font-bold text-slate-600 text-[10px] sm:text-xs block sm:inline">DELIVERY</span>
              </div>
            </div>
          </div>

          {/* Badge 4: Worldwide Delivery */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-emerald-200/80 flex items-center gap-3 transition-transform hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600">
              <Globe className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[10px] sm:text-xs font-extrabold text-emerald-600 tracking-wider uppercase">
                WORLDWIDE
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                4-5 DAYS <span className="font-bold text-slate-600 text-[10px] sm:text-xs block sm:inline">DELIVERY</span>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================
          3. TRUST RIBBON BAR (DARK PURPLE BAR)
         ======================================================== */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-3 sm:mt-4">
        <div className="bg-[#380E83] text-white rounded-2xl py-3 px-4 shadow-md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center sm:text-left">
            
            {/* Trust Item 1 */}
            <div className="flex items-center justify-center sm:justify-start gap-2 border-r border-white/10 last:border-0 pr-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 text-purple-200" />
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold tracking-wider uppercase whitespace-nowrap">
                SAFE & SECURE
              </span>
            </div>

            {/* Trust Item 2 */}
            <div className="flex items-center justify-center sm:justify-start gap-2 border-r border-white/10 last:border-0 pr-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Award className="h-4 w-4 text-amber-300" />
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold tracking-wider uppercase whitespace-nowrap">
                BEST PRICES
              </span>
            </div>

            {/* Trust Item 3 */}
            <div className="flex items-center justify-center sm:justify-start gap-2 border-r border-white/10 last:border-0 pr-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <RefreshCw className="h-4 w-4 text-purple-200" />
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold tracking-wider uppercase whitespace-nowrap">
                EASY RETURNS
              </span>
            </div>

            {/* Trust Item 4 */}
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Headphones className="h-4 w-4 text-purple-200" />
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold tracking-wider uppercase whitespace-nowrap">
                24/7 SUPPORT
              </span>
            </div>

          </div>
        </div>
      </section>








      {/* ========================================================
          6. APP DOWNLOAD BANNER (MATCHING SCREENSHOT)
         ======================================================== */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-6">
        <div className="bg-gradient-to-r from-[#380E83] via-[#4C1D95] to-[#5B21B6] rounded-2xl p-5 sm:p-8 text-white relative overflow-hidden shadow-xl">
          {/* Background graphics */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            
            {/* Left Content */}
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-purple-200">
                DOWNLOAD THE
              </div>
              <h3 className="text-xl sm:text-3xl font-black font-display tracking-tight text-white uppercase">
                IESVRA APP
              </h3>
              <p className="text-xs sm:text-sm text-purple-100 font-semibold max-w-md">
                EXPERIENCE SMART SHOPPING LIKE NEVER BEFORE!
              </p>

              {/* App Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <a
                  href="/mobile-app/index.html"
                  className="hover:scale-105 transition-transform"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                    alt="Google Play"
                    className="h-9"
                  />
                </a>
                <a
                  href="/mobile-app/index.html"
                  className="hover:scale-105 transition-transform"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                    alt="App Store"
                    className="h-9"
                  />
                </a>
              </div>
            </div>

            {/* Right Graphic: Smartphone & Gift Bag Mockup */}
            <div className="w-36 sm:w-48 shrink-0 flex items-center justify-center select-none">
              <img
                src="/hero-banner-3d.png"
                alt="IESVRA Mobile App"
                className="w-full h-auto object-contain max-h-36 sm:max-h-44 drop-shadow-xl"
              />
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================
          7. SHOP BY CATEGORY SECTION (MATCHING SCREENSHOT)
         ======================================================== */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight">
            Shop by Category
          </h2>
          <Link
            to="/shop"
            className="text-xs sm:text-sm font-bold text-[#6B46C1] hover:text-purple-800 flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
          {categories.map((c) => (
            <Link
              key={c.name}
              to="/shop"
              search={{ category: c.name }}
              className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col items-center text-center cursor-pointer"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center p-3 mb-3 group-hover:bg-purple-50 transition-colors">
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#6B46C1] transition-colors leading-tight line-clamp-2">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>


      {/* ========================================================
          8. BEST SELLERS SECTION
         ======================================================== */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-6 border-b border-slate-200/60 pb-3">
          <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
            Best Sellers & Top Deals
          </h2>
          <Link
            to="/shop"
            className="text-xs sm:text-sm font-bold text-[#6B46C1] hover:text-purple-800 flex items-center gap-1 transition-colors"
          >
            Explore All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
          {!isLoaded
            ? null
            : bestSellersList.slice(0, 10).map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  customBadge={
                    idx === 0
                      ? "Best Seller"
                      : idx === 1
                      ? "Trending"
                      : idx === 2
                      ? "New"
                      : idx === 3
                      ? "15 Min Fast"
                      : undefined
                  }
                />
              ))}
        </div>
      </section>


      {/* ========================================================
          9. NEWSLETTER SUBSCRIPTION STRIP
         ======================================================== */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-12 mb-6">
        <div className="bg-[#380E83] rounded-3xl p-6 sm:p-10 text-white text-center shadow-xl">
          <h3 className="text-xl sm:text-2xl font-bold font-display mb-2">
            Stay Updated with IESVRA Deals
          </h3>
          <p className="text-xs sm:text-sm text-purple-200 mb-6 max-w-md mx-auto">
            Subscribe to get instant notifications on price drops, flash sales, and exclusive coupons.
          </p>
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto"
          >
            <input
              type="email"
              value={subscriberEmail}
              onChange={(e) => setSubscriberEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isSubscribing}
              className="flex-1 h-11 px-5 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white transition-colors"
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="h-11 px-7 bg-amber-400 hover:bg-amber-500 text-purple-950 font-bold rounded-full text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubscribing ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
