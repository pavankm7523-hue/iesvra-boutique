import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { categories, useProducts } from "@/lib/products";
import { useHeroBanners } from "@/lib/hero";
import { ProductCard } from "@/components/ProductCard";
import { useState, useMemo } from "react";
import { SlidersHorizontal, X, Filter, RotateCcw, Check, Sparkles, Tag, Flame, Percent } from "lucide-react";

const shopSearchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  bannerId: z.string().optional(),
  deals: z.union([z.boolean(), z.string()]).optional(),
  dealTier: z.string().optional(), // e.g. "mega" (40%+ off), "under499"
  sortBy: z.string().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: (search) => shopSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Shop All Collections & Best Deals | IESVRA Boutique" },
      {
        name: "description",
        content: "Explore top deals, mega discounts, and browse all categories including Electronics, Smart Gadgets, Home Essentials, and Beauty at IESVRA.",
      },
      { property: "og:title", content: "Shop All Collections & Best Deals | IESVRA Boutique" },
      {
        property: "og:description",
        content: "Explore top deals, mega discounts, and browse all categories at IESVRA Boutique.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Shop,
});

function Shop() {
  const searchParams = Route.useSearch();
  const { category, q, bannerId, deals, dealTier } = searchParams;
  const navigate = useNavigate({ from: Route.fullPath });
  const { products: allProducts } = useProducts();
  const { data: banners } = useHeroBanners();

  // Detect whether deals mode is active
  const isDealsParam = deals === true || deals === "true" || deals === "1";
  const isDealsSearchQuery = q?.trim().toLowerCase() === "deals" || q?.trim().toLowerCase() === "deal" || q?.trim().toLowerCase() === "offers" || q?.trim().toLowerCase() === "offer";
  const isDealsActive = isDealsParam || isDealsSearchQuery;
  const effectiveQ = isDealsSearchQuery ? undefined : q;
  
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>(isDealsActive ? "biggest-discount" : (searchParams.sortBy || "recommended"));

  const isBannerActive = (b: any) => {
    if (b.isActive === false) return false;
    if (!b.isSpecialSale) return true;
    if (!b.saleEndDate) return true;
    return new Date() < new Date(b.saleEndDate);
  };

  const activeBanners = banners?.filter(isBannerActive) || [];
  
  const globalExclusiveIds = new Set<string>();
  activeBanners.forEach(b => {
    if (b.exclusiveProductIds) {
      b.exclusiveProductIds.forEach((id: string) => globalExclusiveIds.add(id));
    }
  });

  const activeBanner = bannerId ? activeBanners.find((b) => b.id === bannerId) : undefined;

  const handleCategoryToggle = (catName: string) => {
    if (category?.toLowerCase() === catName.toLowerCase()) {
      navigate({ search: (prev: any) => ({ ...prev, category: undefined }) });
    } else {
      navigate({ search: (prev: any) => ({ ...prev, category: catName }) });
    }
  };

  const handleDealsToggle = () => {
    if (isDealsActive) {
      navigate({ search: (prev: any) => ({ ...prev, deals: undefined, dealTier: undefined, q: isDealsSearchQuery ? undefined : prev.q }) });
    } else {
      navigate({ search: (prev: any) => ({ ...prev, deals: true, q: isDealsSearchQuery ? undefined : prev.q }) });
      setSortBy("biggest-discount");
    }
  };

  const handleDealTierToggle = (tier: string) => {
    if (dealTier === tier) {
      navigate({ search: (prev: any) => ({ ...prev, dealTier: undefined }) });
    } else {
      navigate({ search: (prev: any) => ({ ...prev, deals: true, dealTier: tier }) });
    }
  };

  const handlePriceToggle = (priceRange: string) => {
    setSelectedPrices((prev) =>
      prev.includes(priceRange)
        ? prev.filter((p) => p !== priceRange)
        : [...prev, priceRange]
    );
  };

  const resetAllFilters = () => {
    setSelectedPrices([]);
    setSortBy("recommended");
    navigate({ search: () => ({}) });
  };

  const activeFilterCount = (category ? 1 : 0) + selectedPrices.length + (effectiveQ ? 1 : 0) + (isDealsActive ? 1 : 0) + (dealTier ? 1 : 0);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      // Hide exclusive products from global view
      if (!activeBanner && globalExclusiveIds.has(p.id)) {
        return false;
      }

      if (activeBanner && activeBanner.productIds && !activeBanner.productIds.includes(p.id)) {
        return false;
      }
        
      const matchesCategory = category 
        ? p.categories.some(cat => cat.toLowerCase() === category.toLowerCase()) 
        : true;

      // Deals filter check
      if (isDealsActive) {
        const hasDiscount = (p.mrp && p.mrp > p.price) || (activeBanner && activeBanner.productPrices?.[p.id] !== undefined) || p.isBestSeller;
        if (!hasDiscount) return false;

        const effectiveMrp = (activeBanner && activeBanner.productPrices?.[p.id] !== undefined) ? p.price : (p.mrp || p.price);
        const effectivePrice = (activeBanner && activeBanner.productPrices?.[p.id] !== undefined) ? activeBanner.productPrices[p.id] : p.price;
        const discountPct = effectiveMrp > effectivePrice ? Math.round(((effectiveMrp - effectivePrice) / effectiveMrp) * 100) : 0;

        if (dealTier === "mega" && discountPct < 40) return false;
        if (dealTier === "under499" && effectivePrice > 499) return false;
      }

      // Smart Fuzzy Search Matcher
      let matchesSearch = true;
      if (effectiveQ && effectiveQ.trim()) {
        const queryClean = effectiveQ.trim().toLowerCase();
        const qStem = queryClean.replace(/(?:ers|es|s)$/, '');
        
        const name = (p.name || "").toLowerCase();
        const sub = (p.sub || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const cats = (p.categories || []).map(c => c.toLowerCase());

        const directMatch = name.includes(queryClean) || sub.includes(queryClean) || desc.includes(queryClean) || cats.some(c => c.includes(queryClean));
        const stemMatch = qStem.length >= 3 && (name.includes(qStem) || sub.includes(qStem) || desc.includes(qStem) || cats.some(c => c.includes(qStem)));

        matchesSearch = directMatch || stemMatch;
      }
      
      if (selectedPrices.length > 0) {
        const matchesPrice = selectedPrices.some((range) => {
          if (range === "Under ₹999") return p.price <= 999;
          if (range === "₹1,000 - ₹2,999") return p.price >= 1000 && p.price <= 2999;
          if (range === "₹3,000 - ₹4,999") return p.price >= 3000 && p.price <= 4999;
          if (range === "Above ₹5,000") return p.price >= 5000;
          return true;
        });
        if (!matchesPrice) return false;
      }
      
      return matchesCategory && matchesSearch;
    });
  }, [allProducts, activeBanner, globalExclusiveIds, category, effectiveQ, isDealsActive, dealTier, selectedPrices]);

  const sortedProducts = useMemo(() => {
    let list = filteredProducts.map(p => {
      if (activeBanner && activeBanner.productPrices?.[p.id] !== undefined) {
        return {
          ...p,
          mrp: p.price,
          price: activeBanner.productPrices[p.id],
        };
      }
      return p;
    });

    if (sortBy === "biggest-discount") {
      list.sort((a, b) => {
        const discA = a.mrp && a.mrp > a.price ? (a.mrp - a.price) / a.mrp : 0;
        const discB = b.mrp && b.mrp > b.price ? (b.mrp - b.price) / b.mrp : 0;
        return discB - discA;
      });
    } else if (sortBy === "low-to-high") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "high-to-low") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      list.reverse();
    }

    return list;
  }, [filteredProducts, activeBanner, sortBy]);

  return (
    <div className="bg-[#F8F9FC] text-foreground min-h-screen font-sans pb-16">
      {/* Header Banner */}
      <div className={`py-12 md:py-16 text-center px-4 relative overflow-hidden transition-all duration-300 ${
        isDealsActive
          ? "bg-gradient-to-r from-[#1e0a45] via-[#380E83] to-[#6B21A8]"
          : "bg-gradient-to-r from-[#2D1263] via-[#380E83] to-[#5B21B6]"
      }`}>
        <div className="relative z-10 max-w-3xl mx-auto space-y-2">
          {isDealsActive && (
            <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-1 shadow-sm animate-pulse">
              <Flame className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>Flash Deals & Limited-Time Offers</span>
            </div>
          )}
          <h1 className="font-display text-3xl md:text-5xl text-white tracking-tight font-extrabold">
            {activeBanner
              ? activeBanner.title
              : isDealsActive
              ? "⚡ Exclusive Deals & Discounts"
              : category
              ? `${category}`
              : effectiveQ
              ? `Search Results for "${effectiveQ}"`
              : "All"}{" "}
            <span className="italic font-light text-amber-300">
              {isDealsActive ? "Catalog" : "Collections"}
            </span>
          </h1>
          <p className="text-purple-100 max-w-2xl mx-auto font-medium text-xs md:text-sm">
            {isDealsActive
              ? "Discover verified price drops, extraordinary savings up to 70% off, and handpicked deal items with express dispatch."
              : "Explore premium wellness, personal care, audio & lifestyle essentials. Handpicked for quality & speed."}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* ========================================================
            TOP QUICK PILLS ROW (DEALS + CATEGORIES)
           ======================================================== */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
          {/* Deals Pill */}
          <button
            onClick={handleDealsToggle}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
              isDealsActive
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/50"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300"
            }`}
          >
            <Flame className={`h-3.5 w-3.5 ${isDealsActive ? "fill-slate-950 text-slate-950" : "fill-amber-500 text-amber-600"}`} />
            <span>🔥 Deals & Offers</span>
          </button>

          {/* All Products Pill */}
          <button
            onClick={() => navigate({ search: () => ({}) })}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
              !category && !isDealsActive && !effectiveQ
                ? "bg-[#6B46C1] text-white border-[#6B46C1] shadow-md shadow-purple-600/20"
                : "bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50"
            }`}
          >
            All Products
          </button>

          {/* Category Pills */}
          {categories.map((cat) => {
            const isActive = category?.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.name}
                onClick={() => handleCategoryToggle(cat.name)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? "bg-[#6B46C1] text-white border-[#6B46C1] shadow-md shadow-purple-600/20"
                    : "bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Deals Quick Sub-Tiers (when Deals is active) */}
        {isDealsActive && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none text-xs">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 shrink-0">
              Filter Deals:
            </span>
            <button
              onClick={() => handleDealTierToggle("mega")}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                dealTier === "mega"
                  ? "bg-purple-900 text-white border-purple-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Percent className="h-3 w-3 text-amber-500" />
              <span>Mega Deals (40%+ Off)</span>
            </button>
            <button
              onClick={() => handleDealTierToggle("under499")}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                dealTier === "under499"
                  ? "bg-purple-900 text-white border-purple-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Tag className="h-3 w-3 text-emerald-600" />
              <span>Under ₹499</span>
            </button>
            {(dealTier || isDealsActive) && (
              <button
                onClick={() => navigate({ search: (prev: any) => ({ ...prev, dealTier: undefined }) })}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  !dealTier ? "bg-purple-100 text-purple-900 border-purple-200" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                All Deals ({allProducts.filter(p => p.mrp > p.price).length})
              </button>
            )}
          </div>
        )}

        {/* ========================================================
            FILTER CONTROL BAR
           ======================================================== */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: Filter Options Toggle Button */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="flex items-center gap-2.5 bg-purple-50 hover:bg-purple-100/80 text-[#6B46C1] border border-purple-200 px-4 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <SlidersHorizontal className="h-4 w-4 stroke-[2.5]" />
            <span>Filter Options</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#6B46C1] text-white text-[10px] font-black flex items-center justify-center ml-1">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Middle: Product Count & Active Search/Category/Deals Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span>
              Showing <strong className="text-slate-900 font-extrabold">{sortedProducts.length}</strong> products
            </span>
            {isDealsActive && (
              <span className="bg-amber-100 text-amber-950 border border-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-xs">
                <Flame className="h-3 w-3 fill-amber-500 text-amber-600" />
                <span>{dealTier === "mega" ? "Mega Deals (40%+ OFF)" : dealTier === "under499" ? "Deals Under ₹499" : "Deals & Discounts"}</span>
                <X className="h-3 w-3 cursor-pointer hover:text-red-600 ml-0.5" onClick={handleDealsToggle} />
              </span>
            )}
            {category && (
              <span className="bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
                {category}
                <X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => navigate({ search: (prev: any) => ({ ...prev, category: undefined }) })} />
              </span>
            )}
            {effectiveQ && (
              <span className="bg-slate-100 text-slate-900 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
                "{effectiveQ}"
                <X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => navigate({ search: (prev: any) => ({ ...prev, q: undefined }) })} />
              </span>
            )}
          </div>

          {/* Right: Sorting Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400 cursor-pointer uppercase tracking-wider"
            >
              <option value="recommended">RECOMMENDED</option>
              <option value="biggest-discount">BIGGEST DISCOUNT (%)</option>
              <option value="low-to-high">PRICE: LOW TO HIGH</option>
              <option value="high-to-low">PRICE: HIGH TO LOW</option>
              <option value="newest">NEWEST ARRIVALS</option>
            </select>
          </div>
        </div>

        {/* ========================================================
            PRODUCT GRID
           ======================================================== */}
        {sortedProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
            <Filter className="h-12 w-12 text-purple-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No products match your filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Try clearing search terms or selecting different categories and price ranges.</p>
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-2 bg-[#6B46C1] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-purple-700 transition-colors cursor-pointer shadow-md"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
            {sortedProducts.map((p, i) => (
              <ProductCard 
                key={`${p.id}-${i}`} 
                product={p} 
                showHeart 
                bannerId={activeBanner?.productPrices?.[p.id] !== undefined ? activeBanner.id : undefined}
                saleEndDate={activeBanner?.productPrices?.[p.id] !== undefined ? activeBanner.saleEndDate : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          SLIDE-OUT FILTER DRAWER MODAL
         ======================================================== */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-[999] flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFilterDrawerOpen(false)}
          />

          {/* Slide Panel */}
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="h-5 w-5 text-[#6B46C1]" />
                <h3 className="font-extrabold text-base uppercase tracking-wider text-slate-900">
                  Filter Options
                </h3>
              </div>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-200/80 text-slate-600 hover:bg-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Deals & Offers Filter Group */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-widest text-slate-900 mb-4 pb-2 border-b border-slate-100 flex justify-between items-center">
                  <span>Special Offers</span>
                  <span className="text-[10px] text-amber-600 font-bold">⚡ Flash Deals</span>
                </h4>
                <div className="space-y-2.5">
                  <label
                    onClick={handleDealsToggle}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isDealsActive
                        ? "bg-amber-50 border-amber-300 text-amber-950 font-bold"
                        : "bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isDealsActive}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-0 accent-amber-600 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold flex items-center gap-1.5">
                          <Flame className="h-4 w-4 text-amber-500 fill-amber-500" /> All Deals & Discounts
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal">Products with verified price drops</span>
                      </div>
                    </div>
                    {isDealsActive && <Check className="h-4 w-4 text-amber-600" />}
                  </label>

                  {isDealsActive && (
                    <div className="pl-4 space-y-2 border-l-2 border-amber-300 ml-3 pt-1">
                      <label
                        onClick={() => handleDealTierToggle("mega")}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer select-none ${
                          dealTier === "mega" ? "bg-purple-50 border-purple-300 font-bold text-purple-900" : "bg-white border-slate-200 text-slate-700"
                        }`}
                      >
                        <span>🔥 Mega Discounts (40%+ OFF)</span>
                        {dealTier === "mega" && <Check className="h-3.5 w-3.5 text-purple-600" />}
                      </label>
                      <label
                        onClick={() => handleDealTierToggle("under499")}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer select-none ${
                          dealTier === "under499" ? "bg-purple-50 border-purple-300 font-bold text-purple-900" : "bg-white border-slate-200 text-slate-700"
                        }`}
                      >
                        <span>⚡ Budget Deals (Under ₹499)</span>
                        {dealTier === "under499" && <Check className="h-3.5 w-3.5 text-purple-600" />}
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Filter Group */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-widest text-slate-900 mb-4 pb-2 border-b border-slate-100 flex justify-between items-center">
                  <span>Categories</span>
                  <span className="text-[10px] text-purple-600 font-bold">{categories.length} Options</span>
                </h4>
                <div className="space-y-2.5">
                  {categories.map((cat) => {
                    const isChecked = category?.toLowerCase() === cat.name.toLowerCase();
                    return (
                      <label
                        key={cat.name}
                        onClick={() => handleCategoryToggle(cat.name)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-purple-50 border-purple-300 text-purple-900 font-bold"
                            : "bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-[#6B46C1] focus:ring-0 accent-[#6B46C1] cursor-pointer"
                          />
                          <span className="text-sm">{cat.name}</span>
                        </div>
                        {isChecked && <Check className="h-4 w-4 text-[#6B46C1]" />}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Price Range Filter Group */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-widest text-slate-900 mb-4 pb-2 border-b border-slate-100">
                  Price Range
                </h4>
                <div className="space-y-2.5">
                  {["Under ₹999", "₹1,000 - ₹2,999", "₹3,000 - ₹4,999", "Above ₹5,000"].map((price) => {
                    const isChecked = selectedPrices.includes(price);
                    return (
                      <label
                        key={price}
                        onClick={() => handlePriceToggle(price)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-purple-50 border-purple-300 text-purple-900 font-bold"
                            : "bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-[#6B46C1] focus:ring-0 accent-[#6B46C1] cursor-pointer"
                          />
                          <span className="text-sm">{price}</span>
                        </div>
                        {isChecked && <Check className="h-4 w-4 text-[#6B46C1]" />}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-200/80 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#6B46C1] text-white font-bold text-xs uppercase tracking-wider hover:bg-purple-700 transition cursor-pointer shadow-md shadow-purple-600/20 text-center"
              >
                Apply Filters ({sortedProducts.length})
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
