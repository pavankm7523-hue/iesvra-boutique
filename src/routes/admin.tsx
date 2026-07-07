import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft, LayoutDashboard, Settings, PackageOpen, ShieldAlert, Layers, Image as ImageIcon } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin Panel - IESVRA" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const currentUser = useCurrentUser();

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
            className="inline-flex items-center justify-center px-8 h-12 bg-navy-deep text-gold font-bold uppercase tracking-widest text-xs rounded-full hover:bg-gold hover:text-navy-deep transition-all duration-300"
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
          <Link to="/" className="flex items-center gap-2 text-gold hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </Link>
          <div className="mt-8">
            <h1 className="text-xl font-display font-bold tracking-widest uppercase">Admin Panel</h1>
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link
            to="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-white font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
            activeOptions={{ exact: true }}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            to="/admin/orders"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-white font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
          >
            <PackageOpen className="h-5 w-5" />
            Orders
          </Link>
          <Link
            to="/admin/categories"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-white font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
          >
            <Layers className="h-5 w-5" />
            Categories
          </Link>
          <Link
            to="/admin/hero"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-white font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
          >
            <ImageIcon className="h-5 w-5" />
            Hero Banner
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-white font-medium transition-colors"
            activeProps={{ className: "bg-white/10 text-gold" }}
          >
            <Settings className="h-5 w-5" />
            Settings
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
