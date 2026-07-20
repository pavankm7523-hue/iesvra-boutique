import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingCart, Trash2, ArrowRight, X, CreditCard, CheckCircle, MapPin, Zap, Truck, Navigation, Locate, Tag } from "lucide-react";
import { useCartItems, removeFromCart, updateCartQuantity } from "@/lib/cart";
import { useState, useEffect, useRef } from "react";
import { AddressPicker } from "@/components/AddressPicker";
import { useCurrentUser } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { toast } from "sonner";
import { fetchAddressSuggestions, checkExpressEligibility, geocodeAddress, reverseGeocode } from "@/lib/delivery";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "Your Cart - IESVRA" }],
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

  // Sync state with localStorage changes
  useEffect(() => {
    const handleSync = () => {
      setShippingName(localStorage.getItem("IESVRA_shipping_name") || "");
      setShippingEmail(localStorage.getItem("IESVRA_shipping_email") || "");
      setShippingPhone(localStorage.getItem("IESVRA_shipping_phone") || "");
      setRzpKey(localStorage.getItem("IESVRA_rzp_key") || "");

      const savedLine1 = localStorage.getItem("IESVRA_delivery_address_line1") || "";
      const savedLine2 = localStorage.getItem("IESVRA_delivery_address_line2") || "";
      const savedCity = localStorage.getItem("IESVRA_delivery_city") || "";
      const savedState = localStorage.getItem("IESVRA_delivery_state") || "";
      const savedPincode = localStorage.getItem("IESVRA_delivery_pincode") || "";
      
      if (savedLine1) {
        setAddressLine1(savedLine1);
        setAddressLine2(savedLine2);
        setCity(savedCity);
        setState(savedState);
        setPincode(savedPincode);
        
        const formatted = [savedLine1, savedLine2, savedCity, `${savedState} - ${savedPincode}`].filter(Boolean).join(", ");
        setShippingAddress(formatted);
        // Don't pre-fill the search box with saved address — keep it blank for fresh searching
        setAddressSearch("");
        setIsAddressConfirmed(true);
        
        const isExpress = localStorage.getItem("IESVRA_is_express_eligible") === "true";
        setIsExpressAvailable(isExpress);
        setDeliverySpeed(isExpress ? "express" : "standard");
      } else {
        const savedAddress = localStorage.getItem("IESVRA_delivery_address") || "";
        if (savedAddress) {
          // Store the parsed line1 for the address form but keep search box blank
          setAddressLine1(savedAddress.split(",")[0] || "");
        }
      }
    };
    handleSync(); // Initial load
    window.addEventListener("iesvra-address-updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("iesvra-address-updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

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

  const [rzpKey, setRzpKey] = useState("");

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

  const physicalItems = cartItems.filter(item => item.id !== "iesvra-plus-membership" && !item.isDigital);
  const physicalSubtotal = physicalItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const hasPhysical = physicalItems.length > 0;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const FREE_SHIPPING_THRESHOLD = 499;
  // ₹59 delivery charge for orders under ₹499, free above
  const baseShipping = hasPhysical 
    ? (physicalSubtotal < FREE_SHIPPING_THRESHOLD ? 59 : 0)
    : 0;

  // Coupon Rules Definition
  const VALID_COUPONS: Record<string, {
    code: string;
    title: string;
    getDiscount: (sub: number, baseShip: number) => { discount: number; isFreeShipping?: boolean; description: string };
  }> = {
    FIRST15: {
      code: "FIRST15",
      title: "Flat 15% OFF",
      getDiscount: (sub) => ({
        discount: Math.round(sub * 0.15),
        description: "Flat 15% OFF applied on subtotal!",
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
      getDiscount: (sub) => ({
        discount: Math.min(250, Math.round(sub * 0.10)),
        description: "Festive 10% instant discount applied!",
      }),
    },
    IESVRAPLUS: {
      code: "IESVRAPLUS",
      title: "IESVRA Plus Perk",
      getDiscount: (sub) => ({
        discount: Math.min(sub, 100),
        description: "IESVRA Plus member discount applied (₹100 OFF)!",
      }),
    },
  };

  let couponDiscount = 0;
  let isCouponFreeShipping = false;
  let activeCouponInfo: { code: string; title: string; description: string } | null = null;

  if (appliedCouponCode) {
    const normalized = appliedCouponCode.trim().toUpperCase();
    const config = VALID_COUPONS[normalized];
    if (config) {
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

  const deliveryFee = isCouponFreeShipping ? 0 : baseShipping;
  const total = Math.max(0, subtotal + deliveryFee - couponDiscount);

  const handleApplyCoupon = (codeToApply?: string) => {
    const targetCode = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!targetCode) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    if (!VALID_COUPONS[targetCode]) {
      setCouponError(`Invalid coupon code "${targetCode}". Try FIRST15, FREESHIP, FESTIVE10, or IESVRAPLUS.`);
      toast.error(`Invalid coupon code "${targetCode}"`);
      return;
    }

    setCouponError(null);
    setAppliedCouponCode(targetCode);
    setCouponCodeInput(targetCode);
    localStorage.setItem("IESVRA_applied_coupon", targetCode);
    window.dispatchEvent(new Event("iesvra-coupon-updated"));
    toast.success(`Coupon "${targetCode}" applied! 🎉`);
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

    // Run validation on all fields
    const newErrors: Record<string, string> = {};
    if (!shippingName.trim()) newErrors.name = "Please enter your name";
    if (!shippingEmail.trim()) newErrors.email = "Please enter your email";
    if (!shippingPhone.trim()) newErrors.phone = "Please enter your phone number";
    
    if (!addressLine1.trim()) newErrors.addressLine1 = "Please enter Address Line 1";
    if (!city.trim()) newErrors.city = "Please enter city";
    if (!state.trim()) newErrors.state = "Please select state";
    
    if (!pincode.trim()) {
      newErrors.pincode = "Please enter pincode";
    } else if (!/^\d{6}$/.test(pincode.trim())) {
      newErrors.pincode = "Please enter a valid 6-digit pincode";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setErrors({});
    const combinedAddress = [addressLine1, addressLine2, city, `${state} - ${pincode}`].filter(Boolean).join(", ");

    // Save fields to localStorage
    localStorage.setItem("IESVRA_shipping_name", shippingName.trim());
    localStorage.setItem("IESVRA_shipping_email", shippingEmail.trim());
    localStorage.setItem("IESVRA_shipping_phone", shippingPhone.trim());
    localStorage.setItem("IESVRA_delivery_address", combinedAddress);
    localStorage.setItem("IESVRA_delivery_address_line1", addressLine1);
    localStorage.setItem("IESVRA_delivery_address_line2", addressLine2);
    localStorage.setItem("IESVRA_delivery_city", city);
    localStorage.setItem("IESVRA_delivery_state", state);
    localStorage.setItem("IESVRA_delivery_pincode", pincode);
    localStorage.setItem("IESVRA_is_express_eligible", isExpressAvailable ? "true" : "false");
    window.dispatchEvent(new Event("iesvra-address-updated"));

    if (paymentMode === "cod") {
      try {
        const order = await createOrder(
          shippingName.trim(),
          shippingEmail.trim(),
          shippingPhone.trim(),
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
        console.warn("Failed to create Razorpay order on backend, falling back to mock:", createData.error);
        toast.info("Falling back to Simulated Test Payment Mode.");
        setIsMockRazorpayOpen(true);
        return;
      }

      const { order_id, key_id } = createData;

      // 2. Load Razorpay checkout script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        console.warn("Razorpay SDK failed to load, falling back to mock payment.");
        toast.info("Razorpay SDK unavailable. Falling back to Simulated Test Payment Mode.");
        setIsMockRazorpayOpen(true);
        return;
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
              shippingName.trim(),
              shippingEmail.trim(),
              shippingPhone.trim(),
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
          name: shippingName.trim(),
          email: shippingEmail.trim(),
          contact: shippingPhone.trim(),
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
      console.warn("Razorpay placement error, falling back to mock payment:", err);
      toast.info("Falling back to Simulated Test Payment Mode.");
      setIsMockRazorpayOpen(true);
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
                  {hasPhysical && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>
                        Shipping
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

                  {/* Coupon Applied Discount Row */}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold pt-1">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" /> Coupon Discount ({appliedCouponCode})
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
                            { code: "FIRST15", label: "15% OFF" },
                            { code: "FREESHIP", label: "FREE SHIP" },
                            { code: "FESTIVE10", label: "10% OFF" },
                            { code: "IESVRAPLUS", label: "PLUS PERK" },
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
                  
                  {/* STEP 1: ADDRESS ENTRY */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-border/40 space-y-4">
                    <h4 className="font-bold text-navy-deep flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-[#0b72e7]" /> Delivery Location & Contact
                    </h4>
                    
                    {/* Autocomplete Search Bar */}
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-navy-deep/60">Quick Search Address</label>
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          disabled={isLocating}
                          className="text-[10px] uppercase font-bold text-[#0b72e7] tracking-wider hover:underline flex items-center gap-1 cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          📍 {isLocating ? "Locating..." : "Use Current Location"}
                        </button>
                      </div>
                      <div className="relative mt-1">
                        <input
                          ref={addressInputRef}
                          type="text"
                          value={addressSearch}
                          onChange={(e) => {
                            setAddressSearch(e.target.value);
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          placeholder="Search area, building, street..."
                          className="w-full h-10 pl-9 pr-4 bg-[#f8f9fb] border-none rounded-xl focus:ring-2 focus:ring-[#0b72e7]/20 outline-none text-xs transition-all text-navy-deep font-semibold placeholder:text-navy-deep/30"
                        />
                        <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-navy-deep/40" />
                      </div>
                      
                      {showSuggestions && addressSearch.trim().length >= 3 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-border/50 overflow-hidden z-30 max-h-[200px] overflow-y-auto">
                          {isSearchingSuggestions && (
                            <div className="py-3 text-center text-xs text-navy-deep/50 font-medium">
                              Searching addresses...
                            </div>
                          )}
                          {!isSearchingSuggestions && suggestions.length > 0 && suggestions.map((addr, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleAddressSelect(addr)}
                              className="w-full text-left px-4 py-2 hover:bg-[#f8f9fb] text-xs text-navy-deep/80 border-b border-border/10 last:border-0 flex items-start gap-2 transition-colors"
                            >
                              <MapPin className="h-3 w-3 text-navy-deep/30 shrink-0 mt-0.5" />
                              <span>{addr}</span>
                            </button>
                          ))}
                          {!isSearchingSuggestions && suggestions.length === 0 && (
                            <div className="py-3 px-4 text-center text-xs text-navy-deep/40 font-medium">
                              No results found — try a different search
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Contact Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-navy-deep/60">Full Name *</label>
                        <input
                          type="text"
                          value={shippingName}
                          onChange={(e) => {
                            setShippingName(e.target.value);
                            if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                          }}
                          placeholder="Jane Doe"
                          className="h-10 px-3 bg-[#f8f9fb] rounded-xl border-none focus:ring-2 focus:ring-[#0b72e7]/20 outline-none text-xs text-navy-deep font-semibold"
                        />
                        {errors.name && <span className="text-[9px] text-red-500 font-semibold">{errors.name}</span>}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-navy-deep/60">Phone Number *</label>
                        <input
                          type="tel"
                          value={shippingPhone}
                          onChange={(e) => {
                            setShippingPhone(e.target.value);
                            if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                          }}
                          placeholder="e.g. 9876543210"
                          className="h-10 px-3 bg-[#f8f9fb] rounded-xl border-none focus:ring-2 focus:ring-[#0b72e7]/20 outline-none text-xs text-navy-deep font-semibold"
                        />
                        {errors.phone && <span className="text-[9px] text-red-500 font-semibold">{errors.phone}</span>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-navy-deep/60">Email Address *</label>
                      <input
                        type="email"
                        value={shippingEmail}
                        onChange={(e) => {
                          setShippingEmail(e.target.value);
                          if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                        }}
                        placeholder="jane.doe@example.com"
                        className="h-10 px-3 bg-[#f8f9fb] rounded-xl border-none focus:ring-2 focus:ring-[#0b72e7]/20 outline-none text-xs text-navy-deep font-semibold"
                      />
                      {errors.email && <span className="text-[9px] text-red-500 font-semibold">{errors.email}</span>}
                    </div>

                    {/* Map Pinpoint Selector Card */}
                    <div 
                      onClick={() => setIsAddressPickerOpen(true)}
                      className="flex flex-col gap-2.5 bg-[#f5fbf7] hover:bg-[#ebf8f0] p-4 rounded-xl border border-[#cbeed6] hover:border-[#a3e0b4] transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2">
                          <div className="bg-[#0c831f] text-white p-1.5 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-navy-deep group-hover:text-[#0c831f] transition-colors">Pin Exact Delivery Location</span>
                            <p className="text-[10px] text-navy-deep/60 mt-0.5">
                              Use search & interactive map to set perfect delivery spot
                            </p>
                          </div>
                        </div>
                        {pinnedLat && pinnedLng ? (
                          <span className="text-[9px] font-semibold text-[#0c831f] bg-[#e6f4e8] px-2 py-0.5 rounded-full">
                            Location Set
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                            Required
                          </span>
                        )}
                      </div>
                      
                      {addressLine1 && (
                        <div className="bg-[#f8f9fb] p-2.5 rounded-lg border border-border/20 text-[11px] text-navy-deep/75 font-semibold leading-relaxed flex gap-1.5 items-center">
                          <span className="text-[#0c831f] font-bold">📍</span>
                          <span className="truncate">{addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}</span>
                        </div>
                      )}
                    </div>

                    {isAddressPickerOpen && (
                      <AddressPicker onClose={() => setIsAddressPickerOpen(false)} />
                    )}

                    {/* Address Fields */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-navy-deep/60">Address Line 1 * (House/Flat No, Building, Street)</label>
                      <input
                        type="text"
                        value={addressLine1}
                        onChange={(e) => {
                          setAddressLine1(e.target.value);
                          if (errors.addressLine1) setErrors(prev => ({ ...prev, addressLine1: "" }));
                        }}
                        placeholder="Flat 101, Maple Heights"
                        className="h-10 px-3 bg-[#f8f9fb] rounded-xl border-none focus:ring-2 focus:ring-[#0b72e7]/20 outline-none text-xs text-navy-deep font-semibold"
                      />
                      {errors.addressLine1 && <span className="text-[9px] text-red-500 font-semibold">{errors.addressLine1}</span>}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-navy-deep/60">Address Line 2 (Landmark, Area - Optional)</label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="Near Rajendra Nagar Over Bridge"
                        className="h-10 px-3 bg-[#f8f9fb] rounded-xl border-none focus:ring-2 focus:ring-[#0b72e7]/20 outline-none text-xs text-navy-deep font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-navy-deep/60">City *</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            if (errors.city) setErrors(prev => ({ ...prev, city: "" }));
                          }}
                          placeholder="Patna"
                          className="h-10 px-3 bg-[#f8f9fb] rounded-xl border-none focus:ring-2 focus:ring-[#0b72e7]/20 outline-none text-xs text-navy-deep font-semibold"
                        />
                        {errors.city && <span className="text-[9px] text-red-500 font-semibold">{errors.city}</span>}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-navy-deep/60">Pincode *</label>
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => {
                            setPincode(e.target.value);
                            if (errors.pincode) setErrors(prev => ({ ...prev, pincode: "" }));
                          }}
                          placeholder="800020"
                          maxLength={6}
                          className="h-10 px-3 bg-[#f8f9fb] rounded-xl border-none focus:ring-2 focus:ring-[#0b72e7]/20 outline-none text-xs text-navy-deep font-semibold"
                        />
                        {errors.pincode && <span className="text-[9px] text-red-500 font-semibold">{errors.pincode}</span>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-navy-deep/60">State *</label>
                      <select
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          if (errors.state) setErrors(prev => ({ ...prev, state: "" }));
                        }}
                        className="h-10 px-3 bg-[#f8f9fb] rounded-xl border-none focus:ring-2 focus:ring-[#0b72e7]/20 outline-none text-xs text-navy-deep font-semibold cursor-pointer"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {errors.state && <span className="text-[9px] text-red-500 font-semibold">{errors.state}</span>}
                    </div>

                    {isCheckingDelivery && (
                      <div className="py-1 flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#0b72e7]/20 border-t-[#0b72e7] rounded-full animate-spin" />
                        <span className="text-[10px] font-semibold text-navy-deep/60 animate-pulse">Calculating delivery speed eligibility...</span>
                      </div>
                    )}

                    {verificationError && (
                      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold leading-normal">
                        ⚠️ {verificationError}
                      </div>
                    )}
                  </div>

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
                            { code: "IESVRAPLUS", label: "PLUS PERK" },
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

      {/* Mock Razorpay Modal */}
      {isMockRazorpayOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[250] flex items-center justify-center p-4">
          <div className="bg-[#fbfcff] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-navy-deep font-sans border border-border">
            {/* Header */}
            <div className="bg-[#0b121e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-gold font-bold text-xs">
                  IS
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">IESVRA</h4>
                  <p className="text-[10px] text-white/50">Simulated Test Mode Payment</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/60 block uppercase tracking-wider font-bold">Amount</span>
                <span className="text-lg font-bold text-gold">₹{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Selector tabs */}
            <div className="flex border-b border-border/50 bg-secondary/10">
              {(['card', 'upi', 'netbanking'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setMockPaymentMethod(method)}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                    mockPaymentMethod === method
                      ? 'border-[#0b72e7] text-[#0b72e7] bg-white'
                      : 'border-transparent text-navy-deep/60 hover:text-navy-deep hover:bg-secondary/5'
                  }`}
                >
                  {method === 'card' && '💳 Card'}
                  {method === 'upi' && '📱 UPI / QR'}
                  {method === 'netbanking' && '🏦 Netbanking'}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6 min-h-[180px]">
              {isMockPaying ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-2 border-gray-200 border-t-[#0b72e7]"></div>
                  <p className="text-sm font-semibold text-navy-deep/65">Simulating secure connection...</p>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setIsMockPaying(true);
                  setTimeout(async () => {
                    setIsMockPaying(false);
                    setIsMockRazorpayOpen(false);
                    try {
                      const order = await createOrder(
                        shippingName.trim(),
                        shippingEmail.trim(),
                        shippingPhone.trim(),
                        shippingAddress.trim(),
                        cartItems,
                        subtotal,
                        deliveryFee,
                        total,
                        "Paid",
                        pinnedLat,
                        pinnedLng
                      );
                      setPlacedOrder(order);
                      toast.success(`Payment successful! Simulated ID: pay_${Math.random().toString(36).substr(2, 9)}`);
                    } catch (err: any) {
                      console.error("Mock checkout error:", err);
                      toast.error(err?.message || "Failed to process order.");
                    }
                  }, 1500);
                }} className="space-y-4">
                  {mockPaymentMethod === 'card' && (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-navy-deep/60">Card Number</label>
                        <input
                          required
                          type="text"
                          placeholder="4315 2345 6789 0120"
                          defaultValue="4111 1111 1111 1111"
                          className="h-10 px-3 rounded-lg border border-border text-sm outline-none focus:border-[#0b72e7] transition-all font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-navy-deep/60">Expiry Date</label>
                          <input
                            required
                            type="text"
                            placeholder="MM/YY"
                            defaultValue="12/29"
                            className="h-10 px-3 rounded-lg border border-border text-sm outline-none focus:border-[#0b72e7] transition-all font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-navy-deep/60">CVV</label>
                          <input
                            required
                            type="password"
                            placeholder="123"
                            defaultValue="111"
                            maxLength={3}
                            className="h-10 px-3 rounded-lg border border-border text-sm outline-none focus:border-[#0b72e7] transition-all font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {mockPaymentMethod === 'upi' && (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-navy-deep/60">Enter UPI ID</label>
                        <input
                          required
                          type="text"
                          placeholder="username@bank"
                          defaultValue="success@razorpay"
                          className="h-10 px-3 rounded-lg border border-border text-sm outline-none focus:border-[#0b72e7] transition-all font-mono"
                        />
                      </div>
                      <div className="text-[10px] text-navy-deep/50 bg-[#0b72e7]/5 border border-[#0b72e7]/10 p-2.5 rounded-lg">
                        💡 Use <strong>success@razorpay</strong> or any simulated ID.
                      </div>
                    </div>
                  )}

                  {mockPaymentMethod === 'netbanking' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-navy-deep/60 block">Popular Banks</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'].map((bank, i) => (
                          <label key={bank} className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-secondary/5 cursor-pointer text-xs font-semibold text-navy-deep/80">
                            <input
                              type="radio"
                              name="mock-bank"
                              defaultChecked={i === 0}
                              className="text-[#0b72e7] focus:ring-[#0b72e7] accent-[#0b72e7]"
                            />
                            <span>{bank}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMockRazorpayOpen(false);
                        setIsProcessingPayment(false);
                      }}
                      className="flex-1 border border-border text-navy-deep/80 font-bold h-11 text-xs uppercase tracking-wider rounded-lg hover:bg-secondary/10 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#0b72e7] hover:bg-[#005bb7] text-white font-bold h-11 text-xs uppercase tracking-wider rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5 font-medium"
                    >
                      Pay ₹{total.toLocaleString()}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

