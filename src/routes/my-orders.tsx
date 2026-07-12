import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCurrentUser, logoutUser } from "@/lib/auth";
import { useOrdersList, cancelOrder } from "@/lib/orders";
import { useEffect, useState } from "react";
import {
  Package,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  LogOut,
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/my-orders")({
  head: () => ({
    meta: [
      { title: "My Orders - IESVRA" },
      { name: "description", content: "View all your IESVRA orders in one place." },
    ],
  }),
  component: MyOrdersPage,
});

const statusConfig = {
  Processing: {
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
    bar: "bg-amber-400",
    step: 1,
  },
  Shipped: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Truck,
    bar: "bg-blue-400",
    step: 2,
  },
  Delivered: {
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
    bar: "bg-green-500",
    step: 3,
  },
  Cancelled: {
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
    bar: "bg-red-400",
    step: 0,
  },
  "Cancelled - Refund Pending": {
    color: "bg-red-100 text-red-700 border-red-200",
    icon: Clock,
    bar: "bg-red-400",
    step: 0,
  },
};

function MyOrdersPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const allOrders = useOrdersList();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCancelOrderClick = async (orderId: string) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
    if (confirmCancel) {
      try {
        const success = await cancelOrder(orderId);
        if (success) {
          toast.success("Order cancelled successfully!");
        } else {
          toast.error("Failed to cancel order.");
        }
      } catch (e) {
        toast.error("An error occurred while cancelling your order.");
      }
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (user === null) {
      toast.error("Please log in to view your orders.");
      navigate({ to: "/login" });
    }
  }, [user, navigate]);

  if (!user) return null;

  // Filter orders by logged-in user email (case-insensitive)
  const myOrders = allOrders.filter(
    (o) => o.customerEmail.toLowerCase() === user.email.toLowerCase()
  );

  const handleLogout = () => {
    logoutUser();
    toast.success("Logged out successfully.");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Header Banner */}
      <div className="bg-navy-deep text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-white/60 hover:text-gold transition-colors text-sm font-medium mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <User className="h-7 w-7 text-gold" />
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                  My Orders
                </h1>
                <p className="text-white/50 text-sm mt-0.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
        {myOrders.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-full bg-gold/5 border-2 border-gold/10 flex items-center justify-center mb-6">
              <ShoppingBag className="h-10 w-10 text-gold/30" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-navy-deep mb-3">
              No orders yet
            </h2>
            <p className="text-navy-deep/50 text-sm max-w-sm mb-8">
              You haven't placed any orders with{" "}
              <span className="font-semibold text-navy-deep">{user.email}</span> yet.
              Start shopping and your orders will appear here!
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-primary/95 transition-all duration-300 shadow-lg shadow-primary/10"
            >
              <Package className="h-4 w-4" />
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-navy-deep/60 font-medium">
              Showing <span className="font-bold text-navy-deep">{myOrders.length}</span>{" "}
              {myOrders.length === 1 ? "order" : "orders"} for your account
            </p>

            {myOrders.map((order) => {
              const cfg = statusConfig[order.status];
              const StatusIcon = cfg.icon;
              const isExpanded = expandedId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  {/* Order Header Row */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="w-full text-left p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gold/5 border border-gold/20 flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5 text-gold" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-navy-deep text-sm font-mono tracking-wide">
                            #{order.id}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.color}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-navy-deep/50 font-medium">
                          Placed on {order.date} ·{" "}
                          {order.items.reduce((s, i) => s + i.quantity, 0)} item
                          {order.items.reduce((s, i) => s + i.quantity, 0) !== 1
                            ? "s"
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8">
                      <div className="text-right">
                        <p className="text-[10px] text-navy-deep/50 uppercase tracking-wider font-semibold">
                          Total
                        </p>
                        <p className="font-bold text-navy-deep text-lg">
                          ₹{order.total.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-navy-deep/40 group-hover:text-gold transition-colors">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Order Details */}
                  {isExpanded && (
                    <div className="border-t border-border/40 p-5 sm:p-6 space-y-6 bg-[#fafaf9]">
                      {/* Progress Tracker */}
                      {order.status === 'Cancelled' || order.status === 'Cancelled - Refund Pending' ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                          <XCircle className="h-5 w-5 shrink-0" />
                          <div>
                            <p className="font-semibold text-sm">Order Cancelled</p>
                            <p className="text-xs text-red-600/90">
                              {order.status === 'Cancelled - Refund Pending' 
                                ? "This order has been cancelled. Your refund is being processed to your original payment method."
                                : "This order has been cancelled successfully."}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-navy-deep/50 mb-3">
                            Order Progress
                          </p>
                          <div className="flex items-center gap-0">
                            {(["Processing", "Shipped", "Delivered"] as const).map(
                              (step, idx) => {
                                const stepCfg = statusConfig[step];
                                const StepIcon = stepCfg.icon;
                                const isActive = cfg.step >= idx + 1;
                                const isLast = idx === 2;
                                return (
                                  <div key={step} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center gap-1.5 w-full">
                                      <div
                                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                                          isActive
                                            ? "bg-primary border-primary text-white"
                                            : "bg-white border-border/50 text-navy-deep/30"
                                        }`}
                                      >
                                        <StepIcon className="h-4 w-4" />
                                      </div>
                                      <span
                                        className={`text-[10px] font-semibold uppercase tracking-wide text-center ${
                                          isActive ? "text-navy-deep" : "text-navy-deep/30"
                                        }`}
                                      >
                                        {step}
                                      </span>
                                    </div>
                                    {!isLast && (
                                      <div
                                        className={`h-0.5 flex-1 -mt-5 mx-1 rounded-full transition-all ${
                                          cfg.step >= idx + 2 ? "bg-primary" : "bg-border/50"
                                        }`}
                                      />
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}

                      {/* Items */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-navy-deep/50 mb-3">
                          Items Ordered
                        </p>
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div
                              key={`${item.id}-${item.color}`}
                              className="flex items-center gap-4 bg-white rounded-xl border border-border/40 p-3"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-14 h-14 object-contain rounded-lg bg-[#f4f2ef] p-1 shrink-0 border border-border/30"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-navy-deep line-clamp-1">
                                  {item.name}
                                </p>
                                <p className="text-xs text-navy-deep/50 mt-0.5">
                                  {item.color} · Qty: {item.quantity}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-navy-deep text-sm">
                                  ₹{(item.price * item.quantity).toLocaleString()}
                                </p>
                                <p className="text-[10px] text-navy-deep/40">
                                  ₹{item.price.toLocaleString()} each
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery & Pricing */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Delivery info */}
                        <div className="bg-white rounded-xl border border-border/40 p-4 space-y-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-navy-deep/50 mb-3">
                            Delivery Details
                          </p>
                          <div className="flex items-start gap-2 text-sm">
                            <User className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                            <span className="text-navy-deep font-medium">
                              {order.customerName}
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                            <span className="text-navy-deep/70">{order.customerEmail}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                            <span className="text-navy-deep/70">{order.customerPhone}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                            <span className="text-navy-deep/70">{order.shippingAddress}</span>
                          </div>
                        </div>

                        {/* Price summary */}
                        <div className="bg-white rounded-xl border border-border/40 p-4 space-y-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-navy-deep/50 mb-3">
                            Price Summary
                          </p>
                          <div className="flex justify-between text-sm">
                            <span className="text-navy-deep/60">Subtotal</span>
                            <span className="font-medium text-navy-deep">
                              ₹{order.subtotal.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-navy-deep/60">Shipping</span>
                            <span className="font-medium text-navy-deep">
                              {order.shipping === 0 ? (
                                <span className="text-green-600 font-semibold">FREE</span>
                              ) : (
                                `₹${order.shipping}`
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-base font-bold border-t border-border/40 pt-3 mt-1">
                            <span className="text-navy-deep">Total Paid</span>
                            <span className="text-gold">₹{order.total.toLocaleString()}</span>
                          </div>
                          {order.status === 'Processing' && (
                            <button
                              onClick={() => handleCancelOrderClick(order.id)}
                              className="w-full mt-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
