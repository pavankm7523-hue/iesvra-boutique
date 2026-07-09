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
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")(
  {
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
  const subtitle = activeBanner?.subtitle || "Quality Products, Best Prices, Everyday";
  const buttonText = activeBanner?.buttonText || "SHOP NOW";
  const buttonLink = activeBanner?.buttonLink || "/shop";
  const backgroundImageUrl = activeBanner?.backgroundImageUrl || heroBg;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);

  return (
    <div className="bg-[#f8f9fb] text-navy-deep font-sans">
      {/* ============== HERO SECTION ============== */}
      <section className="relative w-full h-[380px] sm:h-[450px] md:h-[520px] lg:h-[600px] bg-navy-deep overflow-hidden group">
        
        {/* Banners */}
        {heroBanners.map((banner, idx) => {
          const hasProducts = banner.productIds && banner.productIds.length > 0;
          return (
            <Link
              key={banner.id}
              to={banner.buttonLink || "/shop"}
              search={hasProducts ? { bannerId: banner.id } : undefined}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
                currentSlide === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
            <img
              src={banner.backgroundImageUrl}
              alt={banner.title}
              className="w-full h-full object-cover object-center" 
            />

            {/* Premium Layout for First Banner */}
            {idx === 0 && (
              <div className="absolute inset-0 z-10 flex text-left">
                {/* Slanted Navy Background */}
                <div 
                  className="absolute top-0 bottom-0 left-0 w-full sm:left-[-10%] sm:w-[75%] md:w-[65%] lg:w-[55%] bg-gradient-to-r from-[#061022]/95 via-[#061022]/85 to-transparent sm:bg-[#061022] border-r-0 sm:border-r-[3px] border-[#D4AF37] z-0 shadow-none sm:shadow-[10px_0_30px_rgba(0,0,0,0.5)] transform sm:skew-x-[15deg] origin-bottom-left" 
                ></div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-center px-5 sm:px-10 md:px-16 lg:px-20 max-w-2xl py-6 sm:py-8">
                  <h4 className="text-[#D4AF37] font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs mb-2.5">
                    WELCOME TO
                  </h4>
                  <h1 className="font-display font-semibold text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-3 sm:mb-4 leading-[1.1]">
                    IESVRA
                  </h1>
                  <p className="text-xs sm:text-base md:text-lg text-white/90 mb-6 sm:mb-8 max-w-[90%] sm:max-w-[80%] font-medium">
                    Quality Products, Best Prices, Everyday
                  </p>
                  
                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:flex sm:flex-wrap sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                    {[
                      { icon: ShieldCheck, text: "Premium\nQuality" },
                      { icon: CircleDollarSign, text: "Affordable\nPrices" },
                      { icon: Truck, text: "Fast\nDelivery" },
                      { icon: Award, text: "Trusted\nStore" }
                    ].map((badge, i) => (
                      <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 md:h-9 md:w-9 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                          <badge.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white/80" />
                        </div>
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] text-white/80 font-bold uppercase tracking-wider leading-tight whitespace-pre-line">
                          {badge.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="inline-block">
                    <button className="bg-gradient-to-r from-[#e5c158] to-[#c59b27] text-navy-deep px-5 sm:px-8 py-2 sm:py-3 rounded-full font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2 group cursor-pointer">
                      SHOP NOW
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            </Link>
          );
        })}

        {/* Left Arrow Navigation */}
        {heroBanners.length > 1 && (
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all z-20 opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
        )}

        {/* Right Arrow Navigation */}
        {heroBanners.length > 1 && (
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all z-20 opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
        )}

        {/* Floating Countdown Timer (If Sale Mode) */}
        {activeBanner?.isSpecialSale && activeBanner?.saleEndDate && (
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3 bg-black/60 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/20 shadow-xl">
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-bold text-white">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-[9px] uppercase text-gold font-bold">Days</span>
            </div>
            <span className="text-white/50 font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-bold text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[9px] uppercase text-gold font-bold">Hrs</span>
            </div>
            <span className="text-white/50 font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-bold text-white">{String(timeLeft.mins).padStart(2, '0')}</span>
              <span className="text-[9px] uppercase text-gold font-bold">Mins</span>
            </div>
            <span className="text-white/50 font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-bold text-white">{String(timeLeft.secs).padStart(2, '0')}</span>
              <span className="text-[9px] uppercase text-gold font-bold">Secs</span>
            </div>
          </div>
        )}

        {/* Dots */}
        {heroBanners.length > 1 && (
          <div className="absolute bottom-8 left-8 md:left-16 lg:left-20 flex gap-3 z-30">
            {heroBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? "bg-[#dfb15b] w-6" : "bg-white/40 hover:bg-white/70 w-2"
                }`}
              />
            ))}
          </div>
        )}
      </section>
      
      {/* ============== 15-MIN EXPRESS DELIVERY HIGHLIGHT ============== */}
      <section className="pt-10 pb-2 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#0b121f] text-white rounded-2xl p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden border border-[#dfb15b]/40 shadow-xl group">
          {/* Large faint background watermark */}
          <div className="absolute right-0 bottom-0 top-0 w-1/2 flex items-center justify-end pr-8 sm:pr-12 md:pr-16 opacity-[0.03] select-none pointer-events-none z-0">
            <Zap className="w-56 h-56 sm:w-64 sm:h-64 text-white" />
          </div>

          <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left gap-3.5 sm:gap-4 md:gap-5 flex-1">
            <div className="flex items-center gap-3">
              <Zap className="h-7 w-7 sm:h-8 sm:w-8 text-[#dfb15b] fill-[#dfb15b]" />
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-wider text-[#dfb15b] drop-shadow-sm">
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
              className="inline-flex items-center justify-center border-2 border-[#dfb15b] bg-[#dfb15b]/5 text-[#dfb15b] px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-widest rounded-full hover:bg-[#dfb15b] hover:text-navy-deep hover:shadow-[0_0_25px_rgba(223,177,91,0.4)] transition-all duration-300 cursor-pointer"
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
            <Link to="/shop" className="text-sm font-semibold text-navy-deep hover:text-gold flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none lg:grid lg:grid-cols-8 lg:gap-4 lg:overflow-visible lg:pb-0">
            {categories.map((c) => (
              <Link
                key={c.name}
                to="/shop"
                search={{ category: c.name }}
                className="group flex flex-col items-center gap-3 cursor-pointer flex-shrink-0"
              >
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden bg-white shadow-sm border border-border/40 flex items-center justify-center p-4 group-hover:border-gold group-hover:shadow-[0_8px_25px_-4px_rgba(230,185,110,0.3)] transition-all duration-500">
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <span className="text-xs lg:text-sm font-semibold text-center text-navy-deep/90 leading-tight group-hover:text-gold transition-colors px-1 whitespace-nowrap">
                  {c.name}
                </span>
              </Link>
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
            <Link to="/shop" className="text-sm font-semibold text-navy-deep hover:text-gold flex items-center gap-1">
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

      {/* ============== PROMOTIONAL BANNERS ============== */}
      <section className="py-14 lg:py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Banner 4 (NEW): Express Delivery */}
          <div className="bg-navy-deep text-white rounded-2xl p-7 flex items-center justify-between relative overflow-hidden group border-2 border-gold shadow-[0_8px_30px_rgba(212,175,55,0.15)]">
            <div className="absolute -right-6 -bottom-6 opacity-10">
              <Zap className="w-40 h-40" />
            </div>
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-5 w-5 text-gold fill-gold" />
                <h3 className="text-[15px] font-bold uppercase tracking-wide text-gold">15-MIN DELIVERY</h3>
              </div>
              <p className="text-xs text-white/70 mb-4 leading-relaxed">Available near select<br/>warehouses</p>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('open-address-modal'));
                }}
                className="inline-block border border-gold bg-gold/10 text-gold px-5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-gold hover:text-navy-deep transition-colors cursor-pointer"
              >
                CHECK ELIGIBILITY
              </button>
            </div>
          </div>

          {/* Banner 1: Free Shipping */}
          <div className="bg-navy-deep text-white rounded-2xl p-7 flex items-center justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Truck className="w-40 h-40" />
            </div>
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center text-gold">
                  <Truck className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-bold uppercase tracking-wide">FREE SHIPPING</h3>
              </div>
              <p className="text-xs text-white/70 mb-4 leading-relaxed">On all orders above<br/>₹499</p>
              <Link to="/shop" className="inline-block border border-gold text-gold px-5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-gold hover:text-navy-deep transition-colors">
                SHOP NOW
              </Link>
            </div>
          </div>

          {/* Banner 2: New Arrivals */}
          <div className="bg-[#fdf5f0] text-navy-deep rounded-2xl p-7 flex items-center justify-between relative overflow-hidden group">
            <div className="relative z-10 flex-1">
              <h3 className="text-[15px] font-bold uppercase tracking-wide mb-1">NEW ARRIVALS</h3>
              <p className="text-xs text-navy-deep/60 mb-4 leading-relaxed">Check out our<br/>latest products</p>
              <Link to="/shop" className="inline-block border border-navy-deep text-navy-deep px-5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-navy-deep hover:text-white transition-colors">
                EXPLORE NOW
              </Link>
            </div>
            <div className="w-20 h-20 flex justify-end relative z-10">
              {categories[0] && (
                <img src={categories[0].image} alt="New Arrivals" className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
              )}
            </div>
          </div>

          {/* Banner 3: Best Deals */}
          <div className="bg-navy-deep text-white rounded-2xl p-7 flex items-center justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Tag className="w-40 h-40" />
            </div>
            <div className="relative z-10 flex-1">
              <h3 className="text-[15px] text-gold font-bold uppercase tracking-wide mb-1">BEST DEALS</h3>
              <p className="text-xs text-white/70 mb-4 leading-relaxed">Up to <span className="font-bold text-white">70% OFF</span> on<br/>selected items</p>
              <Link to="/shop" className="inline-block border border-gold text-gold px-5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-gold hover:text-navy-deep transition-colors">
                SHOP OFFERS
              </Link>
            </div>
            <div className="w-16 h-16 flex justify-end relative z-10">
              <div className="bg-gold text-navy-deep font-bold text-3xl w-14 h-14 rounded-lg flex items-center justify-center transform rotate-12 shadow-lg shadow-gold/20">
                %
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
              className="flex-1 h-12 px-6 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-gold transition-colors"
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="h-12 px-8 bg-gold text-navy-deep font-bold rounded-full hover:bg-white transition-colors uppercase tracking-widest text-xs flex-shrink-0 disabled:opacity-50"
            >
              {isSubscribing ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        </div>
      </section>

      {/* ============== TRUST STRIP ============== */}
      <section className="bg-white border-b border-border/40 py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-6">
            {[
              { icon: ShieldCheck, title: "Secure Payments", desc: "100% safe & secure" },
              { icon: Truck, title: isExpressLocation ? "⚡ 15-Min Delivery" : "Fast Delivery", desc: isExpressLocation ? "Available at your location" : "Pan India Delivery" },
              { icon: RefreshCw, title: "Easy Returns", desc: "7 days return policy" },
              { icon: Award, title: "Quality Products", desc: "Tested & trusted products" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-navy-deep/5 flex items-center justify-center text-navy-deep">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-navy-deep">{title}</h4>
                  <p className="text-[12px] text-navy-deep/50">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
