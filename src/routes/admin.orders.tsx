import { createFileRoute } from "@tanstack/react-router";
import { 
  PackageOpen, 
  Clock, 
  Truck, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  ShoppingBag, 
  XCircle, 
  Search, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  Filter, 
  RotateCcw, 
  DollarSign, 
  SlidersHorizontal,
  AlertTriangle,
  X
} from "lucide-react";
import { useOrdersList, updateOrderStatus, updateOrderTracking, deleteOrder, Order } from "@/lib/orders";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [{ title: "Manage Orders - Admin" }],
  }),
  component: AdminOrders,
});

function AdminOrders() {
  const { orders, isLoading } = useOrdersList();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingTracking, setEditingTracking] = useState<Record<string, string>>({});
  
  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>("all_active");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // Delete Modal State
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status badge counts
  const counts = useMemo(() => {
    const active = orders.filter(o => o.status !== "Archived");
    const processing = orders.filter(o => o.status === "Processing");
    const shipped = orders.filter(o => o.status === "Shipped");
    const delivered = orders.filter(o => o.status === "Delivered");
    const cancelled = orders.filter(o => o.status === "Cancelled" || o.status === "Cancelled - Refund Pending");
    const archived = orders.filter(o => o.status === "Archived");
    const totalRev = orders.filter(o => o.status !== "Cancelled" && o.status !== "Cancelled - Refund Pending").reduce((acc, o) => acc + o.total, 0);

    return {
      all: orders.length,
      active: active.length,
      processing: processing.length,
      shipped: shipped.length,
      delivered: delivered.length,
      cancelled: cancelled.length,
      archived: archived.length,
      totalRevenue: totalRev,
    };
  }, [orders]);

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Status tab filtering
        if (selectedStatusTab === "all_active") {
          if (order.status === "Archived") return false;
        } else if (selectedStatusTab === "Processing") {
          if (order.status !== "Processing") return false;
        } else if (selectedStatusTab === "Shipped") {
          if (order.status !== "Shipped") return false;
        } else if (selectedStatusTab === "Delivered") {
          if (order.status !== "Delivered") return false;
        } else if (selectedStatusTab === "Cancelled") {
          if (order.status !== "Cancelled" && order.status !== "Cancelled - Refund Pending") return false;
        } else if (selectedStatusTab === "Archived") {
          if (order.status !== "Archived") return false;
        } else if (selectedStatusTab === "all") {
          // Show everything including archived
        }

        // Source filter
        if (sourceFilter !== "all") {
          if (sourceFilter === "mobile" && order.source !== "mobile") return false;
          if (sourceFilter === "website" && order.source === "mobile") return false;
        }

        // Payment filter
        if (paymentFilter !== "all") {
          if (paymentFilter === "Paid" && order.paymentStatus !== "Paid") return false;
          if (paymentFilter === "Pending" && order.paymentStatus === "Paid") return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = (order.id || "").toLowerCase().includes(q);
          const matchName = (order.customerName || "").toLowerCase().includes(q);
          const matchEmail = (order.customerEmail || "").toLowerCase().includes(q);
          const matchPhone = (order.customerPhone || "").toLowerCase().includes(q);
          const matchAwb = (order.trackingId || "").toLowerCase().includes(q);
          const matchItem = (order.items || []).some(item => (item.name || "").toLowerCase().includes(q));
          if (!matchId && !matchName && !matchEmail && !matchPhone && !matchAwb && !matchItem) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
        }
        if (sortBy === "amount_high") {
          return b.total - a.total;
        }
        if (sortBy === "amount_low") {
          return a.total - b.total;
        }
        return 0;
      });
  }, [orders, selectedStatusTab, sourceFilter, paymentFilter, searchQuery, sortBy]);

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await deleteOrder(orderToDelete);
      toast.success(`Order #${orderToDelete} permanently deleted.`);
      if (expandedOrderId === orderToDelete) {
        setExpandedOrderId(null);
      }
      setOrderToDelete(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete order.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchiveToggle = async (order: Order, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isCurrentlyArchived = order.status === "Archived";
    const nextStatus = isCurrentlyArchived ? "Processing" : "Archived";
    try {
      await updateOrderStatus(order.id, nextStatus);
      if (isCurrentlyArchived) {
        toast.success(`Order #${order.id} restored to Active Processing.`);
      } else {
        toast.success(`Order #${order.id} archived successfully.`);
      }
    } catch (e) {
      toast.error("Failed to update archive status.");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const handleStatusChange = async (orderId: string, status: Order["status"]) => {
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
        return "bg-yellow-50 text-yellow-700 border-yellow-200/60";
      case "Shipped":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "Delivered":
        return "bg-green-50 text-green-700 border-green-200/60";
      case "Cancelled":
      case "Cancelled - Refund Pending":
        return "bg-red-50 text-red-700 border-red-200/60";
      case "Archived":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200/60";
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
      case "Archived":
        return <Archive className="h-3.5 w-3.5 text-gray-500" />;
      default:
        return null;
    }
  };

  const hasActiveFilters = searchQuery !== "" || selectedStatusTab !== "all_active" || sourceFilter !== "all" || paymentFilter !== "all" || sortBy !== "newest";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedStatusTab("all_active");
    setSourceFilter("all");
    setPaymentFilter("all");
    setSortBy("newest");
  };

  return (
    <div className="space-y-6 font-sans text-navy-deep pb-12">
      {/* Page Title & Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-navy-deep">Orders Management</h2>
          <p className="text-navy-deep/60 mt-1 text-sm">Review, track, filter, archive, and fulfill customer orders.</p>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-border/60 rounded-xl px-3.5 py-2.5 shadow-xs">
            <span className="text-[11px] font-bold text-navy-deep/50 uppercase tracking-wider block">Active Orders</span>
            <span className="text-lg font-extrabold text-navy-deep">{counts.active}</span>
          </div>
          <div className="bg-yellow-50/70 border border-yellow-200/60 rounded-xl px-3.5 py-2.5 shadow-xs">
            <span className="text-[11px] font-bold text-yellow-700/80 uppercase tracking-wider block">Processing</span>
            <span className="text-lg font-extrabold text-yellow-800">{counts.processing}</span>
          </div>
          <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl px-3.5 py-2.5 shadow-xs">
            <span className="text-[11px] font-bold text-blue-700/80 uppercase tracking-wider block">Shipped</span>
            <span className="text-lg font-extrabold text-blue-800">{counts.shipped}</span>
          </div>
          <div className="bg-green-50/70 border border-green-200/60 rounded-xl px-3.5 py-2.5 shadow-xs">
            <span className="text-[11px] font-bold text-green-700/80 uppercase tracking-wider block">Revenue</span>
            <span className="text-lg font-extrabold text-green-800">₹{counts.totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-border/50 p-4 space-y-4">
        {/* Status Tabs with Badge Counts */}
        <div className="flex flex-wrap gap-2 border-b border-border/40 pb-3">
          <button
            onClick={() => setSelectedStatusTab("all_active")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedStatusTab === "all_active"
                ? "bg-navy-deep text-white shadow-xs"
                : "bg-secondary/20 hover:bg-secondary/40 text-navy-deep/70"
            }`}
          >
            All Active
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedStatusTab === "all_active" ? "bg-white/20 text-white" : "bg-navy-deep/10 text-navy-deep"}`}>
              {counts.active}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatusTab("Processing")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedStatusTab === "Processing"
                ? "bg-yellow-500 text-white shadow-xs"
                : "bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200/60"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Processing
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedStatusTab === "Processing" ? "bg-white/20 text-white" : "bg-yellow-200/60 text-yellow-900"}`}>
              {counts.processing}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatusTab("Shipped")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedStatusTab === "Shipped"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/60"
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            Shipped
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedStatusTab === "Shipped" ? "bg-white/20 text-white" : "bg-blue-200/60 text-blue-900"}`}>
              {counts.shipped}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatusTab("Delivered")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedStatusTab === "Delivered"
                ? "bg-green-600 text-white shadow-xs"
                : "bg-green-50 hover:bg-green-100 text-green-800 border border-green-200/60"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Delivered
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedStatusTab === "Delivered" ? "bg-white/20 text-white" : "bg-green-200/60 text-green-900"}`}>
              {counts.delivered}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatusTab("Cancelled")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedStatusTab === "Cancelled"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-red-50 hover:bg-red-100 text-red-800 border border-red-200/60"
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancelled
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedStatusTab === "Cancelled" ? "bg-white/20 text-white" : "bg-red-200/60 text-red-900"}`}>
              {counts.cancelled}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatusTab("Archived")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ml-auto ${
              selectedStatusTab === "Archived"
                ? "bg-gray-800 text-white shadow-xs"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            Archived
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedStatusTab === "Archived" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-800"}`}>
              {counts.archived}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatusTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedStatusTab === "all"
                ? "bg-navy-deep text-white shadow-xs"
                : "text-navy-deep/60 hover:text-navy-deep hover:bg-secondary/10"
            }`}
          >
            View All ({counts.all})
          </button>
        </div>

        {/* Search Bar & Sub-Filters Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-deep/40" />
            <input
              type="text"
              placeholder="Search by Order ID, Customer Name, Email, Phone, AWB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-border/70 rounded-xl text-xs font-medium focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-deep/40 hover:text-navy-deep p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Source Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-navy-deep/50 shrink-0">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="border border-border/70 text-xs rounded-xl px-2.5 py-2 bg-white font-medium focus:border-gold outline-none cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="website">🌐 Website</option>
              <option value="mobile">📱 Mobile App</option>
            </select>
          </div>

          {/* Payment Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-navy-deep/50 shrink-0">Payment:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="border border-border/70 text-xs rounded-xl px-2.5 py-2 bg-white font-medium focus:border-gold outline-none cursor-pointer"
            >
              <option value="all">All Payments</option>
              <option value="Paid">🟢 Paid Online</option>
              <option value="Pending">🟠 Pending COD</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-navy-deep/50 shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-border/70 text-xs rounded-xl px-2.5 py-2 bg-white font-medium focus:border-gold outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Amount: High → Low</option>
              <option value="amount_low">Amount: Low → High</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-bold px-2.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-border/40 p-16 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 bg-secondary/30 rounded-full flex items-center justify-center mb-3">
            <PackageOpen className="h-8 w-8 text-gold" />
          </div>
          <h3 className="text-lg font-bold text-navy-deep mb-1">No Orders Match Your Filters</h3>
          <p className="text-navy-deep/60 max-w-sm text-xs mb-4">
            {hasActiveFilters ? "Try clearing or adjusting your search and filter parameters." : "No orders found in the database."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-navy-deep hover:bg-navy-deep/90 text-gold text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-border/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/20 border-b border-border/40 text-navy-deep/70 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Delivery Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const isArchived = order.status === "Archived";

                  return (
                    <React.Fragment key={order.id}>
                      <tr className={`hover:bg-secondary/5 transition-colors ${isArchived ? "bg-gray-50/70 opacity-80" : ""}`}>
                        <td className="p-4 font-bold font-mono text-navy-deep">
                          <div className="flex items-center gap-1.5">
                            <span>{order.id}</span>
                            {isArchived && (
                              <span className="bg-gray-200 text-gray-700 text-[9px] font-bold px-1.5 py-0.2 rounded font-sans uppercase">
                                Archived
                              </span>
                            )}
                          </div>
                          {order.trackingId && (
                            <div className="text-[10px] text-navy-deep/50 mt-0.5 font-semibold normal-case font-sans">
                              AWB: <span className="font-mono text-gold font-bold text-xs">{order.trackingId}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            order.source === 'mobile'
                              ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                              : 'bg-purple-50 text-purple-700 border-purple-200/60'
                          }`}>
                            {order.source === 'mobile' ? '📱 Mobile App' : '🌐 Website'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold">{order.customerName}</div>
                          <div className="text-xs text-navy-deep/50">{order.customerEmail}</div>
                        </td>
                        <td className="p-4 font-medium text-xs text-navy-deep/80 whitespace-nowrap">
                          {order.date}
                        </td>
                        <td className="p-4 font-bold text-navy-deep">
                          ₹{order.total.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            order.paymentStatus === 'Paid'
                              ? 'bg-green-50 text-green-700 border-green-200/50'
                              : 'bg-orange-50 text-orange-700 border-orange-200/50'
                          }`}>
                            {order.paymentStatus || 'Pending - COD'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                              className="border border-border/60 text-xs rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-gold cursor-pointer font-medium"
                            >
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                              <option value="Cancelled - Refund Pending">Cancelled - Refund</option>
                              <option value="Archived">Archived</option>
                            </select>
                          </div>
                        </td>

                        {/* Quick Action Buttons Column */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Archive / Restore Button */}
                            <button
                              onClick={(e) => handleArchiveToggle(order, e)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isArchived
                                  ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 hover:border-amber-300"
                                  : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-300 hover:text-navy-deep"
                              }`}
                              title={isArchived ? "Restore to Active Orders" : "Archive this Order"}
                            >
                              {isArchived ? (
                                <ArchiveRestore className="h-4 w-4 text-amber-700" />
                              ) : (
                                <Archive className="h-4 w-4" />
                              )}
                            </button>

                            {/* Direct Row Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOrderToDelete(order.id);
                              }}
                              className="p-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 hover:border-red-500 rounded-lg transition-all cursor-pointer shadow-2xs"
                              title="Delete Order Permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                            {/* Expand Details Arrow */}
                            <button
                              onClick={() => toggleExpand(order.id)}
                              className="p-1.5 text-navy-deep/60 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors cursor-pointer"
                              title="View Order Details"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Order Detail Drawer */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-secondary/10 p-6 border-b border-border/40">
                            <div className="grid md:grid-cols-3 gap-8 animate-in slide-in-from-top-2 duration-200">
                              {/* Shipping Address */}
                              <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-deep/60 border-b border-border/20 pb-2 flex items-center gap-2">
                                  <User className="h-4 w-4 text-gold" /> Shipping Details
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
                                        <MapPin className="h-3 w-3 shrink-0" /> View on Google Maps
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="mt-2.5 pt-2.5 border-t border-border/20 text-[10px] text-navy-deep/40 italic">
                                      No map location pinned
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Items Purchased */}
                              <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-deep/60 border-b border-border/20 pb-2 flex items-center gap-2">
                                  <ShoppingBag className="h-4 w-4 text-gold" /> Items Purchased ({order.items.length})
                                </h4>
                                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-3 text-xs bg-white/60 p-2 rounded-lg border border-border/30">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="h-9 w-9 object-cover rounded bg-white border border-border/20 shrink-0"
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
                                <div className="border-t border-border/30 pt-3 space-y-1.5 text-xs font-bold text-navy-deep">
                                  <div className="flex justify-between items-center text-navy-deep/60">
                                    <span>Payment Status:</span>
                                    <span className={order.paymentStatus === 'Paid' ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'}>
                                      {order.paymentStatus === 'Paid' ? 'Paid via Razorpay' : 'Cash on Delivery (Pending)'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center border-t border-border/20 pt-2 font-bold text-sm">
                                    <span>Total Amount Due:</span>
                                    <span className="text-gold">₹{order.total.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Shipment & Actions */}
                              <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-deep/60 border-b border-border/20 pb-2 flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-gold" /> Shipment Tracking & Actions
                                </h4>
                                <div className="bg-white p-4 rounded-xl border border-border/30 shadow-xs space-y-3">
                                  <div className="text-xs">
                                    <span className="font-semibold text-navy-deep/50 block mb-1">Carrier:</span>
                                    <span className="font-bold text-navy-deep">Amazon Shipping / Delhivery</span>
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
                                        placeholder="Paste AWB tracking ID..."
                                        value={editingTracking[order.id] !== undefined ? editingTracking[order.id] : (order.trackingId || "")}
                                        onChange={(e) => setEditingTracking(prev => ({ ...prev, [order.id]: e.target.value }))}
                                        className="h-8 px-2 border border-border/60 rounded text-xs font-semibold focus:ring-1 focus:ring-gold outline-none flex-1 font-mono"
                                      />
                                      <button
                                        onClick={() => handleTrackingSave(order.id)}
                                        className="px-3 h-8 bg-navy-deep hover:bg-gold text-gold hover:text-navy-deep text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Quick Actions Row in drawer */}
                                  <div className="pt-3 border-t border-border/30 mt-3 flex items-center justify-between gap-2">
                                    <button
                                      onClick={(e) => handleArchiveToggle(order, e)}
                                      className="px-2.5 py-1.5 text-[11px] font-bold border border-border rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                      {isArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                                      {isArchived ? "Restore to Active" : "Archive Order"}
                                    </button>

                                    <button
                                      onClick={() => setOrderToDelete(order.id)}
                                      className="px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </button>
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

      {/* Confirmation Modal for Permanent Order Deletion */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-border/60 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-navy-deep text-lg">Permanently Delete Order?</h3>
                <p className="text-xs text-navy-deep/60">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-navy-deep/80 leading-relaxed bg-secondary/10 p-3 rounded-xl border border-border/30">
              Are you sure you want to permanently delete <strong className="font-mono text-navy-deep font-bold">Order #{orderToDelete}</strong> from the database? All customer and shipment records for this order will be erased.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-border/80 text-xs font-bold text-navy-deep/70 hover:bg-secondary/20 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteOrder}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
