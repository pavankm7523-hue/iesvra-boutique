import { useState, useEffect } from "react";
import { ShoppingBag, CheckCircle2, Zap, TrendingUp, MapPin } from "lucide-react";
import { useProducts } from "@/lib/products";

const PATNA_LOCATIONS = [
  "Boring Road, Patna",
  "Kankarbagh, Patna",
  "Bailey Road, Patna",
  "Danapur, Patna",
  "Patliputra Colony, Patna",
  "Rajendra Nagar, Patna",
  "Anisabad, Patna",
  "Frazer Road, Patna",
  "Ashiana Nagar, Patna",
  "Hanuman Nagar, Patna",
];

const CUSTOMER_NAMES = [
  "Priya S.",
  "Rahul M.",
  "Ananya K.",
  "Vikram R.",
  "Sneha P.",
  "Aarav M.",
  "Pooja R.",
  "Amit K.",
  "Rohan G.",
  "Nisha V.",
];

export function LiveActivityTicker() {
  const { products } = useProducts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // Generate activities dynamically from catalog products
  const activities = (products.length > 0 ? products : [
    { name: "1pis set Plastic Square 7 Sections Multipurpose", id: "1" },
    { name: "3 PC MOTIVATION BOTTLE", id: "2" },
    { name: "Portable Neck Massager Pillow", id: "3" },
    { name: "Wireless Bluetooth Earbuds", id: "4" }
  ]).flatMap((p, idx) => {
    const loc1 = PATNA_LOCATIONS[idx % PATNA_LOCATIONS.length];
    const loc2 = PATNA_LOCATIONS[(idx + 3) % PATNA_LOCATIONS.length];
    const name = CUSTOMER_NAMES[idx % CUSTOMER_NAMES.length];
    const minsAgo = Math.floor((idx % 12) * 3) + 2;
    const boughtCount = Math.floor((idx % 15) + 12);

    return [
      {
        id: `act_${p.id}_1`,
        icon: <ShoppingBag className="h-4 w-4 text-purple-600 shrink-0" />,
        badge: "PURCHASED",
        badgeBg: "bg-purple-100 text-purple-800 border-purple-200",
        message: `${name} from ${loc1} bought "${p.name.length > 35 ? p.name.slice(0, 35) + '...' : p.name}"`,
        time: `${minsAgo} mins ago`,
      },
      {
        id: `act_${p.id}_2`,
        icon: <Zap className="h-4 w-4 text-amber-500 shrink-0" />,
        badge: "DELIVERED",
        badgeBg: "bg-amber-100 text-amber-900 border-amber-200",
        message: `Express 15-min delivery completed to ${loc2} — under 5km away`,
        time: `${minsAgo + 4} mins ago`,
      },
      {
        id: `act_${p.id}_3`,
        icon: <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />,
        badge: "TRENDING",
        badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
        message: `${boughtCount} people in Patna bought "${p.name.length > 35 ? p.name.slice(0, 35) + '...' : p.name}" in the last hour`,
        time: "Just now",
      },
    ];
  });

  useEffect(() => {
    if (activities.length === 0) return;
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activities.length);
        setIsFading(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [activities.length]);

  if (activities.length === 0) return null;

  const current = activities[currentIndex % activities.length];

  return (
    <div className="w-full h-[46px] sm:h-[48px] min-h-[46px] sm:min-h-[48px] my-3 sm:my-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white border-y border-purple-500/20 px-3 sm:px-4 shadow-inner overflow-hidden select-none flex items-center relative z-10">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2.5 sm:gap-4 text-xs">
        
        {/* Left Live Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold tracking-wider uppercase text-[9px] sm:text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
            LIVE ACTIVITY
          </span>
        </div>

        {/* Center Rotating Activity Message */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-1">
          <div
            className={`flex items-center gap-2 transition-all duration-300 transform ${
              isFading ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
            }`}
          >
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 hidden sm:inline-block ${current.badgeBg}`}>
              {current.badge}
            </span>
            
            <div className="flex items-center gap-1.5 min-w-0">
              {current.icon}
              <span className="font-medium text-slate-100 text-xs sm:text-sm truncate">
                {current.message}
              </span>
            </div>

            <span className="text-[10px] text-slate-400 font-semibold shrink-0 ml-1 whitespace-nowrap">
              • {current.time}
            </span>
          </div>
        </div>

        {/* Right Location Tag */}
        <div className="hidden md:flex items-center gap-1.5 text-purple-200/80 text-[11px] font-semibold shrink-0 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full whitespace-nowrap">
          <MapPin className="h-3 w-3 text-amber-300" />
          <span>Patna & Bihar Region</span>
        </div>

      </div>
    </div>
  );
}
