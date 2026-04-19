

Three features. Let me plan carefully.

### 1. Verified-buyer reviews
RLS on `reviews`: tighten INSERT to require `auth.uid() = user_id` AND a delivered order containing the product. Need a SECURITY DEFINER helper `user_has_delivered_product(_user_id, _product_id)` checking `orders` (status='delivered') JOIN `order_items` for the product. Update `Users can create reviews` policy to use it. UI in `ProductDetail.tsx`: only show review form if helper-equivalent client check passes; show "Only verified buyers can review" otherwise.

### 2. Order-status notifications + bell
- DB: trigger on `orders` AFTER UPDATE OF status — INSERT into `notifications` (user_id=customer_id, title="Order #X is now <status>", body). Bypasses RLS via SECURITY DEFINER.
- Realtime: enable `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;` and set REPLICA IDENTITY FULL.
- UI: new `NotificationBell.tsx` in `Header.tsx` — bell icon with unread count badge, dropdown listing recent notifications, click marks read. Subscribes to `notifications` realtime for current user.

### 3. Merchant 20-slot cap + request flow + replace
- New table `slot_requests` (user_id, store_id, requested_extra int, reason text, status pending/approved/rejected, granted_extra int).
- RLS: owners can SELECT/INSERT own; admins ALL.
- Effective cap = 20 + sum(granted_extra of approved requests for that store).
- Add helper `merchant_active_slot_limit(_store_id)` returning int.
- Trigger BEFORE INSERT on `products`: if active product count for store >= limit → raise.
- "Replace product": new product replaces existing one — implement client-side as "edit" already does. To make a true atomic swap that doesn't trip the cap when at the cap, add a `replaces_product_id` param flow: in `MerchantDashboard.tsx` add a "Replace" button on each product → opens product form prefilled empty; on submit, server-side via edge function `replace-product` that deletes (or sets is_active=false) the old then inserts new in a single transaction. Simpler & safer: keep it as UPDATE-in-place under a "Replace" UI that resets all fields — this is just an edit. Since edit doesn't consume a slot, "Replace" = edit with cleared fields. Done client-side, no backend change needed for replace itself.
- Admin panel: new "Slot Requests" tab to approve/reject and set granted_extra.
- Merchant dashboard: show "X / Y slots used", "Request more slots" button → dialog → inserts row.

### Migration (single)
- `user_has_delivered_product` function + tighten reviews INSERT policy.
- Notifications insert trigger on orders status change + enable realtime.
- `slot_requests` table + RLS + `merchant_active_slot_limit` function + product-cap trigger.

### Files
- **Migration**: all of the above
- **New**: `src/components/NotificationBell.tsx`
- **Edit**: `src/components/Header.tsx` (mount bell), `src/pages/ProductDetail.tsx` (gate review form), `src/pages/MerchantDashboard.tsx` (slot counter, request dialog, replace button = edit-with-cleared-fields), `src/pages/AdminPanel.tsx` (slot-requests tab)

### Out of scope
- Email notifications (in-app + realtime covers the request)
- Delivered-purchase enforcement on existing reviews (only new ones gated)
- Aggregated analytics for slot usage

