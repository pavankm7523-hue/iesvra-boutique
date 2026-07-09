import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useProducts, colorMap } from "@/lib/products";
import { addToCart } from "@/lib/cart";
import { ArrowLeft, Star, ShoppingBag, Shield, Truck, RefreshCcw, ChevronLeft, ChevronRight, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/product/$id")({
  head: () => {
    return {
      meta: [{ title: "Product Details - IESVRA" }],
    };
  },
  component: ProductDetails,
});

function ProductDetails() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { products, updateProduct } = useProducts();
  const product = products.find((p) => p.id === id);

  const reviews = product?.reviews || [];
  const reviewsCount = reviews.length;
  const averageRating = reviewsCount > 0 
    ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount).toFixed(1))
    : 0;

  const [newAuthor, setNewAuthor] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);

  // ---- LIVE SOCIAL PROOF (product page) ----
  // NOTE: Must be here BEFORE any early returns to satisfy React Rules of Hooks
  const [pdpShopperCount, setPdpShopperCount] = useState(() => Math.floor(8 + Math.random() * 22));
  useEffect(() => {
    const interval = setInterval(() => {
      setPdpShopperCount(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(5, Math.min(40, prev + delta));
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  const pdpCurrentHour = new Date().getHours();
  const pdpIsBeforeCutoff = pdpCurrentHour < 21;
  // -------------------------------------------

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-display font-semibold text-navy-deep mb-4">Product Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-navy-deep text-gold px-8 py-3 rounded-full font-semibold uppercase tracking-wide hover:bg-gold hover:text-navy-deep transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Shop
        </Link>
      </div>
    );
  }

  const galleryItems = product.gallery && product.gallery.length > 0
    ? product.gallery
    : [{ id: "main", type: "image" as const, url: product.image }];

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const handleAddToCart = () => {
    const hasColors = product.colors && product.colors.length > 0;
    if (hasColors && !selectedColor) {
      toast.error("Please select a color option.");
      return;
    }
    const colorToUse = hasColors ? selectedColor : "Standard";
    addToCart(product, colorToUse, quantity);
    toast.success(
      `Successfully added ${quantity}x ${product.name}${hasColors ? ` (${selectedColor})` : ""} to your cart!`,
    );
  };

  const handleBuyDirectly = () => {
    const hasColors = product.colors && product.colors.length > 0;
    if (hasColors && !selectedColor) {
      toast.error("Please select a color option.");
      return;
    }
    const colorToUse = hasColors ? selectedColor : "Standard";
    addToCart(product, colorToUse, quantity);
    toast.success("Redirecting directly to checkout...");
    window.location.href = "/cart?checkout=true";
  };

  return (
    <div key={product.id} className="bg-background text-foreground min-h-screen pb-16">
      {/* Breadcrumbs */}
      <div className="bg-cream border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 text-xs font-semibold uppercase tracking-widest text-navy-deep/60 flex flex-wrap items-center gap-3">
          <Link to="/" className="hover:text-gold transition">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-gold transition">
            Shop
          </Link>
          <span>/</span>
          <Link
            to="/shop"
            search={{ category: product.categories[0] }}
            className="hover:text-gold transition"
          >
            {product.categories[0]}
          </Link>
          <span>/</span>
          <span className="text-navy-deep font-medium truncate max-w-[200px] sm:max-w-xs">
            {product.name}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left Column: Image & Gallery */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-border/30 overflow-hidden shadow-2xl shadow-navy-deep/5 aspect-square relative flex items-center justify-center p-8 group/main-img">
              {galleryItems[activeIndex]?.type === "video" ? (
                <video
                  src={galleryItems[activeIndex]?.url}
                  controls
                  className="w-full h-full object-contain max-h-[85vh]"
                />
              ) : (
                <img
                  src={galleryItems[activeIndex]?.url || product.image}
                  alt={product.name}
                  className="w-full h-full object-contain max-h-[85vh] transition-transform duration-500 hover:scale-105"
                />
              )}
              <span className="absolute top-6 left-6 bg-gold text-navy-deep text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg z-10">
                {discount}% OFF
              </span>

              {/* Navigation Arrows */}
              {galleryItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 hover:bg-white text-navy-deep hover:text-gold shadow-lg backdrop-blur-sm flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 border border-border/20 z-10 md:opacity-0 md:group-hover/main-img:opacity-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveIndex((prev) => (prev + 1) % galleryItems.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 hover:bg-white text-navy-deep hover:text-gold shadow-lg backdrop-blur-sm flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 border border-border/20 z-10 md:opacity-0 md:group-hover/main-img:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {galleryItems.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 px-1 justify-start sm:justify-center sm:flex-wrap sm:overflow-visible sm:pb-0 scrollbar-none">
                {galleryItems.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 bg-white p-1 transition-all duration-300 cursor-pointer shrink-0 relative ${
                      activeIndex === idx
                        ? "border-gold ring-2 ring-gold/20 scale-105 shadow-md"
                        : "border-border/60 hover:border-gold/50"
                    }`}
                  >
                    {item.type === "video" ? (
                      <div className="w-full h-full relative bg-gray-100 flex items-center justify-center">
                        <video
                          src={item.url}
                          className="w-full h-full object-contain opacity-70"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <span className="text-white text-[9px] font-bold bg-navy-deep/80 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Video
                          </span>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information */}
          <div className="space-y-8 lg:py-6">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold bg-gold/10 px-4 py-1.5 rounded-full inline-block mb-2">
                {product.categories.join(", ")}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-navy-deep leading-[1.1]">
                {product.name}
              </h1>
              <p className="text-base text-navy-deep/60 font-light">{product.sub}</p>
            </div>

            {/* Ratings */}
            <div className="flex items-center gap-4 border-y border-border/30 py-4">
              <div className="flex items-center text-gold">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating) ? "fill-current" : "fill-current opacity-30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-navy-deep">
                {reviewsCount > 0 ? `${averageRating} / 5.0` : "No reviews yet"}
              </span>
              <span className="text-xs text-navy-deep/50 uppercase tracking-wider font-semibold">
                ({reviewsCount} {reviewsCount === 1 ? "Review" : "Reviews"})
              </span>
            </div>

            {/* Pricing */}
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-navy-deep tracking-tight">₹{product.price.toLocaleString()}.00</span>
                <span className="text-navy-deep/40 line-through text-lg">
                  ₹{product.mrp.toLocaleString()}.00
                </span>
              </div>
              <p className="text-xs text-gold font-bold uppercase tracking-wide">
                You save ₹{(product.mrp - product.price).toLocaleString()}.00 ({discount}%)
              </p>
            </div>

            {/* Description */}
            <div className="space-y-3 text-sm text-navy-deep/70 leading-relaxed font-light">
              <h3 className="font-semibold text-navy-deep uppercase tracking-wider text-xs">Product Details</h3>
              <p>{product.description}</p>
            </div>

            {/* Colors Section */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-navy-deep uppercase tracking-wider text-xs">
                    Color Option: <span className="text-gold font-bold ml-1">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((colorName) => {
                    const hex = colorMap[colorName] || "#CCCCCC";
                    const isSelected = selectedColor === colorName;
                    return (
                      <button
                        key={colorName}
                        type="button"
                        title={colorName}
                        onClick={() => setSelectedColor(colorName)}
                        className={`h-9 min-w-9 rounded-full flex items-center justify-center p-0.5 border cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? "border-gold ring-2 ring-gold/25 ring-offset-1 scale-105"
                            : "border-border hover:border-gray-400"
                        }`}
                      >
                        <span
                          className="h-full w-full rounded-full border border-black/10"
                          style={{ backgroundColor: hex }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-6 border-t border-border/30 w-full">
              <div className="flex items-center justify-between border-2 border-border/50 rounded-full h-14 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-5 text-navy-deep/60 hover:text-navy-deep hover:bg-secondary/20 transition-colors h-full rounded-l-full cursor-pointer font-bold text-xl"
                >
                  -
                </button>
                <span className="px-4 font-bold text-navy-deep text-base w-12 text-center select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-5 text-navy-deep/60 hover:text-navy-deep hover:bg-secondary/20 transition-colors h-full rounded-r-full cursor-pointer font-bold text-xl"
                >
                  +
                </button>
              </div>

              <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 border-2 border-gold text-gold hover:bg-gold hover:text-navy-deep h-14 rounded-full font-bold uppercase tracking-widest text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" /> Add to Cart
                </button>

                <button
                  type="button"
                  onClick={handleBuyDirectly}
                  className="flex-1 bg-gradient-to-r from-[#e0b480] to-[#c1935e] text-navy-deep hover:shadow-[0_8px_30px_rgba(207,168,123,0.3)] h-14 rounded-full font-bold uppercase tracking-widest text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl active:scale-[0.98] cursor-pointer"
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Live Social Proof */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 bg-navy-deep/5 border border-navy-deep/10 rounded-full px-3 py-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                <Users className="h-3 w-3 text-navy-deep/60" />
                <span className="text-[10px] font-semibold text-navy-deep/70"><span className="font-bold text-navy-deep">{pdpShopperCount}</span> people viewing this</span>
              </div>
              {pdpIsBeforeCutoff && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
                  <Clock className="h-3 w-3 text-amber-600" />
                  <span className="text-[10px] font-semibold text-amber-700">Order before <span className="font-bold">9 PM</span> → Next Day Delivery</span>
                </div>
              )}
            </div>

            {/* Features strip */}
            <div className="grid grid-cols-3 gap-4 border-t border-border pt-6 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gold shrink-0" />
                <span>100% Safe Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gold shrink-0" />
                <span>Free Delivery above ₹499</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4 text-gold shrink-0" />
                <span>Easy Returns within 14 Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Reviews Section */}
        <div className="mt-20 border-t border-border/40 pt-16">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            {/* Reviews Metrics & Breakdown */}
            <div className="w-full lg:w-1/3 bg-white p-8 rounded-3xl border border-border/40 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-navy-deep uppercase tracking-wider mb-2">
                  Customer Ratings
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-navy-deep tracking-tight">
                    {reviewsCount > 0 ? averageRating.toFixed(1) : "0.0"}
                  </span>
                  <span className="text-navy-deep/40 text-lg">/ 5.0</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex text-gold">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.round(averageRating) ? "fill-current" : "fill-current opacity-30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-navy-deep/50 font-semibold uppercase tracking-wider">
                    based on {reviewsCount} {reviewsCount === 1 ? "review" : "reviews"}
                  </span>
                </div>
              </div>

              {/* Distribution bars */}
              <div className="space-y-3 pt-6 border-t border-border/30">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviews.filter((r) => r.rating === stars).length;
                  const percentage = reviewsCount > 0 ? Math.round((count / reviewsCount) * 100) : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-sm">
                      <span className="w-12 text-navy-deep/70 font-semibold text-xs uppercase">
                        {stars} Star
                      </span>
                      <div className="flex-1 h-2.5 bg-[#f4f2ef] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-navy-deep/60 text-xs font-semibold">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews List & Form */}
            <div className="flex-1 w-full space-y-12">
              {/* Write a Review Form */}
              <div className="bg-white p-8 rounded-3xl border border-border/40 shadow-sm">
                <h4 className="text-lg font-bold text-navy-deep uppercase tracking-wider mb-6">
                  Write a Review
                </h4>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newAuthor.trim() || !newComment.trim()) {
                      toast.error("Please fill in all fields.");
                      return;
                    }
                    const newReview = {
                      id: `rev_${Date.now()}`,
                      author: newAuthor.trim(),
                      rating: newRating,
                      comment: newComment.trim(),
                      date: new Date().toISOString().split("T")[0],
                    };
                    const updatedProduct = {
                      ...product,
                      reviews: [newReview, ...reviews],
                    };
                    updateProduct(updatedProduct);
                    toast.success("Thank you for your review!");
                    setNewAuthor("");
                    setNewComment("");
                    setNewRating(5);
                  }}
                  className="space-y-5"
                >
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy-deep/70">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="e.g. Priyanjali Sen"
                      className="h-12 px-4 rounded-xl border border-border/80 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-sm transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy-deep/70">
                      Rating
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="text-gold focus:outline-none transition-transform hover:scale-110 active:scale-90"
                        >
                          <Star
                            className={`h-7 w-7 ${
                              star <= (hoverRating ?? newRating)
                                ? "fill-current"
                                : "fill-current opacity-20"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy-deep/70">
                      Review Comment
                    </label>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      rows={4}
                      className="p-4 rounded-xl border border-border/80 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-sm transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 h-12 bg-navy-deep text-gold font-bold uppercase tracking-wider text-xs rounded-full hover:bg-gold hover:text-navy-deep transition-all duration-300 shadow-md shadow-navy-deep/10"
                  >
                    Submit Review
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                <h4 className="text-lg font-bold text-navy-deep uppercase tracking-wider border-b border-border/30 pb-4">
                  Customer Opinions ({reviewsCount})
                </h4>
                {reviewsCount === 0 ? (
                  <p className="text-sm text-navy-deep/50 italic py-6">
                    No reviews yet. Be the first to share your thoughts!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((rev) => {
                      const initials = rev.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                      return (
                        <div
                          key={rev.id}
                          className="bg-white p-6 rounded-2xl border border-border/30 shadow-sm flex gap-4 items-start hover:shadow-md transition-shadow duration-300"
                        >
                          <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold text-xs shrink-0 select-none border border-gold/20">
                            {initials}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-sm text-navy-deep">
                                {rev.author}
                              </span>
                              <span className="text-[10px] text-navy-deep/40 font-semibold">
                                {rev.date}
                              </span>
                            </div>
                            <div className="flex text-gold">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3.5 w-3.5 ${
                                    star <= rev.rating ? "fill-current" : "fill-current opacity-20"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-navy-deep/80 leading-relaxed font-light">
                              {rev.comment}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
