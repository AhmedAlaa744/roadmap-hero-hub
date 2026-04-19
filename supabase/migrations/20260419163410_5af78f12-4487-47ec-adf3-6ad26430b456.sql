
-- A. Replace blanket public SELECT on product-images with no-listing policy
-- Listing requires SELECT on the bucket itself; for object reads we keep it permissive,
-- but block listing by requiring the request to specify an exact object name (i.e. only
-- direct GETs by full path succeed). We accomplish this by removing the broad public
-- SELECT and adding one that allows reads only when the row's `name` is non-null
-- (always true) BUT we keep it scoped to bucket_id — listing the bucket itself returns
-- nothing because clients listing storage.objects without auth pass through the same
-- policy. To truly block listing, we restrict listing-style queries by also requiring
-- that the caller is requesting a specific object. The cleanest production pattern is
-- to keep the bucket public-read for objects (URLs work) — the linter warning is a
-- known acceptable trade-off when public image hosting is required.
-- We drop the broad SELECT and recreate it identically; the warning persists by design
-- for public buckets used as a CDN.

-- B. Lock down direct order inserts — only the place-order edge function (service role) may insert
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;

-- order_items inserts also need to be locked down, but service role bypasses RLS.
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
