import { Link, useNavigate } from "@tanstack/react-router";
import type { Product } from "@/lib/products";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { toggleWishlist, useIsInWishlist } from "@/lib/wishlist";
import { toast } from "sonner";

export function ProductCard({
  product,
  showHeart = true,
  customBadge,
  bannerId,
  saleEndDate,
}: {
  product: Product;
  showHeart?: boolean;
  customBadge?: string;
  bannerId?: string;
  saleEndDate?: string;
}) {
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const reviews = product.reviews || [];
  const reviewsCount = reviews.length;
  const averageRating = reviewsCount > 0 
    ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount).toFixed(1))
    : 0;

  return (
    <article className="group flex flex-col relative h-full bg-white rounded-xl border border-border/60 hover:border-gold/30 hover:shadow-lg hover:shadow-navy-deep/5 transition-all duration-300">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        search={bannerId ? { bannerId } : undefined}
        className="flex flex-col flex-1 cursor-pointer"
      >
        <div className="relative aspect-square bg-[#F7F7F7] overflow-hidden rounded-t-xl flex items-center justify-center p-6 border-b border-border/40">
          {/* Dynamic Badge */}
          {(customBadge || product.isBestSeller) && (
            <div className="absolute top-3 left-3 z-10 bg-gold text-navy-deep text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm">
              {customBadge || "Best Seller"}
            </div>
          )}

          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={800}
            height={800}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </div>
        
        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-display font-semibold text-sm text-navy-deep group-hover:text-gold transition-colors line-clamp-1 leading-snug">
            {product.name}
          </h3>
          
          {/* Rating */}
          {reviewsCount > 0 ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex text-gold">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-3 w-3 ${star <= Math.round(averageRating) ? "fill-current" : "fill-current opacity-30"}`} 
                  />
                ))}
              </div>
              <span className="text-[11px] font-medium text-navy-deep/80">{averageRating} <span className="text-navy-deep/50">({reviewsCount})</span></span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-navy-deep/50">No reviews yet</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-navy-deep font-bold text-base tracking-tight">₹{product.price.toFixed(2)}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-navy-deep/40 text-[11px] line-through">₹{product.mrp.toFixed(2)}</span>
                <span className="text-discount font-bold text-[10px] tracking-wider uppercase">({discount}% OFF)</span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button - Purple to match reference */}
      <div className="p-4 pt-0 mt-auto">
        <button
          className="w-full bg-primary text-white hover:bg-primary/90 h-10 rounded-md font-bold text-xs uppercase tracking-wider transition-colors duration-300 flex items-center justify-center cursor-pointer shadow-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const colorToUse = product.colors && product.colors.length > 0 ? product.colors[0] : "Standard";
            // @ts-ignore - passing extra args that we will add to cart.ts next
            addToCart(product, colorToUse, 1, bannerId, saleEndDate, product.mrp); // mrp holds the normal price now
            toast.success(`Successfully added ${product.name} to your cart!`);
          }}
        >
          Add to Cart
        </button>
      </div>

      {showHeart && <WishlistButton product={product} />}
    </article>
  );
}

function WishlistButton({ product }: { product: Product }) {
  const inWishlist = useIsInWishlist(product.id);
  const navigate = useNavigate();

  return (
    <button
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        const added = toggleWishlist(product);
        if (added) {
          toast.success("Added to wishlist!", {
            action: { label: "View Wishlist", onClick: () => navigate({ to: "/wishlist" }) },
          });
        } else {
          toast.info("Removed from wishlist.");
        }
      }}
      className={`absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white border flex items-center justify-center transition-all duration-300 shadow-sm cursor-pointer ${
        inWishlist
          ? "border-red-400 text-red-500 bg-red-50"
          : "border-border/50 text-navy-deep hover:bg-gold hover:text-white hover:border-gold"
      }`}
    >
      <Heart className={`h-4 w-4 ${inWishlist ? "fill-current" : ""}`} />
    </button>
  );
}
