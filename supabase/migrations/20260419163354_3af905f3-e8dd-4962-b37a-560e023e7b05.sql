
-- 1. Drop weak / duplicate storage policies on product-images
DROP POLICY IF EXISTS "Store owners can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Product images publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
DROP POLICY IF EXISTS "Merchants upload to own store folder" ON storage.objects;
DROP POLICY IF EXISTS "Merchants update own store folder" ON storage.objects;
DROP POLICY IF EXISTS "Merchants delete own store folder" ON storage.objects;

-- 2. Public read for individual product images (no listing — listing requires authenticated check below)
CREATE POLICY "Product images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 3. Folder-scoped write policies for product-images
CREATE POLICY "Merchants upload to own store folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Merchants update own store folder"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Merchants delete own store folder"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
    )
  );

-- 4. Add explicit RESTRICTIVE policy on user_roles INSERT — only admins, ever
DROP POLICY IF EXISTS "Block self role assignment" ON public.user_roles;

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
