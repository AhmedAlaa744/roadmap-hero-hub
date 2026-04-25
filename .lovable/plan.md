

## Plan

### 1. Bilingual translations with `useLanguage` (`t(en, ar)` + `dir`)
Wrap each page in `dir={lang === "ar" ? "rtl" : "ltr"}` and translate visible strings:
- **`src/pages/ProductDetail.tsx`** — labels: Add to Cart, Buy Now, Stock, Reviews, Description, Verified buyers only message, rating labels.
- **`src/pages/Cart.tsx`** — Cart title, empty state, totals, Checkout button, Continue Shopping.
- **`src/pages/Checkout.tsx`** — Delivery details, Building/Floor/Apartment, Notes, Payment method (COD / Card), Place Order, validation toasts.
- **`src/pages/Account.tsx`** — My Account, Profile fields, My Orders, Sign Out.
- **`src/pages/MerchantDashboard.tsx`** — Stats (Active Products, Orders, Revenue, Rating, slots, Request more), Tabs (Products / Orders), all form labels, status select options, slot-request dialog, toasts, replace/edit buttons.
- **`src/pages/AdminPanel.tsx`** — every tab title, table headers, action buttons, Slot Requests tab labels, toasts.

### 2. Live search dropdown in `Header.tsx`
Under the desktop + mobile search input, add a popover with **top 5 active products** matching the current query (debounced 200 ms). Each item shows thumbnail, bilingual name, price, store. Click → `/product/:id`. Pressing Enter or clicking outside closes it.
- Query: `supabase.from("products").select("id,name_en,name_ar,price,images,store_id").eq("is_active", true).or(\`name_en.ilike.%q%,name_ar.ilike.%q%\`).limit(5)`.
- Keyboard: ↑/↓ navigates, Enter selects.
- Hide when query length < 2.

### 3. Merchant "Add Product" form — Arabic-first + WhatsApp fields
- Translate every label/placeholder/option (Condition, Pricing model, Brand, Stock, Image upload prompt, Save buttons) using `t(en, ar)`.
- Add **store-level contact fields** to the dashboard "Store settings" area (or just at the top of the Products tab when missing):
  - **Phone** (required, prefilled from `stores.phone`).
  - **WhatsApp available** checkbox.
  - **WhatsApp number** (shown only when checkbox is on; defaults to phone if empty).
- DB migration:
  - `ALTER TABLE public.stores ADD COLUMN whatsapp_enabled boolean NOT NULL DEFAULT false;`
  - `ALTER TABLE public.stores ADD COLUMN whatsapp_phone text;`
- Update `StorePage.tsx` and `ProductDetail.tsx` later (out of scope here unless trivial) — for now just persist the data; surface a "WhatsApp" link on the merchant dashboard preview row.

### 4. Order status — fix "only pending/confirmed reflect to customer"
Diagnosis: realtime is enabled on `orders`, the trigger writes to `notifications`, but the merchant `<select>` currently allows all 6 statuses including `preparing`, `out_for_delivery`, `delivered`, `cancelled`. The likely root cause the user is reporting is that these later statuses just don't *appear to update* — because:
1. The select fires `updateOrderStatus` and re-fetches, but there is **no realtime subscription on the merchant dashboard**, so after the update the local view may stale-revert when another tab is open. Fix: keep `fetchData()` after the update (already done) AND add an optimistic local update in `updateOrderStatus` so the UI reflects immediately.
2. Customer side: `OrderTracking.tsx` already has a realtime subscription and renders all statuses — verified by reading the file. Notifications also fire from the trigger. So the customer **does** see updates; the user's perception is likely the merchant select reverting.
- Fix in `MerchantDashboard.updateOrderStatus`: optimistically update `orders` state before/instead of full `fetchData`, and surface backend errors clearly.
- Also re-confirm `notifications` table is already enabled for realtime (it is) and the bell shows the new entries.

### Migration (single SQL file)
```sql
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text;
```

### Files
- **Migration**: `stores` whatsapp columns.
- **Edit**:
  - `src/components/Header.tsx` — live search dropdown.
  - `src/pages/ProductDetail.tsx`, `src/pages/Cart.tsx`, `src/pages/Checkout.tsx`, `src/pages/Account.tsx`, `src/pages/MerchantDashboard.tsx`, `src/pages/AdminPanel.tsx` — `useLanguage` translations + RTL dir.
  - `src/pages/MerchantDashboard.tsx` — store contact section (phone + WA toggle + WA number), optimistic order-status update.

### Out of scope
- Full translation of every secondary string (toasts already covered for new code; existing toasts left as-is unless trivially nearby).
- Surfacing WhatsApp button on `StorePage` / `ProductDetail` (data is captured; UI exposure can be a follow-up).
- Moving order-status enum to a DB CHECK constraint or enum type.
- Additional category keyword tuning beyond what's in `categorize.ts`.

### Test checklist after implementation
1. Toggle EN→AR in header; verify ProductDetail, Cart, Checkout, Account, MerchantDashboard, AdminPanel flip to RTL with translated labels.
2. Type "cake" in header search → see live dropdown of up to 5 matches; click one → product page.
3. As a merchant, type "iPhone 15" in Name (EN) → blur → Electronics auto-selected.
4. Open store settings → enable WhatsApp + enter number → save → reload, value persists.
5. As merchant, set an order to `preparing` then `out_for_delivery` then `delivered` → customer's `OrderTracking` updates live and notification bell shows new entries.

