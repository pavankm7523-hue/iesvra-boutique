import { Link, useNavigate } from "@tanstack/react-router";
import logo from "@/assets/ishvara-logo.png";
import { useCartCount } from "@/lib/cart";
import { useCurrentUser, logoutUser } from "@/lib/auth";
import { useState, useMemo, useEffect } from "react";
import { fetchAddressSuggestions, checkExpressEligibility, geocodeAddress } from "@/lib/delivery";
import { useProducts, useCategories } from "@/lib/products";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Truck,
  ShieldCheck,
  Headphones,
  Heart,
  X,
  Settings,
  LogOut,
  ChevronDown,
  MapPin,
  Zap,
  Package,
  Navigation,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

export function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cartCount = useCartCount();
  const { products: allProducts } = useProducts();
  const currentUser = useCurrentUser();
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const categories = useCategories();

  // Header Delivery State
  const [headerAddress, setHeaderAddress] = useState("");
  const [isExpressLocation, setIsExpressLocation] = useState(false);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetecting(true);
    toast.info("Accessing your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en&addressdetails=1`;
          const res = await fetch(url, {
            headers: {
              "User-Agent": "IESVRA-Boutique-App/1.0"
            }
          });
          if (!res.ok) throw new Error("Reverse geocoding failed");
          const data = await res.json();
          
          if (data && data.display_name) {
            await handleAddressSelect(data.display_name);
            toast.success("Location detected successfully!");
          } else {
            toast.error("Could not find address for your coordinates.");
          }
        } catch (err) {
          console.error("Failed to detect location:", err);
          toast.error("Failed to retrieve address details.");
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        toast.error("Permission denied or location unavailable.");
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Sync state with localStorage changes from other pages
  useEffect(() => {
    // Read initial values from localStorage client-side after hydration
    setHeaderAddress(localStorage.getItem("IESVRA_delivery_address") || "");
    setIsExpressLocation(localStorage.getItem("IESVRA_is_express_eligible") === "true");

    const handleSync = () => {
      setHeaderAddress(localStorage.getItem("IESVRA_delivery_address") || "");
      setIsExpressLocation(localStorage.getItem("IESVRA_is_express_eligible") === "true");
    };
    window.addEventListener("iesvra-address-updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("iesvra-address-updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    if (addressSearch.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearchingSuggestions(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const results = await fetchAddressSuggestions(addressSearch);
        setSuggestions(results);
      } catch (err) {
        console.error("Failed to fetch address suggestions:", err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [addressSearch]);

  const handleAddressSelect = async (addr: string) => {
    setHeaderAddress(addr);
    setIsAddressModalOpen(false);
    setAddressSearch("");

    // Geocode and check eligibility in the background
    const res = await checkExpressEligibility(addr);
    setIsExpressLocation(res.eligible);

    localStorage.setItem("IESVRA_delivery_address", addr);
    localStorage.setItem("IESVRA_is_express_eligible", res.eligible ? "true" : "false");

    try {
      const geo = await geocodeAddress(addr);
      if (geo) {
        localStorage.setItem("IESVRA_delivery_address_line1", geo.line1 || addr.split(",")[0] || "");
        localStorage.setItem("IESVRA_delivery_address_line2", geo.line2 || "");
        localStorage.setItem("IESVRA_delivery_city", geo.city || "");
        localStorage.setItem("IESVRA_delivery_state", geo.state || "");
        localStorage.setItem("IESVRA_delivery_pincode", geo.pincode || "");
      }
    } catch (err) {
      console.error("Failed to parse address components in header:", err);
    }

    window.dispatchEvent(new Event("iesvra-address-updated"));
  };

  useEffect(() => {
    const handleOpen = () => setIsAddressModalOpen(true);
    window.addEventListener('open-address-modal', handleOpen);
    return () => window.removeEventListener('open-address-modal', handleOpen);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.categories.some(cat => cat.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [searchQuery, allProducts]);
  const navLinks = [
    { label: "Home", to: "/" },
    { label: "All Categories", to: "/shop" },
    { label: "Best Sellers", to: "/shop" },
    { label: "New Arrivals", to: "/shop" },
    { label: "Offers", to: "/#deals" },
    { label: "Track Order", to: "/track-order" },
    { label: "Contact Us", to: "/contact" },
  ];

  return (
    <header className="w-full z-50 flex flex-col relative select-none font-sans">

      {/* ============== SECTION 1: TOP UTILITY BAR ============== */}
      <div style={{ backgroundColor: "#0b121f" }} className="w-full border-b border-white/5 py-2.5 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Zap className="h-3.5 w-3.5 fill-amber-400" />
              <span>15 Min Delivery in Patna & Nearby Areas</span>
            </div>
            <div className="h-3 w-[1px] bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-slate-400" />
              <span>Free Shipping Above ₹499</span>
            </div>
            <div className="h-3 w-[1px] bg-white/10" />
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              <span>100% Secure Payments</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-slate-400" />
              <span>Download Our App</span>
            </div>
            <div className="flex items-center gap-2">
              <a href="#" className="hover:opacity-80 transition-opacity">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-4.5" />
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-4.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* ======================================================== */}

      {/* Main Header */}
      <div className="bg-white py-4 lg:py-5 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-4 lg:gap-8">
          
          {/* Logo & Delivery Indicator (Left) */}
          <div className="flex items-center gap-4 sm:gap-5 shrink-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-slate-800 hover:text-primary transition cursor-pointer"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex items-center">
              <img
                src={logo}
                alt="IESVRA"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </Link>

            {/* Zepto-style Delivery Indicator */}
            <div className="hidden sm:block border-l border-slate-200 pl-4 lg:pl-5 ml-1 lg:ml-2">
              <button 
                onClick={() => setIsAddressModalOpen(true)}
                className="flex flex-col items-start text-left group cursor-pointer"
              >
                {!headerAddress ? (
                  <div className="flex items-center gap-1.5 text-slate-600 group-hover:text-primary transition-colors">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold whitespace-nowrap">Select delivery address</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-55" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {isExpressLocation ? (
                        <>
                          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-amber-500 whitespace-nowrap tracking-wide">15 minutes</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors whitespace-nowrap tracking-wide">Standard Delivery</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 truncate max-w-[130px] lg:max-w-[180px]" title={headerAddress}>
                        {headerAddress}
                      </span>
                      <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                    </div>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar (Center) */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <form 
              className="relative group"
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate({ to: "/shop", search: { q: searchQuery.trim() } });
                }
              }}
            >
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-11 w-full focus-within:border-primary/50 focus-within:bg-white transition-all shadow-sm">
                
                {/* Category Dropdown */}
                <div className="relative hidden lg:block h-full shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                    className="flex items-center gap-1.5 px-4 text-xs font-bold text-slate-700 bg-slate-100/50 h-full border-r border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <span>All Categories</span>
                    <ChevronDown className={`h-3 w-3 opacity-60 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCategoryMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsCategoryMenuOpen(false)} />
                      <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-2xl border border-border/50 overflow-hidden z-40 py-2 animate-in fade-in slide-in-from-top-1 duration-150 text-left">
                        <Link
                          to="/shop"
                          onClick={() => setIsCategoryMenuOpen(false)}
                          className="block px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors uppercase tracking-wider"
                        >
                          All Categories
                        </Link>
                        <div className="h-[1px] bg-slate-100 my-1" />
                        {categories.map((cat) => (
                          <Link
                            key={cat.name}
                            to="/shop"
                            search={{ category: cat.name }}
                            onClick={() => setIsCategoryMenuOpen(false)}
                            className="block px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors uppercase tracking-wider"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  placeholder="Search for products, brands and more..."
                  className="flex-1 h-full px-4 text-slate-800 text-sm focus:outline-none placeholder:text-slate-400 bg-transparent"
                />
                <button type="submit" className="h-full px-5 bg-primary text-white hover:bg-primary/95 transition-colors flex items-center justify-center cursor-pointer shrink-0">
                  <Search className="h-4 w-4" />
                </button>
              </div>

              {/* Search Recommendations Dropdown */}
              {isSearchFocused && searchResults.length > 0 && (
                <div 
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-[100] border border-border/50 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      to="/product/$id"
                      params={{ id: product.id }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        navigate({ to: "/product/$id", params: { id: product.id } });
                        setIsSearchFocused(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center gap-4 p-3 hover:bg-secondary/10 transition-colors border-b border-border/50 last:border-0"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#f4f2ef] flex items-center justify-center p-1 shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-navy-deep truncate">{product.name}</div>
                        <div className="text-xs text-navy-deep/60 truncate">{product.categories.join(", ")}</div>
                      </div>
                      <div className="text-sm font-bold text-navy-deep shrink-0">
                        ₹{product.price.toFixed(2)}
                      </div>
                    </Link>
                  ))}
                  <Link 
                    to="/shop" 
                    search={{ q: searchQuery.trim() }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      navigate({ to: "/shop", search: { q: searchQuery.trim() } });
                      setIsSearchFocused(false);
                    }}
                    className="block w-full p-4 text-center text-xs font-bold text-primary hover:text-primary/80 hover:bg-secondary/10 uppercase tracking-widest transition-colors bg-white border-t border-slate-100"
                  >
                    View all results for "{searchQuery}"
                  </Link>
                </div>
              )}
            </form>
          </div>

          {/* Actions (Right) */}
          <div className="flex items-center gap-5 sm:gap-6 lg:gap-8 shrink-0 text-slate-700">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-slate-700 hover:text-primary transition cursor-pointer"
            >
              <Search className="h-6 w-6" />
            </button>

            {/* User / Login */}
            {currentUser ? (
              <div className="relative group">
                <button className="flex flex-col items-center gap-1 hover:text-primary transition group/btn cursor-pointer">
                  <User className="h-5 w-5 lg:h-6 lg:w-6 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold hidden sm:block truncate max-w-[75px]">
                    My Account
                  </span>
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-border/50 overflow-hidden z-[200] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-3 border-b border-border/40 bg-secondary/10">
                    <p className="text-xs font-bold text-navy-deep truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-navy-deep/50 truncate">{currentUser.email}</p>
                  </div>
                  <Link
                    to="/my-orders"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-navy-deep hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <Package className="h-4 w-4" /> My Orders
                  </Link>
                  {currentUser.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-3 text-sm text-navy-deep hover:bg-primary/5 hover:text-primary transition-colors border-t border-border/30"
                    >
                      <Settings className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => { logoutUser(); navigate({ to: "/" }); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-border/30 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="flex flex-col items-center gap-1 hover:text-primary transition group">
                <User className="h-5 w-5 lg:h-6 lg:w-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold hidden sm:block">My Account</span>
              </Link>
            )}

            <Link to="/wishlist" className="flex flex-col items-center gap-1 hover:text-primary transition group">
              <Heart className="h-5 w-5 lg:h-6 lg:w-6 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold hidden sm:block">Wishlist</span>
            </Link>

            <Link to="/cart" className="flex flex-col items-center gap-1 hover:text-primary transition group relative">
              <div className="relative">
                <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              </div>
              <span className="text-[10px] font-bold hidden sm:block">Cart</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-white hidden lg:block border-b border-slate-200 shadow-sm py-2">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="relative group">
              <button className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer h-10 select-none">
                <Menu className="h-4 w-4" /> Shop by Categories
              </button>
            </div>
            
            <div className="flex items-center gap-8">
              {navLinks.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-primary transition-colors py-3 relative group"
                >
                  {l.label}
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                </Link>
              ))}
            </div>
          </div>
          
          <a
            href="/mobile-app/index.html"
            className="text-xs font-bold uppercase tracking-wider text-primary hover:opacity-85 transition-opacity flex items-center gap-1.5"
          >
            <Smartphone className="h-4 w-4" /> Download Our App
          </a>
        </div>
      </nav>
      {/* Mobile Menu Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] transition-opacity lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 w-72 bg-navy border-r border-white/10 z-[1000] p-6 flex flex-col gap-6 transform transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link to="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
            <img
              src={logo}
              alt="IESVRA"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white/85 hover:text-gold transition cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Search Bar */}
        <form 
          className="relative mt-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              navigate({ to: "/shop", search: { q: searchQuery.trim() } });
              setIsMobileMenuOpen(false);
            }
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full h-11 bg-white/5 border border-white/10 rounded-full pl-5 pr-12 text-white text-sm focus:outline-none focus:border-gold/50 transition-colors placeholder:text-white/40"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center text-white/60 hover:text-gold transition-colors">
            <Search className="h-4 w-4" />
          </button>
        </form>

        {/* Mobile Navigation Links */}
        <nav className="flex flex-col gap-4 mt-4">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold tracking-wide text-white/80 hover:text-gold transition-colors py-2 border-b border-white/5 last:border-0"
            >
              {l.label}
            </Link>
          ))}
          <a
            href="/mobile-app/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-semibold tracking-wide text-white/80 hover:text-gold transition-colors py-2 border-b border-white/5 last:border-0"
          >
            Mobile App
          </a>
        </nav>
      </div>

      {/* Address Selection Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={() => setIsAddressModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border/40 flex items-center justify-between bg-[#f8f9fb]">
              <h3 className="font-bold text-navy-deep flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-gold" /> Select your location
              </h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center text-navy-deep/60 hover:text-navy-deep hover:bg-secondary transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4 bg-white min-h-[300px]">
              <div className="relative">
                <input
                  type="text"
                  value={addressSearch}
                  onChange={(e) => {
                    setAddressSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search area, street, landmark..."
                  className="w-full h-12 pl-10 pr-4 bg-[#f8f9fb] border border-transparent rounded-xl focus:ring-2 focus:ring-gold/30 focus:border-gold/50 outline-none text-sm transition-all text-navy-deep font-medium placeholder:text-navy-deep/40"
                  autoFocus
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-deep/40" />
              </div>

              <button
                type="button"
                onClick={detectLocation}
                disabled={isDetecting}
                className="w-full h-11 bg-navy-deep hover:bg-navy-deep/90 disabled:bg-navy-deep/60 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm select-none"
              >
                <Navigation className={`h-4 w-4 text-gold ${isDetecting ? "animate-spin" : ""}`} />
                {isDetecting ? "Detecting Location..." : "Auto-Detect My Location"}
              </button>
              
              {showSuggestions && (
                <div className="space-y-1 mt-4 max-h-[300px] overflow-y-auto">
                  {isSearchingSuggestions && (
                    <div className="py-4 text-center text-xs text-navy-deep/50 font-medium">
                      Searching addresses...
                    </div>
                  )}
                  
                  {!isSearchingSuggestions && suggestions.map((addr, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAddressSelect(addr)}
                      className="w-full text-left p-3 hover:bg-[#f8f9fb] rounded-xl text-sm text-navy-deep/80 flex items-start gap-3 transition-colors border border-transparent hover:border-border/50 cursor-pointer"
                    >
                      <MapPin className="h-4 w-4 text-navy-deep/30 shrink-0 mt-0.5" />
                      <span>{addr}</span>
                    </button>
                  ))}
                  
                  {!isSearchingSuggestions && addressSearch.trim().length >= 3 && (
                    <button
                      type="button"
                      onClick={() => handleAddressSelect(addressSearch)}
                      className="w-full text-left p-3 hover:bg-[#f8f9fb] rounded-xl text-sm text-[#0b72e7] font-medium flex items-center gap-2 cursor-pointer border-t border-border/30 mt-1"
                    >
                      Use "{addressSearch}"
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
