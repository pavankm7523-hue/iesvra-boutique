import { useState, useEffect, useRef } from "react";
import { ShoppingBag, Zap, TrendingUp, MapPin } from "lucide-react";
import { useProducts } from "@/lib/products";

export const PATNA_LOCATIONS = [
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
  "Saguna More, Patna",
  "Exhibition Road, Patna",
  "Digha, Patna",
  "Kumhrar, Patna",
  "Phulwari Sharif, Patna",
  "Kurji, Patna",
  "Boring Canal Road, Patna",
  "Mithapur, Patna",
  "Gulzarbagh, Patna",
  "Khajpura, Patna",
  "Bankipur, Patna",
  "Gola Road, Patna",
  "RK Nagar, Patna",
  "SP Verma Road, Patna",
  "Budh Marg, Patna",
  "Kidwaipuri, Patna",
  "Shastri Nagar, Patna",
  "Jakkanpur, Patna",
  "Hajipur, Bihar",
  "Muzaffarpur, Bihar",
  "Gaya, Bihar",
  "Bhagalpur, Bihar",
  "Darbhanga, Bihar",
  "Begusarai, Bihar",
  "Arrah, Bihar",
];

export const CUSTOMER_NAMES = [
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
  "Sunita D.",
  "Deepak C.",
  "Swati T.",
  "Manish B.",
  "Kavita S.",
  "Rajesh K.",
  "Ritu M.",
  "Sanjay P.",
  "Neha A.",
  "Alok R.",
  "Kirti G.",
  "Abhishek N.",
  "Megha S.",
  "Gaurav D.",
  "Shweta K.",
  "Aditya H.",
  "Divya B.",
  "Vivek C.",
  "Tanja P.",
  "Kunal M.",
  "Anjali R.",
  "Saurabh V.",
  "Pallavi S.",
  "Vikas T.",
  "Richa G.",
  "Harsh K.",
  "Simran A.",
  "Prashant N.",
  "Shalini D.",
  "Ashish R.",
  "Nidhi P.",
  "Tarun S.",
  "Aakanksha M.",
  "Rohit B.",
  "Vandana G.",
  "Nitin K.",
  "Bhavna C.",
  "Sumit R.",
  "Preeti T.",
  "Mayank S.",
  "Komal V.",
  "Siddharth P.",
  "Archana K.",
  "Gautam D.",
  "Kavya M.",
];

export type ActivityItem = {
  id: string;
  badge: string;
  badgeBg: string;
  icon: React.ReactNode;
  message: string;
  time: string;
};

export function LiveActivityTicker() {
  const { products } = useProducts();
  const [currentActivity, setCurrentActivity] = useState<ActivityItem | null>(null);
  const [isFading, setIsFading] = useState(false);
  const lastKeyRef = useRef<string>("");

  const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const generateRandomActivity = (): ActivityItem => {
    const catalog = products.length > 0 ? products : [
      { name: "1pis set Plastic Square 7 Sections Multipurpose", id: "1" },
      { name: "3 PC MOTIVATION BOTTLE", id: "2" },
      { name: "Portable Neck Massager Pillow", id: "3" },
      { name: "Wireless Bluetooth Earbuds", id: "4" }
    ];

    const prod = getRandomItem(catalog);
    const name = getRandomItem(CUSTOMER_NAMES);
    const loc = getRandomItem(PATNA_LOCATIONS);
    const minsAgo = Math.floor(Math.random() * 25) + 2;
    const boughtCount = Math.floor(Math.random() * 20) + 12;
    const type = Math.floor(Math.random() * 3);

    const truncName = prod.name.length > 35 ? prod.name.slice(0, 35) + "..." : prod.name;
    const key = `${name}-${loc}-${prod.id}-${type}`;

    if (key === lastKeyRef.current) {
      // Pick another type if key matches previous
      return generateRandomActivity();
    }
    lastKeyRef.current = key;

    if (type === 0) {
      return {
        id: `act_${Date.now()}_${Math.random()}`,
        icon: <ShoppingBag className="h-4 w-4 text-purple-600 shrink-0" />,
        badge: "PURCHASED",
        badgeBg: "bg-purple-100 text-purple-800 border-purple-200",
        message: `${name} from ${loc} bought "${truncName}"`,
        time: `${minsAgo} mins ago`,
      };
    } else if (type === 1) {
      return {
        id: `act_${Date.now()}_${Math.random()}`,
        icon: <Zap className="h-4 w-4 text-amber-500 shrink-0" />,
        badge: "DELIVERED",
        badgeBg: "bg-amber-100 text-amber-900 border-amber-200",
        message: `Express 15-min delivery completed to ${loc} — under 5km away`,
        time: `${minsAgo + 3} mins ago`,
      };
    } else {
      return {
        id: `act_${Date.now()}_${Math.random()}`,
        icon: <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />,
        badge: "TRENDING",
        badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
        message: `${boughtCount} people in Patna bought "${truncName}" in the last hour`,
        time: "Just now",
      };
    }
  };

  useEffect(() => {
    // Initial activity
    setCurrentActivity(generateRandomActivity());

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentActivity(generateRandomActivity());
        setIsFading(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [products]);

  if (!currentActivity) return null;

  return (
    <div className="w-full min-h-[52px] sm:min-h-[48px] my-3 sm:my-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white border-y border-purple-500/20 py-2 sm:py-0 px-3 sm:px-4 shadow-inner select-none flex items-center relative z-10">
      <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4 text-xs">
        
        {/* Left Live Indicator Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold tracking-wider uppercase text-[9px] sm:text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
            LIVE ACTIVITY
          </span>
        </div>

        {/* Rotating Activity Message */}
        <div className="flex-1 min-w-0 w-full overflow-hidden text-center sm:text-left">
          <div
            className={`flex items-center justify-center sm:justify-start gap-1.5 transition-all duration-300 transform ${
              isFading ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
            }`}
          >
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 hidden md:inline-block ${currentActivity.badgeBg}`}>
              {currentActivity.badge}
            </span>
            
            <div className="flex items-center justify-center sm:justify-start gap-1.5 min-w-0 truncate">
              {currentActivity.icon}
              <span className="font-medium text-slate-100 text-[11px] sm:text-xs md:text-sm truncate">
                {currentActivity.message}
              </span>
            </div>

            <span className="text-[10px] text-slate-400 font-semibold shrink-0 ml-1 whitespace-nowrap">
              • {currentActivity.time}
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
