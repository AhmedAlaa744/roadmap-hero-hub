
-- =========================================
-- 1) Verified-buyer reviews
-- =========================================
CREATE OR REPLACE FUNCTION public.user_has_delivered_product(_user_id uuid, _product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.customer_id = _user_id
      AND oi.product_id = _product_id
      AND o.status = 'delivered'
  )
$$;

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Verified buyers can create reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.user_has_delivered_product(auth.uid(), product_id)
);

-- =========================================
-- 2) Order status notifications + realtime
-- =========================================
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (
      NEW.customer_id,
      'Order ' || NEW.order_number || ' update',
      'Your order is now: ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_order_status_change ON public.orders;
CREATE TRIGGER trg_notify_order_status_change
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();

-- Allow trigger-created notifications (SECURITY DEFINER bypasses RLS, but add a system insert policy too for safety)
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =========================================
-- 3) Slot requests + product cap
-- =========================================
CREATE TABLE IF NOT EXISTS public.slot_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id uuid NOT NULL,
  requested_extra integer NOT NULL CHECK (requested_extra > 0),
  granted_extra integer NOT NULL DEFAULT 0,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.slot_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own slot requests"
ON public.slot_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Owners create own slot requests"
ON public.slot_requests FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
);

CREATE POLICY "Admins manage slot requests"
ON public.slot_requests FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_slot_requests_updated_at
BEFORE UPDATE ON public.slot_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Effective slot limit per store
CREATE OR REPLACE FUNCTION public.merchant_active_slot_limit(_store_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 20 + COALESCE((
    SELECT SUM(granted_extra)::int
    FROM public.slot_requests
    WHERE store_id = _store_id AND status = 'approved'
  ), 0)
$$;

-- Cap enforcement on insert
CREATE OR REPLACE FUNCTION public.enforce_product_slot_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count int;
  cap int;
BEGIN
  IF NEW.is_active = false THEN
    RETURN NEW;
  END IF;
  SELECT COUNT(*) INTO active_count
  FROM public.products
  WHERE store_id = NEW.store_id AND is_active = true;
  cap := public.merchant_active_slot_limit(NEW.store_id);
  IF active_count >= cap THEN
    RAISE EXCEPTION 'Product slot limit reached (%/%) for this store. Request more slots from the admin.', active_count, cap
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_product_slot_cap ON public.products;
CREATE TRIGGER trg_enforce_product_slot_cap
BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.enforce_product_slot_cap();
