

## Goal
Enforce per-product stock cap (set by merchant) end-to-end so customers can never order more than the available quantity.

## Current state
- **Merchant** already sets `stock` in the dashboard (existing field).
- **Server** (`place-order` edge function) already blocks orders with `p.stock < it.quantity` ✅ — security is fine.
- **Client UI** does NOT enforce the cap, and stock is **not decremented** after a successful order, so the cap silently grows stale.

## Plan

### 1. Carry `stock` through to the client
- Add `stock: number` to the `Product` interface in `src/data/mockData.ts`.
- Set `stock: p.stock` in every `toProduct(...)` mapper:
  - `src/pages/ProductDetail.tsx`
  - `src/pages/Browse.tsx`
  - `src/pages/Index.tsx`
  - any other place a product is built (search/grep for `toProduct` / `in_stock:`).

### 2. ProductDetail page — cap quantity selector
- `+` button disabled when `quantity >= product.stock`.
- `−` button disabled at `1`.
- Show `Only X left` label next to the selector when `stock <= 5`.
- If `stock === 0`: hide quantity selector + Add to Cart, show "Out of Stock" badge instead.
- When clicking Add to Cart, clamp `quantity` to `min(quantity, stock)` and show toast if clamped.

### 3. Cart page — cap quantity buttons
- `updateQuantity` `+` disabled when `item.quantity >= item.product.stock`.
- Show small `Max: X` hint under the qty stepper.
- On checkout click, re-validate each line against `product.stock`; if any exceeds, block navigation and toast.

### 4. CartContext — defensive cap in `addToCart`
- When adding a product, if `existing.quantity + qty > product.stock`, cap to `product.stock` and surface a flag the caller can toast on. Simplest: clamp silently and let the page show toast.

### 5. Auto-decrement stock after order (server)
In `supabase/functions/place-order/index.ts`, after `order_items` insert succeeds for a store group, decrement each product's stock:
```ts
for (const it of group.items) {
  const p = productMap.get(it.product_id)!;
  await admin.from("products")
    .update({ stock: p.stock - it.quantity })
    .eq("id", it.product_id);
}
```
- Refresh `productMap` per loop so concurrent items in the same order don't double-spend (recompute remaining from in-memory map).
- If stock would drop to 0, that's fine — RLS `is_active` toggle is a separate concern; stock=0 just blocks future orders via existing check.

### 6. Refresh stale carts
- On Cart page mount, fetch latest `stock` for each `item.product.id` and clamp quantities; toast "Some items were adjusted to match available stock" if any line was capped.

## Files to touch
- `src/data/mockData.ts` — add `stock` to interface
- `src/pages/ProductDetail.tsx` — cap quantity controls + UI
- `src/pages/Cart.tsx` — cap qty + on-mount stock refresh + checkout guard
- `src/pages/Browse.tsx`, `src/pages/Index.tsx` — set `stock` in mapper
- `src/contexts/CartContext.tsx` — clamp `addToCart`
- `supabase/functions/place-order/index.ts` — decrement stock after successful insert

## Out of scope
- Reservations / hold timers (true atomic stock locking) — overkill for a community marketplace. The combination of server-side check + immediate decrement gives strong enough protection.

