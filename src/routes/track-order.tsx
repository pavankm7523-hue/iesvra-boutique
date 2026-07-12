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
      <div className="bg-navy-deep py-12 md:py-16 text-center px-4">
        <h1 className="font-display text-4xl md:text-5xl text-white mb-4">Track Your Order</h1>
        <p className="text-white/80 max-w-xl mx-auto text-sm md:text-base font-light">
          Enter your order ID or tracking number below to see the current status of your shipment.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-border/40">
          <form className="space-y-4" onSubmit={handleSearch}>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-deep/75">
                Order ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. ISH-123456"
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                />
                <Package className="absolute left-4 top-3.5 h-5 w-5 text-navy-deep/40" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white h-12 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-primary/95 transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-primary/10 cursor-pointer animate-pulse-subtle"
            >
              <Search className="h-4 w-4" /> Track Now
            </button>
          </form>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            {trackedOrder ? (
              <div className="space-y-8">
                {/* Order Information & Status Summary */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-border/40 shadow-sm space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/30 pb-4">
                    <div>
                      <span className="text-[10px] font-bold text-navy-deep/50 uppercase tracking-widest">
                        Order Details
                      </span>
                      <h2 className="text-xl font-bold text-navy-deep font-mono">
                        {trackedOrder.id}
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-navy-deep/50 uppercase tracking-widest block">
                        Order Placed
                      </span>
                      <span className="text-sm font-semibold text-navy-deep flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gold" /> {trackedOrder.date}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar or Cancelled Banner */}
                  {trackedOrder.status === 'Cancelled' || trackedOrder.status === 'Cancelled - Refund Pending' ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 my-4 text-left">
                      <XCircle className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Order Cancelled</p>
                        <p className="text-xs text-red-600/90">
                          {trackedOrder.status === 'Cancelled - Refund Pending' 
                            ? "This order has been cancelled. Your refund is being processed to your original payment method."
                            : "This order has been cancelled successfully."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6">
                      <div className="relative flex items-center justify-between">
                        {/* Background line */}
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full z-0" />
                        {/* Active progress line */}
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-700"
                          style={{
                            width: activeStep === 1 ? "0%" : activeStep === 2 ? "50%" : "100%",
                          }}
                        />

                        {/* Step 1: Processing */}
                        <div className="flex flex-col items-center gap-2 relative z-10">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              activeStep >= 1
                                ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                : "bg-white border-border text-navy-deep/40"
                            }`}
                          >
                            <Clock className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wider text-navy-deep">
                            Processing
                          </span>
                        </div>

                        {/* Step 2: Shipped */}
                        <div className="flex flex-col items-center gap-2 relative z-10">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              activeStep >= 2
                                ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                : "bg-white border-border text-navy-deep/40"
                            }`}
                          >
                            <Truck className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wider text-navy-deep">
                            Shipped
                          </span>
                        </div>

                        {/* Step 3: Delivered */}
                        <div className="flex flex-col items-center gap-2 relative z-10">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              activeStep >= 3
                                ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                : "bg-white border-border text-navy-deep/40"
                            }`}
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wider text-navy-deep">
                            Delivered
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Processing / Preparation Message when no tracking ID is present yet */}
                  {!trackedOrder.trackingId && trackedOrder.status === 'Processing' && (
                    <div className="bg-[#fcf8e3]/60 border border-yellow-100 rounded-2xl p-5 flex items-start gap-3 text-left">
                      <Clock className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest block mb-1">Fulfillment Status</span>
                        <p className="text-sm font-semibold text-navy-deep">Order is being packed</p>
                        <p className="text-xs text-navy-deep/60 mt-1">
                          We are preparing your items for shipment. A tracking link will appear here as soon as the package is handed over to the courier partner.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tracking ID details block */}
                  {trackedOrder.trackingId && trackedOrder.status !== 'Processing' && (
                    <div className="bg-[#f0f9ff]/60 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">Amazon Shipping AWB</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base text-navy-deep">{trackedOrder.trackingId}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(trackedOrder.trackingId || "");
                              toast.success("Tracking ID copied to clipboard!");
                            }}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer bg-transparent border-none p-0 animate-pulse-subtle"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <a
                        href={`https://track.amazon.in/tracking/${trackedOrder.trackingId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
                      >
                        <Truck className="h-4 w-4" /> Track on Amazon Shipping
                      </a>
                    </div>
                  )}
                </div>

                {/* Delivery Information & Items */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Shipping Address & Customer */}
                  <div className="bg-white p-6 md:p-8 rounded-3xl border border-border/40 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-navy-deep uppercase tracking-wider border-b border-border/30 pb-3">
                      Shipping Information
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-3 text-navy-deep/80">
                        <User className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-navy-deep">{trackedOrder.customerName}</p>
                          <p className="text-xs text-navy-deep/50">{trackedOrder.customerEmail}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-navy-deep/80">
                        <Phone className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                        <span>{trackedOrder.customerPhone}</span>
                      </div>
                      <div className="flex gap-3 text-navy-deep/80">
                        <MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                        <span>{trackedOrder.shippingAddress}</span>
                      </div>
                      <div className="flex gap-3 text-navy-deep/80 pt-2 border-t border-border/20">
                        <CreditCard className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                        <span className="font-medium text-navy-deep/60">
                          {trackedOrder.paymentStatus === 'Paid' ? 'Paid via Online Payment' : 'Cash on Delivery (Pending - COD)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Summary */}
                  <div className="bg-white p-6 md:p-8 rounded-3xl border border-border/40 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-navy-deep uppercase tracking-wider border-b border-border/30 pb-3 mb-4">
                        Items Purchased
                      </h3>
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                        {trackedOrder.items.map((item, index) => (
                          <div key={index} className="flex gap-3 items-center">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded-lg bg-secondary border border-border/30 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-navy-deep truncate">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-navy-deep/50 font-medium">
                                Qty: {item.quantity} {item.color && item.color !== "Standard" && `| Color: ${item.color}`}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-navy-deep">
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
                      <div className="flex justify-between text-sm font-bold text-navy-deep pt-1 border-t border-border/20">
                        <span>Total Paid</span>
                        <span className="text-gold">₹{trackedOrder.total.toLocaleString()}</span>
                      </div>
                      {trackedOrder.status === 'Processing' && (
                        <button
                          onClick={() => handleCancelOrderClick(trackedOrder.id)}
                          className="w-full mt-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-dashed border-red-200 bg-red-50/20 text-center py-12">
                <Package className="h-12 w-12 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-navy-deep">Order Not Found</h3>
                <p className="text-navy-deep/60 text-xs max-w-xs mx-auto mt-1">
                  We couldn't find any order matching the ID "{searchQuery}". Please check your order confirmation details and try again.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-border/40 shadow-sm">
          <h3 className="font-semibold text-lg text-navy-deep mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-gold" /> How it works
          </h3>
          <div className="space-y-4 text-xs md:text-sm text-navy-deep/60 font-light leading-relaxed">
            <p>1. Find your **Order ID** in the confirmation message/screen after your purchase.</p>
            <p>2. Enter it in the field above and click **Track Now**.</p>
            <p>
              3. If you have any issues tracking your order, please contact our support team at{" "}
              <span className="font-semibold text-navy-deep">support.iesvra@gmail.com</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
