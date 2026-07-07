import { Link, useNavigate } from "@tanstack/react-router";
import logo from "@/assets/ishvara-logo.png";
import { useCartCount } from "@/lib/cart";
import { useCurrentUser, logoutUser } from "@/lib/auth";
import { useState, useMemo, useEffect } from "react";
import { useProducts } from "@/lib/products";
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
} from "lucide-react";

export function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cartCount = useCartCount();
  const { products: allProducts } = useProducts();
  const currentUser = useCurrentUser();

  // Header Delivery State
  const [headerAddress, setHeaderAddress] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const isExpressLocation = useMemo(() => {
    if (!headerAddress) return false;
    const lower = headerAddress.toLowerCase();
    return lower.includes("patna") || lower.includes("800020");
  }, [headerAddress]);

  const mockAddresses = [
    "R.N Singh Road, Kankarbagh Main Road, Patna, Bihar 800020",
    "Boring Road, Patna, Bihar 800001",
    "Frazer Road, Patna, Bihar 800001",
    "Andheri West, Mumbai, Maharashtra 400053",
    "Indiranagar, Bangalore, Karnataka 560038"
  ];

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
    <header className="w-full z-50 flex flex-col relative">

      {/* Main Header */}
      <div className="bg-navy py-4 lg:py-5 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-4 lg:gap-8">
          
          {/* Logo & Delivery Indicator (Left) */}
          <div className="flex items-center gap-4 sm:gap-5 shrink-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-white/80 hover:text-gold transition cursor-pointer"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex items-center gap-3">
              <img
                src={logo}
                alt="IESVRA"
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
              />
              <div className="hidden sm:flex flex-col">
                <span className="font-display text-2xl lg:text-3xl font-bold tracking-[0.1em] text-white leading-none">
                  IESVRA
                </span>
              </div>
            </Link>

            {/* Zepto-style Delivery Indicator */}
            <div className="hidden sm:block border-l border-white/10 pl-4 lg:pl-5 ml-1 lg:ml-2">
              <button 
                onClick={() => setIsAddressModalOpen(true)}
                className="flex flex-col items-start text-left group cursor-pointer"
              >
                {!headerAddress ? (
                  <div className="flex items-center gap-1.5 text-white/70 group-hover:text-gold transition-colors">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs font-bold whitespace-nowrap">Select delivery address</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {isExpressLocation ? (
                        <>
                          <Zap className="h-3.5 w-3.5 text-gold fill-gold" />
                          <span className="text-xs font-bold text-gold whitespace-nowrap tracking-wide">15 minutes</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-white group-hover:text-gold transition-colors whitespace-nowrap tracking-wide">Standard Delivery</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-white/60 truncate max-w-[130px] lg:max-w-[180px]" title={headerAddress}>
                        {headerAddress}
                      </span>
                      <ChevronDown className="h-3 w-3 text-white/40 group-hover:text-white/80 transition-colors shrink-0" />
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
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Search for products..."
                className="w-full h-11 bg-white/5 border border-white/10 rounded-full pl-5 pr-12 text-white text-sm focus:outline-none focus:border-gold/50 focus:bg-white/10 transition-all placeholder:text-white/40"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center text-white/60 hover:text-gold hover:bg-white/5 transition-colors">
                <Search className="h-4 w-4" />
              </button>

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
                    className="block w-full p-4 text-center text-xs font-bold text-gold hover:text-navy-deep hover:bg-secondary/10 uppercase tracking-widest transition-colors bg-white"
                  >
                    View all results for "{searchQuery}"
                  </Link>
                </div>
              )}
            </form>
          </div>

          {/* Actions (Right) */}
          <div className="flex items-center gap-5 sm:gap-6 lg:gap-8 shrink-0 text-white/80">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-white/80 hover:text-gold transition cursor-pointer"
            >
              <Search className="h-6 w-6" />
            </button>

            {/* User / Login */}
            {currentUser ? (
              <div className="relative group">
                <button className="flex flex-col items-center gap-1 hover:text-gold transition group/btn cursor-pointer">
                  <User className="h-5 w-5 lg:h-6 lg:w-6 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[10px] font-medium hidden sm:block truncate max-w-[60px]">
                    {currentUser.name.split(" ")[0]}
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
                    className="flex items-center gap-2 px-4 py-3 text-sm text-navy-deep hover:bg-gold/5 hover:text-gold transition-colors"
                  >
                    <Package className="h-4 w-4" /> My Orders
                  </Link>
                  {currentUser.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-3 text-sm text-navy-deep hover:bg-gold/5 hover:text-gold transition-colors border-t border-border/30"
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
              <Link to="/login" className="flex flex-col items-center gap-1 hover:text-gold transition group">
                <User className="h-5 w-5 lg:h-6 lg:w-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium hidden sm:block">Login</span>
              </Link>
            )}

            <Link to="/wishlist" className="flex flex-col items-center gap-1 hover:text-gold transition group">
              <Heart className="h-5 w-5 lg:h-6 lg:w-6 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium hidden sm:block">Wishlist</span>
            </Link>

            <Link to="/cart" className="flex flex-col items-center gap-1 hover:text-gold transition group relative">
              <div className="relative">
                <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-gold text-[10px] text-navy-deep flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              </div>
              <span className="text-[10px] font-medium hidden sm:block">Cart</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-navy-deep hidden lg:block border-b border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-center gap-10">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-xs font-semibold tracking-wide text-white/80 hover:text-gold transition-colors relative py-3.5 group"
            >
              {l.label}
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gold scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </Link>
          ))}
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
          <Link to="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
            <img
              src={logo}
              alt="IESVRA"
              className="h-10 w-10 object-contain"
            />
            <span className="font-display text-xl font-bold tracking-[0.1em] text-white">
              IESVRA
            </span>
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
              
              {showSuggestions && (
                <div className="space-y-1 mt-4">
                  {mockAddresses
                    .filter(a => a.toLowerCase().includes(addressSearch.toLowerCase()))
                    .map((addr, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setHeaderAddress(addr);
                          setIsAddressModalOpen(false);
                          setAddressSearch("");
                        }}
                        className="w-full text-left p-3 hover:bg-[#f8f9fb] rounded-xl text-sm text-navy-deep/80 flex items-start gap-3 transition-colors border border-transparent hover:border-border/50 cursor-pointer"
                      >
                        <MapPin className="h-4 w-4 text-navy-deep/30 shrink-0 mt-0.5" />
                        <span>{addr}</span>
                      </button>
                    ))}
                    
                    {addressSearch && mockAddresses.filter(a => a.toLowerCase().includes(addressSearch.toLowerCase())).length === 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setHeaderAddress(addressSearch);
                          setIsAddressModalOpen(false);
                          setAddressSearch("");
                        }}
                        className="w-full text-left p-3 hover:bg-[#f8f9fb] rounded-xl text-sm text-[#0b72e7] font-medium flex items-center gap-2 cursor-pointer"
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
