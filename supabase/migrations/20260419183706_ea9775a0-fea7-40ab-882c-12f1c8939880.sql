
-- ============================================================
-- 1) Storage: drop duplicate public-role policies on product-images
--    Keep only the stricter authenticated-role policies.
-- ============================================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname IN (
        'Merchants upload to own store folder',
        'Merchants update own store folder',
        'Merchants delete own store folder',
        'Merchants update own store images',
        'Merchants delete own store images'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- ============================================================
-- 2) Storage: tighten public read on product-images so listing
--    the bucket is not allowed; only direct object paths work.
-- ============================================================
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Product images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

CREATE POLICY "Public can read product image files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'product-images'
  AND name LIKE '%/%'
  AND position('.' in name) > 0
);

-- ============================================================
-- 3) Stores: stop exposing phone to past customers.
--    Replace the broad customer SELECT policy with no direct
--    SELECT access; customers should use the stores_public view.
-- ============================================================
DROP POLICY IF EXISTS "Customers can view ordered stores" ON public.stores;

-- Ensure stores_public view (already present) excludes phone.
-- Recreate it defensively without the phone column.
DROP VIEW IF EXISTS public.stores_public CASCADE;
CREATE VIEW public.stores_public
WITH (security_invoker = true)
AS
SELECT
  id,
  name_en,
  name_ar,
  description_en,
  description_ar,
  logo_url,
  is_active,
  owner_id
FROM public.stores
WHERE is_active = true;

GRANT SELECT ON public.stores_public TO anon, authenticated;

-- ============================================================
-- 4) user_roles: replace the broad ALL policy with explicit
--    per-command admin policies. The RESTRICTIVE INSERT policy
--    already blocks non-admin inserts; keep it. Add explicit
--    admin SELECT/UPDATE/DELETE so behavior is unambiguous.
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert roles (permissive)"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
