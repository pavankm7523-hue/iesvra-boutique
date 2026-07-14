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



  // ==================== APP LIFECYCLE ====================
  // Color Theme Manager
  function initTheme() {
    const savedTheme = localStorage.getItem('iesvra_mobile_theme');
    // Default to 'light' mode if no theme has been saved yet
    const isLight = (savedTheme || 'light') === 'light';
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

  // WARNING: Hashing passwords client-side is a partial mitigation only (prevents casual localStorage inspection).
  // It does NOT prevent an attacker with devtools access from authenticating by replaying the stored session or hash directly.
  // True security requires a server-side authentication layer where credentials are valid and verified in a backend database.
  function hashPassword(password) {
    function rotateRight(n, x) {
      return (x >>> n) | (x << (32 - n));
    }
    const words = [];
    const ascii = password;
    const asciiLength = ascii.length;
    for (let i = 0; i < asciiLength; i++) {
      words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
    }
    const totalBits = asciiLength * 8;
    words[totalBits >> 5] |= 0x80 << (24 - (totalBits % 32));
    words[(((totalBits + 64) >>> 9) << 4) + 15] = totalBits;
    
    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;
    
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    
    const w = new Array(64);
    const wordsLength = words.length;
    for (let i = 0; i < wordsLength; i += 16) {
      for (let j = 0; j < 16; j++) {
        w[j] = words[i + j] || 0;
      }
      for (let j = 16; j < 64; j++) {
        const s0 = rotateRight(7, w[j - 15]) ^ rotateRight(18, w[j - 15]) ^ (w[j - 15] >>> 3);
        const s1 = rotateRight(17, w[j - 2]) ^ rotateRight(19, w[j - 2]) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      
      let a = h0;
      let b = h1;
      let c = h2;
      let d = h3;
      let e = h4;
      let f = h5;
      let g = h6;
      let h = h7;
      
      for (let j = 0; j < 64; j++) {
        const s1 = rotateRight(6, e) ^ rotateRight(11, e) ^ rotateRight(25, e);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
        const s0 = rotateRight(2, a) ^ rotateRight(13, a) ^ rotateRight(22, a);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (s0 + maj) | 0;
        
        h = g;
        g = f;
        f = e;
        e = (d + temp1) | 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) | 0;
      }
      
      h0 = (h0 + a) | 0;
      h1 = (h1 + b) | 0;
      h2 = (h2 + c) | 0;
      h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0;
      h5 = (h5 + f) | 0;
      h6 = (h6 + g) | 0;
      h7 = (h7 + h) | 0;
    }
    
    const hash = [h0, h1, h2, h3, h4, h5, h6, h7];
    return hash.map(h => {
      let hex = (h >>> 0).toString(16);
      while (hex.length < 8) hex = "0" + hex;
      return hex;
    }).join("");
  }

  function getRegisteredUsers() {
    try {
      const raw = localStorage.getItem("ishvara_registered_users");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function isAdminEmail(email) {
    const normalized = email.trim().toLowerCase();
    return (
      normalized === "arenterprisess409@gmail.com" ||
      normalized === "ishvaraindiaa@gmail.com" ||
      normalized === "admin@iesvra.com"
    );
  }

  function registerMobileUser(name, email, password) {
    const users = getRegisteredUsers();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === "arenterprisess409@gmail.com" || normalizedEmail === "admin@iesvra.com") return false;
    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return false;
    }
    users.push({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: isAdminEmail(normalizedEmail) ? 'admin' : 'user'
    });
    localStorage.setItem("ishvara_registered_users", JSON.stringify(users));
    
    // Save globally
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(users)
    }).catch(console.error);

    return true;
  }

  function validateCredentials(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    
    if (isAdminEmail(normalizedEmail)) {
      const adminPassword = localStorage.getItem("ishvara_admin_password") || DEFAULT_ADMIN_PASSWORD;
      const incomingHash = hashPassword(password);
      
      // Check against global admin password
      if (password === adminPassword || incomingHash === adminPassword) {
        if (password === adminPassword) {
          localStorage.setItem("ishvara_admin_password", incomingHash);
          fetch("/api/admin-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: incomingHash })
          }).catch(console.error);
        }
        return { success: true, name: "IESVRA Admin", role: "admin" };
      }
      
      // Fallback: Check if they have a registered user account
      const users = getRegisteredUsers();
      const userIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
      if (userIndex !== -1) {
        const user = users[userIndex];
        if (user.passwordHash === password || user.passwordHash === incomingHash) {
          if (user.passwordHash === password) {
            user.passwordHash = incomingHash;
            localStorage.setItem("ishvara_registered_users", JSON.stringify(users));
            fetch("/api/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(users)
            }).catch(console.error);
          }
          return { success: true, name: user.name, role: "admin" }; // Upgrade role to admin!
        }
      }
      
      return { success: false, error: "Incorrect password for system administrator." };
    }

    const users = getRegisteredUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
    if (userIndex === -1) {
      return { success: false, error: "Email address not found. Please sign up." };
    }
    const user = users[userIndex];
    const incomingHash = hashPassword(password);
    if (user.passwordHash !== password && user.passwordHash !== incomingHash) {
      return { success: false, error: "Incorrect password. Please try again." };
    }
    if (user.passwordHash === password) {
      user.passwordHash = incomingHash;
      localStorage.setItem("ishvara_registered_users", JSON.stringify(users));
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(users)
      }).catch(console.error);
    }
    return { success: true, name: user.name, role: user.role };
  }

  // ==================== APP LIFECYCLE ====================
  function init() {
    // Run auth email migration
    migrateAuthEmail();

    // Initialize Theme
    initTheme();

    // Fetch and sync global products
    fetch("/api/products")
      .then(res => res.json())
      .then(globalProducts => {
        if (Array.isArray(globalProducts) && globalProducts.length > 0) {
          localStorage.setItem("ishvara_products_v4", JSON.stringify(globalProducts));
          if (typeof renderHomeScreen === 'function') renderHomeScreen();
        }
      })
      .catch(err => console.error("Failed to sync global products:", err));

    // Fetch and sync global categories
    fetch("/api/categories")
      .then(res => res.json())
      .then(globalCategories => {
        if (Array.isArray(globalCategories) && globalCategories.length > 0) {
          localStorage.setItem("ishvara_categories_v2", JSON.stringify(globalCategories));
          if (typeof renderCategoriesScreen === 'function') renderCategoriesScreen();
        }
      })
      .catch(err => console.error("Failed to sync global categories:", err));

    // Fetch and sync global users
    fetch("/api/users")
      .then(res => res.json())
      .then(globalUsers => {
        if (Array.isArray(globalUsers) && globalUsers.length > 0) {
          localStorage.setItem("ishvara_registered_users", JSON.stringify(globalUsers));
        }
      })
      .catch(err => console.error("Failed to sync global users:", err));

    // Fetch and sync global admin password
    fetch("/api/admin-password")
      .then(res => res.json())
      .then(globalPassword => {
        if (globalPassword) {
          localStorage.setItem("ishvara_admin_password", globalPassword);
        }
      })
      .catch(err => console.error("Failed to sync global admin password:", err));

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

    const headerCartBtn = document.getElementById('headerCartBtn');
    if (headerCartBtn) {
      headerCartBtn.addEventListener('click', () => {
        switchTab('cart');
      });
    }

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

  // ==================== AUTH DATA MIGRATION ====================
  // One-time migration: validate ishvara_auth.email on app load.
  // ROOT CAUSE: The email concatenation bug was caused by a previous version
  // of the login/signup code that did not clear input fields when switching
  // between Login and Sign Up tabs, causing the DOM input's .value to retain
  // the previous user's email and the new email to be appended via the browser's
  // autocomplete or leftover state. The write paths now all use direct assignment
  // (email: username) on a fresh object literal, so new sessions cannot produce
  // concatenated values. This migration cleans up stale corrupted data.
  const VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  function migrateAuthEmail() {
    const rawAuth = localStorage.getItem('ishvara_auth');
    if (!rawAuth) return;

    try {
      const auth = JSON.parse(rawAuth);
      const email = auth.email || '';

      if (email && !VALID_EMAIL_REGEX.test(email)) {
        // Email fails strict validation — clear it entirely rather than guessing
        console.warn('[Auth Validation] Invalid email detected and cleared:', email);
        auth.email = '';
        localStorage.setItem('ishvara_auth', JSON.stringify(auth));

        // Prompt user to re-enter their email after the app finishes loading
        setTimeout(() => {
          showToast('Your email was invalid and has been cleared. Please update it in Profile Settings.');
          // Auto-open the profile edit modal so user can fix it
          if (typeof window.openProfileEdit === 'function') {
            window.openProfileEdit();
          }
        }, 1500);
      }
    } catch (e) {
      console.error('[Auth Validation] Failed to parse auth data:', e);
    }
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
        if (currentOnboardingSlide < 3) {
          showOnboardingSlide(currentOnboardingSlide + 1);
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
      btnNext.textContent = slideIndex === 3 ? 'Get Started' : 'Next';
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
    
    // Clear inputs on switch to avoid concatenation or leftover values!
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const nameInput = document.getElementById('loginName');
    if (usernameInput) usernameInput.value = "";
    if (passwordInput) passwordInput.value = "";
    if (nameInput) nameInput.value = "";

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

    // Clear inputs on init login to ensure clean state
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const nameInput = document.getElementById('loginName');
    if (usernameInput) usernameInput.value = "";
    if (passwordInput) passwordInput.value = "";
    if (nameInput) nameInput.value = "";

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

    categoriesScroll.innerHTML = categories.slice(0, 8).map(cat => `
      <div class="category-grid-item" onclick="window.filterHomeByCategory('${cat.name}')">
        <div class="category-grid-icon-wrap">
          <img src="${cat.image}" alt="${cat.name}" />
        </div>
        <span>${cat.name}</span>
      </div>
    `).join('');
  }

  function renderBestSellers(filterTerm = '') {
    if (!bestSellersRow) return;
    const products = getProducts();
    let displayProducts = products;

    if (filterTerm) {
      displayProducts = products.filter(p => 
        p.name.toLowerCase().includes(filterTerm.toLowerCase()) || 
        (p.sub && p.sub.toLowerCase().includes(filterTerm.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(filterTerm.toLowerCase())) ||
        (p.categories && p.categories.some(c => c.toLowerCase().includes(filterTerm.toLowerCase())))
      );
      const titleEl = document.getElementById('bestSellersTitle');
      if (titleEl) titleEl.textContent = `Search: "${filterTerm}"`;
    } else {
      displayProducts = products.filter(p => p.isBestSeller);
      const titleEl = document.getElementById('bestSellersTitle');
      if (titleEl) titleEl.textContent = `Best Sellers`;
    }

    bestSellersRow.innerHTML = (filterTerm ? displayProducts : displayProducts.slice(0, 8)).map(product => {
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
    const overlay = document.getElementById('searchResultsOverlay');
    const micBtn = document.getElementById('micBtn');
    if (!input || !overlay) return;

    // Remove old listeners by cloning
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    let searchDebounce = null;

    newInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        const query = newInput.value.trim();
        if (query.length === 0) {
          overlay.style.display = 'none';
          renderBestSellers();
          return;
        }
        renderBestSellers(query);
        showSearchResults(query, overlay);
      }, 200);
    });

    newInput.addEventListener('focus', () => {
      const q = newInput.value.trim();
      if (q.length > 0) showSearchResults(q, overlay);
    });

    // Close overlay when clicking outside
    document.addEventListener('click', (e) => {
      if (!overlay.contains(e.target) && e.target !== newInput && !e.target.closest('.mic-btn')) {
        overlay.style.display = 'none';
      }
    });

    // Voice Search (Web Speech API)
    if (micBtn) {
      const newMic = micBtn.cloneNode(true);
      micBtn.parentNode.replaceChild(newMic, micBtn);

      newMic.addEventListener('click', () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          showToast('Voice search is not supported in this browser.');
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        newMic.classList.add('listening');
        showToast('Listening... speak now');

        recognition.start();

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          newInput.value = transcript;
          newInput.dispatchEvent(new Event('input'));
          newMic.classList.remove('listening');
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            showToast('Microphone permission denied.');
          } else {
            showToast('Could not recognize speech. Try again.');
          }
          newMic.classList.remove('listening');
        };

        recognition.onend = () => {
          newMic.classList.remove('listening');
        };
      });
    }
  }

  function showSearchResults(query, overlay) {
    const products = getProducts();
    const q = query.toLowerCase();
    const matches = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sub && p.sub.toLowerCase().includes(q)) ||
      (p.categories && p.categories.some(c => c.toLowerCase().includes(q)))
    );

    if (matches.length === 0) {
      overlay.innerHTML = `
        <div class="search-no-results">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <div>No products found for "${query}"</div>
        </div>`;
    } else {
      overlay.innerHTML = matches.slice(0, 8).map(p => `
        <div class="search-result-item" onclick="window.openProductDetails('${p.id}')">
          <img src="${p.image}" alt="${p.name}" />
          <div class="search-result-info">
            <div class="sr-name">${highlightMatch(p.name, query)}</div>
            <div class="sr-category">${(p.categories || []).join(', ')}</div>
          </div>
          <div class="search-result-price">₹${p.price}</div>
        </div>
      `).join('');
    }
    overlay.style.display = 'block';
  }

  function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);
    return `${before}<strong style="color:var(--accent-gold)">${match}</strong>${after}`;
  }

  window.filterHomeByCategory = (categoryName) => {
    switchTab('home');
    const input = document.getElementById('homeSearchInput');
    if (input) {
      input.value = categoryName;
      input.dispatchEvent(new Event('input'));
    }
    renderBestSellers(categoryName);
  };

  // ==================== PROFILE EDIT ====================
  window.openProfileEdit = () => {
    const modal = document.getElementById('profileEditModal');
    if (!modal) return;

    const rawAuth = localStorage.getItem('ishvara_auth');
    if (!rawAuth) {
      showToast('Please login first to edit profile.');
      return;
    }

    try {
      const auth = JSON.parse(rawAuth);
      const nameInput = document.getElementById('editProfileName');
      const emailInput = document.getElementById('editProfileEmail');
      const phoneInput = document.getElementById('editProfilePhone');
      if (nameInput) nameInput.value = auth.name || '';
      if (emailInput) emailInput.value = auth.email || '';
      if (phoneInput) phoneInput.value = auth.phone || '';
    } catch (e) { /* ignore parse errors */ }

    modal.classList.add('active');
  };

  window.closeProfileEdit = () => {
    const modal = document.getElementById('profileEditModal');
    if (modal) modal.classList.remove('active');
  };

  window.saveProfileEdit = () => {
    const nameInput = document.getElementById('editProfileName');
    const emailInput = document.getElementById('editProfileEmail');
    const phoneInput = document.getElementById('editProfilePhone');

    const newName = nameInput ? nameInput.value.trim() : '';
    const newEmail = emailInput ? emailInput.value.trim() : '';
    const newPhone = phoneInput ? phoneInput.value.trim() : '';

    if (!newName) {
      showToast('Name cannot be empty.');
      return;
    }

    const rawAuth = localStorage.getItem('ishvara_auth');
    if (!rawAuth) return;

    try {
      const auth = JSON.parse(rawAuth);
      auth.name = newName;
      auth.email = newEmail;
      auth.phone = newPhone;
      localStorage.setItem('ishvara_auth', JSON.stringify(auth));

      // Notify other tabs/pages of profile update
      window.dispatchEvent(new CustomEvent('ishvara_auth_changed'));

      updateProfileDisplay();
      showToast('Profile updated successfully!');
      window.closeProfileEdit();
    } catch (e) {
      showToast('Failed to save profile.');
    }
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

  let checkoutDeliverySpeed = 'standard';
  let checkoutPaymentMode = 'razorpay';
  let checkoutIsExpressEligible = false;
  let checkoutSubtotal = 0;
  let checkoutShippingFee = 0;
  let checkoutTotal = 0;

  window.updateCheckoutDelivery = (speed) => {
    checkoutDeliverySpeed = speed;
    checkoutShippingFee = speed === 'express' ? 49 : 0;
    window.updateCheckoutSummary();
  };

  window.updateCheckoutPayment = (mode) => {
    checkoutPaymentMode = mode;
    window.updateCheckoutSummary();
  };

  window.updateCheckoutSummary = () => {
    checkoutTotal = checkoutSubtotal + checkoutShippingFee;
    const summaryContainer = document.getElementById('checkoutSummarySection');
    if (!summaryContainer) return;

    summaryContainer.innerHTML = `
      <div class="receipt-row" style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: var(--text-primary);">
        <span>Subtotal</span>
        <span>₹${checkoutSubtotal}</span>
      </div>
      <div class="receipt-row" style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: var(--text-primary);">
        <span>Delivery Option (${checkoutDeliverySpeed === 'express' ? 'Express 15-Min' : 'Standard'})</span>
        <span>${checkoutShippingFee > 0 ? `₹${checkoutShippingFee}` : '<span style="color: var(--green-success);">FREE</span>'}</span>
      </div>
      <div class="receipt-row total" style="display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; border-top: 1px dashed var(--border-color); padding-top: 8px; color: var(--text-primary);">
        <span>Total Amount</span>
        <span>₹${checkoutTotal}</span>
      </div>
    `;

    const placeBtn = document.getElementById('placeOrderBtn');
    if (placeBtn) {
      placeBtn.innerText = checkoutPaymentMode === 'razorpay' ? `Pay & Place Order (₹${checkoutTotal})` : `Place COD Order (₹${checkoutTotal})`;
    }
  };

  window.checkoutCart = (amount) => {
    const cart = getCart();
    if (cart.length === 0) return;

    checkoutSubtotal = amount;
    checkoutDeliverySpeed = 'standard';
    checkoutPaymentMode = 'razorpay';
    checkoutIsExpressEligible = false;
    checkoutShippingFee = 0;

    // Reset checkout fields
    const sessionStr = localStorage.getItem('ishvara_auth');
    const session = sessionStr ? JSON.parse(sessionStr) : null;

    const n = document.getElementById('checkoutName');
    const e = document.getElementById('checkoutEmail');
    const p = document.getElementById('checkoutPhone');
    const a1 = document.getElementById('checkoutAddress1');
    const a2 = document.getElementById('checkoutAddress2');
    const c = document.getElementById('checkoutCity');
    const s = document.getElementById('checkoutState');
    const pin = document.getElementById('checkoutPincode');
    const aSearch = document.getElementById('checkoutAddressSearch');

    if (n) n.value = session?.name || localStorage.getItem('IESVRA_shipping_name') || '';
    if (e) e.value = session?.email || localStorage.getItem('IESVRA_shipping_email') || '';
    if (p) p.value = localStorage.getItem('IESVRA_shipping_phone') || '';
    if (a1) a1.value = localStorage.getItem('IESVRA_delivery_address_line1') || '';
    if (a2) a2.value = localStorage.getItem('IESVRA_delivery_address_line2') || '';
    if (c) c.value = localStorage.getItem('IESVRA_delivery_city') || '';
    if (s) s.value = localStorage.getItem('IESVRA_delivery_state') || '';
    if (pin) pin.value = localStorage.getItem('IESVRA_delivery_pincode') || '';
    if (aSearch) aSearch.value = '';

    // Set radios to default
    const radios = document.getElementsByName('deliverySpeed');
    if (radios && radios.length > 0) radios[0].checked = true;
    const pRadios = document.getElementsByName('paymentMode');
    if (pRadios && pRadios.length > 0) pRadios[0].checked = true;

    // Trigger address eligibility hide initially
    const label = document.getElementById('expressDeliveryLabel');
    const notice = document.getElementById('expressUnavailableNotice');
    if (label) label.style.display = 'none';
    if (notice) notice.style.display = 'block';

    window.updateCheckoutSummary();
    switchTab('checkout');

    // Init address listeners and Map pinpoint
    setTimeout(() => {
      initCheckoutAddressAutocomplete();
      if (pin) {
        pin.addEventListener('blur', triggerManualAddressCheck);
      }
      window.initAppCheckoutMap();
    }, 100);
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

  // ==================== SOCIAL AUTH MOCK SYSTEM ====================
  window.closeSocialLogin = () => {
    const modal = document.getElementById('socialLoginModal');
    if (modal) modal.classList.remove('active');
  };

  window.submitSocialLogin = (name, email) => {
    // Overwrite ishvara_auth with the logged in user
    const userSession = { name: name, email: email, role: 'user' };
    localStorage.setItem('ishvara_auth', JSON.stringify(userSession));
    
    // Register user locally and globally in background if not already present
    const users = getRegisteredUsers();
    const normalizedEmail = email.trim().toLowerCase();
    if (!users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      users.push({
        name: name,
        email: normalizedEmail,
        passwordHash: hashPassword("social-auth-bypass-pass"),
        role: 'user'
      });
      localStorage.setItem("ishvara_registered_users", JSON.stringify(users));
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(users)
      }).catch(console.error);
    }

    // Notify listeners
    window.dispatchEvent(new CustomEvent("ishvara_auth_changed"));

    // Close modal & hide login screen
    window.closeSocialLogin();
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      loginScreen.style.opacity = '0';
      setTimeout(() => {
        loginScreen.style.display = 'none';
        updateProfileDisplay();
        switchTab('home');
      }, 300);
    }
    showToast(`Logged in successfully via Social Auth!`);
  };

  window.openSocialLogin = (provider) => {
    const modal = document.getElementById('socialLoginModal');
    const card = document.getElementById('socialLoginCard');
    if (!modal || !card) return;

    if (provider === 'google') {
      card.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <svg viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 12px;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 4px; color: var(--text-primary);">Sign in with Google</h3>
          <p style="font-size: 13px; color: var(--text-muted);">to continue to IESVRA</p>
        </div>

        <div id="google-signin-btn-container" style="display: flex; justify-content: center; min-height: 44px; margin-bottom: 20px; width: 100%;">
          <div style="font-size: 13px; color: var(--text-muted);">Loading Google Sign-in...</div>
        </div>

        <div style="height: 1px; background: var(--border-light); margin: 16px 0;"></div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <label style="font-size: 11px; font-weight: bold; color: var(--text-muted);">OR SIGN IN WITH ANOTHER EMAIL</label>
          <div style="display: flex; gap: 8px;">
            <input type="email" id="googleCustomEmail" placeholder="name@domain.com" style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--primary-bg); color: var(--text-primary); font-size: 13px;" />
            <button onclick="const em = document.getElementById('googleCustomEmail').value; if(em) window.submitSocialLogin(em.split('@')[0], em); else alert('Please enter email')" style="padding: 8px 16px; background: var(--accent-gold); color: var(--primary-bg); border: none; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer;">Next</button>
          </div>
        </div>

        <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
          <button onclick="window.closeSocialLogin()" style="padding: 8px 16px; background: transparent; border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 12px; font-weight: bold; cursor: pointer;">Cancel</button>
        </div>
      `;

      const initGoogle = () => {
        const client_id = window.GOOGLE_CLIENT_ID || "825754182940-32tep8cm2tku2cdpfmd29adhn8q8j4du.apps.googleusercontent.com";
        google.accounts.id.initialize({
          client_id: client_id,
          callback: (response) => {
            try {
              const base64Url = response.credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              const payload = JSON.parse(jsonPayload);
              if (payload && payload.email) {
                window.submitSocialLogin(payload.name || payload.email.split('@')[0], payload.email);
              }
            } catch (err) {
              console.error("Google authentication error:", err);
            }
          }
        });
        const container = document.getElementById("google-signin-btn-container");
        if (container) {
          container.innerHTML = "";
          google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: "300"
          });
        }
      };

      if (typeof google === "undefined" || !google.accounts) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initGoogle;
        document.head.appendChild(script);
      } else {
        setTimeout(initGoogle, 100);
      }
    } else {
      card.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 12px; color: var(--text-primary);"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.11.09 2.26-.56 2.95-1.39z"/></svg>
          <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 4px; color: var(--text-primary);">Sign in with Apple ID</h3>
          <p style="font-size: 13px; color: var(--text-muted);">Use your Apple ID to sign in to IESVRA</p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
          <input type="email" id="appleIdInput" placeholder="Apple ID (email)" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--primary-bg); color: var(--text-primary); font-size: 14px;" />
          <button onclick="const val = document.getElementById('appleIdInput').value; if(val) window.submitSocialLogin(val.split('@')[0], val); else alert('Please enter Apple ID')" style="width: 100%; padding: 12px; background: var(--text-primary); color: var(--primary-bg); border: none; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer;">Continue</button>
        </div>

        <div style="height: 1px; background: var(--border-light); margin: 16px 0;"></div>

        <div style="text-align: center; margin-bottom: 20px;">
          <button onclick="window.submitSocialLogin('Apple User', 'appleuser@iesvra.com')" style="background: transparent; border: none; color: var(--accent-gold); font-size: 13px; font-weight: bold; cursor: pointer;">Sign in with Touch ID / Face ID</button>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button onclick="window.closeSocialLogin()" style="padding: 8px 16px; background: transparent; border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 12px; font-weight: bold; cursor: pointer;">Cancel</button>
        </div>
      `;
    }

    modal.classList.add('active');
  };

  // ==================== CHECKOUT SYSTEM ====================
  let searchTimeout = null;
  
  function initCheckoutAddressAutocomplete() {
    setupFieldAutocomplete('checkoutAddress1', 'checkoutAddress1Suggestions');
    setupFieldAutocomplete('checkoutAddress2', 'checkoutAddress2Suggestions');
  }

  function setupFieldAutocomplete(inputId, boxId) {
    const input = document.getElementById(inputId);
    const suggestionsBox = document.getElementById(boxId);
    if (!input || !suggestionsBox) return;

    // Remove existing event listeners by cloning
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    newInput.addEventListener('input', () => {
      const val = newInput.value;
      if (searchTimeout) clearTimeout(searchTimeout);

      if (val.trim().length < 3) {
        suggestionsBox.style.display = 'none';
        suggestionsBox.innerHTML = '';
        return;
      }

      searchTimeout = setTimeout(async () => {
        try {
          const trimmed = val.trim();
          const isMapsUrl = /https?:\/\/(maps\.(google|app\.goo)\.gl|goo\.gl\/maps|www\.google\.com\/maps)/i.test(trimmed);
          const coordsRegex = /^([-+]?[0-9]+\.[0-9]+)\s*,\s*([-+]?[0-9]+\.[0-9]+)$/;
          const coordsMatch = trimmed.match(coordsRegex);

          let list = [];
          if (coordsMatch) {
            try {
              const lat = parseFloat(coordsMatch[1]);
              const lon = parseFloat(coordsMatch[2]);
              const reverseRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en&addressdetails=1`, {
                headers: { 'User-Agent': 'IESVRA-Boutique-App/1.0' }
              });
              if (reverseRes.ok) {
                const data = await reverseRes.json();
                const addr = data.address || {};
                const road = addr.road || addr.pedestrian || addr.street || "";
                const houseNumber = addr.house_number || "";
                const suburb = addr.suburb || addr.neighbourhood || addr.city_district || "";
                const city = addr.city || addr.town || addr.village || addr.county || "";
                const state = addr.state || "";
                const pincode = addr.postcode || "";
                list = [{
                  display_name: `📍 Coordinates: ${data.display_name}`,
                  lat: lat,
                  lon: lon,
                  address: {
                    road: [houseNumber, road].filter(Boolean).join(" ") || trimmed,
                    suburb: suburb,
                    city: city,
                    state: state,
                    postcode: pincode
                  }
                }];
              }
            } catch (e) {
              console.error(e);
            }
          } else if (isMapsUrl) {
            const resolveRes = await fetch(`/api/resolve-maps-url?url=${encodeURIComponent(trimmed)}`);
            if (resolveRes.ok) {
              const data = await resolveRes.json();
              if (data && data.lat && data.lon) {
                // Map resolved data format to Nominatim format so selectCheckoutSuggestion works out of the box
                list = [{
                  display_name: `📍 ${data.displayName}`,
                  lat: data.lat,
                  lon: data.lon,
                  address: {
                    road: data.line1,
                    suburb: data.line2,
                    city: data.city,
                    state: data.state,
                    postcode: data.pincode
                  }
                }];
              }
            }
          } else {
            // Checkout map search: countrycodes=in (all India, no region/viewbox restriction)
            // addressdetails=1 required so city/state/pincode autofill when user picks a result
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&countrycodes=in&addressdetails=1&accept-language=en`;
            console.log('[checkout-map-search] Nominatim URL:', nominatimUrl);
            const res = await fetch(nominatimUrl, {
              headers: { 'User-Agent': 'IESVRA-Boutique-App/1.0' }
            });
            list = await res.json();
          }

          if (list && list.length > 0) {
            suggestionsBox.innerHTML = list.map(item => `
              <div class="address-suggestion-item" style="padding: 10px 12px; font-size: 12px; cursor: pointer; border-bottom: 1px solid var(--border-color); color: var(--text-primary); transition: background 0.2s;" onclick="window.selectCheckoutSuggestion('${encodeURIComponent(JSON.stringify(item))}', '${inputId}', '${boxId}')">
                ${item.display_name}
              </div>
            `).join('');
            suggestionsBox.style.display = 'block';
          } else {
            suggestionsBox.style.display = 'none';
          }
        } catch (e) {
          console.error(e);
        }
      }, 400);
    });

    document.addEventListener('click', (e) => {
      if (e.target !== newInput && e.target !== suggestionsBox) {
        suggestionsBox.style.display = 'none';
      }
    });
  }

  window.selectCheckoutSuggestion = (itemStr, inputId, boxId) => {
    const item = JSON.parse(decodeURIComponent(itemStr));
    const suggestionsBox = document.getElementById(boxId);
    if (suggestionsBox) suggestionsBox.style.display = 'none';

    const addr = item.address || {};
    const road = addr.road || addr.pedestrian || addr.street || "";
    const houseNumber = addr.house_number || "";
    const suburb = addr.suburb || addr.neighbourhood || addr.city_district || "";
    const city = addr.city || addr.town || addr.village || addr.county || "";
    const state = addr.state || "";
    const pincode = addr.postcode || "";

    const a1 = document.getElementById('checkoutAddress1');
    const a2 = document.getElementById('checkoutAddress2');
    const c = document.getElementById('checkoutCity');
    const s = document.getElementById('checkoutState');
    const p = document.getElementById('checkoutPincode');

    if (inputId === 'checkoutAddress1') {
      if (a1) a1.value = [houseNumber, road].filter(Boolean).join(" ") || item.display_name.split(',')[0];
      if (a2) a2.value = suburb || item.display_name.split(',')[1] || '';
    } else {
      if (a2) a2.value = [houseNumber, road].filter(Boolean).join(" ") || item.display_name.split(',')[0];
    }
    
    if (c) c.value = city;
    if (s) s.value = state;
    if (p) p.value = pincode;

    if (item.lat && item.lon) {
      checkExpressEligibilityByCoords(parseFloat(item.lat), parseFloat(item.lon));
    } else {
      checkExpressEligibilityByText(item.display_name);
    }
  };

  window.detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    const locBtn = document.getElementById('detectLocationBtn');
    const originalText = locBtn ? locBtn.innerHTML : "📍 Detect Location";
    if (locBtn) locBtn.innerHTML = "⌛ Detecting...";

    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`, {
          headers: { 'User-Agent': 'IESVRA-Boutique-App/1.0' }
        });
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const road = addr.road || addr.pedestrian || addr.street || "";
          const houseNumber = addr.house_number || "";
          const suburb = addr.suburb || addr.neighbourhood || addr.city_district || "";
          const city = addr.city || addr.town || addr.village || addr.county || "";
          const state = addr.state || "";
          const pincode = addr.postcode || "";

          const a1 = document.getElementById('checkoutAddress1');
          const a2 = document.getElementById('checkoutAddress2');
          const c = document.getElementById('checkoutCity');
          const s = document.getElementById('checkoutState');
          const p = document.getElementById('checkoutPincode');

          if (a1) a1.value = [houseNumber, road].filter(Boolean).join(" ");
          if (a2) a2.value = suburb;
          if (c) c.value = city;
          if (s) s.value = state;
          if (p) p.value = pincode;

          checkExpressEligibilityByCoords(lat, lon);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (locBtn) locBtn.innerHTML = originalText;
      }
    }, (error) => {
      console.error(error);
      alert("Failed to retrieve current location. Please grant permission.");
      if (locBtn) locBtn.innerHTML = originalText;
    }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
  };

  const WAREHOUSE_LAT = 25.5945;
  const WAREHOUSE_LON = 85.1565;

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function checkExpressEligibilityByCoords(lat, lon) {
    const distance = calculateDistance(WAREHOUSE_LAT, WAREHOUSE_LON, lat, lon);
    const label = document.getElementById('expressDeliveryLabel');
    const notice = document.getElementById('expressUnavailableNotice');
    
    if (distance <= 15) {
      checkoutIsExpressEligible = true;
      if (label) label.style.display = 'flex';
      if (notice) notice.style.display = 'none';
      
      // Auto-select Express delivery radio button
      const radios = document.getElementsByName('deliverySpeed');
      if (radios && radios.length > 1) {
        radios[1].checked = true; // Express is the second radio option
      }
      checkoutDeliverySpeed = 'express';
      window.updateCheckoutDelivery('express');
      
      showToast(`Address is within 15 km (${distance.toFixed(1)} km). Express 15-min delivery available!`);
    } else {
      checkoutIsExpressEligible = false;
      if (label) label.style.display = 'none';
      if (notice) {
        notice.style.display = 'block';
        notice.innerText = `Address is ${distance.toFixed(1)} km away. Standard delivery available (limit is 15 km).`;
      }
      checkoutDeliverySpeed = 'standard';
      const radios = document.getElementsByName('deliverySpeed');
      if (radios && radios.length > 0) radios[0].checked = true;
      checkoutShippingFee = 0;
      window.updateCheckoutDelivery('standard');
    }
  }

  async function checkExpressEligibilityByText(text) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'IESVRA-Boutique-App/1.0' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        checkExpressEligibilityByCoords(parseFloat(data[0].lat), parseFloat(data[0].lon));
      }
    } catch (e) {
      console.error("Geocoding check failed:", e);
    }
  }

  function triggerManualAddressCheck() {
    const a1 = document.getElementById('checkoutAddress1')?.value || "";
    const city = document.getElementById('checkoutCity')?.value || "";
    const state = document.getElementById('checkoutState')?.value || "";
    const pincode = document.getElementById('checkoutPincode')?.value || "";
    const combined = [a1, city, state, pincode].filter(Boolean).join(", ");
    if (combined.length > 8) {
      checkExpressEligibilityByText(combined);
    }
  }

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  window.submitCheckoutForm = async () => {
    const nameInput = document.getElementById('checkoutName');
    const emailInput = document.getElementById('checkoutEmail');
    const phoneInput = document.getElementById('checkoutPhone');
    const a1Input = document.getElementById('checkoutAddress1');
    const a2Input = document.getElementById('checkoutAddress2');
    const cityInput = document.getElementById('checkoutCity');
    const stateInput = document.getElementById('checkoutState');
    const pinInput = document.getElementById('checkoutPincode');

    const name = nameInput?.value.trim() || "";
    const email = emailInput?.value.trim() || "";
    const phone = phoneInput?.value.trim() || "";
    const a1 = a1Input?.value.trim() || "";
    const a2 = a2Input?.value.trim() || "";
    const city = cityInput?.value.trim() || "";
    const state = stateInput?.value.trim() || "";
    const pin = pinInput?.value.trim() || "";

    if (!name || !email || !phone || !a1 || !city || !state || !pin) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      alert("Please enter a valid 6-digit pincode.");
      return;
    }

    const address = [a1, a2, city, `${state} - ${pin}`].filter(Boolean).join(", ");
    const orderId = "ISH-" + Math.floor(100000 + Math.random() * 900000);
    const orderDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Save shipping details locally to prefill next time
    localStorage.setItem("IESVRA_shipping_name", name);
    localStorage.setItem("IESVRA_shipping_email", email);
    localStorage.setItem("IESVRA_shipping_phone", phone);
    localStorage.setItem("IESVRA_delivery_address_line1", a1);
    localStorage.setItem("IESVRA_delivery_address_line2", a2);
    localStorage.setItem("IESVRA_delivery_city", city);
    localStorage.setItem("IESVRA_delivery_state", state);
    localStorage.setItem("IESVRA_delivery_pincode", pin);

    if (checkoutPaymentMode === 'cod') {
      const orderData = {
        id: orderId,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: address,
        items: getCart(),
        subtotal: checkoutSubtotal,
        shipping: checkoutShippingFee,
        total: checkoutTotal,
        date: orderDate,
        status: "Placed",
        paymentStatus: "Pending - COD",
        source: "mobile",
        latitude: appPinnedLat,
        longitude: appPinnedLng
      };

      try {
        showToast("Saving order...");
        const res = await fetch("/api/save-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData)
        });
        if (!res.ok) throw new Error("Failed to save order");

        const saved = await res.json();
        
        // Save order locally
        const storedOrders = localStorage.getItem('iesvra_orders');
        const orders = storedOrders ? JSON.parse(storedOrders) : [];
        orders.unshift(saved);
        localStorage.setItem('iesvra_orders', JSON.stringify(orders));

        // Clear cart
        localStorage.setItem('ishvara_cart', JSON.stringify([]));
        window.dispatchEvent(new CustomEvent("ishvara_cart_changed"));

        showToast("Order placed successfully via COD!");
        switchTab('orders');
        window.trackMobileOrder(saved.id);
      } catch (err) {
        console.error(err);
        showToast("Failed to place order. Try again.");
      }
    } else {
      // Razorpay online gateway
      try {
        showToast("Initiating secure payment...");
        
        const res = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Math.round(checkoutTotal * 100) })
        });
        if (!res.ok) throw new Error("Payment initialization failed");
        const { order_id, key_id } = await res.json();

        const sdkLoaded = await loadRazorpayScript();
        if (!sdkLoaded) throw new Error("Payment gateway SDK failed to load");

        const options = {
          key: key_id,
          amount: Math.round(checkoutTotal * 100),
          currency: "INR",
          name: "IESVRA",
          description: "Boutique Order Payment",
          order_id: order_id,
          handler: async function (response) {
            try {
              showToast("Verifying payment...");
              const vRes = await fetch("/api/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              const vData = await vRes.json();
              if (!vRes.ok || !vData.verified) throw new Error("Payment verification failed");

              const orderData = {
                id: orderId,
                customerName: name,
                customerEmail: email,
                customerPhone: phone,
                shippingAddress: address,
                items: getCart(),
                subtotal: checkoutSubtotal,
                shipping: checkoutShippingFee,
                total: checkoutTotal,
                date: orderDate,
                status: "Placed",
                paymentStatus: "Paid",
                source: "mobile",
                latitude: appPinnedLat,
                longitude: appPinnedLng
              };

              const sRes = await fetch("/api/save-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
              });
              if (!sRes.ok) throw new Error("Failed to save order after payment success");
              const saved = await sRes.json();

              const storedOrders = localStorage.getItem('iesvra_orders');
              const orders = storedOrders ? JSON.parse(storedOrders) : [];
              orders.unshift(saved);
              localStorage.setItem('iesvra_orders', JSON.stringify(orders));

              localStorage.setItem('ishvara_cart', JSON.stringify([]));
              window.dispatchEvent(new CustomEvent("ishvara_cart_changed"));

              showToast("Payment successful & order placed!");
              switchTab('orders');
              window.trackMobileOrder(saved.id);
            } catch (e) {
              console.error(e);
              showToast(e.message || "Verification failed");
            }
          },
          prefill: {
            name: name,
            email: email,
            contact: phone
          },
          theme: {
            color: "#C9A54A"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          showToast("Payment failed: " + response.error.description);
        });
        rzp.open();
      } catch (e) {
        console.error(e);
        showToast(e.message || "Failed to start online payment");
      }
    }
  };

  // Start app
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================== MOBILE APP PINPOINT MAP SYSTEM ====================
  let appPinnedLat = null;
  let appPinnedLng = null;
  let appMapInstance = null;
  let appMarkerInstance = null;

  window.initAppCheckoutMap = async () => {
    const mapContainer = document.getElementById("app-checkout-map");
    if (!mapContainer) return;
    
    mapContainer.innerHTML = '<div id="leaflet-mobile-map" style="width: 100%; height: 100%;"></div>';
    
    try {
      const L = await loadLeafletForApp();
      
      let initialLat = 25.5941; // Patna default
      let initialLng = 85.1376;
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            initialLat = pos.coords.latitude;
            initialLng = pos.coords.longitude;
            setupMobileMap(L, initialLat, initialLng);
          },
          () => {
            setupMobileMap(L, initialLat, initialLng);
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      } else {
        setupMobileMap(L, initialLat, initialLng);
      }
    } catch (err) {
      console.error("Leaflet loading error in mobile app:", err);
      mapContainer.innerHTML = '<div style="padding: 16px; font-size: 11px; color: red; text-align: center; font-weight: 500;">Failed to load map. You can still type address manually.</div>';
    }
  };

  function setupMobileMap(L, lat, lng) {
    appPinnedLat = lat;
    appPinnedLng = lng;
    
    const coordsDisplay = document.getElementById("appMapCoords");
    if (coordsDisplay) {
      coordsDisplay.innerText = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      coordsDisplay.style.display = "inline-block";
    }

    if (appMapInstance) {
      try {
        appMapInstance.remove();
      } catch (e) {
        console.warn("Error removing previous map instance:", e);
      }
      appMapInstance = null;
      appMarkerInstance = null;
    }

    const map = L.map("leaflet-mobile-map").setView([lat, lng], 15);
    appMapInstance = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const markerHtml = `
      <div style="background-color: var(--accent-gold); width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.4); transform: translate(-3px, -3px);"></div>
      <div style="background-color: var(--accent-gold); width: 3px; height: 18px; margin-left: 5px; transform: translateY(-5px);"></div>
    `;
    const customIcon = L.divIcon({
      html: markerHtml,
      iconSize: [20, 20],
      iconAnchor: [10, 20]
    });

    const marker = L.marker([lat, lng], {
      draggable: true,
      icon: customIcon
    }).addTo(map);
    appMarkerInstance = marker;

    marker.on("dragend", () => {
      const position = marker.getLatLng();
      appPinnedLat = position.lat;
      appPinnedLng = position.lng;
      if (coordsDisplay) {
        coordsDisplay.innerText = `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;
      }
    });

    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      appPinnedLat = e.latlng.lat;
      appPinnedLng = e.latlng.lng;
      if (coordsDisplay) {
        coordsDisplay.innerText = `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
      }
    });
    
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }

  function loadLeafletForApp() {
    return new Promise((resolve, reject) => {
      if (window.L) {
        resolve(window.L);
        return;
      }
      
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error("Leaflet script load failed"));
      document.body.appendChild(script);
    });
  }

  window.confirmAppLocation = async () => {
    if (!appPinnedLat || !appPinnedLng) return;
    
    const confirmBtn = document.getElementById("confirmAppLocationBtn");
    const originalText = confirmBtn ? confirmBtn.innerHTML : "📍 Confirm Pin Location";
    if (confirmBtn) {
      confirmBtn.innerHTML = "⏳ Geocoding...";
      confirmBtn.disabled = true;
    }
    
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${appPinnedLat}&lon=${appPinnedLng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "IESVRA-Boutique-App/1.0"
          }
        }
      );
      
      if (!res.ok) throw new Error("Reverse geocoding failed");
      const data = await res.json();
      
      if (data && data.address) {
        const addr = data.address;
        const road = addr.road || addr.suburb || addr.neighbourhood || addr.amenity || "";
        const cityVal = addr.city || addr.town || addr.village || addr.county || "";
        const stateVal = addr.state || "";
        const pincodeVal = addr.postcode || "";
        
        const line1 = [road, addr.house_number || ""].filter(Boolean).join(" ");
        
        const a1 = document.getElementById('checkoutAddress1');
        const c = document.getElementById('checkoutCity');
        const s = document.getElementById('checkoutState');
        const p = document.getElementById('checkoutPincode');
        
        if (a1 && line1) a1.value = line1;
        if (c && cityVal) c.value = cityVal;
        if (s && stateVal) s.value = stateVal;
        if (p && pincodeVal && /^\d{6}$/.test(pincodeVal)) p.value = pincodeVal;
        
        // Trigger eligibility check
        checkExpressEligibilityByCoords(appPinnedLat, appPinnedLng);
        showToast("Location confirmed and address autofilled!");
      } else {
        throw new Error("No address details found for this location.");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to retrieve address details. Please fill manually.");
    } finally {
      if (confirmBtn) {
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
      }
    }
  };

  window.recenterAppMapOnGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    showToast("Accessing current location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        appPinnedLat = lat;
        appPinnedLng = lng;

        const coordsDisplay = document.getElementById("appMapCoords");
        if (coordsDisplay) {
          coordsDisplay.innerText = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }

        if (appMapInstance) {
          appMapInstance.setView([lat, lng], 15);
        }
        if (appMarkerInstance) {
          appMarkerInstance.setLatLng([lat, lng]);
        }
        showToast("Location detected and centered!");
      },
      (err) => {
        alert("Failed to detect location. Please check browser permissions.");
        console.warn("Mobile map geolocation error:", err);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Helper to complete Google Authentication, store session, and update UI
  const completeGoogleAuth = (name, email) => {
    showToast(`Logging in as ${name}...`);
    
    const userSession = { name, email, role: 'user' };
    localStorage.setItem('ishvara_auth', JSON.stringify(userSession));
    
    const users = getRegisteredUsers();
    const normalizedEmail = email.toLowerCase();
    if (!users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      users.push({
        name: name,
        email: normalizedEmail,
        passwordHash: "oauth-login-only", // Match website security config
        role: 'user'
      });
      localStorage.setItem("ishvara_registered_users", JSON.stringify(users));
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(users)
      }).catch(console.error);
    }

    window.dispatchEvent(new CustomEvent("ishvara_auth_changed"));
    showToast("Logged in successfully via Google!");

    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      loginScreen.style.opacity = '0';
      setTimeout(() => {
        loginScreen.style.display = 'none';
        updateProfileDisplay();
        switchTab('home');
      }, 300);
    }
  };

  // Expose routing helpers globally
  window.switchTab = switchTab;
  window.showToast = showToast;

  // Listen for Google Auth callback message from the popup window
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
      completeGoogleAuth(event.data.name, event.data.email);
    }
  });

  window.openSocialLogin = async (platform) => {
    if (platform === 'google') {
      showToast("Opening Google Sign-In...");
      
      // Native Capacitor Google Auth integration
      let googleAuth = null;
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
          if (window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth) {
            googleAuth = window.Capacitor.Plugins.GoogleAuth;
          } else if (typeof window.Capacitor.registerPlugin === 'function') {
            googleAuth = window.Capacitor.registerPlugin('GoogleAuth');
          }
        } catch (e) {
          console.error("Failed to load/register native GoogleAuth plugin:", e);
        }
      }

      if (googleAuth) {
        try {
          const googleUser = await googleAuth.signIn();
          if (googleUser && googleUser.email) {
            const name = googleUser.displayName || googleUser.email.split('@')[0];
            completeGoogleAuth(name, googleUser.email);
          } else {
            showToast("Google Sign-In cancelled.");
          }
        } catch (error) {
          console.error("Capacitor Google Auth error:", error);
          showToast("Google Sign-In failed.");
        }
        return;
      }
      
      // Web Popup Fallback pointing to real Google Sign-In endpoint
      const popupWidth = 500;
      const popupHeight = 650;
      const left = (window.screen.width / 2) - (popupWidth / 2);
      const top = (window.screen.height / 2) - (popupHeight / 2);
      
      const popup = window.open("/api/auth/google", "GoogleSignIn", `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`);
      
      if (!popup) {
        showToast("Popup blocked! Please allow popups for this site.");
      }
    } else {
      showToast("Logging in with Apple...");
      setTimeout(() => {
        const name = "Apple User";
        const email = "appleuser@apple.com";
        const userSession = { name, email, role: 'user' };
        localStorage.setItem('ishvara_auth', JSON.stringify(userSession));
        
        window.dispatchEvent(new CustomEvent("ishvara_auth_changed"));

        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
          loginScreen.style.opacity = '0';
          setTimeout(() => {
            loginScreen.style.display = 'none';
            updateProfileDisplay();
            switchTab('home');
          }, 300);
        }
      }, 800);
    }
  };
})();
