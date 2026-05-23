
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_product_slot_cap() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_order_status_change() FROM anon, authenticated, public;
