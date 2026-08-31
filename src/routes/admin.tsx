import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft, LayoutDashboard, Settings, PackageOpen, ShieldAlert, Users, CreditCard, Receipt, Globe, Bell, MessageCircle, ShieldCheck, BarChart3, BadgePercent } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin Panel - IESVRA" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user: currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center p-6 text-center text-navy-deep font-sans">
        <div className="w-10 h-10 border-3 border-navy-deep/20 border-t-gold rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-wider text-navy-deep/60">Verifying administrator access...</p>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center p-6 text-center text-navy-deep font-sans">
        <div className="max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-border/40">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold font-display mb-2 text-navy-deep">Access Denied</h2>
          <p className="text-navy-deep/60 mb-8 text-sm leading-relaxed">
            You must be logged in with a system administrator account to view the admin panel dashboard.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-8 h-12 bg-primary text-white font-bold uppercase tracking-widest text-xs rounded-full hover:bg-primary/95 transition-all duration-300"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fb] min-h-screen flex text-navy-deep font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-deep text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </Link>
          <div className="mt-8">
            <h1 className="text-xl font-display font-bold tracking-widest uppercase">Admin Panel</h1>
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          <Link
            to="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-white text-sm font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
            activeOptions={{ exact: true }}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          
          <div className="pt-2 pb-1">
            <div className="flex items-center gap-3 px-3 py-2 text-white/60 text-xs font-bold uppercase tracking-wider">
              <PackageOpen className="h-3 w-3" />
              Order Management
            </div>
            <Link
              to="/admin/orders"
              className="flex items-center gap-3 px-3 py-2.5 ml-3 rounded-lg hover:bg-white/10 text-white/90 text-sm font-medium transition-colors"
              activeProps={{ className: "bg-white/10 text-gold" }}
            >
              Orders
            </Link>
            <Link
              to="/admin/returns"
              className="flex items-center gap-3 px-3 py-2.5 ml-3 rounded-lg hover:bg-white/10 text-white/90 text-sm font-medium transition-colors"
              activeProps={{ className: "bg-white/10 text-gold" }}
            >
              Returns & Refunds
            </Link>
          </div>

          <Link
            to="/admin/deals"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-white text-sm font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
          >
            <BadgePercent className="h-4 w-4" />
            Deals & coupons
          </Link>

          <Link
            to="/admin/customers"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-white text-sm font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
          >
            <Users className="h-4 w-4" />
            Customer management
          </Link>

          <Link
            to="/admin/payments"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-white text-sm font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
          >
            <CreditCard className="h-4 w-4" />
            Payment setting
          </Link>

          <Link
            to="/admin/taxes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-white text-sm font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
          >
            <Receipt className="h-4 w-4" />
            Gst & tax setting
          </Link>

          <Link
            to="/admin/content"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-white text-sm font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
          >
            <Globe className="h-4 w-4" />
            Website content management
          </Link>

          <Link
            to="/admin/notifications"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-white text-sm font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
          >
            <Bell className="h-4 w-4" />
            Notification
          </Link>

          <Link
            to="/admin/whatsapp"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-white text-sm font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp settings
          </Link>

          <Link
            to="/admin/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-white text-sm font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
          >
            <Settings className="h-4 w-4" />
            Store/business settings
          </Link>

          <Link
            to="/admin/users"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-white text-sm font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin users & permission
          </Link>

          <Link
            to="/admin/reports"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-white text-sm font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
          >
            <BarChart3 className="h-4 w-4" />
            Reports & analytics
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
