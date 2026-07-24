import pHead from "@/assets/p-head.jpg";
import pAirpods from "@/assets/p-airpods.jpg";
import pTravel from "@/assets/p-travel.jpg";
import pSteel from "@/assets/p-steel.jpg";
import pFan from "@/assets/p-fan.jpg";
import pDish from "@/assets/p-dish.jpg";
import pVanity from "@/assets/p-vanity.jpg";
import pJar from "@/assets/p-jar.jpg";

export type ProductMedia = {
  id: string;
  type: 'image' | 'video';
  url: string;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
};

export type Product = {
  id: string;
  name: string;
  sub: string;
  price: number;
  mrp: number;
  image: string;
  gallery?: ProductMedia[];
  categories: string[];
  colors: string[];
  description: string;
  isBestSeller?: boolean;
  reviews?: Review[];
  isDigital?: boolean;
  type?: string;
};

export const colorMap: Record<string, string> = {
  "Blush Pink": "#FFB6C1",
  "Snow White": "#FFFFFF",
  "Mint Green": "#A8E6CF",
  "Metallic Silver": "#C0C0C0",
  "Rose Gold": "#B76E79",
  "Slate Grey": "#708090",
  "Glossy White": "#F8F8F8",
  "Midnight Black": "#1A1A1A",
  "Forest Green": "#2D5A27",
  "Ocean Blue": "#0077B6",
  "Champagne Gold": "#F1E5AC",
  "Matte Black": "#222222",
  "Powder Pink": "#FFC0CB",
  "Sleek White": "#FAFAFA",
  "Standard White": "#FAFAFA",
  "Stealth Black": "#1E1E1E",
  "Carbon Fiber": "#333333",
  "Active Red": "#DC2626",
  "Navy Blue": "#1E3A8A",
  "Olive Green": "#556B2F",
  "Charcoal Gray": "#4B5563",
  "Brushed Silver": "#D1D5DB",
  "Ice White": "#F3F4F6",
  "Cool Blue": "#60A5FA",
  "Charcoal Grey": "#374151",
  "Cream White": "#FFFDD0",
  "Matte Gray": "#8E8E93",
  "Space Gray": "#5A5D64",
  Silver: "#E5E7EB",
  "Crystal Clear": "#E2E8F0",
  "Amber Gold": "#FFBF00",
  Transparent: "#E2E8F0",
  "Smoked Grey": "#4A4A4A",
  Starlight: "#F2EFEB",
  Midnight: "#1E293B",
  "Pacific Blue": "#006C84",
  "Sierra Blue": "#9FB8AD",
  "Gradient Purple": "#A78BFA",
  "Gradient Blue": "#60A5FA",
};

export type Category = {
  name: string;
  image: string;
};

export const initialCategories: Category[] = [
  { name: "Massagers", image: pHead },
  { name: "Mobile Accessories", image: pAirpods },
  { name: "Beauty & Personal Care", image: pVanity },
  { name: "Home & Kitchen", image: pJar },
  { name: "Bags & Travel", image: pTravel },
  { name: "Drinkware", image: pSteel },
  { name: "Daily Essentials", image: pDish },
  { name: "Fans & Coolers", image: pFan },
];

const categoryImageMap: Record<string, string> = {
  "Massagers": pHead,
  "Mobile Accessories": pAirpods,
  "Beauty & Personal Care": pVanity,
  "Home & Kitchen": pJar,
  "Bags & Travel": pTravel,
  "Drinkware": pSteel,
  "Daily Essentials": pDish,
  "Fans & Coolers": pFan
};

export function sanitizeCategories(cats: Category[]): Category[] {
  if (!Array.isArray(cats)) return [];
  return cats.map(cat => ({
    ...cat,
    image: categoryImageMap[cat.name] || cat.image
  }));
}

export function getCategories(): Category[] {
  if (typeof window === "undefined") return initialCategories;
  const stored = localStorage.getItem("ishvara_categories_v3");
  if (!stored) return initialCategories;
  try {
    return sanitizeCategories(JSON.parse(stored));
  } catch (e) {
    return initialCategories;
  }
}

export function saveCategories(cats: Category[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("ishvara_categories_v3", JSON.stringify(cats));
  window.dispatchEvent(new CustomEvent("ishvara_categories_changed"));
  fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cats),
  }).catch(console.error);
}

export function useCategories() {
  const [cats, setCats] = useState<Category[]>(() => getCategories());

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((globalCats) => {
        if (Array.isArray(globalCats) && globalCats.length > 0) {
          const sanitized = sanitizeCategories(globalCats);
          setCats(sanitized);
          localStorage.setItem("ishvara_categories_v3", JSON.stringify(sanitized));
        } else {
          fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cats),
          }).catch(console.error);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch global categories:", err);
      });

    const handleUpdate = () => {
      setCats(getCategories());
    };
    if (typeof window !== "undefined") {
      window.addEventListener("ishvara_categories_changed", handleUpdate);
      return () => {
        window.removeEventListener("ishvara_categories_changed", handleUpdate);
      };
    }
  }, []);

  const addCategory = (c: Category) => {
    const updated = [...cats, c];
    saveCategories(updated);
  };

  const updateCategory = (oldName: string, updated: Category) => {
    const updatedCats = cats.map((c) => (c.name.toLowerCase() === oldName.toLowerCase() ? updated : c));
    saveCategories(updatedCats);
  };

  const deleteCategory = (name: string) => {
    const updated = cats.filter((c) => c.name.toLowerCase() !== name.toLowerCase());
    saveCategories(updated);
  };

  return {
    categories: cats,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}

export const categories = initialCategories;


