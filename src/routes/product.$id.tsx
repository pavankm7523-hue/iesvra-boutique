import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { formatProductPolicy, useProducts, colorMap, type ProductMedia } from "@/lib/products";
import { addToCart } from "@/lib/cart";
import { useIsInWishlist, toggleWishlist } from "@/lib/wishlist";
import { geocodeAddress, reverseGeocode } from "@/lib/delivery";
import { 
  ArrowLeft, Star, ShoppingBag, Shield, Truck, RefreshCcw, 
  ChevronLeft, ChevronRight, Users, Clock, Award, MapPin, 
  Heart, CheckCircle2, Lock, Zap, ChevronDown, Locate, Loader2
} from "lucide-react";

const productSearchSchema = z.object({
  bannerId: z.string().optional(),
  category: z.string().optional(),
  q: z.string().optional(),
});

/**
 * Resolves a 6-digit Indian PIN code to real City/District, State, and Locality.
 * Validates against the official India Post API and geocoding services.
 */
async function resolveLocationFromPincode(pincode: string): Promise<{
  city: string;
  state: string;
  locality: string;
  pincode: string;
  isExpress: boolean;
  displayText: string;
} | null> {
  const cleanPin = pincode.trim().replace(/\D/g, "");
  if (cleanPin.length !== 6) return null;

  // 1. Query India Post Postal API for official District, State, and Post Office Name
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === "Success" && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
        const po = data[0].PostOffice[0];
        const city = po.District || po.Division || po.Circle || "Patna";
        const state = po.State || "Bihar";
        const locality = po.Name || "";
        const isExpress = city.toLowerCase().includes("patna") || cleanPin.startsWith("800") || cleanPin.startsWith("801");
        const displayText = locality && locality !== city ? `${locality}, ${city} ${cleanPin}` : `${city} ${cleanPin}`;
        return { city, state, locality, pincode: cleanPin, isExpress, displayText };
      }
    }
  } catch (err) {
    console.warn("[pincode-lookup] Postal API fetch failed, trying geocoder:", err);
  }

  // 2. Fallback to Geocoding via Nominatim/Google
  try {
    const geo = await geocodeAddress(cleanPin);
    if (geo && (geo.city || geo.state)) {
      const city = geo.city || geo.state || "Patna";
      const state = geo.state || "Bihar";
      const locality = geo.line2 || geo.line1 || "";
      const isExpress = city.toLowerCase().includes("patna") || cleanPin.startsWith("800") || cleanPin.startsWith("801");
      const displayText = locality && locality !== city ? `${locality}, ${city} ${cleanPin}` : `${city} ${cleanPin}`;
      return { city, state, locality, pincode: cleanPin, isExpress, displayText };
    }
  } catch (err) {
    console.warn("[pincode-lookup] Geocoding lookup failed:", err);
  }

  // 3. Fallback for Patna warehouse zone
  if (cleanPin.startsWith("800") || cleanPin.startsWith("801")) {
    const locality = cleanPin === "800020" ? "Kankarbagh" : "Patna";
    return {
      city: "Patna",
      state: "Bihar",
      locality,
      pincode: cleanPin,
      isExpress: true,
      displayText: `${locality}, Patna ${cleanPin}`,
    };
  }

  return null;
}export const Route = createFileRoute("/product/$id")({
  validateSearch: (search) => productSearchSchema.parse(search),
  head: () => {
    return {
      meta: [
        { title: "Product Details | IESVRA Boutique" },
        { name: "description", content: "Explore product specifications, features, customer reviews, and fast delivery options at IESVRA." },
        { property: "og:type", content: "product" },
      ],
    };
  },
  component: ProductDetails,
});

