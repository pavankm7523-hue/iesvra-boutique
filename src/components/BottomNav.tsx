import { Link, useLocation } from "@tanstack/react-router";
import { useCartCount } from "@/lib/cart";
import { useCurrentUser } from "@/lib/auth";
import {
  Home,
  Grid,
  IndianRupee,
  ShoppingBag,
  User,
} from "lucide-react";

export function BottomNav() {
  const location = useLocation();
  const cartCount = useCartCount();
  const currentUser = useCurrentUser();

  const currentPath = location.pathname;

  const navItems = [
    {
      id: "home",
      label: "Home",
      to: "/" as const,
      icon: Home,
      isActive: currentPath === "/",
    },
    {
      id: "categories",
      label: "Categories",
      to: "/shop" as const,
      icon: Grid,
      isActive: currentPath === "/shop",
    },
    {
      id: "deals",
      label: "Deals",
      to: "/shop" as const,
      search: { q: "deals" },
      icon: IndianRupee,
      isActive: currentPath.includes("deals"),
    },
    {
      id: "cart",
      label: "Cart",
      to: "/cart" as const,
      icon: ShoppingBag,
      badge: cartCount,
      isActive: currentPath === "/cart",
    },
    {
      id: "profile",
      label: currentUser ? "Profile" : "Profile",
      to: currentUser ? (currentUser.role === "admin" ? "/admin" : "/my-orders") : ("/login" as const),
      icon: User,
      isActive: currentPath === "/login" || currentPath === "/my-orders" || currentPath.startsWith("/admin"),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.id}
              to={item.to}
              search={item.search}
              className={`flex flex-col items-center justify-center transition-all duration-200 ${
                active
                  ? "bg-[#F0EBFF] text-[#6B46C1] px-3.5 py-1 rounded-2xl"
                  : "text-slate-600 hover:text-[#6B46C1] py-1"
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-extrabold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${active ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
