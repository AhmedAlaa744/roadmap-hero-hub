DROP POLICY IF EXISTS "Store owners can update own products" ON public.products;

CREATE POLICY "Store owners can update own products"
ON public.products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.stores
    WHERE stores.id = products.store_id
      AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.stores
    WHERE stores.id = products.store_id
      AND stores.owner_id = auth.uid()
  )
);