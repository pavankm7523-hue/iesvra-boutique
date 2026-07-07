import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingCart, Trash2, ArrowRight, X, CreditCard, CheckCircle, MapPin, Zap, Truck, Navigation } from "lucide-react";
import { useCartItems, removeFromCart, updateCartQuantity } from "@/lib/cart";
import { useState, useEffect, useRef } from "react";
import { useCurrentUser } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { toast } from "sonner";

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
  
  // Quick-Commerce Checkout States
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [deliverySpeed, setDeliverySpeed] = useState<'express' | 'standard'>('standard');
  const [isExpressAvailable, setIsExpressAvailable] = useState(false);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);
  const [showExpressPopup, setShowExpressPopup] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Mock Addresses
  const mockAddresses = [
    "R.N Singh Road, Kankarbagh Main Road, Patna, Bihar 800020",
    "Boring Road, Patna, Bihar 800001",
    "Frazer Road, Patna, Bihar 800001",
    "Andheri West, Mumbai, Maharashtra 400053",
    "Indiranagar, Bangalore, Karnataka 560038"
  ];
  
  // Mock Razorpay Fallback States
  const [isMockRazorpayOpen, setIsMockRazorpayOpen] = useState(false);
  const [mockPaymentMethod, setMockPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [isMockPaying, setIsMockPaying] = useState(false);

  const [rzpKey, setRzpKey] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("IESVRA_rzp_key") || "" : ""));

  useEffect(() => {
    if (currentUser) {
      setShippingName(currentUser.name);
      setShippingEmail(currentUser.email);
    }
  }, [currentUser]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  let baseShipping = subtotal > 499 || subtotal === 0 ? 0 : 50;
  
  // Express fee
  const deliveryFee = deliverySpeed === 'express' ? baseShipping + 29 : baseShipping;
  const total = subtotal + deliveryFee;

  const handleAddressSelect = (addr: string) => {
    setShippingAddress(addr);
    setAddressSearch(addr);
    setShowSuggestions(false);
    setIsCheckingDelivery(true);
    
    // Simulate API delay for checking delivery feasibility
    setTimeout(() => {
      setIsCheckingDelivery(false);
      setIsAddressConfirmed(true);
      
      // Check if within 15km (mock logic: contains Patna or 800020)
      const isNearby = addr.toLowerCase().includes("patna") || addr.includes("800020");
      setIsExpressAvailable(isNearby);
      setDeliverySpeed(isNearby ? 'express' : 'standard');
      
      if (isNearby) {
        setShowExpressPopup(true);
        // Auto-dismiss the popup after 3 seconds
        setTimeout(() => setShowExpressPopup(false), 3000);
      }
    }, 800);
  };

  const handleEditAddress = () => {
    setIsAddressConfirmed(false);
    // Focus after brief delay for react to render
    setTimeout(() => addressInputRef.current?.focus(), 50);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingName.trim() || !shippingEmail.trim() || !shippingPhone.trim() || !shippingAddress.trim()) {
      toast.error("Please fill in all checkout fields.");
      return;
    }

    if (paymentMode === "cod") {
      try {
        const order = createOrder(
          shippingName.trim(),
          shippingEmail.trim(),
          shippingPhone.trim(),
          shippingAddress.trim(),
          shippingPhone.trim(),
          shippingAddress.trim(),
          cartItems,
          subtotal,
          deliveryFee,
          total
        );
        setPlacedOrder(order);
        toast.success("Order placed successfully via Cash on Delivery!");
      } catch (err) {
        toast.error("Failed to place order.");
      }
      return;
    }

    // Save key in localStorage if provided
    if (typeof window !== "undefined") {
      localStorage.setItem("IESVRA_rzp_key", rzpKey.trim());
    }

    // If key is empty, immediately open Simulated Payment Modal directly!
    if (!rzpKey.trim()) {
      setIsProcessingPayment(false);
      setIsMockRazorpayOpen(true);
      return;
    }

    // Razorpay Online Payment Flow (with provided key)
    setIsProcessingPayment(true);
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      setIsProcessingPayment(false);
      toast.info("Razorpay SDK is blocked by your browser/adblocker. Launching secure demo payment mode...");
      setIsMockRazorpayOpen(true);
      return;
    }

    try {
      const options = {
        key: rzpKey.trim(),
        amount: total * 100, // in paise
        currency: "INR",
        name: "IESVRA",
        description: "Payment for your order",
        handler: function (response: any) {
          setIsProcessingPayment(false);
          try {
            const order = createOrder(
              shippingName.trim(),
              shippingEmail.trim(),
              shippingPhone.trim(),
              shippingAddress.trim(),
              shippingPhone.trim(),
              shippingAddress.trim(),
              cartItems,
              subtotal,
              deliveryFee,
              total
            );
            setPlacedOrder(order);
            toast.success(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
          } catch (err) {
            toast.error("Payment succeeded, but failed to save order details.");
          }
        },
        prefill: {
          name: shippingName.trim(),
          email: shippingEmail.trim(),
          contact: shippingPhone.trim(),
        },
        notes: {
          address: shippingAddress.trim(),
        },
        theme: {
          color: "#0c1421",
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            toast.info("Payment cancelled.");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      setIsProcessingPayment(false);
      toast.info("Failed to open Razorpay modal directly. Launching secure demo payment mode...");
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
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="font-medium text-foreground">
                      {deliveryFee === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between font-semibold text-base text-navy-deep">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-navy-deep text-gold h-14 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gold hover:text-navy-deep transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-navy-deep/10 cursor-pointer"
                >
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </button>

                <div className="mt-6 text-center">
                  <Link to="/shop" className="text-xs uppercase tracking-widest text-navy-deep/60 font-semibold hover:text-gold transition-colors">
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
              className="inline-flex items-center gap-3 bg-navy-deep text-gold px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gold hover:text-navy-deep transition-all duration-300 shadow-lg"
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
                    className="mx-6 h-12 bg-navy-deep text-gold rounded-xl font-bold text-sm hover:bg-gold hover:text-navy-deep transition-colors flex items-center justify-center"
                  >
                    Track Order
                  </Link>
                </div>
              ) : (
                /* CHECKOUT FLOW */
                <form onSubmit={handlePlaceOrder} className="space-y-6 pb-24">
                  
                  {/* STEP 1: ADDRESS ENTRY */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-border/40">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-navy-deep flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-[#0b72e7]" /> Delivery Address
                      </h4>
                      {isAddressConfirmed && (
                        <button type="button" onClick={handleEditAddress} className="text-[10px] uppercase font-bold text-[#0b72e7] tracking-wider hover:underline">
                          Change
                        </button>
                      )}
                    </div>

                    {!isAddressConfirmed ? (
                      <div className="space-y-3 relative">
                        <div className="relative">
                          <input
                            ref={addressInputRef}
                            type="text"
                            value={addressSearch}
                            onChange={(e) => {
                              setAddressSearch(e.target.value);
                              setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder="Search area, street, landmark..."
                            className="w-full h-12 pl-10 pr-4 bg-[#f8f9fb] border-none rounded-xl focus:ring-2 focus:ring-[#0b72e7]/20 outline-none text-sm transition-all text-navy-deep font-medium placeholder:text-navy-deep/30 placeholder:font-normal"
                          />
                          <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-deep/40" />
                        </div>
                        
                        {/* Autocomplete Suggestions */}
                        {showSuggestions && addressSearch.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-border/50 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
                            {mockAddresses
                              .filter(a => a.toLowerCase().includes(addressSearch.toLowerCase()))
                              .map((addr, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handleAddressSelect(addr)}
                                  className="w-full text-left px-4 py-3 hover:bg-[#f8f9fb] text-sm text-navy-deep/80 border-b border-border/30 last:border-0 flex items-start gap-3 transition-colors"
                                >
                                  <MapPin className="h-4 w-4 text-navy-deep/30 shrink-0 mt-0.5" />
                                  <span>{addr}</span>
                                </button>
                              ))}
                            {mockAddresses.filter(a => a.toLowerCase().includes(addressSearch.toLowerCase())).length === 0 && (
                              <button
                                type="button"
                                onClick={() => handleAddressSelect(addressSearch)}
                                className="w-full text-left px-4 py-3 hover:bg-[#f8f9fb] text-sm text-[#0b72e7] font-medium flex items-center gap-2"
                              >
                                Use "{addressSearch}"
                              </button>
                            )}
                          </div>
                        )}
                        
                        {/* Basic Info (Name/Phone) */}
                        <div className="grid grid-cols-2 gap-3 pt-3">
                          <input
                            required
                            type="text"
                            value={shippingName}
                            onChange={(e) => setShippingName(e.target.value)}
                            placeholder="Full Name"
                            className="h-11 px-4 bg-[#f8f9fb] rounded-xl border-none focus:ring-2 focus:ring-[#0b72e7]/20 outline-none text-sm"
                          />
                          <input
                            required
                            type="tel"
                            value={shippingPhone}
                            onChange={(e) => setShippingPhone(e.target.value)}
                            placeholder="Phone Number"
                            className="h-11 px-4 bg-[#f8f9fb] rounded-xl border-none focus:ring-2 focus:ring-[#0b72e7]/20 outline-none text-sm"
                          />
                        </div>
                      </div>
                    ) : isCheckingDelivery ? (
                      <div className="py-8 flex flex-col items-center justify-center space-y-3">
                        <div className="w-6 h-6 border-2 border-[#0b72e7]/20 border-t-[#0b72e7] rounded-full animate-spin" />
                        <p className="text-xs font-semibold text-navy-deep/60 animate-pulse tracking-wide">Checking delivery options...</p>
                      </div>
                    ) : (
                      <div className="text-sm text-navy-deep leading-relaxed">
                        <p className="font-medium">{shippingName} <span className="text-navy-deep/40 mx-2">•</span> {shippingPhone}</p>
                        <p className="text-navy-deep/70 mt-1">{shippingAddress}</p>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: DELIVERY SPEED (Appears after address confirmation) */}
                  {isAddressConfirmed && !isCheckingDelivery && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                      <h4 className="font-bold text-navy-deep mb-3 text-sm px-1">Delivery Speed</h4>
                      
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
                  )}

                  {/* STEP 3: PAYMENT SECTION */}
                  {isAddressConfirmed && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-700 bg-white p-5 rounded-2xl shadow-sm border border-border/40">
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
                  )}

                  {/* Fixed Bottom Action Bar */}
                  <div className="fixed bottom-0 left-0 right-0 md:absolute p-4 bg-white border-t border-border/50 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] flex items-center justify-between z-20">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-navy-deep/50 mb-0.5">Total to Pay</p>
                      <p className="text-lg font-bold text-navy-deep">₹{total.toLocaleString()}</p>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isProcessingPayment || !isAddressConfirmed}
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
                  <h4 className="font-bold text-sm leading-tight">IESVRA Boutique</h4>
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
                  setTimeout(() => {
                    setIsMockPaying(false);
                    setIsMockRazorpayOpen(false);
                    try {
                      const order = createOrder(
                        shippingName.trim(),
                        shippingEmail.trim(),
                        shippingPhone.trim(),
                        shippingAddress.trim(),
                        cartItems,
                        subtotal,
                        shipping,
                        total
                      );
                      setPlacedOrder(order);
                      toast.success(`Payment successful! Simulated ID: pay_${Math.random().toString(36).substr(2, 9)}`);
                    } catch (err) {
                      toast.error("Failed to process order.");
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
