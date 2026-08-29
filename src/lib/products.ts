import { useState, useEffect } from "react";
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

export type ProductVariant = {
  id?: string;
  label: string; // e.g. "5", "10", "15", "20", "30", "50", "Pack of 20", "Large"
  price: number;
  mrp?: number;
  unitPriceText?: string; // e.g. "(₹9.05 / count)"
  image?: string;
  inStock?: boolean;
};

export type Product = {
  id: string;
  asin?: string;
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
  rating?: number;
  reviewsCount?: number;
  status?: string;
  url?: string;
  isDigital?: boolean;
  type?: string;
  stock?: number;
  boughtInPastMonth?: number;
  variants?: ProductVariant[];
  returnWindowDays?: number;
  isRefundable?: boolean;
  replacementWindowDays?: number;
  isReplaceable?: boolean;
};

export type ProductPolicy = {
  returnWindowDays: number;
  isRefundable: boolean;
  replacementWindowDays: number;
  isReplaceable: boolean;
};

export const DEFAULT_PRODUCT_POLICY: ProductPolicy = {
  returnWindowDays: 7,
  isRefundable: true,
  replacementWindowDays: 7,
  isReplaceable: true,
};

export function getProductPolicy(product?: Partial<Product> | null): ProductPolicy {
  return {
    returnWindowDays: Math.max(0, Number(product?.returnWindowDays ?? DEFAULT_PRODUCT_POLICY.returnWindowDays)),
    isRefundable: product?.isRefundable ?? DEFAULT_PRODUCT_POLICY.isRefundable,
    replacementWindowDays: Math.max(0, Number(product?.replacementWindowDays ?? DEFAULT_PRODUCT_POLICY.replacementWindowDays)),
    isReplaceable: product?.isReplaceable ?? DEFAULT_PRODUCT_POLICY.isReplaceable,
  };
}

export function formatProductPolicy(product?: Partial<Product> | null): string {
  const policy = getProductPolicy(product);

  if (policy.isRefundable && policy.isReplaceable) {
    if (policy.returnWindowDays === policy.replacementWindowDays) {
      return `${policy.returnWindowDays} day return, refund or replacement available`;
    }
    return `${policy.returnWindowDays} day return & refund, ${policy.replacementWindowDays} day replacement`;
  }
  if (policy.isRefundable) {
    return `${policy.returnWindowDays} day return & refund available, non-replaceable`;
  }
  if (policy.isReplaceable) {
    return `${policy.replacementWindowDays} day replacement, non-refundable`;
  }
  return "Non-refundable and non-replaceable";
}

import { generateProductReviews } from "./reviewGenerator";

function normalizeProduct(product: Product): Product {
  const existingReviews = Array.isArray(product.reviews) && product.reviews.length >= 25
    ? product.reviews
    : generateProductReviews(product.id, product.name, product.categories?.[0] || "General");

  const avgRating = existingReviews.length > 0
    ? parseFloat((existingReviews.reduce((acc, r) => acc + r.rating, 0) / existingReviews.length).toFixed(1))
    : (product.rating || 4.8);

  return {
    ...product,
    categories: product.categories ?? ["Uncategorized"],
    stock: typeof product.stock === "number" ? product.stock : 50,
    reviews: existingReviews,
    reviewsCount: existingReviews.length,
    rating: avgRating,
    ...getProductPolicy(product),
  };
}

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
  { name: "Books & Stationery", image: "/products/books/ncert_pcm_set_full_edited_26-27.png" },
];

