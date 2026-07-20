import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { categories, useProducts } from "@/lib/products";
import { useHeroBanners } from "@/lib/hero";
import { ProductCard } from "@/components/ProductCard";
import { useState, useMemo } from "react";
import { SlidersHorizontal, X, Filter, RotateCcw, Check } from "lucide-react";

const shopSearchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  bannerId: z.string().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: (search) => shopSearchSchema.parse(search),
  head: () => ({
    meta: [{ title: "Shop All Collections - IESVRA" }],
  }),
  component: Shop,
});

function Shop() {
  const { category, q, bannerId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { products: allProducts } = useProducts();
  const { data: banners } = useHeroBanners();
  
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("recommended");

  const isBannerActive = (b: any) => {
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
      navigate({ search: (prev) => ({ ...prev, category: undefined }) });
    } else {
      navigate({ search: (prev) => ({ ...prev, category: catName }) });
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
    navigate({ search: (prev) => ({ ...prev, category: undefined, q: undefined }) });
  };

  const activeFilterCount = (category ? 1 : 0) + selectedPrices.length + (q ? 1 : 0);

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

      // Smart Fuzzy Search Matcher
      let matchesSearch = true;
      if (q && q.trim()) {
        const queryClean = q.trim().toLowerCase();
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
  }, [allProducts, activeBanner, globalExclusiveIds, category, q, selectedPrices]);

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

    if (sortBy === "low-to-high") {
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
      <div className="bg-gradient-to-r from-[#2D1263] via-[#380E83] to-[#5B21B6] py-12 md:py-16 text-center px-4 relative overflow-hidden">
        <h1 className="font-display text-3xl md:text-5xl text-white mb-3 relative z-10 tracking-tight font-extrabold">
          {activeBanner ? activeBanner.title : category ? `${category}` : q ? `Search Results for "${q}"` : "All"} <span className="italic font-light text-amber-300">Collections</span>
        </h1>
        <p className="text-purple-100 max-w-2xl mx-auto relative z-10 font-medium text-xs md:text-sm">
          Explore premium wellness, personal care, audio & lifestyle essentials. Handpicked for quality & speed.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* ========================================================
            TOP CATEGORY PILLS ROW (QUICK 1-CLICK SELECTION)
           ======================================================== */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
          <button
            onClick={() => navigate({ search: (prev) => ({ ...prev, category: undefined }) })}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
              !category
                ? "bg-[#6B46C1] text-white border-[#6B46C1] shadow-md shadow-purple-600/20"
                : "bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50"
            }`}
          >
            All Products
          </button>
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

        {/* ========================================================
            FILTER CONTROL BAR (FULL-WIDTH COMPACT TOOLBAR)
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

          {/* Middle: Product Count & Active Search/Category Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>
              Showing <strong className="text-slate-900 font-extrabold">{sortedProducts.length}</strong> products
            </span>
            {q && (
              <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
                "{q}"
                <X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => navigate({ search: (prev) => ({ ...prev, q: undefined }) })} />
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
              <option value="low-to-high">PRICE: LOW TO HIGH</option>
              <option value="high-to-low">PRICE: HIGH TO LOW</option>
              <option value="newest">NEWEST ARRIVALS</option>
            </select>
          </div>
        </div>

        {/* ========================================================
            FULL-WIDTH PRODUCT GRID (4 COLUMNS ON DESKTOP)
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