export const initialProducts: Product[] = [
  {
    "id": "prod_drive_1",
    "name": "1pis set Plastic Square 7 Sections Multipurpose",
    "sub": "Premium Quality Organiser",
    "price": 89,
    "mrp": 599,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/prod_1_1.jpg",
    "gallery": [
      {
        "id": "media_1780077316548_puyct",
        "type": "image",
        "url": "/products/prod_1_1.jpg"
      },
      {
        "id": "media_1780077316560_ajwug",
        "type": "image",
        "url": "/products/prod_1_2.jpg"
      },
      {
        "id": "media_1780077316566_qgy5l",
        "type": "image",
        "url": "/products/prod_1_3.jpg"
      },
      {
        "id": "media_1780077316571_h4qh0",
        "type": "image",
        "url": "/products/prod_1_4.jpg"
      },
      {
        "id": "media_1780077316574_le4q7",
        "type": "image",
        "url": "/products/prod_1_5.jpg"
      }
    ],
    "colors": [],
    "description": "Imported premium product for all your household organization needs. Organize drawers, cosmetics, or tools.",
    "isBestSeller": true,
    "reviews": [
      {
        "id": "rev_1_1",
        "author": "Rohan Malhotra",
        "rating": 5,
        "comment": "Super useful organizer. Fits perfectly in my kitchen drawer. Very sturdy plastic!",
        "date": "2026-05-10"
      },
      {
        "id": "rev_1_2",
        "author": "Neha Sharma",
        "rating": 4,
        "comment": "Good product, does exactly what is described. It would be perfect if the sections were slightly deeper, but overall excellent value.",
        "date": "2026-05-18"
      },
      {
        "id": "rev_1_3",
        "author": "Aarav Patel",
        "rating": 5,
        "comment": "Bought 2 of these. Extremely handy for organizing spices and small packets. Value for money.",
        "date": "2026-05-24"
      }
    ]
  },
  {
    "id": "prod_drive_2",
    "name": "3 PC MOTIVATION BOTTLE",
    "sub": "Premium Quality Drinkware",
    "price": 499,
    "mrp": 1499,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/prod_2_1.jpg",
    "gallery": [
      {
        "id": "media_1780077316581_0tfwt",
        "type": "image",
        "url": "/products/prod_2_1.jpg"
      },
      {
        "id": "media_1780077316593_cjue8",
        "type": "image",
        "url": "/products/prod_2_2.jpg"
      },
      {
        "id": "media_1780077316602_zshk5",
        "type": "image",
        "url": "/products/prod_2_3.jpg"
      },
      {
        "id": "media_1780077316635_dz1p2",
        "type": "image",
        "url": "/products/prod_2_4.jpg"
      },
      {
        "id": "media_1780077316645_w5s1g",
        "type": "image",
        "url": "/products/prod_2_5.jpg"
      },
      {
        "id": "media_1780077316650_99txb",
        "type": "image",
        "url": "/products/prod_2_6.jpg"
      },
      {
        "id": "media_1780077316656_0a3cv",
        "type": "image",
        "url": "/products/prod_2_7.jpg"
      },
      {
        "id": "media_1780077316699_zd7sf",
        "type": "image",
        "url": "/products/prod_2_8.jpg"
      }
    ],
    "colors": [
      "Midnight Black",
      "Blush Pink",
      "Forest Green"
    ],
    "description": "Imported premium water bottles. Comes as a set of 3 with motivational quotes and time markers to stay hydrated all day.",
    "isBestSeller": true,
    "reviews": [
      {
        "id": "rev_2_1",
        "author": "Deepak Gupta",
        "rating": 5,
        "comment": "Beautiful set of bottles! The motivational quotes keep me drinking water all day. High quality.",
        "date": "2026-04-20"
      },
      {
        "id": "rev_2_2",
        "author": "Shreya Iyer",
        "rating": 4,
        "comment": "The colors are gorgeous and leak-proof. One star off because the straw cleaning brush wasn't included.",
        "date": "2026-05-02"
      },
      {
        "id": "rev_2_3",
        "author": "Vikram Rathore",
        "rating": 5,
        "comment": "Awesome quality. My kids love it too. Good for gym and outdoor sports.",
        "date": "2026-05-15"
      }
    ]
  },
  {
    "id": "prod_drive_3",
    "name": "CYOMI 611 5 W Bluetooth Speaker",
    "sub": "Premium Quality Audio",
    "price": 299,
    "mrp": 999,
    "categories": [
      "Mobile Accessories"
    ],
    "image": "/products/prod_3_1.jpeg",
    "gallery": [
      {
        "id": "media_1780077316722_vxu7k",
        "type": "image",
        "url": "/products/prod_3_1.jpeg"
      },
      {
        "id": "media_1780077316729_sx1do",
        "type": "image",
        "url": "/products/prod_3_2.jpeg"
      },
      {
        "id": "media_1780077316734_4okhe",
        "type": "image",
        "url": "/products/prod_3_3.jpeg"
      },
      {
        "id": "media_1780077316741_lzpxr",
        "type": "image",
        "url": "/products/prod_3_4.jpeg"
      },
      {
        "id": "media_1780077316755_ygm43",
        "type": "image",
        "url": "/products/prod_3_5.jpeg"
      }
    ],
    "colors": [
      "Midnight Black",
      "Active Red",
      "Navy Blue"
    ],
    "description": "High bass portable wireless Bluetooth speaker. Durable build with crystal clear sound and up to 5 hours playback.",
    "isBestSeller": true,
    "reviews": [
      {
        "id": "rev_3_1",
        "author": "Rahul Sen",
        "rating": 5,
        "comment": "Surprisingly loud for its size! Very clear sound and great bass. Connection is instant.",
        "date": "2026-05-05"
      },
      {
        "id": "rev_3_2",
        "author": "Anjali Nair",
        "rating": 4,
        "comment": "Compact speaker with decent battery backup (around 4-5 hours). Sound quality is clear.",
        "date": "2026-05-14"
      },
      {
        "id": "rev_3_3",
        "author": "Gaurav Joshi",
        "rating": 4,
        "comment": "Worth the price. Easy to carry during travel.",
        "date": "2026-05-22"
      }
    ]
  },
  {
    "id": "prod_drive_4",
    "name": "Solar Interaction Wall Lamp",
    "sub": "Premium Quality Lighting",
    "price": 299,
    "mrp": 1299,
    "categories": [
      "Daily Essentials"
    ],
    "image": "/products/prod_4_1.jpeg",
    "gallery": [
      {
        "id": "media_1780077316763_jax5k",
        "type": "image",
        "url": "/products/prod_4_1.jpeg"
      },
      {
        "id": "media_1780077316770_svmqe",
        "type": "image",
        "url": "/products/prod_4_2.jpeg"
      },
      {
        "id": "media_1780077316777_wr1b5",
        "type": "image",
        "url": "/products/prod_4_3.jpeg"
      },
      {
        "id": "media_1780077316826_78bxr",
        "type": "image",
        "url": "/products/prod_4_4.jpeg"
      },
      {
        "id": "media_1780077316833_cpp6x",
        "type": "image",
        "url": "/products/prod_4_5.jpeg"
      }
    ],
    "colors": [
      "Stealth Black"
    ],
    "description": "Outdoor motion sensor solar light. Waterproof, heat-resistant, and perfect for security and pathway lighting.",
    "isBestSeller": true,
    "reviews": [
      {
        "id": "rev_4_1",
        "author": "Manish Tewari",
        "rating": 5,
        "comment": "Extremely bright solar light. Sensor works perfectly from a good distance. Highly recommended!",
        "date": "2026-03-12"
      },
      {
        "id": "rev_4_2",
        "author": "Kriti Saxena",
        "rating": 5,
        "comment": "Works perfectly in my garden. Automatically turns on at night. Solar charging is very efficient.",
        "date": "2026-04-05"
      },
      {
        "id": "rev_4_3",
        "author": "Suresh Kumar",
        "rating": 4,
        "comment": "Good light, easy installation. Plastic quality could be slightly heavier, but works great.",
        "date": "2026-04-28"
      }
    ]
  },
  {
    "id": "prod_drive_5",
    "name": "HTC AT 509 Beard Trimmer",
    "sub": "Premium Quality Grooming",
    "price": 399,
    "mrp": 1599,
    "categories": [
      "Beauty & Personal Care"
    ],
    "image": "/products/prod_5_1.jpeg",
    "gallery": [
      {
        "id": "media_1780077316843_yp09m",
        "type": "image",
        "url": "/products/prod_5_1.jpeg"
      },
      {
        "id": "media_1780077316854_58sf2",
        "type": "image",
        "url": "/products/prod_5_2.jpeg"
      },
      {
        "id": "media_1780077316866_9vx5d",
        "type": "image",
        "url": "/products/prod_5_3.jpeg"
      },
      {
        "id": "media_1780077316872_p2ujh",
        "type": "image",
        "url": "/products/prod_5_4.jpeg"
      },
      {
        "id": "media_1780077316921_qfiki",
        "type": "image",
        "url": "/products/prod_5_5.jpeg"
      },
      {
        "id": "media_1780077316927_8rn68",
        "type": "image",
        "url": "/products/prod_5_6.jpeg"
      },
      {
        "id": "media_1780077316934_hihoe",
        "type": "image",
        "url": "/products/prod_5_7.jpeg"
      },
      {
        "id": "media_1780077316952_v0fw9",
        "type": "image",
        "url": "/products/prod_5_8.jpeg"
      }
    ],
    "colors": [
      "Matte Black",
      "Brushed Silver"
    ],
    "description": "Ergonomic beard trimmer with sharp stainless steel blades, multiple length settings, and rechargeable battery for smooth grooming.",
    "isBestSeller": true,
    "reviews": [
      {
        "id": "rev_5_1",
        "author": "Harish Mehta",
        "rating": 5,
        "comment": "Excellent battery backup and very smooth trimming experience. Best trimmer in this budget.",
        "date": "2026-05-01"
      },
      {
        "id": "rev_5_2",
        "author": "Rajesh Pillai",
        "rating": 4,
        "comment": "Trims well. Easy to clean. Charging takes a bit of time but last long.",
        "date": "2026-05-12"
      },
      {
        "id": "rev_5_3",
        "author": "Arjun Kapoor",
        "rating": 5,
        "comment": "Premium look and feel. The blades are sharp and don't pull hair. Recommended!",
        "date": "2026-05-27"
      }
    ]
  },
  {
    "id": "prod_drive_6",
    "name": "Jen Deluxe Green Fruit & Veg. Hand Juicer",
    "sub": "Premium Quality Juicer",
    "price": 299,
    "mrp": 1799,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/prod_6_1.jpg",
    "gallery": [
      {
        "id": "media_1780077316960_hxur1",
        "type": "image",
        "url": "/products/prod_6_1.jpg"
      },
      {
        "id": "media_1780077316966_iqnqz",
        "type": "image",
        "url": "/products/prod_6_2.jpg"
      },
      {
        "id": "media_1780077316973_ilxgy",
        "type": "image",
        "url": "/products/prod_6_3.jpg"
      },
      {
        "id": "media_1780077316983_l6w9g",
        "type": "image",
        "url": "/products/prod_6_4.jpg"
      }
    ],
    "colors": [
      "Mint Green"
    ],
    "description": "Manual juicer for fresh and healthy juices. Perfect for citrus fruits, soft veggies, grapes, and wheatgrass. Easy cleanup.",
    "isBestSeller": true,
    "reviews": [
      {
        "id": "rev_6_1",
        "author": "Meera Deshmukh",
        "rating": 5,
        "comment": "Great hand juicer. Easy to assemble and squeeze juice out of oranges and grapes. Cleaning is easy.",
        "date": "2026-04-11"
      },
      {
        "id": "rev_6_2",
        "author": "Pooja Hegde",
        "rating": 4,
        "comment": "Good for quick juicing. Requires some manual effort but juice yield is excellent.",
        "date": "2026-04-22"
      }
    ]
  },
  {
    "id": "prod_drive_7",
    "name": "MRK Push Chopper",
    "sub": "Premium Quality Chopper",
    "price": 89,
    "mrp": 499,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/prod_7_1.jpeg",
    "gallery": [
      {
        "id": "media_1780077316988_j9utj",
        "type": "image",
        "url": "/products/prod_7_1.jpeg"
      },
      {
        "id": "media_1780077317010_o51zg",
        "type": "image",
        "url": "/products/prod_7_2.jpeg"
      },
      {
        "id": "media_1780077317017_g4iet",
        "type": "image",
        "url": "/products/prod_7_3.jpeg"
      }
    ],
    "colors": [],
    "description": "Stainless steel blades push chopper for easy dicing of onions, garlic, chillies, and other vegetables. Highly durable design.",
    "isBestSeller": true,
    "reviews": [
      {
        "id": "rev_7_1",
        "author": "Sanjay Singhal",
        "rating": 5,
        "comment": "Amazing chopper! Chops onions and tomatoes in seconds. Clean up is very easy.",
        "date": "2026-05-19"
      },
      {
        "id": "rev_7_2",
        "author": "Aditi Rao",
        "rating": 4,
        "comment": "Perfect for daily cooking. Very sharp blades. Handle with care.",
        "date": "2026-05-25"
      }
    ]
  },
  {
    "id": "prod_drive_8",
    "name": "Rechargeable Scalp Massager & Body Brush",
    "sub": "Premium Wellness Massager",
    "price": 799,
    "mrp": 2499,
    "categories": [
      "Massagers"
    ],
    "image": "/products/prod_8_1.jpg",
    "gallery": [
      {
        "id": "media_8_1",
        "type": "image",
        "url": "/products/prod_8_1.jpg"
      },
      {
        "id": "media_8_2",
        "type": "image",
        "url": "/products/prod_8_2.jpg"
      },
      {
        "id": "media_8_3",
        "type": "image",
        "url": "/products/prod_8_3.jpg"
      },
      {
        "id": "media_8_4",
        "type": "image",
        "url": "/products/prod_8_4.jpg"
      }
    ],
    "colors": [
      "Metallic Silver",
      "Rose Gold"
    ],
    "description": "Waterproof electric scalp massager designed for deep relaxation and hair growth stimulation. Features multiple nodes and speed levels.",
    "isBestSeller": true,
    "reviews": [
      {
        "id": "rev_8_1",
        "author": "Tanvi Goel",
        "rating": 5,
        "comment": "Feels like a professional head massage! Extremely relaxing. Completely waterproof so I use it in the shower too.",
        "date": "2026-05-09"
      },
      {
        "id": "rev_8_2",
        "author": "Kunal Kapoor",
        "rating": 5,
        "comment": "Excellent product. Relieves headache and stress instantly. Battery lasts for weeks.",
        "date": "2026-05-17"
      },
      {
        "id": "rev_8_3",
        "author": "Riya Sen",
        "rating": 4,
        "comment": "Very good product. The massage nodes are soft and comfortable. Charging is quick.",
        "date": "2026-05-23"
      }
    ]
  },
  {
    "id": "prod_drive_9",
    "name": "Premium Waterproof Travel Duffle Bag",
    "sub": "Bags & Travel",
    "price": 899,
    "mrp": 2999,
    "categories": [
      "Bags & Travel"
    ],
    "image": "/products/prod_9_1.jpeg",
    "gallery": [
      {
        "id": "media_9_1",
        "type": "image",
        "url": "/products/prod_9_1.jpeg"
      },
      {
        "id": "media_9_2",
        "type": "image",
        "url": "/products/prod_9_2.jpeg"
      },
      {
        "id": "media_9_3",
        "type": "image",
        "url": "/products/prod_9_3.jpeg"
      }
    ],
    "colors": [
      "Midnight Black",
      "Forest Green",
      "Navy Blue"
    ],
    "description": "Durable travel duffle bag with dedicated wet pocket and shoe compartment. Perfect for gym, weekend getaways, and flight carry-on.",
    "isBestSeller": true,
    "reviews": [
      {
        "id": "rev_9_1",
        "author": "Varun Dhawan",
        "rating": 5,
        "comment": "Extremely spacious! The separate shoe compartment is very useful. Premium fabric and zip quality.",
        "date": "2026-05-11"
      },
      {
        "id": "rev_9_2",
        "author": "Ananya Pandey",
        "rating": 4,
        "comment": "Beautiful bag, very lightweight. Fits a lot of clothes. Great for weekend trips.",
        "date": "2026-05-20"
      }
    ]
  },
  {
    "asin": "B0GX62T8Z5",
    "id": "prod_amz_B0GX62T8Z5",
    "name": "6-Angle Adjustable Aluminum Laptop Stand | Ergonomic Foldable & Portable Tabletop Riser Holder for Laptop/Desktop | Compatible with MacBook, HP, Dell, Lenovo & All Notebooks (Silver)",
    "sub": "IESVRA Boutique — Mobile Accessories",
    "price": 219,
    "mrp": 999,
    "categories": [
      "Mobile Accessories"
    ],
    "image": "/products/B0GX62T8Z5/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GX62T8Z5_1",
        "type": "image",
        "url": "/products/B0GX62T8Z5/image_1.jpg"
      },
      {
        "id": "med_B0GX62T8Z5_2",
        "type": "image",
        "url": "/products/B0GX62T8Z5/image_2.jpg"
      },
      {
        "id": "med_B0GX62T8Z5_3",
        "type": "image",
        "url": "/products/B0GX62T8Z5/image_3.jpg"
      },
      {
        "id": "med_B0GX62T8Z5_4",
        "type": "image",
        "url": "/products/B0GX62T8Z5/image_4.jpg"
      },
      {
        "id": "med_B0GX62T8Z5_5",
        "type": "image",
        "url": "/products/B0GX62T8Z5/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\n6-Level Adjustable Ergonomics for Comfort – Designed to reduce neck, shoulder & back strain with multiple height and angle adjustments for perfect working posture.\nPremium Lightweight Aluminum Build – Strong, durable and heat-dissipating aluminum body keeps your laptop stable and cool during long working hours.\nFoldable, Portable & Travel-Friendly – Ultra-compact design folds flat in seconds, making it ideal for office, home, travel, study tables and work-from-home setups.\nStrong Anti-Slip Grip & Ventilated Airflow – Silicone pads ensure your laptop stays firmly in place while the open-frame design improves airflow to prevent overheating.\nUniversal Laptop & Tablet Compatibility – Suitable for 10–17 inch devices including MacBook, HP, Dell, Lenovo, ASUS, Acer, Chromebooks & all notebook models.\n› See more product details",
    "isBestSeller": true,
    "rating": 4.5,
    "reviewsCount": 35,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GX62T8Z5"
  },
  {
    "asin": "B0GN1MQTH7",
    "id": "prod_amz_B0GN1MQTH7",
    "name": "3 Compartment Lunch Box for Office & School | 1400ml Leakproof Bento Lunch Box with Spoon & Fork | BPA Free Plastic Tiffin Box for Kids & Adults | Multicolor",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 249,
    "mrp": 250,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0GN1MQTH7/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GN1MQTH7_1",
        "type": "image",
        "url": "/products/B0GN1MQTH7/image_1.jpg"
      },
      {
        "id": "med_B0GN1MQTH7_2",
        "type": "image",
        "url": "/products/B0GN1MQTH7/image_2.jpg"
      },
      {
        "id": "med_B0GN1MQTH7_3",
        "type": "image",
        "url": "/products/B0GN1MQTH7/image_3.jpg"
      },
      {
        "id": "med_B0GN1MQTH7_4",
        "type": "image",
        "url": "/products/B0GN1MQTH7/image_4.jpg"
      },
      {
        "id": "med_B0GN1MQTH7_5",
        "type": "image",
        "url": "/products/B0GN1MQTH7/image_5.jpg"
      },
      {
        "id": "med_B0GN1MQTH7_6",
        "type": "image",
        "url": "/products/B0GN1MQTH7/image_6.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\n3 Separate Compartments for Organized Meals - Designed with 3 individual compartments to keep rice, vegetables, snacks, fruits, and other food items neatly separated without mixing flavors.\nLeakproof & Secure Locking Design - Features a tight-sealing lid with secure locks that help prevent spills and leaks, making it ideal for office, school, college, and travel use.\nIncludes Spoon & Fork - Comes with a matching spoon and fork, providing a complete mealtime solution for convenient eating anywhere.\nBPA-Free & Food-Grade Material - Made from high-quality BPA-free plastic that is safe for everyday food storage and suitable for both kids and adults.\nLarge 1400ml Capacity for Daily Use - Spacious 1400ml capacity allows you to pack complete meals, making it perfect for office workers, students, and outdoor activities.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 84,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GN1MQTH7"
  },
  {
    "asin": "B0GKWZQD8W",
    "id": "prod_amz_B0GKWZQD8W",
    "name": "4-Piece Airtight Kitchen Masala Box Set with Tray | Leakproof Spice Storage Containers | Easy Flow Rasoi Organizer for Masala, Dry Fruits & Condiments |",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 199,
    "mrp": 399,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0GKWZQD8W/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GKWZQD8W_1",
        "type": "image",
        "url": "/products/B0GKWZQD8W/image_1.jpg"
      },
      {
        "id": "med_B0GKWZQD8W_2",
        "type": "image",
        "url": "/products/B0GKWZQD8W/image_2.jpg"
      },
      {
        "id": "med_B0GKWZQD8W_3",
        "type": "image",
        "url": "/products/B0GKWZQD8W/image_3.jpg"
      },
      {
        "id": "med_B0GKWZQD8W_4",
        "type": "image",
        "url": "/products/B0GKWZQD8W/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nAirtight & Fresh: Prevents moisture, dust, and odor from affecting your spices.\nDurable Food-Grade Plastic: Lightweight, sturdy, and safe for daily kitchen use.\nEasy Flow Design: Pour spices quickly without spills or mess.\nTray Included: Keeps all 4 containers organized for easy storage and portability.\nTransparent Lids: Identify contents instantly without opening each box.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 61,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GKWZQD8W"
  },
  {
    "asin": "B0FMNP246V",
    "id": "prod_amz_B0FMNP246V",
    "name": "4-in-1 Airtight Kitchen Storage Container Set of 3 | Multipurpose Plastic Masala & Spice Box with Flip Lids | Transparent Food Organizer Jars for Pulses, Grains, Cereals, Snacks, Tea & Sugar",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 549,
    "mrp": 999,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FMNP246V/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FMNP246V_1",
        "type": "image",
        "url": "/products/B0FMNP246V/image_1.jpg"
      },
      {
        "id": "med_B0FMNP246V_2",
        "type": "image",
        "url": "/products/B0FMNP246V/image_2.jpg"
      },
      {
        "id": "med_B0FMNP246V_3",
        "type": "image",
        "url": "/products/B0FMNP246V/image_3.jpg"
      },
      {
        "id": "med_B0FMNP246V_4",
        "type": "image",
        "url": "/products/B0FMNP246V/image_4.jpg"
      },
      {
        "id": "med_B0FMNP246V_5",
        "type": "image",
        "url": "/products/B0FMNP246V/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nSet of 3 – 4-in-1 Storage Containers – Each jar has 4 compartments to store different items, making it perfect for masalas, spices, pulses, cereals, grains, tea, coffee, sugar, dry fruits, or snacks.\nAirtight & Moisture-Proof – Flip-top lids with tight sealing keep food fresh for longer, preventing moisture, pests, and accidental spills.\nTransparent & Easy to Identify – Clear body design lets you quickly check contents without opening, saving time in busy kitchens.\nDurable & Food-Safe Plastic – Made from high-quality, BPA-free, non-toxic plastic that is sturdy, lightweight, and safe for everyday use.\nEasy to Clean & Refill – Wide openings and smooth interiors ensure hassle-free refilling and cleaning.\nSpace-Saving & Stylish – Compact, stackable design with sleek black lids fits seamlessly into modular kitchens and pantry shelves.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 67,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNP246V"
  },
  {
    "asin": "B0GY4MYZFR",
    "id": "prod_amz_B0GY4MYZFR",
    "name": "Sonic Electric Toothbrush for Adults with 2 Replacement Brush Heads | USB Rechargeable | 5 Brushing Modes for Deep Cleaning, Plaque Removal & Gum Care | Multicolor",
    "sub": "IESVRA Boutique — Beauty & Personal Care",
    "price": 280,
    "mrp": 200000,
    "categories": [
      "Beauty & Personal Care"
    ],
    "image": "/products/B0GY4MYZFR/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GY4MYZFR_1",
        "type": "image",
        "url": "/products/B0GY4MYZFR/image_1.jpg"
      },
      {
        "id": "med_B0GY4MYZFR_2",
        "type": "image",
        "url": "/products/B0GY4MYZFR/image_2.jpg"
      },
      {
        "id": "med_B0GY4MYZFR_3",
        "type": "image",
        "url": "/products/B0GY4MYZFR/image_3.jpg"
      },
      {
        "id": "med_B0GY4MYZFR_4",
        "type": "image",
        "url": "/products/B0GY4MYZFR/image_4.jpg"
      },
      {
        "id": "med_B0GY4MYZFR_5",
        "type": "image",
        "url": "/products/B0GY4MYZFR/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nPOWERFUL SONIC CLEANING TECHNOLOGY: Advanced sonic vibration technology helps remove plaque, food particles, and surface stains for a cleaner and fresher oral care experience\n5 BRUSHING MODES FOR PERSONALIZED CARE: Features Clean, Soft, Polish, Massage, and Whitening modes to suit daily cleaning, sensitive gums, and complete oral hygiene needs\nUSB RECHARGEABLE & TRAVEL FRIENDLY: Built-in rechargeable battery with USB charging support offers convenient cordless use at home, office, gym, or while travelling\nINCLUDES 2 REPLACEMENT BRUSH HEADS: Comes with 2 interchangeable brush heads designed for effective cleaning and long-term usability for adults\nERGONOMIC & WATER-RESISTANT DESIGN: Lightweight and comfortable grip design with water-resistant body makes it suitable for daily bathroom use and easy handling\nMULTICOLOR DESIGN OPTIONS: Available in attractive multicolor finish that adds a vibrant touch to your bathroom essentials and personal care collection\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 41,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GY4MYZFR"
  },
  {
    "asin": "B0H2Z62YGG",
    "id": "prod_amz_B0H2Z62YGG",
    "name": "Digital Kitchen Weighing Scale | High Precision Food Weight Machine with LCD Display | Multipurpose Electronic Weight Scale for Cooking, Baking & Grocery | Compact & Portable | White",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 299,
    "mrp": 899,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0H2Z62YGG/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0H2Z62YGG_1",
        "type": "image",
        "url": "/products/B0H2Z62YGG/image_1.jpg"
      },
      {
        "id": "med_B0H2Z62YGG_2",
        "type": "image",
        "url": "/products/B0H2Z62YGG/image_2.jpg"
      },
      {
        "id": "med_B0H2Z62YGG_3",
        "type": "image",
        "url": "/products/B0H2Z62YGG/image_3.jpg"
      },
      {
        "id": "med_B0H2Z62YGG_4",
        "type": "image",
        "url": "/products/B0H2Z62YGG/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nHigh Precision Measurement - Accurate digital sensors provide precise weight readings for cooking, baking, meal prep, grocery measurement, and portion control.\nEasy-to-Read LCD Display - Bright LCD screen ensures clear visibility of measurements for convenient everyday kitchen use.\nMultipurpose Kitchen Use - Ideal for weighing vegetables, fruits, spices, baking ingredients, dry fruits, coffee, and small household items.\nCompact & Lightweight Design - Slim and space-saving design fits easily in kitchen cabinets and countertops while remaining portable for daily use.\nDurable & User-Friendly - Built with sturdy material and simple operation buttons for quick weighing, easy cleaning, and long-lasting performance.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 89,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0H2Z62YGG"
  },
  {
    "asin": "B0FSKJ7J32",
    "id": "prod_amz_B0FSKJ7J32",
    "name": "Portable Cordless Wireless Heating Pad for Menstrual Period Cramps, Electric Waist Belt Device, 4 Heat Levels and 4 Vibration Massage Modes, Back or Belly Heating Pad for Females",
    "sub": "IESVRA Boutique — Massagers",
    "price": 0,
    "mrp": 0,
    "categories": [
      "Massagers"
    ],
    "image": "/products/B0FSKJ7J32/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FSKJ7J32_1",
        "type": "image",
        "url": "/products/B0FSKJ7J32/image_1.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\n🔥 【Multiple Adjustable Modes】Our heating pad for cramps designed with 3 heat levels and 4 vibration massage modes. You could adjust the temperature and massage, according to your actual needs which are comfortable for your comfortable and warm when using the cordless heating pad. Effectively relieve menstrual cramps and belly pain.\n🔥【Premium Heating Material】This heating pad built-in latest generation heating technology. Safe and healthy, fast heating, no need waiting. The portable heating pad deliver heat to your body to improve blood circulation and relax the muscles. It is suitable for relieving menstrual pain, stomach or abdominal pain.\n🔥【More Ergonomic】The back of our heating pad with massager is made of high-quality soft fabric, which is light and breathable, comfortable and can dissipate heat evenly. Our high elastic waistband is adjustable, suitable for various waistlines. It is suitable for multiple body parts hot compress massage, especially great for waist, abdominal, stomach and belly.\n🔥【Portable and Long Battery Life】This electric heating pad can work for 3.5 hours. You can use this cramps relief heating pad in resting, working, cooking, indoor or outdoor anytime anywhere.\n🔥 【Perfect Gift and Sincere Customer Service】Our usb heating pad is a great gift for your girlfriend, daughter, mother and friends. Warm tips: if charging during use, the period cramp heating pad will automatically shut down for safety, this is a normal. Please feel free to contact us anytime if any question via the amazon message center, a satisfied solution is promised forever.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 32,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FSKJ7J32"
  },
  {
    "asin": "B0GZHK8MYT",
    "id": "prod_amz_B0GZHK8MYT",
    "name": "Kids Space Theme Water Bottle | 650ml Leakproof Sipper Bottle with Straw for School | BPA-Free Plastic Cute Cartoon Water Bottle for Boys & Girls | One-Touch Flip Lid, Strap, Lightweight (Blue)",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 219,
    "mrp": 799,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0GZHK8MYT/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GZHK8MYT_1",
        "type": "image",
        "url": "/products/B0GZHK8MYT/image_1.jpg"
      },
      {
        "id": "med_B0GZHK8MYT_2",
        "type": "image",
        "url": "/products/B0GZHK8MYT/image_2.jpg"
      },
      {
        "id": "med_B0GZHK8MYT_3",
        "type": "image",
        "url": "/products/B0GZHK8MYT/image_3.jpg"
      },
      {
        "id": "med_B0GZHK8MYT_4",
        "type": "image",
        "url": "/products/B0GZHK8MYT/image_4.jpg"
      },
      {
        "id": "med_B0GZHK8MYT_5",
        "type": "image",
        "url": "/products/B0GZHK8MYT/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nFUN SPACE-THEME DESIGN FOR KIDS: Attractive cartoon prints featuring rockets, astronauts, sharks & rainbows make this bottle exciting for school-going kids and encourage regular water intake\n100% LEAKPROOF ONE-TOUCH FLIP LID: Secure lock system prevents spills in school bags. Easy press-button lid ensures quick, hygienic drinking for active children\nBPA-FREE & SAFE MATERIAL: Made from high-quality, non-toxic, BPA-free plastic. Safe for daily use at school, home, playgrounds, and outdoor activities\nBUILT-IN STRAW + CARRY STRAP: Smooth-sipping straw for kids of all ages, plus an adjustable strap that lets children carry it comfortably anywhere\nLIGHTWEIGHT, DURABLE & EASY TO CLEAN: Strong, transparent body with wide-mouth opening makes cleaning simple. Designed to withstand drops and daily usage by kids\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 31,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GZHK8MYT"
  },
  {
    "asin": "B0FN7FW23S",
    "id": "prod_amz_B0FN7FW23S",
    "name": "Heavy Duty Garbage Bags – 180 Count (30 Bags x 6 Rolls) | Extra Strong Black Trash Bags for Kitchen, Bathroom, Office & Outdoor Use | Leakproof & Tear-Resistant Dustbin Bags",
    "sub": "IESVRA Boutique — Bags & Travel",
    "price": 299,
    "mrp": 599,
    "categories": [
      "Bags & Travel"
    ],
    "image": "/products/B0FN7FW23S/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FN7FW23S_1",
        "type": "image",
        "url": "/products/B0FN7FW23S/image_1.jpg"
      },
      {
        "id": "med_B0FN7FW23S_2",
        "type": "image",
        "url": "/products/B0FN7FW23S/image_2.jpg"
      },
      {
        "id": "med_B0FN7FW23S_3",
        "type": "image",
        "url": "/products/B0FN7FW23S/image_3.jpg"
      },
      {
        "id": "med_B0FN7FW23S_4",
        "type": "image",
        "url": "/products/B0FN7FW23S/image_4.jpg"
      },
      {
        "id": "med_B0FN7FW23S_5",
        "type": "image",
        "url": "/products/B0FN7FW23S/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nEXTRA STRONG & DURABLE: Made with thick, high-density material that prevents tearing, splitting, and bursting even with heavy waste—ideal for daily household and commercial use.\n100% LEAKPROOF DESIGN: Securely sealed bottom stops liquid leakage and keeps your dustbin clean and hygienic, reducing mess and odour.\nMULTIPURPOSE USE: Perfect for kitchen, bathroom, office, outdoor cleaning, pet waste, and dry/wet waste disposal—compatible with most medium-size dustbins.\nEASY TO USE & DISPENSE: Comes in 6 compact rolls with 30 bags each, allowing smooth pull-out, easy tear-off, and quick replacement without any hassle.\nVALUE PACK OF 180 BAGS: Long-lasting pack designed to reduce repeat buying—offering better savings, convenience, and reliability for everyday waste management.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 21,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FN7FW23S"
  },
  {
    "asin": "B0GP6SWNGM",
    "id": "prod_amz_B0GP6SWNGM",
    "name": "Airtight Fridge Storage Containers Combo (6-in-1 + Set of 3) | BPA-Free Refrigerator Organizer Boxes with Lid & Drain Tray | Stackable Leakproof Vegetable, Fruit, Meat & Leftover Storage",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 499,
    "mrp": 699,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0GP6SWNGM/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GP6SWNGM_1",
        "type": "image",
        "url": "/products/B0GP6SWNGM/image_1.jpg"
      },
      {
        "id": "med_B0GP6SWNGM_2",
        "type": "image",
        "url": "/products/B0GP6SWNGM/image_2.jpg"
      },
      {
        "id": "med_B0GP6SWNGM_3",
        "type": "image",
        "url": "/products/B0GP6SWNGM/image_3.jpg"
      },
      {
        "id": "med_B0GP6SWNGM_4",
        "type": "image",
        "url": "/products/B0GP6SWNGM/image_4.jpg"
      },
      {
        "id": "med_B0GP6SWNGM_5",
        "type": "image",
        "url": "/products/B0GP6SWNGM/image_5.jpg"
      },
      {
        "id": "med_B0GP6SWNGM_6",
        "type": "image",
        "url": "/products/B0GP6SWNGM/image_6.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nSmart 6-in-1 + 3-Piece Combo Includes a 6-compartment organizer and 3 individual storage containers with drain trays — ideal for separating vegetables, fruits, herbs, meat, and leftovers neatly inside your refrigerator.\nBuilt-in Drain Tray for Freshness Removable inner drain basket keeps food elevated from water, helping reduce moisture buildup and supporting longer freshness of leafy greens and produce.\nAirtight & Leak-Resistant Lid Secure snap-lock lids help prevent spills and odor mixing inside the fridge, making it suitable for storing cut vegetables, fruits, and prepped meals.\nBPA-Free & Food-Grade Material Made from durable, transparent BPA-free plastic that allows easy visibility of contents while ensuring safe everyday food storage.\nStackable & Space-Saving Design Flat-top lids allow vertical stacking to maximize fridge space, making it ideal for small refrigerators, meal prep organization, and modular kitchen storage.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 85,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GP6SWNGM"
  },
  {
    "asin": "B0GKWVTHTT",
    "id": "prod_amz_B0GKWVTHTT",
    "name": "Manual Hand Chopper 450ML | Vegetable & Onion Chopper with Stainless Steel Blades | Pull String Food Processor | Garlic, Herbs, Nuts & Fruit Cutter",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 199,
    "mrp": 599,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0GKWVTHTT/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GKWVTHTT_1",
        "type": "image",
        "url": "/products/B0GKWVTHTT/image_1.jpg"
      },
      {
        "id": "med_B0GKWVTHTT_2",
        "type": "image",
        "url": "/products/B0GKWVTHTT/image_2.jpg"
      },
      {
        "id": "med_B0GKWVTHTT_3",
        "type": "image",
        "url": "/products/B0GKWVTHTT/image_3.jpg"
      },
      {
        "id": "med_B0GKWVTHTT_4",
        "type": "image",
        "url": "/products/B0GKWVTHTT/image_4.jpg"
      },
      {
        "id": "med_B0GKWVTHTT_5",
        "type": "image",
        "url": "/products/B0GKWVTHTT/image_5.jpg"
      },
      {
        "id": "med_B0GKWVTHTT_6",
        "type": "image",
        "url": "/products/B0GKWVTHTT/image_6.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nMultipurpose Food Chopper: Effortlessly chops vegetables, onions, garlic, nuts, herbs, and fruits for all your recipes.\nHigh-Quality Stainless Steel Blades: Durable, rust-resistant blades ensure precise and uniform chopping every time.\nEasy Pull-String Operation: Smooth, ergonomic pull cord design for fast and effortless food preparation.\n450ML Transparent Container: Compact yet spacious enough for daily kitchen use; monitor chopping progress easily.\nEasy to Clean & Store: Removable components are dishwasher-safe; lightweight design for convenient storage.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 47,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GKWVTHTT"
  },
  {
    "asin": "B0GYFBYGZB",
    "id": "prod_amz_B0GYFBYGZB",
    "name": "2-in-1 Glass Oil Dispenser Spray Bottle | Fine Mist & Controlled Pouring for Cooking | Refillable Kitchen Oil Sprayer for Frying, Baking, BBQ & Salad | Leakproof & Easy to Use",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 189,
    "mrp": 999,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0GYFBYGZB/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GYFBYGZB_1",
        "type": "image",
        "url": "/products/B0GYFBYGZB/image_1.jpg"
      },
      {
        "id": "med_B0GYFBYGZB_2",
        "type": "image",
        "url": "/products/B0GYFBYGZB/image_2.jpg"
      },
      {
        "id": "med_B0GYFBYGZB_3",
        "type": "image",
        "url": "/products/B0GYFBYGZB/image_3.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\n2-in-1 Spray & Pour Design: Smart dual-function oil dispenser lets you spray fine mist or pour controlled stream, giving full flexibility for frying, grilling, roasting, baking and seasoning.\nPremium Thick Glass Body: Made with high-quality transparent glass for durability, easy visibility of oil levels and safe everyday food-grade usage in modern kitchens.\nPrecise & Even Mist Output: Advanced spray nozzle ensures uniform misting to help reduce excess oil consumption, making it ideal for low-calorie cooking or fitness-focused meal prep.\nLeakproof & Easy to Refill: Designed with a tight sealing cap and wide mouth for spill-free refilling, secure storage and hassle-free daily use in home kitchens.\nMultipurpose Kitchen Companion: Suitable for multiple liquids—oil, vinegar, lemon juice, soy sauce, etc.—perfect for BBQ, salads, baking, air fryers and non-stick cooking.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 72,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GYFBYGZB"
  },
  {
    "asin": "B0GYNLKW67",
    "id": "prod_amz_B0GYNLKW67",
    "name": "500ml Stainless Steel Vacuum Insulated Bottle Set with 2 Cups | Double Wall Thermos Flask | Leak Proof BPA Free Water Bottle for Office, School, Travel & Outdoor",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 299,
    "mrp": 599,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0GYNLKW67/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GYNLKW67_1",
        "type": "image",
        "url": "/products/B0GYNLKW67/image_1.jpg"
      },
      {
        "id": "med_B0GYNLKW67_2",
        "type": "image",
        "url": "/products/B0GYNLKW67/image_2.jpg"
      },
      {
        "id": "med_B0GYNLKW67_3",
        "type": "image",
        "url": "/products/B0GYNLKW67/image_3.jpg"
      },
      {
        "id": "med_B0GYNLKW67_4",
        "type": "image",
        "url": "/products/B0GYNLKW67/image_4.jpg"
      },
      {
        "id": "med_B0GYNLKW67_5",
        "type": "image",
        "url": "/products/B0GYNLKW67/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nDouble Wall Vacuum Insulation - Keep your beverages hot or cold for extended hours with double-wall vacuum insulation, helping maintain the desired temperature throughout the day.\nPremium Stainless Steel - Made from high-quality stainless steel that is durable, rust-resistant, and designed for everyday use while preserving the taste of your beverages.\nLeak-Proof & BPA-Free - Designed with a secure leak-resistant lid to help prevent spills during travel. BPA-free construction offers a safe drinking experience.\nIncludes 2 Drinking Cups - Comes with two matching cups, making it convenient for sharing tea, coffee, water, or other beverages during travel, office, or outdoor activities.\nIdeal for Everyday Use - Suitable for carrying hot or cold beverages to the office, school, college, gym, picnics, camping, road trips, and daily commuting.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 48,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GYNLKW67"
  },
  {
    "asin": "B0GYN9V6S7",
    "id": "prod_amz_B0GYN9V6S7",
    "name": "Manual Vegetable Chopper 900ML | Heavy Duty Hand Press Food Processor | 3 Stainless Steel Blades | Onion, Tomato, Garlic Cutter | Multipurpose Kitchen Chopper & Salad Maker",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 199,
    "mrp": 799,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0GYN9V6S7/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GYN9V6S7_1",
        "type": "image",
        "url": "/products/B0GYN9V6S7/image_1.jpg"
      },
      {
        "id": "med_B0GYN9V6S7_2",
        "type": "image",
        "url": "/products/B0GYN9V6S7/image_2.jpg"
      },
      {
        "id": "med_B0GYN9V6S7_3",
        "type": "image",
        "url": "/products/B0GYN9V6S7/image_3.jpg"
      },
      {
        "id": "med_B0GYN9V6S7_4",
        "type": "image",
        "url": "/products/B0GYN9V6S7/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nHigh-Speed 3 Blade System: IESVRA chopper comes with ultra-sharp stainless steel blades for fast, uniform chopping of vegetables, fruits, nuts, and herbs in seconds\nEffortless Press Mechanism: Designed with an easy push system that reduces effort and speeds up food prep without electricity for everyday kitchen use\nLarge 900ML Capacity Bowl: Suitable for preparing larger quantities at once. Transparent container allows you to monitor chopping consistency easily\nMultipurpose Kitchen Essential: Chop onions, tomatoes, garlic, ginger, fruits, dry fruits, and prepare salads, chutneys, and sauces effortlessly\nSafe, Durable & Easy to Clean: Made from BPA-free food-grade plastic with anti-skid base for stability. Detachable parts ensure quick cleaning and maintenance\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 49,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GYN9V6S7"
  },
  {
    "asin": "B0FT3SHG1X",
    "id": "prod_amz_B0FT3SHG1X",
    "name": "Flower Shape Adhesive Wall Hook | Heavy Duty Transparent Wall Holder for Bathroom & Kitchen | No-Drill Sticker Hooks for Home Organization | Strong Self-Adhesive for Keys, Towels (Pack of 10)",
    "sub": "IESVRA Boutique — Daily Essentials",
    "price": 139,
    "mrp": 599,
    "categories": [
      "Daily Essentials"
    ],
    "image": "/products/B0FT3SHG1X/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FT3SHG1X_1",
        "type": "image",
        "url": "/products/B0FT3SHG1X/image_1.jpg"
      },
      {
        "id": "med_B0FT3SHG1X_2",
        "type": "image",
        "url": "/products/B0FT3SHG1X/image_2.jpg"
      },
      {
        "id": "med_B0FT3SHG1X_3",
        "type": "image",
        "url": "/products/B0FT3SHG1X/image_3.jpg"
      },
      {
        "id": "med_B0FT3SHG1X_4",
        "type": "image",
        "url": "/products/B0FT3SHG1X/image_4.jpg"
      },
      {
        "id": "med_B0FT3SHG1X_5",
        "type": "image",
        "url": "/products/B0FT3SHG1X/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nStrong & Reliable Holding Power - Engineered with high-strength adhesive, these wall hooks provide a firm and long-lasting grip, ideal for daily household use.\nNo Drilling, No Damage Installation - Stick-and-use design ensures zero damage to walls—perfect for rented homes, tiles, glass, wood, metal, and smooth surfaces.\nMultipurpose Home Organization - Ideal for hanging towels, keys, ladles, loofahs, kitchen tools, decorations, charging cables, and daily essentials.\nWaterproof & Rust-Free Build - Made with durable, transparent material that stays clean and strong even in bathrooms, wash areas, and humid conditions.\nStylish Flower Design for Modern Homes - Decorative floral shape complements home décor while providing practical storage. Compact, aesthetic, and space-saving.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 83,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FT3SHG1X"
  },
  {
    "asin": "B0FT3TBXHK",
    "id": "prod_amz_B0FT3TBXHK",
    "name": "Flower Shape Adhesive Wall Hook | Heavy Duty Transparent Wall Holder | No-Drill Waterproof Hooks for Bathroom, Kitchen & Home Organization |Strong Sticker Hangers for Accessories (Pack of 20)",
    "sub": "IESVRA Boutique — Daily Essentials",
    "price": 199,
    "mrp": 599,
    "categories": [
      "Daily Essentials"
    ],
    "image": "/products/B0FT3TBXHK/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FT3TBXHK_1",
        "type": "image",
        "url": "/products/B0FT3TBXHK/image_1.jpg"
      },
      {
        "id": "med_B0FT3TBXHK_2",
        "type": "image",
        "url": "/products/B0FT3TBXHK/image_2.jpg"
      },
      {
        "id": "med_B0FT3TBXHK_3",
        "type": "image",
        "url": "/products/B0FT3TBXHK/image_3.jpg"
      },
      {
        "id": "med_B0FT3TBXHK_4",
        "type": "image",
        "url": "/products/B0FT3TBXHK/image_4.jpg"
      },
      {
        "id": "med_B0FT3TBXHK_5",
        "type": "image",
        "url": "/products/B0FT3TBXHK/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nHeavy-Duty Load Capacity: Strong adhesive design provides powerful grip for securely holding towels, utensils, keys, accessories, kitchen tools & more.\nNo-Drill, Damage-Free Installation: Simply peel and stick—no nails, screws or tools required. Protects walls, tiles, wood & glass surfaces from damage.\nWaterproof & Moisture-Resistant: Ideal for bathrooms & kitchens; the high-quality adhesive stays strong even in humid conditions.\nStylish Transparent Flower Design: Blends seamlessly with any décor theme while adding a modern, clean look to your living space.\nMulti-Purpose Home Organization: Perfect for kitchens, bathrooms, bedrooms, cupboards, wardrobes, behind doors, living rooms & office spaces.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 21,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FT3TBXHK"
  },
  {
    "asin": "B0FT3X23KM",
    "id": "prod_amz_B0FT3X23KM",
    "name": "Flower Shape Adhesive Wall Hook | Heavy Duty Transparent Wall Holder | No-Drill Waterproof Wall Hooks for Home, Bathroom, Kitchen & Bedroom Organization | Strong Sticker Hooks (Pack of 30)",
    "sub": "IESVRA Boutique — Daily Essentials",
    "price": 279,
    "mrp": 599,
    "categories": [
      "Daily Essentials"
    ],
    "image": "/products/B0FT3X23KM/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FT3X23KM_1",
        "type": "image",
        "url": "/products/B0FT3X23KM/image_1.jpg"
      },
      {
        "id": "med_B0FT3X23KM_2",
        "type": "image",
        "url": "/products/B0FT3X23KM/image_2.jpg"
      },
      {
        "id": "med_B0FT3X23KM_3",
        "type": "image",
        "url": "/products/B0FT3X23KM/image_3.jpg"
      },
      {
        "id": "med_B0FT3X23KM_4",
        "type": "image",
        "url": "/products/B0FT3X23KM/image_4.jpg"
      },
      {
        "id": "med_B0FT3X23KM_5",
        "type": "image",
        "url": "/products/B0FT3X23KM/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nStrong Load-Bearing Power - Heavy-duty adhesive hooks designed to hold everyday household items securely, ideal for home, kitchen, bathroom & storage spaces.\nNo-Drill, No-Damage Installation - Easy peel-and-stick application protects your walls—zero drilling, zero screws, zero mess.\nWaterproof & Moisture Resistant - Durable transparent hooks made to perform in wet areas like bathrooms, tiles, glass, kitchens & washrooms.\nReusable & Residue-Free Removal - Can be removed and repositioned without leaving marks or damaging surfaces—perfect for rented homes.\nMultipurpose Home Organization - Use for hanging utensils, keys, towels, accessories, fairy lights, bags, kitchen tools & more. Suitable for tiles, glass, metal, wood & smooth surfaces.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 82,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FT3X23KM"
  },
  {
    "asin": "B0FT3R2ZDX",
    "id": "prod_amz_B0FT3R2ZDX",
    "name": "Flower Shape Adhesive Wall Hook | Heavy Duty Transparent Wall Holder for Home | No-Drill Sticker Hooks for Bathroom, Kitchen, Bedroom | Strong Utility Wall Hanger for Organization (Pack of 40)",
    "sub": "IESVRA Boutique — Daily Essentials",
    "price": 349,
    "mrp": 599,
    "categories": [
      "Daily Essentials"
    ],
    "image": "/products/B0FT3R2ZDX/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FT3R2ZDX_1",
        "type": "image",
        "url": "/products/B0FT3R2ZDX/image_1.jpg"
      },
      {
        "id": "med_B0FT3R2ZDX_2",
        "type": "image",
        "url": "/products/B0FT3R2ZDX/image_2.jpg"
      },
      {
        "id": "med_B0FT3R2ZDX_3",
        "type": "image",
        "url": "/products/B0FT3R2ZDX/image_3.jpg"
      },
      {
        "id": "med_B0FT3R2ZDX_4",
        "type": "image",
        "url": "/products/B0FT3R2ZDX/image_4.jpg"
      },
      {
        "id": "med_B0FT3R2ZDX_5",
        "type": "image",
        "url": "/products/B0FT3R2ZDX/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nStrong Heavy-Duty Hold – Built with durable adhesive technology that offers a strong grip for hanging towels, utensils, keys, caps, cleaning tools, and everyday home accessories without falling.\nNo-Drill & Damage-Free Installation – Simply peel, stick, and use. These transparent hooks leave no holes, no stains, and no wall damage, making them ideal for renters and easy home improvement.\nMultipurpose for All Rooms – Perfect for use in the bathroom, kitchen, bedroom, balcony, wardrobes, tiles, glass, metal, and smooth wooden surfaces, giving you organized space everywhere.\nWaterproof & Rust-Free – Made with moisture-resistant, transparent material that stays strong even in wet areas like showers, washrooms, and kitchen sinks.\nSpace-Saving & Aesthetic Design – The clear flower-shaped design blends with all interiors while helping you keep your home neat, tidy, and clutter-free.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 74,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FT3R2ZDX"
  },
  {
    "asin": "B0FJLTRRHM",
    "id": "prod_amz_B0FJLTRRHM",
    "name": "Fridge Storage Containers for Vegetables & Fruits | Refrigerator Organizer Bins with Lid & Drain Tray | Stackable, BPA-Free Transparent Kitchen Storage Box (Set of 3)",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 299,
    "mrp": 599,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FJLTRRHM/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FJLTRRHM_1",
        "type": "image",
        "url": "/products/B0FJLTRRHM/image_1.jpg"
      },
      {
        "id": "med_B0FJLTRRHM_2",
        "type": "image",
        "url": "/products/B0FJLTRRHM/image_2.jpg"
      },
      {
        "id": "med_B0FJLTRRHM_3",
        "type": "image",
        "url": "/products/B0FJLTRRHM/image_3.jpg"
      },
      {
        "id": "med_B0FJLTRRHM_4",
        "type": "image",
        "url": "/products/B0FJLTRRHM/image_4.jpg"
      },
      {
        "id": "med_B0FJLTRRHM_5",
        "type": "image",
        "url": "/products/B0FJLTRRHM/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nStackable Space-Saving Design – Compact fridge organizer bins that maximize refrigerator and pantry storage while reducing clutter.\nMoisture-Control Drain Tray – Includes a removable bottom tray to drain water, keeping vegetables and fruits fresh longer.\nMulti-Purpose Use – Perfect for storing fruits, leafy greens, vegetables, snacks, herbs, dairy, and pantry essentials.\nTransparent & BPA-Free Plastic – Made from food-grade, crystal-clear plastic for durability, safety, and quick identification of contents.\nAirtight Lids for Hygiene – Prevents odor mixing, retains freshness, and ensures spill-free storage inside the fridge.\nEasy to Clean & Reusable – Low-maintenance containers that can be rinsed or wiped clean for daily, long-term use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 84,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FJLTRRHM"
  },
  {
    "asin": "B0FMNJNYPG",
    "id": "prod_amz_B0FMNJNYPG",
    "name": "Fridge Storage Containers for Vegetables & Fruits | Stackable Refrigerator Organizer Bins with Lid & Drain Tray | BPA-Free Plastic Kitchen & Pantry Box (Set of 6)",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 549,
    "mrp": 899,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FMNJNYPG/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FMNJNYPG_1",
        "type": "image",
        "url": "/products/B0FMNJNYPG/image_1.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nStackable Space-Saving Design – Organize your refrigerator and pantry neatly with nestable fridge containers that maximize storage capacity without clutter.\nMoisture-Free Freshness – Built-in grid-style drain tray prevents water accumulation, keeping vegetables, fruits, and leafy greens fresher for longer.\nVersatile Multi-Purpose Use – Ideal for storing vegetables, fruits, snacks, meat, herbs, dairy items, and pantry essentials, making kitchen organization simple.\nClear BPA-Free Plastic – Crafted from food-grade, transparent plastic that ensures safety, durability, and quick visibility of contents at a glance.\nAirtight Lids for Hygiene – Secure-fit lids prevent spills, lock in freshness, and avoid odor transfer inside the refrigerator.\nEasy to Clean & Reusable – Low-maintenance containers that can be rinsed or wiped clean for repeated daily use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 16,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNJNYPG"
  },
  {
    "asin": "B0FN49BJHQ",
    "id": "prod_amz_B0FN49BJHQ",
    "name": "Heavy Duty Garbage Bags – 90 Count (30 x 3 Rolls) | Extra Strong Black Trash Bags | Leakproof & Tear-Resistant | Large Disposable Dustbin Bags for Home, Kitchen, Office & Commercial Use",
    "sub": "IESVRA Boutique — Bags & Travel",
    "price": 199,
    "mrp": 599,
    "categories": [
      "Bags & Travel"
    ],
    "image": "/products/B0FN49BJHQ/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FN49BJHQ_1",
        "type": "image",
        "url": "/products/B0FN49BJHQ/image_1.jpg"
      },
      {
        "id": "med_B0FN49BJHQ_2",
        "type": "image",
        "url": "/products/B0FN49BJHQ/image_2.jpg"
      },
      {
        "id": "med_B0FN49BJHQ_3",
        "type": "image",
        "url": "/products/B0FN49BJHQ/image_3.jpg"
      },
      {
        "id": "med_B0FN49BJHQ_4",
        "type": "image",
        "url": "/products/B0FN49BJHQ/image_4.jpg"
      },
      {
        "id": "med_B0FN49BJHQ_5",
        "type": "image",
        "url": "/products/B0FN49BJHQ/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nHeavy Duty Strength & Durability – Made with premium thick material to handle wet, dry, sharp, or heavy waste without tearing. Ideal for daily and industrial use.\nLeakproof & Mess-Free – Advanced sealed bottom prevents leakage and keeps your dustbin clean and hygienic, even with wet kitchen waste.\nMultipurpose Use – Perfect for home, kitchen, office, restaurants, hotels, hospitals, salons, shops, and commercial spaces.\nConvenient Roll Packing – Comes in 3 easy-to-pull rolls (30 bags each) for quick dispensing, easy storage, and clutter-free use.\nLarge Size & Extra Capacity – Spacious black bags designed to fit most medium & large dustbins, providing maximum load-bearing strength.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 29,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FN49BJHQ"
  },
  {
    "asin": "B0FNMQTDCR",
    "id": "prod_amz_B0FNMQTDCR",
    "name": "Guardian Bell Keychain | Tibetan Good Luck Protection Bell Key Chain for Car, Bike, Motorcycle, Home & Travel | Spiritual Charm & Positive Energy Amulet",
    "sub": "IESVRA Boutique — Bags & Travel",
    "price": 349,
    "mrp": 17450,
    "categories": [
      "Bags & Travel"
    ],
    "image": "/products/B0FNMQTDCR/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FNMQTDCR_1",
        "type": "image",
        "url": "/products/B0FNMQTDCR/image_1.jpg"
      },
      {
        "id": "med_B0FNMQTDCR_2",
        "type": "image",
        "url": "/products/B0FNMQTDCR/image_2.jpg"
      },
      {
        "id": "med_B0FNMQTDCR_3",
        "type": "image",
        "url": "/products/B0FNMQTDCR/image_3.jpg"
      },
      {
        "id": "med_B0FNMQTDCR_4",
        "type": "image",
        "url": "/products/B0FNMQTDCR/image_4.jpg"
      },
      {
        "id": "med_B0FNMQTDCR_5",
        "type": "image",
        "url": "/products/B0FNMQTDCR/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "Bring protection, positivity, and style wherever you go with the IESVRA Guardian Bell Keychain. Inspired by Tibetan traditions, this symbolic bell is believed to ward off negativity and attract good fortune. Whether used as a charm for your motorcycle, car, or carried in daily life, it serves as a constant reminder of spiritual energy and blessings. Compact and elegant, it makes a thoughtful gift for riders, travelers, and loved ones.",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 77,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNMQTDCR"
  },
  {
    "asin": "B0GY8NFSF2",
    "id": "prod_amz_B0GY8NFSF2",
    "name": "Portable Cordless Heating Pad for Menstrual Pain Relief | 3 Heat & 4 Massage Modes | Rechargeable Period Cramp Relief Belt for Belly, Waist | Adjustable Pain Relief Warmer for Women",
    "sub": "IESVRA Boutique — Massagers",
    "price": 499,
    "mrp": 999,
    "categories": [
      "Massagers"
    ],
    "image": "/products/B0GY8NFSF2/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GY8NFSF2_1",
        "type": "image",
        "url": "/products/B0GY8NFSF2/image_1.jpg"
      },
      {
        "id": "med_B0GY8NFSF2_2",
        "type": "image",
        "url": "/products/B0GY8NFSF2/image_2.jpg"
      },
      {
        "id": "med_B0GY8NFSF2_3",
        "type": "image",
        "url": "/products/B0GY8NFSF2/image_3.jpg"
      },
      {
        "id": "med_B0GY8NFSF2_4",
        "type": "image",
        "url": "/products/B0GY8NFSF2/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nFast & Effective Menstrual Pain Relief - Designed to provide quick comfort during period cramps, lower belly pain, backaches, and muscle tension with deep warming technology.\n3 Heat Levels for Personalized Comfort - Features adjustable low, medium, and high heat settings to suit different pain levels and provide soothing warmth anytime.\n4 Intelligent Massage Modes - Combines vibration massage with heat therapy to relax muscles, reduce stiffness, and support all-day comfort for women.\nCordless, Lightweight & Rechargeable - Built with a long-lasting rechargeable battery, the belt is portable and easy to use anywhere—home, office, travel, or outdoors.\nSoft, Adjustable & Skin-Friendly Design - Made with comfortable elastic fabric that fits securely on the waist or abdomen, suitable for all body types.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 49,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GY8NFSF2"
  },
  {
    "asin": "B0FJLTJBNY",
    "id": "prod_amz_B0FJLTJBNY",
    "name": "4-in-1 Airtight Kitchen Storage Container | Multipurpose Plastic Masala & Spice Box with Flip Lids | Transparent Food Organizer Jar for Pulses, Grains, Cereals, Snacks, Tea & Sugar",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 219,
    "mrp": 999,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FJLTJBNY/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FJLTJBNY_1",
        "type": "image",
        "url": "/products/B0FJLTJBNY/image_1.jpg"
      },
      {
        "id": "med_B0FJLTJBNY_2",
        "type": "image",
        "url": "/products/B0FJLTJBNY/image_2.jpg"
      },
      {
        "id": "med_B0FJLTJBNY_3",
        "type": "image",
        "url": "/products/B0FJLTJBNY/image_3.jpg"
      },
      {
        "id": "med_B0FJLTJBNY_4",
        "type": "image",
        "url": "/products/B0FJLTJBNY/image_4.jpg"
      },
      {
        "id": "med_B0FJLTJBNY_5",
        "type": "image",
        "url": "/products/B0FJLTJBNY/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\n4-in-1 Multipurpose Design – Store 4 different items in one jar; ideal for masalas, spices, pulses, cereals, grains, sugar, tea, coffee, or snacks.\nAirtight & Moisture-Proof – Flip-top lids with strong seals keep food fresh longer and protect against moisture, pests, and spills.\nTransparent Body for Quick Access – Instantly identify contents without opening, saving time during cooking and meal prep.\nDurable & Food-Safe Plastic – Made from premium BPA-free plastic, sturdy, lightweight, and safe for everyday kitchen use.\nEasy to Clean & Refill – Wide-mouthed compartments and smooth interiors make refilling and cleaning hassle-free.\nCompact & Stackable Organizer – Space-saving design fits perfectly in modular kitchens, pantries, and small storage spaces.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 83,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FJLTJBNY"
  },
  {
    "asin": "B0FT3TD2Z8",
    "id": "prod_amz_B0FT3TD2Z8",
    "name": "Glass Oil Dispenser 250ml | Refillable Cooking Oil Sprayer Bottle for Kitchen, BBQ, Air Fryer & Baking | Fine Mist Olive Spray Bottle for Healthy Cooking (1 Pack)",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 198,
    "mrp": 799,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0FT3TD2Z8/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FT3TD2Z8_1",
        "type": "image",
        "url": "/products/B0FT3TD2Z8/image_1.jpg"
      },
      {
        "id": "med_B0FT3TD2Z8_2",
        "type": "image",
        "url": "/products/B0FT3TD2Z8/image_2.jpg"
      },
      {
        "id": "med_B0FT3TD2Z8_3",
        "type": "image",
        "url": "/products/B0FT3TD2Z8/image_3.jpg"
      },
      {
        "id": "med_B0FT3TD2Z8_4",
        "type": "image",
        "url": "/products/B0FT3TD2Z8/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nFine Mist Spray for Healthy Cooking - Designed with a precision nozzle that gives a uniform fine mist, helping you control oil usage and cook healthier meals in your kitchen, BBQ grill, baking tray or air fryer.\nPremium Glass Body for Safe Storage - Made with food-grade transparent glass, this oil sprayer ensures safe storage of edible oils like olive oil, sunflower oil, vinegar, etc., without affecting the taste.\nMultipurpose for All Cooking Needs - Perfect for grilling, roasting, sautéing, frying, salad dressing and baking. Ideal for both home kitchen and outdoor BBQ use.\nEasy to Use & Refillable - Simple pump-action design allows hassle-free spraying. The wide-mouth opening makes refilling easy without spills or mess.\nLeak-Proof & Portable - Built with a leak-resistant cap and strong pump mechanism, making it easy to carry and store. Suitable for everyday kitchen use and travel.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 64,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FT3TD2Z8"
  },
  {
    "asin": "B0FMMCKYHB",
    "id": "prod_amz_B0FMMCKYHB",
    "name": "Airtight Fridge Storage Containers 6-in-1 Set | BPA-Free Refrigerator Organizer Boxes with Lid & Drain Basket | Leakproof Vegetable, Fruit, Meat & Leftover Storage Box for Kitchen",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 199,
    "mrp": 999,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FMMCKYHB/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FMMCKYHB_1",
        "type": "image",
        "url": "/products/B0FMMCKYHB/image_1.jpg"
      },
      {
        "id": "med_B0FMMCKYHB_2",
        "type": "image",
        "url": "/products/B0FMMCKYHB/image_2.jpg"
      },
      {
        "id": "med_B0FMMCKYHB_3",
        "type": "image",
        "url": "/products/B0FMMCKYHB/image_3.jpg"
      },
      {
        "id": "med_B0FMMCKYHB_4",
        "type": "image",
        "url": "/products/B0FMMCKYHB/image_4.jpg"
      },
      {
        "id": "med_B0FMMCKYHB_5",
        "type": "image",
        "url": "/products/B0FMMCKYHB/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\n6-in-1 Airtight Design: Comes with six removable drain baskets inside a large container to keep different food items fresh, separated, and moisture-free.\nKeeps Food Fresher Longer: Built-in drainage holes allow water to escape, reducing spoilage and preserving fruits, vegetables, and cooked items.\nMultipurpose Storage: Ideal for storing fruits, vegetables, meat, seafood, snacks, and leftovers in your fridge or freezer.\nBPA-Free & Food Safe: Made from high-quality, food-grade plastic that is non-toxic, odor-free, and safe for long-term food storage.\nTransparent & Space-Saving: Clear body for easy visibility of contents; stackable design optimizes fridge space and keeps it organized.\nLeakproof & Easy to Clean: Airtight lid with secure lock clips prevents spills and odor mixing; dishwasher-safe for quick cleaning.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 83,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMMCKYHB"
  },
  {
    "asin": "B0GYF7HYV1",
    "id": "prod_amz_B0GYF7HYV1",
    "name": "Shoe Cleaning Wipes | Quick Sneaker Wipes for Shoes | Portable Shoe Cleaner for Sneakers, Leather & Sports Footwear | White Shoe Cleaning Wipes (Pack of 2)",
    "sub": "IESVRA Boutique — Daily Essentials",
    "price": 210,
    "mrp": 899,
    "categories": [
      "Daily Essentials"
    ],
    "image": "/products/B0GYF7HYV1/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GYF7HYV1_1",
        "type": "image",
        "url": "/products/B0GYF7HYV1/image_1.jpg"
      },
      {
        "id": "med_B0GYF7HYV1_2",
        "type": "image",
        "url": "/products/B0GYF7HYV1/image_2.jpg"
      },
      {
        "id": "med_B0GYF7HYV1_3",
        "type": "image",
        "url": "/products/B0GYF7HYV1/image_3.jpg"
      },
      {
        "id": "med_B0GYF7HYV1_4",
        "type": "image",
        "url": "/products/B0GYF7HYV1/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "Keep your favourite shoes looking clean and fresh with the IESVRA Shoe Cleaning Wipes Pack of 2 (160 wipes). Designed for effortless everyday shoe maintenance, these pre-moistened wipes remove dust, grime and surface marks in seconds. The gentle formula works safely on sneakers, leather shoes, canvas footwear, rubber soles and sports shoes, making them a versatile cleaning solution for all types of shoes. Their compact and travel-friendly design allows you to clean your footwear on-the-go—whether you're at the office, gym, school or traveling. Each wipe is individually moistened to maintain cleaning performance without leaving any residue. With a total of 160 wipes, this value pack ensures long-lasting convenience, helping you maintain neat and presentable shoes throughout the day. Perfect for users who want quick shoe touch-ups, sneaker maintenance, and hassle-free footwear cleaning without water.",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 69,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GYF7HYV1"
  },
  {
    "asin": "B0GYF3LHPY",
    "id": "prod_amz_B0GYF3LHPY",
    "name": "Shoe Cleaning Wipes | Quick Sneaker Wipes for Shoes | Portable Shoe Cleaner for Sneakers, Leather & Sports Footwear | White Shoe Cleaning Wipes (Pack of 1)",
    "sub": "IESVRA Boutique — Daily Essentials",
    "price": 129,
    "mrp": 899,
    "categories": [
      "Daily Essentials"
    ],
    "image": "/products/B0GYF3LHPY/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GYF3LHPY_1",
        "type": "image",
        "url": "/products/B0GYF3LHPY/image_1.jpg"
      },
      {
        "id": "med_B0GYF3LHPY_2",
        "type": "image",
        "url": "/products/B0GYF3LHPY/image_2.jpg"
      },
      {
        "id": "med_B0GYF3LHPY_3",
        "type": "image",
        "url": "/products/B0GYF3LHPY/image_3.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "Keep your favourite shoes looking clean and fresh with the IESVRA Shoe Cleaning Wipes Pack of 2 (160 wipes). Designed for effortless everyday shoe maintenance, these pre-moistened wipes remove dust, grime and surface marks in seconds. The gentle formula works safely on sneakers, leather shoes, canvas footwear, rubber soles and sports shoes, making them a versatile cleaning solution for all types of shoes. Their compact and travel-friendly design allows you to clean your footwear on-the-go—whether you're at the office, gym, school or traveling. Each wipe is individually moistened to maintain cleaning performance without leaving any residue. With a total of 160 wipes, this value pack ensures long-lasting convenience, helping you maintain neat and presentable shoes throughout the day. Perfect for users who want quick shoe touch-ups, sneaker maintenance, and hassle-free footwear cleaning without water.",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 25,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GYF3LHPY"
  },
  {
    "asin": "B0FKMBDMLT",
    "id": "prod_amz_B0FKMBDMLT",
    "name": "Square Masala Box with 7 Compartments & Spoon | Plastic Spice Organizer with Airtight Lid | Indian Spice Storage Container for Kitchen (1 Pc, Brown)",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 199,
    "mrp": 499,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FKMBDMLT/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FKMBDMLT_1",
        "type": "image",
        "url": "/products/B0FKMBDMLT/image_1.jpg"
      },
      {
        "id": "med_B0FKMBDMLT_2",
        "type": "image",
        "url": "/products/B0FKMBDMLT/image_2.jpg"
      },
      {
        "id": "med_B0FKMBDMLT_3",
        "type": "image",
        "url": "/products/B0FKMBDMLT/image_3.jpg"
      },
      {
        "id": "med_B0FKMBDMLT_4",
        "type": "image",
        "url": "/products/B0FKMBDMLT/image_4.jpg"
      },
      {
        "id": "med_B0FKMBDMLT_5",
        "type": "image",
        "url": "/products/B0FKMBDMLT/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nOrganized Spice Storage – Comes with 7 separate compartments and a central spoon to store daily-use spices neatly and access them easily while cooking.\nDurable & Food-Grade Material – Made from high-quality, BPA-free plastic that is safe for food storage and resistant to breakage.\nCompact & Space-Saving Design – Square shape fits easily in kitchen cabinets, shelves, or countertops without occupying extra space.\nTransparent Lid for Easy Viewing – Clear top lid allows you to check spice levels at a glance without opening the box.\nMultipurpose Utility Box – Ideal for storing masalas, herbs, mouth freshener, dry fruits, seeds, and condiments for home or restaurant use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 91,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FKMBDMLT"
  },
  {
    "asin": "B0GTQ7TCKY",
    "id": "prod_amz_B0GTQ7TCKY",
    "name": "Adjustable Aluminum Laptop Stand Foldable Portable | Ergonomic Laptop Riser with Anti-Slip Pads | Heavy Duty Cooling Stand for Desk, MacBook, Notebook (Silver)",
    "sub": "IESVRA Boutique — Mobile Accessories",
    "price": 239,
    "mrp": 2499,
    "categories": [
      "Mobile Accessories"
    ],
    "image": "/products/B0GTQ7TCKY/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GTQ7TCKY_1",
        "type": "image",
        "url": "/products/B0GTQ7TCKY/image_1.jpg"
      },
      {
        "id": "med_B0GTQ7TCKY_2",
        "type": "image",
        "url": "/products/B0GTQ7TCKY/image_2.jpg"
      },
      {
        "id": "med_B0GTQ7TCKY_3",
        "type": "image",
        "url": "/products/B0GTQ7TCKY/image_3.jpg"
      },
      {
        "id": "med_B0GTQ7TCKY_4",
        "type": "image",
        "url": "/products/B0GTQ7TCKY/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nIESVRA Height Adjusting Laptop Stand Or Laptop Ergonomic Stand Or Laptop Stands For Office Desk Improves Your Posture Scientifically Designed To Help You Balance You’re Sitting Posture Keeping Your Back Straight, Neck Relaxed And Wrists Natural Even After Long Work Hours\nMulti-Angle Adjustable Design: The Aluminium Laptop Stand Or Metal Laptop Stand Or Foldable Laptop Stand Or Better Known As A Aluminum Laptop Stand Provides 6-Speed Adjustable Height, Adjust To Comfortable Operating Angle And Height Based On Your Actual Need. And The Ergonomic Design Makes For Easy Watching And Typing, Relieving Neck, Shoulder And Spinal Pain.\nCompatibility: The Laptop & Tablet Stand Supports Most Devices From 10 - 15.6 Inches: Macbook, Thinkpad, Surface, Chromebook, Ipad Pro, Etc. Therefore Known As A 11.6 Inch Laptop Stand ,12 Inch Laptop Stand , 13.3 Inch Laptop Stand ,15 Inch Laptop Stans & 15.6 Inch Laptop Stand\nIESVRA Travel Laptop Stand Or Laptop Stand Metal Is A Laptop Foldable Stand Which You Can Fold And Carry Easly In Your Backpack Or Briefcase You Can Use It To Change Angle Of Your Laptop Therefore Use It As Laptop Incline Stand Or Laptop Height Stand\nLaptop stand fully foldable, light weight at 260gm only and extremely handy to carry in your office bag [Increases laptop life]-keeps your laptop cooler so the battery life and internal components life also improves\nEXQUISITE WORKMANSHIP: Machined from anodized aluminum alloy, with sand blasted and brushed processes. With Non-slip silicone mat, avoid from risking of any scratches to your devices and stable placement makes it the best laptop stand available in the market\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 41,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GTQ7TCKY"
  },
  {
    "asin": "B0GTLYX2JX",
    "id": "prod_amz_B0GTLYX2JX",
    "name": "Foldable Aluminum Alloy Laptop Stand, Adjustable Portable Holder with Anti-Slip Silicone Pads, Ergonomic Cooling Stand for MacBook, Laptop & Tablet, Silver",
    "sub": "IESVRA Boutique — Mobile Accessories",
    "price": 239,
    "mrp": 899,
    "categories": [
      "Mobile Accessories"
    ],
    "image": "/products/B0GTLYX2JX/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GTLYX2JX_1",
        "type": "image",
        "url": "/products/B0GTLYX2JX/image_1.jpg"
      },
      {
        "id": "med_B0GTLYX2JX_2",
        "type": "image",
        "url": "/products/B0GTLYX2JX/image_2.jpg"
      },
      {
        "id": "med_B0GTLYX2JX_3",
        "type": "image",
        "url": "/products/B0GTLYX2JX/image_3.jpg"
      },
      {
        "id": "med_B0GTLYX2JX_4",
        "type": "image",
        "url": "/products/B0GTLYX2JX/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nDURABLE ALUMINIUM ALLOY BUILD: Crafted from high-quality aluminium alloy, this laptop stand offers a strong, stable, and scratch-resistant base with a sleek, modern finish\n7 ADJUSTABLE HEIGHT LEVELS: Features multiple ergonomic angle settings to help reduce neck, shoulder, and back strain, letting you find the optimal viewing position for long work sessions\nFOLDABLE & PORTABLE DESIGN: Folds flat into a compact form and comes with a drawstring carry pouch, making it easy to carry to the office, home, or while travelling\nANTI-SLIP SILICONE PADS & STURDY HINGES: Non-slip silicone pads on the base and support arms keep your device secure and scratch-free, while robust hinges ensure lasting stability\nVENTILATED COOLING STRUCTURE: The open-frame design promotes increased airflow beneath your laptop, helping prevent overheating during extended use and compatible with most laptops, MacBooks, and tablets\nUNIVERSAL COMPATIBILITY: Supports a wide range of devices including laptops from 10 to 17 inches, MacBooks, notebooks, and tablets, accommodating various brands and models\nLIGHTWEIGHT CONSTRUCTION: Weighs minimally while maintaining structural integrity, allowing for effortless transportation between workspaces without compromising on stability or durability\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 86,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GTLYX2JX"
  },
  {
    "asin": "B0GN21V5Z7",
    "id": "prod_amz_B0GN21V5Z7",
    "name": "1200ml Leak Proof Lunch Box for Office & School | BPA Free Food Container with Airtight Lid | Microwave Safe, Durable & Lightweight Tiffin Box for Men, Women & Kids (Bule)",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 239,
    "mrp": 499,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0GN21V5Z7/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GN21V5Z7_1",
        "type": "image",
        "url": "/products/B0GN21V5Z7/image_1.jpg"
      },
      {
        "id": "med_B0GN21V5Z7_2",
        "type": "image",
        "url": "/products/B0GN21V5Z7/image_2.jpg"
      },
      {
        "id": "med_B0GN21V5Z7_3",
        "type": "image",
        "url": "/products/B0GN21V5Z7/image_3.jpg"
      },
      {
        "id": "med_B0GN21V5Z7_4",
        "type": "image",
        "url": "/products/B0GN21V5Z7/image_4.jpg"
      },
      {
        "id": "med_B0GN21V5Z7_5",
        "type": "image",
        "url": "/products/B0GN21V5Z7/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\n100% Leak Proof & Airtight Design – Secure locking lid prevents spills and keeps food fresh for long hours, making it ideal for office, school, college & travel.\nSafe BPA Free Material – Made from high-quality food grade plastic, free from harmful chemicals and completely safe for daily food storage.\nMicrowave Safe & Easy to Clean – Heat your meals conveniently without transferring to another container. Dishwasher friendly and stain resistant.\n1200ml Large Capacity – Perfect size for carrying lunch, snacks, fruits or full meals for men, women and growing kids.\nLightweight & Durable Build – Strong yet lightweight design fits easily in backpacks and office bags, perfect for daily use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 70,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GN21V5Z7"
  },
  {
    "asin": "B0H7S3FQWS",
    "id": "prod_amz_B0H7S3FQWS",
    "name": "Sonic Electric Toothbrush for Adults, Multicolor | USB Rechargeable, 2 Replacement Brush Heads, 5 Brushing Modes, Deep Cleaning, Plaque Removal & Gum Care",
    "sub": "IESVRA Boutique — Beauty & Personal Care",
    "price": 279,
    "mrp": 27900,
    "categories": [
      "Beauty & Personal Care"
    ],
    "image": "/products/B0H7S3FQWS/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0H7S3FQWS_1",
        "type": "image",
        "url": "/products/B0H7S3FQWS/image_1.jpg"
      },
      {
        "id": "med_B0H7S3FQWS_2",
        "type": "image",
        "url": "/products/B0H7S3FQWS/image_2.jpg"
      },
      {
        "id": "med_B0H7S3FQWS_3",
        "type": "image",
        "url": "/products/B0H7S3FQWS/image_3.jpg"
      },
      {
        "id": "med_B0H7S3FQWS_4",
        "type": "image",
        "url": "/products/B0H7S3FQWS/image_4.jpg"
      },
      {
        "id": "med_B0H7S3FQWS_5",
        "type": "image",
        "url": "/products/B0H7S3FQWS/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nPowerful Sonic Cleaning: Advanced sonic technology helps remove plaque effectively while providing a thorough clean for healthier teeth and fresher breath\n5 Brushing Modes: Features Clean, White, Polish, Sensitive, and Gum Care modes to suit different oral care needs and provide a personalized brushing experience\nUSB Rechargeable Convenience: Recharge easily using the included USB charging cable. Designed for regular daily use with long-lasting battery performance\nIncludes 2 Replacement Brush Heads: Comes with two high-quality brush heads for extended use. Soft bristles are gentle on gums while cleaning teeth effectively\nComfortable & Travel-Friendly Design: Lightweight ergonomic handle offers a comfortable grip. Suitable for home, office, and travel use\nSmart Timer Function: Built-in timer helps ensure proper brushing duration for optimal oral care and effective cleaning results every time\nWaterproof Construction: Fully waterproof design allows safe use in the shower and makes cleaning the toothbrush quick and easy under running water\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 54,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0H7S3FQWS"
  },
  {
    "asin": "B0GPH37X28",
    "id": "prod_amz_B0GPH37X28",
    "name": "Combo- 4-Piece Airtight Kitchen Masala Box Set with Tray & 4-in-1 Airtight Storage Container | Transparent Spice Containers with Rack & Dry Storage Jar",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 399,
    "mrp": 599,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0GPH37X28/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GPH37X28_1",
        "type": "image",
        "url": "/products/B0GPH37X28/image_1.jpg"
      },
      {
        "id": "med_B0GPH37X28_2",
        "type": "image",
        "url": "/products/B0GPH37X28/image_2.jpg"
      },
      {
        "id": "med_B0GPH37X28_3",
        "type": "image",
        "url": "/products/B0GPH37X28/image_3.jpg"
      },
      {
        "id": "med_B0GPH37X28_4",
        "type": "image",
        "url": "/products/B0GPH37X28/image_4.jpg"
      },
      {
        "id": "med_B0GPH37X28_5",
        "type": "image",
        "url": "/products/B0GPH37X28/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nCOMPLETE KITCHEN STORAGE COMBO Includes 4-piece masala box set with tray rack and 4-in-1 airtight storage container, offering organized storage for daily cooking essentials.\nAIRTIGHT & MOISTURE-RESISTANT LIDS Designed to help keep spices, pulses and dry ingredients fresh by reducing exposure to air and humidity.\nSPACE-SAVING & MODULAR DESIGN Compact tray rack and vertical 4-compartment jar optimize shelf space and maintain a neat kitchen setup.\nTRANSPARENT BODY FOR EASY IDENTIFICATION Clear containers allow quick visibility of contents, making meal preparation faster and more convenient.\nMULTI-PURPOSE DAILY USE STORAGE Ideal for masalas, salt, sugar, dals, rice, dry fruits, snacks and grocery items for everyday kitchen use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 21,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GPH37X28"
  },
  {
    "asin": "B0GNS8BS61",
    "id": "prod_amz_B0GNS8BS61",
    "name": "Motivational Water Bottle 3 Pcs Set (2000ml + 900ml + 300ml) | Transparent Leakproof Plastic Water Bottles with Time Marker | Gym, Office, School & Travel | BPA Free |",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 299,
    "mrp": 599,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0GNS8BS61/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GNS8BS61_1",
        "type": "image",
        "url": "/products/B0GNS8BS61/image_1.jpg"
      },
      {
        "id": "med_B0GNS8BS61_2",
        "type": "image",
        "url": "/products/B0GNS8BS61/image_2.jpg"
      },
      {
        "id": "med_B0GNS8BS61_3",
        "type": "image",
        "url": "/products/B0GNS8BS61/image_3.jpg"
      },
      {
        "id": "med_B0GNS8BS61_4",
        "type": "image",
        "url": "/products/B0GNS8BS61/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nComplete 3 Size Hydration Combo Includes 2000ml large bottle, 900ml medium bottle, and 300ml compact bottle — perfect for full-day hydration, workouts, school, travel, and daily office use.\nMotivational Time Markers for Daily Intake Clear measurement scale and time reminders help track water consumption easily and support consistent hydration throughout the day.\nLeakproof & Secure Flip Lock Design Strong locking lid with safety latch prevents leakage. Ideal for carrying in gym bags, backpacks, or travel without spills.\nDurable, Lightweight & BPA-Free Plastic Made from high-quality transparent plastic that is lightweight, sturdy, and safe for everyday use.\nDesigned for Everyday Convenience Carry handle for easy grip, slim design for better portability, and wide mouth opening for easy cleaning and refilling.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 58,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GNS8BS61"
  },
  {
    "asin": "B0FMNQZXH8",
    "id": "prod_amz_B0FMNQZXH8",
    "name": "4-in-1 Airtight Kitchen Storage Container | Multipurpose Plastic Masala & Spice Box with Flip Lids | Transparent Food Organizer Jar for Pulses, Grains, Cereals, Snacks, Tea & Sugar (Set of 2)",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 399,
    "mrp": 999,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FMNQZXH8/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FMNQZXH8_1",
        "type": "image",
        "url": "/products/B0FMNQZXH8/image_1.jpg"
      },
      {
        "id": "med_B0FMNQZXH8_2",
        "type": "image",
        "url": "/products/B0FMNQZXH8/image_2.jpg"
      },
      {
        "id": "med_B0FMNQZXH8_3",
        "type": "image",
        "url": "/products/B0FMNQZXH8/image_3.jpg"
      },
      {
        "id": "med_B0FMNQZXH8_4",
        "type": "image",
        "url": "/products/B0FMNQZXH8/image_4.jpg"
      },
      {
        "id": "med_B0FMNQZXH8_5",
        "type": "image",
        "url": "/products/B0FMNQZXH8/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\n4-in-1 Compartment Design – Store 4 different food items in one container; ideal for spices, masalas, cereals, pulses, grains, snacks, tea, coffee, or sugar.\nAirtight & Moisture-Proof – Flip-top lids with tight seals maintain freshness, prevent moisture, and keep pests away.\nTransparent Body for Easy Access – Quickly check contents without opening the jar, ensuring efficient kitchen organization.\nDurable & BPA-Free Plastic – Made from high-quality, food-safe plastic that is non-toxic, sturdy, and safe for everyday kitchen use.\nEasy to Clean & Refill – Wide openings and smooth surfaces make cleaning and refilling hassle-free.\nSpace-Saving & Stackable Design – Compact, stylish, and ideal for modular kitchens, small apartments, and pantry shelves.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 52,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNQZXH8"
  },
  {
    "asin": "B0GGH1ZFYN",
    "id": "prod_amz_B0GGH1ZFYN",
    "name": "Lucky Owl Resin Statue for Good Luck – Aesthetic Owl Art Figurine Showpiece for Home & Office Décor, Feng Shui & Vastu Wisdom Ornament Gift",
    "sub": "IESVRA Boutique — Daily Essentials",
    "price": 0,
    "mrp": 0,
    "categories": [
      "Daily Essentials"
    ],
    "image": "/products/B0GGH1ZFYN/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GGH1ZFYN_1",
        "type": "image",
        "url": "/products/B0GGH1ZFYN/image_1.jpg"
      },
      {
        "id": "med_B0GGH1ZFYN_2",
        "type": "image",
        "url": "/products/B0GGH1ZFYN/image_2.jpg"
      },
      {
        "id": "med_B0GGH1ZFYN_3",
        "type": "image",
        "url": "/products/B0GGH1ZFYN/image_3.jpg"
      },
      {
        "id": "med_B0GGH1ZFYN_4",
        "type": "image",
        "url": "/products/B0GGH1ZFYN/image_4.jpg"
      },
      {
        "id": "med_B0GGH1ZFYN_5",
        "type": "image",
        "url": "/products/B0GGH1ZFYN/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nLucky Owl Resin Statue – Symbolizes good luck, wisdom & protection, perfect for energy positivity décor.\nHigh‑Quality Aesthetic Home Décor – Crafted with premium resin for a smooth, elegant finish that suits modern and classic styles.\nMulti‑Purpose Decoration – Ideal for living room, bedroom, study desk, office table, shelf, or reception area.\nThoughtful Gift Idea – A meaningful present for friends & family for housewarming, festivals, or special occasions.\nFeng Shui & Vastu Friendly – Brings harmony, positive vibes & prosperity to any space where displayed\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 58,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GGH1ZFYN"
  },
  {
    "asin": "B0CKJ2HCQ6",
    "id": "prod_amz_B0CKJ2HCQ6",
    "name": "NANZU Glass 2 in 1 Oil Sprayer and Dispenser Bottle - 500ML for Kitchen, Cooking, BBQ, Air Fryer, Salad, Frying, Baking, Transparent",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 229,
    "mrp": 599,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0CKJ2HCQ6/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0CKJ2HCQ6_1",
        "type": "image",
        "url": "/products/B0CKJ2HCQ6/image_1.jpg"
      },
      {
        "id": "med_B0CKJ2HCQ6_2",
        "type": "image",
        "url": "/products/B0CKJ2HCQ6/image_2.jpg"
      },
      {
        "id": "med_B0CKJ2HCQ6_3",
        "type": "image",
        "url": "/products/B0CKJ2HCQ6/image_3.jpg"
      },
      {
        "id": "med_B0CKJ2HCQ6_4",
        "type": "image",
        "url": "/products/B0CKJ2HCQ6/image_4.jpg"
      },
      {
        "id": "med_B0CKJ2HCQ6_5",
        "type": "image",
        "url": "/products/B0CKJ2HCQ6/image_5.jpg"
      },
      {
        "id": "med_B0CKJ2HCQ6_6",
        "type": "image",
        "url": "/products/B0CKJ2HCQ6/image_6.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\n【2 in 1 Olive Oil Sprayer and Oiler】This oil dispenser bottle has a built-in spout. You can switch between spray and pour functions at any time. Kitchenware tools for home and kitchen.\n【Upgraded Nozzle Design】The nozzle of this olive oil dispenser bottle has been upgraded to achieve a uniform fan-shaped spray. The upgraded anti-drip design realizes no dripping or hanging on the wall when pouring oil.\n【Food Grade Material】This olive oil sprayer is made of thickened lead-free glass material, sturdy and durable. The clear bottle lets you know exactly how much oil is left. The lid and handle are made of food grade PP material, BPA free.\n【Large Diameter Spout】The spout of this oil dispenser bottle has been widened, which is very convenient for pouring sunflower oil, vinegar, soy sauce, lemon and lime juice, sherry or marsala wine, etc.\n【Easy to Use and Clean】This oil dispenser bottle has an ergonomic handle. The handle is comfortable to hold. The body of the pot is not easy to hang oil, and it is easy to clean. Dishwasher safe.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 55,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0CKJ2HCQ6"
  },
  {
    "asin": "B0F8BWVZ64",
    "id": "prod_amz_B0F8BWVZ64",
    "name": "RERANT (Pack of 5, 39 Inches) Door Guard – Bottom Seal Strip Gap Filler for Doors | Soundproof, Noise Reduction, Energy Saving, Dust & Insect, Rat Protector, Door Strip for Home & Office",
    "sub": "IESVRA Boutique — Daily Essentials",
    "price": 199,
    "mrp": 3980,
    "categories": [
      "Daily Essentials"
    ],
    "image": "/products/B0F8BWVZ64/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0F8BWVZ64_1",
        "type": "image",
        "url": "/products/B0F8BWVZ64/image_1.jpg"
      },
      {
        "id": "med_B0F8BWVZ64_2",
        "type": "image",
        "url": "/products/B0F8BWVZ64/image_2.jpg"
      },
      {
        "id": "med_B0F8BWVZ64_3",
        "type": "image",
        "url": "/products/B0F8BWVZ64/image_3.jpg"
      },
      {
        "id": "med_B0F8BWVZ64_4",
        "type": "image",
        "url": "/products/B0F8BWVZ64/image_4.jpg"
      },
      {
        "id": "med_B0F8BWVZ64_5",
        "type": "image",
        "url": "/products/B0F8BWVZ64/image_5.jpg"
      },
      {
        "id": "med_B0F8BWVZ64_6",
        "type": "image",
        "url": "/products/B0F8BWVZ64/image_6.jpg"
      },
      {
        "id": "med_B0F8BWVZ64_7",
        "type": "image",
        "url": "/products/B0F8BWVZ64/image_7.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nThe Twin Draft Guard is made from a washable fabric that is abrasion resistant. Not only does the draft guard help keep the heat in and cold out, it also keeps dust, sand, and bugs out while also helping with sound insulation.\nYou can save a lot of power if you are running an air conditioner in your room. An AC needs to work harder if there is air leak from the room, especially from under the door\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 89,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0F8BWVZ64"
  },
  {
    "asin": "B0H6M1SP15",
    "id": "prod_amz_B0H6M1SP15",
    "name": "Spin Mop Bucket Set with Stainless Steel Handle | 360° Rotating Microfiber Floor Cleaning Mop | 2 Refill Heads | Easy Spin Wringer System | Blue",
    "sub": "IESVRA Boutique — Daily Essentials",
    "price": 748,
    "mrp": 299900,
    "categories": [
      "Daily Essentials"
    ],
    "image": "/products/B0H6M1SP15/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0H6M1SP15_1",
        "type": "image",
        "url": "/products/B0H6M1SP15/image_1.jpg"
      },
      {
        "id": "med_B0H6M1SP15_2",
        "type": "image",
        "url": "/products/B0H6M1SP15/image_2.jpg"
      },
      {
        "id": "med_B0H6M1SP15_3",
        "type": "image",
        "url": "/products/B0H6M1SP15/image_3.jpg"
      },
      {
        "id": "med_B0H6M1SP15_4",
        "type": "image",
        "url": "/products/B0H6M1SP15/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nEFFICIENT 360° FLOOR CLEANING - 360-degree rotating mop head easily reaches under furniture, corners, and hard-to-clean areas for effective home cleaning.\nHANDS-FREE SPIN WRINGER SYSTEM - Built-in spin mechanism helps remove excess water quickly, reducing effort and keeping hands clean during mopping.\nDURABLE STAINLESS STEEL HANDLE - Strong stainless steel telescopic handle offers durability, rust resistance, and comfortable grip for everyday use.\nHIGH ABSORBENCY MICROFIBER REFILLS - Includes 2 microfiber mop heads that effectively absorb dust, dirt, and spills while being gentle on floor surfaces.\nMULTIPURPOSE HOME CLEANING TOOL - Suitable for tiles, marble, granite, laminate, wooden floors, kitchens, bathrooms, offices, and living spaces.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 24,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0H6M1SP15"
  },
  {
    "asin": "B0FMNWLK3C",
    "id": "prod_amz_B0FMNWLK3C",
    "name": "Door Mat for Home Entrance Set of 3 | Anti-Slip Waterproof Doormat for Main Door | Large Brown Dust Control Floor Mat for Indoor Outdoor Use | Home, Bathroom, Kitchen & Balcony (Set of 3)",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 690,
    "mrp": 129900,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FMNWLK3C/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FMNWLK3C_1",
        "type": "image",
        "url": "/products/B0FMNWLK3C/image_1.jpg"
      },
      {
        "id": "med_B0FMNWLK3C_2",
        "type": "image",
        "url": "/products/B0FMNWLK3C/image_2.jpg"
      },
      {
        "id": "med_B0FMNWLK3C_3",
        "type": "image",
        "url": "/products/B0FMNWLK3C/image_3.jpg"
      },
      {
        "id": "med_B0FMNWLK3C_4",
        "type": "image",
        "url": "/products/B0FMNWLK3C/image_4.jpg"
      },
      {
        "id": "med_B0FMNWLK3C_5",
        "type": "image",
        "url": "/products/B0FMNWLK3C/image_5.jpg"
      },
      {
        "id": "med_B0FMNWLK3C_6",
        "type": "image",
        "url": "/products/B0FMNWLK3C/image_6.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nPremium Quality & Heavy Duty – The IESVRA Door Mat for Home Entrance is crafted with durable, high-density material that traps dirt, dust, and moisture, keeping your main door area neat and clean.\nAnti-Slip & Waterproof Design – Designed as an Anti-Skid Door Mat for Main Door, it features a strong non-slip backing that prevents slips and stays firmly in place — perfect for kids and elders\nWashable & Easy to Clean – This Washable Door Mat for Home can be easily washed by hand or machine, dries quickly, and looks as good as new — a smart Indoor Outdoor Door Mat for all weather.\nTrusted by Indian Homes – Ideal for those searching for Door Mat for Indian Home Entrance, Rubber Waterproof Doormat, Dust Control Floor Mat, or Non-Slip Doormat for Balcony — IESVRA offers style, quality, and functionality in one.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 17,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNWLK3C"
  },
  {
    "asin": "B0FMNFV2DJ",
    "id": "prod_amz_B0FMNFV2DJ",
    "name": "Double Tube Door Bottom Seal Guard | Noise Reduction, Dust & Insect Blocker | Energy Saving Draft Stopper | Easy Install Under Door Insulation Strip for Home & Office (Set of 4)",
    "sub": "IESVRA Boutique — Daily Essentials",
    "price": 0,
    "mrp": 0,
    "categories": [
      "Daily Essentials"
    ],
    "image": "/products/B0FMNFV2DJ/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FMNFV2DJ_1",
        "type": "image",
        "url": "/products/B0FMNFV2DJ/image_1.jpg"
      },
      {
        "id": "med_B0FMNFV2DJ_2",
        "type": "image",
        "url": "/products/B0FMNFV2DJ/image_2.jpg"
      },
      {
        "id": "med_B0FMNFV2DJ_3",
        "type": "image",
        "url": "/products/B0FMNFV2DJ/image_3.jpg"
      },
      {
        "id": "med_B0FMNFV2DJ_4",
        "type": "image",
        "url": "/products/B0FMNFV2DJ/image_4.jpg"
      },
      {
        "id": "med_B0FMNFV2DJ_5",
        "type": "image",
        "url": "/products/B0FMNFV2DJ/image_5.jpg"
      },
      {
        "id": "med_B0FMNFV2DJ_6",
        "type": "image",
        "url": "/products/B0FMNFV2DJ/image_6.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nEffective Noise Reduction & Gap Sealing Dual foam tube design tightly seals gaps under doors, helping reduce outside noise, cold air, and unwanted drafts for a quieter and more comfortable indoor environment.\nBlocks Dust, Insects & Pollution Creates a protective barrier that helps prevent dust, insects, smoke, and pollutants from entering through door gaps, keeping your home cleaner and healthier.\nEnergy Saving Insulation Improves temperature control by minimizing air leakage. Helps maintain indoor cooling or heating efficiency, potentially reducing electricity usage.\nEasy Slide-On Installation – No Tools Required Simply slide the seal under your door and adjust to fit. No drilling, screws, or adhesive required. Suitable for most standard doors.\nDurable & Long-Lasting Material Made with high-density foam tubes and flexible outer cover for strong sealing performance and extended durability for daily use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 25,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNFV2DJ"
  },
  {
    "asin": "B0FMNFZ6KS",
    "id": "prod_amz_B0FMNFZ6KS",
    "name": "Double Tube Door Bottom Seal Guard | Noise Reduction, Dust & Insect Blocker | Energy Saving Draft Stopper | Easy Install Under Door Insulation Strip for Home & Office (Set 0f 5)",
    "sub": "IESVRA Boutique — Daily Essentials",
    "price": 0,
    "mrp": 0,
    "categories": [
      "Daily Essentials"
    ],
    "image": "/products/B0FMNFZ6KS/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FMNFZ6KS_1",
        "type": "image",
        "url": "/products/B0FMNFZ6KS/image_1.jpg"
      },
      {
        "id": "med_B0FMNFZ6KS_2",
        "type": "image",
        "url": "/products/B0FMNFZ6KS/image_2.jpg"
      },
      {
        "id": "med_B0FMNFZ6KS_3",
        "type": "image",
        "url": "/products/B0FMNFZ6KS/image_3.jpg"
      },
      {
        "id": "med_B0FMNFZ6KS_4",
        "type": "image",
        "url": "/products/B0FMNFZ6KS/image_4.jpg"
      },
      {
        "id": "med_B0FMNFZ6KS_5",
        "type": "image",
        "url": "/products/B0FMNFZ6KS/image_5.jpg"
      },
      {
        "id": "med_B0FMNFZ6KS_6",
        "type": "image",
        "url": "/products/B0FMNFZ6KS/image_6.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nEffective Noise Reduction & Gap Sealing Dual foam tube design tightly seals gaps under doors, helping reduce outside noise, cold air, and unwanted drafts for a quieter and more comfortable indoor environment.\nBlocks Dust, Insects & Pollution Creates a protective barrier that helps prevent dust, insects, smoke, and pollutants from entering through door gaps, keeping your home cleaner and healthier.\nEnergy Saving Insulation Improves temperature control by minimizing air leakage. Helps maintain indoor cooling or heating efficiency, potentially reducing electricity usage.\nEasy Slide-On Installation – No Tools Required Simply slide the seal under your door and adjust to fit. No drilling, screws, or adhesive required. Suitable for most standard doors.\nDurable & Long-Lasting Material Made with high-density foam tubes and flexible outer cover for strong sealing performance and extended durability for daily use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 59,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNFZ6KS"
  },
  {
    "asin": "B0FMNFDX1Z",
    "id": "prod_amz_B0FMNFDX1Z",
    "name": "Door Mat for Home Entrance | Large Anti-Slip Doormat for Main Door | Waterproof Dust Control Mat for Indoor Outdoor Use | Brown Heavy Duty Floor Mat for Bathroom, Living Room & Balcony (6)",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 1845,
    "mrp": 259800,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FMNFDX1Z/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FMNFDX1Z_1",
        "type": "image",
        "url": "/products/B0FMNFDX1Z/image_1.jpg"
      },
      {
        "id": "med_B0FMNFDX1Z_2",
        "type": "image",
        "url": "/products/B0FMNFDX1Z/image_2.jpg"
      },
      {
        "id": "med_B0FMNFDX1Z_3",
        "type": "image",
        "url": "/products/B0FMNFDX1Z/image_3.jpg"
      },
      {
        "id": "med_B0FMNFDX1Z_4",
        "type": "image",
        "url": "/products/B0FMNFDX1Z/image_4.jpg"
      },
      {
        "id": "med_B0FMNFDX1Z_5",
        "type": "image",
        "url": "/products/B0FMNFDX1Z/image_5.jpg"
      },
      {
        "id": "med_B0FMNFDX1Z_6",
        "type": "image",
        "url": "/products/B0FMNFDX1Z/image_6.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nPremium Quality & Heavy Duty – The IESVRA Door Mat for Home Entrance is crafted with durable, high-density material that traps dirt, dust, and moisture, keeping your main door area neat and clean.\nAnti-Slip & Waterproof Design – Designed as an Anti-Skid Door Mat for Main Door, it features a strong non-slip backing that prevents slips and stays firmly in place — perfect for kids and elders\nWashable & Easy to Clean – This Washable Door Mat for Home can be easily washed by hand or machine, dries quickly, and looks as good as new — a smart Indoor Outdoor Door Mat for all weather.\nTrusted by Indian Homes – Ideal for those searching for Door Mat for Indian Home Entrance, Rubber Waterproof Doormat, Dust Control Floor Mat, or Non-Slip Doormat for Balcony — IESVRA offers style, quality, and functionality in one.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 30,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNFDX1Z"
  },
  {
    "asin": "B0FMNT8XSN",
    "id": "prod_amz_B0FMNT8XSN",
    "name": "Double Tube Door Bottom Seal Guard | Noise Reduction, Dust & Insect Blocker | Energy Saving Draft Stopper | Easy Install Under Door Insulation Strip for Home & Office (Set 0f 7)",
    "sub": "IESVRA Boutique — Daily Essentials",
    "price": 0,
    "mrp": 0,
    "categories": [
      "Daily Essentials"
    ],
    "image": "/products/B0FMNT8XSN/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FMNT8XSN_1",
        "type": "image",
        "url": "/products/B0FMNT8XSN/image_1.jpg"
      },
      {
        "id": "med_B0FMNT8XSN_2",
        "type": "image",
        "url": "/products/B0FMNT8XSN/image_2.jpg"
      },
      {
        "id": "med_B0FMNT8XSN_3",
        "type": "image",
        "url": "/products/B0FMNT8XSN/image_3.jpg"
      },
      {
        "id": "med_B0FMNT8XSN_4",
        "type": "image",
        "url": "/products/B0FMNT8XSN/image_4.jpg"
      },
      {
        "id": "med_B0FMNT8XSN_5",
        "type": "image",
        "url": "/products/B0FMNT8XSN/image_5.jpg"
      },
      {
        "id": "med_B0FMNT8XSN_6",
        "type": "image",
        "url": "/products/B0FMNT8XSN/image_6.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nEffective Noise Reduction & Gap Sealing Dual foam tube design tightly seals gaps under doors, helping reduce outside noise, cold air, and unwanted drafts for a quieter and more comfortable indoor environment.\nBlocks Dust, Insects & Pollution Creates a protective barrier that helps prevent dust, insects, smoke, and pollutants from entering through door gaps, keeping your home cleaner and healthier.\nEnergy Saving Insulation Improves temperature control by minimizing air leakage. Helps maintain indoor cooling or heating efficiency, potentially reducing electricity usage.\nEasy Slide-On Installation – No Tools Required Simply slide the seal under your door and adjust to fit. No drilling, screws, or adhesive required. Suitable for most standard doors.\nDurable & Long-Lasting Material Made with high-density foam tubes and flexible outer cover for strong sealing performance and extended durability for daily use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 50,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNT8XSN"
  },
  {
    "asin": "B0FMNJ7LVF",
    "id": "prod_amz_B0FMNJ7LVF",
    "name": "Door Mat for Home Entrance Set of 8 | Anti-Slip Waterproof Doormat for Main Door | Large Brown Dust Control Floor Mat for Indoor Outdoor Use | Home, Bathroom, Kitchen & Balcony",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 897,
    "mrp": 199900,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FMNJ7LVF/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FMNJ7LVF_1",
        "type": "image",
        "url": "/products/B0FMNJ7LVF/image_1.jpg"
      },
      {
        "id": "med_B0FMNJ7LVF_2",
        "type": "image",
        "url": "/products/B0FMNJ7LVF/image_2.jpg"
      },
      {
        "id": "med_B0FMNJ7LVF_3",
        "type": "image",
        "url": "/products/B0FMNJ7LVF/image_3.jpg"
      },
      {
        "id": "med_B0FMNJ7LVF_4",
        "type": "image",
        "url": "/products/B0FMNJ7LVF/image_4.jpg"
      },
      {
        "id": "med_B0FMNJ7LVF_5",
        "type": "image",
        "url": "/products/B0FMNJ7LVF/image_5.jpg"
      },
      {
        "id": "med_B0FMNJ7LVF_6",
        "type": "image",
        "url": "/products/B0FMNJ7LVF/image_6.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nEffective Noise Reduction & Gap Sealing Dual foam tube design tightly seals gaps under doors, helping reduce outside noise, cold air, and unwanted drafts for a quieter and more comfortable indoor environment.\nBlocks Dust, Insects & Pollution Creates a protective barrier that helps prevent dust, insects, smoke, and pollutants from entering through door gaps, keeping your home cleaner and healthier.\nEnergy Saving Insulation Improves temperature control by minimizing air leakage. Helps maintain indoor cooling or heating efficiency, potentially reducing electricity usage.\nEasy Slide-On Installation – No Tools Required Simply slide the seal under your door and adjust to fit. No drilling, screws, or adhesive required. Suitable for most standard doors.\nDurable & Long-Lasting Material Made with high-density foam tubes and flexible outer cover for strong sealing performance and extended durability for daily use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 33,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNJ7LVF"
  },
  {
    "asin": "B0FKMKZLBJ",
    "id": "prod_amz_B0FKMKZLBJ",
    "name": "Door Mat for Home Entrance | Anti-Slip Door Mat for Main Door | Waterproof Dust Control Doormat for Indoor Outdoor | Brown Large Door Mat for Home Bathroom",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 897,
    "mrp": 199900,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FKMKZLBJ/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FKMKZLBJ_1",
        "type": "image",
        "url": "/products/B0FKMKZLBJ/image_1.jpg"
      },
      {
        "id": "med_B0FKMKZLBJ_2",
        "type": "image",
        "url": "/products/B0FKMKZLBJ/image_2.jpg"
      },
      {
        "id": "med_B0FKMKZLBJ_3",
        "type": "image",
        "url": "/products/B0FKMKZLBJ/image_3.jpg"
      },
      {
        "id": "med_B0FKMKZLBJ_4",
        "type": "image",
        "url": "/products/B0FKMKZLBJ/image_4.jpg"
      },
      {
        "id": "med_B0FKMKZLBJ_5",
        "type": "image",
        "url": "/products/B0FKMKZLBJ/image_5.jpg"
      },
      {
        "id": "med_B0FKMKZLBJ_6",
        "type": "image",
        "url": "/products/B0FKMKZLBJ/image_6.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nPremium Quality & Heavy Duty – The IESVRA Door Mat for Home Entrance is crafted with durable, high-density material that traps dirt, dust, and moisture, keeping your main door area neat and clean.\nAnti-Slip & Waterproof Design – Designed as an Anti-Skid Door Mat for Main Door, it features a strong non-slip backing that prevents slips and stays firmly in place — perfect for kids and elders\nWashable & Easy to Clean – This Washable Door Mat for Home can be easily washed by hand or machine, dries quickly, and looks as good as new — a smart Indoor Outdoor Door Mat for all weather.\nTrusted by Indian Homes – Ideal for those searching for Door Mat for Indian Home Entrance, Rubber Waterproof Doormat, Dust Control Floor Mat, or Non-Slip Doormat for Balcony — IESVRA offers style, quality, and functionality in one.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 26,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FKMKZLBJ"
  },
  {
    "asin": "B0FJLRDFK2",
    "id": "prod_amz_B0FJLRDFK2",
    "name": "Reusable Popsicle Mould Set | 6-Cavity BPA-Free Ice Cream & Kulfi Moulds with Stand | DIY Ice Lolly Maker for Kids & Adults – Pink Plastic Frozen Treat Mold",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 0,
    "mrp": 0,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FJLRDFK2/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FJLRDFK2_1",
        "type": "image",
        "url": "/products/B0FJLRDFK2/image_1.jpg"
      },
      {
        "id": "med_B0FJLRDFK2_2",
        "type": "image",
        "url": "/products/B0FJLRDFK2/image_2.jpg"
      },
      {
        "id": "med_B0FJLRDFK2_3",
        "type": "image",
        "url": "/products/B0FJLRDFK2/image_3.jpg"
      },
      {
        "id": "med_B0FJLRDFK2_4",
        "type": "image",
        "url": "/products/B0FJLRDFK2/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\n6-Cavity Reusable Popsicle Mould Set – Make up to 6 homemade ice creams or kulfis at once with this user-friendly ice pop maker.\nBPA-Free & Food-Grade Plastic – Safe, durable, and non-toxic material, perfect for kids and family-friendly use.\nAttractive Pink Design with Stand – Comes with a pink star-shaped base stand for stability and mess-free freezing.\nEasy to Use & Clean – Simply fill, freeze, and pull! Dishwasher-safe and easy to demould without cracking.\nPerfect for Summer Fun & Healthy Treats – Great for making fruit pops, yogurt bars, smoothie popsicles, and more—ideal for kids' snacks and adults’ desserts.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 29,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FJLRDFK2"
  },
  {
    "asin": "B0FKMZY6L3",
    "id": "prod_amz_B0FKMZY6L3",
    "name": "Reusable Popsicle Mould Set | 6-Cavity BPA-Free Ice Cream & Kulfi Moulds with Stand | DIY Ice Lolly Maker for Kids & Adults – Plastic Frozen Treat Mold (Blue)",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 0,
    "mrp": 0,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FKMZY6L3/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FKMZY6L3_1",
        "type": "image",
        "url": "/products/B0FKMZY6L3/image_1.jpg"
      },
      {
        "id": "med_B0FKMZY6L3_2",
        "type": "image",
        "url": "/products/B0FKMZY6L3/image_2.jpg"
      },
      {
        "id": "med_B0FKMZY6L3_3",
        "type": "image",
        "url": "/products/B0FKMZY6L3/image_3.jpg"
      },
      {
        "id": "med_B0FKMZY6L3_4",
        "type": "image",
        "url": "/products/B0FKMZY6L3/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\n6-Cavity Reusable Popsicle Mould Set – Make up to 6 homemade ice creams or kulfis at once with this user-friendly ice pop maker.\nBPA-Free & Food-Grade Plastic – Safe, durable, and non-toxic material, perfect for kids and family-friendly use.\nAttractive Pink Design with Stand – Comes with a pink star-shaped base stand for stability and mess-free freezing.\nEasy to Use & Clean – Simply fill, freeze, and pull! Dishwasher-safe and easy to demould without cracking.\nPerfect for Summer Fun & Healthy Treats – Great for making fruit pops, yogurt bars, smoothie popsicles, and more—ideal for kids' snacks and adults’ desserts.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 48,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FKMZY6L3"
  },
  {
    "asin": "B0FKN5CB6D",
    "id": "prod_amz_B0FKN5CB6D",
    "name": "Reusable Popsicle Mould Set | 6-Cavity BPA-Free Ice Cream & Kulfi Moulds with Stand | DIY Ice Lolly Maker for Kids & Adults – Plastic Frozen Treat Mold (Green)",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 0,
    "mrp": 0,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FKN5CB6D/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FKN5CB6D_1",
        "type": "image",
        "url": "/products/B0FKN5CB6D/image_1.jpg"
      },
      {
        "id": "med_B0FKN5CB6D_2",
        "type": "image",
        "url": "/products/B0FKN5CB6D/image_2.jpg"
      },
      {
        "id": "med_B0FKN5CB6D_3",
        "type": "image",
        "url": "/products/B0FKN5CB6D/image_3.jpg"
      },
      {
        "id": "med_B0FKN5CB6D_4",
        "type": "image",
        "url": "/products/B0FKN5CB6D/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\n6-Cavity Reusable Popsicle Mould Set – Make up to 6 homemade ice creams or kulfis at once with this user-friendly ice pop maker.\nBPA-Free & Food-Grade Plastic – Safe, durable, and non-toxic material, perfect for kids and family-friendly use.\nAttractive Pink Design with Stand – Comes with a pink star-shaped base stand for stability and mess-free freezing.\nEasy to Use & Clean – Simply fill, freeze, and pull! Dishwasher-safe and easy to demould without cracking.\nPerfect for Summer Fun & Healthy Treats – Great for making fruit pops, yogurt bars, smoothie popsicles, and more—ideal for kids' snacks and adults’ desserts.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 14,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FKN5CB6D"
  },
  {
    "asin": "B0GYNSPBFF",
    "id": "prod_amz_B0GYNSPBFF",
    "name": "Manual Cold Press Juicer | Hand Juicer Machine with Steel Filter | Slow Juicer for Fruits & Vegetables | Hand Operated Juice Extractor for Orange, Pomegranate, Pineapple, Grapes | BPA Free",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 3979,
    "mrp": 99900,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0GYNSPBFF/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GYNSPBFF_1",
        "type": "image",
        "url": "/products/B0GYNSPBFF/image_1.jpg"
      },
      {
        "id": "med_B0GYNSPBFF_2",
        "type": "image",
        "url": "/products/B0GYNSPBFF/image_2.jpg"
      },
      {
        "id": "med_B0GYNSPBFF_3",
        "type": "image",
        "url": "/products/B0GYNSPBFF/image_3.jpg"
      },
      {
        "id": "med_B0GYNSPBFF_4",
        "type": "image",
        "url": "/products/B0GYNSPBFF/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nAdvanced Cold Press Technology: Extracts maximum juice with minimal oxidation, preserving natural nutrients, enzymes, and taste for healthier drinking\nHeavy-Duty Manual Operation: No electricity required; smooth hand crank system ensures efficient juice extraction with full control and zero noise\nHigh Efficiency Steel Filter System: Fine stainless steel mesh separates pulp effectively, delivering smooth, fiber-free juice every time\nMultipurpose Juicing Solution: Suitable for oranges, pomegranates, grapes, pineapple, sweet lime, and even leafy greens for detox juices\nDurable, Safe & Easy to Clean: Made with BPA-free food-grade plastic, anti-slip base for stability, and detachable parts for quick cleaning and maintenance\nCompact & Portable Design: Lightweight construction makes it convenient for daily kitchen use, travel, and outdoor activities without requiring power sources\nNutrient Retention Technology: Slow extraction process minimizes heat buildup and oxidation to maintain vitamins, minerals, and natural enzymes in your juice\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 30,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GYNSPBFF"
  },
  {
    "asin": "B0FKYM1S95",
    "id": "prod_amz_B0FKYM1S95",
    "name": "Portable Mini Sealing Machine | Handheld Heat Sealer for Plastic Bags, Snack Packets, Chips & Food Storage | Rechargeable USB Seal & Cutter for Airtight Freshness (Blue)",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 0,
    "mrp": 0,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FKYM1S95/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FKYM1S95_1",
        "type": "image",
        "url": "/products/B0FKYM1S95/image_1.jpg"
      },
      {
        "id": "med_B0FKYM1S95_2",
        "type": "image",
        "url": "/products/B0FKYM1S95/image_2.jpg"
      },
      {
        "id": "med_B0FKYM1S95_3",
        "type": "image",
        "url": "/products/B0FKYM1S95/image_3.jpg"
      },
      {
        "id": "med_B0FKYM1S95_4",
        "type": "image",
        "url": "/products/B0FKYM1S95/image_4.jpg"
      },
      {
        "id": "med_B0FKYM1S95_5",
        "type": "image",
        "url": "/products/B0FKYM1S95/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\n2-in-1 Seal & Cut Function – Quickly seals and cuts plastic packaging to preserve freshness and reduce food waste.\nCordless & Rechargeable – Comes with USB charging cable for wireless, mess-free use anywhere.\nPerfect for All Bag Types – Works on snack packets, plastic pouches, foil bags, and other kitchen packaging.\nMagnetic & Compact Design – Attaches easily to refrigerators or metal surfaces for handy access.\nSafe & User-Friendly – One-button operation with built-in safety lock to prevent accidental burns.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 85,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FKYM1S95"
  },
  {
    "asin": "B0FKYNNVLN",
    "id": "prod_amz_B0FKYNNVLN",
    "name": "Portable Mini Sealing Machine | Handheld Heat Sealer for Plastic Bags, Snack Packets, Chips & Food Storage | Rechargeable USB Seal & Cutter for Airtight Freshness (White)",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 0,
    "mrp": 0,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FKYNNVLN/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FKYNNVLN_1",
        "type": "image",
        "url": "/products/B0FKYNNVLN/image_1.jpg"
      },
      {
        "id": "med_B0FKYNNVLN_2",
        "type": "image",
        "url": "/products/B0FKYNNVLN/image_2.jpg"
      },
      {
        "id": "med_B0FKYNNVLN_3",
        "type": "image",
        "url": "/products/B0FKYNNVLN/image_3.jpg"
      },
      {
        "id": "med_B0FKYNNVLN_4",
        "type": "image",
        "url": "/products/B0FKYNNVLN/image_4.jpg"
      },
      {
        "id": "med_B0FKYNNVLN_5",
        "type": "image",
        "url": "/products/B0FKYNNVLN/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\n2-in-1 Seal & Cut Function – Quickly seals and cuts plastic packaging to preserve freshness and reduce food waste.\nCordless & Rechargeable – Comes with USB charging cable for wireless, mess-free use anywhere.\nPerfect for All Bag Types – Works on snack packets, plastic pouches, foil bags, and other kitchen packaging.\nMagnetic & Compact Design – Attaches easily to refrigerators or metal surfaces for handy access.\nSafe & User-Friendly – One-button operation with built-in safety lock to prevent accidental burns.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 29,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FKYNNVLN"
  },
  {
    "asin": "B0FM7LGD47",
    "id": "prod_amz_B0FM7LGD47",
    "name": "Self Adhesive Wall Mount Storage Basket Rack | Multipurpose Bathroom & Kitchen Organizer Shelf | No Drill Strong Adhesive Plastic Storage Rack, 2-Pack (White)",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 148,
    "mrp": 222,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FM7LGD47/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FM7LGD47_1",
        "type": "image",
        "url": "/products/B0FM7LGD47/image_1.jpg"
      },
      {
        "id": "med_B0FM7LGD47_2",
        "type": "image",
        "url": "/products/B0FM7LGD47/image_2.jpg"
      },
      {
        "id": "med_B0FM7LGD47_3",
        "type": "image",
        "url": "/products/B0FM7LGD47/image_3.jpg"
      },
      {
        "id": "med_B0FM7LGD47_4",
        "type": "image",
        "url": "/products/B0FM7LGD47/image_4.jpg"
      },
      {
        "id": "med_B0FM7LGD47_5",
        "type": "image",
        "url": "/products/B0FM7LGD47/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nNo Drill Installation – Comes with a strong adhesive backing for easy wall mounting without damaging surfaces.\nDurable & Lightweight – Made from premium-quality plastic that is sturdy, rustproof, and easy to clean.\nMultipurpose Use – Perfect for holding toiletries, kitchen condiments, cleaning supplies, and more.\nVentilated Design – Slotted base allows for quick water drainage, keeping stored items dry and hygienic.\nSpace-Saving Storage – Helps organize small spaces efficiently, suitable for bathrooms, kitchens, and utility rooms.\nModern Minimalist Look – Sleek white finish complements any home interior.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 26,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FM7LGD47"
  },
  {
    "asin": "B0FNN2D5CD",
    "id": "prod_amz_B0FNN2D5CD",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve | Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (Blue, Pack of 1)",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 449,
    "mrp": 673,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0FNN2D5CD/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FNN2D5CD_1",
        "type": "image",
        "url": "/products/B0FNN2D5CD/image_1.jpg"
      },
      {
        "id": "med_B0FNN2D5CD_2",
        "type": "image",
        "url": "/products/B0FNN2D5CD/image_2.jpg"
      },
      {
        "id": "med_B0FNN2D5CD_3",
        "type": "image",
        "url": "/products/B0FNN2D5CD/image_3.jpg"
      },
      {
        "id": "med_B0FNN2D5CD_4",
        "type": "image",
        "url": "/products/B0FNN2D5CD/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 72,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN2D5CD"
  },
  {
    "asin": "B0FNN4WQNQ",
    "id": "prod_amz_B0FNN4WQNQ",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve | Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (Blue, Pack of 2)",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 449,
    "mrp": 673,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0FNN4WQNQ/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FNN4WQNQ_1",
        "type": "image",
        "url": "/products/B0FNN4WQNQ/image_1.jpg"
      },
      {
        "id": "med_B0FNN4WQNQ_2",
        "type": "image",
        "url": "/products/B0FNN4WQNQ/image_2.jpg"
      },
      {
        "id": "med_B0FNN4WQNQ_3",
        "type": "image",
        "url": "/products/B0FNN4WQNQ/image_3.jpg"
      },
      {
        "id": "med_B0FNN4WQNQ_4",
        "type": "image",
        "url": "/products/B0FNN4WQNQ/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 66,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN4WQNQ"
  },
  {
    "asin": "B0FNN66P5B",
    "id": "prod_amz_B0FNN66P5B",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve | Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (Green, Pack of 1)",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 449,
    "mrp": 199900,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0FNN66P5B/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FNN66P5B_1",
        "type": "image",
        "url": "/products/B0FNN66P5B/image_1.jpg"
      },
      {
        "id": "med_B0FNN66P5B_2",
        "type": "image",
        "url": "/products/B0FNN66P5B/image_2.jpg"
      },
      {
        "id": "med_B0FNN66P5B_3",
        "type": "image",
        "url": "/products/B0FNN66P5B/image_3.jpg"
      },
      {
        "id": "med_B0FNN66P5B_4",
        "type": "image",
        "url": "/products/B0FNN66P5B/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 20,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN66P5B"
  },
  {
    "asin": "B0FNN49PMX",
    "id": "prod_amz_B0FNN49PMX",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve | Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (Green, Pack of 2)",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 449,
    "mrp": 673,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0FNN49PMX/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FNN49PMX_1",
        "type": "image",
        "url": "/products/B0FNN49PMX/image_1.jpg"
      },
      {
        "id": "med_B0FNN49PMX_2",
        "type": "image",
        "url": "/products/B0FNN49PMX/image_2.jpg"
      },
      {
        "id": "med_B0FNN49PMX_3",
        "type": "image",
        "url": "/products/B0FNN49PMX/image_3.jpg"
      },
      {
        "id": "med_B0FNN49PMX_4",
        "type": "image",
        "url": "/products/B0FNN49PMX/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 54,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN49PMX"
  },
  {
    "asin": "B0FNN6BRJD",
    "id": "prod_amz_B0FNN6BRJD",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve | Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (PInk, Pack of 1)",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 449,
    "mrp": 479600,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0FNN6BRJD/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FNN6BRJD_1",
        "type": "image",
        "url": "/products/B0FNN6BRJD/image_1.jpg"
      },
      {
        "id": "med_B0FNN6BRJD_2",
        "type": "image",
        "url": "/products/B0FNN6BRJD/image_2.jpg"
      },
      {
        "id": "med_B0FNN6BRJD_3",
        "type": "image",
        "url": "/products/B0FNN6BRJD/image_3.jpg"
      },
      {
        "id": "med_B0FNN6BRJD_4",
        "type": "image",
        "url": "/products/B0FNN6BRJD/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 22,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN6BRJD"
  },
  {
    "asin": "B0FNN7W66B",
    "id": "prod_amz_B0FNN7W66B",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve | Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (PInk, Pack of 2)",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 449,
    "mrp": 673,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0FNN7W66B/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FNN7W66B_1",
        "type": "image",
        "url": "/products/B0FNN7W66B/image_1.jpg"
      },
      {
        "id": "med_B0FNN7W66B_2",
        "type": "image",
        "url": "/products/B0FNN7W66B/image_2.jpg"
      },
      {
        "id": "med_B0FNN7W66B_3",
        "type": "image",
        "url": "/products/B0FNN7W66B/image_3.jpg"
      },
      {
        "id": "med_B0FNN7W66B_4",
        "type": "image",
        "url": "/products/B0FNN7W66B/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 50,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN7W66B"
  },
  {
    "asin": "B0FNN7Q41H",
    "id": "prod_amz_B0FNN7Q41H",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve | Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (Yellow, Pack of 1)",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 449,
    "mrp": 49900,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0FNN7Q41H/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FNN7Q41H_1",
        "type": "image",
        "url": "/products/B0FNN7Q41H/image_1.jpg"
      },
      {
        "id": "med_B0FNN7Q41H_2",
        "type": "image",
        "url": "/products/B0FNN7Q41H/image_2.jpg"
      },
      {
        "id": "med_B0FNN7Q41H_3",
        "type": "image",
        "url": "/products/B0FNN7Q41H/image_3.jpg"
      },
      {
        "id": "med_B0FNN7Q41H_4",
        "type": "image",
        "url": "/products/B0FNN7Q41H/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 23,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN7Q41H"
  },
  {
    "asin": "B0FNN672TC",
    "id": "prod_amz_B0FNN672TC",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve | Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (Yellow, Pack of 2)",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 809,
    "mrp": 1213,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0FNN672TC/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FNN672TC_1",
        "type": "image",
        "url": "/products/B0FNN672TC/image_1.jpg"
      },
      {
        "id": "med_B0FNN672TC_2",
        "type": "image",
        "url": "/products/B0FNN672TC/image_2.jpg"
      },
      {
        "id": "med_B0FNN672TC_3",
        "type": "image",
        "url": "/products/B0FNN672TC/image_3.jpg"
      },
      {
        "id": "med_B0FNN672TC_4",
        "type": "image",
        "url": "/products/B0FNN672TC/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 80,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN672TC"
  },
  {
    "asin": "B0FJLQTH6X",
    "id": "prod_amz_B0FJLQTH6X",
    "name": "Manual Food Cutter for Vegetables & Fruits | Push Style with Stainless Steel Blades | Onion, Tomato, Garlic, Chilli Slicer | Compact Kitchen Tool (Green)",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 0,
    "mrp": 0,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FJLQTH6X/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FJLQTH6X_1",
        "type": "image",
        "url": "/products/B0FJLQTH6X/image_1.jpg"
      },
      {
        "id": "med_B0FJLQTH6X_2",
        "type": "image",
        "url": "/products/B0FJLQTH6X/image_2.jpg"
      },
      {
        "id": "med_B0FJLQTH6X_3",
        "type": "image",
        "url": "/products/B0FJLQTH6X/image_3.jpg"
      },
      {
        "id": "med_B0FJLQTH6X_4",
        "type": "image",
        "url": "/products/B0FJLQTH6X/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nQuick & Uniform Chopping – Spring-action push mechanism with stainless steel blades chops vegetables, fruits, and herbs effortlessly in seconds.\nManual & Hassle-Free – No electricity needed; perfect for quick daily use, travel, outdoor cooking, or small kitchens.\nDurable Build Quality – Made from premium BPA-free plastic and rust-resistant stainless steel for long-term use.\nTransparent Storage Container – Built-in chopping bowl collects ingredients and lets you monitor chopping size easily.\nCompact & Easy to Store – Lightweight and space-saving design fits into any drawer or kitchen shelf.\nMulti-Use Tool – Ideal for chopping onions, tomatoes, chilies, garlic, carrots, cucumber, dry fruits, and more.\nEasy to Clean – All parts detach easily for a quick rinse; low-maintenance and hygiene-friendly.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 55,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FJLQTH6X"
  },
  {
    "asin": "B0FJLT87Q2",
    "id": "prod_amz_B0FJLT87Q2",
    "name": "Manual Food Cutter for Vegetables & Fruits | Push Style with Stainless Steel Blades | Onion, Tomato, Garlic, Chilli Slicer | Compact Kitchen Tool (Purple)",
    "sub": "IESVRA Boutique — Home & Kitchen",
    "price": 0,
    "mrp": 0,
    "categories": [
      "Home & Kitchen"
    ],
    "image": "/products/B0FJLT87Q2/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FJLT87Q2_1",
        "type": "image",
        "url": "/products/B0FJLT87Q2/image_1.jpg"
      },
      {
        "id": "med_B0FJLT87Q2_2",
        "type": "image",
        "url": "/products/B0FJLT87Q2/image_2.jpg"
      },
      {
        "id": "med_B0FJLT87Q2_3",
        "type": "image",
        "url": "/products/B0FJLT87Q2/image_3.jpg"
      },
      {
        "id": "med_B0FJLT87Q2_4",
        "type": "image",
        "url": "/products/B0FJLT87Q2/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nQuick & Uniform Chopping – Spring-action push mechanism with stainless steel blades chops vegetables, fruits, and herbs effortlessly in seconds.\nManual & Hassle-Free – No electricity needed; perfect for quick daily use, travel, outdoor cooking, or small kitchens.\nDurable Build Quality – Made from premium BPA-free plastic and rust-resistant stainless steel for long-term use.\nTransparent Storage Container – Built-in chopping bowl collects ingredients and lets you monitor chopping size easily.\nCompact & Easy to Store – Lightweight and space-saving design fits into any drawer or kitchen shelf.\nMulti-Use Tool – Ideal for chopping onions, tomatoes, chilies, garlic, carrots, cucumber, dry fruits, and more.\nEasy to Clean – All parts detach easily for a quick rinse; low-maintenance and hygiene-friendly.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 41,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FJLT87Q2"
  },
  {
    "asin": "B0GGH7RQGL",
    "id": "prod_amz_B0GGH7RQGL",
    "name": "Bird Figurine Decorative Sculpture, Elegant Bird Statue for Home Décor, Living Room, Office, Shelf & Tabletop Accent, Modern Artistic Collectible Gift",
    "sub": "IESVRA Boutique — Daily Essentials",
    "price": 0,
    "mrp": 0,
    "categories": [
      "Daily Essentials"
    ],
    "image": "/products/B0GGH7RQGL/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GGH7RQGL_1",
        "type": "image",
        "url": "/products/B0GGH7RQGL/image_1.jpg"
      },
      {
        "id": "med_B0GGH7RQGL_2",
        "type": "image",
        "url": "/products/B0GGH7RQGL/image_2.jpg"
      },
      {
        "id": "med_B0GGH7RQGL_3",
        "type": "image",
        "url": "/products/B0GGH7RQGL/image_3.jpg"
      },
      {
        "id": "med_B0GGH7RQGL_4",
        "type": "image",
        "url": "/products/B0GGH7RQGL/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nElegant Artistic Design – The IESVRA Bird Figurine features a refined, modern silhouette that adds a touch of sophistication and calm to any living space, blending seamlessly with contemporary, minimalist, or classic décor styles.\nPremium Craftsmanship – Carefully crafted with attention to detail, this decorative bird sculpture showcases smooth finishes and balanced proportions, making it a timeless décor accent for shelves, desks, mantels, and tabletops.\nVersatile Home Décor Accent – Perfect for living rooms, bedrooms, offices, studies, entryways, or coffee tables, this bird figurine enhances your interior with subtle charm and artistic character.\nThoughtful Gift Choice – An ideal gift for housewarmings, birthdays, anniversaries, holidays, or special occasions, especially for bird lovers, art enthusiasts, and home décor collectors.\nCompact & Display-Ready – Designed to be lightweight and easy to place, this figurine instantly elevates your space without overpowering it, making it suitable for both small and large displays.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 89,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GGH7RQGL"
  },
  {
    "asin": "B0FS831QLM",
    "id": "prod_amz_B0FS831QLM",
    "name": "Menstrual Heating Pad with 4 Massage Modes, Digital Display, Ultra-quiet Operation, Pink",
    "sub": "IESVRA Boutique — Massagers",
    "price": 0,
    "mrp": 0,
    "categories": [
      "Massagers"
    ],
    "image": "/products/B0FS831QLM/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0FS831QLM_1",
        "type": "image",
        "url": "/products/B0FS831QLM/image_1.jpg"
      },
      {
        "id": "med_B0FS831QLM_2",
        "type": "image",
        "url": "/products/B0FS831QLM/image_2.jpg"
      },
      {
        "id": "med_B0FS831QLM_3",
        "type": "image",
        "url": "/products/B0FS831QLM/image_3.jpg"
      },
      {
        "id": "med_B0FS831QLM_4",
        "type": "image",
        "url": "/products/B0FS831QLM/image_4.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nVERSATILE HEATING: Features targeted heating for uterus, stomach, waist, and abdomen areas with digital temperature control and display\nMASSAGE MODES: 4 distinct vibration massage patterns provide customised comfort with ultra-quiet operation under 20dB\nCOMFORT DESIGN: Soft, ergonomic shape with adjustable fit and premium materials for maximum comfort during menstrual cycles\nSMART FEATURES: LED digital display shows temperature settings clearly, with easy-to-use controls for precise heat adjustment\nPORTABLE SOLUTION: USB-powered design with compact, lightweight construction makes it perfect for home, office, or travel use\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 81,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FS831QLM"
  },
  {
    "asin": "B0GKVPGWDV",
    "id": "prod_amz_B0GKVPGWDV",
    "name": "1 Litre Oil Dispenser Bottle for Kitchen | Leak Proof Oil Pourer Bottle with Spout | Transparent Cooking Oil Container for Olive Oil, Vinegar & Sauce Storage",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 249,
    "mrp": 149900,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0GKVPGWDV/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GKVPGWDV_1",
        "type": "image",
        "url": "/products/B0GKVPGWDV/image_1.jpg"
      },
      {
        "id": "med_B0GKVPGWDV_2",
        "type": "image",
        "url": "/products/B0GKVPGWDV/image_2.jpg"
      },
      {
        "id": "med_B0GKVPGWDV_3",
        "type": "image",
        "url": "/products/B0GKVPGWDV/image_3.jpg"
      },
      {
        "id": "med_B0GKVPGWDV_4",
        "type": "image",
        "url": "/products/B0GKVPGWDV/image_4.jpg"
      },
      {
        "id": "med_B0GKVPGWDV_5",
        "type": "image",
        "url": "/products/B0GKVPGWDV/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nLeak Proof & Mess Free Pouring Specially designed anti-drip pour spout ensures controlled oil flow and prevents messy spills on kitchen counters.\nLarge 1 Litre Capacity Perfect size for daily cooking oil storage including mustard oil, olive oil, sunflower oil and vinegar.\nTransparent Body Design Clear plastic body allows you to easily monitor oil levels, helping you refill at the right time.\nMulti Purpose Kitchen Bottle Ideal for storing cooking oil, vinegar, soy sauce, salad dressing and liquid condiments.\nFood Grade & Durable Material Made from high quality food grade plastic, safe for daily kitchen use and resistant to breakage.\nComfortable Grip Handle – Ergonomic handle provides better control and firm grip while pouring, even with one hand.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 86,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GKVPGWDV"
  },
  {
    "asin": "B0GKVWDYSM",
    "id": "prod_amz_B0GKVWDYSM",
    "name": "1 Litre Oil Dispenser Bottle for Kitchen | Leak Proof Plastic Cooking Oil Dispenser with Easy Pour Spout | Oil Container & Oil Bottle for Kitchen Use (Pack of 2)",
    "sub": "IESVRA Boutique — Drinkware",
    "price": 249,
    "mrp": 39500,
    "categories": [
      "Drinkware"
    ],
    "image": "/products/B0GKVWDYSM/image_1.jpg",
    "gallery": [
      {
        "id": "med_B0GKVWDYSM_1",
        "type": "image",
        "url": "/products/B0GKVWDYSM/image_1.jpg"
      },
      {
        "id": "med_B0GKVWDYSM_2",
        "type": "image",
        "url": "/products/B0GKVWDYSM/image_2.jpg"
      },
      {
        "id": "med_B0GKVWDYSM_3",
        "type": "image",
        "url": "/products/B0GKVWDYSM/image_3.jpg"
      },
      {
        "id": "med_B0GKVWDYSM_4",
        "type": "image",
        "url": "/products/B0GKVWDYSM/image_4.jpg"
      },
      {
        "id": "med_B0GKVWDYSM_5",
        "type": "image",
        "url": "/products/B0GKVWDYSM/image_5.jpg"
      }
    ],
    "colors": [
      "Standard"
    ],
    "description": "About this item\nLeak Proof & Spill-Free Design – Equipped with a secure lid and tight seal to prevent leakage, ensuring clean and mess-free pouring every time.\nHigh-Quality Food-Grade Plastic – Made from durable, safe, and odor-free material that maintains the purity and freshness of stored cooking oil.\nSmooth & Controlled Pouring Spout – Specially designed spout allows easy and accurate pouring without dripping or wasting oil.\nSpacious 1 Litre Capacity – Ideal for daily kitchen use, reducing the need for frequent refilling and offering convenient oil storage.\nTransparent Body for Easy Monitoring – Clear bottle design helps you quickly check oil levels and refill when required.\nComfortable Grip Handle – Ergonomic handle provides better control and firm grip while pouring, even with one hand.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 14,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GKVWDYSM"
  }
];

  import { useState, useEffect } from "react";

function triggerProductsChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ishvara_products_changed"));
  }
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Load locally immediately
    const stored = localStorage.getItem("ishvara_products_v11");
    let localList = initialProducts;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        localList = parsed.map((p: any) => {
          if (!p.categories) {
            return {
              ...p,
              categories: p.category ? [p.category] : ["Uncategorized"],
            };
          }
          return p;
        });
      } catch (e) {
        console.error("Failed to parse local products", e);
      }
    }
    setProducts(localList);

    // 2. Fetch globally in background
    fetch("/api/products")
      .then((res) => res.json())
      .then((globalList) => {
        if (Array.isArray(globalList) && globalList.length > 0) {
          setProducts(globalList);
          localStorage.setItem("ishvara_products_v11", JSON.stringify(globalList));
        } else {
          // If first run (no global data), initialize global list with local data
          fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(localList),
          }).catch(console.error);
        }
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to fetch global products:", err);
        setIsLoaded(true);
      });

    const handleUpdate = () => {
      const latest = localStorage.getItem("ishvara_products_v11");
      if (latest) {
        try { setProducts(JSON.parse(latest)); } catch {}
      }
    };
    window.addEventListener("ishvara_products_changed", handleUpdate);
    return () => {
      window.removeEventListener("ishvara_products_changed", handleUpdate);
    };
  }, []);

  const addProduct = (p: Product) => {
    const updated = [p, ...products];
    setProducts(updated);
    localStorage.setItem("ishvara_products_v11", JSON.stringify(updated));
    triggerProductsChange();
    
    // Save to global DB
    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).catch(console.error);
  };

  const updateProduct = (p: Product) => {
    const updated = products.map((prod) => (prod.id === p.id ? p : prod));
    setProducts(updated);
    localStorage.setItem("ishvara_products_v11", JSON.stringify(updated));
    triggerProductsChange();

    // Save to global DB
    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).catch(console.error);
  };

  const bulkUpdateProducts = (updatedProducts: Product[]) => {
    let current = [...products];
    for (const p of updatedProducts) {
      current = current.map((prod) => (prod.id === p.id ? p : prod));
    }
    setProducts(current);
    localStorage.setItem("ishvara_products_v11", JSON.stringify(current));
    triggerProductsChange();

    // Save to global DB
    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(current),
    }).catch(console.error);
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter((prod) => prod.id !== id);
    setProducts(updated);
    localStorage.setItem("ishvara_products_v11", JSON.stringify(updated));
    triggerProductsChange();

    // Save to global DB
    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).catch(console.error);
  };

  return {
    products,
    isLoaded,
    addProduct,
    updateProduct,
    bulkUpdateProducts,
    deleteProduct,
    topDealsList: products.slice(0, 6),
    bestSellersList: products.filter((p) => p.isBestSeller).slice(0, 10),
    newArrivalsList: products.slice(12, 16),
  };
}

