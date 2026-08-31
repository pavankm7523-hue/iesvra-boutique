import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Trash2, ArrowRight, X, CreditCard, CheckCircle, MapPin, Zap, Truck, Navigation, Locate, Tag, Pencil } from "lucide-react";
import { useCartItems, removeFromCart, updateCartQuantity } from "@/lib/cart";
import { AddressPicker } from "@/components/AddressPicker";
import { PasswordInput } from "@/components/PasswordInput";
import { useCurrentUser } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { toast } from "sonner";
import { fetchAddressSuggestions, checkExpressEligibility, geocodeAddress, reverseGeocode } from "@/lib/delivery";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping Cart & Secure Checkout | IESVRA Boutique" },
      {
        name: "description",
        content: "Review your selected items, apply discount coupons, and complete your secure checkout at IESVRA Boutique.",
      },
      { property: "og:title", content: "Shopping Cart & Secure Checkout | IESVRA Boutique" },
    ],
  }),
  component: Cart,
});

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

function Cart() {
  const cartItems = useCartItems();
  const currentUser = useCurrentUser();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shippingName, setShippingName] = useState("");
  const [shippingEmail, setShippingEmail] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [paymentMode, setPaymentMode] = useState<'razorpay' | 'cod'>('razorpay');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Map Pinpoint States
  const [pinnedLat, setPinnedLat] = useState<number | null>(null);
  const [pinnedLng, setPinnedLng] = useState<number | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapInitialized = useRef(false);
  
  // Quick-Commerce Checkout States
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [isAddressPickerOpen, setIsAddressPickerOpen] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [deliverySpeed, setDeliverySpeed] = useState<'express' | 'standard'>('standard');
  const [isExpressAvailable, setIsExpressAvailable] = useState(false);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);
  const [showExpressPopup, setShowExpressPopup] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Structured address states
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await reverseGeocode(latitude, longitude);
          
          if (res) {
            setAddressLine1(res.line1 || "");
            setAddressLine2(res.line2 || "");
            setCity(res.city || "");
            
            const foundState = INDIAN_STATES.find(
              s => s.toLowerCase() === res.state?.toLowerCase() || res.state?.toLowerCase().includes(s.toLowerCase())
            );
            setState(foundState || "");
            setPincode(res.pincode || "");
            
            // Build temporary search query/address string
            const formatted = [res.line1, res.line2, res.city, `${res.state} - ${res.pincode}`].filter(Boolean).join(", ");
            setAddressSearch(formatted);
            toast.success("Location retrieved and form pre-filled successfully!");
          } else {
            toast.error("Failed to retrieve location details. Please search your address manually.");
          }
        } catch (err) {
          console.error(err);
          toast.error("Error reverse-geocoding your coordinates. Please try again.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        console.error(error);
        toast.error("Failed to access your location. Please check browser permissions or search manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const [addressTag, setAddressTag] = useState<string>("Home");
  const [addressFlat, setAddressFlat] = useState("");
  const [addressFloor, setAddressFloor] = useState("");
  const [addressLocality, setAddressLocality] = useState("");
  const [addressLandmark, setAddressLandmark] = useState("");
  const [rzpKey, setRzpKey] = useState("");

  // Sync state with localStorage changes
  useEffect(() => {
    const handleSync = () => {
      const sName = localStorage.getItem("IESVRA_shipping_name") || "";
      const sEmail = localStorage.getItem("IESVRA_shipping_email") || "";
      const sPhone = localStorage.getItem("IESVRA_shipping_phone") || "";
      const sFlat = localStorage.getItem("IESVRA_delivery_address_flat") || "";
      const sFloor = localStorage.getItem("IESVRA_delivery_address_floor") || "";
      const sLocality = localStorage.getItem("IESVRA_delivery_address_locality") || "";
      const sLandmark = localStorage.getItem("IESVRA_delivery_address_landmark") || "";
      const sTag = localStorage.getItem("IESVRA_delivery_address_tag") || "Home";
      const sLine1 = localStorage.getItem("IESVRA_delivery_address_line1") || "";
      const sLine2 = localStorage.getItem("IESVRA_delivery_address_line2") || "";
      const sCity = localStorage.getItem("IESVRA_delivery_city") || "";
      const sState = localStorage.getItem("IESVRA_delivery_state") || "";
      const sPincode = localStorage.getItem("IESVRA_delivery_pincode") || "";
      const sFull = localStorage.getItem("IESVRA_delivery_address") || "";
      const sLat = localStorage.getItem("IESVRA_delivery_address_lat");
      const sLng = localStorage.getItem("IESVRA_delivery_address_lng");

      setShippingName(sName);
      setShippingEmail(sEmail || (currentUser ? currentUser.email : ""));
      setShippingPhone(sPhone);
      setAddressFlat(sFlat);
      setAddressFloor(sFloor);
      setAddressLocality(sLocality);
      setAddressLandmark(sLandmark);
      setAddressTag(sTag);
      setAddressLine1(sLine1 || sFlat);
      setAddressLine2(sLine2 || [sLocality, sLandmark].filter(Boolean).join(", "));
      setCity(sCity);
      setState(sState);
      setPincode(sPincode);
      if (sLat && sLng) {
        setPinnedLat(parseFloat(sLat));
        setPinnedLng(parseFloat(sLng));
      }

      const formatted = sFull || [sFlat || sLine1, sFloor, sLocality, sLandmark || sLine2, sCity, sState && sPincode ? `${sState} - ${sPincode}` : (sState || sPincode)].filter(Boolean).join(", ");
      setShippingAddress(formatted);

      const isExpress = localStorage.getItem("IESVRA_is_express_eligible") === "true";
      setIsExpressAvailable(isExpress);
      setDeliverySpeed(isExpress ? "express" : "standard");
    };
    handleSync(); // Initial load
    window.addEventListener("iesvra-address-updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("iesvra-address-updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [currentUser]);

  // When checkout opens, if address is not set yet, automatically prompt the Address Modal
  useEffect(() => {
    if (isCheckoutOpen) {
      const sFlat = localStorage.getItem("IESVRA_delivery_address_flat") || "";
      const sLocality = localStorage.getItem("IESVRA_delivery_address_locality") || "";
      const sLine1 = localStorage.getItem("IESVRA_delivery_address_line1") || "";
      if (!sFlat && !sLocality && !sLine1) {
        setIsAddressPickerOpen(true);
      }
    }
  }, [isCheckoutOpen]);

  // Debounced search for suggestions based on autocomplete search bar
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

  // Debounced verification of express eligibility based on structured form inputs
  useEffect(() => {
    const combined = [addressLine1, city, state, pincode].filter(Boolean).join(", ");
    if (combined.length < 10) {
      setIsExpressAvailable(false);
      setDeliverySpeed('standard');
      return;
    }

    setIsCheckingDelivery(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await checkExpressEligibility(combined);
        setIsExpressAvailable(res.eligible);
        if (!res.eligible) {
          setDeliverySpeed('standard');
        } else {
          setDeliverySpeed('express');
        }
        setVerificationError(res.error);
      } catch (err) {
        setVerificationError("We couldn't verify this address for express delivery, standard delivery available");
        setIsExpressAvailable(false);
        setDeliverySpeed('standard');
      } finally {
        setIsCheckingDelivery(false);
      }
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [addressLine1, city, state, pincode]);
  
  // Mock Razorpay Fallback States
  const [isMockRazorpayOpen, setIsMockRazorpayOpen] = useState(false);
  const [mockPaymentMethod, setMockPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [isMockPaying, setIsMockPaying] = useState(false);


  useEffect(() => {
    if (currentUser) {
      setShippingName(prev => prev || currentUser.name || "");
      setShippingEmail(prev => prev || currentUser.email || "");
    }
  }, [currentUser]);



  // Direct checkout URL query param handler
  useEffect(() => {
    if (typeof window === "undefined" || cartItems.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const checkoutParam = params.get("checkout") || params.get("buyNow");
    if (checkoutParam === "true") {
      // Clear search parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Validate pre-filled shipping information
      const isValid = 
        shippingName.trim() &&
        shippingEmail.trim() &&
        shippingPhone.trim() &&
        addressLine1.trim() &&
        city.trim() &&
        state.trim() &&
        /^\d{6}$/.test(pincode.trim());

      if (isValid) {
        toast.info("Launching Razorpay Payment Gateway...");
        const mockEvent = { preventDefault: () => {} } as React.FormEvent;
        handlePlaceOrder(mockEvent);
      } else {
        toast.info("Please fill in your delivery details to complete checkout.");
      }
    }
  }, [cartItems, shippingName, shippingEmail, shippingPhone, addressLine1, city, state, pincode]);

  // Plus Membership state for coupon validation
  const [isPlusMember, setIsPlusMember] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("iesvra_plus_member") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (currentUser?.email) {
      fetch(`/api/plus-membership?email=${encodeURIComponent(currentUser.email)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.isMember) {
            localStorage.setItem("iesvra_plus_member", "true");
            setIsPlusMember(true);
          } else if (data.isMember === false) {
            localStorage.removeItem("iesvra_plus_member");
            setIsPlusMember(false);
          }
        })
        .catch(() => {});
    }
  }, [currentUser?.email]);

  // Coupon Code States
  const [couponCodeInput, setCouponCodeInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("IESVRA_applied_coupon") || "";
  });
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("IESVRA_applied_coupon") || null;
  });
  const [couponError, setCouponError] = useState<string | null>(null);

  // Sync coupon with localStorage changes
  useEffect(() => {
    const handleCouponSync = () => {
      const savedCode = localStorage.getItem("IESVRA_applied_coupon");
      if (savedCode) {
        setAppliedCouponCode(savedCode);
        setCouponCodeInput(savedCode);
      }
    };
    window.addEventListener("iesvra-coupon-updated", handleCouponSync);
    window.addEventListener("storage", handleCouponSync);
    return () => {
      window.removeEventListener("iesvra-coupon-updated", handleCouponSync);
      window.removeEventListener("storage", handleCouponSync);
    };
  }, []);

  // First-order eligibility check for new customers
  const [userOrderCount, setUserOrderCount] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser?.email) {
      import("@/lib/orders").then(({ getOrders }) => {
        getOrders().then((allOrders) => {
          const userOrders = allOrders.filter(
            (o) => o.customerEmail?.toLowerCase() === currentUser.email?.toLowerCase() && o.status !== "Cancelled"
          );
          setUserOrderCount(userOrders.length);
        }).catch(() => setUserOrderCount(0));
      });
    } else {
      const savedCount = localStorage.getItem("IESVRA_completed_orders_count");
      setUserOrderCount(savedCount ? parseInt(savedCount, 10) : 0);
    }
  }, [currentUser?.email]);

  // Configurable Festival Sale window for FESTIVE10
  const FESTIVAL_CONFIG = {
    active: false, // Set to true by admin during an active festival sale
    name: "Festival Sale",
    startDate: "2026-10-01",
    endDate: "2026-11-15",
  };

  const isFestivalActive = () => {
    if (!FESTIVAL_CONFIG.active) return false;
    const now = new Date();
    const start = new Date(FESTIVAL_CONFIG.startDate);
    const end = new Date(FESTIVAL_CONFIG.endDate);
    return now >= start && now <= end;
  };

  const physicalItems = cartItems.filter(item => item.id !== "iesvra-plus-membership" && !item.isDigital);
  const physicalSubtotal = physicalItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const hasPhysical = physicalItems.length > 0;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const totalGst = cartItems.reduce((acc, item) => {
    const rate = item.gstRate !== undefined ? item.gstRate : 18;
    const itemTotal = item.price * item.quantity;
    const itemGst = itemTotal - (itemTotal / (1 + rate / 100));
    return acc + itemGst;
  }, 0);

  // Automatic Plus Member Discount (₹100 OFF applied unconditionally for members)
  const PLUS_MEMBER_DISCOUNT = 100;
  const plusDiscount = isPlusMember ? Math.min(subtotal, PLUS_MEMBER_DISCOUNT) : 0;

  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: 499,
    baseShipping: 59,
    codCharge: 40,
  });

  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem("IESVRA_shipping_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setShippingSettings({
          freeShippingThreshold: Number(parsed.freeShippingThreshold) || 499,
          baseShipping: Number(parsed.baseShipping) || 59,
          codCharge: Number(parsed.codCharge) || 40,
        });
      }
    };
    loadSettings();
    window.addEventListener("IESVRA_settings_changed", loadSettings);
    return () => window.removeEventListener("IESVRA_settings_changed", loadSettings);
  }, []);

  const FREE_SHIPPING_THRESHOLD = shippingSettings.freeShippingThreshold;
  // IESVRA Plus Members get 100% FREE SHIPPING on EVERY order unconditionally!
  const baseShipping = hasPhysical 
    ? (isPlusMember ? 0 : (physicalSubtotal < FREE_SHIPPING_THRESHOLD ? shippingSettings.baseShipping : 0))
    : 0;

  // Stackable Coupon Rules Definition
  const VALID_COUPONS: Record<string, {
    code: string;
    title: string;
    requiresFirstOrder?: boolean;
    requiresFestival?: boolean;
    getDiscount: (sub: number, baseShip: number) => { discount: number; isFreeShipping?: boolean; description: string };
  }> = {
    FIRST15: {
      code: "FIRST15",
      title: "15% OFF (1st Order)",
      requiresFirstOrder: true,
      getDiscount: (sub) => ({
        discount: Math.round(sub * 0.15),
        description: "Flat 15% OFF applied on your 1st order!",
      }),
    },
    WELCOME10: {
      code: "WELCOME10",
      title: "10% OFF (1st Order)",
      requiresFirstOrder: true,
      getDiscount: (sub) => ({
        discount: Math.round(sub * 0.10),
        description: "10% OFF new customer welcome discount applied!",
      }),
    },
    FREESHIP: {
      code: "FREESHIP",
      title: "Free Shipping",
      getDiscount: (_, baseShip) => ({
        discount: baseShip,
        isFreeShipping: true,
        description: "Free shipping applied! Delivery fee waived.",
      }),
    },
    FESTIVE10: {
      code: "FESTIVE10",
      title: "Festive Save 10%",
      requiresFestival: true,
      getDiscount: (sub) => ({
        discount: Math.min(250, Math.round(sub * 0.10)),
        description: "Festive 10% instant discount applied!",
      }),
    },
  };

  let couponDiscount = 0;
  let isCouponFreeShipping = false;
  let activeCouponInfo: { code: string; title: string; description: string } | null = null;

  if (appliedCouponCode) {
    const normalized = appliedCouponCode.trim().toUpperCase();
    if (normalized === "IESVRAPLUS") {
      // Handled automatically as plusDiscount, ignore if stored as a promo code
    } else {
      const config = VALID_COUPONS[normalized];
      if (config) {
        if (config.requiresFestival && !isFestivalActive()) {
          couponDiscount = 0;
          activeCouponInfo = null;
        } else if (config.requiresFirstOrder && userOrderCount !== null && userOrderCount > 0) {
          couponDiscount = 0;
          activeCouponInfo = null;
        } else {
          const res = config.getDiscount(subtotal, baseShipping);
          couponDiscount = res.discount;
          if (res.isFreeShipping) isCouponFreeShipping = true;
          activeCouponInfo = {
            code: config.code,
            title: config.title,
            description: res.description,
          };
        }
      }
    }
  }

  const baseDeliveryFee = isCouponFreeShipping ? 0 : baseShipping;
  const deliveryFee = paymentMode === 'cod' ? baseDeliveryFee + shippingSettings.codCharge : baseDeliveryFee;
  const total = Math.max(0, subtotal + deliveryFee - plusDiscount - couponDiscount);

  const handleApplyCoupon = (codeToApply?: string) => {
    const targetCode = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!targetCode) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    if (targetCode === "IESVRAPLUS") {
      if (isPlusMember) {
        toast.info("Your IESVRA Plus ₹100 member discount and FREE shipping are already applied automatically!");
        setCouponError("Plus benefits are already automatically applied!");
        return;
      } else {
        const errorMsg = "This discount is exclusive to IESVRA Plus members — Join Plus to unlock automatic member discounts!";
        setCouponError(errorMsg);
        toast.error(errorMsg);
        return;
      }
    }

    if (targetCode === "FESTIVE10" && !isFestivalActive()) {
      const msg = "FESTIVE10 is currently inactive. It is only available during active festival sales.";
      setCouponError(msg);
      toast.error(msg);
      return;
    }

    if ((targetCode === "FIRST15" || targetCode === "FIRST10" || targetCode === "WELCOME10") && userOrderCount !== null && userOrderCount > 0) {
      const msg = "First-order discounts are exclusive to new customers on their very 1st order.";
      setCouponError(msg);
      toast.error(msg);
      return;
    }

    const config = VALID_COUPONS[targetCode];
    if (!config) {
      setCouponError(`Invalid coupon code "${targetCode}". Try FIRST15, WELCOME10, or FREESHIP.`);
      toast.error(`Invalid coupon code "${targetCode}"`);
      return;
    }

    setCouponError(null);
    setAppliedCouponCode(targetCode);
    setCouponCodeInput(targetCode);
    localStorage.setItem("IESVRA_applied_coupon", targetCode);
    window.dispatchEvent(new Event("iesvra-coupon-updated"));
    toast.success(`Coupon "${targetCode}" applied on top of your Plus savings! 🎉`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponCode(null);
    setCouponCodeInput("");
    setCouponError(null);
    localStorage.removeItem("IESVRA_applied_coupon");
    window.dispatchEvent(new Event("iesvra-coupon-updated"));
    toast.info("Coupon removed.");
  };

  const handleAddressSelect = async (addr: string) => {
    setShowSuggestions(false);
    setIsCheckingDelivery(true);
    setVerificationError(null);
    
    try {
      const res = await geocodeAddress(addr);
      setIsCheckingDelivery(false);
      
      if (res) {
        setAddressLine1(res.line1 || addr.split(",")[0] || "");
        setAddressLine2(res.line2 || "");
        setCity(res.city || "");
        
        const foundState = INDIAN_STATES.find(
          s => s.toLowerCase() === res.state?.toLowerCase() || res.state?.toLowerCase().includes(s.toLowerCase())
        );
        setState(foundState || "");
        setPincode(res.pincode || "");
      } else {
        setAddressSearch(addr);
        setAddressLine1(addr.split(",")[0] || "");
      }
    } catch (err) {
      setIsCheckingDelivery(false);
      console.error("Failed to geocode address suggestion:", err);
    }
  };

  const handleEditAddress = () => {
    setIsAddressConfirmed(false);
    setVerificationError(null);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const sFlat = addressFlat || localStorage.getItem("IESVRA_delivery_address_flat") || addressLine1;
    const sLocality = addressLocality || localStorage.getItem("IESVRA_delivery_address_locality") || city;
    const sName = shippingName.trim() || localStorage.getItem("IESVRA_shipping_name") || "";
    const sPhone = shippingPhone.trim().replace(/\D/g, "") || (localStorage.getItem("IESVRA_shipping_phone") || "").replace(/\D/g, "");
    const combinedAddress = shippingAddress || [sFlat, addressFloor, sLocality, addressLandmark, city, state && pincode ? `${state} - ${pincode}` : (state || pincode)].filter(Boolean).join(", ");

    if (!sFlat && !sLocality && !shippingAddress) {
      toast.error("Please add your delivery address to proceed.");
      setIsAddressPickerOpen(true);
      return;
    }

    if (!sName) {
      toast.error("Please enter your name in the delivery address.");
      setIsAddressPickerOpen(true);
      return;
    }

    if (!sPhone || sPhone.length !== 10) {
      toast.error("Please provide a valid 10-digit mobile number in the delivery address.");
      setIsAddressPickerOpen(true);
      return;
    }

    localStorage.setItem("IESVRA_shipping_name", sName);
    localStorage.setItem("IESVRA_shipping_phone", sPhone);
    localStorage.setItem("IESVRA_delivery_address", combinedAddress);

    if (paymentMode === "cod") {
      try {
        const order = await createOrder(
          sName,
          shippingEmail.trim() || `${sPhone}@customer.iesvra.com`,
          sPhone,
          combinedAddress,
          cartItems,
          subtotal,
          deliveryFee,
          total,
          "Pending - COD",
          pinnedLat,
          pinnedLng
        );
        setPlacedOrder(order);
        toast.success("Order placed successfully via Cash on Delivery!");
      } catch (err: any) {
        console.error("COD checkout error:", err);
        toast.error(err?.message || "Failed to place order. Please try again.");
      }
      return;
    }

    // Razorpay Online Payment Flow
    setIsProcessingPayment(true);

    try {
      // 1. Call /api/create-order with cart total in paise
      const createRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.round(total * 100) }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.order_id) {
        throw new Error(createData.error || "Failed to initialize Razorpay payment. Please try again.");
      }

      const { order_id, key_id } = createData;

      // 2. Load Razorpay checkout script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay payment gateway SDK failed to load. Please check your internet connection.");
      }

      // 3. Open Razorpay payment popup
      const options = {
        key: key_id,
        amount: Math.round(total * 100),
        currency: "INR",
        name: "IESVRA",
        description: "Payment for your order",
        order_id: order_id,
        handler: async function (response: any) {
          try {
            // 4. Verify payment via /api/verify-payment
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            // Create order with status Paid
            const order = await createOrder(
              sName,
              shippingEmail.trim() || `${sPhone}@customer.iesvra.com`,
              sPhone,
              combinedAddress,
              cartItems,
              subtotal,
              deliveryFee,
              total,
              "Paid",
              pinnedLat,
              pinnedLng
            );

            setPlacedOrder(order);
            toast.success(`Payment verified and order placed successfully! Order ID: ${order.id}`);
          } catch (verifyErr: any) {
            console.error("Verification error:", verifyErr);
            toast.error(verifyErr.message || "Payment succeeded but signature verification failed.");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: sName,
          email: shippingEmail.trim() || undefined,
          contact: sPhone,
        },
        notes: {
          address: combinedAddress,
        },
        theme: {
          color: "#D4AF37", // theme color Gold
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            toast.info("Payment cancelled.");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay placement error:", err);
      toast.error(err?.message || "Payment gateway error. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen pb-16">
      <div className="bg-navy-deep py-16 md:py-20 px-4 border-b border-border/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6 text-white text-center md:text-left">
          <ShoppingCart className="h-8 w-8 text-gold" />
          <h1 className="font-display text-4xl md:text-5xl tracking-tight">Your <span className="italic font-light text-gold">Shopping Cart</span></h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        {cartItems.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl shadow-navy-deep/5 border border-border/50 overflow-hidden">
                <div className="hidden sm:grid grid-cols-6 gap-4 p-5 border-b border-border/50 text-xs font-bold tracking-widest uppercase text-navy-deep/60 bg-cream">
                  <div className="col-span-3">Product Details</div>
                  <div className="col-span-1 text-center">Price</div>
                  <div className="col-span-1 text-center">Quantity</div>
                  <div className="col-span-1 text-right">Total</div>
                </div>

                <div className="divide-y divide-border">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.id}-${item.color}`}
                      className="p-4 sm:grid sm:grid-cols-6 gap-4 items-center flex flex-col"
                    >
                      <div className="col-span-3 flex items-center gap-4 w-full">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-20 w-20 object-cover rounded-md bg-secondary"
                        />
                        <div>
                          <h3 className="font-medium text-sm text-navy-deep line-clamp-2">
                            {item.name}
                          </h3>
                          {item.color && item.color !== "Standard" && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                              Color: <span className="font-medium text-foreground">{item.color}</span>
                            </div>
                          )}
                          {(item.id === "iesvra-plus-membership" || item.isDigital) && (
                            <div className="mt-1.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                Digital Membership – No shipping required
                              </span>
                            </div>
                          )}
                          <button
                            onClick={() => removeFromCart(item.id, item.color)}
                            className="text-xs text-red-500 hover:text-red-700 mt-2 flex items-center gap-1 transition"
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </button>
                        </div>
                      </div>
                      <div className="col-span-1 text-center font-semibold text-navy-deep text-base w-full sm:w-auto mt-4 sm:mt-0">
                        <span className="sm:hidden text-navy-deep/60 text-xs uppercase tracking-wider mr-2">Price:</span>
                        ₹{item.price.toLocaleString()}
                      </div>
                      <div className="col-span-1 flex justify-center w-full sm:w-auto mt-4 sm:mt-0">
                        <div className="flex items-center border border-border/50 rounded-full bg-white h-10">
                          <button
                            onClick={() =>
                              updateCartQuantity(item.id, item.color, item.quantity - 1)
                            }
                            className="px-2 py-1 text-muted-foreground hover:bg-secondary transition"
                          >
                            -
                          </button>
                          <span className="px-2 py-1 text-sm min-w-[1.5rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(item.id, item.color, item.quantity + 1)
                            }
                            className="px-2 py-1 text-muted-foreground hover:bg-secondary transition"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="col-span-1 text-right font-bold text-navy-deep text-base w-full sm:w-auto mt-4 sm:mt-0">
                        <span className="sm:hidden text-navy-deep/60 text-xs uppercase tracking-wider mr-2">Total:</span>
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl shadow-navy-deep/5 border border-border/50 p-8 sticky top-28">
                <h2 className="font-display text-2xl font-semibold text-navy-deep mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 text-sm mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">
                      ₹{subtotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Automatic IESVRA Plus Member Discount */}
                  {isPlusMember && plusDiscount > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 rounded-xl p-3 flex items-center justify-between my-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          PLUS MEMBER
                        </span>
                        <span className="text-xs font-bold text-purple-900">
                          Automatic Member Savings
                        </span>
                      </div>
                      <span className="font-bold text-purple-700 text-sm">
                        - ₹{plusDiscount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {!isPlusMember && (
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-900">
                      👑 Join <strong className="font-bold">IESVRA Plus</strong> (₹299/yr) for automatic <strong className="font-bold">₹100 OFF</strong> on every order!
                    </div>
                  )}

                  {hasPhysical && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>
                        Shipping {paymentMode === 'cod' && '(includes COD charge)'}
                        {baseShipping > 0 && !isCouponFreeShipping && (
                          <span className="block text-[10px] font-medium text-blue-500 mt-0.5">
                            Add ₹{Math.max(0, FREE_SHIPPING_THRESHOLD - physicalSubtotal)} more for free delivery
                          </span>
                        )}
                      </span>
                      <span className="font-medium text-foreground">
                        {deliveryFee === 0 ? (
                          <span className="text-green-600 font-bold">Free</span>
                        ) : (
                          `₹${deliveryFee}`
                        )}
                      </span>
                    </div>
                  )}

                  {/* Stacked Coupon Applied Discount Row */}
                  {couponDiscount > 0 && activeCouponInfo && (
                    <div className="flex justify-between text-emerald-600 font-semibold pt-1">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" /> Coupon ({activeCouponInfo.code})
                      </span>
                      <span>- ₹{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Coupon Application Block */}
                  <div className="border-t border-border/60 pt-4 my-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-navy-deep uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-primary" /> Coupon Code
                      </label>
                      {appliedCouponCode && (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {appliedCouponCode && activeCouponInfo ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                            %
                          </div>
                          <div>
                            <div className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                              <span>{activeCouponInfo.code}</span>
                              <span className="text-[10px] font-normal text-emerald-700">({activeCouponInfo.title})</span>
                            </div>
                            <p className="text-[10px] text-emerald-700 font-medium leading-tight">{activeCouponInfo.description}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-emerald-700 hover:text-red-600 transition p-1 cursor-pointer"
                          title="Remove Coupon"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCodeInput}
                            onChange={(e) => {
                              setCouponCodeInput(e.target.value);
                              setCouponError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyCoupon();
                              }
                            }}
                            placeholder="Enter code (e.g. FIRST15)"
                            className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold uppercase placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-primary focus:bg-white transition"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon()}
                            className="h-9 px-4 bg-primary text-white text-xs font-bold uppercase rounded-lg hover:bg-primary/95 transition cursor-pointer shrink-0"
                          >
                            Apply
                          </button>
                        </div>

                        {couponError && (
                          <p className="text-[11px] font-semibold text-red-500">{couponError}</p>
                        )}

                        {/* Quick Coupon Chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {[
                            ...((userOrderCount === null || userOrderCount === 0)
                              ? [
                                  { code: "FIRST15", label: "15% OFF (1st Order)" },
                                  { code: "WELCOME10", label: "10% OFF (1st Order)" },
                                ]
                              : []),
                            { code: "FREESHIP", label: "FREE SHIP" },
                            ...(isFestivalActive() ? [{ code: "FESTIVE10", label: "10% OFF (Festival)" }] : []),
                          ].map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => handleApplyCoupon(c.code)}
                              className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-600 hover:text-white transition cursor-pointer"
                            >
                              {c.code} ({c.label})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-4 flex justify-between font-semibold text-base text-navy-deep">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Includes GST</span>
                    <span>₹{Math.round(totalGst).toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-primary text-white h-14 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-primary/95 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-primary/10 cursor-pointer"
                >
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </button>

                <div className="mt-6 text-center">
                  <Link to="/shop" className="text-xs uppercase tracking-widest text-navy-deep/60 font-semibold hover:text-primary transition-colors">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl shadow-xl shadow-navy-deep/5 border border-border/50">
            <ShoppingCart className="h-16 w-16 text-gold/30 mx-auto mb-6" />
            <h2 className="text-3xl font-display font-semibold text-navy-deep mb-3">Your cart is empty</h2>
            <p className="text-navy-deep/60 mb-8 font-light">Looks like you haven't added anything yet.</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-primary/95 transition-all duration-300 shadow-lg"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>

      {/* Quick-Commerce Slide-out Checkout */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="fixed inset-0 bg-navy-deep/40 backdrop-blur-sm transition-opacity" onClick={() => setIsCheckoutOpen(false)} />
          
          <div className="relative w-full max-w-md h-[95vh] mt-auto md:mt-0 md:h-full bg-[#f8f9fb] md:rounded-l-[2rem] rounded-t-[2rem] md:rounded-tr-none shadow-2xl flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-300 overflow-hidden border-l border-border/50">
            
            {/* Header */}
            <div className="bg-white px-6 py-5 border-b border-border/50 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-xl font-bold font-display tracking-tight text-navy-deep">
                Checkout
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="h-8 w-8 bg-secondary/50 rounded-full flex items-center justify-center text-navy-deep hover:bg-secondary transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              
              {/* SUCCESS STATE */}
              {placedOrder ? (
                <div className="text-center py-10 space-y-6">
                  <div className="h-20 w-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold font-display text-navy-deep">Order Placed!</h3>
                    <p className="text-sm text-navy-deep/60 px-4">
                      Thank you. Your receipt has been sent to <span className="font-semibold">{placedOrder.customerEmail}</span>.
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-border/40 text-left space-y-3 shadow-sm mx-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-navy-deep/60">Order ID</span>
                      <span className="font-bold text-navy-deep">{placedOrder.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-navy-deep/60">Total</span>
                      <span className="font-bold text-navy-deep">₹{placedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                  <Link
                    to="/track-order"
                    search={{ orderId: placedOrder.id }}
                    onClick={() => setIsCheckoutOpen(false)}
                    className="mx-6 h-12 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/95 transition-colors flex items-center justify-center"
                  >
                    Track Order
                  </Link>
                </div>
              ) : (
                /* CHECKOUT FLOW */
                <form onSubmit={handlePlaceOrder} className="space-y-6 pb-24">
                  
                  {/* STEP 1: DELIVERY ADDRESS CARD (Driven exclusively by Address Modal) */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-border/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#0b72e7]" />
                        <h4 className="font-bold text-navy-deep text-sm">Delivery Address</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddressPickerOpen(true)}
                        className="text-xs font-bold text-[#0b72e7] hover:bg-[#0b72e7]/10 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>{shippingAddress || addressFlat || addressLocality ? "Change Address" : "Add Address"}</span>
                      </button>
                    </div>

                    {shippingAddress || (addressFlat && addressLocality) ? (
                      <div 
                        onClick={() => setIsAddressPickerOpen(true)}
                        className="p-4 bg-[#f8f9fb] hover:bg-[#f0f4f9] rounded-xl border border-border/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#0c831f]/10 text-[#0c831f] border border-[#0c831f]/20">
                              {addressTag === "Work" ? "💼 Work" : addressTag === "Hotel" ? "🏨 Hotel" : addressTag === "Other" ? "📍 Other" : "🏠 Home"}
                            </span>
                            <span className="text-xs font-bold text-navy-deep">{shippingName || "Customer"}</span>
                            {shippingPhone && <span className="text-xs text-navy-deep/60 font-semibold">• {shippingPhone}</span>}
                          </div>
                          <span className="text-[11px] font-bold text-[#0b72e7] group-hover:underline">Edit</span>
                        </div>
                        <p className="text-xs text-navy-deep/80 font-medium leading-relaxed">
                          {[
                            addressFlat || addressLine1,
                            addressFloor,
                            addressLocality,
                            addressLandmark || addressLine2,
                            city,
                            state && pincode ? `${state} - ${pincode}` : (state || pincode)
                          ].filter(Boolean).join(", ") || shippingAddress}
                        </p>
                      </div>
                    ) : (
                      <div 
                        onClick={() => setIsAddressPickerOpen(true)}
                        className="p-5 bg-amber-50/70 border-2 border-dashed border-amber-300 hover:border-amber-400 rounded-xl cursor-pointer text-center transition-all group"
                      >
                        <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-navy-deep">No address set</p>
                        <p className="text-[11px] text-amber-800/80 font-medium mt-0.5">Click here to set your delivery location on the map</p>
                      </div>
                    )}
                  </div>

                  {isAddressPickerOpen && (
                    <AddressPicker onClose={() => setIsAddressPickerOpen(false)} />
                  )}

                  {/* STEP 2: DELIVERY SPEED */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-border/40">
                    <h4 className="font-bold text-navy-deep mb-3 text-sm">Delivery Speed</h4>
                    
                    <div className="space-y-3">
                      {isExpressAvailable && (
                        <label className={`block relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                          deliverySpeed === 'express' 
                            ? 'bg-[#f4f1ff] border-[#6b46c1] shadow-[0_4px_20px_rgba(107,70,193,0.15)]' 
                            : 'bg-white border-border/40 hover:border-[#6b46c1]/30'
                        }`}>
                          <input 
                            type="radio" 
                            name="deliverySpeed" 
                            value="express" 
                            checked={deliverySpeed === 'express'} 
                            onChange={() => setDeliverySpeed('express')}
                            className="sr-only" 
                          />
                          <div className="flex items-start gap-4">
                            <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${deliverySpeed === 'express' ? 'bg-[#6b46c1] text-white' : 'bg-secondary text-transparent'}`}>
                              <CheckCircle className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Zap className={`h-4 w-4 ${deliverySpeed === 'express' ? 'text-[#6b46c1] fill-[#6b46c1]' : 'text-gray-400'}`} />
                                <span className={`font-bold ${deliverySpeed === 'express' ? 'text-[#6b46c1]' : 'text-navy-deep'}`}>Express</span>
                              </div>
                              <p className="text-xs text-navy-deep/60 font-medium">Delivery in 15 - 20 minutes</p>
                            </div>
                            <div className="text-right">
                              <span className={`font-bold ${deliverySpeed === 'express' ? 'text-[#6b46c1]' : 'text-navy-deep'}`}>+₹29</span>
                            </div>
                          </div>
                        </label>
                      )}

                      <label className={`block relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                        deliverySpeed === 'standard' 
                          ? 'bg-white border-navy-deep shadow-[0_4px_20px_rgba(12,20,33,0.08)]' 
                          : 'bg-white border-border/40 hover:border-navy-deep/30'
                      }`}>
                        <input 
                          type="radio" 
                          name="deliverySpeed" 
                          value="standard" 
                          checked={deliverySpeed === 'standard'} 
                          onChange={() => setDeliverySpeed('standard')}
                          className="sr-only" 
                        />
                        <div className="flex items-start gap-4">
                          <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${deliverySpeed === 'standard' ? 'bg-navy-deep text-white' : 'bg-secondary text-transparent'}`}>
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Truck className={`h-4 w-4 ${deliverySpeed === 'standard' ? 'text-navy-deep' : 'text-gray-400'}`} />
                              <span className="font-bold text-navy-deep">Standard</span>
                            </div>
                            <p className="text-xs text-navy-deep/60 font-medium">Delivery in 2-3 business days</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-green-600">Free</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* COUPON SECTION IN CHECKOUT DRAWER */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-border/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-navy-deep flex items-center gap-2 text-sm">
                        <Tag className="h-4 w-4 text-primary" /> Apply Coupon
                      </h4>
                      {appliedCouponCode && (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {appliedCouponCode && activeCouponInfo ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                            %
                          </div>
                          <div>
                            <div className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                              <span>{activeCouponInfo.code}</span>
                              <span className="text-[10px] font-normal text-emerald-700">({activeCouponInfo.title})</span>
                            </div>
                            <p className="text-[10px] text-emerald-700 font-medium leading-tight">{activeCouponInfo.description}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-emerald-700 hover:text-red-600 transition p-1 cursor-pointer"
                          title="Remove Coupon"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCodeInput}
                            onChange={(e) => {
                              setCouponCodeInput(e.target.value);
                              setCouponError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyCoupon();
                              }
                            }}
                            placeholder="Enter code (e.g. FIRST15)"
                            className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold uppercase placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-primary focus:bg-white transition"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon()}
                            className="h-9 px-4 bg-primary text-white text-xs font-bold uppercase rounded-lg hover:bg-primary/95 transition cursor-pointer shrink-0"
                          >
                            Apply
                          </button>
                        </div>

                        {couponError && (
                          <p className="text-[11px] font-semibold text-red-500">{couponError}</p>
                        )}

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {[
                            { code: "FIRST15", label: "15% OFF" },
                            { code: "FREESHIP", label: "FREE SHIP" },
                            { code: "FESTIVE10", label: "10% OFF" },
                            ...(isPlusMember ? [{ code: "IESVRAPLUS", label: "PLUS PERK" }] : []),
                          ].map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => handleApplyCoupon(c.code)}
                              className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-600 hover:text-white transition cursor-pointer"
                            >
                              {c.code} ({c.label})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STEP 3: PAYMENT SECTION */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-border/40">
                    <h4 className="font-bold text-navy-deep flex items-center gap-2 text-sm mb-4">
                      <CreditCard className="h-4 w-4 text-gold" /> Payment Mode
                    </h4>
                    
                    <div className="space-y-1">
                      <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${paymentMode === 'razorpay' ? 'bg-secondary/20' : 'hover:bg-secondary/10'}`}>
                        <input
                          type="radio"
                          name="payment"
                          value="razorpay"
                          checked={paymentMode === "razorpay"}
                          onChange={() => setPaymentMode("razorpay")}
                          className="text-gold focus:ring-gold accent-gold h-4 w-4"
                        />
                        <span className="text-sm font-medium text-navy-deep">Online Payment (UPI, Cards)</span>
                      </label>
                      <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${paymentMode === 'cod' ? 'bg-secondary/20' : 'hover:bg-secondary/10'}`}>
                        <input
                          type="radio"
                          name="payment"
                          value="cod"
                          checked={paymentMode === "cod"}
                          onChange={() => setPaymentMode("cod")}
                          className="text-gold focus:ring-gold accent-gold h-4 w-4"
                        />
                        <span className="text-sm font-medium text-navy-deep">Cash on Delivery (COD)</span>
                      </label>
                    </div>
                  </div>

                  {/* Fixed Bottom Action Bar */}
                  <div className="fixed bottom-0 left-0 right-0 md:absolute p-4 bg-white border-t border-border/50 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] flex items-center justify-between z-20">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-navy-deep/50 mb-0.5">Total to Pay</p>
                      <p className="text-lg font-bold text-navy-deep">₹{total.toLocaleString()}</p>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isProcessingPayment}
                      className="h-12 px-8 bg-[#2dcb74] text-white rounded-xl font-bold tracking-wide hover:bg-[#25a961] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#2dcb74]/20 flex items-center gap-2"
                    >
                      {isProcessingPayment ? "Processing..." : "Place Order"} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                </form>
              )}
            </div>
            
            {/* Express Delivery Success Popup (Absolute positioned inside the panel) */}
            {showExpressPopup && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-navy-deep/20 backdrop-blur-[2px] animate-in fade-in duration-200">
                <div className="bg-white rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] p-6 max-w-sm w-full text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative border border-border/50">
                  <button 
                    onClick={() => setShowExpressPopup(false)}
                    className="absolute top-4 right-4 text-navy-deep/40 hover:text-navy-deep transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-[#6b46c1]/20 to-[#6b46c1]/5 rounded-2xl flex items-center justify-center mb-5 rotate-3 shadow-inner">
                    <Zap className="h-8 w-8 text-[#6b46c1] fill-[#6b46c1] -rotate-3" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-navy-deep mb-2">Great news!</h3>
                  <p className="text-sm text-navy-deep/70 font-medium mb-6">
                    <strong className="text-[#6b46c1]">15-Min Express Delivery</strong> is available at your location.
                  </p>
                  <button 
                    onClick={() => setShowExpressPopup(false)}
                    className="w-full h-11 bg-[#f4f1ff] hover:bg-[#6b46c1] text-[#6b46c1] hover:text-white rounded-xl font-bold text-sm tracking-wide transition-all duration-300"
                  >
                    Got it
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
