DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Merchants can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Merchants can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Merchants can delete own product images" ON storage.objects;

CREATE POLICY "Public can read product images by path"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'product-images'
  AND storage.foldername(name) IS NOT NULL
  AND array_length(storage.foldername(name), 1) >= 1
);

CREATE POLICY "Merchants can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND array_length(storage.foldername(name), 1) >= 1
  AND EXISTS (
    SELECT 1
    FROM public.stores
    WHERE stores.id::text = (storage.foldername(name))[1]
      AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Merchants can update own product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND array_length(storage.foldername(name), 1) >= 1
  AND EXISTS (
    SELECT 1
    FROM public.stores
    WHERE stores.id::text = (storage.foldername(name))[1]
      AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'product-images'
  AND array_length(storage.foldername(name), 1) >= 1
  AND EXISTS (
    SELECT 1
    FROM public.stores
    WHERE stores.id::text = (storage.foldername(name))[1]
      AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Merchants can delete own product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND array_length(storage.foldername(name), 1) >= 1
  AND EXISTS (
    SELECT 1
    FROM public.stores
    WHERE stores.id::text = (storage.foldername(name))[1]
      AND stores.owner_id = auth.uid()
  )
);