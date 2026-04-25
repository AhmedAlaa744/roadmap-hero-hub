---
name: Garak Project Handoff Report
description: Full handoff — architecture, fixes applied, known issues, file map for continuing AI
type: reference
---

# Garak (جارك) — Full Project Handoff

Community marketplace for **Dar Misr Al-Andalus**, New Cairo, Egypt. Bilingual AR+EN with RTL. Phase 1 = responsive web, Phase 2 = mobile.

## Stack
- **Frontend**: React 18 + Vite 5 + TypeScript + Tailwind + shadcn/ui
- **Backend**: Lovable Cloud (Supabase) — Postgres + Auth + Storage + Edge Functions + Realtime
- **Auth**: Phone-to-email pattern → `{phone}@garak.eg`. Auto-confirm enabled. NO Google OAuth (intentional — phone-only).
- **i18n**: `LanguageContext` with `t(en, ar)` helper + `dir="rtl|ltr"` per page
- **Routing**: react-router-dom

## Design System
- Primary teal `#0D9488`, accent coral `#F97316`, bg `#F8FAFC`
- Headings: Outfit / Plus Jakarta Sans. Body: IBM Plex Sans Arabic / Inter
- Semantic tokens in `src/index.css` + `tailwind.config.ts` — all colors HSL
- Condition badges (new/like-new/used) defined in design tokens

## Database Schema (key tables)
- `profiles` — user_id, full_name, phone, email (optional), avatar_url
- `user_roles` — separate table, enum `app_role` = admin|moderator|user. `moderator` = merchant. Use `has_role()` SECURITY DEFINER fn.
- `stores` — owner_id, name_en/ar, phone, **whatsapp_enabled**, **whatsapp_phone**, is_active
- `products` — store_id, category_id, name_en/ar, description_en/ar, price, pricing_model (fixed|negotiable), condition, brand, stock, images[], is_active
- `categories` — name_en/ar, icon, sort_order
- `orders` — customer_id, store_id, order_number, building/floor/apartment, payment_method (cod), status, total
  - **status CHECK constraint**: `pending | confirmed | preparing | out_for_delivery | delivered | cancelled` (fixed)
- `order_items` — order_id, product_id, quantity, unit_price
- `notifications` — auto-created by `notify_order_status_change()` trigger on order status change. Realtime enabled.
- `reviews` — only verified buyers (delivered orders) can post. Enforced by `user_has_delivered_product()` + RLS.
- `wishlists`, `support_tickets`, `slot_requests`, `merchant_applications`

### Key DB Functions
- `has_role(user_id, role)` — RLS helper, SECURITY DEFINER
- `user_has_delivered_product(user_id, product_id)` — review eligibility
- `user_has_order_from_store(user_id, store_id)` — chat/contact eligibility
- `merchant_active_slot_limit(store_id)` — base 20 + approved extras
- `enforce_product_slot_cap()` — trigger blocks new active products over cap
- `handle_new_user()` — trigger on auth.users insert → creates profile + 'user' role
- `notify_order_status_change()` — trigger fires notification on status change

### Realtime
- `orders` and `notifications` tables are in `supabase_realtime` publication

## Edge Functions
- `place-order` — creates order + items server-side (avoids client-side total tampering)
- `admin-delete-user` — uses `userClient.auth.getUser()` (was `getClaims` — fixed). Validates caller is admin via service role.

## Frontend Pages (all translated + RTL)
- `Index` — hero, categories, featured products
- `Browse` — product list with category filter (URL param `?category=`), search (URL param `?q=`)
- `ProductDetail` — gallery, add to cart, buy now, reviews (verified only). **Removed**: Chat/WhatsApp/Call buttons (per user request)
- `Cart`, `Checkout` — COD only, address inside compound
- `Account` — profile, orders, sign out
- `Login` — phone+password, eye toggle for password, optional email field on signup
- `MerchantApply`, `MerchantDashboard` — products CRUD, orders mgmt, store settings (phone, WhatsApp toggle/number), slot requests
- `AdminPanel` — users, stores, products, orders, categories, applications, slot requests
- `OrderTracking` — realtime status updates
- `StorePage`, `Help`, `Privacy`, `Terms`, `NotFound`

## Components
- `Header` — search bar with **live dropdown** (top 5 products, debounced 200ms, ↑↓ Enter nav), language toggle (applies site-wide)
- `Footer`, `NavLink`, `NotificationBell` (realtime), `ProductCard`, `ChatBot` (bilingual, support tickets, WhatsApp deep link)
- `src/lib/categorize.ts` — auto-categorizes products by name keywords (e.g., "iphone" → Electronics, "cake" → Sweets)

