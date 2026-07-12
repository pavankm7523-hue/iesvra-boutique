import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { categories, useProducts } from "@/lib/products";
import { useHeroBanners } from "@/lib/hero";
import { ProductCard } from "@/components/ProductCard";
import { useState } from "react";

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
  const { products: allProducts, isLoaded } = useProducts();
  const { data: banners } = useHeroBanners();
  
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
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);

  const handleCategoryToggle = (catName: string) => {
    if (category === catName) {
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

  const filteredProducts = allProducts.filter((p) => {
    // Hide exclusive products from global view
    if (!activeBanner && globalExclusiveIds.has(p.id)) {
      return false;
    }

    const matchesBanner = activeBanner?.productIds && activeBanner.productIds.length > 0
      ? activeBanner.productIds.includes(p.id)
      : !activeBanner; // If there is an activeBanner but it has no productIds, we don't show anything? Actually let's keep existing logic: if activeBanner is set, it MUST match productIds. If activeBanner is not set, it matches true.
    
    if (activeBanner && activeBanner.productIds && !activeBanner.productIds.includes(p.id)) {
        return false;
    }
      
    const matchesCategory = category ? p.categories.some(cat => cat.toLowerCase() === category.toLowerCase()) : true;
    const matchesSearch = q ? (
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      (p.sub && p.sub.toLowerCase().includes(q.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(q.toLowerCase())) ||
      p.categories.some(cat => cat.toLowerCase().includes(q.toLowerCase()))
    ) : true;
    
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

  const displayProducts = filteredProducts.map(p => {
    if (activeBanner && activeBanner.productPrices?.[p.id] !== undefined) {
      return {
        ...p,
        mrp: p.price,
        price: activeBanner.productPrices[p.id],
      };
    }
    return p;
  });

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="bg-navy-deep py-20 md:py-24 text-center px-4 relative overflow-hidden">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white mb-6 relative z-10 tracking-tight">
          {activeBanner ? activeBanner.title : category ? `${category}` : "All"} <span className="italic font-light text-gold">Collections</span>
        </h1>
        <p className="text-white/70 max-w-2xl mx-auto relative z-10 font-light text-base md:text-lg">
          Explore our wide range of premium wellness, audio, and lifestyle essentials. Designed for elegance and everyday luxury.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-8">
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-widest mb-6 text-navy-deep border-b border-border/50 pb-3">
              Categories
            </h3>
            <ul className="space-y-3 text-sm text-navy-deep/70">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-gold transition-colors font-medium">
                    <input
                      type="checkbox"
                      checked={category?.toLowerCase() === cat.name.toLowerCase()}
                      onChange={() => handleCategoryToggle(cat.name)}
                      className="rounded text-gold focus:ring-gold accent-gold cursor-pointer"
                    />
                    {cat.name}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-xs uppercase tracking-widest text-[#0c1421] mb-2 font-display">
              PRICE RANGE
            </h3>
            <div className="h-[1px] bg-gray-200/80 w-full mb-6"></div>
            <ul className="space-y-5">
              {["Under ₹999", "₹1,000 - ₹2,999", "₹3,000 - ₹4,999", "Above ₹5,000"].map((price) => (
                <li key={price}>
                  <label className="flex items-center gap-4 cursor-pointer text-[#374151] hover:text-primary font-light text-[15px] select-none transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={selectedPrices.includes(price)}
                      onChange={() => handlePriceToggle(price)}
                      className="w-4.5 h-4.5 rounded border border-gray-400 bg-white checked:bg-primary checked:border-primary text-primary focus:ring-0 focus:ring-offset-0 focus:outline-none transition-all cursor-pointer"
                    />
                    <span>{price}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-8 border-b border-border/30 pb-4">
            <span className="text-sm text-navy-deep/60 font-medium">
              Showing <span className="text-navy-deep font-bold">{displayProducts.length}</span> products
            </span>
            <select className="border-none bg-transparent text-navy-deep font-semibold text-sm focus:outline-none cursor-pointer uppercase tracking-wider text-xs">
              <option>Recommended</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest Arrivals</option>
            </select>
          </div>

          {displayProducts.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-lg bg-secondary/10">
              <p className="text-muted-foreground">No products found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {displayProducts.map((p, i) => (
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
      </div>
    </div>
  );
}