const categoryImageMap: Record<string, string> = {
  "Massagers": pHead,
  "Mobile Accessories": pAirpods,
  "Beauty & Personal Care": pVanity,
  "Home & Kitchen": pJar,
  "Bags & Travel": pTravel,
  "Drinkware": pSteel,
  "Daily Essentials": pDish,
  "Fans & Coolers": pFan,
  "Books & Stationery": "/products/books/ncert_pcm_set_full_edited_26-27.png",
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
    "name": "7-Section Square Masala Box",
    "sub": "Plastic Spice Container with Spoon for Kitchen Storage",
    "price": 289,
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
    "boughtInPastMonth": 6000,
    "variants": [
      { "label": "Pack of 1", "price": 89, "mrp": 599, "unitPriceText": "(₹89.00 / count)" },
      { "label": "Pack of 2", "price": 169, "mrp": 1199, "unitPriceText": "(₹84.50 / count)" },
      { "label": "Pack of 4", "price": 319, "mrp": 2399, "unitPriceText": "(₹79.75 / count)" }
    ],
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
    "name": "3-Piece Motivational Water Bottle Set",
    "sub": "2000ml + 900ml + 300ml Leakproof Bottles with Time Marker & Straw",
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
    "colors": [],
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
    ],
    "boughtInPastMonth": 1000,
    "variants": [
      { "label": "Single Set (3 Pcs)", "price": 499, "mrp": 1499, "unitPriceText": "(₹166.33 / bottle)" },
      { "label": "Twin Set (6 Pcs)", "price": 899, "mrp": 2999, "unitPriceText": "(₹149.83 / bottle)" }
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
    "colors": [],
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
    ],
    "boughtInPastMonth": 2500
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
    "colors": [],
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
    ],
    "boughtInPastMonth": 3000
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
    "colors": [],
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
    ],
    "boughtInPastMonth": 2000
  },
  {
    "id": "prod_drive_6",
    "name": "Hand Press Fruit & Vegetable Chopper",
    "sub": "Compact Manual Food Chopper with Stainless Steel Blades",
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
    "colors": [],
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
    ],
    "boughtInPastMonth": 2500
  },
  {
    "id": "prod_drive_7",
    "name": "MRK Push Chopper for Vegetables",
    "sub": "Quick Manual Food Slicer with Pull Cord Mechanism",
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
    ],
    "boughtInPastMonth": 6000
  },
  {
    "id": "prod_drive_8",
    "name": "Rechargeable Scalp & Body Massager",
    "sub": "Cordless Waterproof Electric Massager for Head, Neck & Scalp Relief",
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
      }
    ],
    "colors": [],
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
    ],
    "boughtInPastMonth": 1000
  },
  {
    "id": "prod_drive_9",
    "name": "Premium Waterproof Travel Duffle Bag",
    "sub": "Foldable Large Capacity Overnight Gym & Travel Luggage Bag",
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
    "colors": [],
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
    ],
    "boughtInPastMonth": 800
  },
  {
    "asin": "B0GX62T8Z5",
    "id": "prod_amz_B0GX62T8Z5",
    "name": "6-Angle Adjustable Aluminum Laptop Stand",
    "sub": "Ergonomic Foldable & Portable Tabletop Riser Holder for Laptop/Desktop | Compatible with MacBook, HP, Dell, Lenovo & All Notebooks (Silver)",
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
      }
    ],
    "colors": [],
    "description": "About this item\n6-Level Adjustable Ergonomics for Comfort – Designed to reduce neck, shoulder & back strain with multiple height and angle adjustments for perfect working posture.\nPremium Lightweight Aluminum Build – Strong, durable and heat-dissipating aluminum body keeps your laptop stable and cool during long working hours.\nFoldable, Portable & Travel-Friendly – Ultra-compact design folds flat in seconds, making it ideal for office, home, travel, study tables and work-from-home setups.\nStrong Anti-Slip Grip & Ventilated Airflow – Silicone pads ensure your laptop stays firmly in place while the open-frame design improves airflow to prevent overheating.\nUniversal Laptop & Tablet Compatibility – Suitable for 10–17 inch devices including MacBook, HP, Dell, Lenovo, ASUS, Acer, Chromebooks & all notebook models.\n› See more product details",
    "isBestSeller": true,
    "rating": 4.5,
    "reviewsCount": 35,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GX62T8Z5",
    "boughtInPastMonth": 2500
  },
  {
    "asin": "B0GN1MQTH7",
    "id": "prod_amz_B0GN1MQTH7",
    "name": "3 Compartment Lunch Box for Office & School",
    "sub": "1400ml Leakproof Bento Lunch Box with Spoon & Fork | BPA Free Plastic Tiffin Box for Kids & Adults | Multicolor",
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
      }
    ],
    "colors": [],
    "description": "About this item\n3 Separate Compartments for Organized Meals - Designed with 3 individual compartments to keep rice, vegetables, snacks, fruits, and other food items neatly separated without mixing flavors.\nLeakproof & Secure Locking Design - Features a tight-sealing lid with secure locks that help prevent spills and leaks, making it ideal for office, school, college, and travel use.\nIncludes Spoon & Fork - Comes with a matching spoon and fork, providing a complete mealtime solution for convenient eating anywhere.\nBPA-Free & Food-Grade Material - Made from high-quality BPA-free plastic that is safe for everyday food storage and suitable for both kids and adults.\nLarge 1400ml Capacity for Daily Use - Spacious 1400ml capacity allows you to pack complete meals, making it perfect for office workers, students, and outdoor activities.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 84,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GN1MQTH7",
    "boughtInPastMonth": 400
  },
  {
    "asin": "B0GKWZQD8W",
    "id": "prod_amz_B0GKWZQD8W",
    "name": "4-Piece Airtight Kitchen Masala Box Set with Tray",
    "sub": "Leakproof Spice Storage Containers | Easy Flow Rasoi Organizer for Masala, Dry Fruits & Condiments",
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
      }
    ],
    "colors": [],
    "description": "About this item\nAirtight & Fresh: Prevents moisture, dust, and odor from affecting your spices.\nDurable Food-Grade Plastic: Lightweight, sturdy, and safe for daily kitchen use.\nEasy Flow Design: Pour spices quickly without spills or mess.\nTray Included: Keeps all 4 containers organized for easy storage and portability.\nTransparent Lids: Identify contents instantly without opening each box.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 61,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GKWZQD8W",
    "boughtInPastMonth": 400
  },
  {
    "asin": "B0FMNP246V",
    "id": "prod_amz_B0FMNP246V",
    "name": "4-in-1 Airtight Kitchen Storage Container Set of 3",
    "sub": "Multipurpose Plastic Masala & Spice Box with Flip Lids | Transparent Food Organizer Jars for Pulses, Grains, Cereals, Snacks, Tea & Sugar",
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
      }
    ],
    "colors": [],
    "description": "About this item\nSet of 3 – 4-in-1 Storage Containers – Each jar has 4 compartments to store different items, making it perfect for masalas, spices, pulses, cereals, grains, tea, coffee, sugar, dry fruits, or snacks.\nAirtight & Moisture-Proof – Flip-top lids with tight sealing keep food fresh for longer, preventing moisture, pests, and accidental spills.\nTransparent & Easy to Identify – Clear body design lets you quickly check contents without opening, saving time in busy kitchens.\nDurable & Food-Safe Plastic – Made from high-quality, BPA-free, non-toxic plastic that is sturdy, lightweight, and safe for everyday use.\nEasy to Clean & Refill – Wide openings and smooth interiors ensure hassle-free refilling and cleaning.\nSpace-Saving & Stylish – Compact, stackable design with sleek black lids fits seamlessly into modular kitchens and pantry shelves.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 67,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNP246V",
    "boughtInPastMonth": 100
  },
  {
    "asin": "B0GY4MYZFR",
    "id": "prod_amz_B0GY4MYZFR",
    "name": "Sonic Electric Toothbrush for Adults with 2 Replacement Brush Heads",
    "sub": "USB Rechargeable | 5 Brushing Modes for Deep Cleaning, Plaque Removal & Gum Care | Multicolor",
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
      }
    ],
    "colors": [],
    "description": "About this item\nPOWERFUL SONIC CLEANING TECHNOLOGY: Advanced sonic vibration technology helps remove plaque, food particles, and surface stains for a cleaner and fresher oral care experience\n5 BRUSHING MODES FOR PERSONALIZED CARE: Features Clean, Soft, Polish, Massage, and Whitening modes to suit daily cleaning, sensitive gums, and complete oral hygiene needs\nUSB RECHARGEABLE & TRAVEL FRIENDLY: Built-in rechargeable battery with USB charging support offers convenient cordless use at home, office, gym, or while travelling\nINCLUDES 2 REPLACEMENT BRUSH HEADS: Comes with 2 interchangeable brush heads designed for effective cleaning and long-term usability for adults\nERGONOMIC & WATER-RESISTANT DESIGN: Lightweight and comfortable grip design with water-resistant body makes it suitable for daily bathroom use and easy handling\nMULTICOLOR DESIGN OPTIONS: Available in attractive multicolor finish that adds a vibrant touch to your bathroom essentials and personal care collection\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 41,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GY4MYZFR",
    "boughtInPastMonth": 500
  },
  {
    "asin": "B0H2Z62YGG",
    "id": "prod_amz_B0H2Z62YGG",
    "name": "Digital Kitchen Weighing Scale",
    "sub": "High Precision Food Weight Machine with LCD Display | Multipurpose Electronic Weight Scale for Cooking, Baking & Grocery | Compact & Portable | White",
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
      }
    ],
    "colors": [],
    "description": "About this item\nHigh Precision Measurement - Accurate digital sensors provide precise weight readings for cooking, baking, meal prep, grocery measurement, and portion control.\nEasy-to-Read LCD Display - Bright LCD screen ensures clear visibility of measurements for convenient everyday kitchen use.\nMultipurpose Kitchen Use - Ideal for weighing vegetables, fruits, spices, baking ingredients, dry fruits, coffee, and small household items.\nCompact & Lightweight Design - Slim and space-saving design fits easily in kitchen cabinets and countertops while remaining portable for daily use.\nDurable & User-Friendly - Built with sturdy material and simple operation buttons for quick weighing, easy cleaning, and long-lasting performance.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 89,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0H2Z62YGG",
    "boughtInPastMonth": 400
  },
  {
    "asin": "B0FSKJ7J32",
    "id": "prod_amz_B0FSKJ7J32",
    "name": "Portable Cordless Wireless Heating Pad for Menstrual Period Cramps",
    "sub": "Electric Waist Belt Device, 4 Heat Levels and 4 Vibration Massage Modes, Back or Belly Heating Pad for Females",
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
    "colors": [],
    "description": "About this item\n🔥 【Multiple Adjustable Modes】Our heating pad for cramps designed with 3 heat levels and 4 vibration massage modes. You could adjust the temperature and massage, according to your actual needs which are comfortable for your comfortable and warm when using the cordless heating pad. Effectively relieve menstrual cramps and belly pain.\n🔥【Premium Heating Material】This heating pad built-in latest generation heating technology. Safe and healthy, fast heating, no need waiting. The portable heating pad deliver heat to your body to improve blood circulation and relax the muscles. It is suitable for relieving menstrual pain, stomach or abdominal pain.\n🔥【More Ergonomic】The back of our heating pad with massager is made of high-quality soft fabric, which is light and breathable, comfortable and can dissipate heat evenly. Our high elastic waistband is adjustable, suitable for various waistlines. It is suitable for multiple body parts hot compress massage, especially great for waist, abdominal, stomach and belly.\n🔥【Portable and Long Battery Life】This electric heating pad can work for 3.5 hours. You can use this cramps relief heating pad in resting, working, cooking, indoor or outdoor anytime anywhere.\n🔥 【Perfect Gift and Sincere Customer Service】Our usb heating pad is a great gift for your girlfriend, daughter, mother and friends. Warm tips: if charging during use, the period cramp heating pad will automatically shut down for safety, this is a normal. Please feel free to contact us anytime if any question via the amazon message center, a satisfied solution is promised forever.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 32,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FSKJ7J32",
    "boughtInPastMonth": 1000
  },
  {
    "asin": "B0GZHK8MYT",
    "id": "prod_amz_B0GZHK8MYT",
    "name": "Kids Space Theme Water Bottle",
    "sub": "650ml Leakproof Sipper Bottle with Straw for School | BPA-Free Plastic Cute Cartoon Water Bottle for Boys & Girls | One-Touch Flip Lid, Strap, Lightweight (Blue)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nFUN SPACE-THEME DESIGN FOR KIDS: Attractive cartoon prints featuring rockets, astronauts, sharks & rainbows make this bottle exciting for school-going kids and encourage regular water intake\n100% LEAKPROOF ONE-TOUCH FLIP LID: Secure lock system prevents spills in school bags. Easy press-button lid ensures quick, hygienic drinking for active children\nBPA-FREE & SAFE MATERIAL: Made from high-quality, non-toxic, BPA-free plastic. Safe for daily use at school, home, playgrounds, and outdoor activities\nBUILT-IN STRAW + CARRY STRAP: Smooth-sipping straw for kids of all ages, plus an adjustable strap that lets children carry it comfortably anywhere\nLIGHTWEIGHT, DURABLE & EASY TO CLEAN: Strong, transparent body with wide-mouth opening makes cleaning simple. Designed to withstand drops and daily usage by kids\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 31,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GZHK8MYT",
    "boughtInPastMonth": 700
  },
  {
    "asin": "B0FN7FW23S",
    "id": "prod_amz_B0FN7FW23S",
    "name": "Heavy Duty Garbage Bags – 180 Count (30 Bags x 6 Rolls)",
    "sub": "Extra Strong Black Trash Bags for Kitchen, Bathroom, Office & Outdoor Use | Leakproof & Tear-Resistant Dustbin Bags",
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
      }
    ],
    "colors": [],
    "description": "About this item\nEXTRA STRONG & DURABLE: Made with thick, high-density material that prevents tearing, splitting, and bursting even with heavy waste—ideal for daily household and commercial use.\n100% LEAKPROOF DESIGN: Securely sealed bottom stops liquid leakage and keeps your dustbin clean and hygienic, reducing mess and odour.\nMULTIPURPOSE USE: Perfect for kitchen, bathroom, office, outdoor cleaning, pet waste, and dry/wet waste disposal—compatible with most medium-size dustbins.\nEASY TO USE & DISPENSE: Comes in 6 compact rolls with 30 bags each, allowing smooth pull-out, easy tear-off, and quick replacement without any hassle.\nVALUE PACK OF 180 BAGS: Long-lasting pack designed to reduce repeat buying—offering better savings, convenience, and reliability for everyday waste management.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 21,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FN7FW23S",
    "boughtInPastMonth": 500
  },
  {
    "asin": "B0GP6SWNGM",
    "id": "prod_amz_B0GP6SWNGM",
    "name": "Airtight Fridge Storage Containers Combo (6-in-1 + Set of 3)",
    "sub": "BPA-Free Refrigerator Organizer Boxes with Lid & Drain Tray | Stackable Leakproof Vegetable, Fruit, Meat & Leftover Storage",
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
      }
    ],
    "colors": [],
    "description": "About this item\nSmart 6-in-1 + 3-Piece Combo Includes a 6-compartment organizer and 3 individual storage containers with drain trays — ideal for separating vegetables, fruits, herbs, meat, and leftovers neatly inside your refrigerator.\nBuilt-in Drain Tray for Freshness Removable inner drain basket keeps food elevated from water, helping reduce moisture buildup and supporting longer freshness of leafy greens and produce.\nAirtight & Leak-Resistant Lid Secure snap-lock lids help prevent spills and odor mixing inside the fridge, making it suitable for storing cut vegetables, fruits, and prepped meals.\nBPA-Free & Food-Grade Material Made from durable, transparent BPA-free plastic that allows easy visibility of contents while ensuring safe everyday food storage.\nStackable & Space-Saving Design Flat-top lids allow vertical stacking to maximize fridge space, making it ideal for small refrigerators, meal prep organization, and modular kitchen storage.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 85,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GP6SWNGM",
    "boughtInPastMonth": 400
  },
  {
    "asin": "B0GKWVTHTT",
    "id": "prod_amz_B0GKWVTHTT",
    "name": "Manual Hand Chopper 450ML",
    "sub": "Vegetable & Onion Chopper with Stainless Steel Blades | Pull String Food Processor | Garlic, Herbs, Nuts & Fruit Cutter",
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
      }
    ],
    "colors": [],
    "description": "About this item\nMultipurpose Food Chopper: Effortlessly chops vegetables, onions, garlic, nuts, herbs, and fruits for all your recipes.\nHigh-Quality Stainless Steel Blades: Durable, rust-resistant blades ensure precise and uniform chopping every time.\nEasy Pull-String Operation: Smooth, ergonomic pull cord design for fast and effortless food preparation.\n450ML Transparent Container: Compact yet spacious enough for daily kitchen use; monitor chopping progress easily.\nEasy to Clean & Store: Removable components are dishwasher-safe; lightweight design for convenient storage.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 47,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GKWVTHTT",
    "boughtInPastMonth": 400
  },
  {
    "asin": "B0GYFBYGZB",
    "id": "prod_amz_B0GYFBYGZB",
    "name": "2-in-1 Glass Oil Dispenser Spray Bottle",
    "sub": "Fine Mist & Controlled Pouring for Cooking | Refillable Kitchen Oil Sprayer for Frying, Baking, BBQ & Salad | Leakproof & Easy to Use",
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
      }
    ],
    "colors": [],
    "description": "About this item\n2-in-1 Spray & Pour Design: Smart dual-function oil dispenser lets you spray fine mist or pour controlled stream, giving full flexibility for frying, grilling, roasting, baking and seasoning.\nPremium Thick Glass Body: Made with high-quality transparent glass for durability, easy visibility of oil levels and safe everyday food-grade usage in modern kitchens.\nPrecise & Even Mist Output: Advanced spray nozzle ensures uniform misting to help reduce excess oil consumption, making it ideal for low-calorie cooking or fitness-focused meal prep.\nLeakproof & Easy to Refill: Designed with a tight sealing cap and wide mouth for spill-free refilling, secure storage and hassle-free daily use in home kitchens.\nMultipurpose Kitchen Companion: Suitable for multiple liquids—oil, vinegar, lemon juice, soy sauce, etc.—perfect for BBQ, salads, baking, air fryers and non-stick cooking.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 72,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GYFBYGZB",
    "boughtInPastMonth": 500
  },
  {
    "asin": "B0GYNLKW67",
    "id": "prod_amz_B0GYNLKW67",
    "name": "500ml Stainless Steel Vacuum Insulated Bottle Set with 2 Cups",
    "sub": "Double Wall Thermos Flask | Leak Proof BPA Free Water Bottle for Office, School, Travel & Outdoor",
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
      }
    ],
    "colors": [],
    "description": "About this item\nDouble Wall Vacuum Insulation - Keep your beverages hot or cold for extended hours with double-wall vacuum insulation, helping maintain the desired temperature throughout the day.\nPremium Stainless Steel - Made from high-quality stainless steel that is durable, rust-resistant, and designed for everyday use while preserving the taste of your beverages.\nLeak-Proof & BPA-Free - Designed with a secure leak-resistant lid to help prevent spills during travel. BPA-free construction offers a safe drinking experience.\nIncludes 2 Drinking Cups - Comes with two matching cups, making it convenient for sharing tea, coffee, water, or other beverages during travel, office, or outdoor activities.\nIdeal for Everyday Use - Suitable for carrying hot or cold beverages to the office, school, college, gym, picnics, camping, road trips, and daily commuting.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 48,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GYNLKW67",
    "boughtInPastMonth": 600
  },
  {
    "asin": "B0GYN9V6S7",
    "id": "prod_amz_B0GYN9V6S7",
    "name": "Manual Vegetable Chopper 900ML",
    "sub": "Heavy Duty Hand Press Food Processor | 3 Stainless Steel Blades | Onion, Tomato, Garlic Cutter | Multipurpose Kitchen Chopper & Salad Maker",
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
      }
    ],
    "colors": [],
    "description": "About this item\nHigh-Speed 3 Blade System: IESVRA chopper comes with ultra-sharp stainless steel blades for fast, uniform chopping of vegetables, fruits, nuts, and herbs in seconds\nEffortless Press Mechanism: Designed with an easy push system that reduces effort and speeds up food prep without electricity for everyday kitchen use\nLarge 900ML Capacity Bowl: Suitable for preparing larger quantities at once. Transparent container allows you to monitor chopping consistency easily\nMultipurpose Kitchen Essential: Chop onions, tomatoes, garlic, ginger, fruits, dry fruits, and prepare salads, chutneys, and sauces effortlessly\nSafe, Durable & Easy to Clean: Made from BPA-free food-grade plastic with anti-skid base for stability. Detachable parts ensure quick cleaning and maintenance\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 49,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GYN9V6S7",
    "boughtInPastMonth": 600
  },
  {
    "asin": "B0FT3SHG1X",
    "id": "prod_amz_B0FT3SHG1X",
    "name": "Flower Shape Adhesive Wall Hook (Pack of 10)",
    "sub": "Heavy Duty Transparent Wall Holder for Bathroom & Kitchen | No-Drill Sticker Hooks for Home Organization | Strong Self-Adhesive for Keys, Towels",
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
      }
    ],
    "colors": [],
    "description": "About this item\nStrong & Reliable Holding Power - Engineered with high-strength adhesive, these wall hooks provide a firm and long-lasting grip, ideal for daily household use.\nNo Drilling, No Damage Installation - Stick-and-use design ensures zero damage to walls—perfect for rented homes, tiles, glass, wood, metal, and smooth surfaces.\nMultipurpose Home Organization - Ideal for hanging towels, keys, ladles, loofahs, kitchen tools, decorations, charging cables, and daily essentials.\nWaterproof & Rust-Free Build - Made with durable, transparent material that stays clean and strong even in bathrooms, wash areas, and humid conditions.\nStylish Flower Design for Modern Homes - Decorative floral shape complements home décor while providing practical storage. Compact, aesthetic, and space-saving.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 83,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FT3SHG1X",
    "boughtInPastMonth": 1000,
    "variants": [
      { "label": "5", "price": 114.99, "mrp": 299, "unitPriceText": "(₹23.00 / count)" },
      { "label": "10", "price": 143.00, "mrp": 399, "unitPriceText": "(₹14.30 / count)" },
      { "label": "15", "price": 160.99, "mrp": 499, "unitPriceText": "(₹10.73 / count)" },
      { "label": "20", "price": 180.99, "mrp": 499, "unitPriceText": "(₹9.05 / count)" },
      { "label": "30", "price": 229.00, "mrp": 799, "unitPriceText": "(₹7.63 / count)" },
      { "label": "50", "price": 298.99, "mrp": 999, "unitPriceText": "(₹5.98 / count)" }
    ]
  },
  {
    "asin": "B0FT3TBXHK",
    "id": "prod_amz_B0FT3TBXHK",
    "name": "Flower Shape Adhesive Wall Hook (Pack of 20)",
    "sub": "Heavy Duty Transparent Wall Holder | No-Drill Waterproof Hooks for Bathroom, Kitchen & Home Organization | Strong Sticker Hangers for Accessories",
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
      }
    ],
    "colors": [],
    "description": "About this item\nHeavy-Duty Load Capacity: Strong adhesive design provides powerful grip for securely holding towels, utensils, keys, accessories, kitchen tools & more.\nNo-Drill, Damage-Free Installation: Simply peel and stick—no nails, screws or tools required. Protects walls, tiles, wood & glass surfaces from damage.\nWaterproof & Moisture-Resistant: Ideal for bathrooms & kitchens; the high-quality adhesive stays strong even in humid conditions.\nStylish Transparent Flower Design: Blends seamlessly with any décor theme while adding a modern, clean look to your living space.\nMulti-Purpose Home Organization: Perfect for kitchens, bathrooms, bedrooms, cupboards, wardrobes, behind doors, living rooms & office spaces.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 21,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FT3TBXHK",
    "boughtInPastMonth": 700
  },
  {
    "asin": "B0FT3X23KM",
    "id": "prod_amz_B0FT3X23KM",
    "name": "Flower Shape Adhesive Wall Hook (Pack of 30)",
    "sub": "Heavy Duty Transparent Wall Holder | No-Drill Waterproof Wall Hooks for Home, Bathroom, Kitchen & Bedroom Organization | Strong Sticker Hooks",
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
      }
    ],
    "colors": [],
    "description": "About this item\nStrong Load-Bearing Power - Heavy-duty adhesive hooks designed to hold everyday household items securely, ideal for home, kitchen, bathroom & storage spaces.\nNo-Drill, No-Damage Installation - Easy peel-and-stick application protects your walls—zero drilling, zero screws, zero mess.\nWaterproof & Moisture Resistant - Durable transparent hooks made to perform in wet areas like bathrooms, tiles, glass, kitchens & washrooms.\nReusable & Residue-Free Removal - Can be removed and repositioned without leaving marks or damaging surfaces—perfect for rented homes.\nMultipurpose Home Organization - Use for hanging utensils, keys, towels, accessories, fairy lights, bags, kitchen tools & more. Suitable for tiles, glass, metal, wood & smooth surfaces.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 82,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FT3X23KM",
    "boughtInPastMonth": 700
  },
  {
    "asin": "B0FT3R2ZDX",
    "id": "prod_amz_B0FT3R2ZDX",
    "name": "Flower Shape Adhesive Wall Hook (Pack of 40)",
    "sub": "Heavy Duty Transparent Wall Holder for Home | No-Drill Sticker Hooks for Bathroom, Kitchen, Bedroom | Strong Utility Wall Hanger for Organization",
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
      }
    ],
    "colors": [],
    "description": "About this item\nStrong Heavy-Duty Hold – Built with durable adhesive technology that offers a strong grip for hanging towels, utensils, keys, caps, cleaning tools, and everyday home accessories without falling.\nNo-Drill & Damage-Free Installation – Simply peel, stick, and use. These transparent hooks leave no holes, no stains, and no wall damage, making them ideal for renters and easy home improvement.\nMultipurpose for All Rooms – Perfect for use in the bathroom, kitchen, bedroom, balcony, wardrobes, tiles, glass, metal, and smooth wooden surfaces, giving you organized space everywhere.\nWaterproof & Rust-Free – Made with moisture-resistant, transparent material that stays strong even in wet areas like showers, washrooms, and kitchen sinks.\nSpace-Saving & Aesthetic Design – The clear flower-shaped design blends with all interiors while helping you keep your home neat, tidy, and clutter-free.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 74,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FT3R2ZDX",
    "boughtInPastMonth": 200
  },
  {
    "asin": "B0FJLTRRHM",
    "id": "prod_amz_B0FJLTRRHM",
    "name": "Fridge Storage Containers for Vegetables & Fruits (Set of 3)",
    "sub": "Refrigerator Organizer Bins with Lid & Drain Tray | Stackable, BPA-Free Transparent Kitchen Storage Box",
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
      }
    ],
    "colors": [],
    "description": "About this item\nStackable Space-Saving Design – Compact fridge organizer bins that maximize refrigerator and pantry storage while reducing clutter.\nMoisture-Control Drain Tray – Includes a removable bottom tray to drain water, keeping vegetables and fruits fresh longer.\nMulti-Purpose Use – Perfect for storing fruits, leafy greens, vegetables, snacks, herbs, dairy, and pantry essentials.\nTransparent & BPA-Free Plastic – Made from food-grade, crystal-clear plastic for durability, safety, and quick identification of contents.\nAirtight Lids for Hygiene – Prevents odor mixing, retains freshness, and ensures spill-free storage inside the fridge.\nEasy to Clean & Reusable – Low-maintenance containers that can be rinsed or wiped clean for daily, long-term use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 84,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FJLTRRHM",
    "boughtInPastMonth": 600
  },
  {
    "asin": "B0FMNJNYPG",
    "id": "prod_amz_B0FMNJNYPG",
    "name": "Fridge Storage Containers for Vegetables & Fruits (Set of 6)",
    "sub": "Stackable Refrigerator Organizer Bins with Lid & Drain Tray | BPA-Free Plastic Kitchen & Pantry Box",
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
    "colors": [],
    "description": "About this item\nStackable Space-Saving Design – Organize your refrigerator and pantry neatly with nestable fridge containers that maximize storage capacity without clutter.\nMoisture-Free Freshness – Built-in grid-style drain tray prevents water accumulation, keeping vegetables, fruits, and leafy greens fresher for longer.\nVersatile Multi-Purpose Use – Ideal for storing vegetables, fruits, snacks, meat, herbs, dairy items, and pantry essentials, making kitchen organization simple.\nClear BPA-Free Plastic – Crafted from food-grade, transparent plastic that ensures safety, durability, and quick visibility of contents at a glance.\nAirtight Lids for Hygiene – Secure-fit lids prevent spills, lock in freshness, and avoid odor transfer inside the refrigerator.\nEasy to Clean & Reusable – Low-maintenance containers that can be rinsed or wiped clean for repeated daily use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 16,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNJNYPG",
    "boughtInPastMonth": 200
  },
  {
    "asin": "B0FN49BJHQ",
    "id": "prod_amz_B0FN49BJHQ",
    "name": "Heavy Duty Garbage Bags – 90 Count (30 x 3 Rolls)",
    "sub": "Extra Strong Black Trash Bags | Leakproof & Tear-Resistant | Large Disposable Dustbin Bags for Home, Kitchen, Office & Commercial Use",
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
      }
    ],
    "colors": [],
    "description": "About this item\nHeavy Duty Strength & Durability – Made with premium thick material to handle wet, dry, sharp, or heavy waste without tearing. Ideal for daily and industrial use.\nLeakproof & Mess-Free – Advanced sealed bottom prevents leakage and keeps your dustbin clean and hygienic, even with wet kitchen waste.\nMultipurpose Use – Perfect for home, kitchen, office, restaurants, hotels, hospitals, salons, shops, and commercial spaces.\nConvenient Roll Packing – Comes in 3 easy-to-pull rolls (30 bags each) for quick dispensing, easy storage, and clutter-free use.\nLarge Size & Extra Capacity – Spacious black bags designed to fit most medium & large dustbins, providing maximum load-bearing strength.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 29,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FN49BJHQ",
    "boughtInPastMonth": 700
  },
  {
    "asin": "B0FNMQTDCR",
    "id": "prod_amz_B0FNMQTDCR",
    "name": "Guardian Bell Keychain",
    "sub": "Tibetan Good Luck Protection Bell Key Chain for Car, Bike, Motorcycle, Home & Travel | Spiritual Charm & Positive Energy Amulet",
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
      }
    ],
    "colors": [],
    "description": "Bring protection, positivity, and style wherever you go with the IESVRA Guardian Bell Keychain. Inspired by Tibetan traditions, this symbolic bell is believed to ward off negativity and attract good fortune. Whether used as a charm for your motorcycle, car, or carried in daily life, it serves as a constant reminder of spiritual energy and blessings. Compact and elegant, it makes a thoughtful gift for riders, travelers, and loved ones.",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 77,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNMQTDCR",
    "boughtInPastMonth": 200
  },
  {
    "asin": "B0GY8NFSF2",
    "id": "prod_amz_B0GY8NFSF2",
    "name": "Portable Cordless Heating Pad for Menstrual Pain Relief",
    "sub": "3 Heat & 4 Massage Modes | Rechargeable Period Cramp Relief Belt for Belly, Waist | Adjustable Pain Relief Warmer for Women",
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
      }
    ],
    "colors": [],
    "description": "About this item\nFast & Effective Menstrual Pain Relief - Designed to provide quick comfort during period cramps, lower belly pain, backaches, and muscle tension with deep warming technology.\n3 Heat Levels for Personalized Comfort - Features adjustable low, medium, and high heat settings to suit different pain levels and provide soothing warmth anytime.\n4 Intelligent Massage Modes - Combines vibration massage with heat therapy to relax muscles, reduce stiffness, and support all-day comfort for women.\nCordless, Lightweight & Rechargeable - Built with a long-lasting rechargeable battery, the belt is portable and easy to use anywhere—home, office, travel, or outdoors.\nSoft, Adjustable & Skin-Friendly Design - Made with comfortable elastic fabric that fits securely on the waist or abdomen, suitable for all body types.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 49,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GY8NFSF2",
    "boughtInPastMonth": 200
  },
  {
    "asin": "B0FJLTJBNY",
    "id": "prod_amz_B0FJLTJBNY",
    "name": "4-in-1 Airtight Kitchen Storage Container",
    "sub": "Multipurpose Plastic Masala & Spice Box with Flip Lids | Transparent Food Organizer Jar for Pulses, Grains, Cereals, Snacks, Tea & Sugar",
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
      }
    ],
    "colors": [],
    "description": "About this item\n4-in-1 Multipurpose Design – Store 4 different items in one jar; ideal for masalas, spices, pulses, cereals, grains, sugar, tea, coffee, or snacks.\nAirtight & Moisture-Proof – Flip-top lids with strong seals keep food fresh longer and protect against moisture, pests, and spills.\nTransparent Body for Quick Access – Instantly identify contents without opening, saving time during cooking and meal prep.\nDurable & Food-Safe Plastic – Made from premium BPA-free plastic, sturdy, lightweight, and safe for everyday kitchen use.\nEasy to Clean & Refill – Wide-mouthed compartments and smooth interiors make refilling and cleaning hassle-free.\nCompact & Stackable Organizer – Space-saving design fits perfectly in modular kitchens, pantries, and small storage spaces.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 83,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FJLTJBNY",
    "boughtInPastMonth": 400
  },
  {
    "asin": "B0FT3TD2Z8",
    "id": "prod_amz_B0FT3TD2Z8",
    "name": "Glass Oil Dispenser 250ml (1 Pack)",
    "sub": "Refillable Cooking Oil Sprayer Bottle for Kitchen, BBQ, Air Fryer & Baking | Fine Mist Olive Spray Bottle for Healthy Cooking",
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
      }
    ],
    "colors": [],
    "description": "About this item\nFine Mist Spray for Healthy Cooking - Designed with a precision nozzle that gives a uniform fine mist, helping you control oil usage and cook healthier meals in your kitchen, BBQ grill, baking tray or air fryer.\nPremium Glass Body for Safe Storage - Made with food-grade transparent glass, this oil sprayer ensures safe storage of edible oils like olive oil, sunflower oil, vinegar, etc., without affecting the taste.\nMultipurpose for All Cooking Needs - Perfect for grilling, roasting, sautéing, frying, salad dressing and baking. Ideal for both home kitchen and outdoor BBQ use.\nEasy to Use & Refillable - Simple pump-action design allows hassle-free spraying. The wide-mouth opening makes refilling easy without spills or mess.\nLeak-Proof & Portable - Built with a leak-resistant cap and strong pump mechanism, making it easy to carry and store. Suitable for everyday kitchen use and travel.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 64,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FT3TD2Z8",
    "boughtInPastMonth": 600
  },
  {
    "asin": "B0FMMCKYHB",
    "id": "prod_amz_B0FMMCKYHB",
    "name": "Airtight Fridge Storage Containers 6-in-1 Set",
    "sub": "BPA-Free Refrigerator Organizer Boxes with Lid & Drain Basket | Leakproof Vegetable, Fruit, Meat & Leftover Storage Box for Kitchen",
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
      }
    ],
    "colors": [],
    "description": "About this item\n6-in-1 Airtight Design: Comes with six removable drain baskets inside a large container to keep different food items fresh, separated, and moisture-free.\nKeeps Food Fresher Longer: Built-in drainage holes allow water to escape, reducing spoilage and preserving fruits, vegetables, and cooked items.\nMultipurpose Storage: Ideal for storing fruits, vegetables, meat, seafood, snacks, and leftovers in your fridge or freezer.\nBPA-Free & Food Safe: Made from high-quality, food-grade plastic that is non-toxic, odor-free, and safe for long-term food storage.\nTransparent & Space-Saving: Clear body for easy visibility of contents; stackable design optimizes fridge space and keeps it organized.\nLeakproof & Easy to Clean: Airtight lid with secure lock clips prevents spills and odor mixing; dishwasher-safe for quick cleaning.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 83,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMMCKYHB",
    "boughtInPastMonth": 600
  },
  {
    "asin": "B0GYF7HYV1",
    "id": "prod_amz_B0GYF7HYV1",
    "name": "Shoe Cleaning Wipes (Pack of 2)",
    "sub": "Quick Sneaker Wipes for Shoes | Portable Shoe Cleaner for Sneakers, Leather & Sports Footwear | White Shoe Cleaning Wipes",
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
      }
    ],
    "colors": [],
    "description": "Keep your favourite shoes looking clean and fresh with the IESVRA Shoe Cleaning Wipes Pack of 2 (160 wipes). Designed for effortless everyday shoe maintenance, these pre-moistened wipes remove dust, grime and surface marks in seconds. The gentle formula works safely on sneakers, leather shoes, canvas footwear, rubber soles and sports shoes, making them a versatile cleaning solution for all types of shoes. Their compact and travel-friendly design allows you to clean your footwear on-the-go—whether you're at the office, gym, school or traveling. Each wipe is individually moistened to maintain cleaning performance without leaving any residue. With a total of 160 wipes, this value pack ensures long-lasting convenience, helping you maintain neat and presentable shoes throughout the day. Perfect for users who want quick shoe touch-ups, sneaker maintenance, and hassle-free footwear cleaning without water.",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 69,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GYF7HYV1",
    "boughtInPastMonth": 600
  },
  {
    "asin": "B0GYF3LHPY",
    "id": "prod_amz_B0GYF3LHPY",
    "name": "Shoe Cleaning Wipes (Pack of 1)",
    "sub": "Quick Sneaker Wipes for Shoes | Portable Shoe Cleaner for Sneakers, Leather & Sports Footwear | White Shoe Cleaning Wipes",
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
      }
    ],
    "colors": [],
    "description": "Keep your favourite shoes looking clean and fresh with the IESVRA Shoe Cleaning Wipes Pack of 2 (160 wipes). Designed for effortless everyday shoe maintenance, these pre-moistened wipes remove dust, grime and surface marks in seconds. The gentle formula works safely on sneakers, leather shoes, canvas footwear, rubber soles and sports shoes, making them a versatile cleaning solution for all types of shoes. Their compact and travel-friendly design allows you to clean your footwear on-the-go—whether you're at the office, gym, school or traveling. Each wipe is individually moistened to maintain cleaning performance without leaving any residue. With a total of 160 wipes, this value pack ensures long-lasting convenience, helping you maintain neat and presentable shoes throughout the day. Perfect for users who want quick shoe touch-ups, sneaker maintenance, and hassle-free footwear cleaning without water.",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 25,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GYF3LHPY",
    "boughtInPastMonth": 1500
  },
  {
    "asin": "B0FKMBDMLT",
    "id": "prod_amz_B0FKMBDMLT",
    "name": "Square Masala Box with 7 Compartments & Spoon",
    "sub": "Plastic Spice Organizer with Airtight Lid | Indian Spice Storage Container for Kitchen (1 Pc, Brown)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nOrganized Spice Storage – Comes with 7 separate compartments and a central spoon to store daily-use spices neatly and access them easily while cooking.\nDurable & Food-Grade Material – Made from high-quality, BPA-free plastic that is safe for food storage and resistant to breakage.\nCompact & Space-Saving Design – Square shape fits easily in kitchen cabinets, shelves, or countertops without occupying extra space.\nTransparent Lid for Easy Viewing – Clear top lid allows you to check spice levels at a glance without opening the box.\nMultipurpose Utility Box – Ideal for storing masalas, herbs, mouth freshener, dry fruits, seeds, and condiments for home or restaurant use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 91,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FKMBDMLT",
    "boughtInPastMonth": 600
  },
  {
    "asin": "B0GTQ7TCKY",
    "id": "prod_amz_B0GTQ7TCKY",
    "name": "Adjustable Aluminum Laptop Stand Foldable Portable",
    "sub": "Ergonomic Laptop Riser with Anti-Slip Pads | Heavy Duty Cooling Stand for Desk, MacBook, Notebook (Silver)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nIESVRA Height Adjusting Laptop Stand Or Laptop Ergonomic Stand Or Laptop Stands For Office Desk Improves Your Posture Scientifically Designed To Help You Balance You’re Sitting Posture Keeping Your Back Straight, Neck Relaxed And Wrists Natural Even After Long Work Hours\nMulti-Angle Adjustable Design: The Aluminium Laptop Stand Or Metal Laptop Stand Or Foldable Laptop Stand Or Better Known As A Aluminum Laptop Stand Provides 6-Speed Adjustable Height, Adjust To Comfortable Operating Angle And Height Based On Your Actual Need. And The Ergonomic Design Makes For Easy Watching And Typing, Relieving Neck, Shoulder And Spinal Pain.\nCompatibility: The Laptop & Tablet Stand Supports Most Devices From 10 - 15.6 Inches: Macbook, Thinkpad, Surface, Chromebook, Ipad Pro, Etc. Therefore Known As A 11.6 Inch Laptop Stand ,12 Inch Laptop Stand , 13.3 Inch Laptop Stand ,15 Inch Laptop Stans & 15.6 Inch Laptop Stand\nIESVRA Travel Laptop Stand Or Laptop Stand Metal Is A Laptop Foldable Stand Which You Can Fold And Carry Easly In Your Backpack Or Briefcase You Can Use It To Change Angle Of Your Laptop Therefore Use It As Laptop Incline Stand Or Laptop Height Stand\nLaptop stand fully foldable, light weight at 260gm only and extremely handy to carry in your office bag [Increases laptop life]-keeps your laptop cooler so the battery life and internal components life also improves\nEXQUISITE WORKMANSHIP: Machined from anodized aluminum alloy, with sand blasted and brushed processes. With Non-slip silicone mat, avoid from risking of any scratches to your devices and stable placement makes it the best laptop stand available in the market\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 41,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GTQ7TCKY",
    "boughtInPastMonth": 700
  },
  {
    "asin": "B0GTLYX2JX",
    "id": "prod_amz_B0GTLYX2JX",
    "name": "Foldable Aluminum Alloy Laptop Stand",
    "sub": "Adjustable Portable Holder with Anti-Slip Silicone Pads, Ergonomic Cooling Stand for MacBook, Laptop & Tablet, Silver",
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
      }
    ],
    "colors": [],
    "description": "About this item\nDURABLE ALUMINIUM ALLOY BUILD: Crafted from high-quality aluminium alloy, this laptop stand offers a strong, stable, and scratch-resistant base with a sleek, modern finish\n7 ADJUSTABLE HEIGHT LEVELS: Features multiple ergonomic angle settings to help reduce neck, shoulder, and back strain, letting you find the optimal viewing position for long work sessions\nFOLDABLE & PORTABLE DESIGN: Folds flat into a compact form and comes with a drawstring carry pouch, making it easy to carry to the office, home, or while travelling\nANTI-SLIP SILICONE PADS & STURDY HINGES: Non-slip silicone pads on the base and support arms keep your device secure and scratch-free, while robust hinges ensure lasting stability\nVENTILATED COOLING STRUCTURE: The open-frame design promotes increased airflow beneath your laptop, helping prevent overheating during extended use and compatible with most laptops, MacBooks, and tablets\nUNIVERSAL COMPATIBILITY: Supports a wide range of devices including laptops from 10 to 17 inches, MacBooks, notebooks, and tablets, accommodating various brands and models\nLIGHTWEIGHT CONSTRUCTION: Weighs minimally while maintaining structural integrity, allowing for effortless transportation between workspaces without compromising on stability or durability\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 86,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GTLYX2JX",
    "boughtInPastMonth": 500
  },
  {
    "asin": "B0GN21V5Z7",
    "id": "prod_amz_B0GN21V5Z7",
    "name": "1200ml Leak Proof Lunch Box for Office & School",
    "sub": "BPA Free Food Container with Airtight Lid | Microwave Safe, Durable & Lightweight Tiffin Box for Men, Women & Kids (Bule)",
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
      }
    ],
    "colors": [],
    "description": "About this item\n100% Leak Proof & Airtight Design – Secure locking lid prevents spills and keeps food fresh for long hours, making it ideal for office, school, college & travel.\nSafe BPA Free Material – Made from high-quality food grade plastic, free from harmful chemicals and completely safe for daily food storage.\nMicrowave Safe & Easy to Clean – Heat your meals conveniently without transferring to another container. Dishwasher friendly and stain resistant.\n1200ml Large Capacity – Perfect size for carrying lunch, snacks, fruits or full meals for men, women and growing kids.\nLightweight & Durable Build – Strong yet lightweight design fits easily in backpacks and office bags, perfect for daily use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 70,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GN21V5Z7",
    "boughtInPastMonth": 500
  },
  {
    "asin": "B0H7S3FQWS",
    "id": "prod_amz_B0H7S3FQWS",
    "name": "Sonic Electric Toothbrush for Adults, Multicolor",
    "sub": "USB Rechargeable, 2 Replacement Brush Heads, 5 Brushing Modes, Deep Cleaning, Plaque Removal & Gum Care",
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
      }
    ],
    "colors": [],
    "description": "About this item\nPowerful Sonic Cleaning: Advanced sonic technology helps remove plaque effectively while providing a thorough clean for healthier teeth and fresher breath\n5 Brushing Modes: Features Clean, White, Polish, Sensitive, and Gum Care modes to suit different oral care needs and provide a personalized brushing experience\nUSB Rechargeable Convenience: Recharge easily using the included USB charging cable. Designed for regular daily use with long-lasting battery performance\nIncludes 2 Replacement Brush Heads: Comes with two high-quality brush heads for extended use. Soft bristles are gentle on gums while cleaning teeth effectively\nComfortable & Travel-Friendly Design: Lightweight ergonomic handle offers a comfortable grip. Suitable for home, office, and travel use\nSmart Timer Function: Built-in timer helps ensure proper brushing duration for optimal oral care and effective cleaning results every time\nWaterproof Construction: Fully waterproof design allows safe use in the shower and makes cleaning the toothbrush quick and easy under running water\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 54,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0H7S3FQWS",
    "boughtInPastMonth": 700
  },
  {
    "asin": "B0GPH37X28",
    "id": "prod_amz_B0GPH37X28",
    "name": "Combo- 4-Piece Airtight Kitchen Masala Box Set with Tray & 4-in-1 Airtight Storage Container",
    "sub": "Transparent Spice Containers with Rack & Dry Storage Jar",
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
      }
    ],
    "colors": [],
    "description": "About this item\nCOMPLETE KITCHEN STORAGE COMBO Includes 4-piece masala box set with tray rack and 4-in-1 airtight storage container, offering organized storage for daily cooking essentials.\nAIRTIGHT & MOISTURE-RESISTANT LIDS Designed to help keep spices, pulses and dry ingredients fresh by reducing exposure to air and humidity.\nSPACE-SAVING & MODULAR DESIGN Compact tray rack and vertical 4-compartment jar optimize shelf space and maintain a neat kitchen setup.\nTRANSPARENT BODY FOR EASY IDENTIFICATION Clear containers allow quick visibility of contents, making meal preparation faster and more convenient.\nMULTI-PURPOSE DAILY USE STORAGE Ideal for masalas, salt, sugar, dals, rice, dry fruits, snacks and grocery items for everyday kitchen use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 21,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GPH37X28",
    "boughtInPastMonth": 200
  },
  {
    "asin": "B0GNS8BS61",
    "id": "prod_amz_B0GNS8BS61",
    "name": "Motivational Water Bottle 3 Pcs Set (2000ml + 900ml + 300ml)",
    "sub": "Transparent Leakproof Plastic Water Bottles with Time Marker | Gym, Office, School & Travel | BPA Free",
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
      }
    ],
    "colors": [],
    "description": "About this item\nComplete 3 Size Hydration Combo Includes 2000ml large bottle, 900ml medium bottle, and 300ml compact bottle — perfect for full-day hydration, workouts, school, travel, and daily office use.\nMotivational Time Markers for Daily Intake Clear measurement scale and time reminders help track water consumption easily and support consistent hydration throughout the day.\nLeakproof & Secure Flip Lock Design Strong locking lid with safety latch prevents leakage. Ideal for carrying in gym bags, backpacks, or travel without spills.\nDurable, Lightweight & BPA-Free Plastic Made from high-quality transparent plastic that is lightweight, sturdy, and safe for everyday use.\nDesigned for Everyday Convenience Carry handle for easy grip, slim design for better portability, and wide mouth opening for easy cleaning and refilling.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 58,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GNS8BS61",
    "boughtInPastMonth": 500
  },
  {
    "asin": "B0FMNQZXH8",
    "id": "prod_amz_B0FMNQZXH8",
    "name": "4-in-1 Airtight Kitchen Storage Container (Set of 2)",
    "sub": "Multipurpose Plastic Masala & Spice Box with Flip Lids | Transparent Food Organizer Jar for Pulses, Grains, Cereals, Snacks, Tea & Sugar",
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
      }
    ],
    "colors": [],
    "description": "About this item\n4-in-1 Compartment Design – Store 4 different food items in one container; ideal for spices, masalas, cereals, pulses, grains, snacks, tea, coffee, or sugar.\nAirtight & Moisture-Proof – Flip-top lids with tight seals maintain freshness, prevent moisture, and keep pests away.\nTransparent Body for Easy Access – Quickly check contents without opening the jar, ensuring efficient kitchen organization.\nDurable & BPA-Free Plastic – Made from high-quality, food-safe plastic that is non-toxic, sturdy, and safe for everyday kitchen use.\nEasy to Clean & Refill – Wide openings and smooth surfaces make cleaning and refilling hassle-free.\nSpace-Saving & Stackable Design – Compact, stylish, and ideal for modular kitchens, small apartments, and pantry shelves.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 52,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNQZXH8",
    "boughtInPastMonth": 300
  },
  {
    "asin": "B0GGH1ZFYN",
    "id": "prod_amz_B0GGH1ZFYN",
    "name": "Lucky Owl Resin Statue for Good Luck",
    "sub": "Aesthetic Owl Art Figurine Showpiece for Home & Office Décor, Feng Shui & Vastu Wisdom Ornament Gift",
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
      }
    ],
    "colors": [],
    "description": "About this item\nLucky Owl Resin Statue – Symbolizes good luck, wisdom & protection, perfect for energy positivity décor.\nHigh‑Quality Aesthetic Home Décor – Crafted with premium resin for a smooth, elegant finish that suits modern and classic styles.\nMulti‑Purpose Decoration – Ideal for living room, bedroom, study desk, office table, shelf, or reception area.\nThoughtful Gift Idea – A meaningful present for friends & family for housewarming, festivals, or special occasions.\nFeng Shui & Vastu Friendly – Brings harmony, positive vibes & prosperity to any space where displayed\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 58,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GGH1ZFYN",
    "boughtInPastMonth": 1500
  },
  {
    "asin": "B0CKJ2HCQ6",
    "id": "prod_amz_B0CKJ2HCQ6",
    "name": "NANZU Glass 2 in 1 Oil Sprayer and Dispenser Bottle",
    "sub": "500ML for Kitchen, Cooking, BBQ, Air Fryer, Salad, Frying, Baking, Transparent",
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
      }
    ],
    "colors": [],
    "description": "About this item\n【2 in 1 Olive Oil Sprayer and Oiler】This oil dispenser bottle has a built-in spout. You can switch between spray and pour functions at any time. Kitchenware tools for home and kitchen.\n【Upgraded Nozzle Design】The nozzle of this olive oil dispenser bottle has been upgraded to achieve a uniform fan-shaped spray. The upgraded anti-drip design realizes no dripping or hanging on the wall when pouring oil.\n【Food Grade Material】This olive oil sprayer is made of thickened lead-free glass material, sturdy and durable. The clear bottle lets you know exactly how much oil is left. The lid and handle are made of food grade PP material, BPA free.\n【Large Diameter Spout】The spout of this oil dispenser bottle has been widened, which is very convenient for pouring sunflower oil, vinegar, soy sauce, lemon and lime juice, sherry or marsala wine, etc.\n【Easy to Use and Clean】This oil dispenser bottle has an ergonomic handle. The handle is comfortable to hold. The body of the pot is not easy to hang oil, and it is easy to clean. Dishwasher safe.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 55,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0CKJ2HCQ6",
    "boughtInPastMonth": 500
  },
  {
    "asin": "B0F8BWVZ64",
    "id": "prod_amz_B0F8BWVZ64",
    "name": "(Pack of 5, 39 Inches) Door Guard – Bottom Seal Strip Gap Filler for Doors",
    "sub": "Soundproof, Noise Reduction, Energy Saving, Dust & Insect, Rat Protector, Door Strip for Home & Office",
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
      }
    ],
    "colors": [],
    "description": "About this item\nThe Twin Draft Guard is made from a washable fabric that is abrasion resistant. Not only does the draft guard help keep the heat in and cold out, it also keeps dust, sand, and bugs out while also helping with sound insulation.\nYou can save a lot of power if you are running an air conditioner in your room. An AC needs to work harder if there is air leak from the room, especially from under the door\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 89,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0F8BWVZ64",
    "boughtInPastMonth": 600
  },
  {
    "asin": "B0H6M1SP15",
    "id": "prod_amz_B0H6M1SP15",
    "name": "Spin Mop Bucket Set with Stainless Steel Handle",
    "sub": "360° Rotating Microfiber Floor Cleaning Mop | 2 Refill Heads | Easy Spin Wringer System | Blue",
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
      }
    ],
    "colors": [],
    "description": "About this item\nEFFICIENT 360° FLOOR CLEANING - 360-degree rotating mop head easily reaches under furniture, corners, and hard-to-clean areas for effective home cleaning.\nHANDS-FREE SPIN WRINGER SYSTEM - Built-in spin mechanism helps remove excess water quickly, reducing effort and keeping hands clean during mopping.\nDURABLE STAINLESS STEEL HANDLE - Strong stainless steel telescopic handle offers durability, rust resistance, and comfortable grip for everyday use.\nHIGH ABSORBENCY MICROFIBER REFILLS - Includes 2 microfiber mop heads that effectively absorb dust, dirt, and spills while being gentle on floor surfaces.\nMULTIPURPOSE HOME CLEANING TOOL - Suitable for tiles, marble, granite, laminate, wooden floors, kitchens, bathrooms, offices, and living spaces.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 24,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0H6M1SP15",
    "boughtInPastMonth": 200
  },
  {
    "asin": "B0FMNWLK3C",
    "id": "prod_amz_B0FMNWLK3C",
    "name": "Door Mat for Home Entrance Set of 3 (Set of 3)",
    "sub": "Anti-Slip Waterproof Doormat for Main Door | Large Brown Dust Control Floor Mat for Indoor Outdoor Use | Home, Bathroom, Kitchen & Balcony",
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
      }
    ],
    "colors": [],
    "description": "About this item\nPremium Quality & Heavy Duty – The IESVRA Door Mat for Home Entrance is crafted with durable, high-density material that traps dirt, dust, and moisture, keeping your main door area neat and clean.\nAnti-Slip & Waterproof Design – Designed as an Anti-Skid Door Mat for Main Door, it features a strong non-slip backing that prevents slips and stays firmly in place — perfect for kids and elders\nWashable & Easy to Clean – This Washable Door Mat for Home can be easily washed by hand or machine, dries quickly, and looks as good as new — a smart Indoor Outdoor Door Mat for all weather.\nTrusted by Indian Homes – Ideal for those searching for Door Mat for Indian Home Entrance, Rubber Waterproof Doormat, Dust Control Floor Mat, or Non-Slip Doormat for Balcony — IESVRA offers style, quality, and functionality in one.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 17,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNWLK3C",
    "boughtInPastMonth": 200
  },
  {
    "asin": "B0FMNFV2DJ",
    "id": "prod_amz_B0FMNFV2DJ",
    "name": "Double Tube Door Bottom Seal Guard (Set of 4)",
    "sub": "Noise Reduction, Dust & Insect Blocker | Energy Saving Draft Stopper | Easy Install Under Door Insulation Strip for Home & Office",
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
      }
    ],
    "colors": [],
    "description": "About this item\nEffective Noise Reduction & Gap Sealing Dual foam tube design tightly seals gaps under doors, helping reduce outside noise, cold air, and unwanted drafts for a quieter and more comfortable indoor environment.\nBlocks Dust, Insects & Pollution Creates a protective barrier that helps prevent dust, insects, smoke, and pollutants from entering through door gaps, keeping your home cleaner and healthier.\nEnergy Saving Insulation Improves temperature control by minimizing air leakage. Helps maintain indoor cooling or heating efficiency, potentially reducing electricity usage.\nEasy Slide-On Installation – No Tools Required Simply slide the seal under your door and adjust to fit. No drilling, screws, or adhesive required. Suitable for most standard doors.\nDurable & Long-Lasting Material Made with high-density foam tubes and flexible outer cover for strong sealing performance and extended durability for daily use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 25,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNFV2DJ",
    "boughtInPastMonth": 1200
  },
  {
    "asin": "B0FMNFZ6KS",
    "id": "prod_amz_B0FMNFZ6KS",
    "name": "Double Tube Door Bottom Seal Guard",
    "sub": "Noise Reduction, Dust & Insect Blocker | Energy Saving Draft Stopper | Easy Install Under Door Insulation Strip for Home & Office (Set 0f 5)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nEffective Noise Reduction & Gap Sealing Dual foam tube design tightly seals gaps under doors, helping reduce outside noise, cold air, and unwanted drafts for a quieter and more comfortable indoor environment.\nBlocks Dust, Insects & Pollution Creates a protective barrier that helps prevent dust, insects, smoke, and pollutants from entering through door gaps, keeping your home cleaner and healthier.\nEnergy Saving Insulation Improves temperature control by minimizing air leakage. Helps maintain indoor cooling or heating efficiency, potentially reducing electricity usage.\nEasy Slide-On Installation – No Tools Required Simply slide the seal under your door and adjust to fit. No drilling, screws, or adhesive required. Suitable for most standard doors.\nDurable & Long-Lasting Material Made with high-density foam tubes and flexible outer cover for strong sealing performance and extended durability for daily use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 59,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNFZ6KS",
    "boughtInPastMonth": 1200
  },
  {
    "asin": "B0FMNFDX1Z",
    "id": "prod_amz_B0FMNFDX1Z",
    "name": "Door Mat for Home Entrance (6)",
    "sub": "Large Anti-Slip Doormat for Main Door | Waterproof Dust Control Mat for Indoor Outdoor Use | Brown Heavy Duty Floor Mat for Bathroom, Living Room & Balcony",
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
      }
    ],
    "colors": [],
    "description": "About this item\nPremium Quality & Heavy Duty – The IESVRA Door Mat for Home Entrance is crafted with durable, high-density material that traps dirt, dust, and moisture, keeping your main door area neat and clean.\nAnti-Slip & Waterproof Design – Designed as an Anti-Skid Door Mat for Main Door, it features a strong non-slip backing that prevents slips and stays firmly in place — perfect for kids and elders\nWashable & Easy to Clean – This Washable Door Mat for Home can be easily washed by hand or machine, dries quickly, and looks as good as new — a smart Indoor Outdoor Door Mat for all weather.\nTrusted by Indian Homes – Ideal for those searching for Door Mat for Indian Home Entrance, Rubber Waterproof Doormat, Dust Control Floor Mat, or Non-Slip Doormat for Balcony — IESVRA offers style, quality, and functionality in one.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 30,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNFDX1Z",
    "boughtInPastMonth": 100
  },
  {
    "asin": "B0FMNT8XSN",
    "id": "prod_amz_B0FMNT8XSN",
    "name": "Double Tube Door Bottom Seal Guard",
    "sub": "Noise Reduction, Dust & Insect Blocker | Energy Saving Draft Stopper | Easy Install Under Door Insulation Strip for Home & Office (Set 0f 7)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nEffective Noise Reduction & Gap Sealing Dual foam tube design tightly seals gaps under doors, helping reduce outside noise, cold air, and unwanted drafts for a quieter and more comfortable indoor environment.\nBlocks Dust, Insects & Pollution Creates a protective barrier that helps prevent dust, insects, smoke, and pollutants from entering through door gaps, keeping your home cleaner and healthier.\nEnergy Saving Insulation Improves temperature control by minimizing air leakage. Helps maintain indoor cooling or heating efficiency, potentially reducing electricity usage.\nEasy Slide-On Installation – No Tools Required Simply slide the seal under your door and adjust to fit. No drilling, screws, or adhesive required. Suitable for most standard doors.\nDurable & Long-Lasting Material Made with high-density foam tubes and flexible outer cover for strong sealing performance and extended durability for daily use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 50,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNT8XSN",
    "boughtInPastMonth": 1500
  },
  {
    "asin": "B0FMNJ7LVF",
    "id": "prod_amz_B0FMNJ7LVF",
    "name": "Door Mat for Home Entrance Set of 8",
    "sub": "Anti-Slip Waterproof Doormat for Main Door | Large Brown Dust Control Floor Mat for Indoor Outdoor Use | Home, Bathroom, Kitchen & Balcony",
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
      }
    ],
    "colors": [],
    "description": "About this item\nEffective Noise Reduction & Gap Sealing Dual foam tube design tightly seals gaps under doors, helping reduce outside noise, cold air, and unwanted drafts for a quieter and more comfortable indoor environment.\nBlocks Dust, Insects & Pollution Creates a protective barrier that helps prevent dust, insects, smoke, and pollutants from entering through door gaps, keeping your home cleaner and healthier.\nEnergy Saving Insulation Improves temperature control by minimizing air leakage. Helps maintain indoor cooling or heating efficiency, potentially reducing electricity usage.\nEasy Slide-On Installation – No Tools Required Simply slide the seal under your door and adjust to fit. No drilling, screws, or adhesive required. Suitable for most standard doors.\nDurable & Long-Lasting Material Made with high-density foam tubes and flexible outer cover for strong sealing performance and extended durability for daily use.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 33,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FMNJ7LVF",
    "boughtInPastMonth": 100
  },
  {
    "asin": "B0FKMKZLBJ",
    "id": "prod_amz_B0FKMKZLBJ",
    "name": "Door Mat for Home Entrance",
    "sub": "Anti-Slip Door Mat for Main Door | Waterproof Dust Control Doormat for Indoor Outdoor | Brown Large Door Mat for Home Bathroom",
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
      }
    ],
    "colors": [],
    "description": "About this item\nPremium Quality & Heavy Duty – The IESVRA Door Mat for Home Entrance is crafted with durable, high-density material that traps dirt, dust, and moisture, keeping your main door area neat and clean.\nAnti-Slip & Waterproof Design – Designed as an Anti-Skid Door Mat for Main Door, it features a strong non-slip backing that prevents slips and stays firmly in place — perfect for kids and elders\nWashable & Easy to Clean – This Washable Door Mat for Home can be easily washed by hand or machine, dries quickly, and looks as good as new — a smart Indoor Outdoor Door Mat for all weather.\nTrusted by Indian Homes – Ideal for those searching for Door Mat for Indian Home Entrance, Rubber Waterproof Doormat, Dust Control Floor Mat, or Non-Slip Doormat for Balcony — IESVRA offers style, quality, and functionality in one.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 26,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FKMKZLBJ",
    "boughtInPastMonth": 50
  },
  {
    "asin": "B0FJLRDFK2",
    "id": "prod_amz_B0FJLRDFK2",
    "name": "Reusable Popsicle Mould Set",
    "sub": "6-Cavity BPA-Free Ice Cream & Kulfi Moulds with Stand | DIY Ice Lolly Maker for Kids & Adults – Pink Plastic Frozen Treat Mold",
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
      }
    ],
    "colors": [],
    "description": "About this item\n6-Cavity Reusable Popsicle Mould Set – Make up to 6 homemade ice creams or kulfis at once with this user-friendly ice pop maker.\nBPA-Free & Food-Grade Plastic – Safe, durable, and non-toxic material, perfect for kids and family-friendly use.\nAttractive Pink Design with Stand – Comes with a pink star-shaped base stand for stability and mess-free freezing.\nEasy to Use & Clean – Simply fill, freeze, and pull! Dishwasher-safe and easy to demould without cracking.\nPerfect for Summer Fun & Healthy Treats – Great for making fruit pops, yogurt bars, smoothie popsicles, and more—ideal for kids' snacks and adults’ desserts.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 29,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FJLRDFK2",
    "boughtInPastMonth": 1200
  },
  {
    "asin": "B0FKMZY6L3",
    "id": "prod_amz_B0FKMZY6L3",
    "name": "Reusable Popsicle Mould Set",
    "sub": "6-Cavity BPA-Free Ice Cream & Kulfi Moulds with Stand | DIY Ice Lolly Maker for Kids & Adults – Plastic Frozen Treat Mold (Blue)",
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
      }
    ],
    "colors": [],
    "description": "About this item\n6-Cavity Reusable Popsicle Mould Set – Make up to 6 homemade ice creams or kulfis at once with this user-friendly ice pop maker.\nBPA-Free & Food-Grade Plastic – Safe, durable, and non-toxic material, perfect for kids and family-friendly use.\nAttractive Pink Design with Stand – Comes with a pink star-shaped base stand for stability and mess-free freezing.\nEasy to Use & Clean – Simply fill, freeze, and pull! Dishwasher-safe and easy to demould without cracking.\nPerfect for Summer Fun & Healthy Treats – Great for making fruit pops, yogurt bars, smoothie popsicles, and more—ideal for kids' snacks and adults’ desserts.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 48,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FKMZY6L3",
    "boughtInPastMonth": 1500
  },
  {
    "asin": "B0FKN5CB6D",
    "id": "prod_amz_B0FKN5CB6D",
    "name": "Reusable Popsicle Mould Set",
    "sub": "6-Cavity BPA-Free Ice Cream & Kulfi Moulds with Stand | DIY Ice Lolly Maker for Kids & Adults – Plastic Frozen Treat Mold (Green)",
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
      }
    ],
    "colors": [],
    "description": "About this item\n6-Cavity Reusable Popsicle Mould Set – Make up to 6 homemade ice creams or kulfis at once with this user-friendly ice pop maker.\nBPA-Free & Food-Grade Plastic – Safe, durable, and non-toxic material, perfect for kids and family-friendly use.\nAttractive Pink Design with Stand – Comes with a pink star-shaped base stand for stability and mess-free freezing.\nEasy to Use & Clean – Simply fill, freeze, and pull! Dishwasher-safe and easy to demould without cracking.\nPerfect for Summer Fun & Healthy Treats – Great for making fruit pops, yogurt bars, smoothie popsicles, and more—ideal for kids' snacks and adults’ desserts.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 14,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FKN5CB6D",
    "boughtInPastMonth": 800
  },
  {
    "asin": "B0GYNSPBFF",
    "id": "prod_amz_B0GYNSPBFF",
    "name": "Manual Cold Press Juicer",
    "sub": "Hand Juicer Machine with Steel Filter | Slow Juicer for Fruits & Vegetables | Hand Operated Juice Extractor for Orange, Pomegranate, Pineapple, Grapes | BPA Free",
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
      }
    ],
    "colors": [],
    "description": "About this item\nAdvanced Cold Press Technology: Extracts maximum juice with minimal oxidation, preserving natural nutrients, enzymes, and taste for healthier drinking\nHeavy-Duty Manual Operation: No electricity required; smooth hand crank system ensures efficient juice extraction with full control and zero noise\nHigh Efficiency Steel Filter System: Fine stainless steel mesh separates pulp effectively, delivering smooth, fiber-free juice every time\nMultipurpose Juicing Solution: Suitable for oranges, pomegranates, grapes, pineapple, sweet lime, and even leafy greens for detox juices\nDurable, Safe & Easy to Clean: Made with BPA-free food-grade plastic, anti-slip base for stability, and detachable parts for quick cleaning and maintenance\nCompact & Portable Design: Lightweight construction makes it convenient for daily kitchen use, travel, and outdoor activities without requiring power sources\nNutrient Retention Technology: Slow extraction process minimizes heat buildup and oxidation to maintain vitamins, minerals, and natural enzymes in your juice\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 30,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GYNSPBFF",
    "boughtInPastMonth": 50
  },
  {
    "asin": "B0FKYM1S95",
    "id": "prod_amz_B0FKYM1S95",
    "name": "Portable Mini Sealing Machine",
    "sub": "Handheld Heat Sealer for Plastic Bags, Snack Packets, Chips & Food Storage | Rechargeable USB Seal & Cutter for Airtight Freshness (Blue)",
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
      }
    ],
    "colors": [],
    "description": "About this item\n2-in-1 Seal & Cut Function – Quickly seals and cuts plastic packaging to preserve freshness and reduce food waste.\nCordless & Rechargeable – Comes with USB charging cable for wireless, mess-free use anywhere.\nPerfect for All Bag Types – Works on snack packets, plastic pouches, foil bags, and other kitchen packaging.\nMagnetic & Compact Design – Attaches easily to refrigerators or metal surfaces for handy access.\nSafe & User-Friendly – One-button operation with built-in safety lock to prevent accidental burns.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 85,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FKYM1S95",
    "boughtInPastMonth": 1200
  },
  {
    "asin": "B0FKYNNVLN",
    "id": "prod_amz_B0FKYNNVLN",
    "name": "Portable Mini Sealing Machine",
    "sub": "Handheld Heat Sealer for Plastic Bags, Snack Packets, Chips & Food Storage | Rechargeable USB Seal & Cutter for Airtight Freshness (White)",
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
      }
    ],
    "colors": [],
    "description": "About this item\n2-in-1 Seal & Cut Function – Quickly seals and cuts plastic packaging to preserve freshness and reduce food waste.\nCordless & Rechargeable – Comes with USB charging cable for wireless, mess-free use anywhere.\nPerfect for All Bag Types – Works on snack packets, plastic pouches, foil bags, and other kitchen packaging.\nMagnetic & Compact Design – Attaches easily to refrigerators or metal surfaces for handy access.\nSafe & User-Friendly – One-button operation with built-in safety lock to prevent accidental burns.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 29,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FKYNNVLN",
    "boughtInPastMonth": 1500
  },
  {
    "asin": "B0FM7LGD47",
    "id": "prod_amz_B0FM7LGD47",
    "name": "Self Adhesive Wall Mount Storage Basket Rack",
    "sub": "Multipurpose Bathroom & Kitchen Organizer Shelf | No Drill Strong Adhesive Plastic Storage Rack, 2-Pack (White)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nNo Drill Installation – Comes with a strong adhesive backing for easy wall mounting without damaging surfaces.\nDurable & Lightweight – Made from premium-quality plastic that is sturdy, rustproof, and easy to clean.\nMultipurpose Use – Perfect for holding toiletries, kitchen condiments, cleaning supplies, and more.\nVentilated Design – Slotted base allows for quick water drainage, keeping stored items dry and hygienic.\nSpace-Saving Storage – Helps organize small spaces efficiently, suitable for bathrooms, kitchens, and utility rooms.\nModern Minimalist Look – Sleek white finish complements any home interior.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 26,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FM7LGD47",
    "boughtInPastMonth": 1000
  },
  {
    "asin": "B0FNN2D5CD",
    "id": "prod_amz_B0FNN2D5CD",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve",
    "sub": "Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (Blue, Pack of 1)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 72,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN2D5CD",
    "boughtInPastMonth": 300
  },
  {
    "asin": "B0FNN4WQNQ",
    "id": "prod_amz_B0FNN4WQNQ",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve",
    "sub": "Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (Blue, Pack of 2)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 66,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN4WQNQ",
    "boughtInPastMonth": 400
  },
  {
    "asin": "B0FNN66P5B",
    "id": "prod_amz_B0FNN66P5B",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve",
    "sub": "Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (Green, Pack of 1)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 20,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN66P5B",
    "boughtInPastMonth": 400
  },
  {
    "asin": "B0FNN49PMX",
    "id": "prod_amz_B0FNN49PMX",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve",
    "sub": "Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (Green, Pack of 2)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 54,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN49PMX",
    "boughtInPastMonth": 300
  },
  {
    "asin": "B0FNN6BRJD",
    "id": "prod_amz_B0FNN6BRJD",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve",
    "sub": "Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (PInk, Pack of 1)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 22,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN6BRJD",
    "boughtInPastMonth": 500
  },
  {
    "asin": "B0FNN7W66B",
    "id": "prod_amz_B0FNN7W66B",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve",
    "sub": "Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (PInk, Pack of 2)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 50,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN7W66B",
    "boughtInPastMonth": 500
  },
  {
    "asin": "B0FNN7Q41H",
    "id": "prod_amz_B0FNN7Q41H",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve",
    "sub": "Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (Yellow, Pack of 1)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 23,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN7Q41H",
    "boughtInPastMonth": 200
  },
  {
    "asin": "B0FNN672TC",
    "id": "prod_amz_B0FNN672TC",
    "name": "400ml Glass Water Bottle with Silicone Protective Sleeve",
    "sub": "Leak Proof | BPA Free | Travel Friendly Reusable Water Bottle with Airtight Lid for Office, Gym & Home (Yellow, Pack of 2)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nPremium Glass Liner with Silicone Cover – Durable borosilicate glass with a non-slip silicone sleeve for protection and grip.\nLeak-Proof & Airtight Lid – Designed with a secure seal to prevent spills in your bag while traveling or working out.\nSafe & BPA-Free – Made from food-grade, non-toxic materials for healthy, eco-friendly hydration.\nCompact 400ml Capacity – Ideal size for office, gym, yoga, cycling, or everyday carry without bulk.\nReusable & Eco-Friendly – A sustainable alternative to single-use plastic bottles, reducing waste and promoting green living.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 80,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FNN672TC",
    "boughtInPastMonth": 70
  },
  {
    "asin": "B0FJLQTH6X",
    "id": "prod_amz_B0FJLQTH6X",
    "name": "Manual Food Cutter for Vegetables & Fruits",
    "sub": "Push Style with Stainless Steel Blades | Onion, Tomato, Garlic, Chilli Slicer | Compact Kitchen Tool (Green)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nQuick & Uniform Chopping – Spring-action push mechanism with stainless steel blades chops vegetables, fruits, and herbs effortlessly in seconds.\nManual & Hassle-Free – No electricity needed; perfect for quick daily use, travel, outdoor cooking, or small kitchens.\nDurable Build Quality – Made from premium BPA-free plastic and rust-resistant stainless steel for long-term use.\nTransparent Storage Container – Built-in chopping bowl collects ingredients and lets you monitor chopping size easily.\nCompact & Easy to Store – Lightweight and space-saving design fits into any drawer or kitchen shelf.\nMulti-Use Tool – Ideal for chopping onions, tomatoes, chilies, garlic, carrots, cucumber, dry fruits, and more.\nEasy to Clean – All parts detach easily for a quick rinse; low-maintenance and hygiene-friendly.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 55,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FJLQTH6X",
    "boughtInPastMonth": 800
  },
  {
    "asin": "B0FJLT87Q2",
    "id": "prod_amz_B0FJLT87Q2",
    "name": "Manual Food Cutter for Vegetables & Fruits",
    "sub": "Push Style with Stainless Steel Blades | Onion, Tomato, Garlic, Chilli Slicer | Compact Kitchen Tool (Purple)",
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
      }
    ],
    "colors": [],
    "description": "About this item\nQuick & Uniform Chopping – Spring-action push mechanism with stainless steel blades chops vegetables, fruits, and herbs effortlessly in seconds.\nManual & Hassle-Free – No electricity needed; perfect for quick daily use, travel, outdoor cooking, or small kitchens.\nDurable Build Quality – Made from premium BPA-free plastic and rust-resistant stainless steel for long-term use.\nTransparent Storage Container – Built-in chopping bowl collects ingredients and lets you monitor chopping size easily.\nCompact & Easy to Store – Lightweight and space-saving design fits into any drawer or kitchen shelf.\nMulti-Use Tool – Ideal for chopping onions, tomatoes, chilies, garlic, carrots, cucumber, dry fruits, and more.\nEasy to Clean – All parts detach easily for a quick rinse; low-maintenance and hygiene-friendly.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 41,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FJLT87Q2",
    "boughtInPastMonth": 1500
  },
  {
    "asin": "B0GGH7RQGL",
    "id": "prod_amz_B0GGH7RQGL",
    "name": "Bird Figurine Decorative Sculpture",
    "sub": "Elegant Bird Statue for Home Décor, Living Room, Office, Shelf & Tabletop Accent, Modern Artistic Collectible Gift",
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
      }
    ],
    "colors": [],
    "description": "About this item\nElegant Artistic Design – The IESVRA Bird Figurine features a refined, modern silhouette that adds a touch of sophistication and calm to any living space, blending seamlessly with contemporary, minimalist, or classic décor styles.\nPremium Craftsmanship – Carefully crafted with attention to detail, this decorative bird sculpture showcases smooth finishes and balanced proportions, making it a timeless décor accent for shelves, desks, mantels, and tabletops.\nVersatile Home Décor Accent – Perfect for living rooms, bedrooms, offices, studies, entryways, or coffee tables, this bird figurine enhances your interior with subtle charm and artistic character.\nThoughtful Gift Choice – An ideal gift for housewarmings, birthdays, anniversaries, holidays, or special occasions, especially for bird lovers, art enthusiasts, and home décor collectors.\nCompact & Display-Ready – Designed to be lightweight and easy to place, this figurine instantly elevates your space without overpowering it, making it suitable for both small and large displays.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 89,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GGH7RQGL",
    "boughtInPastMonth": 800
  },
  {
    "asin": "B0FS831QLM",
    "id": "prod_amz_B0FS831QLM",
    "name": "Menstrual Heating Pad with 4 Massage Modes",
    "sub": "Digital Display, Ultra-quiet Operation, Pink",
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
      }
    ],
    "colors": [],
    "description": "About this item\nVERSATILE HEATING: Features targeted heating for uterus, stomach, waist, and abdomen areas with digital temperature control and display\nMASSAGE MODES: 4 distinct vibration massage patterns provide customised comfort with ultra-quiet operation under 20dB\nCOMFORT DESIGN: Soft, ergonomic shape with adjustable fit and premium materials for maximum comfort during menstrual cycles\nSMART FEATURES: LED digital display shows temperature settings clearly, with easy-to-use controls for precise heat adjustment\nPORTABLE SOLUTION: USB-powered design with compact, lightweight construction makes it perfect for home, office, or travel use\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 81,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0FS831QLM",
    "boughtInPastMonth": 800
  },
  {
    "asin": "B0GKVPGWDV",
    "id": "prod_amz_B0GKVPGWDV",
    "name": "1 Litre Oil Dispenser Bottle for Kitchen",
    "sub": "Leak Proof Oil Pourer Bottle with Spout | Transparent Cooking Oil Container for Olive Oil, Vinegar & Sauce Storage",
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
      }
    ],
    "colors": [],
    "description": "About this item\nLeak Proof & Mess Free Pouring Specially designed anti-drip pour spout ensures controlled oil flow and prevents messy spills on kitchen counters.\nLarge 1 Litre Capacity Perfect size for daily cooking oil storage including mustard oil, olive oil, sunflower oil and vinegar.\nTransparent Body Design Clear plastic body allows you to easily monitor oil levels, helping you refill at the right time.\nMulti Purpose Kitchen Bottle Ideal for storing cooking oil, vinegar, soy sauce, salad dressing and liquid condiments.\nFood Grade & Durable Material Made from high quality food grade plastic, safe for daily kitchen use and resistant to breakage.\nComfortable Grip Handle – Ergonomic handle provides better control and firm grip while pouring, even with one hand.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 86,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GKVPGWDV",
    "boughtInPastMonth": 500
  },
  {
    "asin": "B0GKVWDYSM",
    "id": "prod_amz_B0GKVWDYSM",
    "name": "1 Litre Oil Dispenser Bottle for Kitchen (Pack of 2)",
    "sub": "Leak Proof Plastic Cooking Oil Dispenser with Easy Pour Spout | Oil Container & Oil Bottle for Kitchen Use",
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
      }
    ],
    "colors": [],
    "description": "About this item\nLeak Proof & Spill-Free Design – Equipped with a secure lid and tight seal to prevent leakage, ensuring clean and mess-free pouring every time.\nHigh-Quality Food-Grade Plastic – Made from durable, safe, and odor-free material that maintains the purity and freshness of stored cooking oil.\nSmooth & Controlled Pouring Spout – Specially designed spout allows easy and accurate pouring without dripping or wasting oil.\nSpacious 1 Litre Capacity – Ideal for daily kitchen use, reducing the need for frequent refilling and offering convenient oil storage.\nTransparent Body for Easy Monitoring – Clear bottle design helps you quickly check oil levels and refill when required.\nComfortable Grip Handle – Ergonomic handle provides better control and firm grip while pouring, even with one hand.\n› See more product details",
    "isBestSeller": false,
    "rating": 4.5,
    "reviewsCount": 14,
    "status": "success",
    "url": "https://www.amazon.in/dp/B0GKVWDYSM",
    "boughtInPastMonth": 500
  },
  {
    "id": "prod_ncert_pcmb_11",
    "name": "NCERT PCMB Class 11 Complete Textbook Set (Session 2026-27)",
    "sub": "Physics (Part 1 & 2), Chemistry (Part 1 & 2), Mathematics, Biology | CBSE Class 11 Set",
    "price": 1199,
    "mrp": 1499,
    "categories": [
      "Books & Stationery"
    ],
    "image": "/products/books/ncert_pcmb_11th_set_full_edited_26-27_(1).png",
    "gallery": [
      {
        "id": "med_ncert_pcmb_11_1",
        "type": "image",
        "url": "/products/books/ncert_pcmb_11th_set_full_edited_26-27_(1).png"
      },
      {
        "id": "med_ncert_pcmb_11_2",
        "type": "image",
        "url": "/products/books/pcme_class_11th_set_book.jpeg"
      }
    ],
    "colors": [],
    "description": "Comprehensive NCERT textbook combo pack for Class 11 Science stream (PCMB). Includes Physics (Part 1 & 2), Chemistry (Part 1 & 2), Mathematics, and Biology. Fully updated as per the latest CBSE rationalized curriculum 2026-2027.",
    "isBestSeller": true,
    "rating": 4.9,
    "reviewsCount": 38,
    "boughtInPastMonth": 1200,
    "stock": 50
  },
  {
    "id": "prod_ncert_pcm_11",
    "name": "NCERT PCM Class 11 Complete Textbook Set (Session 2026-27)",
    "sub": "Physics (Part 1 & 2), Chemistry (Part 1 & 2), Mathematics | CBSE Class 11 Set",
    "price": 999,
    "mrp": 1299,
    "categories": [
      "Books & Stationery"
    ],
    "image": "/products/books/ncert_pcm_set_full_edited_26-27.png",
    "gallery": [
      {
        "id": "med_ncert_pcm_11_1",
        "type": "image",
        "url": "/products/books/ncert_pcm_set_full_edited_26-27.png"
      },
      {
        "id": "med_ncert_pcm_11_2",
        "type": "image",
        "url": "/products/books/ncert_pcm_set_full_edited_26-27_(1).png"
      },
      {
        "id": "med_ncert_pcm_11_3",
        "type": "image",
        "url": "/products/books/ncert_pcm_set_full_edited_26-27_(2).png"
      },
      {
        "id": "med_ncert_pcm_11_4",
        "type": "image",
        "url": "/products/books/pcm_set_11_and_12th.jpeg"
      }
    ],
    "colors": [],
    "description": "Complete NCERT textbook set for CBSE Class 11 PCM students. Contains latest editions of Physics Parts 1 & 2, Chemistry Parts 1 & 2, and Mathematics textbook.",
    "isBestSeller": true,
    "rating": 4.8,
    "reviewsCount": 42,
    "boughtInPastMonth": 950,
    "stock": 60
  },
  {
    "id": "prod_ncert_pcm_12",
    "name": "NCERT PCM Class 12 Complete Textbook Set",
    "sub": "Physics (Part 1 & 2), Chemistry (Part 1 & 2), Mathematics (Part 1 & 2) | CBSE Class 12",
    "price": 1049,
    "mrp": 1399,
    "categories": [
      "Books & Stationery"
    ],
    "image": "/products/books/ncert_pcm_class_12th.jpeg",
    "gallery": [
      {
        "id": "med_ncert_pcm_12_1",
        "type": "image",
        "url": "/products/books/ncert_pcm_class_12th.jpeg"
      },
      {
        "id": "med_ncert_pcm_12_2",
        "type": "image",
        "url": "/products/books/pcm_class_12th.jpeg"
      },
      {
        "id": "med_ncert_pcm_12_3",
        "type": "image",
        "url": "/products/books/pcm_set_11_and_12th.jpeg"
      }
    ],
    "colors": [],
    "description": "Essential NCERT combo bundle for CBSE Class 12 PCM students. Includes standard textbooks for Physics Parts 1 & 2, Chemistry Parts 1 & 2, and Mathematics Parts 1 & 2.",
    "isBestSeller": true,
    "rating": 4.9,
    "reviewsCount": 65,
    "boughtInPastMonth": 1400,
    "stock": 75
  },
  {
    "id": "prod_ncert_pcb_11_12_combo",
    "name": "NCERT PCB Class 11 & 12 Mega Combo Set",
    "sub": "Complete Physics, Chemistry & Biology Textbooks for NEET & CBSE Class 11 & 12",
    "price": 1899,
    "mrp": 2499,
    "categories": [
      "Books & Stationery"
    ],
    "image": "/products/books/pcb_class_11_and_12_combo.jpeg",
    "gallery": [
      {
        "id": "med_ncert_pcb_combo_1",
        "type": "image",
        "url": "/products/books/pcb_class_11_and_12_combo.jpeg"
      },
      {
        "id": "med_ncert_pcb_combo_2",
        "type": "image",
        "url": "/products/books/pcb_11_and_12_combo.jpeg"
      },
      {
        "id": "med_ncert_pcb_combo_3",
        "type": "image",
        "url": "/products/books/pcb_class_11_and_12th_combo.jpeg"
      }
    ],
    "colors": [],
    "description": "All-in-one comprehensive NCERT PCB master collection covering Class 11 and Class 12 Physics, Chemistry, and Biology. Perfect for CBSE Board exams and NEET preparation.",
    "isBestSeller": true,
    "rating": 5,
    "reviewsCount": 89,
    "boughtInPastMonth": 2100,
    "stock": 40
  },
  {
    "id": "prod_ncert_pcb_12",
    "name": "NCERT PCB Class 12 Complete Textbook Set",
    "sub": "Physics (Part 1 & 2), Chemistry (Part 1 & 2), Biology | CBSE Class 12 & NEET",
    "price": 999,
    "mrp": 1299,
    "categories": [
      "Books & Stationery"
    ],
    "image": "/products/books/ncert_pcb_class_12th.jpeg",
    "gallery": [
      {
        "id": "med_ncert_pcb_12_1",
        "type": "image",
        "url": "/products/books/ncert_pcb_class_12th.jpeg"
      },
      {
        "id": "med_ncert_pcb_12_2",
        "type": "image",
        "url": "/products/books/ncert_pcb_class_12_set.jpeg"
      },
      {
        "id": "med_ncert_pcb_12_3",
        "type": "image",
        "url": "/products/books/ncert_pcb_class_12th_with_phone_no_remove.jpeg"
      },
      {
        "id": "med_ncert_pcb_12_4",
        "type": "image",
        "url": "/products/books/pcb_class_12th.jpeg"
      },
      {
        "id": "med_ncert_pcb_12_5",
        "type": "image",
        "url": "/products/books/pcb_class_12th.jpg.jpeg"
      }
    ],
    "colors": [],
    "description": "Full NCERT PCB textbook set for Class 12 students. Includes Physics Parts 1 & 2, Chemistry Parts 1 & 2, and Biology. Highly recommended for CBSE Boards and NEET UG.",
    "isBestSeller": false,
    "rating": 4.8,
    "reviewsCount": 52,
    "boughtInPastMonth": 880,
    "stock": 55
  },
  {
    "id": "prod_ncert_pcmb_12",
    "name": "NCERT PCMB Class 12 Complete Textbook Set",
    "sub": "Physics (1 & 2), Chemistry (1 & 2), Mathematics (1 & 2), Biology | CBSE Class 12",
    "price": 1249,
    "mrp": 1599,
    "categories": [
      "Books & Stationery"
    ],
    "image": "/products/books/pcmb_class_12th_set.jpeg",
    "gallery": [
      {
        "id": "med_ncert_pcmb_12_1",
        "type": "image",
        "url": "/products/books/pcmb_class_12th_set.jpeg"
      }
    ],
    "colors": [],
    "description": "Complete PCMB bundle for Class 12 CBSE students studying both Mathematics and Biology along with Physics and Chemistry.",
    "isBestSeller": false,
    "rating": 4.7,
    "reviewsCount": 29,
    "boughtInPastMonth": 420,
    "stock": 35
  },
  {
    "id": "prod_ncert_pcmbe_12",
    "name": "NCERT PCMBE Class 12 Complete Set with English Core",
    "sub": "Physics, Chemistry, Mathematics, Biology & English (Flamingo & Vistas) | CBSE Class 12",
    "price": 1399,
    "mrp": 1799,
    "categories": [
      "Books & Stationery"
    ],
    "image": "/products/books/ncert_pcmbe_class_12th.jpeg",
    "gallery": [
      {
        "id": "med_ncert_pcmbe_12_1",
        "type": "image",
        "url": "/products/books/ncert_pcmbe_class_12th.jpeg"
      }
    ],
    "colors": [],
    "description": "Complete 5-subject PCMBE textbook package for Class 12 CBSE board exams including Physics, Chemistry, Maths, Biology, and English textbooks.",
    "isBestSeller": false,
    "rating": 4.9,
    "reviewsCount": 31,
    "boughtInPastMonth": 390,
    "stock": 30
  },
  {
    "id": "prod_ncert_pcme_12",
    "name": "NCERT PCME Class 12 Complete Set with English Core",
    "sub": "Physics (1 & 2), Chemistry (1 & 2), Mathematics (1 & 2) & English Core | CBSE Class 12",
    "price": 1199,
    "mrp": 1499,
    "categories": [
      "Books & Stationery"
    ],
    "image": "/products/books/ncert_pcme_class_12th.jpeg",
    "gallery": [
      {
        "id": "med_ncert_pcme_12_1",
        "type": "image",
        "url": "/products/books/ncert_pcme_class_12th.jpeg"
      },
      {
        "id": "med_ncert_pcme_12_2",
        "type": "image",
        "url": "/products/books/pcme_class_12th_set.jpeg"
      }
    ],
    "colors": [],
    "description": "Comprehensive PCME package for CBSE Class 12 non-medical students including Physics, Chemistry, Mathematics, and English Core textbooks.",
    "isBestSeller": false,
    "rating": 4.8,
    "reviewsCount": 24,
    "boughtInPastMonth": 310,
    "stock": 45
  },
  {
    "id": "prod_ncert_pcme_11",
    "name": "NCERT PCME Class 11 Complete Set with English",
    "sub": "Physics (1 & 2), Chemistry (1 & 2), Mathematics & English Core | CBSE Class 11",
    "price": 1099,
    "mrp": 1399,
    "categories": [
      "Books & Stationery"
    ],
    "image": "/products/books/pcme_class_11th_set_book.jpeg",
    "gallery": [
      {
        "id": "med_ncert_pcme_11_1",
        "type": "image",
        "url": "/products/books/pcme_class_11th_set_book.jpeg"
      }
    ],
    "colors": [],
    "description": "Complete PCME combo textbook pack for CBSE Class 11 students with Physics, Chemistry, Mathematics, and English.",
    "isBestSeller": false,
    "rating": 4.7,
    "reviewsCount": 19,
    "boughtInPastMonth": 280,
    "stock": 40
  },
  {
    "id": "prod_ncert_chemistry_11_12_combo",
    "name": "NCERT Chemistry Class 11 & 12 Complete Combo Set (4 Books)",
    "sub": "Class 11 Chemistry (Part 1 & 2) + Class 12 Chemistry (Part 1 & 2) | Latest 2026-27 Edition",
    "price": 749,
    "mrp": 999,
    "categories": [
      "Books & Stationery"
    ],
    "image": "/products/books/ncert_chemistry_1&2_11_&_12_set_full_edited_26-27.jpg.jpeg",
    "gallery": [
      {
        "id": "med_ncert_chem_combo_1",
        "type": "image",
        "url": "/products/books/ncert_chemistry_1&2_11_&_12_set_full_edited_26-27.jpg.jpeg"
      },
      {
        "id": "med_ncert_chem_combo_2",
        "type": "image",
        "url": "/products/books/ncert_chemistry_1&2_11_&_12_set_full_edited_26-27_(1).jpg.jpeg"
      },
      {
        "id": "med_ncert_chem_combo_3",
        "type": "image",
        "url": "/products/books/chemistry_11_and_12.jpeg"
      },
      {
        "id": "med_ncert_chem_combo_4",
        "type": "image",
        "url": "/products/books/chemistry_11_and_12th.jpeg"
      },
      {
        "id": "med_ncert_chem_combo_5",
        "type": "image",
        "url": "/products/books/ncert_chemistry_1&2_set_full_edited_26-27.png"
      },
      {
        "id": "med_ncert_chem_combo_6",
        "type": "image",
        "url": "/products/books/ncert_chemistry_1&2_set_full_edited_26-27.jpg.jpeg"
      }
    ],
    "colors": [],
    "description": "Full 4-book Chemistry set for Class 11 & 12 CBSE & NEET aspirants. Includes Class 11 (Part 1 & 2) and Class 12 (Part 1 & 2) Chemistry textbooks.",
    "isBestSeller": true,
    "rating": 4.9,
    "reviewsCount": 77,
    "boughtInPastMonth": 1600,
    "stock": 80
  },
  {
    "id": "prod_ncert_chemistry_12",
    "name": "NCERT Chemistry Class 12 Textbook Set (Part 1 & Part 2)",
    "sub": "Official NCERT Chemistry Textbooks for CBSE Class 12 Board Exam & NEET",
    "price": 399,
    "mrp": 550,
    "categories": [
      "Books & Stationery"
    ],
    "image": "/products/books/chemistry_12th.jpeg",
    "gallery": [
      {
        "id": "med_ncert_chem_12_1",
        "type": "image",
        "url": "/products/books/chemistry_12th.jpeg"
      },
      {
        "id": "med_ncert_chem_12_2",
        "type": "image",
        "url": "/products/books/ncert_chemistry_1&2_set_full_edited_26-27.png"
      }
    ],
    "colors": [],
    "description": "Official NCERT Class 12 Chemistry Part 1 & Part 2 textbooks. Essential for CBSE Class 12 Chemistry preparation and competitive entrance exams.",
    "isBestSeller": false,
    "rating": 4.8,
    "reviewsCount": 35,
    "boughtInPastMonth": 650,
    "stock": 70
  },
  {
    "id": "prod_ncert_physics_11_12_combo",
    "name": "NCERT Physics Class 11 & 12 Complete Combo Set (4 Books)",
    "sub": "Class 11 Physics (Part 1 & 2) + Class 12 Physics (Part 1 & 2) | Latest 2026-27 Edition",
    "price": 799,
    "mrp": 1050,
    "categories": [
      "Books & Stationery"
    ],
    "image": "/products/books/ncert_physics_1&2_11_&_12_set_full_edited_26-27.png",
    "gallery": [
      {
        "id": "med_ncert_phy_combo_1",
        "type": "image",
        "url": "/products/books/ncert_physics_1&2_11_&_12_set_full_edited_26-27.png"
      },
      {
        "id": "med_ncert_phy_combo_2",
        "type": "image",
        "url": "/products/books/physics_class_12th.jpeg"
      }
    ],
    "colors": [],
    "description": "Complete 4-book Physics package containing Class 11 Physics Parts 1 & 2 and Class 12 Physics Parts 1 & 2 for CBSE Boards, JEE Main, and NEET.",
    "isBestSeller": true,
    "rating": 4.9,
    "reviewsCount": 62,
    "boughtInPastMonth": 1350,
    "stock": 65
  },
  {
    "id": "prod_ncert_physics_12",
    "name": "NCERT Physics Class 12 Textbook Set (Part 1 & Part 2)",
    "sub": "Official NCERT Physics Textbooks for CBSE Class 12 Board Exam, JEE & NEET",
    "price": 429,
    "mrp": 580,
    "categories": [
      "Books & Stationery"
    ],
    "image": "/products/books/physics_class_12th.jpeg",
    "gallery": [
      {
        "id": "med_ncert_phy_12_1",
        "type": "image",
        "url": "/products/books/physics_class_12th.jpeg"
      },
      {
        "id": "med_ncert_phy_12_2",
        "type": "image",
        "url": "/products/books/ncert_physics_1&2_11_&_12_set_full_edited_26-27.png"
      }
    ],
    "colors": [],
    "description": "Official NCERT Class 12 Physics Part 1 & Part 2 textbooks for CBSE Class 12 Board examination and national entrance tests.",
    "isBestSeller": false,
    "rating": 4.8,
    "reviewsCount": 41,
    "boughtInPastMonth": 590,
    "stock": 90
  }
];

function triggerProductsChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ishvara_products_changed"));
  }
}

function safeSetLocalProducts(key: string, data: any) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("[products] localStorage write failed or quota exceeded:", e);
  }
}

export function useProducts() {
  // The browser must start with the same catalog used by SSR. Cached/global
  // products are applied after hydration to avoid stale prices/text causing a
  // full React hydration failure.
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("ishvara_products_v12");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p: any) => normalizeProduct({
              ...p,
              categories: p.categories ? p.categories : (p.category ? [p.category] : ["Uncategorized"]),
            }));
          }
        }
      } catch {}
    }
    return initialProducts.map(normalizeProduct);
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Immediately read cached local catalog
    const stored = localStorage.getItem("ishvara_products_v12");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed.map((p: any) => normalizeProduct({
            ...p,
            categories: p.categories ? p.categories : (p.category ? [p.category] : ["Uncategorized"]),
          })));
        }
      } catch {}
    }

    // 2. Fetch live data with no-store to bypass any proxy / CDN / browser cache
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((globalList) => {
        if (Array.isArray(globalList) && globalList.length > 0) {
          const normalizedGlobal = globalList.map((p: Product) => normalizeProduct(p));
          setProducts(normalizedGlobal);
          safeSetLocalProducts("ishvara_products_v12", normalizedGlobal);
        } else {
          fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(initialProducts),
          }).catch(console.error);
        }
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to fetch global products:", err);
        setIsLoaded(true);
      });

    const handleUpdate = () => {
      const latest = localStorage.getItem("ishvara_products_v12");
      if (latest) {
        try {
          const parsed = JSON.parse(latest);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed.map((p: any) => normalizeProduct({
              ...p,
              categories: p.categories ? p.categories : (p.category ? [p.category] : ["Uncategorized"]),
            })));
          }
        } catch {}
      }
    };

    window.addEventListener("ishvara_products_changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("ishvara_products_changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const persistProductMutation = async (payload: unknown) => {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      throw new Error(result.error || `Product save failed (${response.status})`);
    }
    return result;
  };

  const addProduct = async (p: Product) => {
    const updated = [p, ...products];
    setProducts(updated);
    safeSetLocalProducts("ishvara_products_v12", updated);
    triggerProductsChange();

    try {
      return await persistProductMutation({ action: "upsert", product: p });
    } catch (error) {
      setProducts(products);
      safeSetLocalProducts("ishvara_products_v12", products);
      triggerProductsChange();
      throw error;
    }
  };

  const updateProduct = async (p: Product) => {
    const updated = products.map((prod) => (prod.id === p.id ? p : prod));
    setProducts(updated);
    safeSetLocalProducts("ishvara_products_v12", updated);
    triggerProductsChange();

    try {
      return await persistProductMutation({ action: "upsert", product: p });
    } catch (error) {
      setProducts(products);
      safeSetLocalProducts("ishvara_products_v12", products);
      triggerProductsChange();
      throw error;
    }
  };

  const bulkUpdateProducts = (updatedProducts: Product[]) => {
    let current = [...products];
    for (const p of updatedProducts) {
      current = current.map((prod) => (prod.id === p.id ? p : prod));
    }
    setProducts(current);
    safeSetLocalProducts("ishvara_products_v12", current);
    triggerProductsChange();

    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(current),
    }).catch(console.error);
  };

  const deleteProduct = async (id: string) => {
    const updated = products.filter((prod) => prod.id !== id);
    setProducts(updated);
    safeSetLocalProducts("ishvara_products_v12", updated);
    triggerProductsChange();

    try {
      return await persistProductMutation({ action: "delete", id });
    } catch (error) {
      setProducts(products);
      safeSetLocalProducts("ishvara_products_v12", products);
      triggerProductsChange();
      throw error;
    }
  };

  return {
    products,
    isLoaded,
    addProduct,
    updateProduct,
    bulkUpdateProducts,
    deleteProduct,
    topDealsList: products.slice(0, 6),
    bestSellersList: (() => {
      const best = products.filter((p) => p.isBestSeller);
      const remaining = products.filter((p) => !p.isBestSeller);
      return [...best, ...remaining].slice(0, 10);
    })(),
    newArrivalsList: products.slice(12, 16),
  };
}
