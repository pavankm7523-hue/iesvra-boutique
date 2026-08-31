import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useProducts, Product } from "@/lib/products";
import { useHeroBanners } from "@/lib/hero";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";
import {
  Flame,
  Tag,
  Percent,
  Clock,
  Check,
  Copy,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  Zap,
  Gift,
  Star,
  SlidersHorizontal,
} from "lucide-react";

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: [
      { title: "Exclusive Deals, Flash Sales & Coupons | IESVRA Boutique" },
      {
        name: "description",
        content: "Discover today's best online deals, flash discounts up to 70% off, promo coupons, and budget stores at IESVRA Boutique.",
      },
      { property: "og:title", content: "Exclusive Deals, Flash Sales & Coupons | IESVRA Boutique" },
      {
        property: "og:description",
        content: "Grab verified price drops, copy active discount coupons, and enjoy express delivery all over India.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DealsPage,
});

const COUPONS = [
  {
    code: "FIRST15",
    discount: "15% OFF",
    title: "First Order Special",
    desc: "Flat 15% discount on your first order with no minimum spend.",
    badge: "Most Popular",
    color: "from-amber-500 to-amber-600",
  },
  {
    code: "WELCOME10",
    discount: "10% OFF",
    title: "Welcome Discount",
    desc: "Flat 10% discount for all customers on their purchases.",
    badge: "Verified",
    color: "from-purple-600 to-indigo-600",
  },
  {
    code: "FREESHIP",
    discount: "FREE SHIPPING",
    title: "Free Express Delivery",
    desc: "100% free courier delivery across India on all eligible orders.",
    badge: "Free Delivery",
    color: "from-emerald-600 to-teal-600",
  },
  {
    code: "FESTIVE10",
    discount: "EXTRA 10% OFF",
    title: "Festive Bonus Saver",
    desc: "Extra 10% instant discount up to ₹250 on premium orders.",
    badge: "Limited Time",
    color: "from-rose-500 to-pink-600",
  },
];

