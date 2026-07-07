import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Package, Search, Truck, CheckCircle2, Clock, MapPin, Phone, User, Calendar, CreditCard } from "lucide-react";
import { getOrderById, Order } from "@/lib/orders";
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
  const { orderId: queryOrderId } = Route.useSearch();
  const [searchQuery, setSearchQuery] = useState(queryOrderId || "");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (queryOrderId) {
      const found = getOrderById(queryOrderId);
      setTrackedOrder(found);
      setHasSearched(true);
      if (!found) {
        toast.error("Order not found. Please double check your Order ID.");
      }
    }
  }, [queryOrderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter an Order ID.");
      return;
    }
    const found = getOrderById(searchQuery.trim());
    setTrackedOrder(found);
    setHasSearched(true);
    if (!found) {
      toast.error("Order not found. Please check the spelling.");
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
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border focus:border-gold focus:ring-1 focus:ring-gold outline-none text-sm transition-all"
                />
                <Package className="absolute left-4 top-3.5 h-5 w-5 text-navy-deep/40" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-navy-deep text-gold h-12 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gold hover:text-navy-deep transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-navy-deep/10 cursor-pointer animate-pulse-subtle"
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

                  {/* Visual Progress Bar */}
                  <div className="py-6">
                    <div className="relative flex items-center justify-between">
                      {/* Background line */}
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full z-0" />
                      {/* Active progress line */}
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gold rounded-full z-0 transition-all duration-700"
                        style={{
                          width: activeStep === 1 ? "0%" : activeStep === 2 ? "50%" : "100%",
                        }}
                      />

                      {/* Step 1: Processing */}
                      <div className="flex flex-col items-center gap-2 relative z-10">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            activeStep >= 1
                              ? "bg-gold border-gold text-navy-deep shadow-md shadow-gold/20"
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
                              ? "bg-gold border-gold text-navy-deep shadow-md shadow-gold/20"
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
                              ? "bg-gold border-gold text-navy-deep shadow-md shadow-gold/20"
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
                        <span className="font-medium text-navy-deep/60">Cash on Delivery (COD)</span>
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
