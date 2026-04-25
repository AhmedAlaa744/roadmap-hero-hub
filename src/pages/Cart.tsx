import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();
  const { t, dir, lang } = useLanguage();
  const navigate = useNavigate();
  const [stockMap, setStockMap] = useState<Record<string, number>>({});

  // Refresh stock on mount + clamp quantities to latest stock
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    (async () => {
      const ids = items.map((i) => i.product.id);
      const { data } = await supabase
        .from("products")
        .select("id, stock, is_active")
        .in("id", ids);
      if (cancelled || !data) return;
      const map: Record<string, number> = {};
      let adjusted = false;
      for (const row of data) {
        const stock = row.is_active ? Number(row.stock ?? 0) : 0;
        map[row.id] = stock;
        const cartItem = items.find((i) => i.product.id === row.id);
        if (cartItem && cartItem.quantity > stock) {
          adjusted = true;
          if (stock <= 0) removeFromCart(row.id);
          else updateQuantity(row.id, stock);
        }
      }
      setStockMap(map);
      if (adjusted) toast.info(t("Some items were adjusted to match available stock.", "تم تعديل بعض المنتجات لتتناسب مع المخزون المتاح."));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stockFor = (id: string, fallback: number) =>
    stockMap[id] ?? fallback ?? 0;

  const handleCheckout = () => {
    for (const item of items) {
      const cap = stockFor(item.product.id, item.product.stock ?? 0);
      if (item.quantity > cap) {
        toast.error(t(`"${item.product.name_en}" exceeds available stock (${cap}).`, `"${item.product.name_en}" يتجاوز المخزون المتاح (${cap}).`));
        return;
      }
    }
    navigate("/checkout");
  };

  const productName = (p: any) => (lang === "ar" && p.name_ar ? p.name_ar : p.name_en);

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          {t("Shopping Cart", "سلة التسوق")} ({totalItems} {t("items", "عناصر")})
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">{t("Your cart is empty", "سلتك فارغة")}</p>
            <Link to="/browse" className="text-primary font-medium hover:underline mt-2 inline-block">{t("Start shopping", "ابدأ التسوق")}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const cap = stockFor(item.product.id, item.product.stock ?? 0);
                const atMax = item.quantity >= cap;
                return (
                  <div key={item.product.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                    <Link to={`/product/${item.product.id}`} className="shrink-0">
                      <img src={item.product.images[0]} alt={productName(item.product)} loading="lazy" className="h-24 w-24 rounded-lg object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.product.id}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                        {productName(item.product)}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.product.store_name}</p>
                      <p className="text-lg font-bold text-primary mt-2">EGP {item.product.price.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-destructive transition-colors" aria-label={t("Remove", "إزالة")}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center border border-border rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-2.5 py-1 text-sm text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                          >−</button>
                          <span className="px-3 py-1 text-sm font-semibold text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => {
                              if (item.quantity + 1 > cap) {
                                toast.warning(t(`Only ${cap} available.`, `${cap} متاح فقط.`));
                                return;
                              }
                              updateQuantity(item.product.id, item.quantity + 1);
                            }}
                            disabled={atMax}
                            className="px-2.5 py-1 text-sm text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                          >+</button>
                        </div>
                        {cap > 0 && (
                          <span className="text-[11px] text-muted-foreground">{t("Max", "الحد الأقصى")}: {cap}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border bg-card p-6 sticky top-32 space-y-4">
                <h2 className="font-bold text-foreground text-lg">{t("Order Summary", "ملخص الطلب")}</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("Subtotal", "المجموع الفرعي")}</span>
                    <span className="text-foreground font-medium">EGP {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("Delivery", "التوصيل")}</span>
                    <span className="text-success font-medium">{t("Free", "مجاني")}</span>
                  </div>
                </div>
                <div className="border-t border-border pt-4 flex justify-between font-bold text-foreground">
                  <span>{t("Total", "الإجمالي")}</span>
                  <span className="text-primary text-xl">EGP {subtotal.toLocaleString()}</span>
                </div>
                <Button onClick={handleCheckout} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" size="lg">
                  {t("Proceed to Checkout", "متابعة الدفع")}
                  <ArrowRight className="ml-2 h-4 w-4 rtl:rotate-180" />
                </Button>
                <p className="text-xs text-center text-muted-foreground">{t("Cash on Delivery available", "الدفع عند الاستلام متاح")}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Cart;