function DealsPage() {
  const { products: allProducts } = useProducts();
  const { data: banners } = useHeroBanners();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"all" | "mega" | "under499" | "bestseller" | "coupons">("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Live countdown timer for Flash Deals (counts down to midnight)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 5,
    minutes: 42,
    seconds: 18,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = Math.max(0, endOfDay.getTime() - now.getTime());

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    localStorage.setItem("IESVRA_applied_coupon", code);
    window.dispatchEvent(new CustomEvent("iesvra-coupon-updated"));
    toast.success(`Coupon code "${code}" copied & applied to your cart!`);

    setTimeout(() => {
      setCopiedCode(null);
    }, 3000);
  };

  // Filter deals products based on selected tab
  const dealProducts = useMemo(() => {
    const discounted = allProducts.filter((p) => {
      const hasPriceDrop = p.mrp && p.mrp > p.price;
      const discountPct = hasPriceDrop ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

      if (activeTab === "mega") {
        return discountPct >= 40;
      }
      if (activeTab === "under499") {
        return p.price <= 499 && hasPriceDrop;
      }
      if (activeTab === "bestseller") {
        return Boolean(p.isBestSeller);
      }
      return hasPriceDrop || Boolean(p.isBestSeller);
    });

    // Sort by largest discount percentage
    return discounted.sort((a, b) => {
      const discA = a.mrp && a.mrp > a.price ? (a.mrp - a.price) / a.mrp : 0;
      const discB = b.mrp && b.mrp > b.price ? (b.mrp - b.price) / b.mrp : 0;
      return discB - discA;
    });
  }, [allProducts, activeTab]);

  return (
    <div className="bg-[#F8F9FC] min-h-screen text-foreground font-sans pb-24">
      {/* ========================================================
          1. HERO FLASH SALE HEADER BANNER WITH LIVE TIMER
         ======================================================== */}
      <div className="bg-gradient-to-r from-[#1A0B3B] via-[#2E1065] to-[#4C1D95] text-white py-12 md:py-16 px-4 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm animate-pulse">
            <Flame className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span>Mega Flash Sale • Up to 70% OFF</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white">
            Today's Best <span className="text-amber-300 italic font-light">Deals & Offers</span>
          </h1>

          <p className="text-purple-200 max-w-2xl mx-auto text-xs md:text-sm font-medium">
            Handpicked price drops, instant discount coupons, and extraordinary bargains verified daily.
          </p>

          {/* Live Real-time Countdown Box */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-extrabold">
            <span className="text-amber-200 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Clock className="h-4 w-4 text-amber-400" /> Deals End In:
            </span>
            <div className="flex items-center gap-1.5">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg text-amber-300 font-mono text-base font-black">
                {String(timeLeft.hours).padStart(2, "0")}h
              </div>
              <span className="text-amber-400 font-bold">:</span>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg text-amber-300 font-mono text-base font-black">
                {String(timeLeft.minutes).padStart(2, "0")}m
              </div>
              <span className="text-amber-400 font-bold">:</span>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg text-amber-300 font-mono text-base font-black">
                {String(timeLeft.seconds).padStart(2, "0")}s
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ========================================================
            2. ACTIVE DISCOUNT COUPONS CAROUSEL / GRID
           ======================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-lg md:text-xl font-bold font-display text-slate-900 flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              <span>Available Coupons & Promo Vouchers</span>
              <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full ml-1">
                4 Active
              </span>
            </h2>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Click "Copy Code" to automatically apply discount in your cart
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COUPONS.map((coupon) => {
              const isCopied = copiedCode === coupon.code;
              return (
                <div
                  key={coupon.code}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200/60">
                        {coupon.badge}
                      </span>
                      <span className="text-base font-black text-amber-600">
                        {coupon.discount}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{coupon.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{coupon.desc}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between gap-2">
                    <div className="bg-slate-100 px-3 py-1.5 rounded-lg font-mono text-xs font-extrabold text-slate-800 tracking-wider">
                      {coupon.code}
                    </div>

                    <button
                      onClick={() => handleCopyCoupon(coupon.code)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isCopied
                          ? "bg-emerald-600 text-white"
                          : "bg-[#6B46C1] hover:bg-purple-800 text-white shadow-xs"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Applied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy Code
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            3. DEALS CATEGORY TABS & FILTER SELECTOR
           ======================================================== */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border flex items-center gap-2 ${
                activeTab === "all"
                  ? "bg-[#6B46C1] text-white border-[#6B46C1] shadow-md shadow-purple-600/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-purple-50"
              }`}
            >
              <Flame className="h-4 w-4 fill-amber-400 text-amber-500" />
              <span>All Top Deals ({allProducts.filter((p) => p.mrp > p.price).length})</span>
            </button>

            <button
              onClick={() => setActiveTab("mega")}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border flex items-center gap-2 ${
                activeTab === "mega"
                  ? "bg-[#6B46C1] text-white border-[#6B46C1] shadow-md shadow-purple-600/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-purple-50"
              }`}
            >
              <Percent className="h-4 w-4 text-rose-500" />
              <span>Mega Deals (40%+ OFF)</span>
            </button>

            <button
              onClick={() => setActiveTab("under499")}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border flex items-center gap-2 ${
                activeTab === "under499"
                  ? "bg-[#6B46C1] text-white border-[#6B46C1] shadow-md shadow-purple-600/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-purple-50"
              }`}
            >
              <Tag className="h-4 w-4 text-emerald-600" />
              <span>Budget Store (Under ₹499)</span>
            </button>

            <button
              onClick={() => setActiveTab("bestseller")}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border flex items-center gap-2 ${
                activeTab === "bestseller"
                  ? "bg-[#6B46C1] text-white border-[#6B46C1] shadow-md shadow-purple-600/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-purple-50"
              }`}
            >
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>Best Seller Deals</span>
            </button>
          </div>

          {/* ========================================================
              4. DEALS PRODUCT GRID (CUSTOM DEAL CARD LAYOUT)
             ======================================================== */}
          {dealProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
              <Flame className="h-12 w-12 text-amber-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No deals in this filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try switching to "All Top Deals" to see all discounted products.
              </p>
              <button
                onClick={() => setActiveTab("all")}
                className="bg-[#6B46C1] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-purple-700 transition"
              >
                View All Deals
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
              {dealProducts.map((product) => {
                const discountPct = product.mrp && product.mrp > product.price
                  ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                  : 0;
                const savings = product.mrp && product.mrp > product.price ? product.mrp - product.price : 0;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden group relative"
                  >
                    {/* Deal Badge */}
                    {discountPct > 0 && (
                      <div className="absolute top-2.5 left-2.5 z-10 bg-rose-600 text-white font-black text-[11px] px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                        <Flame className="h-3 w-3 fill-white" />
                        <span>{discountPct}% OFF</span>
                      </div>
                    )}

                    {/* Product Image Link */}
                    <Link to="/product/$id" params={{ id: product.id }} className="relative block aspect-square bg-slate-50 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </Link>

                    {/* Content */}
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                          {product.categories?.[0] || "IESVRA Deal"}
                        </span>
                        <Link to="/product/$id" params={{ id: product.id }}>
                          <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 hover:text-[#6B46C1] transition-colors leading-tight">
                            {product.name}
                          </h3>
                        </Link>
                      </div>

                      {/* Pricing with Savings Indicator */}
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base sm:text-lg font-black text-slate-900">
                            ₹{product.price.toLocaleString()}
                          </span>
                          {product.mrp > product.price && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{product.mrp.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {savings > 0 && (
                          <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center justify-between">
                            <span>You Save: ₹{savings.toLocaleString()}</span>
                            <span className="font-black text-rose-600">({discountPct}% OFF)</span>
                          </div>
                        )}

                        {/* Claim Deal Button */}
                        <button
                          type="button"
                          onClick={() => {
                            addToCart(product, product.colors?.[0] || "Default", 1);
                            toast.success(`Claimed deal: Added "${product.name}" to cart!`);
                          }}
                          className="w-full bg-[#1A0B3B] hover:bg-[#6B46C1] active:scale-95 text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />
                          <span>Claim Deal</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================
            5. TRUST & PAYMENT OFFERS BANNER
           ======================================================== */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white grid grid-cols-1 md:grid-cols-3 gap-6 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Express Pan-India Dispatch</h4>
              <p className="text-xs text-purple-200">Orders dispatched within 24 hours</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-300 shrink-0">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Free Delivery Over ₹499</h4>
              <p className="text-xs text-purple-200">Zero shipping fees across India</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-300 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">100% Secure & Verified</h4>
              <p className="text-xs text-purple-200">Instant replacements & easy returns</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