function ProductDetails() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { products, updateProduct } = useProducts();
  const product = products.find((p) => p.id === id);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | IESVRA Boutique`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && product.sub) {
        metaDesc.setAttribute("content", product.sub);
      }
    }
  }, [product]);

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
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);

  // ---- DYNAMIC REAL-TIME LIVE DELIVERY TIMER (1-SECOND TICKING) ----
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number; isBeforeCutoff: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isBeforeCutoff: true,
  });

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setHours(21, 0, 0, 0); // 9:00 PM cutoff

      let diff = cutoff.getTime() - now.getTime();
      let isBefore = true;
      if (diff <= 0) {
        isBefore = false;
        cutoff.setDate(cutoff.getDate() + 1);
        diff = cutoff.getTime() - now.getTime();
      }

      const totalSeconds = Math.max(0, Math.floor(diff / 1000));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setCountdown({ hours, minutes, seconds, isBeforeCutoff: isBefore });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000); // Live real-time tick every second
    return () => clearInterval(interval);
  }, []);

  // ---- REAL SAVED DELIVERY LOCATION & PINCODE RESOLUTION ----
  const [deliveryLoc, setDeliveryLoc] = useState<{
    city: string;
    state: string;
    locality: string;
    pincode: string;
    isExpress: boolean;
    displayText: string;
  }>({
    city: "Patna",
    state: "Bihar",
    locality: "Kankarbagh",
    pincode: "800020",
    isExpress: true,
    displayText: "Kankarbagh, Patna 800020",
  });

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [pincodeInput, setPincodeInput] = useState("");
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  // Save location to localStorage and broadcast sync event
  const saveLocation = (loc: {
    city: string;
    state: string;
    locality: string;
    pincode: string;
    isExpress: boolean;
    displayText: string;
  }) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("IESVRA_delivery_city", loc.city);
    localStorage.setItem("IESVRA_delivery_state", loc.state);
    localStorage.setItem("IESVRA_delivery_pincode", loc.pincode);
    localStorage.setItem("IESVRA_delivery_address_locality", loc.locality);
    localStorage.setItem(
      "IESVRA_delivery_address",
      `${loc.locality ? loc.locality + ", " : ""}${loc.city}, ${loc.state} - ${loc.pincode}`
    );
    localStorage.setItem("IESVRA_is_express_eligible", loc.isExpress ? "true" : "false");
    window.dispatchEvent(new Event("iesvra-address-updated"));
  };

  // Sync state with localStorage changes across pages and header
  const syncLocationFromStorage = () => {
    if (typeof window === "undefined") return;
    const city = localStorage.getItem("IESVRA_delivery_city")?.trim() || "";
    const pin = localStorage.getItem("IESVRA_delivery_pincode")?.trim() || "";
    const locality = localStorage.getItem("IESVRA_delivery_address_locality")?.trim() || "";
    const fullAddr = localStorage.getItem("IESVRA_delivery_address")?.trim() || "";
    const isExpress = localStorage.getItem("IESVRA_is_express_eligible") === "true";

    // Clean up any stale or invalid test pincode like 192773
    if (pin === "192773" || (city.toLowerCase() === "patna" && pin && !pin.startsWith("800") && !pin.startsWith("801"))) {
      const defaultLoc = {
        city: "Patna",
        state: "Bihar",
        locality: "Kankarbagh",
        pincode: "800020",
        isExpress: true,
        displayText: "Kankarbagh, Patna 800020",
      };
      saveLocation(defaultLoc);
      setDeliveryLoc(defaultLoc);
      return;
    }

    if (city && pin) {
      const displayText = locality && locality !== city ? `${locality}, ${city} ${pin}` : `${city} ${pin}`;
      setDeliveryLoc({
        city,
        state: localStorage.getItem("IESVRA_delivery_state") || "",
        locality,
        pincode: pin,
        isExpress,
        displayText,
      });
    } else if (pin) {
      setDeliveryLoc({
        city: city || "",
        state: "",
        locality: "",
        pincode: pin,
        isExpress,
        displayText: `PIN ${pin}`,
      });
    } else if (fullAddr) {
      const parts = fullAddr.split(",").map(p => p.trim()).filter(Boolean);
      const shortAddr = parts.slice(0, 2).join(", ");
      setDeliveryLoc({
        city: city || "Patna",
        state: localStorage.getItem("IESVRA_delivery_state") || "Bihar",
        locality: locality || "",
        pincode: pin || "800020",
        isExpress,
        displayText: shortAddr || "Kankarbagh, Patna 800020",
      });
    } else {
      setDeliveryLoc({
        city: "Patna",
        state: "Bihar",
        locality: "Kankarbagh",
        pincode: "800020",
        isExpress: true,
        displayText: "Kankarbagh, Patna 800020",
      });
    }
  };

  useEffect(() => {
    syncLocationFromStorage();
    window.addEventListener("iesvra-address-updated", syncLocationFromStorage);
    window.addEventListener("storage", syncLocationFromStorage);
    return () => {
      window.removeEventListener("iesvra-address-updated", syncLocationFromStorage);
      window.removeEventListener("storage", syncLocationFromStorage);
    };
  }, []);

  // Handle user entering a PIN code
  const handleApplyPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincodeInput.trim().replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      toast.error("Please enter a valid 6-digit PIN code.");
      return;
    }

    setIsResolvingLocation(true);
    try {
      const resolved = await resolveLocationFromPincode(cleanPin);
      if (resolved) {
        saveLocation(resolved);
        setDeliveryLoc(resolved);
        setIsEditingLocation(false);
        setPincodeInput("");
        toast.success(`Delivery location updated to ${resolved.displayText}`);
      } else {
        toast.error(`Could not verify PIN ${cleanPin}. Please verify and enter a valid Indian postal code.`);
      }
    } catch (err) {
      toast.error("Failed to verify pincode. Please try again.");
    } finally {
      setIsResolvingLocation(false);
    }
  };

  // Handle detecting user's current GPS location
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setIsResolvingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const geo = await reverseGeocode(latitude, longitude);
          if (geo && (geo.city || geo.pincode)) {
            const city = geo.city || "Patna";
            const state = geo.state || "Bihar";
            const pincode = geo.pincode || "800020";
            const locality = geo.line2 || geo.line1 || "";
            const isExpress = city.toLowerCase().includes("patna") || pincode.startsWith("800") || pincode.startsWith("801");
            const displayText = locality && locality !== city ? `${locality}, ${city} ${pincode}` : `${city} ${pincode}`;
            const locObj = { city, state, locality, pincode, isExpress, displayText };
            saveLocation(locObj);
            setDeliveryLoc(locObj);
            setIsEditingLocation(false);
            toast.success(`Location detected: ${displayText}`);
          } else {
            toast.error("Unable to resolve address from coordinates.");
          }
        } catch (err) {
          toast.error("Failed to detect location.");
        } finally {
          setIsResolvingLocation(false);
        }
      },
      (err) => {
        setIsResolvingLocation(false);
        toast.error("Please allow location access to auto-detect your delivery address.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // ---- DYNAMIC DELIVERY DATES BASED ON LOCATION ----
  const deliveryDates = useMemo(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
    const isPastCutoff = now.getHours() >= 21;

    if (deliveryLoc.isExpress) {
      // Local Express (Patna): Next Day Delivery or 15-30 Min Express
      const fastestDate = new Date(now);
      fastestDate.setDate(now.getDate() + (isPastCutoff ? 2 : 1));
      const fastestFormatted = fastestDate.toLocaleDateString("en-IN", options);
      const fastestPrefix = isPastCutoff ? "in 2 days" : "Tomorrow";

      const freeDate = new Date(now);
      freeDate.setDate(now.getDate() + (isPastCutoff ? 3 : 2));
      const freeFormatted = freeDate.toLocaleDateString("en-IN", options);

      return {
        isExpress: true,
        fastestFormatted,
        fastestPrefix,
        freeFormatted,
      };
    } else {
      // National Standard Delivery (Outside Patna across India)
      const fastestDate = new Date(now);
      fastestDate.setDate(now.getDate() + 2);
      const fastestFormatted = fastestDate.toLocaleDateString("en-IN", options);
      const fastestPrefix = "in 2-3 days";

      const freeDate = new Date(now);
      freeDate.setDate(now.getDate() + 4);
      const freeFormatted = freeDate.toLocaleDateString("en-IN", options);

      return {
        isExpress: false,
        fastestFormatted,
        fastestPrefix,
        freeFormatted,
      };
    }
  }, [deliveryLoc.isExpress]);

  // ---- WISHLIST STATUS ----
  const isWishlisted = useIsInWishlist(product?.id || "");

  const handleWishlistToggle = () => {
    if (!product) return;
    const added = toggleWishlist(product);
    if (added) {
      toast.success(`Added ${product.name} to your Wishlist!`);
    } else {
      toast.info(`Removed from your Wishlist.`);
    }
  };

  // ---- LIVE SOCIAL PROOF (product page) ----
  // NOTE: Must be here BEFORE any early returns to satisfy React Rules of Hooks
  // Deterministic first render prevents SSR hydration text mismatches.
  const [pdpShopperCount, setPdpShopperCount] = useState(18);
  useEffect(() => {
    setPdpShopperCount(Math.floor(8 + Math.random() * 22));
    const interval = setInterval(() => {
      setPdpShopperCount(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(5, Math.min(40, prev + delta));
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);
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
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-semibold uppercase tracking-wide hover:bg-primary/95 transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Shop
        </Link>
      </div>
    );
  }

  const galleryItems = useMemo(() => {
    const raw = product.gallery && product.gallery.length > 0
      ? product.gallery
      : [{ id: "main", type: "image" as const, url: product.image }];
    const seen = new Set<string>();
    const items: ProductMedia[] = [];
    for (const item of raw) {
      if (item && item.url && !seen.has(item.url)) {
        seen.add(item.url);
        items.push(item);
      }
    }
    return items.length > 0 ? items : [{ id: "main", type: "image" as const, url: product.image }];
  }, [product.gallery, product.image]);

  const activeVariant = product.variants?.[selectedVariantIndex];
  const currentPrice = (activeVariant && typeof activeVariant.price === "number") ? activeVariant.price : product.price;
  const currentMrp = (activeVariant && typeof activeVariant.mrp === "number") ? activeVariant.mrp : product.mrp;
  const discount = currentMrp > 0 ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;
  const totalPrice = currentPrice * quantity;
  const totalSavings = (currentMrp - currentPrice) * quantity;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 5;

  const handleAddToCart = () => {
    const variantLabel = activeVariant ? activeVariant.label : (selectedColor || "Standard");
    const itemToCart = activeVariant ? { ...product, price: currentPrice, mrp: currentMrp } : product;
    addToCart(itemToCart, variantLabel, quantity);
    toast.success(
      `Successfully added ${quantity}x ${product.name} (${variantLabel}) to your cart!`,
    );
  };

  const handleBuyDirectly = () => {
    const variantLabel = activeVariant ? activeVariant.label : (selectedColor || "Standard");
    const itemToCart = activeVariant ? { ...product, price: currentPrice, mrp: currentMrp } : product;
    addToCart(itemToCart, variantLabel, quantity);
    toast.success("Redirecting directly to checkout...");
    window.location.href = "/cart?checkout=true";
  };

  return (
    <div key={product.id} className="min-h-screen w-full min-w-0 max-w-full overflow-x-clip bg-background pb-16 text-foreground">
      {/* Breadcrumbs */}
      <div className="w-full min-w-0 max-w-full overflow-x-clip bg-cream border-b border-border/50">
        <div className="max-w-7xl min-w-0 mx-auto px-4 lg:px-8 py-4 text-xs font-semibold uppercase tracking-widest text-navy-deep/60 flex flex-wrap items-center gap-3">
          <Link to="/" className="hover:text-primary transition">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-gold transition">
            Shop
          </Link>
          <span>/</span>
          <Link
            to="/shop"
            search={{ category: product.categories?.[0] || "All" }}
            className="hover:text-gold transition"
          >
            {product.categories?.[0] || "All"}
          </Link>
          <span>/</span>
          <span className="text-navy-deep font-medium truncate max-w-[200px] sm:max-w-xs">
            {product.name}
          </span>
        </div>
      </div>

      <div className="w-full min-w-0 max-w-7xl mx-auto overflow-x-clip px-4 lg:px-8 py-10">
        <div className="grid w-full min-w-0 max-w-full lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Image & Gallery (5 cols) */}
          <div className="w-full min-w-0 max-w-full lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-[2rem] border border-border/30 overflow-hidden shadow-2xl shadow-navy-deep/5 w-full aspect-square relative flex items-center justify-center p-8 group/main-img">
              {galleryItems[activeIndex]?.type === "video" ? (
                <video
                  src={galleryItems[activeIndex]?.url}
                  controls
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <img
                  src={galleryItems[activeIndex]?.url || product.image}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain transition-transform duration-500 hover:scale-105"
                />
              )}

              {/* Red Circular/Pill Discount Badge */}
              {discount > 0 && (
                <div className="absolute top-5 left-5 flex items-center gap-1.5 bg-red-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg z-10">
                  <span>{discount}% OFF</span>
                </div>
              )}

              {/* Navigation Arrows */}
              {galleryItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 hover:bg-white text-navy-deep hover:text-primary shadow-lg backdrop-blur-sm flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 border border-border/20 z-10 md:opacity-0 md:group-hover/main-img:opacity-100"
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 hover:bg-white text-navy-deep hover:text-primary shadow-lg backdrop-blur-sm flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 border border-border/20 z-10 md:opacity-0 md:group-hover/main-img:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {galleryItems.length > 1 && (
              <div className="flex w-full min-w-0 max-w-full touch-pan-x justify-start gap-3 overflow-x-auto overscroll-x-contain pb-2 px-1 sm:justify-center sm:flex-wrap sm:overflow-visible sm:pb-0 scrollbar-none">
                {galleryItems.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 bg-white p-1 transition-all duration-300 cursor-pointer shrink-0 relative ${
                      activeIndex === idx
                        ? "border-primary ring-2 ring-primary/20 scale-105 shadow-md"
                        : "border-border/60 hover:border-primary/50"
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

          {/* Center/Right Column: Product Details & Amazon Purchase Box (7 cols) */}
          <div className="w-full min-w-0 max-w-full lg:col-span-7 space-y-6">
            
            {/* Top Badges & Category Header */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Category Pill */}
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary bg-primary/10 px-3.5 py-1 rounded-full inline-block">
                  {(product.categories || []).join(", ")}
                </span>

                {/* Amazon-Style #1 Best Seller Badge (Only for isBestSeller: true) */}
                {product.isBestSeller && (
                  <Link
                    to="/shop"
                    search={{ category: product.categories?.[0] || "All" }}
                    className="inline-flex items-center gap-1.5 bg-[#e47911] hover:bg-[#c96608] text-white text-[11px] font-bold px-3 py-1 rounded-sm shadow-sm transition-all tracking-wide group"
                    title={`View Best Sellers in ${product.categories?.[0] || "All"}`}
                  >
                    <Award className="h-3.5 w-3.5 fill-white text-white shrink-0" />
                    <span>#1 Best Seller</span>
                    <span className="font-normal opacity-90 lowercase first-letter:uppercase text-[10px]">
                      in {product.categories?.[0] || "Featured"}
                    </span>
                  </Link>
                )}
              </div>

              {/* Title & Subtitle */}
              <h1 className="max-w-full whitespace-normal break-words [overflow-wrap:anywhere] font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-navy-deep leading-tight">
                {product.name}
              </h1>
              <p className="max-w-full whitespace-normal break-words [overflow-wrap:anywhere] text-sm text-navy-deep/60 font-light">
                {(product.sub || "").replace(/IESVRA Boutique/g, "IESVRA")}
              </p>
            </div>

            {/* Ratings & Social Proof Line */}
            <div className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-x-5 gap-y-2 border-y border-border/40 py-3.5 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center text-gold">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(averageRating) ? "fill-current" : "fill-current opacity-30"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-navy-deep">
                  {reviewsCount > 0 ? averageRating.toFixed(1) : "No reviews"}
                </span>
                <span className="text-xs text-navy-deep/50 font-medium">
                  ({reviewsCount} {reviewsCount === 1 ? "rating" : "ratings"})
                </span>
              </div>

              {/* "X,000+ bought in past month" (Shown when boughtInPastMonth is set) */}
              {product.boughtInPastMonth && product.boughtInPastMonth > 0 && (
                <div className="flex min-w-0 max-w-full items-center gap-1.5 text-xs text-navy-deep/80 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-[#92400e]">
                  <Zap className="h-3 w-3 shrink-0 text-[#d97706] fill-[#d97706]" />
                  <span className="min-w-0 whitespace-normal break-words">{product.boughtInPastMonth.toLocaleString()}+ bought in past month</span>
                </div>
              )}
            </div>

            {/* Price Row */}
            <div className="space-y-1">
              <div className="flex min-w-0 flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-navy-deep tracking-tight">
                  ₹{currentPrice.toLocaleString()}.00
                </span>
                {discount > 0 && (
                  <>
                    <span className="text-navy-deep/40 line-through text-lg">
                      ₹{currentMrp.toLocaleString()}.00
                    </span>
                    <span className="text-xs text-red-600 font-extrabold uppercase tracking-wide bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      -{discount}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-navy-deep/60">
                Inclusive of all taxes. Free shipping on orders over ₹499.
              </p>
            </div>

            {/* Amazon-Style Size / Pack Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-navy-deep/70">Size:</span>
                  <span className="font-bold text-navy-deep text-base">
                    {activeVariant ? activeVariant.label : product.variants[0]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {product.variants.map((variant, idx) => {
                    const isSelected = selectedVariantIndex === idx;
                    const countMatch = variant.label.match(/\d+/);
                    const count = countMatch ? parseInt(countMatch[0], 10) : null;
                    const perCountText = variant.unitPriceText || (count ? `(₹${(variant.price / count).toFixed(2)} / count)` : null);

                    return (
                      <button
                        key={variant.label || idx}
                        type="button"
                        onClick={() => setSelectedVariantIndex(idx)}
                        className={`relative p-3 rounded-lg border-2 text-left cursor-pointer transition-all duration-150 flex flex-col justify-between min-h-[96px] min-w-0 ${
                          isSelected
                            ? "border-[#007185] bg-[#f0f8ff] ring-1 ring-[#007185] shadow-sm"
                            : "border-gray-300 hover:border-gray-600 bg-white"
                        }`}
                      >
                        {/* Top: Size / Pack Label */}
                        <div className="font-bold text-sm text-navy-deep leading-tight break-words">
                          {variant.label}
                        </div>

                        {/* Middle: Current Price */}
                        <div className="text-sm font-semibold text-navy-deep mt-1 break-words">
                          ₹{Number(variant.price).toLocaleString(undefined, { minimumFractionDigits: Number.isInteger(variant.price) ? 0 : 2 })}
                        </div>

                        {/* Subtitle: (₹X.XX / count) */}
                        {perCountText && (
                          <div className="text-[11px] text-gray-500 leading-tight mt-0.5 break-words">
                            {perCountText}
                          </div>
                        )}

                        {/* Strikethrough MRP */}
                        {variant.mrp && variant.mrp > variant.price && (
                          <div className="text-xs text-gray-400 line-through mt-0.5 break-words">
                            ₹{Number(variant.mrp).toLocaleString(undefined, { minimumFractionDigits: Number.isInteger(variant.mrp) ? 0 : 2 })}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AMAZON-STYLE PURCHASE BOX CARD */}
            <div className="w-full min-w-0 max-w-full overflow-x-clip bg-white rounded-2xl border-2 border-border/80 p-5 sm:p-6 shadow-md shadow-navy-deep/5 space-y-4">
              {/* Total Price Header */}
              <div className="border-b border-border/40 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-navy-deep/60">Total Amount:</span>
                  <div className="sm:text-right min-w-0">
                    <span className="text-xl sm:text-2xl font-black text-navy-deep break-words block">₹{totalPrice.toLocaleString()}.00</span>
                    {totalSavings > 0 && (
                      <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 break-words whitespace-normal mt-0.5">
                        You save ₹{totalSavings.toLocaleString()}.00 ({discount}%)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Estimates */}
              <div className="min-w-0 max-w-full space-y-2 text-xs sm:text-sm text-navy-deep/90 leading-relaxed">
                <div className="max-w-full whitespace-normal break-words [overflow-wrap:anywhere]">
                  <span className="font-bold text-primary">FREE delivery </span>
                  <span suppressHydrationWarning className="font-extrabold text-navy-deep">{deliveryDates.freeFormatted}</span>
                  <span className="text-navy-deep/70"> on orders over ₹499.</span>
                </div>
                <div className="max-w-full whitespace-normal break-words [overflow-wrap:anywhere]">
                  <span className="text-navy-deep/70">Or fastest delivery </span>
                  <span suppressHydrationWarning className="font-extrabold text-navy-deep">{deliveryDates.fastestPrefix}, {deliveryDates.fastestFormatted}</span>
                  <span className="text-navy-deep/70">. Order within </span>
                  <span className="max-w-full flex-wrap font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1.5 tabular-nums">
                    <Clock className="h-3 w-3 text-emerald-600 animate-pulse shrink-0" />
                    <span>
                      {countdown.hours} hrs {countdown.minutes} mins {countdown.seconds} secs
                    </span>
                  </span>
                </div>
              </div>

              {/* Delivery Location Reader & Interactive Changer */}
              <div className="pt-1 border-t border-border/30">
                <div className="flex items-start gap-2 text-xs text-navy-deep/90">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>Deliver to <span className="font-bold text-navy-deep">{deliveryLoc.displayText}</span></span>
                      <button
                        type="button"
                        onClick={() => setIsEditingLocation((prev) => !prev)}
                        className="text-primary hover:underline font-bold cursor-pointer text-[11px]"
                      >
                        {isEditingLocation ? "(Close)" : "(Change)"}
                      </button>
                    </div>

                    {/* Zone Badge */}
                    {deliveryLoc.isExpress ? (
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-700">
                        <Zap className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                        <span>Patna Express Zone (Eligible for 15-30 min delivery)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-navy-deep/60">
                        <Truck className="h-3 w-3 text-navy-deep/60" />
                        <span>Standard India-Wide Delivery</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Edit / PIN Code Resolution Box */}
                {isEditingLocation && (
                  <div className="mt-3 p-3.5 bg-slate-50 border border-border/80 rounded-xl space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-navy-deep/70">
                      Enter 6-Digit Indian PIN Code:
                    </div>
                    <form onSubmit={handleApplyPincode} className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={pincodeInput}
                        onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ""))}
                        placeholder="e.g. 800020, 110001, 560001"
                        className="flex-1 h-9 px-3 border border-border/80 rounded-lg text-xs font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={isResolvingLocation}
                        className="px-4 h-9 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/95 transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {isResolvingLocation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                      </button>
                    </form>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50 text-[11px]">
                      <button
                        type="button"
                        onClick={handleDetectGPS}
                        disabled={isResolvingLocation}
                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-semibold cursor-pointer"
                      >
                        <Locate className="h-3.5 w-3.5" />
                        <span>Use my current GPS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new Event("open-address-modal"));
                          setIsEditingLocation(false);
                        }}
                        className="text-navy-deep/60 hover:text-navy-deep font-semibold underline cursor-pointer"
                      >
                        Map Address Picker
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* In Stock / Out of Stock Indicator */}
              <div className="pt-1">
                {isOutOfStock ? (
                  <div className="text-base font-bold text-red-600 flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
                    Currently Out of Stock
                  </div>
                ) : isLowStock ? (
                  <div className="text-sm font-bold text-[#b45309] flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#b45309]" />
                    Only {product.stock} left in stock - order soon.
                  </div>
                ) : (
                  <div className="text-base font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    In Stock
                  </div>
                )}
              </div>

              {/* Quantity Selector Dropdown */}
              {!isOutOfStock && (
                <div className="flex items-center gap-3 pt-1">
                  <label htmlFor="pdp-quantity-select" className="text-xs font-bold text-navy-deep uppercase tracking-wider">
                    Quantity:
                  </label>
                  <div className="relative inline-block w-28">
                    <select
                      id="pdp-quantity-select"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full h-9 pl-3 pr-8 bg-slate-50 hover:bg-slate-100 border border-border/80 rounded-lg text-xs font-bold text-navy-deep appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="h-3.5 w-3.5 text-navy-deep/50 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Stacked Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {isOutOfStock ? (
                  <button
                    disabled
                    type="button"
                    className="w-full bg-slate-200 text-slate-500 h-12 rounded-full font-bold uppercase tracking-wider text-xs flex items-center justify-center cursor-not-allowed border border-slate-300 select-none shadow-none"
                  >
                    Currently Unavailable
                  </button>
                ) : (
                  <>
                    {/* Add to Cart (Solid Purple Theme) */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="w-full bg-primary hover:bg-primary/95 text-white h-12 rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2.5 shadow-md shadow-primary/20 active:scale-[0.98] cursor-pointer"
                    >
                      <ShoppingBag className="h-4 w-4" /> Add to Cart
                    </button>

                    {/* Buy Now (Warm Amber/Gold Accent) */}
                    <button
                      type="button"
                      onClick={handleBuyDirectly}
                      className="w-full bg-accent hover:bg-accent/95 text-white hover:shadow-[0_6px_20px_rgba(246,166,37,0.35)] h-12 rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] cursor-pointer"
                    >
                      <Zap className="h-4 w-4 fill-white" /> Buy Now
                    </button>
                  </>
                )}
              </div>

              {/* Ships From / Sold By Trust Metadata */}
              <div className="border-t border-border/40 pt-3.5 space-y-1 text-xs text-navy-deep/70">
                <div className="grid grid-cols-3 gap-2 py-0.5">
                  <span className="text-navy-deep/50 font-medium">Payment</span>
                  <span className="col-span-2 font-semibold text-navy-deep flex items-center gap-1">
                    <Lock className="h-3 w-3 text-emerald-600" /> Secure transaction
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-0.5">
                  <span className="text-navy-deep/50 font-medium">Ships from</span>
                  <span className="col-span-2 font-semibold text-navy-deep">IESVRA</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-0.5">
                  <span className="text-navy-deep/50 font-medium">Sold by</span>
                  <span className="col-span-2 font-semibold text-primary">IESVRA</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-0.5">
                  <span className="text-navy-deep/50 font-medium">Returns</span>
                  <span className="col-span-2 font-semibold text-navy-deep">{formatProductPolicy(product)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className={`w-full h-10 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 border cursor-pointer ${
                    isWishlisted
                      ? "bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100"
                      : "bg-slate-50 border-border/80 text-navy-deep/80 hover:bg-slate-100 hover:text-navy-deep"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? "fill-rose-600 text-rose-600" : "text-navy-deep/60"}`} />
                  <span>{isWishlisted ? "In Wishlist (Saved)" : "Add to Wishlist"}</span>
                </button>
              </div>
            </div>

            {/* Live Social Proof Viewing Count & Delivery Countdown */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 bg-navy-deep/5 border border-navy-deep/10 rounded-full px-3 py-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                <Users className="h-3 w-3 text-navy-deep/60" />
                <span className="text-[10px] font-semibold text-navy-deep/70">
                  <span className="font-bold text-navy-deep">{pdpShopperCount}</span> people viewing this right now
                </span>
              </div>

              {countdown.isBeforeCutoff && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 tabular-nums">
                  <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
                  <span className="text-[10px] font-semibold text-amber-800">
                    Order in <span className="font-bold font-mono">{countdown.hours}h {countdown.minutes}m {countdown.seconds}s</span> → Next Day Delivery
                  </span>
                </div>
              )}
            </div>

            {/* Description & Product Overview */}
            <div className="w-full min-w-0 max-w-full space-y-3 text-sm text-navy-deep/80 leading-relaxed font-light pt-2">
              <h3 className="font-bold text-navy-deep uppercase tracking-wider text-xs">About this item</h3>
              <p className="w-full min-w-0 max-w-full bg-white/60 p-4 rounded-xl border border-border/40 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{product.description}</p>
            </div>

            {/* Features strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-6 text-[11px] text-muted-foreground">
              <div className="flex items-start sm:items-center gap-2 min-w-0">
                <Shield className="h-4 w-4 text-gold shrink-0 mt-0.5 sm:mt-0" />
                <span className="break-words">100% Safe Payments</span>
              </div>
              <div className="flex items-start sm:items-center gap-2 min-w-0">
                <Truck className="h-4 w-4 text-gold shrink-0 mt-0.5 sm:mt-0" />
                <span className="break-words">Free Delivery above ₹499</span>
              </div>
              <div className="flex items-start sm:items-center gap-2 min-w-0">
                <RefreshCcw className="h-4 w-4 text-gold shrink-0 mt-0.5 sm:mt-0" />
                <span className="break-words whitespace-normal">{formatProductPolicy(product)}</span>
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
                      className="p-4 rounded-xl border border-border/80 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 h-12 bg-primary text-white font-bold uppercase tracking-wider text-xs rounded-full hover:bg-primary/95 transition-all duration-300 shadow-md shadow-primary/10"
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
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 select-none border border-primary/20">
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
