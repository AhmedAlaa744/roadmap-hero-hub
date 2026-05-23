import { useState } from "react";
import { Link } from "react-router-dom";
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
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [notes, setNotes] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderPhone, setOrderPhone] = useState("");

  if (orderNumber) {
    const trackHref = user
      ? "/account"
      : `/track?order=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(orderPhone)}`;
    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <Header />
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">{t("Order Placed!", "تم تقديم الطلب!")}</h1>
          <p className="text-muted-foreground mt-2">{t("Your order number is", "رقم طلبك هو")}</p>
          <p className="text-2xl font-bold text-primary mt-2">{orderNumber}</p>
          {!user ? (
            <p className="text-sm text-muted-foreground mt-4">
              {t(
                "Save this number. You can track your order using it and the phone number you entered.",
                "احفظ هذا الرقم. يمكنك تتبع طلبك باستخدامه ورقم الهاتف الذي أدخلته."
              )}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">{t("You'll receive updates on your order status.", "ستتلقى تحديثات حول حالة طلبك.")}</p>
          )}
          <div className="flex gap-3 justify-center mt-8">
            <Link to={trackHref}><Button variant="outline">{user ? t("My Orders", "طلباتي") : t("Track Order", "تتبع الطلب")}</Button></Link>
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
    if (!user) {
      if (guestName.trim().length < 2) {
        toast.error(t("Full name is required", "الاسم الكامل مطلوب"));
        return;
      }
      const phoneDigits = guestPhone.replace(/[^0-9]/g, "");
      if (phoneDigits.length < 8) {
        toast.error(t("Valid phone number is required", "رقم هاتف صحيح مطلوب"));
        return;
      }
      if (guestEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
        toast.error(t("Invalid email", "بريد إلكتروني غير صالح"));
        return;
      }
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
          guest_name: user ? null : guestName.trim(),
          guest_phone: user ? null : guestPhone.replace(/[^0-9]/g, ""),
          guest_email: user ? null : (guestEmail.trim() || null),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      clearCart();
      setOrderNumber(data.order_number);
      setOrderPhone(data.guest_phone || "");
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
          {/* Guest contact (only if not logged in) */}
          {!user && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-foreground">{t("Your Contact Info", "بيانات الاتصال الخاصة بك")}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("No account needed. The merchant will contact you on this phone.", "لا حاجة لإنشاء حساب. سيتواصل معك التاجر على هذا الرقم.")}
                  </p>
                </div>
                <Link to="/login" className="text-xs text-primary hover:underline whitespace-nowrap">
                  {t("Have an account?", "لديك حساب؟")}
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">{t("Full Name", "الاسم الكامل")} *</label>
                  <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} maxLength={100} required className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">{t("Phone", "الهاتف")} *</label>
                  <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="01xxxxxxxxx" inputMode="tel" maxLength={20} required className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t("Email (optional)", "البريد الإلكتروني (اختياري)")}</label>
                <Input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} type="email" maxLength={254} className="mt-1" />
              </div>
            </div>
          )}

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