## Contexts
- `AuthContext` — user, session, profile, roles, isAdmin, isMerchant, signUp/In/Out
- `CartContext` — local cart state
- `LanguageContext` — `lang`, `setLang`, `t(en, ar)`, `dir`

## ✅ Issues Fixed in This Project

1. **Search bar broken** → fixed query + added live suggestions dropdown in Header
2. **Language toggle only affected search** → now applies globally; all pages flip RTL
3. **Auto-categorization** → `categorize.ts` matches keywords (cake→Sweets, iPhone→Electronics, etc.); auto-fills on Name blur in MerchantDashboard
4. **Full bilingual translation** — ProductDetail, Cart, Checkout, Account, MerchantDashboard, AdminPanel, all forms
5. **Merchant Add Product form in Arabic** + RTL inputs for Arabic name/description
6. **Store contact fields** — added `whatsapp_enabled` + `whatsapp_phone` columns; UI in MerchantDashboard
7. **Order status updates not reflecting** — root cause: DB CHECK constraint only allowed pending/confirmed/delivered/cancelled. **Fixed** by migration adding `preparing` and `out_for_delivery`. Also added optimistic local state update in `MerchantDashboard.updateOrderStatus`.
8. **Removed contact buttons** (Chat/WhatsApp/Call) from ProductDetail per user request
9. **Edge function TS error** — `auth.getClaims()` doesn't exist → replaced with `auth.getUser()` in `admin-delete-user`
10. **Email signup field** — made optional on Login page for order updates
11. **Password show/hide** — eye icon on Login
12. **Merchant slot system** — 20 active products default, request more via `slot_requests`, admin approves
13. **Verified-buyer-only reviews** — RLS + DB function enforced
14. **Realtime notifications** — bell shows new entries as orders update

## ⚠️ Known/Potential Lingering Issues

- **ChatBot.tsx is 347 lines** — flagged for refactor into smaller components
- **Toasts in older code paths** are not all translated — only new/touched code uses `t()`
- **WhatsApp button on StorePage / ProductDetail** — data is captured but UI surface deferred (user said remove from product page; OK for now)
- **No admin dashboard UI for support_tickets** beyond list view
- **Categorize keyword list** is finite — may need expansion per merchant feedback
- **Phone-to-email pattern** — if user changes phone, login email doesn't update. No flow for phone change yet.
- **No rate limiting** on edge functions
- **Single delivery zone** hardcoded (Dar Misr Al-Andalus compound only)

## Files Recently Edited (most relevant for handoff)
- `src/components/Header.tsx` — live search dropdown
- `src/contexts/LanguageContext.tsx` — global `t()` + `dir`
- `src/lib/categorize.ts` — keyword → category mapper
- `src/pages/MerchantDashboard.tsx` — full AR translation, store contact section, optimistic order status, auto-categorize on Name blur
- `src/pages/ProductDetail.tsx` — translation, removed contact buttons
- `src/pages/Cart.tsx`, `Checkout.tsx`, `Account.tsx`, `AdminPanel.tsx` — translations + RTL
- `supabase/functions/admin-delete-user/index.ts` — `getUser()` fix
- Migrations: added `whatsapp_enabled`/`whatsapp_phone` to stores; updated orders status CHECK constraint to include `preparing`, `out_for_delivery`

## Testing Checklist
1. Toggle EN→AR → entire site RTL with translated labels
2. Search "cake" in header → dropdown of matches → click → product page; or Enter → Browse filtered
3. Merchant types "iPhone 15" in Name (EN) → blur → Electronics auto-selected
4. Store settings → enable WhatsApp + number → save → reload persists
5. Merchant: order pending → confirmed → preparing → out_for_delivery → delivered → customer's OrderTracking updates live + bell notifies

## Important Constraints
- NEVER edit `src/integrations/supabase/client.ts` or `types.ts` (auto-generated)
- All colors via HSL semantic tokens — never hardcoded in components
- Roles ONLY in `user_roles` table (never on profiles) — privilege escalation risk
- Always use `has_role()` SECURITY DEFINER in RLS to avoid recursion
- COD only — no payment gateway integrated

## Brand & Voice
- Bilingual AR (primary for users) + EN
- Casual Egyptian Arabic in chatbot ("تقدر", "عشان", "ايميل")
- Free at launch, monetize later
