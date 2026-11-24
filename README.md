# WISHLY — Digital Wishlist Platform

> **Save what you love. Find what matters.**

A complete, polished, responsive Digital Wishlist Platform built as an academic demonstration project. WISHLY allows users to browse products, create personalized wishlists, manage a shopping cart, complete simulated checkout, and provides administrators with a full CRUD dashboard.

---

## Project Objectives

- Demonstrate catalogue management and user interaction
- Implement wishlist creation, organization, and management (core feature)
- Build cart workflows and simulated order/request processing
- Provide administrative CRUD operations for products, categories, orders, and reviews
- Deliver a professional, responsive, and polished user interface
- Use only frontend technologies with localStorage for data persistence

## Technologies Used

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Semantic markup and page structure |
| **CSS3** | Styling with Custom Properties, Flexbox, and CSS Grid |
| **Vanilla JavaScript (ES6+)** | Application logic, DOM manipulation, event handling |
| **localStorage** | Client-side data persistence |

> **No frameworks, libraries, or external dependencies are used.** No React, Vue, Angular, Tailwind, Bootstrap, jQuery, or npm packages. The site runs by opening `index.html` directly in a browser.

## Main Features

### User Features
- 🔐 **Registration & Login** — Create accounts, login/logout, persistent sessions
- 🛍️ **Product Catalogue** — Browse 24 curated products across 6 categories
- 🔍 **Search & Filter** — Search by name, filter by category, sort by price/rating, price range
- 📄 **Product Details** — Full product view with images, descriptions, reviews
- ❤️ **Wishlist Management** — Create multiple named wishlists, add/remove/move items (core feature)
- 🛒 **Shopping Cart** — Add items, adjust quantities, stock validation
- 📦 **Checkout** — Delivery form, order summary, simulated order placement
- ⭐ **Reviews & Ratings** — Submit star ratings and written reviews
- 📋 **Order History** — View past orders with status tracking

### Admin Features
- 📊 **Dashboard** — Summary statistics (products, users, orders, reviews)
- 📦 **Product CRUD** — Add, edit, delete products with full validation
- 🏷️ **Category Management** — Add, rename, delete categories
- 📋 **Order Management** — View orders, update status (Pending → Processing → Completed/Cancelled)
- ⭐ **Review Moderation** — View and delete reviews

### Design & UX
- 📱 **Fully Responsive** — Desktop, tablet, and mobile layouts
- 🎨 **Premium Editorial UI** — Warm ivory, forest green, and terracotta palette
- 🔔 **Toast Notifications** — Feedback for all user actions
- 💬 **Modal Dialogs** — Confirmations and detail views
- ♿ **Accessibility** — Semantic HTML, ARIA labels, keyboard navigation, focus states
- 🎭 **Reduced Motion** — Respects `prefers-reduced-motion`

## Project Structure

```
dgital wishlist platform/
├── index.html          # Main application (Single-Page Application)
├── styles.css          # Shared stylesheet for both pages
├── script.js           # Main application JavaScript
├── admin.html          # Admin dashboard page
├── admin.js            # Admin dashboard JavaScript
└── README.md           # This documentation
```

## How to Run

1. **Download** or clone the project folder
2. **Open `index.html`** in any modern web browser (Chrome, Firefox, Edge, Safari)
3. That's it! No server, build step, or installation required

The site automatically seeds demo data on first load.

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **User** | `demo@wishly.com` | `demo1234` |
| **Admin** | `admin@wishly.com` | `admin1234` |

Demo credentials are also displayed on the login page for convenience.

> The admin account can access the Admin Dashboard from the navigation bar.

## User Functionality

1. **Browse** — Explore the homepage with featured/trending products and categories
2. **Search & Filter** — Use the toolbar to search, filter by category, sort, and set price ranges
3. **Product Details** — Click "View Details" on any product for full information
4. **Wishlists** — Create multiple named wishlists, add products via heart icons, manage from the Wishlist page
5. **Cart** — Add products to cart, adjust quantities, proceed to checkout
6. **Checkout** — Fill delivery information and place a simulated order
7. **Account** — View profile information and order history
8. **Reviews** — Submit ratings and reviews on product detail pages

## Admin Functionality

1. **Dashboard** — View summary statistics and recent activity
2. **Products** — Add new products, edit existing ones, delete with confirmation
3. **Categories** — Add, rename, and delete categories (products reassigned if needed)
4. **Orders** — Filter by status, view details, update status via dropdown
5. **Reviews** — View all reviews, delete inappropriate ones

## How localStorage Works

This project uses the browser's `localStorage` API to simulate a database:

- **Products, users, orders, reviews, wishlists, and cart data** are stored as JSON strings
- Data **persists** when the page is refreshed or the browser is closed
- Data is **browser-specific** — it does not sync across devices
- A **Reset Demo Data** button in the footer restores the original sample data

### Storage Keys

| Key | Contents |
|-----|----------|
| `wishly_products` | Product catalogue |
| `wishly_categories` | Category names |
| `wishly_users` | Registered user accounts |
| `wishly_currentUser` | Currently logged-in user |
| `wishly_wishlists` | User wishlists (by email) |
| `wishly_cart` | Shopping carts (by email) |
| `wishly_orders` | All placed orders |
| `wishly_reviews` | Product reviews |
| `wishly_initialized` | Seed data loaded flag |

## Limitations

> [!IMPORTANT]
> This is a **frontend-only academic demonstration**, not a production application.

- **No real backend or database** — all data lives in localStorage
- **Authentication is simulated** — passwords stored in plain text, no encryption, no real security
- **No real payment processing** — checkout is simulated
- **Data is browser-specific** — clearing browser data erases everything
- **No server-side validation** — all validation is client-side only
- **Images use external placeholder service** — requires internet for product images (graceful fallback provided)

## Testing Checklist

- [x] Register a new user account
- [x] Login and logout
- [x] Browse and search products
- [x] Apply category, sort, and price filters
- [x] View product details
- [x] Add and remove products from wishlists
- [x] Create, rename, and delete multiple wishlists
- [x] Add products to cart and adjust quantities
- [x] Complete a simulated checkout
- [x] View order history
- [x] Submit product reviews and ratings
- [x] Login as admin
- [x] Admin: Add, edit, and delete products
- [x] Admin: Manage categories
- [x] Admin: Update order statuses
- [x] Admin: Moderate reviews
- [x] Data persists after browser refresh
- [x] Responsive layout at all viewport sizes

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Warm Ivory | `#F8F7F3` | Background |
| Deep Charcoal | `#242923` | Text, Footer |
| Forest Green | `#345847` | Primary actions |
| Soft Sage | `#E7EDE6` | Secondary surfaces |
| Muted Terracotta | `#B66D51` | Accents, highlights |
| White | `#FFFFFF` | Cards, surfaces |

## Acknowledgments

Built as an academic demonstration project for a college assignment. Designed and developed to showcase full-stack frontend capabilities using only HTML5, CSS3, and Vanilla JavaScript.

## License

Academic use only. This project is intended for educational evaluation purposes.
