DROP POLICY IF EXISTS "Public can read product images by path" ON storage.objects;

CREATE POLICY "Public can read product images by exact file path"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'product-images'
  AND name LIKE '%/%'
  AND position('/' in name) > 1
);