import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { useWishlistItems, removeFromWishlist } from "@/lib/wishlist";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "My Wishlist - IESVRA" },
      { name: "description", content: "View and manage your saved products on IESVRA." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const items = useWishlistItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-navy-deep text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-white/60 hover:text-gold transition-colors text-sm font-medium mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Heart className="h-6 w-6 text-gold fill-gold" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                My Wishlist
              </h1>
              <p className="text-white/50 text-sm mt-1">
                {items.length} {items.length === 1 ? "item" : "items"} saved
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        {items.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-full bg-gold/5 border-2 border-gold/10 flex items-center justify-center mb-6">
              <Heart className="h-10 w-10 text-gold/30" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-navy-deep mb-3">
              Your wishlist is empty
            </h2>
            <p className="text-navy-deep/50 text-sm max-w-sm mb-8">
              Save your favourite products here to shop them later or share with friends.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-navy-deep text-gold px-8 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gold hover:text-navy-deep transition-all duration-300 shadow-lg shadow-navy-deep/10"
            >
              <ShoppingBag className="h-4 w-4" />
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const discount = Math.round(((item.mrp - item.price) / item.mrp) * 100);
              return (
                <article
                  key={item.id}
                  className="group bg-white rounded-2xl border border-border/60 hover:border-gold/30 hover:shadow-xl hover:shadow-navy-deep/5 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Image */}
                  <Link
                    to="/product/$id"
                    params={{ id: item.id }}
                    className="relative aspect-square bg-[#F7F7F7] flex items-center justify-center p-6 border-b border-border/40 overflow-hidden"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    {discount > 0 && (
                      <span className="absolute top-3 left-3 bg-gold text-navy-deep text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm shadow-sm">
                        {discount}% OFF
                      </span>
                    )}
                    {/* Remove button overlay */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromWishlist(item.id);
                        toast.success(`${item.name} removed from wishlist.`);
                      }}
                      aria-label="Remove from wishlist"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-border/50 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 shadow-sm opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Link>

                  {/* Info */}
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                        {item.categories?.[0] || "Uncategorized"}
                      </span>
                      <Link to="/product/$id" params={{ id: item.id }}>
                        <h3 className="font-display font-semibold text-sm text-navy-deep hover:text-gold transition-colors line-clamp-2 leading-snug mt-0.5">
                          {item.name}
                        </h3>
                      </Link>
                    </div>

                    <div className="flex items-baseline gap-2 flex-wrap mt-auto">
                      <span className="text-navy-deep font-bold text-base">
                        ₹{item.price.toLocaleString()}
                      </span>
                      {item.mrp > item.price && (
                        <span className="text-navy-deep/40 text-xs line-through">
                          ₹{item.mrp.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(
                            {
                              id: item.id,
                              name: item.name,
                              sub: item.sub,
                              price: item.price,
                              mrp: item.mrp,
                              image: item.image,
                              category: item.categories?.[0] || "Uncategorized",
                            } as any,
                            "Standard",
                            1
                          );
                          toast.success(`${item.name} added to cart!`);
                        }}
                        className="flex-1 bg-navy-deep text-gold h-10 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-gold hover:text-navy-deep transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Add to Cart
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          removeFromWishlist(item.id);
                          toast.success(`${item.name} removed from wishlist.`);
                        }}
                        aria-label="Remove"
                        className="w-10 h-10 rounded-xl border border-border/80 flex items-center justify-center text-navy-deep/50 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all duration-300 cursor-pointer"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
