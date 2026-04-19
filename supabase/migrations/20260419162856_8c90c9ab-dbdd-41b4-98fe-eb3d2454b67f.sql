
-- ============ PROFILES ============
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Public-safe view (no phone)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT user_id, full_name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- ============ STORES ============
DROP POLICY IF EXISTS "Active stores viewable by everyone" ON public.stores;

-- Owner + admin direct access
CREATE POLICY "Owners can view own store"
  ON public.stores FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all stores"
  ON public.stores FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Customers who ordered from this store
CREATE POLICY "Customers can view ordered stores"
  ON public.stores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.store_id = stores.id AND orders.customer_id = auth.uid()
  ));

-- Public-safe view (no phone)
CREATE OR REPLACE VIEW public.stores_public
WITH (security_invoker=on) AS
SELECT id, owner_id, name_en, name_ar, description_en, description_ar, logo_url, is_active
FROM public.stores
WHERE is_active = true;

GRANT SELECT ON public.stores_public TO anon, authenticated;

-- ============ USER_ROLES ============
-- Block all non-admin inserts (admin ALL policy still permits admins)
CREATE POLICY "Block self role assignment"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ STORAGE: product-images ============
-- Drop existing wide-open write policies if any
DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;

-- Public read for individual objects
CREATE POLICY "Product images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Merchants can only write inside folders matching a store they own
CREATE POLICY "Merchants upload to own store folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.owner_id = auth.uid()
        AND stores.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Merchants update own store images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.owner_id = auth.uid()
        AND stores.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Merchants delete own store images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.owner_id = auth.uid()
        AND stores.id::text = (storage.foldername(name))[1]
    )
  );
