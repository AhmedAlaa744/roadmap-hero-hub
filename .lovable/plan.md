

The user wants the previously approved plan PLUS:
- Admin can delete/edit anything
- Full account control + reports on admin panel

Let me build on the prior plan and add these.

## Plan

### 1. Public Store page `/store/:id` (`src/pages/StorePage.tsx`)
Header (logo, name EN/AR, description, member-since, avg rating), Products grid (active items via existing `ProductCard`), Reviews tab (joined `reviews → products → store_id`). Make `ProductCard` store name a `Link` to this page.

### 2. Product reviews on `ProductDetail.tsx`
- Replace hardcoded `4.5` with computed avg from `reviews` table.
- "Reviews" section: list (stars, reviewer name from `profiles`, comment, date).
- Logged-in users: submit / edit / delete own review (RLS already supports this).

### 3. ChatBot — confirmed neutral (no owner name, only `01116895960`). No change.

### 4. Merchant order workflow (`MerchantDashboard.tsx`)
Replace single-action button with a status `<select>`: pending → confirmed → preparing → out_for_delivery → delivered → cancelled. `OrderTracking.tsx` already subscribes to realtime; enable realtime on `orders`:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
```

### 5. Admin = head of pyramid (`AdminPanel.tsx`)
Full edit/delete on everything (RLS already permits ALL for admin):

**Orders tab**: status `<select>` for every order (all 6 states), delete order button.
**Products tab**: keep approve/hide; add **inline edit modal** (name, price, stock, is_active, category) + hard delete.
**Users tab**: 
  - Role manager — toggle `admin` / `moderator` / `user` per user (insert/delete on `user_roles`).
  - Edit profile (full_name, phone, email).
  - Delete user button (deletes profile + roles + cascades; auth user removal needs an edge function `admin-delete-user` using service role).
**Stores tab (new)**: list every store, toggle `is_active`, edit name/description/phone, delete store, link to public `/store/:id`.
**Applications / Support**: keep current + add delete buttons.

### 6. Reports dashboard (new "Reports" tab in `AdminPanel.tsx`)
Computed client-side from existing queries (no schema change):
- **KPIs**: total revenue (sum delivered orders), orders today / this week / this month, new users (7d / 30d), active stores, total products, low-stock count (≤5), pending applications, open tickets.
- **Charts** (using existing `recharts` from shadcn):
  - Orders per day (last 30 days) — line chart
  - Revenue per day (last 30 days) — bar chart
  - Orders by status — pie chart
  - Top 5 stores by revenue — horizontal bar
  - Top 5 products by units sold — horizontal bar
- **CSV export** buttons: orders, products, users, reviews — generated client-side, downloaded as `.csv`.

### 7. Edge function `admin-delete-user`
New `supabase/functions/admin-delete-user/index.ts` — verifies caller is admin via JWT + `has_role`, then uses service-role client to call `auth.admin.deleteUser(id)`. Cascades profile/roles/orders cleanup via SQL.

## Files
- **New**: `src/pages/StorePage.tsx`, `supabase/functions/admin-delete-user/index.ts`
- **Edit**: `src/App.tsx`, `src/pages/ProductDetail.tsx`, `src/pages/MerchantDashboard.tsx`, `src/pages/AdminPanel.tsx`, `src/components/ProductCard.tsx`
- **Migration**: enable realtime on `orders`

## Out of scope
- Email/SMS notifications on status change (in-app realtime covers it)
- Verified-purchase enforcement on reviews
- Server-side aggregated analytics views (client-side aggregation is fine at current scale)

