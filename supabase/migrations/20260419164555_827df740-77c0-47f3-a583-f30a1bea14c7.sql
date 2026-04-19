ALTER POLICY "Store owners can create own products"
ON public.products
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.stores
    WHERE stores.id = products.store_id
      AND stores.owner_id = auth.uid()
  )
);