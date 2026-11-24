(function () {
  'use strict';

  /* ==========================================================
     WISHLY — Digital Wishlist Platform
     Main Application JavaScript
     ========================================================== */

  // ---- Storage Keys ----
  const KEYS = {
    products: 'wishly_products',
    categories: 'wishly_categories',
    users: 'wishly_users',
    currentUser: 'wishly_currentUser',
    wishlists: 'wishly_wishlists',
    cart: 'wishly_cart',
    orders: 'wishly_orders',
    reviews: 'wishly_reviews',
    initialized: 'wishly_initialized'
  };

  // ---- State ----
  let currentView = 'home';
  let selectedWishlistIndex = 0;
  let currentDetailProductId = null;
  let lastOrderId = null;

  // ---- Helpers ----
  function getData(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  }
  function setData(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }
  function getProducts() { return getData(KEYS.products) || []; }
  function getCategories() { return getData(KEYS.categories) || []; }
  function getUsers() { return getData(KEYS.users) || []; }
  function getCurrentUser() { return getData(KEYS.currentUser); }
  function setCurrentUser(u) { setData(KEYS.currentUser, u); }
  function getAllWishlists() { return getData(KEYS.wishlists) || {}; }
  function getUserWishlists(email) {
    const all = getAllWishlists();
    return all[email] || [];
  }
  function setUserWishlists(email, wls) {
    const all = getAllWishlists();
    all[email] = wls;
    setData(KEYS.wishlists, all);
  }
  function getAllCarts() { return getData(KEYS.cart) || {}; }
  function getUserCart(email) {
    const all = getAllCarts();
    return all[email] || [];
  }
  function setUserCart(email, cart) {
    const all = getAllCarts();
    all[email] = cart;
    setData(KEYS.cart, all);
  }
  function getOrders() { return getData(KEYS.orders) || []; }
  function getReviews() { return getData(KEYS.reviews) || []; }

  function formatPrice(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function generateStars(rating, interactive) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.3;
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= full) html += '<span class="star filled">★</span>';
      else if (i === full + 1 && half) html += '<span class="star filled">★</span>';
      else html += '<span class="star">☆</span>';
    }
    return html;
  }

  function generateOrderId() {
    const orders = getOrders();
    return 'WO-' + (1001 + orders.length);
  }

  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, arguments), ms);
    };
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function getStatusBadge(status) {
    const s = status.toLowerCase();
    return '<span class="status-badge status-badge--' + s + '">' + status + '</span>';
  }

  // ---- Seed Data ----
  var DATA_VERSION = 2;
  function initializeData() {
    if (getData(KEYS.initialized) === DATA_VERSION) return;
    // Clear old data on version change
    Object.values(KEYS).forEach(function (key) { localStorage.removeItem(key); });

    const products = [
      { id:1, name:'Wireless Noise-Canceling Headphones', image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', price:20999, category:'Electronics', description:'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and ultra-comfortable memory foam cushions. Crystal-clear audio for music lovers and professionals.', rating:4.8, availability:'in-stock', stock:15, featured:true, trending:true },
      { id:2, name:'Smart Watch Series X', image:'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop', price:33999, category:'Electronics', description:'Advanced fitness tracking with heart rate monitor, GPS, sleep analysis, and water resistance up to 50 meters. Your complete health companion.', rating:4.6, availability:'in-stock', stock:8, featured:true, trending:false },
      { id:3, name:'Portable Bluetooth Speaker', image:'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop', price:6699, category:'Electronics', description:'Immersive 360-degree sound in a compact, waterproof design. 12-hour battery life, perfect for outdoor adventures.', rating:4.5, availability:'in-stock', stock:25, featured:false, trending:true },
      { id:4, name:'Mechanical Gaming Keyboard', image:'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop', price:13499, category:'Electronics', description:'Premium mechanical keyboard with Cherry MX switches, per-key RGB lighting, and a durable aluminum frame.', rating:4.7, availability:'low-stock', stock:3, featured:false, trending:false },
      { id:5, name:'Classic Leather Tote Bag', image:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop', price:15999, category:'Fashion', description:'Handcrafted full-grain leather tote with spacious interior, inner pockets, and a timeless design that never goes out of style.', rating:4.9, availability:'in-stock', stock:12, featured:true, trending:true },
      { id:6, name:'Merino Wool Scarf', image:'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=400&h=400&fit=crop', price:5799, category:'Fashion', description:'Ultra-soft temperature-regulating scarf made from ethically sourced Australian merino wool. Perfect for all seasons.', rating:4.4, availability:'in-stock', stock:20, featured:false, trending:false },
      { id:7, name:'Minimalist Analog Watch', image:'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop', price:10999, category:'Fashion', description:'Japanese quartz movement with sapphire crystal glass and genuine Italian leather strap. Timeless elegance.', rating:4.6, availability:'in-stock', stock:10, featured:false, trending:true },
      { id:8, name:'Silk Evening Dress', image:'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop', price:24999, category:'Fashion', description:'Hand-finished pure silk dress with flowing silhouette, elegant drape, and hidden zipper closure. Made for special occasions.', rating:4.8, availability:'low-stock', stock:4, featured:true, trending:false },
      { id:9, name:'Handcrafted Ceramic Vase', image:'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&h=400&fit=crop', price:7499, category:'Home & Living', description:'Artisan-made ceramic vase with unique glazed finish. Perfect as a decorative centerpiece for any room.', rating:4.5, availability:'in-stock', stock:18, featured:false, trending:false },
      { id:10, name:'Organic Cotton Throw Blanket', image:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop', price:9999, category:'Home & Living', description:'GOTS certified organic cotton blanket. Hypoallergenic, breathable, and wonderfully cozy for all seasons.', rating:4.7, availability:'in-stock', stock:14, featured:true, trending:true },
      { id:11, name:'Bamboo Desk Organizer', image:'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400&h=400&fit=crop', price:4199, category:'Home & Living', description:'Sustainable bamboo organizer with multiple compartments for a clean, productive workspace.', rating:4.3, availability:'in-stock', stock:30, featured:false, trending:false },
      { id:12, name:'Scented Soy Candle Set', image:'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&h=400&fit=crop', price:3299, category:'Home & Living', description:'Three-piece set of hand-poured soy wax candles with cotton wicks. Lavender, vanilla, and cedarwood scents.', rating:4.6, availability:'in-stock', stock:22, featured:false, trending:true },
      { id:13, name:'The Art of Mindful Living', image:'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop', price:1999, category:'Books', description:'Bestselling guide to mindfulness, meditation, and finding inner peace in an increasingly busy world.', rating:4.8, availability:'in-stock', stock:35, featured:true, trending:false },
      { id:14, name:'Modern Architecture Today', image:'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=400&fit=crop', price:3799, category:'Books', description:'Stunning coffee table book showcasing contemporary architectural masterpieces with beautiful photography.', rating:4.5, availability:'in-stock', stock:10, featured:false, trending:false },
      { id:15, name:'Gourmet Home Cooking', image:'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&h=400&fit=crop', price:2899, category:'Books', description:'Over 200 recipes from world-class chefs with step-by-step guides and stunning food photography.', rating:4.7, availability:'in-stock', stock:16, featured:false, trending:true },
      { id:16, name:'Digital Photography Masterclass', image:'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=400&fit=crop', price:2499, category:'Books', description:'Comprehensive guide from beginner to advanced techniques. Covers composition, lighting, and editing.', rating:4.4, availability:'in-stock', stock:20, featured:false, trending:false },
      { id:17, name:'Natural Skincare Gift Set', image:'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', price:6699, category:'Beauty', description:'Complete skincare routine: cleanser, toner, moisturizer, and serum. All-natural, cruelty-free ingredients.', rating:4.6, availability:'in-stock', stock:11, featured:true, trending:true },
      { id:18, name:'Artisan Perfume Collection', image:'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop', price:12499, category:'Beauty', description:'Five handcrafted fragrances made with essential oils. Travel-sized bottles in a luxury presentation box.', rating:4.8, availability:'in-stock', stock:7, featured:false, trending:false },
      { id:19, name:'Organic Lip Care Kit', image:'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop', price:2899, category:'Beauty', description:'Plant-based lip balm, sugar scrub, and overnight mask. Nourish and protect your lips naturally.', rating:4.3, availability:'in-stock', stock:28, featured:false, trending:false },
      { id:20, name:'Luxury Hair Care Bundle', image:'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&h=400&fit=crop', price:7499, category:'Beauty', description:'Premium sulfate-free shampoo, conditioner, and argan hair oil for silky, healthy hair.', rating:4.5, availability:'out-of-stock', stock:0, featured:false, trending:true },
      { id:21, name:'Titanium Card Holder', image:'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop', price:4999, category:'Accessories', description:'Ultra-slim RFID-blocking card holder in brushed titanium. Holds up to 12 cards securely.', rating:4.4, availability:'in-stock', stock:19, featured:false, trending:false },
      { id:22, name:'Polarized Sunglasses', image:'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop', price:10999, category:'Accessories', description:'UV400 protection with handcrafted acetate frames and premium polarized lenses for crystal-clear vision.', rating:4.7, availability:'in-stock', stock:13, featured:true, trending:true },
      { id:23, name:'Leather Journal Notebook', image:'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=400&fit=crop', price:3699, category:'Accessories', description:'Genuine leather cover with 200 lined pages and satin ribbon bookmark. Perfect for journaling and notes.', rating:4.6, availability:'in-stock', stock:17, featured:false, trending:false },
      { id:24, name:'Travel Organizer Pouch', image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', price:3299, category:'Accessories', description:'Water-resistant organizer with multiple pockets for cables, chargers, and travel essentials.', rating:4.2, availability:'in-stock', stock:24, featured:false, trending:false }
    ];

    const categories = ['Electronics', 'Fashion', 'Home & Living', 'Books', 'Beauty', 'Accessories'];

    const users = [
      { name: 'Demo User', email: 'demo@wishly.com', password: 'demo1234', role: 'user', joinDate: '2024-01-01T00:00:00Z' },
      { name: 'Admin User', email: 'admin@wishly.com', password: 'admin1234', role: 'admin', joinDate: '2024-01-01T00:00:00Z' }
    ];

    const reviews = [
      { id:1, productId:1, userEmail:'demo@wishly.com', userName:'Demo User', rating:5, text:'Absolutely incredible sound quality! The noise cancellation is top-notch and the comfort is unmatched.', date:'2024-01-10T14:30:00Z' },
      { id:2, productId:1, userEmail:'admin@wishly.com', userName:'Admin User', rating:4, text:'Great headphones, very comfortable for long listening sessions. Battery life is impressive.', date:'2024-01-15T09:20:00Z' },
      { id:3, productId:5, userEmail:'demo@wishly.com', userName:'Demo User', rating:5, text:'The leather quality is exceptional. Beautiful craftsmanship and worth every penny.', date:'2024-01-20T11:45:00Z' },
      { id:4, productId:10, userEmail:'demo@wishly.com', userName:'Demo User', rating:4, text:'So soft and cozy! Perfect for chilly evenings on the couch. Great quality organic cotton.', date:'2024-02-01T16:00:00Z' },
      { id:5, productId:13, userEmail:'demo@wishly.com', userName:'Demo User', rating:5, text:'This book changed my perspective on life. Beautifully written and deeply insightful. Highly recommend.', date:'2024-02-05T10:15:00Z' },
      { id:6, productId:17, userEmail:'demo@wishly.com', userName:'Demo User', rating:4, text:'Love the natural ingredients. My skin feels amazing after just one week of use.', date:'2024-02-10T13:30:00Z' },
      { id:7, productId:22, userEmail:'admin@wishly.com', userName:'Admin User', rating:5, text:'Best sunglasses I have ever owned. Crystal clear vision and incredibly stylish.', date:'2024-02-15T15:00:00Z' },
      { id:8, productId:3, userEmail:'demo@wishly.com', userName:'Demo User', rating:4, text:'Great speaker for the price. I take it everywhere — the waterproof feature is a lifesaver.', date:'2024-02-20T08:45:00Z' }
    ];

    const orders = [
      {
        id: 'WO-1001', userEmail: 'demo@wishly.com',
        items: [
          { productId:1, name:'Wireless Noise-Canceling Headphones', price:20999, quantity:1 },
          { productId:3, name:'Portable Bluetooth Speaker', price:6699, quantity:2 }
        ],
        customerInfo: { name:'Demo User', email:'demo@wishly.com', address:'42 MG Road, Bengaluru, Karnataka 560001', phone:'+91 98765 43210' },
        subtotal: 34397, total: 34397, status:'Completed', date:'2024-01-15T10:30:00Z'
      },
      {
        id: 'WO-1002', userEmail: 'demo@wishly.com',
        items: [
          { productId:9, name:'Handcrafted Ceramic Vase', price:7499, quantity:1 },
          { productId:12, name:'Scented Soy Candle Set', price:3299, quantity:1 }
        ],
        customerInfo: { name:'Demo User', email:'demo@wishly.com', address:'42 MG Road, Bengaluru, Karnataka 560001', phone:'+91 98765 43210' },
        subtotal: 10798, total: 10798, status:'Pending', date:'2024-02-20T14:15:00Z'
      }
    ];

    const wishlists = {
      'demo@wishly.com': [{ name: 'My Favorites', items: [1, 5, 10] }]
    };

    setData(KEYS.products, products);
    setData(KEYS.categories, categories);
    setData(KEYS.users, users);
    setData(KEYS.reviews, reviews);
    setData(KEYS.orders, orders);
    setData(KEYS.wishlists, wishlists);
    setData(KEYS.cart, {});
    setData(KEYS.initialized, DATA_VERSION);
  }

  // ---- Toast Notifications ----
  function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toast-container');
    var icons = { success: '✓', error: '✕', info: 'ℹ' };
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.innerHTML =
      '<span class="toast__icon">' + (icons[type] || 'ℹ') + '</span>' +
      '<span class="toast__message">' + escapeHtml(message) + '</span>' +
      '<button class="toast__close" aria-label="Close notification">&times;</button>';
    container.appendChild(toast);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { toast.classList.add('show'); });
    });
    var timer = setTimeout(function () { removeToast(toast); }, 3500);
    toast.querySelector('.toast__close').addEventListener('click', function () {
      clearTimeout(timer);
      removeToast(toast);
    });
  }

  function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 350);
  }

  // ---- Modal ----
  function showModal(html) {
    var overlay = document.getElementById('modal-overlay');
    var content = document.getElementById('modal-content');
    content.innerHTML = html;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    var overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('active');
    document.getElementById('modal-content').innerHTML = '';
    document.body.style.overflow = '';
  }

  // ---- SPA Navigation ----
  function navigateTo(viewId) {
    if (viewId === 'admin') {
      window.location.href = 'admin.html';
      return;
    }
    var views = document.querySelectorAll('.view');
    views.forEach(function (v) { v.classList.remove('active'); });
    var target = document.getElementById('view-' + viewId);
    if (target) target.classList.add('active');
    currentView = viewId;

    // Update nav active
    var links = document.querySelectorAll('#nav-links a[data-view]');
    links.forEach(function (a) {
      a.classList.remove('active');
      if (a.getAttribute('data-view') === viewId) a.classList.add('active');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMobileMenu();

    // Render view content
    switch (viewId) {
      case 'home': renderHome(); break;
      case 'products': renderProducts(); break;
      case 'wishlist': renderWishlist(); break;
      case 'cart': renderCart(); break;
      case 'checkout': renderCheckout(); break;
      case 'account': renderAccount(); break;
      case 'auth': break;
      case 'order-confirmation': renderOrderConfirmation(); break;
    }
  }

  // ---- Mobile Menu ----
  function toggleMobileMenu() {
    var links = document.getElementById('nav-links');
    var btn = document.getElementById('mobile-menu-btn');
    links.classList.toggle('active');
    btn.classList.toggle('active');
    btn.setAttribute('aria-expanded', links.classList.contains('active'));
  }

  function closeMobileMenu() {
    var links = document.getElementById('nav-links');
    var btn = document.getElementById('mobile-menu-btn');
    if (links) links.classList.remove('active');
    if (btn) { btn.classList.remove('active'); btn.setAttribute('aria-expanded', 'false'); }
  }

  // ---- Auth UI ----
  function updateAuthUI() {
    var user = getCurrentUser();
    var navAuth = document.getElementById('nav-auth');
    var navAccount = document.getElementById('nav-account');
    var navAdmin = document.getElementById('nav-admin');
    var navWishlist = document.getElementById('nav-wishlist-li');
    var navCart = document.getElementById('nav-cart-li');
    var userName = document.getElementById('nav-user-name');
    var heroCta = document.getElementById('hero-wishlist-cta');
    var ctaBtn = document.getElementById('cta-get-started');

    if (user) {
      navAuth.classList.add('hidden');
      navAccount.classList.remove('hidden');
      navWishlist.classList.remove('hidden');
      navCart.classList.remove('hidden');
      if (userName) userName.textContent = user.name;
      if (user.role === 'admin') navAdmin.classList.remove('hidden');
      else navAdmin.classList.add('hidden');
      if (heroCta) { heroCta.setAttribute('data-view', 'wishlist'); heroCta.textContent = 'My Wishlists'; }
      if (ctaBtn) { ctaBtn.setAttribute('data-view', 'products'); ctaBtn.textContent = 'Browse Products'; }
      updateCartCount();
      updateWishlistCount();
    } else {
      navAuth.classList.remove('hidden');
      navAccount.classList.add('hidden');
      navAdmin.classList.add('hidden');
      navWishlist.classList.add('hidden');
      navCart.classList.add('hidden');
      if (heroCta) { heroCta.setAttribute('data-view', 'auth'); heroCta.textContent = 'Create Your Wishlist'; }
      if (ctaBtn) { ctaBtn.setAttribute('data-view', 'auth'); ctaBtn.textContent = 'Get Started Free'; }
    }
  }

  function updateCartCount() {
    var user = getCurrentUser();
    var el = document.getElementById('cart-count');
    if (!user || !el) return;
    var cart = getUserCart(user.email);
    var total = cart.reduce(function (s, i) { return s + i.quantity; }, 0);
    el.textContent = total;
    el.style.display = total > 0 ? '' : 'none';
  }

  function updateWishlistCount() {
    var user = getCurrentUser();
    var el = document.getElementById('wishlist-count');
    if (!user || !el) return;
    var wls = getUserWishlists(user.email);
    var total = wls.reduce(function (s, w) { return s + w.items.length; }, 0);
    el.textContent = total;
    el.style.display = total > 0 ? '' : 'none';
  }

  // ---- Auth: Register ----
  function handleRegister(e) {
    e.preventDefault();
    clearFormErrors(e.target);
    var name = document.getElementById('register-name').value.trim();
    var email = document.getElementById('register-email').value.trim();
    var pass = document.getElementById('register-password').value;
    var confirm = document.getElementById('register-confirm').value;
    var valid = true;

    if (!name) { showFieldError('register-name', 'register-name-error', 'Please enter your name'); valid = false; }
    if (!email || !isValidEmail(email)) { showFieldError('register-email', 'register-email-error', 'Please enter a valid email'); valid = false; }
    if (pass.length < 6) { showFieldError('register-password', 'register-password-error', 'Password must be at least 6 characters'); valid = false; }
    if (pass !== confirm) { showFieldError('register-confirm', 'register-confirm-error', 'Passwords do not match'); valid = false; }
    if (!valid) return;

    var users = getUsers();
    if (users.find(function (u) { return u.email === email; })) {
      showFieldError('register-email', 'register-email-error', 'This email is already registered');
      return;
    }

    var newUser = { name: name, email: email, password: pass, role: 'user', joinDate: new Date().toISOString() };
    users.push(newUser);
    setData(KEYS.users, users);
    setCurrentUser(newUser);
    setUserWishlists(email, [{ name: 'My Favorites', items: [] }]);
    updateAuthUI();
    navigateTo('home');
    showToast('Account created successfully! Welcome to WISHLY, ' + name + '.', 'success');
    e.target.reset();
  }

  // ---- Auth: Login ----
  function handleLogin(e) {
    e.preventDefault();
    clearFormErrors(e.target);
    var email = document.getElementById('login-email').value.trim();
    var pass = document.getElementById('login-password').value;
    var valid = true;

    if (!email || !isValidEmail(email)) { showFieldError('login-email', 'login-email-error', 'Please enter a valid email'); valid = false; }
    if (!pass) { showFieldError('login-password', 'login-password-error', 'Please enter your password'); valid = false; }
    if (!valid) return;

    var users = getUsers();
    var found = users.find(function (u) { return u.email === email && u.password === pass; });
    if (!found) {
      showToast('Invalid email or password. Please try again.', 'error');
      return;
    }

    setCurrentUser(found);
    updateAuthUI();
    navigateTo('home');
    showToast('Welcome back, ' + found.name + '!', 'success');
    e.target.reset();
  }

  function handleLogout() {
    setCurrentUser(null);
    updateAuthUI();
    navigateTo('home');
    showToast('You have been logged out.', 'info');
  }

  function showFieldError(inputId, errorId, msg) {
    var input = document.getElementById(inputId);
    var err = document.getElementById(errorId);
    if (input) input.classList.add('error');
    if (err) { err.textContent = msg; err.classList.add('visible'); }
  }

  function clearFormErrors(form) {
    form.querySelectorAll('.form-input, .form-textarea').forEach(function (i) { i.classList.remove('error'); });
    form.querySelectorAll('.form-error').forEach(function (e) { e.classList.remove('visible'); });
  }

  function switchAuthTab(tab) {
    var loginForm = document.getElementById('login-form');
    var registerForm = document.getElementById('register-form');
    var tabLogin = document.getElementById('tab-login');
    var tabRegister = document.getElementById('tab-register');
    if (tab === 'login') {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
    } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      tabLogin.classList.remove('active');
      tabRegister.classList.add('active');
    }
  }

  // ---- Image Fallback ----
  function handleImageError(img) {
    var name = img.getAttribute('alt') || '?';
    var colors = ['#345847', '#B66D51', '#8A8A85', '#5B7065', '#A0785E', '#6B6B6B'];
    var idx = name.charCodeAt(0) % colors.length;
    var parent = img.parentNode;
    var placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder';
    placeholder.style.backgroundColor = colors[idx];
    placeholder.textContent = name.charAt(0).toUpperCase();
    img.style.display = 'none';
    parent.appendChild(placeholder);
  }

  // ---- Product Card ----
  function renderProductCard(product) {
    var user = getCurrentUser();
    var inWishlist = false;
    if (user) {
      var wls = getUserWishlists(user.email);
      inWishlist = wls.some(function (w) { return w.items.indexOf(product.id) !== -1; });
    }

    var badgeHtml = '';
    if (product.featured) badgeHtml = '<span class="product-card__badge badge--featured">Featured</span>';
    if (product.availability === 'low-stock') badgeHtml = '<span class="product-card__badge badge--low-stock">Low Stock</span>';
    if (product.availability === 'out-of-stock') badgeHtml = '<span class="product-card__badge badge--out-of-stock">Sold Out</span>';

    var disableCart = product.availability === 'out-of-stock' ? ' disabled' : '';

    return '<div class="product-card" data-product-id="' + product.id + '">' +
      '<div class="product-card__image-wrap">' +
        '<img class="product-card__image" src="' + product.image + '" alt="' + escapeHtml(product.name) + '" onerror="this.onerror=null;this.style.display=\'none\';this.parentNode.innerHTML+=\'<div class=image-placeholder style=background:' + ['#345847','#B66D51','#8A8A85','#5B7065','#A0785E'][product.id % 5] + '>' + escapeHtml(product.name.charAt(0)) + '</div>\'" loading="lazy">' +
        badgeHtml +
        '<button class="product-card__wishlist-btn' + (inWishlist ? ' active' : '') + '" data-action="toggle-wishlist" data-product-id="' + product.id + '" aria-label="' + (inWishlist ? 'Remove from' : 'Add to') + ' wishlist">' + (inWishlist ? '♥' : '♡') + '</button>' +
      '</div>' +
      '<div class="product-card__info">' +
        '<span class="product-card__category">' + escapeHtml(product.category) + '</span>' +
        '<h3 class="product-card__title">' + escapeHtml(product.name) + '</h3>' +
        '<span class="product-card__price">' + formatPrice(product.price) + '</span>' +
        '<div class="product-card__rating">' + generateStars(product.rating) + ' <span class="rating-value">' + product.rating.toFixed(1) + '</span></div>' +
        '<div class="product-card__actions">' +
          '<button class="btn btn--primary btn--small" data-action="add-to-cart" data-product-id="' + product.id + '"' + disableCart + '>' + (product.availability === 'out-of-stock' ? 'Sold Out' : 'Add to Cart') + '</button>' +
          '<button class="btn btn--secondary btn--small" data-action="view-product" data-product-id="' + product.id + '">View Details</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ---- Home ----
  function renderHome() {
    var products = getProducts();

    // Update category counts
    var categories = getCategories();
    categories.forEach(function (cat) {
      var count = products.filter(function (p) { return p.category === cat; }).length;
      var slug = cat.toLowerCase().replace(/[^a-z]/g, '');
      var el = document.getElementById('cat-count-' + slug);
      if (!el) {
        // Try alternate slugs
        var slugMap = { 'homeliving': 'home', 'homeandliving': 'home' };
        el = document.getElementById('cat-count-' + (slugMap[slug] || slug));
      }
      if (el) el.textContent = count + ' product' + (count !== 1 ? 's' : '');
    });

    // Featured products
    var featured = products.filter(function (p) { return p.featured; });
    var featuredGrid = document.getElementById('featured-products-grid');
    featuredGrid.innerHTML = featured.map(renderProductCard).join('');

    // Trending products
    var trending = products.filter(function (p) { return p.trending; });
    var trendingGrid = document.getElementById('trending-products-grid');
    trendingGrid.innerHTML = trending.map(renderProductCard).join('');
  }

  // ---- Products Catalogue ----
  var currentFilters = { search: '', category: '', sort: '', priceMin: '', priceMax: '' };

  function renderProducts() {
    var products = getProducts();
    var categories = getCategories();

    // Populate category filter
    var catFilter = document.getElementById('category-filter');
    var currentCat = catFilter.value;
    catFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(function (c) {
      catFilter.innerHTML += '<option value="' + escapeHtml(c) + '"' + (currentCat === c || currentFilters.category === c ? ' selected' : '') + '>' + escapeHtml(c) + '</option>';
    });
    if (currentFilters.category) catFilter.value = currentFilters.category;

    applyFilters();
  }

  function applyFilters() {
    var products = getProducts();
    var search = document.getElementById('search-input').value.trim().toLowerCase();
    var category = document.getElementById('category-filter').value;
    var sort = document.getElementById('sort-select').value;
    var priceMin = parseFloat(document.getElementById('price-min').value) || 0;
    var priceMax = parseFloat(document.getElementById('price-max').value) || Infinity;

    var filtered = products.filter(function (p) {
      if (search && p.name.toLowerCase().indexOf(search) === -1 && p.description.toLowerCase().indexOf(search) === -1) return false;
      if (category && p.category !== category) return false;
      if (p.price < priceMin) return false;
      if (priceMax !== Infinity && p.price > priceMax) return false;
      return true;
    });

    // Sort
    if (sort === 'price-low') filtered.sort(function (a, b) { return a.price - b.price; });
    else if (sort === 'price-high') filtered.sort(function (a, b) { return b.price - a.price; });
    else if (sort === 'rating') filtered.sort(function (a, b) { return b.rating - a.rating; });
    else if (sort === 'name') filtered.sort(function (a, b) { return a.name.localeCompare(b.name); });

    // Render
    var grid = document.getElementById('products-grid');
    var countEl = document.getElementById('product-count');
    var emptyState = document.getElementById('products-empty-state');

    if (filtered.length === 0) {
      grid.innerHTML = '';
      grid.classList.add('hidden');
      emptyState.classList.remove('hidden');
      countEl.textContent = 'No products found';
    } else {
      grid.classList.remove('hidden');
      emptyState.classList.add('hidden');
      grid.innerHTML = filtered.map(renderProductCard).join('');
      countEl.textContent = 'Showing ' + filtered.length + ' of ' + products.length + ' products';
    }
  }

  function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('sort-select').value = '';
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    currentFilters = { search: '', category: '', sort: '', priceMin: '', priceMax: '' };
    applyFilters();
  }

  // ---- Product Detail ----
  function renderProductDetail(productId) {
    var products = getProducts();
    var product = products.find(function (p) { return p.id === productId; });
    if (!product) { navigateTo('products'); return; }
    currentDetailProductId = productId;

    var user = getCurrentUser();
    var reviews = getReviews().filter(function (r) { return r.productId === productId; });
    var avgRating = reviews.length > 0 ? (reviews.reduce(function (s, r) { return s + r.rating; }, 0) / reviews.length) : product.rating;

    var stockClass = product.availability === 'in-stock' ? 'in-stock' : (product.availability === 'low-stock' ? 'low-stock' : 'out-of-stock');
    var stockText = product.availability === 'in-stock' ? 'In Stock (' + product.stock + ' available)' : (product.availability === 'low-stock' ? 'Low Stock (Only ' + product.stock + ' left)' : 'Out of Stock');
    var disableAdd = product.availability === 'out-of-stock';

    // Wishlist dropdown
    var wishlistDropdownHtml = '';
    if (user) {
      var wls = getUserWishlists(user.email);
      if (wls.length > 0) {
        wishlistDropdownHtml = '<div class="wishlist-dropdown" id="wishlist-dropdown">' +
          '<button class="btn btn--accent" id="add-to-wishlist-btn" data-action="toggle-wishlist-dropdown">♡ Add to Wishlist</button>' +
          '<div class="wishlist-dropdown__menu hidden" id="wishlist-dropdown-menu">';
        wls.forEach(function (w, i) {
          var inList = w.items.indexOf(productId) !== -1;
          wishlistDropdownHtml += '<button class="wishlist-dropdown__item" data-action="add-to-specific-wishlist" data-wishlist-index="' + i + '" data-product-id="' + productId + '">' +
            (inList ? '<span class="check">✓</span>' : '<span style="width:16px;display:inline-block"></span>') + ' ' + escapeHtml(w.name) + '</button>';
        });
        wishlistDropdownHtml += '</div></div>';
      } else {
        wishlistDropdownHtml = '<button class="btn btn--accent" data-action="add-to-default-wishlist" data-product-id="' + productId + '">♡ Add to Wishlist</button>';
      }
    } else {
      wishlistDropdownHtml = '<button class="btn btn--accent" data-action="login-required">♡ Add to Wishlist</button>';
    }

    var html = '<div class="product-detail">' +
      '<img class="product-detail__image" src="' + product.image + '" alt="' + escapeHtml(product.name) + '" onerror="this.onerror=null;handleImageError(this);">' +
      '<div class="product-detail__info">' +
        '<span class="product-detail__category">' + escapeHtml(product.category) + '</span>' +
        '<h1>' + escapeHtml(product.name) + '</h1>' +
        '<div class="product-card__rating mb-2">' + generateStars(avgRating) + ' <span class="rating-value">' + avgRating.toFixed(1) + ' (' + reviews.length + ' review' + (reviews.length !== 1 ? 's' : '') + ')</span></div>' +
        '<div class="product-detail__price">' + formatPrice(product.price) + '</div>' +
        '<p class="product-detail__description">' + escapeHtml(product.description) + '</p>' +
        '<div class="product-detail__meta">' +
          '<div class="stock-indicator ' + stockClass + '"><span class="dot"></span> ' + stockText + '</div>' +
        '</div>' +
        (disableAdd ? '' :
          '<div class="quantity-selector">' +
            '<label>Quantity:</label>' +
            '<div class="quantity-controls">' +
              '<button type="button" data-action="detail-qty-minus" aria-label="Decrease quantity">−</button>' +
              '<input type="number" id="detail-quantity" value="1" min="1" max="' + product.stock + '" readonly>' +
              '<button type="button" data-action="detail-qty-plus" aria-label="Increase quantity">+</button>' +
            '</div>' +
          '</div>'
        ) +
        '<div class="product-detail__actions">' +
          '<button class="btn btn--primary"' + (disableAdd ? ' disabled' : '') + ' data-action="detail-add-to-cart" data-product-id="' + productId + '">' + (disableAdd ? 'Out of Stock' : '🛒 Add to Cart') + '</button>' +
          wishlistDropdownHtml +
        '</div>' +
      '</div>' +
    '</div>';

    // Reviews section
    html += '<div class="reviews-section">' +
      '<h3>Customer Reviews (' + reviews.length + ')</h3>';

    if (reviews.length > 0) {
      reviews.forEach(function (r) {
        html += '<div class="review-card">' +
          '<div class="review-header">' +
            '<span class="review-author">' + escapeHtml(r.userName) + '</span>' +
            '<span class="review-date">' + formatDate(r.date) + '</span>' +
          '</div>' +
          '<div class="star-rating">' + generateStars(r.rating) + '</div>' +
          (r.text ? '<p class="review-text">' + escapeHtml(r.text) + '</p>' : '') +
        '</div>';
      });
    } else {
      html += '<p class="text-muted">No reviews yet. Be the first to share your thoughts!</p>';
    }

    // Review form
    if (user) {
      html += '<div class="review-form" id="review-form">' +
        '<h4>Write a Review</h4>' +
        '<div class="form-group">' +
          '<label class="form-label">Your Rating</label>' +
          '<div class="star-rating-input" id="star-rating-input">' +
            '<span class="star" data-rating="1">☆</span>' +
            '<span class="star" data-rating="2">☆</span>' +
            '<span class="star" data-rating="3">☆</span>' +
            '<span class="star" data-rating="4">☆</span>' +
            '<span class="star" data-rating="5">☆</span>' +
          '</div>' +
          '<input type="hidden" id="review-rating-value" value="0">' +
          '<span class="form-error" id="review-rating-error">Please select a rating</span>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="review-text">Your Review</label>' +
          '<textarea id="review-text" class="form-input form-textarea" placeholder="Share your experience with this product..." rows="3"></textarea>' +
        '</div>' +
        '<button class="btn btn--primary" data-action="submit-review" data-product-id="' + productId + '">Submit Review</button>' +
      '</div>';
    } else {
      html += '<div class="review-form"><p class="text-muted"><a href="#" data-view="auth">Login</a> to write a review.</p></div>';
    }

    html += '</div>';

    document.getElementById('product-detail-content').innerHTML = html;

    // Set up star rating interaction
    setupStarRating();
  }

  function setupStarRating() {
    var container = document.getElementById('star-rating-input');
    if (!container) return;
    var stars = container.querySelectorAll('.star');
    var ratingInput = document.getElementById('review-rating-value');

    stars.forEach(function (star) {
      star.addEventListener('mouseenter', function () {
        var val = parseInt(this.getAttribute('data-rating'));
        stars.forEach(function (s) {
          var sv = parseInt(s.getAttribute('data-rating'));
          s.textContent = sv <= val ? '★' : '☆';
          s.classList.toggle('filled', sv <= val);
        });
      });

      star.addEventListener('click', function () {
        var val = parseInt(this.getAttribute('data-rating'));
        ratingInput.value = val;
        stars.forEach(function (s) {
          var sv = parseInt(s.getAttribute('data-rating'));
          s.textContent = sv <= val ? '★' : '☆';
          s.classList.toggle('filled', sv <= val);
        });
      });
    });

    container.addEventListener('mouseleave', function () {
      var current = parseInt(ratingInput.value);
      stars.forEach(function (s) {
        var sv = parseInt(s.getAttribute('data-rating'));
        s.textContent = sv <= current ? '★' : '☆';
        s.classList.toggle('filled', sv <= current);
      });
    });
  }

  function submitReview(productId) {
    var rating = parseInt(document.getElementById('review-rating-value').value);
    var text = document.getElementById('review-text').value.trim();
    var user = getCurrentUser();

    if (!rating || rating < 1) {
      var errEl = document.getElementById('review-rating-error');
      if (errEl) errEl.classList.add('visible');
      return;
    }

    var reviews = getReviews();
    var newReview = {
      id: reviews.length > 0 ? Math.max.apply(null, reviews.map(function (r) { return r.id; })) + 1 : 1,
      productId: productId,
      userEmail: user.email,
      userName: user.name,
      rating: rating,
      text: text,
      date: new Date().toISOString()
    };
    reviews.push(newReview);
    setData(KEYS.reviews, reviews);

    showToast('Review submitted successfully!', 'success');
    renderProductDetail(productId);
  }

  // ---- Wishlist Management ----
  function renderWishlist() {
    var user = getCurrentUser();
    if (!user) {
      document.getElementById('wishlist-content').innerHTML =
        '<div class="empty-state"><div class="empty-state__icon">🔒</div>' +
        '<h3 class="empty-state__title">Login Required</h3>' +
        '<p class="empty-state__message">Please login to view and manage your wishlists.</p>' +
        '<a href="#" class="btn btn--primary" data-view="auth">Login Now</a></div>';
      document.getElementById('wishlist-list').innerHTML = '';
      return;
    }

    var wishlists = getUserWishlists(user.email);
    if (wishlists.length === 0) {
      wishlists = [{ name: 'My Favorites', items: [] }];
      setUserWishlists(user.email, wishlists);
    }

    if (selectedWishlistIndex >= wishlists.length) selectedWishlistIndex = 0;

    // Render sidebar
    var listHtml = '';
    wishlists.forEach(function (w, i) {
      listHtml += '<li class="wishlist-list-item' + (i === selectedWishlistIndex ? ' active' : '') + '" data-action="select-wishlist" data-index="' + i + '">' +
        '<span>' + escapeHtml(w.name) + ' <span class="item-count">' + w.items.length + '</span></span>' +
        '<span class="wishlist-actions">' +
          '<button data-action="rename-wishlist" data-index="' + i + '" aria-label="Rename wishlist" title="Rename">✏️</button>' +
          (wishlists.length > 1 ? '<button data-action="delete-wishlist" data-index="' + i + '" aria-label="Delete wishlist" title="Delete">🗑️</button>' : '') +
        '</span>' +
      '</li>';
    });
    document.getElementById('wishlist-list').innerHTML = listHtml;

    // Render content
    var active = wishlists[selectedWishlistIndex];
    var products = getProducts();
    var contentHtml = '<div class="wishlist-content-header">' +
      '<h2>' + escapeHtml(active.name) + '</h2>' +
      '<span class="text-muted">' + active.items.length + ' item' + (active.items.length !== 1 ? 's' : '') + '</span>' +
    '</div>';

    if (active.items.length === 0) {
      contentHtml += '<div class="empty-state"><div class="empty-state__icon">💫</div>' +
        '<h3 class="empty-state__title">This Wishlist is Empty</h3>' +
        '<p class="empty-state__message">Start adding products you love!</p>' +
        '<a href="#" class="btn btn--primary" data-view="products">Browse Products</a></div>';
    } else {
      contentHtml += '<div class="product-grid">';
      active.items.forEach(function (pid) {
        var p = products.find(function (pr) { return pr.id === pid; });
        if (p) {
          contentHtml += '<div class="product-card" data-product-id="' + p.id + '">' +
            '<div class="product-card__image-wrap">' +
              '<img class="product-card__image" src="' + p.image + '" alt="' + escapeHtml(p.name) + '" loading="lazy" onerror="this.onerror=null;this.style.display=\'none\';this.parentNode.innerHTML+=\'<div class=image-placeholder style=background:#345847>' + escapeHtml(p.name.charAt(0)) + '</div>\'">' +
            '</div>' +
            '<div class="product-card__info">' +
              '<span class="product-card__category">' + escapeHtml(p.category) + '</span>' +
              '<h3 class="product-card__title">' + escapeHtml(p.name) + '</h3>' +
              '<span class="product-card__price">' + formatPrice(p.price) + '</span>' +
              '<div class="product-card__actions">' +
                '<button class="btn btn--primary btn--small" data-action="move-to-cart" data-product-id="' + p.id + '"' + (p.availability === 'out-of-stock' ? ' disabled' : '') + '>Move to Cart</button>' +
                '<button class="btn btn--danger btn--small" data-action="remove-from-wishlist" data-product-id="' + p.id + '" data-wishlist-index="' + selectedWishlistIndex + '">Remove</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        }
      });
      contentHtml += '</div>';
    }

    document.getElementById('wishlist-content').innerHTML = contentHtml;
    updateWishlistCount();
  }

  function createWishlist() {
    var user = getCurrentUser();
    if (!user) { navigateTo('auth'); showToast('Please login first.', 'error'); return; }
    var input = document.getElementById('create-wishlist-input');
    var name = input.value.trim();
    if (!name) { showToast('Please enter a wishlist name.', 'error'); return; }

    var wls = getUserWishlists(user.email);
    if (wls.find(function (w) { return w.name.toLowerCase() === name.toLowerCase(); })) {
      showToast('A wishlist with this name already exists.', 'error');
      return;
    }

    wls.push({ name: name, items: [] });
    setUserWishlists(user.email, wls);
    selectedWishlistIndex = wls.length - 1;
    input.value = '';
    renderWishlist();
    showToast('Wishlist "' + name + '" created!', 'success');
  }

  function deleteWishlist(index) {
    var user = getCurrentUser();
    if (!user) return;
    var wls = getUserWishlists(user.email);
    var name = wls[index].name;

    showModal(
      '<div class="modal-header"><h3>Delete Wishlist</h3><button class="modal-close" data-action="close-modal">&times;</button></div>' +
      '<div class="modal-body"><p>Are you sure you want to delete <strong>' + escapeHtml(name) + '</strong>? This cannot be undone.</p></div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn--secondary" data-action="close-modal">Cancel</button>' +
        '<button class="btn btn--danger" id="confirm-delete-wishlist">Delete</button>' +
      '</div>'
    );

    document.getElementById('confirm-delete-wishlist').addEventListener('click', function () {
      wls.splice(index, 1);
      setUserWishlists(user.email, wls);
      selectedWishlistIndex = 0;
      closeModal();
      renderWishlist();
      showToast('Wishlist "' + name + '" deleted.', 'info');
    });
  }

  function renameWishlist(index) {
    var user = getCurrentUser();
    if (!user) return;
    var wls = getUserWishlists(user.email);
    var current = wls[index].name;

    showModal(
      '<div class="modal-header"><h3>Rename Wishlist</h3><button class="modal-close" data-action="close-modal">&times;</button></div>' +
      '<div class="modal-body">' +
        '<div class="form-group"><label class="form-label" for="rename-input">Wishlist Name</label>' +
        '<input type="text" id="rename-input" class="form-input" value="' + escapeHtml(current) + '" maxlength="50"></div>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn--secondary" data-action="close-modal">Cancel</button>' +
        '<button class="btn btn--primary" id="confirm-rename">Save</button>' +
      '</div>'
    );

    document.getElementById('confirm-rename').addEventListener('click', function () {
      var newName = document.getElementById('rename-input').value.trim();
      if (!newName) { showToast('Name cannot be empty.', 'error'); return; }
      if (wls.find(function (w, i2) { return i2 !== index && w.name.toLowerCase() === newName.toLowerCase(); })) {
        showToast('A wishlist with this name already exists.', 'error');
        return;
      }
      wls[index].name = newName;
      setUserWishlists(user.email, wls);
      closeModal();
      renderWishlist();
      showToast('Wishlist renamed to "' + newName + '".', 'success');
    });
  }

  function toggleWishlist(productId) {
    var user = getCurrentUser();
    if (!user) { navigateTo('auth'); showToast('Please login to use wishlists.', 'info'); return; }

    var wls = getUserWishlists(user.email);
    if (wls.length === 0) {
      wls = [{ name: 'My Favorites', items: [] }];
    }

    // Check if in any wishlist
    var found = false;
    wls.forEach(function (w) {
      var idx = w.items.indexOf(productId);
      if (idx !== -1) { w.items.splice(idx, 1); found = true; }
    });

    if (!found) {
      wls[0].items.push(productId);
      showToast('Added to "' + wls[0].name + '"!', 'success');
    } else {
      showToast('Removed from wishlist.', 'info');
    }

    setUserWishlists(user.email, wls);
    updateWishlistCount();

    // Re-render current view to update heart icons
    if (currentView === 'home') renderHome();
    else if (currentView === 'products') applyFilters();
    else if (currentView === 'wishlist') renderWishlist();
  }

  function addToSpecificWishlist(productId, wishlistIndex) {
    var user = getCurrentUser();
    if (!user) return;
    var wls = getUserWishlists(user.email);
    var wl = wls[wishlistIndex];
    if (!wl) return;

    if (wl.items.indexOf(productId) !== -1) {
      // Remove
      wl.items.splice(wl.items.indexOf(productId), 1);
      showToast('Removed from "' + wl.name + '".', 'info');
    } else {
      wl.items.push(productId);
      showToast('Added to "' + wl.name + '"!', 'success');
    }

    setUserWishlists(user.email, wls);
    updateWishlistCount();
    if (currentDetailProductId) renderProductDetail(currentDetailProductId);
  }

  function addToDefaultWishlist(productId) {
    var user = getCurrentUser();
    if (!user) { navigateTo('auth'); showToast('Please login first.', 'info'); return; }
    var wls = getUserWishlists(user.email);
    if (wls.length === 0) {
      wls = [{ name: 'My Favorites', items: [] }];
    }
    if (wls[0].items.indexOf(productId) === -1) {
      wls[0].items.push(productId);
      showToast('Added to "' + wls[0].name + '"!', 'success');
    } else {
      showToast('Already in "' + wls[0].name + '".', 'info');
    }
    setUserWishlists(user.email, wls);
    updateWishlistCount();
    if (currentDetailProductId) renderProductDetail(currentDetailProductId);
  }

  function removeFromWishlist(productId, wishlistIndex) {
    var user = getCurrentUser();
    if (!user) return;
    var wls = getUserWishlists(user.email);
    var wl = wls[wishlistIndex];
    if (!wl) return;
    var idx = wl.items.indexOf(productId);
    if (idx !== -1) {
      wl.items.splice(idx, 1);
      setUserWishlists(user.email, wls);
      showToast('Removed from wishlist.', 'info');
      renderWishlist();
    }
  }

  // ---- Cart ----
  function renderCart() {
    var user = getCurrentUser();
    var container = document.getElementById('cart-items-container');
    var summary = document.getElementById('cart-summary');
    var emptyState = document.getElementById('cart-empty-state');
    var mainContent = document.getElementById('cart-main-content');

    if (!user) {
      mainContent.classList.add('hidden');
      emptyState.classList.remove('hidden');
      emptyState.innerHTML = '<div class="empty-state__icon">🔒</div>' +
        '<h3 class="empty-state__title">Login Required</h3>' +
        '<p class="empty-state__message">Please login to view your shopping cart.</p>' +
        '<a href="#" class="btn btn--primary" data-view="auth">Login Now</a>';
      return;
    }

    var cart = getUserCart(user.email);
    var products = getProducts();

    if (cart.length === 0) {
      mainContent.classList.add('hidden');
      emptyState.classList.remove('hidden');
      emptyState.innerHTML = '<div class="empty-state__icon">🛒</div>' +
        '<h3 class="empty-state__title">Your Cart is Empty</h3>' +
        '<p class="empty-state__message">Looks like you haven\'t added anything to your cart yet.</p>' +
        '<a href="#" class="btn btn--primary" data-view="products">Start Shopping</a>';
      return;
    }

    mainContent.classList.remove('hidden');
    emptyState.classList.add('hidden');

    var subtotal = 0;
    var html = '';

    cart.forEach(function (item) {
      var p = products.find(function (pr) { return pr.id === item.productId; });
      if (!p) return;
      var lineTotal = p.price * item.quantity;
      subtotal += lineTotal;

      html += '<div class="cart-item" data-product-id="' + p.id + '">' +
        '<img class="cart-item__image" src="' + p.image + '" alt="' + escapeHtml(p.name) + '" onerror="this.onerror=null;this.style.display=\'none\'">' +
        '<div class="cart-item__info">' +
          '<h4>' + escapeHtml(p.name) + '</h4>' +
          '<span class="cart-item__category">' + escapeHtml(p.category) + '</span>' +
        '</div>' +
        '<span class="cart-item__price">' + formatPrice(p.price) + '</span>' +
        '<div class="quantity-controls">' +
          '<button type="button" data-action="cart-qty-minus" data-product-id="' + p.id + '" aria-label="Decrease quantity">−</button>' +
          '<input type="number" value="' + item.quantity + '" min="1" max="' + p.stock + '" readonly aria-label="Quantity">' +
          '<button type="button" data-action="cart-qty-plus" data-product-id="' + p.id + '" aria-label="Increase quantity">+</button>' +
        '</div>' +
        '<span class="cart-item__total">' + formatPrice(lineTotal) + '</span>' +
        '<button class="cart-item__remove" data-action="remove-from-cart" data-product-id="' + p.id + '" aria-label="Remove from cart">✕</button>' +
      '</div>';
    });

    container.innerHTML = html;
    document.getElementById('cart-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('cart-total').textContent = formatPrice(subtotal);
    updateCartCount();
  }

  function addToCart(productId, quantity) {
    var user = getCurrentUser();
    if (!user) { navigateTo('auth'); showToast('Please login to add items to cart.', 'info'); return; }

    quantity = quantity || 1;
    var products = getProducts();
    var product = products.find(function (p) { return p.id === productId; });
    if (!product) return;

    if (product.availability === 'out-of-stock') {
      showToast('This product is currently out of stock.', 'error');
      return;
    }

    var cart = getUserCart(user.email);
    var existing = cart.find(function (item) { return item.productId === productId; });

    if (existing) {
      var newQty = existing.quantity + quantity;
      if (newQty > product.stock) {
        showToast('Cannot add more. Only ' + product.stock + ' available.', 'error');
        return;
      }
      existing.quantity = newQty;
    } else {
      if (quantity > product.stock) {
        showToast('Cannot add more than ' + product.stock + ' items.', 'error');
        return;
      }
      cart.push({ productId: productId, quantity: quantity });
    }

    setUserCart(user.email, cart);
    updateCartCount();
    showToast(product.name + ' added to cart!', 'success');
  }

  function removeFromCart(productId) {
    var user = getCurrentUser();
    if (!user) return;
    var cart = getUserCart(user.email);
    cart = cart.filter(function (item) { return item.productId !== productId; });
    setUserCart(user.email, cart);
    renderCart();
    showToast('Item removed from cart.', 'info');
  }

  function updateCartQty(productId, delta) {
    var user = getCurrentUser();
    if (!user) return;
    var cart = getUserCart(user.email);
    var products = getProducts();
    var item = cart.find(function (i) { return i.productId === productId; });
    if (!item) return;
    var product = products.find(function (p) { return p.id === productId; });
    if (!product) return;

    var newQty = item.quantity + delta;
    if (newQty < 1) {
      removeFromCart(productId);
      return;
    }
    if (newQty > product.stock) {
      showToast('Maximum stock reached (' + product.stock + ').', 'error');
      return;
    }
    item.quantity = newQty;
    setUserCart(user.email, cart);
    renderCart();
  }

  function moveToCartFromWishlist(productId) {
    addToCart(productId, 1);
    // Optionally remove from current wishlist
    var user = getCurrentUser();
    if (user) {
      var wls = getUserWishlists(user.email);
      if (wls[selectedWishlistIndex]) {
        var idx = wls[selectedWishlistIndex].items.indexOf(productId);
        if (idx !== -1) {
          wls[selectedWishlistIndex].items.splice(idx, 1);
          setUserWishlists(user.email, wls);
        }
      }
      renderWishlist();
    }
  }

  // ---- Checkout ----
  function renderCheckout() {
    var user = getCurrentUser();
    if (!user) { navigateTo('auth'); showToast('Please login to checkout.', 'info'); return; }
    var cart = getUserCart(user.email);
    if (cart.length === 0) { navigateTo('cart'); showToast('Your cart is empty.', 'info'); return; }

    // Pre-fill user info
    document.getElementById('checkout-name').value = user.name;
    document.getElementById('checkout-email').value = user.email;

    // Render order summary
    var products = getProducts();
    var total = 0;
    var html = '';
    cart.forEach(function (item) {
      var p = products.find(function (pr) { return pr.id === item.productId; });
      if (!p) return;
      var lineTotal = p.price * item.quantity;
      total += lineTotal;
      html += '<div class="order-summary-item">' +
        '<span class="item-name">' + escapeHtml(p.name) + '</span>' +
        '<span class="item-qty">×' + item.quantity + '</span>' +
        '<span>' + formatPrice(lineTotal) + '</span>' +
      '</div>';
    });

    document.getElementById('checkout-items').innerHTML = html;
    document.getElementById('checkout-total').textContent = formatPrice(total);
  }

  function handleCheckout(e) {
    e.preventDefault();
    clearFormErrors(e.target);
    var user = getCurrentUser();
    if (!user) return;

    var name = document.getElementById('checkout-name').value.trim();
    var email = document.getElementById('checkout-email').value.trim();
    var address = document.getElementById('checkout-address').value.trim();
    var phone = document.getElementById('checkout-phone').value.trim();
    var valid = true;

    if (!name) { showFieldError('checkout-name', 'checkout-name-error', 'Name is required'); valid = false; }
    if (!email || !isValidEmail(email)) { showFieldError('checkout-email', 'checkout-email-error', 'Valid email required'); valid = false; }
    if (!address) { showFieldError('checkout-address', 'checkout-address-error', 'Address is required'); valid = false; }
    if (!phone) { showFieldError('checkout-phone', 'checkout-phone-error', 'Phone number required'); valid = false; }
    if (!valid) return;

    var cart = getUserCart(user.email);
    var products = getProducts();
    var subtotal = 0;
    var orderItems = [];

    cart.forEach(function (item) {
      var p = products.find(function (pr) { return pr.id === item.productId; });
      if (!p) return;
      var lineTotal = p.price * item.quantity;
      subtotal += lineTotal;
      orderItems.push({ productId: p.id, name: p.name, price: p.price, quantity: item.quantity });
    });

    var order = {
      id: generateOrderId(),
      userEmail: user.email,
      items: orderItems,
      customerInfo: { name: name, email: email, address: address, phone: phone },
      subtotal: subtotal,
      total: subtotal,
      status: 'Pending',
      date: new Date().toISOString()
    };

    var orders = getOrders();
    orders.push(order);
    setData(KEYS.orders, orders);

    // Clear cart
    setUserCart(user.email, []);
    updateCartCount();

    lastOrderId = order.id;
    navigateTo('order-confirmation');
    showToast('Order placed successfully!', 'success');
    e.target.reset();
  }

  // ---- Order Confirmation ----
  function renderOrderConfirmation() {
    var orders = getOrders();
    var order = orders.find(function (o) { return o.id === lastOrderId; });
    if (!order) {
      document.getElementById('confirmation-details').innerHTML =
        '<div class="empty-state"><div class="empty-state__icon">📦</div><h3 class="empty-state__title">No Order Found</h3>' +
        '<a href="#" class="btn btn--primary" data-view="home">Back to Home</a></div>';
      return;
    }

    var html = '<div class="confirmation__icon" aria-hidden="true">✓</div>' +
      '<h2>Order Placed Successfully!</h2>' +
      '<p class="subtitle">Thank you for your order. Here are your order details.</p>' +
      '<div class="confirmation-details">' +
        '<div class="detail-row"><span class="detail-label">Order ID</span><strong>' + order.id + '</strong></div>' +
        '<div class="detail-row"><span class="detail-label">Date</span><span>' + formatDate(order.date) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Status</span>' + getStatusBadge(order.status) + '</div>' +
        '<div class="detail-row"><span class="detail-label">Delivery To</span><span>' + escapeHtml(order.customerInfo.address) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Phone</span><span>' + escapeHtml(order.customerInfo.phone) + '</span></div>';

    html += '<h4 class="mt-3 mb-2" style="font-size:1rem">Items Ordered</h4>';
    order.items.forEach(function (item) {
      html += '<div class="detail-row"><span>' + escapeHtml(item.name) + ' × ' + item.quantity + '</span><span>' + formatPrice(item.price * item.quantity) + '</span></div>';
    });

    html += '<div class="detail-row" style="font-weight:700;font-size:1.1rem;border-top:2px solid var(--color-border);padding-top:12px;margin-top:8px">' +
      '<span>Total</span><span style="color:var(--color-primary)">' + formatPrice(order.total) + '</span></div>';

    html += '</div><a href="#" class="btn btn--primary mt-3" data-view="products">Continue Shopping</a>';

    document.getElementById('confirmation-details').innerHTML = html;
  }

  // ---- Account ----
  function renderAccount() {
    var user = getCurrentUser();
    if (!user) { navigateTo('auth'); return; }

    var initial = user.name.charAt(0).toUpperCase();
    document.getElementById('account-info').innerHTML =
      '<div class="user-avatar">' + initial + '</div>' +
      '<h3>' + escapeHtml(user.name) + '</h3>' +
      '<p class="account-email">' + escapeHtml(user.email) + '</p>' +
      '<p class="account-meta">Member since ' + formatDate(user.joinDate) + '</p>' +
      (user.role === 'admin' ? '<p class="account-meta"><span class="status-badge status-badge--completed">Admin</span></p>' : '') +
      '<button class="btn btn--secondary btn--full mt-3" data-action="logout">Logout</button>';

    // Order history
    var orders = getOrders().filter(function (o) { return o.userEmail === user.email; });
    orders.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    var historyEl = document.getElementById('order-history-list');
    if (orders.length === 0) {
      historyEl.innerHTML = '<div class="empty-state"><div class="empty-state__icon">📦</div>' +
        '<h3 class="empty-state__title">No Orders Yet</h3>' +
        '<p class="empty-state__message">Start shopping to see your order history here.</p>' +
        '<a href="#" class="btn btn--primary" data-view="products">Browse Products</a></div>';
    } else {
      var html = '';
      orders.forEach(function (o) {
        html += '<div class="order-card" data-action="view-order" data-order-id="' + o.id + '">' +
          '<div class="order-card__header">' +
            '<span class="order-card__id">' + o.id + '</span>' +
            getStatusBadge(o.status) +
          '</div>' +
          '<div class="order-card__date">' + formatDate(o.date) + '</div>' +
          '<div class="order-card__info">' +
            '<span class="order-card__items">' + o.items.length + ' item' + (o.items.length !== 1 ? 's' : '') + '</span>' +
            '<span class="order-card__total">' + formatPrice(o.total) + '</span>' +
          '</div>' +
        '</div>';
      });
      historyEl.innerHTML = html;
    }
  }

  function viewOrderDetails(orderId) {
    var orders = getOrders();
    var order = orders.find(function (o) { return o.id === orderId; });
    if (!order) return;

    var html = '<div class="modal-header"><h3>Order ' + order.id + '</h3><button class="modal-close" data-action="close-modal">&times;</button></div>' +
      '<div class="modal-body">' +
        '<div class="mb-2"><strong>Date:</strong> ' + formatDate(order.date) + '</div>' +
        '<div class="mb-2"><strong>Status:</strong> ' + getStatusBadge(order.status) + '</div>' +
        '<div class="mb-2"><strong>Delivery:</strong> ' + escapeHtml(order.customerInfo.address) + '</div>' +
        '<div class="mb-3"><strong>Phone:</strong> ' + escapeHtml(order.customerInfo.phone) + '</div>' +
        '<h4 class="mb-2">Items</h4>';

    order.items.forEach(function (item) {
      html += '<div class="order-summary-item"><span class="item-name">' + escapeHtml(item.name) + '</span>' +
        '<span class="item-qty">×' + item.quantity + '</span>' +
        '<span>' + formatPrice(item.price * item.quantity) + '</span></div>';
    });

    html += '<div class="cart-summary-row total" style="margin-top:16px"><span>Total</span><span>' + formatPrice(order.total) + '</span></div>' +
      '</div>';

    showModal(html);
  }

  // ---- Reset Demo ----
  function resetDemoData() {
    showModal(
      '<div class="modal-header"><h3>Reset Demo Data</h3><button class="modal-close" data-action="close-modal">&times;</button></div>' +
      '<div class="modal-body"><p>This will reset all data to the original demo state. Any changes you have made will be lost.</p><p><strong>Are you sure?</strong></p></div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn--secondary" data-action="close-modal">Cancel</button>' +
        '<button class="btn btn--danger" id="confirm-reset">Reset Data</button>' +
      '</div>'
    );

    document.getElementById('confirm-reset').addEventListener('click', function () {
      Object.values(KEYS).forEach(function (key) { localStorage.removeItem(key); });
      closeModal();
      window.location.reload();
    });
  }

  // ---- Event Delegation ----
  function handleAction(action, target) {
    var productId = parseInt(target.getAttribute('data-product-id'));
    var wishlistIndex = parseInt(target.getAttribute('data-wishlist-index'));
    var orderId = target.getAttribute('data-order-id');

    switch (action) {
      case 'toggle-wishlist':
        toggleWishlist(productId);
        break;
      case 'add-to-cart':
        addToCart(productId, 1);
        break;
      case 'view-product':
        currentDetailProductId = productId;
        navigateTo('product-detail');
        renderProductDetail(productId);
        break;
      case 'detail-add-to-cart':
        var qty = parseInt(document.getElementById('detail-quantity').value) || 1;
        addToCart(productId, qty);
        break;
      case 'detail-qty-minus':
        var qInput = document.getElementById('detail-quantity');
        if (qInput && parseInt(qInput.value) > 1) qInput.value = parseInt(qInput.value) - 1;
        break;
      case 'detail-qty-plus':
        var qInput2 = document.getElementById('detail-quantity');
        if (qInput2) {
          var max = parseInt(qInput2.getAttribute('max')) || 99;
          if (parseInt(qInput2.value) < max) qInput2.value = parseInt(qInput2.value) + 1;
        }
        break;
      case 'toggle-wishlist-dropdown':
        var menu = document.getElementById('wishlist-dropdown-menu');
        if (menu) menu.classList.toggle('hidden');
        break;
      case 'add-to-specific-wishlist':
        addToSpecificWishlist(productId, wishlistIndex);
        var menu2 = document.getElementById('wishlist-dropdown-menu');
        if (menu2) menu2.classList.add('hidden');
        break;
      case 'add-to-default-wishlist':
        addToDefaultWishlist(productId);
        break;
      case 'login-required':
        navigateTo('auth');
        showToast('Please login to use wishlists.', 'info');
        break;
      case 'submit-review':
        submitReview(productId);
        break;
      case 'select-wishlist':
        selectedWishlistIndex = parseInt(target.getAttribute('data-index'));
        renderWishlist();
        break;
      case 'rename-wishlist':
        renameWishlist(parseInt(target.getAttribute('data-index')));
        break;
      case 'delete-wishlist':
        deleteWishlist(parseInt(target.getAttribute('data-index')));
        break;
      case 'remove-from-wishlist':
        removeFromWishlist(productId, wishlistIndex);
        break;
      case 'move-to-cart':
        moveToCartFromWishlist(productId);
        break;
      case 'cart-qty-minus':
        updateCartQty(productId, -1);
        break;
      case 'cart-qty-plus':
        updateCartQty(productId, 1);
        break;
      case 'remove-from-cart':
        removeFromCart(productId);
        break;
      case 'view-order':
        viewOrderDetails(orderId);
        break;
      case 'logout':
        handleLogout();
        break;
      case 'close-modal':
        closeModal();
        break;
    }
  }

  // ---- Init ----
  document.addEventListener('DOMContentLoaded', function () {
    initializeData();
    updateAuthUI();
    renderHome();

    // Navigation delegation
    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-view]');
      if (link) {
        e.preventDefault();
        navigateTo(link.getAttribute('data-view'));
        return;
      }

      var actionEl = e.target.closest('[data-action]');
      if (actionEl) {
        e.preventDefault();
        handleAction(actionEl.getAttribute('data-action'), actionEl);
        return;
      }

      // Category cards
      var catCard = e.target.closest('[data-category]');
      if (catCard && !catCard.closest('.footer')) {
        e.preventDefault();
        currentFilters.category = catCard.getAttribute('data-category');
        navigateTo('products');
        return;
      }

      // Footer category links
      if (catCard && catCard.closest('.footer')) {
        e.preventDefault();
        currentFilters.category = catCard.getAttribute('data-category');
        navigateTo('products');
        return;
      }

      // Close wishlist dropdown on outside click
      var dropdown = document.getElementById('wishlist-dropdown-menu');
      if (dropdown && !dropdown.classList.contains('hidden') && !e.target.closest('.wishlist-dropdown')) {
        dropdown.classList.add('hidden');
      }
    });

    // Mobile menu
    document.getElementById('mobile-menu-btn').addEventListener('click', toggleMobileMenu);

    // Auth forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Auth tabs
    document.querySelectorAll('[data-auth-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () { switchAuthTab(this.getAttribute('data-auth-tab')); });
    });

    // Checkout
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);

    // Back to products
    document.getElementById('back-to-products').addEventListener('click', function () {
      navigateTo('products');
    });

    // Search (debounced)
    document.getElementById('search-input').addEventListener('input', debounce(function () {
      if (currentView === 'products') applyFilters();
    }, 300));

    // Filters
    document.getElementById('category-filter').addEventListener('change', function () {
      if (currentView === 'products') applyFilters();
    });
    document.getElementById('sort-select').addEventListener('change', function () {
      if (currentView === 'products') applyFilters();
    });
    document.getElementById('apply-price-btn').addEventListener('click', function () {
      if (currentView === 'products') applyFilters();
    });
    document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);
    var emptyClear = document.getElementById('empty-clear-filters');
    if (emptyClear) emptyClear.addEventListener('click', clearFilters);

    // Create wishlist
    document.getElementById('create-wishlist-btn').addEventListener('click', createWishlist);
    document.getElementById('create-wishlist-input').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); createWishlist(); }
    });

    // Reset demo
    document.getElementById('reset-demo-btn').addEventListener('click', resetDemoData);

    // Modal close on overlay click
    document.getElementById('modal-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });

    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeModal();
        closeMobileMenu();
      }
    });

    // Close mobile menu on window resize
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) closeMobileMenu();
    });
  });

  // Expose image error handler globally
  window.handleImageError = handleImageError;

})();
