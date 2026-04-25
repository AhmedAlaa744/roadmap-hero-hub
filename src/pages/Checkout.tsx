import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

const Checkout = () => {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { t, dir, lang } = useLanguage();
  const navigate = useNavigate();
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  if (!user) {
    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground mb-4">{t("Please sign in to checkout", "الرجاء تسجيل الدخول لإتمام الطلب")}</p>
          <Link to="/login"><Button>{t("Sign In", "تسجيل الدخول")}</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (orderNumber) {
    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <Header />
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">{t("Order Placed!", "تم تقديم الطلب!")}</h1>
          <p className="text-muted-foreground mt-2">{t("Your order number is", "رقم طلبك هو")}</p>
          <p className="text-2xl font-bold text-primary mt-2">{orderNumber}</p>
          <p className="text-sm text-muted-foreground mt-4">{t("You'll receive updates on your order status.", "ستتلقى تحديثات حول حالة طلبك.")}</p>
          <div className="flex gap-3 justify-center mt-8">
            <Link to="/account"><Button variant="outline">{t("My Orders", "طلباتي")}</Button></Link>
            <Link to="/browse"><Button>{t("Continue Shopping", "متابعة التسوق")}</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!building.trim()) {
      toast.error(t("Building number is required", "رقم المبنى مطلوب"));
      return;
    }
    if (items.length === 0) {
      toast.error(t("Your cart is empty", "سلتك فارغة"));
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("place-order", {
        body: {
          items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
          building,
          floor: floor || null,
          apartment: apartment || null,
          payment_method: paymentMethod,
          notes: notes || null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      clearCart();
      setOrderNumber(data.order_number);
      toast.success(t("Order placed successfully!", "تم تقديم الطلب بنجاح!"));
    } catch (err: any) {
      toast.error(err.message || t("Failed to place order", "فشل في تقديم الطلب"));
    } finally {
      setLoading(false);
    }
  };

  const productName = (p: any) => (lang === "ar" && p.name_ar ? p.name_ar : p.name_en);

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-8">{t("Checkout", "الدفع")}</h1>

        <div className="space-y-6">
          {/* Delivery address */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-bold text-foreground">{t("Delivery Address", "عنوان التوصيل")}</h2>
            <p className="text-xs text-muted-foreground">{t("Dar Misr Al-Andalus compound", "كمبوند دار مصر الأندلس")}</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">{t("Building", "المبنى")} *</label>
                <Input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder={t("e.g. B12", "مثال: B12")} required className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t("Floor", "الطابق")}</label>
                <Input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder={t("e.g. 3", "مثال: 3")} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t("Apartment", "الشقة")}</label>
                <Input value={apartment} onChange={(e) => setApartment(e.target.value)} placeholder={t("e.g. 5", "مثال: 5")} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t("Notes (optional)", "ملاحظات (اختياري)")}</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" placeholder={t("Any special instructions...", "أي تعليمات خاصة...")} />
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-bold text-foreground">{t("Payment Method", "طريقة الدفع")}</h2>
            <div className="flex gap-3">
              <button onClick={() => setPaymentMethod("cod")} className={`flex-1 rounded-lg border p-3 text-sm font-medium transition-colors ${paymentMethod === "cod" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
                💵 {t("Cash on Delivery", "الدفع عند الاستلام")}
              </button>
              <button onClick={() => setPaymentMethod("online")} className={`flex-1 rounded-lg border p-3 text-sm font-medium transition-colors ${paymentMethod === "online" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
                💳 {t("Online Payment", "الدفع الإلكتروني")}
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-bold text-foreground">{t("Order Summary", "ملخص الطلب")}</h2>
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{productName(item.product)} × {item.quantity}</span>
                <span className="font-medium text-foreground">EGP {(item.product.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground">
              <span>{t("Total", "الإجمالي")}</span>
              <span className="text-primary text-xl">EGP {subtotal.toLocaleString()}</span>
            </div>
          </div>

          <Button onClick={handlePlaceOrder} disabled={loading} className="w-full bg-primary text-primary-foreground font-semibold" size="lg">
            {loading ? t("Placing Order...", "جاري تقديم الطلب...") : t("Place Order", "تأكيد الطلب")}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
