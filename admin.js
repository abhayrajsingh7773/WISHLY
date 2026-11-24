(function () {
  'use strict';

  /* ==========================================================
     WISHLY — Admin Dashboard JavaScript
     ========================================================== */

  // ---- Storage Keys ----
  var KEYS = {
    products: 'wishly_products',
    categories: 'wishly_categories',
    users: 'wishly_users',
    currentUser: 'wishly_currentUser',
    wishlists: 'wishly_wishlists',
    cart: 'wishly_cart',
    orders: 'wishly_orders',
    reviews: 'wishly_reviews'
  };

  // ---- Data Helpers ----
  function getData(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }
  function setData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function getProducts() { return getData(KEYS.products) || []; }
  function getCategories() { return getData(KEYS.categories) || []; }
  function getUsers() { return getData(KEYS.users) || []; }
  function getCurrentUser() { return getData(KEYS.currentUser); }
  function getOrders() { return getData(KEYS.orders) || []; }
  function getReviews() { return getData(KEYS.reviews) || []; }

  function formatPrice(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

  function formatDate(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function generateStars(rating) {
    var html = '';
    for (var i = 1; i <= 5; i++) {
      html += i <= Math.round(rating) ? '<span class="star filled">★</span>' : '<span class="star">☆</span>';
    }
    return html;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function getStatusBadge(status) {
    var s = (status || 'pending').toLowerCase();
    return '<span class="status-badge status-badge--' + s + '">' + escapeHtml(status) + '</span>';
  }

  // ---- Toast ----
  function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toast-container');
    var icons = { success: '✓', error: '✕', info: 'ℹ' };
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.innerHTML =
      '<span class="toast__icon">' + (icons[type] || 'ℹ') + '</span>' +
      '<span class="toast__message">' + escapeHtml(message) + '</span>' +
      '<button class="toast__close" aria-label="Close">&times;</button>';
    container.appendChild(toast);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { toast.classList.add('show'); });
    });
    var timer = setTimeout(function () { removeToast(toast); }, 3500);
    toast.querySelector('.toast__close').addEventListener('click', function () {
      clearTimeout(timer); removeToast(toast);
    });
  }

  function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 350);
  }

  // ---- Modal ----
  function showModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('modal-content').innerHTML = '';
    document.body.style.overflow = '';
  }

  // ---- Section Navigation ----
  function switchSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(function (s) { s.classList.remove('active'); });
    var target = document.getElementById('admin-' + sectionId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.admin-nav-item').forEach(function (item) { item.classList.remove('active'); });
    var link = document.querySelector('[data-section="' + sectionId + '"]');
    if (link && link.closest('.admin-nav-item')) link.closest('.admin-nav-item').classList.add('active');

    // Close mobile sidebar
    document.getElementById('admin-sidebar').classList.remove('open');
    document.getElementById('admin-sidebar-overlay').classList.remove('active');

    // Render section
    switch (sectionId) {
      case 'dashboard': renderDashboard(); break;
      case 'products': renderProducts(); break;
      case 'categories': renderCategories(); break;
      case 'orders': renderOrders(); break;
      case 'reviews': renderReviews(); break;
    }
  }

  // ---- Dashboard ----
  function renderDashboard() {
    var products = getProducts();
    var users = getUsers();
    var orders = getOrders();
    var reviews = getReviews();
    var pending = orders.filter(function (o) { return o.status === 'Pending'; });

    document.getElementById('stat-products').textContent = products.length;
    document.getElementById('stat-users').textContent = users.length;
    document.getElementById('stat-orders').textContent = orders.length;
    document.getElementById('stat-pending').textContent = pending.length;
    document.getElementById('stat-reviews').textContent = reviews.length;

    // Recent orders
    var recentOrders = orders.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 5);
    var tbody = document.querySelector('#recent-orders-table tbody');
    if (recentOrders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No orders yet</td></tr>';
    } else {
      tbody.innerHTML = recentOrders.map(function (o) {
        return '<tr>' +
          '<td><strong>' + o.id + '</strong></td>' +
          '<td>' + escapeHtml(o.customerInfo.name) + '</td>' +
          '<td>' + formatPrice(o.total) + '</td>' +
          '<td>' + getStatusBadge(o.status) + '</td>' +
          '<td>' + formatDate(o.date) + '</td>' +
        '</tr>';
      }).join('');
    }

    // Recent reviews
    var recentReviews = reviews.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 5);
    var reviewsContainer = document.getElementById('recent-reviews');
    if (recentReviews.length === 0) {
      reviewsContainer.innerHTML = '<p class="text-muted">No reviews yet</p>';
    } else {
      reviewsContainer.innerHTML = recentReviews.map(function (r) {
        var product = products.find(function (p) { return p.id === r.productId; });
        return '<div class="review-card" style="padding:12px;margin-bottom:8px;background:var(--color-white);border-radius:var(--radius-sm);box-shadow:var(--shadow-sm)">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px">' +
            '<strong style="font-size:0.85rem">' + escapeHtml(r.userName) + '</strong>' +
            '<span class="text-muted" style="font-size:0.78rem">' + formatDate(r.date) + '</span>' +
          '</div>' +
          '<div style="font-size:0.85rem">' + generateStars(r.rating) + '</div>' +
          '<div style="font-size:0.82rem;color:var(--color-muted);margin-top:4px">on ' + escapeHtml(product ? product.name : 'Unknown Product') + '</div>' +
          (r.text ? '<p style="font-size:0.85rem;margin-top:6px;line-height:1.4">' + escapeHtml(r.text).substring(0, 100) + (r.text.length > 100 ? '...' : '') + '</p>' : '') +
        '</div>';
      }).join('');
    }
  }

  // ---- Products Management ----
  function renderProducts() {
    var products = getProducts();
    var tbody = document.querySelector('#products-table tbody');

    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No products found</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(function (p) {
      var statusClass = p.availability === 'in-stock' ? 'completed' : (p.availability === 'low-stock' ? 'pending' : 'cancelled');
      var statusText = p.availability === 'in-stock' ? 'In Stock' : (p.availability === 'low-stock' ? 'Low Stock' : 'Out of Stock');
      return '<tr>' +
        '<td>' + p.id + '</td>' +
        '<td><img src="' + p.image + '" alt="' + escapeHtml(p.name) + '" onerror="this.style.display=\'none\'"></td>' +
        '<td><strong>' + escapeHtml(p.name) + '</strong>' + (p.featured ? ' <span class="badge" style="background:var(--color-primary)">★</span>' : '') + '</td>' +
        '<td>' + escapeHtml(p.category) + '</td>' +
        '<td>' + formatPrice(p.price) + '</td>' +
        '<td>' + p.stock + '</td>' +
        '<td><span class="status-badge status-badge--' + statusClass + '">' + statusText + '</span></td>' +
        '<td class="actions">' +
          '<button class="btn btn--small btn--secondary" data-action="edit-product" data-id="' + p.id + '">Edit</button>' +
          '<button class="btn btn--small btn--danger" data-action="delete-product" data-id="' + p.id + '">Delete</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function showProductForm(productId) {
    var container = document.getElementById('product-form-container');
    var title = document.getElementById('product-form-title');
    var form = document.getElementById('product-form');
    clearFormErrors(form);

    // Populate category dropdown
    var catSelect = document.getElementById('product-category');
    var categories = getCategories();
    catSelect.innerHTML = '<option value="">Select category</option>';
    categories.forEach(function (c) {
      catSelect.innerHTML += '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
    });

    if (productId) {
      // Edit mode
      var products = getProducts();
      var product = products.find(function (p) { return p.id === productId; });
      if (!product) return;

      title.textContent = 'Edit Product';
      document.getElementById('product-edit-id').value = product.id;
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-description').value = product.description;
      document.getElementById('product-price').value = product.price;
      document.getElementById('product-stock').value = product.stock;
      document.getElementById('product-category').value = product.category;
      document.getElementById('product-image').value = product.image;
      document.getElementById('product-featured').checked = product.featured;
      document.getElementById('product-trending').checked = product.trending;
    } else {
      // Add mode
      title.textContent = 'Add New Product';
      document.getElementById('product-edit-id').value = '';
      form.reset();
    }

    container.classList.remove('hidden');
    container.scrollIntoView({ behavior: 'smooth' });
  }

  function hideProductForm() {
    document.getElementById('product-form-container').classList.add('hidden');
    document.getElementById('product-form').reset();
    document.getElementById('product-edit-id').value = '';
  }

  function saveProduct(e) {
    e.preventDefault();
    var form = e.target;
    clearFormErrors(form);

    var editId = document.getElementById('product-edit-id').value;
    var name = document.getElementById('product-name').value.trim();
    var description = document.getElementById('product-description').value.trim();
    var price = parseFloat(document.getElementById('product-price').value);
    var stock = parseInt(document.getElementById('product-stock').value);
    var category = document.getElementById('product-category').value;
    var image = document.getElementById('product-image').value.trim();
    var featured = document.getElementById('product-featured').checked;
    var trending = document.getElementById('product-trending').checked;
    var valid = true;

    if (!name) { showFieldError('product-name', 'product-name-error', 'Name is required'); valid = false; }
    if (!description) { showFieldError('product-description', 'product-description-error', 'Description is required'); valid = false; }
    if (!price || price <= 0) { showFieldError('product-price', 'product-price-error', 'Price must be greater than 0'); valid = false; }
    if (isNaN(stock) || stock < 0) { showFieldError('product-stock', 'product-stock-error', 'Valid stock quantity required'); valid = false; }
    if (!category) { showFieldError('product-category', 'product-category-error', 'Please select a category'); valid = false; }
    if (!valid) return;

    var availability = stock === 0 ? 'out-of-stock' : (stock <= 5 ? 'low-stock' : 'in-stock');
    if (!image) image = 'https://picsum.photos/seed/product' + Date.now() + '/400/400';

    var products = getProducts();

    if (editId) {
      // Update existing
      var idx = products.findIndex(function (p) { return p.id === parseInt(editId); });
      if (idx !== -1) {
        products[idx].name = name;
        products[idx].description = description;
        products[idx].price = price;
        products[idx].stock = stock;
        products[idx].category = category;
        products[idx].image = image;
        products[idx].featured = featured;
        products[idx].trending = trending;
        products[idx].availability = availability;
        showToast('Product updated successfully!', 'success');
      }
    } else {
      // Add new
      var newId = products.length > 0 ? Math.max.apply(null, products.map(function (p) { return p.id; })) + 1 : 1;
      products.push({
        id: newId, name: name, image: image, price: price, category: category,
        description: description, rating: 0, availability: availability,
        stock: stock, featured: featured, trending: trending
      });
      showToast('Product added successfully!', 'success');
    }

    setData(KEYS.products, products);
    hideProductForm();
    renderProducts();
  }

  function deleteProduct(productId) {
    var products = getProducts();
    var product = products.find(function (p) { return p.id === productId; });
    if (!product) return;

    showModal(
      '<div class="modal-header"><h3>Delete Product</h3><button class="modal-close" data-action="close-modal">&times;</button></div>' +
      '<div class="modal-body"><p>Are you sure you want to delete <strong>' + escapeHtml(product.name) + '</strong>?</p>' +
      '<p class="text-muted">This action cannot be undone. The product will also be removed from all wishlists and carts.</p></div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn--secondary" data-action="close-modal">Cancel</button>' +
        '<button class="btn btn--danger" id="confirm-delete-product">Delete</button>' +
      '</div>'
    );

    document.getElementById('confirm-delete-product').addEventListener('click', function () {
      products = products.filter(function (p) { return p.id !== productId; });
      setData(KEYS.products, products);

      // Clean wishlists
      var allWishlists = getData(KEYS.wishlists) || {};
      Object.keys(allWishlists).forEach(function (email) {
        allWishlists[email].forEach(function (wl) {
          wl.items = wl.items.filter(function (id) { return id !== productId; });
        });
      });
      setData(KEYS.wishlists, allWishlists);

      // Clean carts
      var allCarts = getData(KEYS.cart) || {};
      Object.keys(allCarts).forEach(function (email) {
        allCarts[email] = allCarts[email].filter(function (item) { return item.productId !== productId; });
      });
      setData(KEYS.cart, allCarts);

      // Clean reviews
      var reviews = getReviews().filter(function (r) { return r.productId !== productId; });
      setData(KEYS.reviews, reviews);

      closeModal();
      renderProducts();
      showToast('Product deleted.', 'info');
    });
  }

  // ---- Categories Management ----
  function renderCategories() {
    var categories = getCategories();
    var products = getProducts();
    var tbody = document.querySelector('#categories-table tbody');

    if (categories.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No categories found</td></tr>';
      return;
    }

    tbody.innerHTML = categories.map(function (cat) {
      var count = products.filter(function (p) { return p.category === cat; }).length;
      return '<tr>' +
        '<td><strong>' + escapeHtml(cat) + '</strong></td>' +
        '<td>' + count + ' product' + (count !== 1 ? 's' : '') + '</td>' +
        '<td class="actions">' +
          '<button class="btn btn--small btn--secondary" data-action="edit-category" data-name="' + escapeHtml(cat) + '">Edit</button>' +
          '<button class="btn btn--small btn--danger" data-action="delete-category" data-name="' + escapeHtml(cat) + '">Delete</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function addCategory() {
    var input = document.getElementById('new-category-input');
    var name = input.value.trim();
    if (!name) { showToast('Please enter a category name.', 'error'); return; }

    var categories = getCategories();
    if (categories.find(function (c) { return c.toLowerCase() === name.toLowerCase(); })) {
      showToast('Category already exists.', 'error');
      return;
    }

    categories.push(name);
    setData(KEYS.categories, categories);
    input.value = '';
    renderCategories();
    showToast('Category "' + name + '" added!', 'success');
  }

  function editCategory(oldName) {
    showModal(
      '<div class="modal-header"><h3>Edit Category</h3><button class="modal-close" data-action="close-modal">&times;</button></div>' +
      '<div class="modal-body">' +
        '<div class="form-group"><label class="form-label" for="edit-category-input">Category Name</label>' +
        '<input type="text" id="edit-category-input" class="form-input" value="' + escapeHtml(oldName) + '" maxlength="50"></div>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn--secondary" data-action="close-modal">Cancel</button>' +
        '<button class="btn btn--primary" id="confirm-edit-category">Save</button>' +
      '</div>'
    );

    document.getElementById('confirm-edit-category').addEventListener('click', function () {
      var newName = document.getElementById('edit-category-input').value.trim();
      if (!newName) { showToast('Category name cannot be empty.', 'error'); return; }

      var categories = getCategories();
      if (categories.find(function (c) { return c.toLowerCase() === newName.toLowerCase() && c !== oldName; })) {
        showToast('Category already exists.', 'error');
        return;
      }

      // Update category
      var idx = categories.indexOf(oldName);
      if (idx !== -1) categories[idx] = newName;
      setData(KEYS.categories, categories);

      // Update products
      var products = getProducts();
      products.forEach(function (p) {
        if (p.category === oldName) p.category = newName;
      });
      setData(KEYS.products, products);

      closeModal();
      renderCategories();
      showToast('Category renamed to "' + newName + '".', 'success');
    });
  }

  function deleteCategory(name) {
    var products = getProducts();
    var count = products.filter(function (p) { return p.category === name; }).length;

    var message = count > 0
      ? '<p>This category has <strong>' + count + ' product' + (count > 1 ? 's' : '') + '</strong>. They will be moved to "Uncategorized".</p>'
      : '<p>This category has no products.</p>';

    showModal(
      '<div class="modal-header"><h3>Delete Category</h3><button class="modal-close" data-action="close-modal">&times;</button></div>' +
      '<div class="modal-body">' + message + '<p>Are you sure you want to delete <strong>' + escapeHtml(name) + '</strong>?</p></div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn--secondary" data-action="close-modal">Cancel</button>' +
        '<button class="btn btn--danger" id="confirm-delete-category">Delete</button>' +
      '</div>'
    );

    document.getElementById('confirm-delete-category').addEventListener('click', function () {
      var categories = getCategories();
      categories = categories.filter(function (c) { return c !== name; });
      setData(KEYS.categories, categories);

      // Update products
      if (count > 0) {
        products.forEach(function (p) {
          if (p.category === name) p.category = 'Uncategorized';
        });
        setData(KEYS.products, products);

        // Add Uncategorized if not exists
        if (categories.indexOf('Uncategorized') === -1) {
          categories.push('Uncategorized');
          setData(KEYS.categories, categories);
        }
      }

      closeModal();
      renderCategories();
      showToast('Category "' + name + '" deleted.', 'info');
    });
  }

  // ---- Orders Management ----
  function renderOrders() {
    var orders = getOrders();
    var filterStatus = document.getElementById('order-status-filter').value;

    if (filterStatus) {
      orders = orders.filter(function (o) { return o.status === filterStatus; });
    }

    orders.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    var tbody = document.querySelector('#orders-table tbody');
    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No orders found</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(function (o) {
      return '<tr>' +
        '<td><strong>' + o.id + '</strong></td>' +
        '<td>' + escapeHtml(o.customerInfo.name) + '</td>' +
        '<td>' + o.items.length + ' item' + (o.items.length !== 1 ? 's' : '') + '</td>' +
        '<td>' + formatPrice(o.total) + '</td>' +
        '<td><select class="form-select" data-action="update-order-status" data-order-id="' + o.id + '">' +
          '<option value="Pending"' + (o.status === 'Pending' ? ' selected' : '') + '>Pending</option>' +
          '<option value="Processing"' + (o.status === 'Processing' ? ' selected' : '') + '>Processing</option>' +
          '<option value="Completed"' + (o.status === 'Completed' ? ' selected' : '') + '>Completed</option>' +
          '<option value="Cancelled"' + (o.status === 'Cancelled' ? ' selected' : '') + '>Cancelled</option>' +
        '</select></td>' +
        '<td>' + formatDate(o.date) + '</td>' +
        '<td><button class="btn btn--small btn--secondary" data-action="view-order" data-order-id="' + o.id + '">View</button></td>' +
      '</tr>';
    }).join('');
  }

  function updateOrderStatus(orderId, newStatus) {
    var orders = getOrders();
    var order = orders.find(function (o) { return o.id === orderId; });
    if (!order) return;
    order.status = newStatus;
    setData(KEYS.orders, orders);
    showToast('Order ' + orderId + ' status updated to ' + newStatus + '.', 'success');
  }

  function viewOrderDetails(orderId) {
    var orders = getOrders();
    var order = orders.find(function (o) { return o.id === orderId; });
    if (!order) return;

    var html = '<div class="modal-header"><h3>Order ' + order.id + '</h3><button class="modal-close" data-action="close-modal">&times;</button></div>' +
      '<div class="modal-body">' +
        '<div class="mb-2"><strong>Customer:</strong> ' + escapeHtml(order.customerInfo.name) + '</div>' +
        '<div class="mb-2"><strong>Email:</strong> ' + escapeHtml(order.customerInfo.email) + '</div>' +
        '<div class="mb-2"><strong>Address:</strong> ' + escapeHtml(order.customerInfo.address) + '</div>' +
        '<div class="mb-2"><strong>Phone:</strong> ' + escapeHtml(order.customerInfo.phone) + '</div>' +
        '<div class="mb-2"><strong>Date:</strong> ' + formatDate(order.date) + '</div>' +
        '<div class="mb-3"><strong>Status:</strong> ' + getStatusBadge(order.status) + '</div>' +
        '<h4 class="mb-2">Items</h4>';

    order.items.forEach(function (item) {
      html += '<div class="order-summary-item">' +
        '<span class="item-name">' + escapeHtml(item.name) + '</span>' +
        '<span class="item-qty">×' + item.quantity + '</span>' +
        '<span>' + formatPrice(item.price * item.quantity) + '</span>' +
      '</div>';
    });

    html += '<div class="cart-summary-row total" style="margin-top:16px"><span>Total</span><span>' + formatPrice(order.total) + '</span></div></div>';
    showModal(html);
  }

  // ---- Reviews Management ----
  function renderReviews() {
    var reviews = getReviews();
    var products = getProducts();

    reviews.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    var tbody = document.querySelector('#reviews-table tbody');
    if (reviews.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No reviews found</td></tr>';
      return;
    }

    tbody.innerHTML = reviews.map(function (r) {
      var product = products.find(function (p) { return p.id === r.productId; });
      return '<tr>' +
        '<td>' + escapeHtml(product ? product.name : 'Unknown Product') + '</td>' +
        '<td>' + escapeHtml(r.userName) + '</td>' +
        '<td><div class="star-rating">' + generateStars(r.rating) + '</div></td>' +
        '<td>' + escapeHtml((r.text || '').substring(0, 80)) + (r.text && r.text.length > 80 ? '...' : '') + '</td>' +
        '<td>' + formatDate(r.date) + '</td>' +
        '<td><button class="btn btn--small btn--danger" data-action="delete-review" data-review-id="' + r.id + '">Delete</button></td>' +
      '</tr>';
    }).join('');
  }

  function deleteReview(reviewId) {
    showModal(
      '<div class="modal-header"><h3>Delete Review</h3><button class="modal-close" data-action="close-modal">&times;</button></div>' +
      '<div class="modal-body"><p>Are you sure you want to delete this review? This action cannot be undone.</p></div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn--secondary" data-action="close-modal">Cancel</button>' +
        '<button class="btn btn--danger" id="confirm-delete-review">Delete</button>' +
      '</div>'
    );

    document.getElementById('confirm-delete-review').addEventListener('click', function () {
      var reviews = getReviews();
      reviews = reviews.filter(function (r) { return r.id !== reviewId; });
      setData(KEYS.reviews, reviews);
      closeModal();
      renderReviews();
      showToast('Review deleted.', 'info');
    });
  }

  // ---- Form Helpers ----
  function showFieldError(inputId, errorId, msg) {
    var input = document.getElementById(inputId);
    var err = document.getElementById(errorId);
    if (input) input.classList.add('error');
    if (err) { err.textContent = msg; err.classList.add('visible'); }
  }

  function clearFormErrors(form) {
    form.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(function (i) { i.classList.remove('error'); });
    form.querySelectorAll('.form-error').forEach(function (e) { e.classList.remove('visible'); });
  }

  // ---- Init ----
  document.addEventListener('DOMContentLoaded', function () {
    // Auth check
    var user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      window.location.href = 'index.html';
      return;
    }

    var welcome = document.getElementById('admin-welcome');
    if (welcome) welcome.textContent = 'Welcome, ' + user.name;

    renderDashboard();

    // Sidebar navigation
    document.getElementById('admin-nav').addEventListener('click', function (e) {
      var link = e.target.closest('[data-section]');
      if (link) {
        e.preventDefault();
        switchSection(link.getAttribute('data-section'));
      }
    });

    // Logout
    document.addEventListener('click', function (e) {
      var actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      var action = actionEl.getAttribute('data-action');

      switch (action) {
        case 'logout':
          e.preventDefault();
          localStorage.removeItem(KEYS.currentUser);
          window.location.href = 'index.html';
          break;
        case 'close-modal':
          e.preventDefault();
          closeModal();
          break;
        case 'edit-product':
          e.preventDefault();
          showProductForm(parseInt(actionEl.getAttribute('data-id')));
          break;
        case 'delete-product':
          e.preventDefault();
          deleteProduct(parseInt(actionEl.getAttribute('data-id')));
          break;
        case 'edit-category':
          e.preventDefault();
          editCategory(actionEl.getAttribute('data-name'));
          break;
        case 'delete-category':
          e.preventDefault();
          deleteCategory(actionEl.getAttribute('data-name'));
          break;
        case 'view-order':
          e.preventDefault();
          viewOrderDetails(actionEl.getAttribute('data-order-id'));
          break;
        case 'delete-review':
          e.preventDefault();
          deleteReview(parseInt(actionEl.getAttribute('data-review-id')));
          break;
      }
    });

    // Order status changes
    document.addEventListener('change', function (e) {
      var el = e.target.closest('[data-action="update-order-status"]');
      if (el) {
        updateOrderStatus(el.getAttribute('data-order-id'), el.value);
      }
    });

    // Product form
    document.getElementById('add-product-btn').addEventListener('click', function () { showProductForm(null); });
    document.getElementById('cancel-product-btn').addEventListener('click', hideProductForm);
    document.getElementById('product-form').addEventListener('submit', saveProduct);

    // Category add
    document.getElementById('add-category-btn').addEventListener('click', addCategory);
    document.getElementById('new-category-input').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addCategory(); }
    });

    // Order status filter
    document.getElementById('order-status-filter').addEventListener('change', renderOrders);

    // Modal close
    document.getElementById('modal-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });

    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // Mobile sidebar toggle
    document.getElementById('admin-mobile-toggle').addEventListener('click', function () {
      document.getElementById('admin-sidebar').classList.toggle('open');
      document.getElementById('admin-sidebar-overlay').classList.toggle('active');
    });

    document.getElementById('admin-sidebar-overlay').addEventListener('click', function () {
      document.getElementById('admin-sidebar').classList.remove('open');
      this.classList.remove('active');
    });
  });

})();
