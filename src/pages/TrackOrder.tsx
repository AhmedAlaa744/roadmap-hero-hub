import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Package, CheckCircle, Clock, Truck, XCircle, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const STATUS_FLOW = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"] as const;

const TrackOrder = () => {
  const { t, dir } = useLanguage();
  const [params, setParams] = useSearchParams();
  const [orderNum, setOrderNum] = useState(params.get("order") || "");
  const [phone, setPhone] = useState(params.get("phone") || "");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const statusLabel = (s: string) => ({
    pending: t("Pending", "قيد الانتظار"),
    confirmed: t("Confirmed", "مؤكد"),
    preparing: t("Preparing", "قيد التجهيز"),
    out_for_delivery: t("Out for Delivery", "في الطريق إليك"),
    delivered: t("Delivered", "تم التوصيل"),
    cancelled: t("Cancelled", "ملغي"),
  } as Record<string, string>)[s] || s;

  const statusIcon: Record<string, any> = {
    pending: Clock, confirmed: CheckCircle, preparing: Package,
    out_for_delivery: Truck, delivered: CheckCircle, cancelled: XCircle,
  };

  const lookup = async (orderArg?: string, phoneArg?: string) => {
    const o = (orderArg ?? orderNum).trim();
    const p = (phoneArg ?? phone).trim();
    if (!o || !p) {
      toast.error(t("Enter order number and phone", "أدخل رقم الطلب والهاتف"));
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.rpc("lookup_guest_order", {
        _order_number: o,
        _phone: p,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setOrder(null);
        setItems([]);
        return;
      }
      setOrder(row);
      const { data: itemRows } = await supabase.rpc("lookup_guest_order_items", {
        _order_number: o,
        _phone: p,
      });
      setItems(itemRows || []);
      setParams({ order: o, phone: p }, { replace: true });
    } catch (err: any) {
      toast.error(err.message || t("Lookup failed", "فشل البحث"));
    } finally {
      setLoading(false);
    }
  };

  // Auto-lookup if both query params present on first load
  useEffect(() => {
    const o = params.get("order");
    const p = params.get("phone");
    if (o && p && !searched) lookup(o, p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: refresh on status change for this order
  useEffect(() => {
    if (!order?.id) return;
    const channel = supabase
      .channel(`guest-order-${order.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${order.id}` },
        () => lookup(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  const currentStep = order ? STATUS_FLOW.indexOf(order.status as any) : -1;
  const isCancelled = order?.status === "cancelled";

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">{t("Track Your Order", "تتبع طلبك")}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t("Enter the order number and the phone number you used at checkout.", "أدخل رقم الطلب ورقم الهاتف الذي استخدمته عند الدفع.")}
        </p>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">{t("Order Number", "رقم الطلب")}</label>
              <Input value={orderNum} onChange={(e) => setOrderNum(e.target.value)} placeholder="GRK-XXXXXXXX-XXXX" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t("Phone", "الهاتف")}</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" inputMode="tel" className="mt-1" />
            </div>
          </div>
          <Button onClick={() => lookup()} disabled={loading} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            {loading ? t("Searching...", "جاري البحث...") : t("Find Order", "ابحث عن الطلب")}
          </Button>
        </div>

        {searched && !loading && !order && (
          <div className="mt-6 text-center text-muted-foreground rounded-2xl border border-border bg-card p-8">
            {t("No order found. Check the order number and phone you entered.", "لم يتم العثور على طلب. تأكد من رقم الطلب والهاتف.")}
          </div>
        )}

        {order && (
          <>
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t("Order Number", "رقم الطلب")}</p>
                  <h2 className="text-xl font-bold text-foreground">{order.order_number}</h2>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                  isCancelled ? "bg-destructive/10 text-destructive" :
                  order.status === "delivered" ? "bg-success/10 text-success" :
                  "bg-primary/10 text-primary"
                }`}>{statusLabel(order.status)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("Placed", "تم في")} {new Date(order.created_at).toLocaleString()}</p>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <h3 className="font-bold text-foreground mb-6">{t("Order Status", "حالة الطلب")}</h3>
              {isCancelled ? (
                <div className="flex items-center gap-3 text-destructive">
                  <XCircle className="h-6 w-6" />
                  <p className="font-semibold">{t("Order Cancelled", "تم إلغاء الطلب")}</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {STATUS_FLOW.map((step, idx) => {
                    const Icon = statusIcon[step];
                    const isDone = idx <= currentStep;
                    const isActive = idx === currentStep;
                    return (
                      <div key={step} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          {idx < STATUS_FLOW.length - 1 && (
                            <div className={`w-0.5 h-8 ${idx < currentStep ? "bg-primary" : "bg-border"}`} />
                          )}
                        </div>
                        <div className="pb-8 pt-2">
                          <p className={`font-semibold ${isDone ? "text-foreground" : "text-muted-foreground"}`}>{statusLabel(step)}</p>
                          {isActive && <p className="text-xs text-primary mt-0.5">{t("Current status", "الحالة الحالية")}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="mt-6 rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold text-foreground mb-4">{t("Items", "المنتجات")}</h3>
                <div className="space-y-3">
                  {items.map((it: any) => (
                    <div key={it.id} className="flex gap-3 items-center">
                      {it.product_images?.[0] && (
                        <img src={it.product_images[0]} alt="" className="h-14 w-14 rounded-lg object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{it.product_name_en || it.product_name_ar || "Item"}</p>
                        <p className="text-xs text-muted-foreground">{t("Qty", "الكمية")}: {it.quantity} × EGP {Number(it.unit_price).toLocaleString()}</p>
                      </div>
                      <p className="font-semibold text-foreground">EGP {(Number(it.unit_price) * it.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border mt-4 pt-3 flex justify-between font-bold">
                  <span className="text-foreground">{t("Total", "الإجمالي")}</span>
                  <span className="text-primary text-xl">EGP {Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">{t("Delivery Address", "عنوان التوصيل")}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("Building", "عمارة")} {order.building}
                {order.floor && `, ${t("Floor", "الدور")} ${order.floor}`}
                {order.apartment && `, ${t("Apt", "شقة")} ${order.apartment}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("Dar Misr Al-Andalus", "دار مصر الأندلس")}</p>
            </div>
          </>
        )}

        <div className="mt-8 text-center">
          <Link to="/browse" className="text-sm text-primary hover:underline">{t("← Continue Shopping", "متابعة التسوق →")}</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TrackOrder;
