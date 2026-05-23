
-- Allow orders without a customer account (guest checkout)
ALTER TABLE public.orders
  ALTER COLUMN customer_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS guest_email text;

-- Either an authenticated customer or a guest with name + phone
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_customer_or_guest_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_customer_or_guest_check CHECK (
    customer_id IS NOT NULL
    OR (guest_name IS NOT NULL AND length(btrim(guest_name)) > 0
        AND guest_phone IS NOT NULL AND length(btrim(guest_phone)) > 0)
  );

-- Update notification trigger to skip guest orders (no user to notify in-app)
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.customer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (
      NEW.customer_id,
      'Order ' || NEW.order_number || ' update',
      'Your order is now: ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.notify_order_status_change() FROM anon, authenticated, public;

-- Guest order lookup function (returns order if order_number + phone match)
CREATE OR REPLACE FUNCTION public.lookup_guest_order(_order_number text, _phone text)
RETURNS TABLE (
  id uuid,
  order_number text,
  status text,
  total numeric,
  building text,
  floor text,
  apartment text,
  payment_method text,
  notes text,
  guest_name text,
  guest_phone text,
  guest_email text,
  store_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.order_number, o.status, o.total, o.building, o.floor, o.apartment,
         o.payment_method, o.notes, o.guest_name, o.guest_phone, o.guest_email,
         o.store_id, o.created_at, o.updated_at
  FROM public.orders o
  WHERE o.order_number = _order_number
    AND o.customer_id IS NULL
    AND regexp_replace(coalesce(o.guest_phone, ''), '[^0-9]', '', 'g')
        = regexp_replace(coalesce(_phone, ''), '[^0-9]', '', 'g')
    AND length(regexp_replace(coalesce(_phone, ''), '[^0-9]', '', 'g')) >= 6
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.lookup_guest_order(text, text) TO anon, authenticated;

-- Guest order items lookup
CREATE OR REPLACE FUNCTION public.lookup_guest_order_items(_order_number text, _phone text)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  quantity int,
  unit_price numeric,
  product_name_en text,
  product_name_ar text,
  product_images text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price,
         p.name_en, p.name_ar, p.images
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE o.order_number = _order_number
    AND o.customer_id IS NULL
    AND regexp_replace(coalesce(o.guest_phone, ''), '[^0-9]', '', 'g')
        = regexp_replace(coalesce(_phone, ''), '[^0-9]', '', 'g')
    AND length(regexp_replace(coalesce(_phone, ''), '[^0-9]', '', 'g')) >= 6;
$$;
GRANT EXECUTE ON FUNCTION public.lookup_guest_order_items(text, text) TO anon, authenticated;
