(function() {
  // Retrieve functions from global AppState to bypass WebView module restrictions
  const { getProducts, getCategories, getCart, addToCart, updateCartQty } = window.AppState;

  // DOM elements
  const categoriesScroll = document.getElementById('categoriesScroll');
  const bestSellersRow = document.getElementById('bestSellersRow');
  const headerCartBadge = document.getElementById('headerCartBadge');
  const bottomCartBadge = document.getElementById('bottomCartBadge');

  // Active state
  let currentOnboardingSlide = 0;
  let activeDetailProductId = null;
  let activeDetailDeliveryType = "express"; // "express" or "standard"

  // Time display updater
  function updateTime() {
    const timeSpan = document.getElementById('statusTime');
    if (timeSpan) {
      const now = new Date();
      timeSpan.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  }

  // ==================== APP LIFECYCLE ====================
  // Color Theme Manager
  function initTheme() {
    const savedTheme = localStorage.getItem('iesvra_mobile_theme');
    const isLight = savedTheme === 'light';
    document.body.classList.toggle('theme-light', isLight);
    
    // Toggle icon display inside buttons
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentlyLight = document.body.classList.contains('theme-light');
        const nextTheme = currentlyLight ? 'dark' : 'light';
        document.body.classList.toggle('theme-light', !currentlyLight);
        localStorage.setItem('iesvra_mobile_theme', nextTheme);
        showToast(`Switched to ${currentlyLight ? 'Dark' : 'Light'} Mode`);
      });
    }
  }

  // Credentials and registration helpers for shared localStorage keys (synced with website)
  const DEFAULT_ADMIN_EMAIL = "arenterprisess409@gmail.com";
  const DEFAULT_ADMIN_PASSWORD = "Iesvra@3104";

  function getRegisteredUsers() {
    try {
      const raw = localStorage.getItem("ishvara_registered_users");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function registerMobileUser(name, email, password) {
    const users = getRegisteredUsers();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === DEFAULT_ADMIN_EMAIL) return false;
    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return false;
    }
    users.push({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: password,
      role: 'user'
    });
    localStorage.setItem("ishvara_registered_users", JSON.stringify(users));
    return true;
  }

  function validateCredentials(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === DEFAULT_ADMIN_EMAIL) {
      const adminPassword = localStorage.getItem("ishvara_admin_password") || DEFAULT_ADMIN_PASSWORD;
      if (password === adminPassword) {
        return { success: true, name: "IESVRA Admin", role: "admin" };
      }
      return { success: false, error: "Incorrect password for system administrator." };
    }

    const users = getRegisteredUsers();
    const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return { success: false, error: "Email address not found. Please sign up." };
    }
    if (user.passwordHash !== password) {
      return { success: false, error: "Incorrect password. Please try again." };
    }
    return { success: true, name: user.name, role: user.role };
  }

  // ==================== APP LIFECYCLE ====================
  function init() {
    updateTime();
    setInterval(updateTime, 30000);

    // Initialize Theme
    initTheme();

    // Sync cart badges
    updateCartBadges();

    // Listen to cart state change events
    window.addEventListener('ishvara_cart_changed', () => {
      updateCartBadges();
      if (document.getElementById('screen-cart').classList.contains('active')) {
        renderCartScreen();
      }
    });

    // Wire bottom navigation tab event listeners
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const tabId = item.getAttribute('data-tab');
        if (tabId) {
          switchTab(tabId);
        }
      });
    });

    // 1. Splash Screen Transition
    setTimeout(() => {
      const splash = document.getElementById('splash');
      if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => {
          splash.style.display = 'none';
          checkNavigationState();
        }, 500);
      }
    }, 2000);
  }

  function updateProfileDisplay() {
    const rawAuth = localStorage.getItem("ishvara_auth");
    const profileName = document.getElementById("profileName");
    const profilePhone = document.getElementById("profilePhone");
    const profileAvatar = document.getElementById("profileAvatar");

    if (rawAuth) {
      try {
        const auth = JSON.parse(rawAuth);
        if (profileName) profileName.textContent = auth.name || "Store User";
        if (profilePhone) profilePhone.textContent = auth.email || "No Email";
        if (profileAvatar) profileAvatar.textContent = (auth.name || "U").substring(0, 1).toUpperCase();
      } catch (e) {
        console.error("Failed to parse auth", e);
      }
    } else {
      if (profileName) profileName.textContent = "Guest User";
      if (profilePhone) profilePhone.textContent = "+91 820 123 4567";
      if (profileAvatar) profileAvatar.textContent = "G";
    }
  }

  function checkNavigationState() {
    const onboardingSeen = localStorage.getItem('iesvra_onboarding_seen');
    const authSession = localStorage.getItem('ishvara_auth');

    if (!onboardingSeen) {
      initOnboarding();
    } else if (!authSession) {
      initLogin();
    } else {
      // User is logged in, update Profile display and switch to Home Screen
      updateProfileDisplay();
      switchTab('home');
    }
  }

  // ==================== SPLASH & ONBOARDING ====================
  function initOnboarding() {
    const onboarding = document.getElementById('onboarding');
    if (onboarding) {
      onboarding.style.display = 'flex';
    }

    const btnNext = document.getElementById('onboardNext');
    const btnSkip = document.getElementById('onboardSkip');

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (currentOnboardingSlide === 0) {
          showOnboardingSlide(1);
        } else {
          completeOnboarding();
        }
      });
    }

    if (btnSkip) {
      btnSkip.addEventListener('click', () => {
        completeOnboarding();
      });
    }
  }

  function showOnboardingSlide(slideIndex) {
    currentOnboardingSlide = slideIndex;
    const slides = document.querySelectorAll('.onboarding-slide');
    const dots = document.querySelectorAll('.onboarding-dots .dot');
    const btnNext = document.getElementById('onboardNext');

    slides.forEach((slide, idx) => {
      slide.style.display = idx === slideIndex ? 'flex' : 'none';
    });

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === slideIndex);
    });

    if (btnNext) {
      btnNext.textContent = slideIndex === 1 ? 'Get Started' : 'Next';
    }
  }

  function completeOnboarding() {
    localStorage.setItem('iesvra_onboarding_seen', 'true');
    const onboarding = document.getElementById('onboarding');
    if (onboarding) {
      onboarding.style.opacity = '0';
      setTimeout(() => {
        onboarding.style.display = 'none';
        initLogin();
      }, 300);
    }
  }

  // ==================== LOGIN / SIGNUP ====================
  let activeAuthTab = 'login'; // 'login' or 'signup'

  window.switchAuthTab = (tab) => {
    activeAuthTab = tab;
    
    // Toggle active tab highlight
    const tabLogin = document.getElementById('tabLogin');
    const tabSignUp = document.getElementById('tabSignUp');
    if (tabLogin && tabSignUp) {
      tabLogin.classList.toggle('active', tab === 'login');
      tabSignUp.classList.toggle('active', tab === 'signup');
    }

    // Toggle fields visibility
    const groupName = document.getElementById('inputGroupName');
    if (groupName) {
      groupName.style.display = tab === 'signup' ? 'flex' : 'none';
    }

    // Toggle headers and buttons text
    const headerTitle = document.querySelector('#loginScreen h2');
    const subtitleText = document.getElementById('authHeaderSubtitle');
    const submitBtn = document.getElementById('loginSubmitBtn');

    if (headerTitle && subtitleText && submitBtn) {
      if (tab === 'login') {
        headerTitle.textContent = "Welcome Back!";
        subtitleText.textContent = "Login to continue shopping";
        submitBtn.textContent = "Login";
      } else {
        headerTitle.textContent = "Create Account";
        subtitleText.textContent = "Sign up to start your journey";
        submitBtn.textContent = "Sign Up";
      }
    }
  };

  function initLogin() {
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      loginScreen.style.display = 'flex';
      loginScreen.style.opacity = '1';
    }

    const btnSubmit = document.getElementById('loginSubmitBtn');
    if (btnSubmit) {
      // Remove old listeners by cloning node
      const newSubmit = btnSubmit.cloneNode(true);
      btnSubmit.parentNode.replaceChild(newSubmit, btnSubmit);
      
      newSubmit.addEventListener('click', () => {
        const usernameInput = document.getElementById('loginUsername');
        const passwordInput = document.getElementById('loginPassword');
        const nameInput = document.getElementById('loginName');

        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const name = nameInput ? nameInput.value.trim() : '';

        if (!username || !password) {
          showToast("Please fill in email/phone and password.");
          return;
        }

        if (activeAuthTab === 'signup') {
          if (!name) {
            showToast("Please enter your name.");
            return;
          }
          const success = registerMobileUser(name, username, password);
          if (success) {
            // Set login session
            const userSession = { name, email: username, role: 'user' };
            localStorage.setItem('ishvara_auth', JSON.stringify(userSession));
            
            // Notify other pages
            window.dispatchEvent(new CustomEvent("ishvara_auth_changed"));

            showToast("Sign up successful! Welcome.");
            loginScreen.style.opacity = '0';
            setTimeout(() => {
              loginScreen.style.display = 'none';
              updateProfileDisplay();
              switchTab('home');
            }, 300);
          } else {
            showToast("Email address already registered.");
          }
        } else {
          // Login validation
          const res = validateCredentials(username, password);
          if (res.success) {
            const userSession = { name: res.name, email: username, role: res.role || 'user' };
            localStorage.setItem('ishvara_auth', JSON.stringify(userSession));
            
            // Notify other pages
            window.dispatchEvent(new CustomEvent("ishvara_auth_changed"));

            showToast("Welcome back!");
            loginScreen.style.opacity = '0';
            setTimeout(() => {
              loginScreen.style.display = 'none';
              updateProfileDisplay();
              switchTab('home');
            }, 300);
          } else {
            showToast(res.error || "Incorrect credentials. Try again.");
          }
        }
      });
    }
  }

  // ==================== TAB NAVIGATION ROUTER ====================
  function switchTab(tabId) {
    // Close detail overlay if open
    closeProductDetails();

    // Toggle active tab highlight
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      }
    });

    // Toggle visible screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });

    const activeScreen = document.getElementById(`screen-${tabId}`);
    if (activeScreen) {
      activeScreen.classList.add('active');
    }

    // Trigger tab-specific view renderers
    if (tabId === 'home') {
      renderCategoriesScroll();
      renderBestSellers();
      initHomeSearch();
    } else if (tabId === 'categories') {
      renderCategoriesScreen();
    } else if (tabId === 'offers') {
      renderOffersScreen();
    } else if (tabId === 'cart') {
      renderCartScreen();
    } else if (tabId === 'orders') {
      renderOrdersScreen();
    } else if (tabId === 'profile') {
      updateProfileDisplay();
      
      // Wire Logout action
      const logoutBtn = document.getElementById('profileLogoutBtn');
      if (logoutBtn) {
        // Clone to clear previous event listeners
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', () => {
          const confirmLogout = window.confirm("Are you sure you want to logout?");
          if (confirmLogout) {
            localStorage.removeItem('ishvara_auth');
            // Notify other tabs of logout
            window.dispatchEvent(new CustomEvent("ishvara_auth_changed"));
            showToast("Logged out successfully.");
            
            // Re-initialize login overlay
            initLogin();
          }
        });
      }
    }
  }

  // Sync cart badge counts
  function updateCartBadges() {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    if (headerCartBadge) headerCartBadge.textContent = count;
    if (bottomCartBadge) bottomCartBadge.textContent = count;
  }

  // ==================== HOME SCREEN ====================
  function renderCategoriesScroll() {
    if (!categoriesScroll) return;
    const categories = getCategories();

    categoriesScroll.innerHTML = categories.map(cat => `
      <div class="category-item" onclick="window.filterHomeByCategory('${cat.name}')">
        <div class="category-icon-wrap">
          <img src="${cat.image}" alt="${cat.name}" />
        </div>
        <span>${cat.name}</span>
      </div>
    `).join('');
  }

  function renderBestSellers(filterTerm = '') {
    if (!bestSellersRow) return;
    const products = getProducts();
    let bestSellers = products.filter(p => p.isBestSeller);

    if (filterTerm) {
      bestSellers = bestSellers.filter(p => p.name.toLowerCase().includes(filterTerm.toLowerCase()) || (p.categories && p.categories.some(c => c.toLowerCase().includes(filterTerm.toLowerCase()))));
    }

    bestSellersRow.innerHTML = bestSellers.slice(0, 6).map(product => {
      return `
        <div class="mobile-product-card" onclick="window.openProductDetails('${product.id}')">
          <div>
            <img src="${product.image}" alt="${product.name}" />
            <div class="p-name">${product.name}</div>
          </div>
          <div>
            <div class="p-price-row">
              <span class="p-price">₹${product.price}</span>
              <span class="p-mrp">₹${product.mrp}</span>
            </div>
            <button class="mobile-add-btn" onclick="event.stopPropagation(); window.handleAddClick('${product.id}')">
              Add
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function initHomeSearch() {
    const input = document.getElementById('homeSearchInput');
    if (input) {
      input.addEventListener('input', (e) => {
        renderBestSellers(e.target.value);
      });
    }
  }

  window.filterHomeByCategory = (categoryName) => {
    switchTab('home');
    const input = document.getElementById('homeSearchInput');
    if (input) {
      input.value = categoryName;
    }
    renderBestSellers(categoryName);
  };

  // ==================== CATEGORIES GRID SCREEN ====================
  function renderCategoriesScreen() {
    const container = document.getElementById('categoriesListContainer');
    if (!container) return;
    
    const categories = getCategories();
    const products = getProducts();

    const renderGrid = (filterTerm = '') => {
      let filtered = categories;
      if (filterTerm) {
        filtered = categories.filter(c => c.name.toLowerCase().includes(filterTerm.toLowerCase()));
      }

      container.innerHTML = filtered.map(cat => {
        // Count products matching category
        const count = products.filter(p => p.categories && p.categories.some(c => c.toLowerCase() === cat.name.toLowerCase())).length;
        return `
          <div class="category-card" onclick="window.filterHomeByCategory('${cat.name}')">
            <img src="${cat.image}" alt="${cat.name}" />
            <h4>${cat.name}</h4>
            <span>${count} items</span>
          </div>
        `;
      }).join('');
    };

    renderGrid();

    // Category search
    const catSearch = document.getElementById('catSearchInput');
    if (catSearch) {
      catSearch.addEventListener('input', (e) => {
        renderGrid(e.target.value);
      });
    }
  }

  // ==================== OFFERS SCREEN ====================
  function renderOffersScreen() {
    const container = document.getElementById('couponListContainer');
    if (!container) return;

    const offers = [
      { code: "FIRST15", title: "Flat 15% OFF", desc: "Valid on your first boutique checkouts" },
      { code: "FREESHIP", title: "Free Shipping", desc: "No shipping cost on order sizes above ₹499" },
      { code: "FESTIVE10", title: "Festive Save 10%", desc: "Extra 10% instant discount up to ₹250" },
      { code: "IESVRAPLUS", title: "IESVRA Plus", desc: "Buy 3 items or more to unlock Plus member perks" }
    ];

    container.innerHTML = offers.map(coupon => `
      <div class="coupon-card">
        <div class="coupon-details">
          <h4>${coupon.title}</h4>
          <p>${coupon.desc}</p>
        </div>
        <div class="coupon-code">${coupon.code}</div>
      </div>
    `).join('');
  }

  // ==================== PRODUCT DETAILS SHEET ====================
  window.openProductDetails = (productId) => {
    activeDetailProductId = productId;
    activeDetailDeliveryType = "express"; // default

    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const disc = Math.round(((product.mrp - product.price) / product.mrp) * 100);

    const overlay = document.getElementById('detailOverlay');
    const hero = document.getElementById('detailHero');
    const info = document.getElementById('detailInfo');

    if (hero) {
      hero.innerHTML = `
        <span class="discount-pill">${disc}% OFF</span>
        <img src="${product.image}" alt="${product.name}" />
      `;
    }

    if (info) {
      info.innerHTML = `
        <span class="cat-label">${product.categories ? product.categories[0] : "Curated"}</span>
        <h2>${product.name}</h2>
        
        <div class="detail-prices">
          <span class="dp-now">₹${product.price}</span>
          <span class="dp-was">₹${product.mrp}</span>
          <span class="dp-off">Save ${disc}%</span>
        </div>

        <div class="detail-rating">
          <span class="dr-stars">★★★★★</span>
          <span class="dr-text">4.8</span>
          <span>(12 reviews)</span>
        </div>

        <p class="detail-desc">${product.description || "Premium quality imported essential carefully curated to match your modern standard."}</p>

        <!-- Delivery Option selectors -->
        <div class="delivery-options">
          <button class="selector-btn active" id="btn-delivery-express" onclick="window.selectDeliveryOption('express')">
            <h4>Express Delivery</h4>
            <p>15-20 Minutes Delivery</p>
          </button>
          <button class="selector-btn" id="btn-delivery-standard" onclick="window.selectDeliveryOption('standard')">
            <h4>Standard Delivery</h4>
            <p>Next Day Delivery</p>
          </button>
        </div>

        <!-- Live Social Proof -->
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;">
          <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:5px 12px;">
            <span style="width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,0.3);animation:pulse 2s infinite;flex-shrink:0;"></span>
            <span style="font-size:11px;color:rgba(255,255,255,0.8);font-weight:600;" id="mobileShopperCount">${Math.floor(8 + Math.random() * 22)} people viewing</span>
          </div>
          ${new Date().getHours() < 21 ? `<div style="display:inline-flex;align-items:center;gap:6px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:20px;padding:5px 12px;"><span style="font-size:10px;color:#f59e0b;">⏰</span><span style="font-size:11px;color:#f59e0b;font-weight:600;">Order before 9 PM → Next Day</span></div>` : ''}
        </div>

        <div class="detail-actions">
          <button class="detail-add-btn" onclick="window.detailAddToCart()">Add to Cart</button>
          <button class="detail-buy-btn" onclick="window.detailBuyNow()">Buy Now</button>
        </div>
      `;
    }

    if (overlay) {
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  };

  window.selectDeliveryOption = (type) => {
    activeDetailDeliveryType = type;
    const btnExpress = document.getElementById('btn-delivery-express');
    const btnStandard = document.getElementById('btn-delivery-standard');

    if (btnExpress && btnStandard) {
      btnExpress.classList.toggle('active', type === 'express');
      btnStandard.classList.toggle('active', type === 'standard');
    }
  };

  window.detailAddToCart = () => {
    if (activeDetailProductId) {
      addToCart(activeDetailProductId);
      showToast("Added to cart successfully!");
      closeProductDetails();
    }
  };

  window.detailBuyNow = () => {
    if (activeDetailProductId) {
      addToCart(activeDetailProductId);
      closeProductDetails();
      switchTab('cart');
    }
  };

  function closeProductDetails() {
    const overlay = document.getElementById('detailOverlay');
    if (overlay) {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }
    activeDetailProductId = null;
  }

  window.closeProductDetails = closeProductDetails;

  // ==================== CART SCREEN ====================
  function renderCartScreen() {
    const itemsContainer = document.getElementById('cartItemsContainer');
    const receiptSummary = document.getElementById('receiptSummary');

    if (!itemsContainer || !receiptSummary) return;

    const cart = getCart();

    if (cart.length === 0) {
      itemsContainer.innerHTML = `
        <div style="padding: 60px 24px; text-align: center; color: var(--text-muted);">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 64px; height: 64px; margin-bottom: 16px; color: rgba(255,255,255,0.1);"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          <h3 style="color: white; margin-bottom: 8px;">Your Cart is Empty</h3>
          <p style="font-size: 13px;">Discover premium products and add them here.</p>
        </div>
      `;
      receiptSummary.style.display = 'none';
      return;
    }

    receiptSummary.style.display = 'flex';

    // Render cart items
    itemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item-card">
        <img src="${item.image}" alt="${item.name}" />
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <div class="cart-item-price">₹${item.price * item.quantity}</div>
        </div>
        <div class="qty-controls">
          <button onclick="window.updateCartItemQty('${item.id}', '${item.color || 'Standard'}', -1)">−</button>
          <span>${item.quantity}</span>
          <button onclick="window.updateCartItemQty('${item.id}', '${item.color || 'Standard'}', 1)">+</button>
        </div>
      </div>
    `).join('');

    // Calculations
    const totalMRP = cart.reduce((total, item) => total + (item.mrp * item.quantity), 0);
    const totalSellingPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const savings = totalMRP - totalSellingPrice;
    const shipping = 0; // zero shipping cost
    const totalAmount = totalSellingPrice + shipping;

    receiptSummary.innerHTML = `
      <div class="receipt-row">
        <span>Total MRP</span>
        <span>₹${totalMRP}</span>
      </div>
      <div class="receipt-row">
        <span>Boutique Discount</span>
        <span style="color: var(--accent-gold);">-₹${savings}</span>
      </div>
      <div class="receipt-row">
        <span>Delivery Charges</span>
        <span style="color: var(--green-success);">FREE</span>
      </div>
      <div class="receipt-row total">
        <span>Total Amount</span>
        <span>₹${totalAmount}</span>
      </div>
      <button class="checkout-btn" onclick="window.checkoutCart(${totalAmount})">
        Proceed to Checkout
      </button>
    `;
  }

  window.updateCartItemQty = (productId, color, change) => {
    updateCartQty(productId, color, change);
  };

  window.checkoutCart = (amount) => {
    const cart = getCart();
    if (cart.length === 0) return;

    // Create a new order object
    const orderId = "ISH-" + Math.floor(100000 + Math.random() * 900000);
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const newOrder = {
      orderId,
      date,
      amount,
      itemsCount: cart.reduce((total, item) => total + item.quantity, 0),
      items: cart,
      status: "Placed" // Placed -> Confirmed -> Packed -> Out for Delivery -> Delivered
    };

    // Save to orders history
    const storedOrders = localStorage.getItem('iesvra_orders');
    const orders = storedOrders ? JSON.parse(storedOrders) : [];
    orders.unshift(newOrder);
    localStorage.setItem('iesvra_orders', JSON.stringify(orders));

    // Clear cart
    localStorage.setItem('ishvara_cart', JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("ishvara_cart_changed"));

    showToast("Order placed successfully!");

    // Switch to orders tab and start tracking
    switchTab('orders');
    window.trackMobileOrder(orderId);
  };

  // ==================== ORDERS & LIVE TRACKING ====================
  function renderOrdersScreen() {
    const listContainer = document.getElementById('ordersListContainer');
    const viewList = document.getElementById('ordersListView');
    const viewTracking = document.getElementById('orderTrackingView');

    if (!listContainer || !viewList || !viewTracking) return;

    // Default: show list, hide tracking
    viewList.style.display = 'block';
    viewTracking.style.display = 'none';

    const storedOrders = localStorage.getItem('iesvra_orders');
    const orders = storedOrders ? JSON.parse(storedOrders) : [];

    if (orders.length === 0) {
      listContainer.innerHTML = `
        <div style="padding: 60px 24px; text-align: center; color: var(--text-muted);">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 64px; height: 64px; margin-bottom: 16px; color: rgba(255,255,255,0.1);"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>
          <h3 style="color: white; margin-bottom: 8px;">No Orders Yet</h3>
          <p style="font-size: 13px;">Place an order to view live tracking.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = orders.map(order => `
      <div class="order-history-card">
        <div class="order-history-header">
          <span>Order ID: <strong>${order.orderId}</strong></span>
          <span>Date: <strong>${order.date}</strong></span>
        </div>
        <div class="order-history-body">
          <div class="order-details">
            <h4>₹${order.amount}</h4>
            <p>${order.itemsCount} items · Status: <span style="color: ${order.status === 'Cancelled' ? '#ef4444' : 'var(--accent-gold)'}; font-weight: 700;">${order.status}</span></p>
          </div>
          <button class="track-btn" onclick="window.trackMobileOrder('${order.orderId}')">
            Track Order
          </button>
          ${(order.status === "Placed" || order.status === "Confirmed") ? `
            <button class="cancel-btn" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; border-radius: 8px; padding: 6px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; cursor: pointer; margin-left: 8px; width: auto;" onclick="window.cancelMobileOrder('${order.orderId}')">
              Cancel
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  window.trackMobileOrder = (orderId) => {
    const viewList = document.getElementById('ordersListView');
    const viewTracking = document.getElementById('orderTrackingView');
    const btnBack = document.getElementById('trackingBackBtn');
    const btnCancel = document.getElementById('trackingCancelBtn');

    if (!viewList || !viewTracking) return;

    viewList.style.display = 'none';
    viewTracking.style.display = 'block';

    if (btnBack) {
      btnBack.onclick = () => {
        viewList.style.display = 'block';
        viewTracking.style.display = 'none';
        renderOrdersScreen();
      };
    }

    const storedOrders = localStorage.getItem('iesvra_orders');
    const orders = storedOrders ? JSON.parse(storedOrders) : [];
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    // Show/hide tracking ID details
    const trackingCard = document.getElementById('mobileTrackingDetailsCard');
    const trackingIdText = document.getElementById('mobileTrackingIdText');
    const trackingUrlLink = document.getElementById('mobileTrackingUrlLink');
    if (trackingCard && trackingIdText && trackingUrlLink) {
      if (order.trackingId) {
        trackingIdText.textContent = order.trackingId;
        trackingUrlLink.href = `https://track.amazon.in/tracking/${order.trackingId}`;
        trackingCard.style.display = 'block';
      } else {
        trackingCard.style.display = 'none';
      }
    }

    // Register copy helper globally
    window.copyMobileTrackingId = () => {
      if (trackingIdText && trackingIdText.textContent) {
        navigator.clipboard.writeText(trackingIdText.textContent);
        window.showToast("Tracking ID copied!");
      }
    };

    // Show/hide cancel button dynamically in tracking view
    if (btnCancel) {
      if (order.status === "Placed" || order.status === "Confirmed") {
        btnCancel.style.display = 'block';
        btnCancel.onclick = () => {
          window.cancelMobileOrder(order.orderId);
        };
      } else {
        btnCancel.style.display = 'none';
      }
    }

    // Animate map & update timeline status
    animateTrackingFlow(order);
  };

  function animateTrackingFlow(order) {
    const scooter = document.getElementById('mapScooter');
    const stepPlaced = document.getElementById('step-placed');
    const stepConfirmed = document.getElementById('step-confirmed');
    const stepPacked = document.getElementById('step-packed');
    const stepTransit = document.getElementById('step-transit');
    const stepDelivered = document.getElementById('step-delivered');
    const btnCancel = document.getElementById('trackingCancelBtn');

    // Reset status steps visual styling
    const steps = [stepPlaced, stepConfirmed, stepPacked, stepTransit, stepDelivered];
    steps.forEach(s => {
      if (s) s.classList.remove('completed');
    });

    if (scooter) {
      scooter.setAttribute('transform', 'translate(45, 80)');
      scooter.style.transition = 'transform 6s linear';
      scooter.style.opacity = '1';
    }

    // If already Cancelled, show visual indication instead
    if (order.status === "Cancelled") {
      if (btnCancel) btnCancel.style.display = 'none';
      if (scooter) scooter.style.opacity = '0.3';
      return;
    }

    // Step 1: Placed (Immediate)
    if (stepPlaced) stepPlaced.classList.add('completed');

    // Step 2: Confirmed (1.5s)
    setTimeout(() => {
      const orders = JSON.parse(localStorage.getItem('iesvra_orders') || '[]');
      const currentOrder = orders.find(o => o.orderId === order.orderId);
      if (currentOrder && currentOrder.status === "Cancelled") return;

      if (stepConfirmed) stepConfirmed.classList.add('completed');
      updateOrderLiveStatus(order.orderId, "Confirmed");
    }, 1500);

    // Step 3: Packed (3s)
    setTimeout(() => {
      const orders = JSON.parse(localStorage.getItem('iesvra_orders') || '[]');
      const currentOrder = orders.find(o => o.orderId === order.orderId);
      if (currentOrder && currentOrder.status === "Cancelled") return;

      if (stepPacked) stepPacked.classList.add('completed');
      updateOrderLiveStatus(order.orderId, "Packed");
      if (btnCancel) btnCancel.style.display = 'none'; // Can't cancel after packed
    }, 3000);

    // Step 4: Out for Delivery (4.5s) & start scooter animation
    setTimeout(() => {
      const orders = JSON.parse(localStorage.getItem('iesvra_orders') || '[]');
      const currentOrder = orders.find(o => o.orderId === order.orderId);
      if (currentOrder && currentOrder.status === "Cancelled") return;

      if (stepTransit) stepTransit.classList.add('completed');
      updateOrderLiveStatus(order.orderId, "Out for Delivery");

      // Scooter travels across road vector map
      if (scooter) {
        scooter.setAttribute('transform', 'translate(270, 80)');
      }
    }, 4500);

    // Step 5: Delivered (7.5s)
    setTimeout(() => {
      const orders = JSON.parse(localStorage.getItem('iesvra_orders') || '[]');
      const currentOrder = orders.find(o => o.orderId === order.orderId);
      if (currentOrder && currentOrder.status === "Cancelled") return;

      if (stepDelivered) stepDelivered.classList.add('completed');
      updateOrderLiveStatus(order.orderId, "Delivered");
    }, 7500);
  }

  function updateOrderLiveStatus(orderId, status) {
    const stored = localStorage.getItem('iesvra_orders');
    if (!stored) return;
    const orders = JSON.parse(stored);
    const order = orders.find(o => o.orderId === orderId);
    if (order) {
      if (order.status === "Cancelled") return;
      order.status = status;
      localStorage.setItem('iesvra_orders', JSON.stringify(orders));
    }
  }

  window.cancelMobileOrder = (orderId) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
    if (confirmCancel) {
      const stored = localStorage.getItem('iesvra_orders');
      if (!stored) return;
      const orders = JSON.parse(stored);
      const order = orders.find(o => o.orderId === orderId);
      if (order) {
        if (order.status !== "Placed" && order.status !== "Confirmed") {
          showToast("Cannot cancel order: already in transit or delivered.");
          return;
        }
        order.status = "Cancelled";
        localStorage.setItem('iesvra_orders', JSON.stringify(orders));
        showToast("Order cancelled successfully!");
        
        // Hide tracking and show list view
        const viewList = document.getElementById('ordersListView');
        const viewTracking = document.getElementById('orderTrackingView');
        if (viewList && viewTracking) {
          viewList.style.display = 'block';
          viewTracking.style.display = 'none';
        }
        renderOrdersScreen();
      }
    }
  };

  // ==================== GLOBAL ACTIONS ====================
  window.handleAddClick = (productId) => {
    addToCart(productId);
    showToast("Added to cart successfully!");
  };

  // Toast notification helper
  let toastTimer;
  function showToast(message) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');
    if (toast && toastText) {
      toastText.textContent = message;
      toast.classList.remove('show');
      void toast.offsetWidth; // trigger reflow
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 2500);
    }
  }

  // Start app
  window.addEventListener('DOMContentLoaded', init);

  // Expose routing helpers globally
  window.switchTab = switchTab;
  window.showToast = showToast;
})();
