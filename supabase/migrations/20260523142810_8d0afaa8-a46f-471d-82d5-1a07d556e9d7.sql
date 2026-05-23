
-- Add explicit customer INSERT policy for orders (defense-in-depth; place-order edge function uses service role)
CREATE POLICY "Customers can create own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

-- Add explicit customer INSERT policy for order_items (must belong to an order they own)
CREATE POLICY "Customers can create items for own orders"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.customer_id = auth.uid()
  )
);

-- Revoke direct EXECUTE on SECURITY DEFINER helpers from anon/authenticated.
-- These are only used internally by RLS policies and triggers, which run with definer privileges regardless.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.user_has_delivered_product(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.user_has_order_from_store(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.merchant_active_slot_limit(uuid) FROM anon, authenticated, public;
