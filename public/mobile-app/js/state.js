(function() {
  // Default fallback products and categories (synced with src/lib/products.ts default values)
  const initialCategories = [
    { name: "Massagers", image: "/products/prod_8_1.jpg" },
    { name: "Mobile Accessories", image: "/products/prod_3_1.jpeg" },
    { name: "Beauty & Personal Care", image: "/products/prod_5_1.jpeg" },
    { name: "Home & Kitchen", image: "/products/prod_1_1.jpg" },
    { name: "Bags & Travel", image: "/products/prod_9_1.jpeg" },
    { name: "Drinkware", image: "/products/prod_2_1.jpg" },
    { name: "Daily Essentials", image: "/products/prod_4_1.jpeg" }
  ];

  const initialProducts = [
    {
      id: "prod_drive_1",
      name: "1pis set Plastic Square 7 Sections Multipurpose",
      sub: "Premium Quality Organiser",
      price: 89,
      mrp: 599,
      categories: ["Home & Kitchen"],
      image: "/products/prod_1_1.jpg",
      colors: [],
      description: "Imported premium product for all your household organization needs. Organize drawers, cosmetics, or tools.",
      isBestSeller: true,
      rating: 4.7,
      reviewsCount: 3
    },
    {
      id: "prod_drive_2",
      name: "3 PC MOTIVATION BOTTLE",
      sub: "Premium Quality Drinkware",
      price: 499,
      mrp: 1499,
      categories: ["Drinkware"],
      image: "/products/prod_2_1.jpg",
      colors: ["Midnight Black", "Blush Pink", "Forest Green"],
      description: "Imported premium water bottles. Comes as a set of 3 with motivational quotes and time markers to stay hydrated all day.",
      isBestSeller: true,
      rating: 4.7,
      reviewsCount: 3
    },
    {
      id: "prod_drive_3",
      name: "CYOMI 611 5 W Bluetooth Speaker",
      sub: "Premium Quality Audio",
      price: 299,
      mrp: 999,
      categories: ["Mobile Accessories"],
      image: "/products/prod_3_1.jpeg",
      colors: ["Midnight Black", "Active Red", "Navy Blue"],
      description: "High bass portable wireless Bluetooth speaker. Durable build with crystal clear sound and up to 5 hours playback.",
      isBestSeller: true,
      rating: 4.3,
      reviewsCount: 3
    },
    {
      id: "prod_drive_4",
      name: "Solar Interaction Wall Lamp",
      sub: "Premium Quality Lighting",
      price: 299,
      mrp: 1299,
      categories: ["Daily Essentials"],
      image: "/products/prod_4_1.jpeg",
      colors: ["Stealth Black"],
      description: "Outdoor motion sensor solar light. Waterproof, heat-resistant, and perfect for security and pathway lighting.",
      isBestSeller: true,
      rating: 4.7,
      reviewsCount: 3
    },
    {
      id: "prod_drive_5",
      name: "HTC AT 509 Beard Trimmer",
      sub: "Premium Quality Grooming",
      price: 399,
      mrp: 1599,
      categories: ["Beauty & Personal Care"],
      image: "/products/prod_5_1.jpeg",
      colors: ["Matte Black", "Brushed Silver"],
      description: "Ergonomic beard trimmer with sharp stainless steel blades, multiple length settings, and rechargeable battery for smooth grooming.",
      isBestSeller: true,
      rating: 4.7,
      reviewsCount: 3
    },
    {
      id: "prod_drive_6",
      name: "Jen Deluxe Green Fruit & Veg. Hand Juicer",
      sub: "Premium Quality Juicer",
      price: 299,
      mrp: 1799,
      categories: ["Home & Kitchen"],
      image: "/products/prod_6_1.jpg",
      colors: ["Mint Green"],
      description: "Manual juicer for fresh and healthy juices. Perfect for citrus fruits, soft veggies, grapes, and wheatgrass. Easy cleanup.",
      isBestSeller: true,
      rating: 4.5,
      reviewsCount: 2
    },
    {
      id: "prod_drive_7",
      name: "MRK Push Chopper",
      sub: "Premium Quality Chopper",
      price: 89,
      mrp: 499,
      categories: ["Home & Kitchen"],
      image: "/products/prod_7_1.jpeg",
      colors: [],
      description: "Stainless steel blades push chopper for easy dicing of onions, garlic, chillies, and other vegetables. Highly durable design.",
      isBestSeller: false,
      rating: 4.5,
      reviewsCount: 2
    },
    {
      id: "prod_drive_8",
      name: "Rechargeable Scalp Massager & Body Brush",
      sub: "Premium Wellness Massager",
      price: 799,
      mrp: 2499,
      categories: ["Massagers"],
      image: "/products/prod_8_1.jpg",
      colors: ["Metallic Silver", "Rose Gold"],
      description: "Waterproof electric scalp massager designed for deep relaxation and hair growth stimulation. Features multiple nodes and speed levels.",
      isBestSeller: true,
      rating: 4.7,
      reviewsCount: 3
    },
    {
      id: "prod_drive_9",
      name: "Premium Waterproof Travel Duffle Bag",
      sub: "Bags & Travel",
      price: 899,
      mrp: 2999,
      categories: ["Bags & Travel"],
      image: "/products/prod_9_1.jpeg",
      colors: ["Midnight Black", "Forest Green", "Navy Blue"],
      description: "Durable travel duffle bag with dedicated wet pocket and shoe compartment. Perfect for gym, weekend getaways, and flight carry-on.",
      isBestSeller: false,
      rating: 4.5,
      reviewsCount: 2
    }
  ];

  function getProducts() {
    const stored = localStorage.getItem("ishvara_products_v4");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse products from localstorage", e);
      }
    }
    localStorage.setItem("ishvara_products_v4", JSON.stringify(initialProducts));
    return initialProducts;
  }

  function getCategories() {
    const stored = localStorage.getItem("ishvara_categories_v2");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse categories from localstorage", e);
      }
    }
    localStorage.setItem("ishvara_categories_v2", JSON.stringify(initialCategories));
    return initialCategories;
  }

  function getCart() {
    const stored = localStorage.getItem("ishvara_cart");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse cart from localstorage", e);
      }
    }
    return [];
  }

  function saveCart(cart) {
    localStorage.setItem("ishvara_cart", JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("ishvara_cart_changed"));
  }

  function addToCart(productId, color = "Standard", qty = 1) {
    const cart = getCart();
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId && item.color === color);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        sub: product.sub || "",
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        category: product.categories ? product.categories[0] : "Uncategorized",
        color: color,
        quantity: qty
      });
    }
    saveCart(cart);
  }

  function removeFromCart(productId, color = "Standard") {
    let cart = getCart();
    cart = cart.filter(item => !(item.id === productId && item.color === color));
    saveCart(cart);
  }

  function updateCartQty(productId, color = "Standard", change = 1) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId && item.color === color);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(productId, color);
    } else {
      saveCart(cart);
    }
  }

  // Expose variables globally to bypass CORS module restrictions in WebView
  window.AppState = {
    getProducts,
    getCategories,
    getCart,
    saveCart,
    addToCart,
    removeFromCart,
    updateCartQty
  };
})();
