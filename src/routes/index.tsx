import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useProducts, useCategories } from "@/lib/products";
import { useHeroBanners } from "@/lib/hero";
import { ProductCard } from "@/components/ProductCard";
import {
  ShieldCheck,
  Truck,
  RefreshCw,
  Tag,
  Award,
  ArrowRight,
  Package,
  CircleDollarSign,
  Star,
  ChevronLeft,
  ChevronRight,
  Zap,
  Users,
  Clock,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import heroMockup from "@/assets/hero-mockup.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IESVRA — Quality Products, Best Prices, Everyday" },
      {
        name: "description",
        content:
          "Discover IESVRA. Quality products, best prices, everyday. Wellness, tech, and lifestyle essentials.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { isLoaded, bestSellersList, products } = useProducts();
  const { categories } = useCategories();
  const { data: banners, isLoading: isHeroLoading } = useHeroBanners();
  
  // Mock global state for 15-Min Delivery demo
  const isExpressLocation = false;

  // Fallback default banner if empty
  const heroBanners = banners && banners.length > 0 ? banners : [{
    id: "default",
    title: "IESVRA",
    subtitle: "Quality Products, Best Prices, Everyday",
    buttonText: "SHOP NOW",
    buttonLink: "/shop",
    backgroundImageUrl: heroBg,
    isSpecialSale: false,
  }];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  // ---- LIVE SOCIAL PROOF ----
  const deliveryMessages = ["4 minutes ago", "11 minutes ago", "7 minutes ago", "19 minutes ago", "3 minutes ago", "12 minutes ago", "8 minutes ago", "22 minutes ago"];
  const [shopperCount, setShopperCount] = useState(() => Math.floor(95 + Math.random() * 35)); // 95-130
  const [deliveryMsgIdx, setDeliveryMsgIdx] = useState(() => Math.floor(Math.random() * 8));
  const [showDeliveryIndicator, setShowDeliveryIndicator] = useState(true);

  useEffect(() => {
    // Rotate shopper count slightly every 8-15s for believability
    const shopperInterval = setInterval(() => {
      setShopperCount(prev => {
        const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
        return Math.max(80, Math.min(155, prev + delta));
      });
    }, 9000);
    return () => clearInterval(shopperInterval);
  }, []);

  useEffect(() => {
    // Rotate delivery message every 6s
    const deliveryInterval = setInterval(() => {
      setDeliveryMsgIdx(prev => (prev + 1) % deliveryMessages.length);
    }, 6000);
    return () => clearInterval(deliveryInterval);
  }, []);

  // Show next-day delivery cutoff only if current hour < 21 (before 9 PM)
  const currentHour = new Date().getHours();
  const isBeforeCutoff = currentHour < 21;
  // --------------------------

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Newsletter handleSubscribe triggered on homepage banner form", { email: subscriberEmail });
    if (!subscriberEmail.trim() || !subscriberEmail.includes("@")) {
      console.warn("Newsletter subscription validation failed: invalid email", { email: subscriberEmail });
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
      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe.");
      }
      toast.success("Thanks for subscribing!");
      setSubscriberEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to subscribe. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };


  // Auto-play interval
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
    }, 6000); // Rotate every 6 seconds
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  const activeBanner = heroBanners[currentSlide] || heroBanners[0];

  // Countdown timer logic
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  
  useEffect(() => {
    if (!activeBanner?.isSpecialSale || !activeBanner?.saleEndDate) return;
    
    const targetDate = new Date(activeBanner.saleEndDate).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      
      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeBanner]);

  const title = activeBanner?.title || "IESVRA";
  // Colorful backgrounds for category circles
  const getCategoryBg = (index: number) => {
    const colors = [
      "bg-[#E2F1FF] border-[#cce6ff]",
      "bg-[#FFE2EC] border-[#ffccd9]",
      "bg-[#E2FFE9] border-[#ccffd6]",
      "bg-[#FFF7E2] border-[#ffeec2]",
      "bg-[#EBE2FF] border-[#dbccff]",
      "bg-[#FFEBE2] border-[#ffd5cc]",
      "bg-[#E2FFFF] border-[#ccffff]",
      "bg-[#F5FFE2] border-[#ecffcc]"
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-[#f8f9fb] text-navy-deep font-sans">
      {/* ============== HERO SECTION ============== */}
      <section className="w-full bg-gradient-to-r from-[#efeefc] via-[#f5f4fd] to-[#fcfcff] border-b border-slate-100/80 overflow-hidden py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 w-full">
          
          {/* Left Column: Text Content & Badges */}
          <div className="flex-1 space-y-6 max-w-2xl text-left">
            <div className="space-y-3">
              <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-5.5xl text-[#1D0C69] leading-[1.15] tracking-tight">
                SMART SHOPPING<br />
                <span className="text-primary">FASTER THAN EVER</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-lg">
                Top quality products, best prices & 15 min delivery at your doorstep.
              </p>
            </div>

            {/* Pill-shaped Badges */}
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {/* Badge 1: 15 Min Delivery (Interactive) */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('open-address-modal'));
                }}
                className="bg-white px-3 py-2 rounded-xl shadow-xs border border-slate-100/80 flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer select-none text-left"
              >
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-amber-500 bg-amber-50">
                  <Zap className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
                <div className="leading-tight">
                  <div className="text-[9px] font-extrabold text-slate-800 tracking-wide uppercase">15 MIN</div>
                  <div className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">DELIVERY</div>
                </div>
              </button>

              {/* Badge 2: Free Shipping */}
              <Link 
                to="/shop"
                className="bg-white px-3 py-2 rounded-xl shadow-xs border border-slate-100/80 flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer select-none text-left"
              >
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-blue-500 bg-blue-50">
                  <Truck className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
                <div className="leading-tight">
                  <div className="text-[9px] font-extrabold text-slate-800 tracking-wide uppercase">FREE SHIPPING</div>
                  <div className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">ABOVE ₹499</div>
                </div>
              </Link>

              {/* Badge 3: 100% Secure */}
              <Link 
                to="/shop"
                className="bg-white px-3 py-2 rounded-xl shadow-xs border border-slate-100/80 flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer select-none text-left"
              >
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-emerald-500 bg-emerald-50">
                  <ShieldCheck className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
                <div className="leading-tight">
                  <div className="text-[9px] font-extrabold text-slate-800 tracking-wide uppercase">100% SECURE</div>
                  <div className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">PAYMENTS</div>
                </div>
              </Link>

              {/* Badge 4: Easy Returns */}
              <Link 
                to="/shop"
                className="bg-white px-3 py-2 rounded-xl shadow-xs border border-slate-100/80 flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer select-none text-left"
              >
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-red-500 bg-red-50">
                  <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
                <div className="leading-tight">
                  <div className="text-[9px] font-extrabold text-slate-800 tracking-wide uppercase">EASY RETURNS</div>
                  <div className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">7 DAYS</div>
                </div>
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/shop" className="bg-primary hover:bg-primary/95 text-white px-7 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-md select-none flex items-center gap-1.5 group cursor-pointer">
                Shop Now
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a href="/mobile-app/index.html" className="border border-primary/30 hover:border-primary text-primary px-7 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all select-none flex items-center gap-1.5 group cursor-pointer bg-white/50 backdrop-blur-xs">
                Download App
              </a>
              
              <div className="flex items-center gap-2 pl-1">
                <a href="/mobile-app/index.html" className="opacity-85 hover:opacity-100 transition-opacity">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-5" />
                </a>
                <a href="/mobile-app/index.html" className="opacity-85 hover:opacity-100 transition-opacity">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Mockup */}
          <div className="flex-1 w-full max-w-sm md:max-w-md flex justify-center items-center relative select-none">
            {/* Soft background glow */}
            <div className="absolute w-[80%] h-[80%] rounded-full bg-primary/5 filter blur-3xl -z-10" />
            <img 
              src={heroMockup} 
              alt="IESVRA 3D Mockup" 
              className="w-[85%] sm:w-[75%] md:w-[90%] lg:w-[85%] h-auto object-contain max-h-[280px] sm:max-h-[340px] md:max-h-[380px]"
            />
          </div>

        </div>
      </section>

      {/* ============== LIVE SOCIAL PROOF STRIP ============== */}
      <section className="bg-navy-deep border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-center">
          {/* Shoppers live count */}
          <div className="flex items-center gap-2 text-white/90 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
            </span>
            <Users className="h-3.5 w-3.5 text-gold" />
            <span><span className="font-bold text-white">{shopperCount}</span> people shopping right now</span>
          </div>

          <span className="hidden sm:block w-px h-4 bg-white/20" />

          {/* Last delivery time */}
          <div className="flex items-center gap-2 text-white/90 text-xs">
            <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Delivered <span className="font-bold text-white">{deliveryMessages[deliveryMsgIdx]}</span> near you</span>
          </div>

          {/* Cutoff delivery reminder (only before 9 PM) */}
          {isBeforeCutoff && (
            <>
              <span className="hidden sm:block w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2 text-white/90 text-xs">
                <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Order before <span className="font-bold text-primary">9 PM</span> for Next Day Delivery</span>
              </div>
            </>
          )}
        </div>
      </section>
      
      {/* ============== 15-MIN EXPRESS DELIVERY HIGHLIGHT ============== */}
      <section className="pt-10 pb-2 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#0b121f] text-white rounded-2xl p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden border border-primary/30 shadow-xl group">

          <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left gap-3.5 sm:gap-4 md:gap-5 flex-1">
            <div className="flex items-center gap-3">
              <Zap className="h-7 w-7 sm:h-8 sm:w-8 text-primary fill-primary" />
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-wider text-primary drop-shadow-sm">
                15-MIN DELIVERY
              </h3>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-md font-medium leading-relaxed">
              Available near select warehouses
            </p>
          </div>

          <div className="relative z-10 mt-6 md:mt-0 shrink-0">
            <button 
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('open-address-modal'));
              }}
              className="inline-flex items-center justify-center border-2 border-primary bg-primary/5 text-primary px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-widest rounded-full hover:bg-primary hover:text-white hover:shadow-[0_0_25px_rgba(107,70,193,0.4)] transition-all duration-300 cursor-pointer"
            >
              CHECK ELIGIBILITY
            </button>
          </div>
        </div>
      </section>

      {/* ============== SHOP BY CATEGORY ============== */}
      <section className="py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <h2 className="text-xl font-bold uppercase tracking-wide text-navy-deep">
              SHOP BY CATEGORY
            </h2>
            <Link to="/shop" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none lg:grid lg:grid-cols-8 lg:gap-4 lg:overflow-visible lg:pb-0">
            {categories.map((c, idx) => (
              <Link
                key={c.name}
                to="/shop"
                search={{ category: c.name }}
                className="group flex flex-col items-center gap-3 cursor-pointer flex-shrink-0"
              >
                <div className={`w-20 h-20 lg:w-22 lg:h-22 rounded-full overflow-hidden flex items-center justify-center p-4 border transition-all duration-300 hover:scale-105 hover:shadow-md ${getCategoryBg(idx)}`}>
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <span className="text-xs lg:text-sm font-semibold text-center text-navy-deep/90 leading-tight group-hover:text-primary transition-colors px-1 whitespace-nowrap">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============== TRUST STRIP ============== */}
      <section className="bg-white border-b border-border/40 py-8 select-none">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-4">
            {[
              { icon: Tag, title: "LIMITED TIME DEALS", desc: "Grab Best Offers Now" },
              { icon: ShieldCheck, title: "100% ORIGINAL PRODUCTS", desc: "Sourced from Trusted Brands" },
              { icon: Truck, title: "FAST & RELIABLE DELIVERY", desc: "On-time at Your Doorstep" },
              { icon: CircleDollarSign, title: "SECURE PAYMENT", desc: "100% Safe & Secure" },
              { icon: Users, title: "24x7 CUSTOMER SUPPORT", desc: "We are Always Here to Help" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 tracking-wide uppercase leading-tight">{title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== BEST SELLERS ============== */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 border-b border-border/50 pb-4">
            <h2 id="deals" className="text-2xl font-display font-bold text-navy-deep">
              BEST SELLERS
            </h2>
            <Link to="/shop" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {/* 5 products in a row on desktop, matching reference */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-5 pb-4 lg:pb-0">
            {!isLoaded ? null : bestSellersList.slice(0, 10).map((product, idx) => (
              <div key={product.id} className="w-full">
                <ProductCard 
                  product={product} 
                  customBadge={idx === 0 ? "Best Seller" : idx === 1 ? "Trending" : idx === 2 ? "New" : idx === 3 ? "Limited Stock" : idx === 4 ? "Best Seller" : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== PROMOTIONAL BANNERS (DUAL-BANNER PURPLE STRIP) ============== */}
      <section className="py-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="bg-[#1D0C69] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-xl border border-white/10">
          
          {/* Left Side: IESVRA Plus */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 flex-1 w-full lg:border-r lg:border-b-0 border-b border-white/10 pb-6 lg:pb-0 lg:pr-8">
            <div className="h-14 w-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Award className="h-8 w-8" />
            </div>
            <div className="text-center sm:text-left flex-1 space-y-2">
              <h3 className="text-2xl font-bold font-display tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
                IESVRA <span className="text-amber-400 font-serif-hero text-lg italic">Plus</span>
              </h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-md">
                Unlimited Free Delivery, Extra 5% Cashback & Exclusive Member Deals
              </p>
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 justify-center sm:justify-start">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">Special Membership Price</span>
                  <span className="text-lg font-extrabold text-white">₹249 <span className="text-xs font-normal text-slate-300">/ Year</span></span>
                </div>
                <button className="bg-[#F6A623] hover:bg-[#e09117] text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md select-none mt-2 sm:mt-0">
                  Join Now
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Bulk Orders */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 flex-1 w-full lg:pl-8">
            <div className="h-14 w-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <Package className="h-8 w-8" />
            </div>
            <div className="text-center sm:text-left flex-1 space-y-2">
              <h3 className="text-xl font-bold font-display tracking-tight text-white">
                Bulk Orders for Businesses
              </h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-sm">
                Get Special Discounts and Customized Delivery Plans for Corporate & Wholesale Orders.
              </p>
              <div className="pt-2">
                <button className="border border-white/40 hover:border-white hover:bg-white/5 text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer select-none">
                  Contact Us
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============== NEWSLETTER STRIP ============== */}
      <section className="bg-navy-deep py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-white mb-4">Stay in the Loop</h2>
          <p className="text-white/70 text-sm lg:text-base mb-8 max-w-lg mx-auto">Subscribe to our newsletter for exclusive offers, early access to sales, and new arrivals.</p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              value={subscriberEmail}
              onChange={(e) => setSubscriberEmail(e.target.value)}
              disabled={isSubscribing}
              className="flex-1 h-12 px-6 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="h-12 px-8 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors uppercase tracking-widest text-xs flex-shrink-0 disabled:opacity-50"
            >
              {isSubscribing ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
