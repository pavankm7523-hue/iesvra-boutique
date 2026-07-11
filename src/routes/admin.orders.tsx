import { createFileRoute } from "@tanstack/react-router";
import { PackageOpen, Clock, Truck, CheckCircle2, ChevronDown, ChevronUp, User, MapPin, Phone, Mail, ShoppingBag, XCircle } from "lucide-react";
import { useOrdersList, updateOrderStatus, updateOrderTracking, Order } from "@/lib/orders";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [{ title: "Manage Orders - Admin" }],
  }),
  component: AdminOrders,
});

function AdminOrders() {
  const orders = useOrdersList();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingTracking, setEditingTracking] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const handleStatusChange = async (orderId: string, status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Cancelled - Refund Pending') => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order ${orderId} status updated to ${status}`);
    } catch (e) {
      toast.error("Failed to update status.");
    }
  };

  const handleTrackingSave = async (orderId: string) => {
    const val = editingTracking[orderId];
    if (val === undefined) {
      toast.error("No changes to tracking ID.");
      return;
    }
    try {
      await updateOrderTracking(orderId, val.trim());
      toast.success(`Tracking ID updated for order ${orderId}`);
    } catch (e) {
      toast.error("Failed to update tracking ID.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Processing":
        return "bg-yellow-50 text-yellow-700 border-yellow-200/50";
      case "Shipped":
        return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "Delivered":
        return "bg-green-50 text-green-700 border-green-200/50";
      case "Cancelled":
      case "Cancelled - Refund Pending":
        return "bg-red-50 text-red-700 border-red-200/50";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Processing":
        return <Clock className="h-3.5 w-3.5" />;
      case "Shipped":
        return <Truck className="h-3.5 w-3.5" />;
      case "Delivered":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "Cancelled":
      case "Cancelled - Refund Pending":
        return <XCircle className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 font-sans text-navy-deep">
      <div>
        <h2 className="text-3xl font-display font-bold text-navy-deep">Orders Management</h2>
        <p className="text-navy-deep/60 mt-1 text-sm">Review, track, and update customer order fulfillment states.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-border/40 p-16 flex flex-col items-center justify-center text-center">
          <div className="h-20 w-20 bg-secondary/30 rounded-full flex items-center justify-center mb-4">
            <PackageOpen className="h-10 w-10 text-gold animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-navy-deep mb-2">No Orders Yet</h3>
          <p className="text-navy-deep/60 max-w-sm text-sm">
            Once customers place orders on the store, their purchase summaries and details will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-border/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/20 border-b border-border/40 text-navy-deep/70 text-xs font-bold uppercase tracking-wider">
                  <th className="p-5">Order ID</th>
                  <th className="p-5">Customer</th>
                  <th className="p-5">Date</th>
                  <th className="p-5">Total</th>
                  <th className="p-5">Payment</th>
                  <th className="p-5">Delivery Status</th>
                  <th className="p-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-secondary/5 transition-colors">
                        <td className="p-5 font-bold font-mono text-navy-deep">
                          <div>{order.id}</div>
                          {order.trackingId && (
                            <div className="text-[10px] text-navy-deep/50 mt-1 font-semibold normal-case font-sans">
                              AWB: <span className="font-mono text-gold font-bold text-xs">{order.trackingId}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-5">
                          <div className="font-semibold">{order.customerName}</div>
                          <div className="text-xs text-navy-deep/50">{order.customerEmail}</div>
                        </td>
                        <td className="p-5 font-medium">
                          {order.date}
                        </td>
                        <td className="p-5 font-bold text-navy-deep">
                          ₹{order.total.toLocaleString()}
                        </td>
                        <td className="p-5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            order.paymentStatus === 'Paid'
                              ? 'bg-green-50 text-green-700 border-green-200/50'
                              : 'bg-orange-50 text-orange-700 border-orange-200/50'
                          }`}>
                            {order.paymentStatus || 'Pending - COD'}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                              className="border border-border/60 text-xs rounded px-2 py-1 bg-white focus:outline-none focus:border-gold cursor-pointer font-medium"
                            >
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                              <option value="Cancelled - Refund Pending">Cancelled - Refund Pending</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-5 text-right">
                          <button
                            onClick={() => toggleExpand(order.id)}
                            className="p-2 text-navy-deep/60 hover:text-gold hover:bg-gold/10 rounded-md transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Order detail section */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="bg-secondary/10 p-6 border-b border-border/40">
                            <div className="grid md:grid-cols-3 gap-8 animate-in slide-in-from-top-2 duration-200">
                              {/* Shipping summary */}
                              <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-deep/60 border-b border-border/20 pb-2 flex items-center gap-2">
                                  <User className="h-4 w-4 text-gold" /> Shipping Address
                                </h4>
                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-navy-deep/40 shrink-0" />
                                    <span className="font-semibold">{order.customerName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-navy-deep/40 shrink-0" />
                                    <span>{order.customerEmail}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 text-navy-deep/40 shrink-0" />
                                    <span>{order.customerPhone}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-navy-deep/40 shrink-0 mt-0.5" />
                                    <span>{order.shippingAddress}</span>
                                  </div>
                                  {order.latitude && order.longitude ? (
                                    <div className="mt-2.5 pt-2.5 border-t border-border/20 text-xs">
                                      <span className="font-semibold text-navy-deep/60 block mb-1">Pin Location:</span>
                                      <p className="font-mono text-[10px] text-navy-deep/75">{Number(order.latitude).toFixed(6)}, {Number(order.longitude).toFixed(6)}</p>
                                      <a
                                        href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-gold hover:underline font-bold mt-1 text-[11px] cursor-pointer"
                                      >
                                        <MapPin className="h-3 w-3 shrink-0" /> View on Map
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="mt-2.5 pt-2.5 border-t border-border/20 text-[10px] text-navy-deep/40 italic">
                                      No map location pinned
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Items list */}
                              <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-deep/60 border-b border-border/20 pb-2 flex items-center gap-2">
                                  <ShoppingBag className="h-4 w-4 text-gold" /> Items Purchased
                                </h4>
                                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="h-8 w-8 object-cover rounded bg-white border border-border/20 shrink-0"
                                        />
                                        <div className="min-w-0">
                                          <p className="font-semibold truncate">{item.name}</p>
                                          <p className="text-[10px] text-navy-deep/50">
                                            Qty: {item.quantity} {item.color && item.color !== "Standard" && `| Color: ${item.color}`}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="font-bold shrink-0">
                                        ₹{(item.price * item.quantity).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="border-t border-border/30 pt-3 space-y-2 text-xs font-bold text-navy-deep">
                                  <div className="flex justify-between items-center">
                                    <span>Payment Mode:</span>
                                    <span className={order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-600'}>
                                      {order.paymentStatus === 'Paid' ? 'Paid via Online Payment' : 'Cash on Delivery (Pending - COD)'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center border-t border-border/20 pt-2 font-bold text-sm">
                                    <span>Total Amount Due:</span>
                                    <span className="text-gold">₹{order.total.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Shipment Tracking Column */}
                              <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-deep/60 border-b border-border/20 pb-2 flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-gold" /> Shipment Tracking
                                </h4>
                                <div className="bg-white p-4 rounded-xl border border-border/30 shadow-xs space-y-3">
                                  <div className="text-xs">
                                    <span className="font-semibold text-navy-deep/50 block mb-1">Carrier:</span>
                                    <span className="font-bold text-navy-deep">Amazon Shipping</span>
                                  </div>
                                  <div className="text-xs">
                                    <span className="font-semibold text-navy-deep/50 block mb-1">Current AWB:</span>
                                    <span className="font-bold font-mono text-navy-deep bg-secondary/20 px-1.5 py-0.5 rounded text-[11px] break-all">{order.trackingId || "None"}</span>
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-navy-deep/60 uppercase">Update Tracking ID</label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        placeholder="Paste AWB number..."
                                        value={editingTracking[order.id] !== undefined ? editingTracking[order.id] : (order.trackingId || "")}
                                        onChange={(e) => setEditingTracking(prev => ({ ...prev, [order.id]: e.target.value }))}
                                        className="h-8 px-2 border border-border/60 rounded text-xs font-semibold focus:ring-1 focus:ring-gold outline-none flex-1 font-mono"
                                      />
                                      <button
                                        onClick={() => handleTrackingSave(order.id)}
                                        className="px-3 h-8 bg-navy-deep hover:bg-gold text-gold hover:text-navy-deep text-xs font-bold rounded transition-colors cursor-pointer"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// React.Fragment helper support since TanStack start might transpile TSX
import React from "react";
