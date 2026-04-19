DROP POLICY IF EXISTS "Store owners can manage own products" ON public.products;
DROP POLICY IF EXISTS "Store owners can update own products" ON public.products;
DROP POLICY IF EXISTS "Store owners can delete own products" ON public.products;
DROP POLICY IF EXISTS "Active products viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

CREATE POLICY "Active products viewable by everyone"
ON public.products
FOR SELECT
TO public
USING (
  is_active = true
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1
    FROM public.stores
    WHERE stores.id = products.store_id
      AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all products"
ON public.products
FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Store owners can create own products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.stores
    WHERE stores.id = products.store_id
      AND stores.owner_id = auth.uid()
  )
);

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

CREATE POLICY "Store owners can delete own products"
ON public.products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.stores
    WHERE stores.id = products.store_id
      AND stores.owner_id = auth.uid()
  )
);