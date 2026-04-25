import { useParams, Link } from "react-router-dom";
import { Star, ShoppingCart, Heart, MessageCircle, Share2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const conditionStyles = {
  new: "bg-success/15 text-success border-success/30",
  used: "bg-accent/15 text-accent border-accent/30",
  used_as_new: "bg-primary/15 text-primary border-primary/30",
};
const conditionLabels: Record<string, [string, string]> = {
  new: ["New", "جديد"],
  used: ["Used", "مستعمل"],
  used_as_new: ["Used as New", "كالجديد"],
};

const toProduct = (p: any) => ({
  id: p.id,
  name_en: p.name_en,
  name_ar: p.name_ar || "",
  description_en: p.description_en || "",
  description_ar: p.description_ar || "",
  price: Number(p.price),
  category: p.categories?.name_en || "",
  condition: p.condition as "new" | "used" | "used_as_new",
  pricing_model: p.pricing_model as "fixed" | "negotiable" | "auction",
  images: p.images && p.images.length > 0 ? p.images : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"],
  store_name: p.stores?.name_en || "Store",
  store_id: p.store_id,
  rating: 4.5,
  reviews_count: 0,
  in_stock: p.stock > 0,
  stock: Number(p.stock ?? 0),
});

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(false);
  const { addToCart } = useCart();
  const { t, dir, lang } = useLanguage();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    const check = async () => {
      if (!currentUserId || !id) { setIsVerifiedBuyer(false); return; }
      const { data: deliveredOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("customer_id", currentUserId)
        .eq("status", "delivered");
      const orderIds = (deliveredOrders || []).map((o: any) => o.id);
      if (orderIds.length === 0) { setIsVerifiedBuyer(false); return; }
      const { data: items } = await supabase
        .from("order_items")
        .select("id")
        .eq("product_id", id)
        .in("order_id", orderIds)
        .limit(1);
      setIsVerifiedBuyer((items || []).length > 0);
    };
    check();
  }, [currentUserId, id]);

  const fetchReviews = async (productId: string) => {
    const { data: revs } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    const userIds = [...new Set((revs || []).map((r: any) => r.user_id))];
    let profMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles_public")
        .select("user_id, full_name")
        .in("user_id", userIds);
      profMap = new Map((profs || []).map((p: any) => [p.user_id, p.full_name || "Customer"]));
    }
    setReviews((revs || []).map((r: any) => ({ ...r, reviewer: profMap.get(r.user_id) || "Customer" })));
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("*, categories(name_en)")
        .eq("id", id)
        .single();

      if (data) {
        const { data: storeData } = await supabase
          .from("stores_public")
          .select("name_en")
          .eq("id", data.store_id)
          .maybeSingle();
        const p = toProduct({ ...data, stores: { name_en: storeData?.name_en } });
        setProduct(p);
        // Fetch related
        const { data: related } = await supabase
          .from("products")
          .select("*, categories(name_en)")
          .eq("category_id", data.category_id)
          .eq("is_active", true)
          .neq("id", id!)
          .limit(4);
        const relatedStoreIds = [...new Set((related || []).map((r: any) => r.store_id))];
        const { data: relStores } = await supabase
          .from("stores_public")
          .select("id, name_en")
          .in("id", relatedStoreIds);
        const storeMap = new Map((relStores || []).map((s: any) => [s.id, s.name_en]));
        setRelatedProducts((related || []).map((r: any) => toProduct({ ...r, stores: { name_en: storeMap.get(r.store_id) } })));
        await fetchReviews(id!);
      }
      setLoading(false);
    };
    if (id) fetchProduct();
  }, [id]);

  const submitReview = async () => {
    if (!currentUserId) {
      toast.error(t("Please log in to leave a review", "الرجاء تسجيل الدخول لإضافة مراجعة"));
      return;
    }
    setSubmittingReview(true);
    const existing = reviews.find((r) => r.user_id === currentUserId);
    const { error } = existing
      ? await supabase.from("reviews").update({ rating: reviewRating, comment: reviewComment || null }).eq("id", existing.id)
      : await supabase.from("reviews").insert({ product_id: id!, user_id: currentUserId, rating: reviewRating, comment: reviewComment || null });
    setSubmittingReview(false);
    if (error) { toast.error(error.message); return; }
    toast.success(existing ? t("Review updated", "تم تحديث المراجعة") : t("Review submitted", "تم إرسال المراجعة"));
    setReviewComment("");
    fetchReviews(id!);
  };

  const deleteReview = async (reviewId: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    if (error) { toast.error(error.message); return; }
    toast.success(t("Review deleted", "تم حذف المراجعة"));
    fetchReviews(id!);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <Header />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">{t("Loading...", "جاري التحميل...")}</div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-xl text-muted-foreground">{t("Product not found", "المنتج غير موجود")}</p>
          <Link to="/browse" className="text-primary font-medium hover:underline mt-4 inline-block">{t("← Back to browse", "→ العودة للتصفح")}</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isUsed = product.condition === "used";
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length : 0;
  const userReview = reviews.find((r) => r.user_id === currentUserId);
  const displayName = lang === "ar" && product.name_ar ? product.name_ar : product.name_en;
  const displayDescription = lang === "ar" && product.description_ar ? product.description_ar : product.description_en;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">{t("Home", "الرئيسية")}</Link>
          <span>/</span>
          <Link to="/browse" className="hover:text-primary">{t("Browse", "تصفح")}</Link>
          <span>/</span>
          <span className="text-foreground font-medium line-clamp-1">{displayName}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
              <img src={product.images[0]} alt={displayName} className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Link to={`/store/${product.store_id}`} className="text-sm text-primary font-medium hover:underline">
                {product.store_name}
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-1">{displayName}</h1>
              {lang === "en" && product.name_ar && <p className="text-lg text-muted-foreground mt-1" dir="rtl">{product.name_ar}</p>}
              {lang === "ar" && product.name_en && <p className="text-lg text-muted-foreground mt-1" dir="ltr">{product.name_en}</p>}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-warning text-warning" : "text-border"}`} />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</span>
              <span className="text-sm text-muted-foreground">({reviews.length} {t("reviews", "مراجعات")})</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${conditionStyles[product.condition]}`}>
                {t(conditionLabels[product.condition][0], conditionLabels[product.condition][1])}
              </span>
              {product.pricing_model !== "fixed" && (
                <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                  {product.pricing_model === "negotiable" ? t("Price Negotiable", "السعر قابل للتفاوض") : t("Auction", "مزاد")}
                </span>
              )}
              {product.in_stock && (
                <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                  {t("In Stock", "متوفر")}
                </span>
              )}
            </div>

            <div className="bg-mint/50 rounded-xl p-5">
              <p className="text-3xl font-extrabold text-primary">EGP {product.price.toLocaleString()}</p>
              {product.pricing_model === "negotiable" && (
                <p className="text-sm text-muted-foreground mt-1">💬 {t("Make an offer — the seller is open to negotiation", "قدّم عرضك — البائع مستعد للتفاوض")}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {isUsed ? (
                <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => setShowOfferForm(true)}>
                  <MessageCircle className="h-4 w-4 mr-2" /> {t("Offer Price", "عرض سعر")}
                </Button>
              ) : product.pricing_model === "fixed" ? (
                product.stock === 0 ? (
                  <span className="flex-1 inline-flex items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive font-semibold py-2">
                    {t("Out of Stock", "غير متوفر")}
                  </span>
                ) : (
                  <>
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="px-3 py-2 text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                        >−</button>
                        <span className="px-4 py-2 text-sm font-semibold text-foreground">{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          disabled={quantity >= product.stock}
                          className="px-3 py-2 text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                        >+</button>
                      </div>
                      {product.stock <= 5 && (
                        <span className="text-xs font-medium text-warning">{t(`Only ${product.stock} left`, `${product.stock} متبقي فقط`)}</span>
                      )}
                    </div>
                    <Button
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                      onClick={() => {
                        const qty = Math.min(quantity, product.stock);
                        if (qty < quantity) toast.warning(t(`Only ${product.stock} available — quantity adjusted.`, `${product.stock} متاح فقط — تم تعديل الكمية.`));
                        addToCart(product, qty);
                        toast.success(t("Added to cart!", "تمت الإضافة إلى السلة!"));
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" /> {t("Add to Cart", "أضف إلى السلة")}
                    </Button>
                  </>
                )
              ) : product.pricing_model === "negotiable" ? (
                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" onClick={() => setShowOfferForm(true)}>
                  <MessageCircle className="h-4 w-4 mr-2" /> {t("Make an Offer", "قدّم عرضًا")}
                </Button>
              ) : (
                <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  {t("Place Bid", "قدّم مزايدة")}
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={() => setIsFavorite(!isFavorite)} className={isFavorite ? "text-destructive border-destructive/30" : ""} aria-label={t("Favorite", "المفضلة")}>
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
              <Button variant="outline" size="icon" aria-label={t("Share", "مشاركة")}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Offer Form */}
            {showOfferForm && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="font-semibold text-foreground">{t("Make an Offer", "قدّم عرضًا")}</h3>
                <div>
                  <label className="text-sm font-medium text-foreground">{t("Your Offer (EGP)", "عرضك (جنيه مصري)")}</label>
                  <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder={t("Enter your price", "أدخل سعرك")} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">{t("Message (optional)", "رسالة (اختياري)")}</label>
                  <textarea value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} placeholder={t("Any details for the seller...", "أي تفاصيل للبائع...")} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => { toast.success(t("Offer sent to seller!", "تم إرسال العرض إلى البائع!")); setShowOfferForm(false); setOfferPrice(""); setOfferMessage(""); }} className="bg-primary text-primary-foreground">
                    {t("Send Offer", "إرسال العرض")}
                  </Button>
                  <Button variant="outline" onClick={() => setShowOfferForm(false)}>{t("Cancel", "إلغاء")}</Button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border p-4 flex items-start gap-3">
              <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">{t("Compound Delivery", "توصيل داخل الكمبوند")}</p>
                <p className="text-xs text-muted-foreground">{t("Delivery within Dar Misr Al-Andalus compound", "توصيل داخل كمبوند دار مصر الأندلس")}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">{t("Description", "الوصف")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed" dir={lang === "ar" && product.description_ar ? "rtl" : "ltr"}>{displayDescription}</p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-foreground mb-6">{t("Reviews", "المراجعات")} ({reviews.length})</h2>

          {currentUserId ? (
            isVerifiedBuyer || userReview ? (
              <div className="rounded-xl border border-border bg-card p-4 mb-6 space-y-3">
                <h3 className="font-semibold text-foreground">{userReview ? t("Update your review", "حدّث مراجعتك") : t("Write a review", "اكتب مراجعة")}</h3>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewRating(n)}
                      className="p-0.5"
                      aria-label={`${n} stars`}
                    >
                      <Star className={`h-6 w-6 ${n <= reviewRating ? "fill-warning text-warning" : "text-border"}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={userReview?.comment || t("Share your experience...", "شاركنا تجربتك...")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button onClick={submitReview} disabled={submittingReview}>
                    {userReview ? t("Update Review", "تحديث المراجعة") : t("Submit Review", "إرسال المراجعة")}
                  </Button>
                  {userReview && (
                    <Button variant="outline" className="text-destructive" onClick={() => deleteReview(userReview.id)}>
                      {t("Delete my review", "حذف مراجعتي")}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 p-4 mb-6">
                <p className="text-sm text-muted-foreground">
                  ⭐ {t(
                    "Only verified buyers can review this product. Place an order and once it's marked as delivered, you'll be able to leave a review.",
                    "يمكن للمشترين المُتحقَّق منهم فقط مراجعة هذا المنتج. اطلب المنتج، وبمجرد أن يصبح حالته «تم التوصيل» ستتمكن من ترك مراجعة."
                  )}
                </p>
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground mb-6">
              <Link to="/login" className="text-primary hover:underline">{t("Log in", "سجّل الدخول")}</Link> {t("to leave a review.", "لكتابة مراجعة.")}
            </p>
          )}

          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t("No reviews yet — be the first!", "لا توجد مراجعات بعد — كن الأول!")}</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-foreground">{r.reviewer}</p>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-warning text-warning" : "text-border"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{new Date(r.created_at).toLocaleDateString()}</p>
                  {r.comment && <p className="text-sm text-foreground mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-foreground mb-6">{t("Related Products", "منتجات ذات صلة")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetail;
