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

export function getCategories(): Category[] {
  if (typeof window === "undefined") return initialCategories;
  const stored = localStorage.getItem("ishvara_categories_v2");
  return stored ? JSON.parse(stored) : initialCategories;
}

export function saveCategories(cats: Category[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("ishvara_categories_v2", JSON.stringify(cats));
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
          setCats(globalCats);
          localStorage.setItem("ishvara_categories_v2", JSON.stringify(globalCats));
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
    "categories": ["Home & Kitchen"],
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
    "categories": ["Drinkware"],
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
    "colors": ["Midnight Black", "Blush Pink", "Forest Green"],
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
    "categories": ["Mobile Accessories"],
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
    "colors": ["Midnight Black", "Active Red", "Navy Blue"],
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
    "categories": ["Daily Essentials"],
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
    "colors": ["Stealth Black"],
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
    "categories": ["Beauty & Personal Care"],
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
    "colors": ["Matte Black", "Brushed Silver"],
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
    "categories": ["Home & Kitchen"],
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
    "colors": ["Mint Green"],
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
    "categories": ["Home & Kitchen"],
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
    "isBestSeller": false,
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
    "categories": ["Massagers"],
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
    "colors": ["Metallic Silver", "Rose Gold"],
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
    "categories": ["Bags & Travel"],
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
    "colors": ["Midnight Black", "Forest Green", "Navy Blue"],
    "description": "Durable travel duffle bag with dedicated wet pocket and shoe compartment. Perfect for gym, weekend getaways, and flight carry-on.",
    "isBestSeller": false,
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
    const stored = localStorage.getItem("ishvara_products_v4");
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
          localStorage.setItem("ishvara_products_v4", JSON.stringify(globalList));
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
      const latest = localStorage.getItem("ishvara_products_v4");
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
    localStorage.setItem("ishvara_products_v4", JSON.stringify(updated));
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
    localStorage.setItem("ishvara_products_v4", JSON.stringify(updated));
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
    localStorage.setItem("ishvara_products_v4", JSON.stringify(current));
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
    localStorage.setItem("ishvara_products_v4", JSON.stringify(updated));
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
    bestSellersList: products.filter((p) => p.isBestSeller).slice(0, 6),
    newArrivalsList: products.slice(12, 16),
  };
}

