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
  const search = (location.search || {}) as Record<string, any>;
  const isDealsInShop = currentPath === "/shop" && (Boolean(search?.deals) || search?.deals === "true" || search?.q === "deals" || search?.q === "deal");

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
      isActive: currentPath === "/shop" && !isDealsInShop,
    },
    {
      id: "deals",
      label: "Deals",
      to: "/deals" as const,
      icon: IndianRupee,
      isActive: currentPath === "/deals" || isDealsInShop,
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
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                item.isActive
                  ? "text-[#6B46C1]"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div
                className={`relative flex items-center justify-center transition-all ${
                  item.isActive
                    ? "bg-[#6B46C1]/10 px-3.5 py-1 rounded-full scale-105"
                    : "p-1"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    item.isActive ? "stroke-[2.5]" : "stroke-2"
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-bold mt-0.5 tracking-tight ${
                  item.isActive ? "text-[#6B46C1]" : "text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
