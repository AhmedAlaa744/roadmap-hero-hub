
-- Drop the recursive policy
DROP POLICY IF EXISTS "Customers can view ordered stores" ON public.stores;

-- Helper function (SECURITY DEFINER bypasses RLS to break the loop)
CREATE OR REPLACE FUNCTION public.user_has_order_from_store(_store_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE store_id = _store_id AND customer_id = _user_id
  )
$$;

-- Recreate the policy using the safe function
CREATE POLICY "Customers can view ordered stores"
  ON public.stores FOR SELECT
  USING (public.user_has_order_from_store(id, auth.uid()));
