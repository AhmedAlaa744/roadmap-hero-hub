

# Garak — Updates from Build Prompts File

The uploaded file contains 6 sequential build prompts. Comparing against what's already built, here's what needs to be added/changed:

## Already Done (Prompt 1 partial, Prompt 2 partial)
- Color palette, fonts, mock data, basic pages (Home, Browse, Product Detail, Cart)
- Header, Footer, ProductCard components

## What Needs to Be Built

### 1. Supabase Integration (Prompt 1)
- Connect Supabase with the provided URL and anon key
- Create all database tables: profiles, categories, products, stores, merchant_applications, orders, order_items, reviews, wishlists, support_tickets, notifications
- Enable RLS with proper policies on all tables
- Create auto-profile trigger on user signup
- Create `has_role` security definer function for role checks

### 2. Home Page Enhancements (Prompt 2 gaps)
- Add Arabic brand tagline "جارك — سوق جيرانك" above the H1
- Add a "Log In" coral outline button to hero
- Add trust banner section: Verified Merchants, Compound Delivery, Rated & Reviewed, Your Neighbors
- Add "How Garak Works" 3-step section with Arabic subtitles
- Add product condition explainer section (New/Used/Used as New badges)
- Load categories and products from Supabase instead of mock data

### 3. Authentication System (Prompt 3)
- Phone-to-email conversion auth (`phone@garak.eg` pattern)
- Login page with phone + password
- Customer registration: name, phone, password, terms checkbox
- Merchant registration: extended form with business details → saves to merchant_applications
- Auth context provider wrapping the app
- Protected route handling (cart actions require login)

### 4. Cart & Checkout (Prompt 3)
- Real cart state management (context/store instead of hardcoded items)
- Checkout form: Building (required), Floor, Apartment fields
- Payment toggle: Cash on Delivery / Online Payment
- Place Order: creates order + order_items in Supabase, generates order number `GRK-YYYYMMDD-XXXX`
- Success confirmation with order number

### 5. Customer Account Page (Prompt 3)
- Profile display: avatar initial, name, phone, role badge
- Navigation: Browse, My Orders, Wishlist, Log Out
- Orders list from Supabase

### 6. Merchant Dashboard (Prompt 4)
- Stats cards: Total Products, Orders, Revenue, Rating
- Listing slots progress bar (used/20)
- Products tab: merchant's own products with edit/delete
- Orders tab: orders for merchant's store with Confirm/Cancel
- Add Product form: bilingual names/descriptions, price, category dropdown, condition select, pricing model, image upload to Supabase storage, brand, stock, custom fields

### 7. Admin Panel (Prompt 5)
- Overview tab with aggregate stats from Supabase
- Applications tab: approve/reject merchant applications (approve → update role + create store)
- Users tab: table of all profiles with phone numbers
- Orders tab: all orders with status management
- Products tab: all products overview
- Support tab: support tickets with "Mark Resolved"

### 8. AI Chatbot (Prompt 6)
- Floating teal button on every page (bottom-right)
- Chat window (360px desktop, full-width mobile)
- Language auto-detection (Arabic/English, Egyptian dialect)
- Quick action buttons
- Keyword-matching fallback responses
- Support ticket creation when user asks for help
- Optional OpenAI GPT-4o-mini integration via env variable

### 9. Font Changes
- Switch from Plus Jakarta Sans / Inter to **Outfit** (headings) + **IBM Plex Sans Arabic** (body)

## Technical Details

- **Database**: 10 tables with RLS, security definer function for role checks, auto-profile trigger
- **Auth**: Supabase Auth with phone→email conversion pattern
- **Storage**: Supabase storage bucket `product-images` for merchant uploads
- **State**: Cart context with localStorage persistence, Auth context
- **Routes to add**: `/login`, `/account`, `/merchant/dashboard`, `/admin`
- **New components**: AuthProvider, CartProvider, ChatBot, merchant forms, admin tables

## Suggested Build Order
1. Supabase setup + font change
2. Auth system (login/register pages + context)
3. Home page enhancements
4. Cart state + checkout flow
5. Customer account page
6. Merchant dashboard
7. Admin panel
8. AI chatbot

This is a large scope — shall I proceed with all steps, or would you prefer to tackle them in batches?

