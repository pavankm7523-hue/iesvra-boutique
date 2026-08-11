import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Package, Search, Truck, CheckCircle2, Clock, MapPin, Phone, User, Calendar, CreditCard, XCircle } from "lucide-react";
import { getOrderById, Order, cancelOrder } from "@/lib/orders";
import { toast } from "sonner";

const trackSearchSchema = z.object({
  orderId: z.string().optional(),
});

export const Route = createFileRoute("/track-order")({
  validateSearch: (search) => trackSearchSchema.parse(search),
  head: () => ({
    meta: [{ title: "Track Order - IESVRA" }],
  }),
  component: TrackOrder,
});

function TrackOrder() {
  const navigate = useNavigate();
  const { orderId: queryOrderId } = Route.useSearch();
  const [searchQuery, setSearchQuery] = useState(queryOrderId || "");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleCancelOrderClick = async (orderIdStr: string) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
    if (confirmCancel) {
      try {
        const success = await cancelOrder(orderIdStr);
        if (success) {
          toast.success("Order cancelled successfully!");
          const fresh = await getOrderById(orderIdStr);
          setTrackedOrder(fresh);
        } else {
          toast.error("Failed to cancel order.");
        }
      } catch (e) {
        toast.error("An error occurred while cancelling the order.");
      }
    }
  };

  useEffect(() => {
    if (queryOrderId) {
      const fetchQueryOrder = async () => {
        const found = await getOrderById(queryOrderId);
        setTrackedOrder(found);
        setHasSearched(true);
        if (!found) {
          toast.error("Order not found. Please double check your Order ID.");
        }
      };
      fetchQueryOrder();
    }
  }, [queryOrderId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter an Order ID.");
      return;
    }
    try {
      const found = await getOrderById(searchQuery.trim());
      setTrackedOrder(found);
      setHasSearched(true);
      if (!found) {
        toast.error("Order not found. Please check the spelling.");
      }
    } catch (e) {
      toast.error("An error occurred while retrieving order details.");
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case "Processing":
        return 1;
      case "Shipped":
        return 2;
      case "Delivered":
        return 3;
      default:
        return 1;
    }
  };

  const activeStep = trackedOrder ? getStatusStep(trackedOrder.status) : 0;

  return (
    <div className="bg-background text-foreground min-h-screen pb-16">
      <div className="bg-navy-deep py-8 sm:py-14 md:py-16 text-center px-4">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-white mb-3 sm:mb-4 tracking-tight">
          Track Your Order
        </h1>
        <p className="text-white/80 max-w-xl mx-auto text-xs sm:text-sm md:text-base font-light leading-relaxed">
          Enter your order ID or tracking number below to see the real-time status of your shipment.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-8">
        <div className="bg-white p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-border/40">
          <form className="space-y-4" onSubmit={handleSearch}>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-deep/75 block">
                Order ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. ISH-123456"
                  className="w-full h-12 sm:h-13 pl-11 pr-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-base sm:text-sm transition-all shadow-xs"
                />
                <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-navy-deep/40 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white h-12 sm:h-13 rounded-xl sm:rounded-full font-bold uppercase tracking-widest text-xs hover:bg-primary/95 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-primary/10 cursor-pointer touch-manipulation"
            >
              <Search className="h-4 w-4" /> Track Now
            </button>
          </form>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            {trackedOrder ? (
              <div className="space-y-6 sm:space-y-8">
                {/* Order Information & Status Summary */}
                <div className="bg-white p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-border/40 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-4">
                    <div>
                      <span className="text-[10px] font-bold text-navy-deep/50 uppercase tracking-widest block mb-0.5">
                        Order Details
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold text-navy-deep font-mono tracking-wide">
                        {trackedOrder.id}
                      </h2>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] font-bold text-navy-deep/50 uppercase tracking-widest block mb-0.5">
                        Order Placed
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-navy-deep flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-gold shrink-0" /> {trackedOrder.date}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar or Cancelled Banner */}
                  {trackedOrder.status === "Cancelled" || trackedOrder.status === "Cancelled - Refund Pending" ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700 my-2 text-left">
                      <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Order Cancelled</p>
                        <p className="text-xs text-red-600/90 leading-relaxed mt-0.5">
                          {trackedOrder.status === "Cancelled - Refund Pending"
                            ? "This order has been cancelled. Your refund is being processed to your original payment method."
                            : "This order has been cancelled successfully."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 sm:py-6">
                      {/* Mobile Vertical Timeline (< 640px) */}
                      <div className="sm:hidden py-1">
                        <div className="relative pl-12 space-y-7">
                          {/* Background vertical line centered through 40px icon (X = 19px) */}
                          <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gray-100 rounded-full z-0" />

                          {/* Active vertical fill line */}
                          <div
                            className="absolute left-[19px] top-5 w-0.5 bg-primary rounded-full z-0 transition-all duration-700"
                            style={{
                              height: activeStep === 1 ? "0%" : activeStep === 2 ? "50%" : "100%",
                            }}
                          />

                          {/* Step 1: Processing */}
                          <div className="relative z-10 flex flex-col justify-center min-h-[40px]">
                            <div
                              className={`absolute -left-12 top-0 h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                activeStep >= 1
                                  ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                  : "bg-white border-border text-navy-deep/40"
                              }`}
                            >
                              <Clock className="h-5 w-5" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold uppercase tracking-wider ${activeStep >= 1 ? "text-navy-deep" : "text-navy-deep/40"}`}>
                                Processing
                              </span>
                              {activeStep === 1 && (
                                <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Current Status
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-navy-deep/60 mt-0.5">Order confirmed & items being packed</p>
                          </div>

                          {/* Step 2: Shipped */}
                          <div className="relative z-10 flex flex-col justify-center min-h-[40px]">
                            <div
                              className={`absolute -left-12 top-0 h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                activeStep >= 2
                                  ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                  : "bg-white border-border text-navy-deep/40"
                              }`}
                            >
                              <Truck className="h-5 w-5" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold uppercase tracking-wider ${activeStep >= 2 ? "text-navy-deep" : "text-navy-deep/40"}`}>
                                Shipped
                              </span>
                              {activeStep === 2 && (
                                <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  In Transit
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-navy-deep/60 mt-0.5">Handed over to courier partner</p>
                          </div>

                          {/* Step 3: Delivered */}
                          <div className="relative z-10 flex flex-col justify-center min-h-[40px]">
                            <div
                              className={`absolute -left-12 top-0 h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                activeStep >= 3
                                  ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                  : "bg-white border-border text-navy-deep/40"
                              }`}
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold uppercase tracking-wider ${activeStep >= 3 ? "text-navy-deep" : "text-navy-deep/40"}`}>
                                Delivered
                              </span>
                              {activeStep === 3 && (
                                <span className="text-[9px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Completed
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-navy-deep/60 mt-0.5">Package delivered to address</p>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Horizontal Timeline (>= 640px) */}
                      <div className="hidden sm:block">
                        <div className="relative flex items-center justify-between px-6">
                          {/* Background line centered on 40px circle top-5 (20px down) */}
                          <div className="absolute left-10 right-10 top-5 -translate-y-1/2 h-1 bg-gray-100 rounded-full z-0" />
                          {/* Active progress line */}
                          <div
                            className="absolute left-10 top-5 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-700"
                            style={{
                              width: activeStep === 1 ? "0%" : activeStep === 2 ? "50%" : "calc(100% - 5rem)",
                            }}
                          />

                          {/* Step 1: Processing */}
                          <div className="flex flex-col items-center gap-2 relative z-10 w-24">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                activeStep >= 1
                                  ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                  : "bg-white border-border text-navy-deep/40"
                              }`}
                            >
                              <Clock className="h-5 w-5" />
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider text-center ${activeStep >= 1 ? "text-navy-deep" : "text-navy-deep/40"}`}>
                              Processing
                            </span>
                          </div>

                          {/* Step 2: Shipped */}
                          <div className="flex flex-col items-center gap-2 relative z-10 w-24">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                activeStep >= 2
                                  ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                  : "bg-white border-border text-navy-deep/40"
                              }`}
                            >
                              <Truck className="h-5 w-5" />
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider text-center ${activeStep >= 2 ? "text-navy-deep" : "text-navy-deep/40"}`}>
                              Shipped
                            </span>
                          </div>

                          {/* Step 3: Delivered */}
                          <div className="flex flex-col items-center gap-2 relative z-10 w-24">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                activeStep >= 3
                                  ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                  : "bg-white border-border text-navy-deep/40"
                              }`}
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider text-center ${activeStep >= 3 ? "text-navy-deep" : "text-navy-deep/40"}`}>
                              Delivered
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Processing / Preparation Message when no tracking ID is present yet */}
                  {!trackedOrder.trackingId && trackedOrder.status === "Processing" && (
                    <div className="bg-[#fcf8e3]/60 border border-yellow-100 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-left">
                      <Clock className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest block mb-0.5">Fulfillment Status</span>
                        <p className="text-sm font-semibold text-navy-deep">Order is being packed</p>
                        <p className="text-xs text-navy-deep/60 mt-1 leading-relaxed">
                          We are preparing your items for shipment. A tracking link will appear here as soon as the package is handed over to the courier partner.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tracking ID details block */}
                  {trackedOrder.trackingId && trackedOrder.status !== "Processing" && (
                    <div className="bg-[#f0f9ff]/70 border border-blue-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                      <div className="space-y-1 w-full sm:w-auto">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Amazon Shipping AWB</span>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-base sm:text-lg text-navy-deep tracking-wide">{trackedOrder.trackingId}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(trackedOrder.trackingId || "");
                              toast.success("Tracking ID copied to clipboard!");
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer bg-transparent border-none p-0 touch-manipulation"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <a
                        href={`https://track.amazon.in/tracking/${trackedOrder.trackingId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/15 cursor-pointer touch-manipulation"
                      >
                        <Truck className="h-4 w-4 shrink-0" /> Track on Amazon Shipping
                      </a>
                    </div>
                  )}
                </div>

                {/* Delivery Information & Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {/* Shipping Address & Customer */}
                  <div className="bg-white p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-border/40 shadow-sm space-y-4">
                    <h3 className="text-xs sm:text-sm font-bold text-navy-deep uppercase tracking-wider border-b border-border/30 pb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gold shrink-0" /> Shipping Information
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-3 text-navy-deep/80">
                        <User className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-semibold text-navy-deep break-words">{trackedOrder.customerName}</p>
                          <p className="text-xs text-navy-deep/50 break-all">{trackedOrder.customerEmail}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-navy-deep/80">
                        <Phone className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                        <span className="break-all">{trackedOrder.customerPhone}</span>
                      </div>
                      <div className="flex gap-3 text-navy-deep/80">
                        <MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                        <span className="leading-relaxed break-words">{trackedOrder.shippingAddress}</span>
                      </div>
                      <div className="flex gap-3 text-navy-deep/80 pt-2 border-t border-border/20">
                        <CreditCard className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                        <span className="font-medium text-navy-deep/70 text-xs sm:text-sm">
                          {trackedOrder.paymentStatus === "Paid" ? "Paid via Online Payment" : "Cash on Delivery (Pending - COD)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Summary */}
                  <div className="bg-white p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-border/40 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-navy-deep uppercase tracking-wider border-b border-border/30 pb-3 mb-4 flex items-center gap-2">
                        <Package className="h-4 w-4 text-gold shrink-0" /> Items Purchased
                      </h3>
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {trackedOrder.items.map((item, index) => (
                          <div key={index} className="flex gap-3 items-center">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-11 h-11 sm:w-10 sm:h-10 object-cover rounded-lg bg-secondary border border-border/30 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-navy-deep truncate">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-navy-deep/60 font-medium">
                                Qty: {item.quantity} {item.color && item.color !== "Standard" && `| ${item.color}`}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-navy-deep whitespace-nowrap">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-border/30 pt-4 space-y-2 mt-4">
                      <div className="flex justify-between text-xs text-navy-deep/60 font-semibold">
                        <span>Subtotal</span>
                        <span>₹{trackedOrder.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-navy-deep/60 font-semibold">
                        <span>Shipping</span>
                        <span>{trackedOrder.shipping === 0 ? "Free" : `₹${trackedOrder.shipping}`}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-navy-deep pt-2 border-t border-border/20">
                        <span>Total Paid</span>
                        <span className="text-gold">₹{trackedOrder.total.toLocaleString()}</span>
                      </div>
                      {trackedOrder.status === "Processing" && (
                        <button
                          onClick={() => handleCancelOrderClick(trackedOrder.id)}
                          className="w-full mt-3 bg-red-50 hover:bg-red-100 active:scale-[0.98] text-red-600 border border-red-200/60 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer touch-manipulation"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-dashed border-red-200 bg-red-50/20 text-center py-10 sm:py-12">
                <Package className="h-12 w-12 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-navy-deep">Order Not Found</h3>
                <p className="text-navy-deep/60 text-xs max-w-xs mx-auto mt-1 leading-relaxed">
                  We couldn't find any order matching "{searchQuery}". Please check your order confirmation email or SMS and try again.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-border/40 shadow-sm">
          <h3 className="font-semibold text-base sm:text-lg text-navy-deep mb-3 flex items-center gap-2">
            <Truck className="h-5 w-5 text-gold shrink-0" /> How order tracking works
          </h3>
          <div className="space-y-3 text-xs sm:text-sm text-navy-deep/60 font-light leading-relaxed">
            <p>1. Locate your <strong>Order ID</strong> (e.g. ISH-123456) in your order confirmation email or order summary page.</p>
            <p>2. Enter your Order ID into the box above and tap <strong>Track Now</strong>.</p>
            <p>
              3. For help with tracking or delivery queries, contact our support team at{" "}
              <a href="mailto:support.iesvra@gmail.com" className="font-semibold text-navy-deep underline hover:text-gold transition-colors">
                support.iesvra@gmail.com
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
