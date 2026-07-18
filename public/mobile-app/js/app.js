(function() {
  // Retrieve functions from global AppState to bypass WebView module restrictions
  const { getProducts, getCategories, getCart, saveCart, addToCart, updateCartQty } = window.AppState;

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

    const headerDeliveryInfo = document.getElementById('headerDeliveryInfo');
    if (headerDeliveryInfo) {
      headerDeliveryInfo.addEventListener('click', () => {
        window.openLocationPicker();
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

    // Toggle bottom-nav and stickyCheckoutBar
    const bottomNav = document.querySelector('.bottom-nav');
    const stickyBar = document.getElementById('stickyCheckoutBar');
    if (tabId === 'checkout') {
      if (bottomNav) bottomNav.style.display = 'none';
      if (stickyBar) stickyBar.style.display = 'block';
    } else {
      if (bottomNav) bottomNav.style.display = 'flex';
      if (stickyBar) stickyBar.style.display = 'none';
    }

    // Dynamic Header Control
    const header = document.getElementById('appHeader');
    const homeContent = document.querySelector('.header-home-content');
    const genericContent = document.querySelector('.header-generic-content');
    const genericTitle = document.getElementById('headerGenericTitle');

    if (header && homeContent && genericContent) {
      if (tabId === 'home') {
        header.style.display = 'block';
        header.className = 'app-header header-home';
        homeContent.style.display = 'flex';
        genericContent.style.display = 'none';
        document.body.classList.add('home-header-active');
        document.body.classList.remove('no-app-header');
      } else {
        header.style.display = 'none';
        homeContent.style.display = 'none';
        genericContent.style.display = 'none';
        document.body.classList.remove('home-header-active');
        document.body.classList.add('no-app-header');
      }
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
    const ids = ['headerCartBadgeHome','headerCartBadgeGeneric','bottomCartBadge',
                 'cartScreenHeaderBadge','offersScreenHeaderBadge','catScreenCartBadge',
                 'ordersScreenCartBadge','ordersTrackingCartBadge'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = count;
    });
  }


  // ==================== HOME SCREEN ====================
  function renderCategoriesScroll() {
    if (!categoriesScroll) return;
    const categories = getCategories();

    let html = categories.slice(0, 9).map(cat => `
      <div class="category-grid-item-new" onclick="window.filterHomeByCategory('${cat.name}')">
        <div class="category-grid-icon-wrap-new">
          <img src="${cat.image}" alt="${cat.name}" />
        </div>
        <span>${cat.name}</span>
      </div>
    `).join('');

    html += `
      <div class="category-grid-item-new" onclick="window.switchTab('categories')">
        <div class="category-grid-icon-wrap-new" style="background-color: var(--card-accent); display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" stroke-width="3" style="width: 20px; height: 20px;"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </div>
        <span>More</span>
      </div>
    `;
    categoriesScroll.innerHTML = html;
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
    } else {
      displayProducts = products.filter(p => p.isBestSeller);
    }

    let wishlist = [];
    try {
      const stored = localStorage.getItem('ishvara_wishlist');
      if (stored) wishlist = JSON.parse(stored);
    } catch(e) {}

    bestSellersRow.innerHTML = (filterTerm ? displayProducts : displayProducts.slice(0, 8)).map(product => {
      const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100);
      const isWishlisted = wishlist.includes(product.id);
      return `
        <div class="mobile-product-card" onclick="window.openProductDetails('${product.id}')">
          <div style="position: relative; width: 100%;">
            ${discountPercent > 0 ? `<span class="product-card-discount-badge">${discountPercent}% OFF</span>` : ''}
            <button class="wishlist-btn-card ${isWishlisted ? 'active' : ''}" onclick="event.stopPropagation(); window.toggleWishlist('${product.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 13px; height: 13px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <img src="${product.image}" alt="${product.name}" />
            <div class="p-name">${product.name}</div>
            <div class="product-card-rating">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 10px; height: 10px; color: var(--accent-gold);"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              <span>${product.rating || '4.5'} (${product.reviewsCount || '12'})</span>
            </div>
          </div>
          <div class="p-card-bottom">
            <div class="p-price-row">
              <span class="p-price">₹${product.price}</span>
              <span class="p-mrp">₹${product.mrp}</span>
            </div>
            <button class="mobile-add-btn gold" onclick="event.stopPropagation(); window.handleAddClick('${product.id}')">
              ADD
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

  // Global coupon copy handler — available on all tabs
  window.copyCouponCode = (code) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    window.showToast(`Code "${code}" copied! 🎉`);
  };

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

    // Sync cart badge on cat screen
    const catBadge = document.getElementById('catScreenCartBadge');
    if (catBadge) {
      const cart = getCart();
      catBadge.textContent = cart.reduce((t, i) => t + i.quantity, 0);
    }

    // Color palette for count pills — cycles through per category
    const pillColors = [
      { bg: '#EDE9FE', text: '#6D4FD6' },
      { bg: '#FEF9C3', text: '#B45309' },
      { bg: '#DCFCE7', text: '#15803D' },
      { bg: '#DBEAFE', text: '#1D4ED8' },
      { bg: '#FCE7F3', text: '#9D174D' },
      { bg: '#FEF3C7', text: '#92400E' },
    ];

    // Arrow circle colors cycling
    const arrowColors = ['#6D4FD6', '#D97706', '#15803D', '#1D4ED8', '#9D174D', '#92400E'];

    const renderGrid = (filterTerm = '') => {
      let filtered = categories;
      if (filterTerm) {
        filtered = categories.filter(c => c.name.toLowerCase().includes(filterTerm.toLowerCase()));
      }

      const pastels = ['#F5F3FF', '#FEF9C3', '#DCFCE7', '#DBEAFE', '#FCE7F3', '#FEF3C7'];

      container.innerHTML = filtered.map((cat, index) => {
        const imgBg = pastels[index % pastels.length];
        const pill = pillColors[index % pillColors.length];
        const arrowColor = arrowColors[index % arrowColors.length];
        const catProducts = products.filter(p => p.category === cat.name);
        const count = catProducts.length || (24 + index * 30);
        return `
          <div onclick="window.filterHomeByCategory('${cat.name}')" style="background:white; border-radius:16px; padding:14px 12px 36px; display:flex; flex-direction:column; align-items:center; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.06); border:1px solid #F1F5F9; position:relative; cursor:pointer; transition:transform 0.2s;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'">
            <div style="background:${imgBg}; width:76px; height:76px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:10px;">
              <img src="${cat.image}" alt="${cat.name}" style="width:56px; height:56px; object-fit:contain;" />
            </div>
            <h4 style="font-size:12px; font-weight:700; color:var(--text-primary); margin:0 0 8px; font-family:var(--font-display); line-height:1.3;">${cat.name}</h4>
            <div style="font-size:9px; font-weight:700; color:${pill.text}; background:${pill.bg}; padding:3px 8px; border-radius:10px;">${count} Products</div>
            <div style="position:absolute; bottom:10px; right:10px; width:26px; height:26px; border-radius:50%; background:${pill.bg}; display:flex; align-items:center; justify-content:center; color:${arrowColor};">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </div>
        `;
      }).join('');
      container.style.cssText = 'display:grid; grid-template-columns:repeat(3,1fr); gap:12px; padding:8px 16px 16px;';
    };

    renderGrid();

    // Search
    const catSearch = document.getElementById('catSearchInput');
    if (catSearch) {
      // remove old listener by cloning
      const newInput = catSearch.cloneNode(true);
      catSearch.parentNode.replaceChild(newInput, catSearch);
      newInput.addEventListener('input', (e) => renderGrid(e.target.value));
    }
  }


  // ==================== OFFERS SCREEN ====================
  function renderOffersScreen() {
    const container = document.getElementById('couponListContainer');
    if (!container) return;

    const offers = [
      {
        code: "FIRST15",
        title: "Flat 15% OFF",
        desc: "Valid on your first boutique checkouts",
        date: "Valid till 31 May 2024",
        grad: "linear-gradient(135deg, #7B5FE0, #C4B5FD)",
        sash: "Best Seller",
        sashBg: "#6D4FD6",
        copyColor: "#6D4FD6",
        btnBg: "var(--accent-purple)",
        dateColor: "var(--accent-purple)",
        icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 2.5 C13 2 13.8 2 14.3 2.5 L21.5 9.7 C22 10.2 22 11 21.5 11.5 L11.5 21.5 C11 22 10.2 22 9.7 21.5 L2.5 14.3 C2 13.8 2 13 2.5 12.5 Z" fill="#FFE082" />
          <path d="M11 4 L20 13 L13 20 L4 11 Z" fill="#FFC107" />
          <circle cx="7.5" cy="7.5" r="1.5" fill="#FFF" />
          <text x="12" y="15.5" fill="#FFF" font-size="9" font-weight="900" text-anchor="middle" font-family="sans-serif" transform="rotate(-45 12 15)">%</text>
        </svg>`
      },
      {
        code: "FREESHIP",
        title: "Free Shipping",
        desc: "No shipping cost on order sizes above ₹499",
        date: "Valid till 31 May 2024",
        grad: "linear-gradient(135deg, #F59E0B, #FDE68A)",
        sash: "Free Delivery",
        sashBg: "#D97706",
        copyColor: "#D97706",
        btnBg: "#F59E0B",
        dateColor: "#D97706",
        icon: `<svg width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="6" width="13" height="9" rx="1.5" fill="#FFE082" />
          <rect x="3" y="7" width="11" height="7" rx="0.5" fill="#FFB300" />
          <path d="M15 8 H19 L22 11 V15 H15 Z" fill="#FFA000" />
          <polygon points="18,9 21,11 18,11" fill="#FFF" opacity="0.6" />
          <circle cx="6" cy="17" r="2.5" fill="#374151" stroke="#FFF" stroke-width="1" />
          <circle cx="16" cy="17" r="2.5" fill="#374151" stroke="#FFF" stroke-width="1" />
          <circle cx="6" cy="17" r="0.8" fill="#FFF" />
          <circle cx="16" cy="17" r="0.8" fill="#FFF" />
        </svg>`
      },
      {
        code: "FESTIVE10",
        title: "Festive Save 10%",
        desc: "Extra 10% instant discount up to ₹250",
        date: "Valid till 31 May 2024",
        grad: "linear-gradient(135deg, #10B981, #A7F3D0)",
        sash: "Limited Time",
        sashBg: "#059669",
        copyColor: "#059669",
        btnBg: "#10B981",
        dateColor: "#059669",
        icon: `<svg width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2 L14 4 L16.5 3.5 L17.5 5.5 L20 6 L20 8.5 L21.5 10 L20.5 12.2 L21.5 14.5 L20 16 L20 18.5 L17.5 19 L16.5 21 L14 20.5 L12 22 L10 20.5 L7.5 21 L6.5 19 L4 18.5 L4 16 L2.5 14.5 L3.5 12.2 L2.5 10 L4 8.5 L4 6 L6.5 5.5 L7.5 3.5 L10 4 Z" fill="#A7F3D0" />
          <circle cx="12" cy="12" r="7" fill="#10B981" />
          <text x="12" y="15" fill="#FFF" font-size="9" font-weight="900" text-anchor="middle" font-family="sans-serif">%</text>
        </svg>`
      },
      {
        code: "IESVRAPLUS",
        title: "IESVRA Plus",
        isPlus: true,
        desc: "Buy 3 items or more to unlock Plus member perks",
        date: "Valid Membership",
        grad: "linear-gradient(135deg, #4F46E5, #C7D2FE)",
        sash: "Member Only",
        sashBg: "#4338CA",
        copyColor: "#4338CA",
        btnBg: "#4F46E5",
        dateColor: "#4338CA",
        icon: `<svg width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 18 L4 10 L8 14 L12 6 L16 14 L20 10 L22 18 Z" fill="#FCD34D" />
          <path d="M4 18 L5.5 11 L8.5 14 L12 7 L15.5 14 L18.5 11 L20 18 Z" fill="#F59E0B" />
          <rect x="2" y="18" width="20" height="2.5" rx="1" fill="#D97706" />
          <circle cx="2" cy="10" r="1" fill="#FFF" />
          <circle cx="8" cy="14" r="1" fill="#FFF" />
          <circle cx="12" cy="6" r="1.2" fill="#FFF" />
          <circle cx="16" cy="14" r="1" fill="#FFF" />
          <circle cx="22" cy="10" r="1" fill="#FFF" />
        </svg>`
      }
    ];

    container.innerHTML = offers.map(coupon => `
      <div class="coupon-ticket-new" style="display: flex; margin: 0 16px; height: 110px; background: white; border-radius: 16px; box-shadow: var(--shadow-premium); overflow: hidden; position: relative;">
        <div class="coupon-left-new" style="width: 85px; display: flex; align-items: center; justify-content: center; background: ${coupon.grad};">
          ${coupon.icon}
        </div>
        
        <div class="coupon-right-new" style="flex: 1; display: flex; padding: 12px 16px; position: relative; overflow: hidden;">
          <div class="coupon-details-new" style="flex: 1.3; display: flex; flex-direction: column; justify-content: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <h4 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0;">${coupon.title}</h4>
              ${coupon.isPlus ? `<span style="background: #6366F1; color: white; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; text-transform: uppercase;">Plus</span>` : ''}
            </div>
            <p style="font-size: 10px; color: var(--text-muted); margin: 4px 0 8px 0; line-height: 1.3;">${coupon.desc}</p>
            <div style="font-size: 9px; font-weight: 700; color: ${coupon.dateColor}; display: flex; align-items: center; gap: 4px;">
              ${coupon.isPlus ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2 L2 7 L12 12 L22 7 Z M2 17 L12 22 L22 17"/></svg>' : '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'}
              ${coupon.date}
            </div>
          </div>
          
          <div style="width: 1px; border-left: 1.5px dashed #E2E8F0; margin: 4px 0; position: relative;">
            <div style="content: ''; position: absolute; top: -20px; left: -9px; width: 16px; height: 16px; border-radius: 50%; background: #f8f9fa; z-index: 3;"></div>
            <div style="content: ''; position: absolute; bottom: -20px; left: -9px; width: 16px; height: 16px; border-radius: 50%; background: #f8f9fa; z-index: 3;"></div>
          </div>
          
          <div class="coupon-actions-new" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-left: 8px; position: relative;">
            <div class="coupon-sash-new" style="position: absolute; top: 8px; right: -25px; background: ${coupon.sashBg}; color: white; font-size: 6px; font-weight: 900; padding: 2px 24px; transform: rotate(45deg); text-transform: uppercase; letter-spacing: 0.05em;">${coupon.sash}</div>
            <button onclick="window.copyCouponCode('${coupon.code}')" class="coupon-code-pill-new" style="background: ${coupon.btnBg}; color: white; border: 1.5px dashed rgba(255,255,255,0.7); border-radius: 8px; padding: 6px 0; font-size: 11px; font-weight: 800; width: 85%; margin-bottom: 6px; cursor: pointer; text-align: center;">${coupon.code}</button>
            <div onclick="window.copyCouponCode('${coupon.code}')" style="font-size: 9px; font-weight: 800; color: ${coupon.copyColor}; display: flex; align-items: center; gap: 3px; cursor: pointer; text-transform: uppercase;">
              Copy Code
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </div>
          </div>
        </div>
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
        <!-- Rounded Card container -->
        <div style="background: white; border-radius: 24px; padding: 24px; text-align: center; border: 1.5px solid #F1F3F7; box-shadow: var(--shadow-premium); display: flex; flex-direction: column; align-items: center; margin-top: 10px; margin-bottom: 20px;">
          <!-- 3D Illustration Graphic (SVG vector cart + bag + plane) -->
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 12px;">
            <!-- Dotted path for paper airplane -->
            <path d="M120 70 C140 60 160 55 170 50 C155 70 145 90 140 100" stroke="#CBC5EA" stroke-width="1.5" stroke-dasharray="3 3" stroke-linecap="round"/>
            <!-- Paper airplane -->
            <g transform="translate(145, 45) rotate(-15)">
              <polygon points="0,0 24,10 8,14" fill="#6D4FD6" />
              <polygon points="0,0 8,14 6,20" fill="#5A3EB2" />
              <polygon points="8,14 24,10 6,20" fill="#8B70EC" />
            </g>
            <!-- Shadows under wheels -->
            <ellipse cx="85" cy="170" rx="14" ry="4" fill="#E2E8F0" />
            <ellipse cx="120" cy="170" rx="14" ry="4" fill="#E2E8F0" />
            <ellipse cx="102" cy="172" rx="35" ry="6" fill="#F1F3F7" />
            
            <!-- Shopping Cart Body -->
            <path d="M60 90 H136 L124 140 H68 Z" fill="rgba(109, 79, 214, 0.08)" stroke="#6D4FD6" stroke-width="3.5" stroke-linejoin="round"/>
            <!-- Basket grid lines -->
            <line x1="72" y1="90" x2="76" y2="140" stroke="#8B70EC" stroke-width="2"/>
            <line x1="88" y1="90" x2="88" y2="140" stroke="#8B70EC" stroke-width="2"/>
            <line x1="104" y1="90" x2="100" y2="140" stroke="#8B70EC" stroke-width="2"/>
            <line x1="120" y1="90" x2="112" y2="140" stroke="#8B70EC" stroke-width="2"/>
            <line x1="60" y1="105" x2="132" y2="105" stroke="#8B70EC" stroke-width="2"/>
            <line x1="62" y1="122" x2="128" y2="122" stroke="#8B70EC" stroke-width="2"/>
            
            <!-- Cart Handle and Frame -->
            <path d="M50 78 C55 78 58 84 60 90 L68 140 L124 140" stroke="#6D4FD6" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M48 78 H58" stroke="#FFBE1A" stroke-width="5" stroke-linecap="round"/>
            <!-- Bottom support -->
            <path d="M68 140 L76 160 H124" stroke="#6D4FD6" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M124 140 L120 160" stroke="#6D4FD6" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
            
            <!-- Wheels -->
            <circle cx="76" cy="165" r="7" fill="#6D4FD6" stroke="#fff" stroke-width="2.5"/>
            <circle cx="76" cy="165" r="2" fill="#fff"/>
            <circle cx="120" cy="165" r="7" fill="#6D4FD6" stroke="#fff" stroke-width="2.5"/>
            <circle cx="120" cy="165" r="2" fill="#fff"/>

            <!-- Purple Shopping Bag with Gold V logo inside cart -->
            <g transform="translate(80, 68) rotate(3)">
              <path d="M12 18 C12 6 28 6 28 18" stroke="#FFBE1A" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M16 18 C16 9 24 9 24 18" stroke="#E2C044" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <rect x="5" y="16" width="30" height="38" rx="5" fill="#6D4FD6" />
              <path d="M14 26 L20 35 L26 26" stroke="#FFBE1A" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            </g>
            
            <!-- Sparkles -->
            <g transform="translate(48, 120)"><path d="M0,4 L4,0 L8,4 L4,8 Z" fill="#FFBE1A"/></g>
            <g transform="translate(155, 110)"><path d="M0,3 L3,0 L6,3 L3,6 Z" fill="#FFBE1A"/></g>
            <g transform="translate(52, 60)"><path d="M0,3 L3,0 L6,3 L3,6 Z" fill="#8B70EC"/></g>
          </svg>
          
          <h2 style="color: var(--text-primary); font-family: var(--font-display); font-size: 24px; font-weight: 800; margin: 0 0 10px 0;">Your Cart is <span style="color: var(--accent-purple);">Empty</span></h2>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 250px; line-height: 1.5; margin: 0 0 24px 0;">Looks like you haven't added anything yet.<br>Explore our premium products and add them to your cart.</p>
          
          <!-- Continue Shopping Button with shopping bag icon -->
          <button onclick="window.switchTab('categories')" style="background: linear-gradient(135deg, #6D4FD6, #5B21B6); color: white; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; font-weight: 700; border: none; padding: 12px 28px; border-radius: 16px; cursor: pointer; width: auto; box-shadow: 0 4px 15px rgba(109, 79, 214, 0.2);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Continue Shopping
          </button>
        </div>

        <!-- 4 Column Badges Row -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 16px 0; border-top: 1.5px solid #F1F3F7; border-bottom: 1.5px solid #F1F3F7; margin-bottom: 24px;">
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div style="background: rgba(109, 79, 214, 0.08); color: var(--accent-purple); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div style="font-size: 9px; font-weight: 700; color: var(--text-primary); line-height: 1.2;">100% Secure<br>Payments</div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div style="background: rgba(255, 190, 26, 0.1); color: var(--accent-gold); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div style="font-size: 9px; font-weight: 700; color: var(--text-primary); line-height: 1.2;">Best Quality<br>Products</div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div style="background: rgba(109, 79, 214, 0.08); color: var(--accent-purple); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </div>
            <div style="font-size: 9px; font-weight: 700; color: var(--text-primary); line-height: 1.2;">Easy Returns<br>& Refunds</div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div style="background: rgba(255, 190, 26, 0.1); color: var(--accent-gold); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </div>
            <div style="font-size: 9px; font-weight: 700; color: var(--text-primary); line-height: 1.2;">24/7 Customer<br>Support</div>
          </div>
        </div>

        <!-- You May Like Section with 4 columns -->
        <div style="margin-bottom: 80px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0;">You May Like</h3>
            <a href="#" onclick="window.switchTab('home')" style="color: var(--accent-purple); font-size: 12px; font-weight: 700; text-decoration: none; display: flex; align-items: center; gap: 2px;">
              View All
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
            </a>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
            <!-- Wireless Headphones -->
            <div style="background: white; border: 1px solid var(--border-color); border-radius: 12px; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
              <button onclick="showToast('Added to Wishlist!')" style="position: absolute; top: 4px; right: 4px; background: none; border: none; padding: 2px; color: #718096; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
              <img src="/products/wireless-headphones.jpg" alt="Wireless Headphones" style="width: 100%; height: 50px; object-fit: contain; margin-bottom: 6px;" />
              <div style="font-size: 9px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">Wireless Headphones</div>
              <div style="font-size: 8px; color: #d97706; font-weight: bold; margin-bottom: 4px;">★ 4.6</div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
                <span style="font-size: 10px; font-weight: 800; color: var(--text-primary);">₹1,299</span>
                <button onclick="window.handleAddClick('prod-headphones')" style="background: rgba(109, 79, 214, 0.08); color: var(--accent-purple); border: none; width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
                </button>
              </div>
            </div>

            <!-- Smart Watch -->
            <div style="background: white; border: 1px solid var(--border-color); border-radius: 12px; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
              <button onclick="showToast('Added to Wishlist!')" style="position: absolute; top: 4px; right: 4px; background: none; border: none; padding: 2px; color: #718096; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
              <img src="/products/smart-watch.jpg" alt="Smart Watch" style="width: 100%; height: 50px; object-fit: contain; margin-bottom: 6px;" />
              <div style="font-size: 9px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">Smart Watch</div>
              <div style="font-size: 8px; color: #d97706; font-weight: bold; margin-bottom: 4px;">★ 4.5</div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
                <span style="font-size: 10px; font-weight: 800; color: var(--text-primary);">₹2,499</span>
                <button onclick="window.handleAddClick('prod-watch')" style="background: rgba(109, 79, 214, 0.08); color: var(--accent-purple); border: none; width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
                </button>
              </div>
            </div>

            <!-- Water Bottle -->
            <div style="background: white; border: 1px solid var(--border-color); border-radius: 12px; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
              <button onclick="showToast('Added to Wishlist!')" style="position: absolute; top: 4px; right: 4px; background: none; border: none; padding: 2px; color: #718096; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
              <img src="/products/water-bottle.jpg" alt="Water Bottle" style="width: 100%; height: 50px; object-fit: contain; margin-bottom: 6px;" />
              <div style="font-size: 9px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">Water Bottle</div>
              <div style="font-size: 8px; color: #d97706; font-weight: bold; margin-bottom: 4px;">★ 4.7</div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
                <span style="font-size: 10px; font-weight: 800; color: var(--text-primary);">₹399</span>
                <button onclick="window.handleAddClick('prod-bottle')" style="background: rgba(109, 79, 214, 0.08); color: var(--accent-purple); border: none; width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
                </button>
              </div>
            </div>

            <!-- Decorative Plant -->
            <div style="background: white; border: 1px solid var(--border-color); border-radius: 12px; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
              <button onclick="showToast('Added to Wishlist!')" style="position: absolute; top: 4px; right: 4px; background: none; border: none; padding: 2px; color: #718096; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
              <img src="/products/decorative-plant.jpg" alt="Decorative Plant" style="width: 100%; height: 50px; object-fit: contain; margin-bottom: 6px;" />
              <div style="font-size: 9px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">Decorative Plant</div>
              <div style="font-size: 8px; color: #d97706; font-weight: bold; margin-bottom: 4px;">★ 4.4</div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
                <span style="font-size: 10px; font-weight: 800; color: var(--text-primary);">₹299</span>
                <button onclick="window.handleAddClick('prod-plant')" style="background: rgba(109, 79, 214, 0.08); color: var(--accent-purple); border: none; width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
                </button>
              </div>
            </div>
          </div>
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
        <span style="color: var(--accent-purple);">-₹${savings}</span>
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

    // Sync elements inside the Blinkit/Zomato style sticky bottom bar
    const stickyTotal = document.getElementById('checkoutStickyTotalAmount');
    if (stickyTotal) stickyTotal.textContent = `₹${checkoutTotal}`;

    const stickyPayTitle = document.getElementById('checkoutStickyPaymentTitle');
    if (stickyPayTitle) {
      stickyPayTitle.textContent = checkoutPaymentMode === 'razorpay' ? 'PhonePe UPI' : 'Cash on Delivery';
    }

    const stickyAddressText = document.getElementById('checkoutStickyAddressText');
    if (stickyAddressText) {
      const addr1 = document.getElementById('checkoutAddress1')?.value || '';
      const addr2 = document.getElementById('checkoutAddress2')?.value || '';
      const fullAddr = [addr1, addr2].filter(Boolean).join(', ') || 'Enter delivery address';
      stickyAddressText.textContent = fullAddr;
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
      if (a1) {
        a1.addEventListener('input', () => window.updateCheckoutSummary());
      }
      if (a2) {
        a2.addEventListener('input', () => window.updateCheckoutSummary());
      }
      window.initAppCheckoutMap();
    }, 100);
  };

  window.submitCheckoutOrder = () => {
    const name = document.getElementById('checkoutName')?.value?.trim();
    const email = document.getElementById('checkoutEmail')?.value?.trim();
    const phone = document.getElementById('checkoutPhone')?.value?.trim();
    const addr1 = document.getElementById('checkoutAddress1')?.value?.trim();
    const city = document.getElementById('checkoutCity')?.value?.trim();
    const state = document.getElementById('checkoutState')?.value?.trim();
    const pincode = document.getElementById('checkoutPincode')?.value?.trim();

    // Validate required fields
    if (!name || !phone || !addr1 || !city || !pincode) {
      showToast('Please fill in all required fields (Name, Phone, Address, City, PIN).');
      return;
    }

    // Save shipping info for future use
    localStorage.setItem('IESVRA_shipping_name', name);
    if (email) localStorage.setItem('IESVRA_shipping_email', email);
    localStorage.setItem('IESVRA_shipping_phone', phone);
    localStorage.setItem('IESVRA_delivery_address_line1', addr1);
    localStorage.setItem('IESVRA_delivery_address_line2', document.getElementById('checkoutAddress2')?.value?.trim() || '');
    localStorage.setItem('IESVRA_delivery_city', city);
    localStorage.setItem('IESVRA_delivery_state', state || '');
    localStorage.setItem('IESVRA_delivery_pincode', pincode);

    const cart = getCart();
    if (cart.length === 0) {
      showToast('Your cart is empty!');
      return;
    }

    // Create order record
    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
    const order = {
      id: orderId,
      orderId: orderId,
      items: [...cart],
      itemsCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: checkoutSubtotal,
      shipping: checkoutShippingFee,
      total: checkoutTotal,
      amount: checkoutTotal,
      deliverySpeed: checkoutDeliverySpeed,
      paymentMode: checkoutPaymentMode,
      address: { name, email, phone, addr1, addr2: document.getElementById('checkoutAddress2')?.value?.trim() || '', city, state, pincode },
      status: 'Placed',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      placedAt: new Date().toISOString(),
    };

    // Save order to localStorage
    let orders = [];
    try {
      const stored = localStorage.getItem('iesvra_orders');
      if (stored) orders = JSON.parse(stored);
    } catch(e) {}
    orders.unshift(order);
    localStorage.setItem('iesvra_orders', JSON.stringify(orders));

    // Clear cart
    saveCart([]);
    updateCartBadges();

    if (checkoutPaymentMode === 'razorpay') {
      showToast(`Order ${orderId} placed! Simulating Razorpay payment of ₹${checkoutTotal}...`);
      setTimeout(() => {
        showToast('✅ Payment successful! Your order is confirmed.');
        switchTab('orders');
      }, 1500);
    } else {
      showToast(`✅ COD Order ${orderId} placed successfully! Total: ₹${checkoutTotal}`);
      switchTab('orders');
    }
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

    const statusColors = { 'Placed': '#D97706', 'Confirmed': '#6D4FD6', 'Packed': '#1D4ED8', 'Out for Delivery': '#0369A1', 'Delivered': '#059669', 'Cancelled': '#DC2626' };

    listContainer.innerHTML = orders.slice().reverse().map(order => {
      const color = statusColors[order.status] || '#6D4FD6';
      const statusBg = order.status === 'Cancelled' ? '#FEE2E2' : order.status === 'Delivered' ? '#DCFCE7' : '#EDE9FE';
      return `
      <div class="order-card-new">
        <div class="order-card-new-header">
          <div>
            <div style="font-size:11px; color:var(--text-muted); font-weight:600;">ORDER ID</div>
            <div style="font-size:13px; font-weight:800; color:var(--text-primary); font-family:var(--font-display);">${order.orderId}</div>
          </div>
          <span style="background:${statusBg}; color:${color}; font-size:10px; font-weight:800; padding:4px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.05em;">${order.status}</span>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; padding-top:12px; border-top:1px solid #F1F5F9;">
          <div>
            <div style="font-size:18px; font-weight:900; color:var(--text-primary); font-family:var(--font-display);">₹${order.amount}</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${order.itemsCount} item${order.itemsCount > 1 ? 's' : ''} · ${order.date}</div>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            ${(order.status === 'Placed' || order.status === 'Confirmed') ? `<button onclick="window.cancelMobileOrder('${order.orderId}')" style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; border-radius:10px; padding:8px 12px; font-size:11px; font-weight:800; cursor:pointer;">Cancel</button>` : ''}
            <button onclick="window.trackMobileOrder('${order.orderId}')" style="background:var(--accent-purple); color:white; border:none; border-radius:10px; padding:10px 16px; font-size:12px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:5px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Track Order
            </button>
          </div>
        </div>
      </div>
      `;
    }).join('');
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
    const stepPlaced = document.getElementById('step-placed');
    const stepConfirmed = document.getElementById('step-confirmed');
    const stepPacked = document.getElementById('step-packed');
    const stepTransit = document.getElementById('step-transit');
    const stepDelivered = document.getElementById('step-delivered');
    const btnCancel = document.getElementById('trackingCancelBtn');

    // Update Est Delivery Date
    const placedDate = new Date(order.placedAt || Date.now());
    placedDate.setDate(placedDate.getDate() + 4);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const estDateText = placedDate.toLocaleDateString('en-IN', options);
    const trackEstDate = document.getElementById('trackEstDate');
    if (trackEstDate) trackEstDate.textContent = estDateText;

    const fill = document.getElementById('trackProgressFill');
    const nodeWarehouse = document.getElementById('node-warehouse');
    const nodeTransit = document.getElementById('node-transit');
    const nodeHome = document.getElementById('node-home');

    function updateHorizontalBar(status) {
      if (!fill) return;
      if (nodeWarehouse) nodeWarehouse.classList.remove('active');
      if (nodeTransit) nodeTransit.classList.remove('active');
      if (nodeHome) nodeHome.classList.remove('active');

      if (status === 'Placed' || status === 'placed') {
        fill.style.width = '0%';
        if (nodeWarehouse) nodeWarehouse.classList.add('active');
      } else if (status === 'Confirmed') {
        fill.style.width = '25%';
        if (nodeWarehouse) nodeWarehouse.classList.add('active');
      } else if (status === 'Packed') {
        fill.style.width = '50%';
        if (nodeWarehouse) nodeWarehouse.classList.add('active');
        if (nodeTransit) nodeTransit.classList.add('active');
      } else if (status === 'Out for Delivery') {
        fill.style.width = '75%';
        if (nodeWarehouse) nodeWarehouse.classList.add('active');
        if (nodeTransit) nodeTransit.classList.add('active');
      } else if (status === 'Delivered') {
        fill.style.width = '100%';
        if (nodeWarehouse) nodeWarehouse.classList.add('active');
        if (nodeTransit) nodeTransit.classList.add('active');
        if (nodeHome) nodeHome.classList.add('active');
      }
    }

    // Reset status steps visual styling
    const steps = [stepPlaced, stepConfirmed, stepPacked, stepTransit, stepDelivered];
    steps.forEach(s => {
      if (s) s.classList.remove('completed');
    });

    // If already Cancelled, show visual indication instead
    if (order.status === "Cancelled") {
      if (btnCancel) btnCancel.style.display = 'none';
      return;
    }

    // Step 1: Placed (Immediate)
    if (stepPlaced) stepPlaced.classList.add('completed');
    updateHorizontalBar('Placed');

    // Step 2: Confirmed (1.5s)
    setTimeout(() => {
      const orders = JSON.parse(localStorage.getItem('iesvra_orders') || '[]');
      const currentOrder = orders.find(o => o.orderId === order.orderId);
      if (currentOrder && currentOrder.status === "Cancelled") return;

      if (stepConfirmed) stepConfirmed.classList.add('completed');
      updateOrderLiveStatus(order.orderId, "Confirmed");
      updateHorizontalBar('Confirmed');
    }, 1500);

    // Step 3: Packed (3s)
    setTimeout(() => {
      const orders = JSON.parse(localStorage.getItem('iesvra_orders') || '[]');
      const currentOrder = orders.find(o => o.orderId === order.orderId);
      if (currentOrder && currentOrder.status === "Cancelled") return;

      if (stepPacked) stepPacked.classList.add('completed');
      updateOrderLiveStatus(order.orderId, "Packed");
      updateHorizontalBar('Packed');
      if (btnCancel) btnCancel.style.display = 'none'; // Can't cancel after packed
    }, 3000);

    // Step 4: Out for Delivery (4.5s)
    setTimeout(() => {
      const orders = JSON.parse(localStorage.getItem('iesvra_orders') || '[]');
      const currentOrder = orders.find(o => o.orderId === order.orderId);
      if (currentOrder && currentOrder.status === "Cancelled") return;

      if (stepTransit) stepTransit.classList.add('completed');
      updateOrderLiveStatus(order.orderId, "Out for Delivery");
      updateHorizontalBar('Out for Delivery');
    }, 4500);

    // Step 5: Delivered (7.5s)
    setTimeout(() => {
      const orders = JSON.parse(localStorage.getItem('iesvra_orders') || '[]');
      const currentOrder = orders.find(o => o.orderId === order.orderId);
      if (currentOrder && currentOrder.status === "Cancelled") return;

      if (stepDelivered) stepDelivered.classList.add('completed');
      updateOrderLiveStatus(order.orderId, "Delivered");
      updateHorizontalBar('Delivered');
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
      
      const savedLat = localStorage.getItem('iesvra_lat');
      const savedLng = localStorage.getItem('iesvra_lng');
      let initialLat = savedLat ? parseFloat(savedLat) : 25.5941; // Patna default
      let initialLng = savedLng ? parseFloat(savedLng) : 85.1376;
      
      if (savedLat && savedLng) {
        setupMobileMap(L, initialLat, initialLng);
      } else if (navigator.geolocation) {
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

  // Location Picker Modal Functions
  window.openLocationPicker = () => {
    const overlay = document.getElementById('locationPickerOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.offsetHeight; // Force reflow
      overlay.classList.add('active');
    }
  };

  window.closeLocationPicker = () => {
    const overlay = document.getElementById('locationPickerOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
    }
  };

  window.selectCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser");
      return;
    }
    showToast("Detecting your location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
          if (!res.ok) throw new Error("Failed to reverse geocode");
          const data = await res.json();
          const address = data?.results?.[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          
          const activeAddressLabel = document.getElementById('activeAddressLabel');
          if (activeAddressLabel) {
            activeAddressLabel.textContent = address;
          }
          const checkoutAddr1 = document.getElementById('checkoutAddress1');
          if (checkoutAddr1) {
            checkoutAddr1.value = address;
          }
          
          // Save coordinates for the checkout map
          localStorage.setItem('iesvra_lat', lat);
          localStorage.setItem('iesvra_lng', lng);
          
          showToast("Location updated successfully!");
          window.updateCheckoutSummary();
          window.closeLocationPicker();
        } catch (e) {
          console.error("Reverse geocoding error:", e);
          showToast("Failed to fetch address details. Please search manually.");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        showToast("Unable to retrieve location. Please search manually.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Setup search suggestions inside location picker
  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('locationSearchInput');
    const container = document.getElementById('locationSuggestionsContainer');
    if (!searchInput || !container) return;

    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const query = searchInput.value.trim();
      if (query.length < 3) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/address-suggestions?query=${encodeURIComponent(query)}`);
          if (!res.ok) throw new Error("Autocomplete API failed");
          const data = await res.json();
          const predictions = data?.predictions || [];
          
          if (predictions.length === 0) {
            container.innerHTML = '<div style="padding: 10px; font-size: 13px; color: var(--text-muted);">No suggestions found</div>';
            container.style.display = 'block';
            return;
          }

          container.innerHTML = predictions.map(pred => `
            <div class="suggestion-item" style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; cursor: pointer; font-size: 13px; color: var(--text-primary);" onclick="window.selectSuggestedLocation('${pred.description.replace(/'/g, "\\'")}', ${pred.geometry?.location?.lat || 'null'}, ${pred.geometry?.location?.lng || 'null'})">
              <div style="font-weight: bold; margin-bottom: 2px;">${pred.structured_formatting?.main_text || pred.description.split(',')[0]}</div>
              <div style="font-size: 11px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${pred.description}</div>
            </div>
          `).join('');
          container.style.display = 'block';
        } catch (e) {
          console.error("Failed to fetch address suggestions:", e);
        }
      }, 300);
    });
  });

  window.selectSuggestedLocation = (description, lat, lng) => {
    const activeAddressLabel = document.getElementById('activeAddressLabel');
    if (activeAddressLabel) {
      activeAddressLabel.textContent = description;
    }
    const checkoutAddr1 = document.getElementById('checkoutAddress1');
    if (checkoutAddr1) {
      checkoutAddr1.value = description;
    }
    if (lat && lng) {
      localStorage.setItem('iesvra_lat', lat);
      localStorage.setItem('iesvra_lng', lng);
    }
    showToast("Address selected!");
    window.updateCheckoutSummary();
    window.closeLocationPicker();
    
    // Clear suggestion container
    const container = document.getElementById('locationSuggestionsContainer');
    const searchInput = document.getElementById('locationSearchInput');
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
    }
    if (searchInput) {
      searchInput.value = '';
    }
  };

  window.selectSavedAddress = (label) => {
    const activeAddressLabel = document.getElementById('activeAddressLabel');
    if (activeAddressLabel) {
      activeAddressLabel.textContent = label + " - New Jaganpura, Patna";
    }
    const checkoutAddr1 = document.getElementById('checkoutAddress1');
    if (checkoutAddr1) {
      checkoutAddr1.value = "New Jaganpura Jagdish Chauk Atal Vihar Colony, Ramkrishan Nagar, Patna";
    }
    showToast(`Selected address: ${label}`);
    window.updateCheckoutSummary();
    window.closeLocationPicker();
  };

  window.addNewAddressAction = () => {
    showToast("Opening address form...");
    window.closeLocationPicker();
    switchTab('checkout');
    setTimeout(() => {
      const checkoutAddress1 = document.getElementById('checkoutAddress1');
      if (checkoutAddress1) checkoutAddress1.focus();
    }, 400);
  };

  window.editAddressAction = (label) => {
    showToast(`Editing saved address: ${label}`);
  };

  window.shareAddressAction = (label) => {
    showToast(`Sharing address: ${label}`);
  };

  window.toggleWishlist = (productId) => {
    let wishlist = [];
    try {
      const stored = localStorage.getItem('ishvara_wishlist');
      if (stored) wishlist = JSON.parse(stored);
    } catch(e) {}

    const index = wishlist.indexOf(productId);
    if (index > -1) {
      wishlist.splice(index, 1);
      showToast("Removed from wishlist!");
    } else {
      wishlist.push(productId);
      showToast("Added to wishlist!");
    }
    localStorage.setItem('ishvara_wishlist', JSON.stringify(wishlist));
    
    // Toggle active class on matching heart buttons
    document.querySelectorAll(`.mobile-product-card[onclick*="${productId}"] .wishlist-btn-card`).forEach(btn => {
      btn.classList.toggle('active');
    });
  };
})();
