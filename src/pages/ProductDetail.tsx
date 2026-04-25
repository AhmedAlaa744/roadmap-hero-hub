import { useParams, Link } from "react-router-dom";
import { Star, ShoppingCart, Heart, MessageCircle, Phone, Share2, Truck } from "lucide-react";
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
      toast.error("Please log in to leave a review");
      return;
    }
    setSubmittingReview(true);
    const existing = reviews.find((r) => r.user_id === currentUserId);
    const { error } = existing
      ? await supabase.from("reviews").update({ rating: reviewRating, comment: reviewComment || null }).eq("id", existing.id)
      : await supabase.from("reviews").insert({ product_id: id!, user_id: currentUserId, rating: reviewRating, comment: reviewComment || null });
    setSubmittingReview(false);
    if (error) { toast.error(error.message); return; }
    toast.success(existing ? "Review updated" : "Review submitted");
    setReviewComment("");
    fetchReviews(id!);
  };

  const deleteReview = async (reviewId: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    if (error) { toast.error(error.message); return; }
    toast.success("Review deleted");
    fetchReviews(id!);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-xl text-muted-foreground">Product not found</p>
          <Link to="/browse" className="text-primary font-medium hover:underline mt-4 inline-block">← Back to browse</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isUsed = product.condition === "used";
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length : 0;
  const userReview = reviews.find((r) => r.user_id === currentUserId);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/browse" className="hover:text-primary">Browse</Link>
          <span>/</span>
          <span className="text-foreground font-medium line-clamp-1">{product.name_en}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
              <img src={product.images[0]} alt={product.name_en} className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Link to={`/store/${product.store_id}`} className="text-sm text-primary font-medium hover:underline">
                {product.store_name}
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-1">{product.name_en}</h1>
              {product.name_ar && <p className="text-lg text-muted-foreground mt-1">{product.name_ar}</p>}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-warning text-warning" : "text-border"}`} />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</span>
              <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${conditionStyles[product.condition]}`}>
                {conditionLabels[product.condition]}
              </span>
              {product.pricing_model !== "fixed" && (
                <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                  {product.pricing_model === "negotiable" ? "Price Negotiable" : "Auction"}
                </span>
              )}
              {product.in_stock && (
                <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                  In Stock
                </span>
              )}
            </div>

            <div className="bg-mint/50 rounded-xl p-5">
              <p className="text-3xl font-extrabold text-primary">EGP {product.price.toLocaleString()}</p>
              {product.pricing_model === "negotiable" && (
                <p className="text-sm text-muted-foreground mt-1">💬 Make an offer — the seller is open to negotiation</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {isUsed ? (
                <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => setShowOfferForm(true)}>
                  <MessageCircle className="h-4 w-4 mr-2" /> Offer Price
                </Button>
              ) : product.pricing_model === "fixed" ? (
                product.stock === 0 ? (
                  <span className="flex-1 inline-flex items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive font-semibold py-2">
                    Out of Stock
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
                        <span className="text-xs font-medium text-warning">Only {product.stock} left</span>
                      )}
                    </div>
                    <Button
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                      onClick={() => {
                        const qty = Math.min(quantity, product.stock);
                        if (qty < quantity) toast.warning(`Only ${product.stock} available — quantity adjusted.`);
                        addToCart(product, qty);
                        toast.success("Added to cart!");
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                    </Button>
                  </>
                )
              ) : product.pricing_model === "negotiable" ? (
                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" onClick={() => setShowOfferForm(true)}>
                  <MessageCircle className="h-4 w-4 mr-2" /> Make an Offer
                </Button>
              ) : (
                <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  Place Bid
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={() => setIsFavorite(!isFavorite)} className={isFavorite ? "text-destructive border-destructive/30" : ""}>
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Offer Form */}
            {showOfferForm && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="font-semibold text-foreground">Make an Offer</h3>
                <div>
                  <label className="text-sm font-medium text-foreground">Your Offer (EGP)</label>
                  <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="Enter your price" className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Message (optional)</label>
                  <textarea value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} placeholder="Any details for the seller..." className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => { toast.success("Offer sent to seller!"); setShowOfferForm(false); setOfferPrice(""); setOfferMessage(""); }} className="bg-primary text-primary-foreground">
                    Send Offer
                  </Button>
                  <Button variant="outline" onClick={() => setShowOfferForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-sm"><MessageCircle className="h-4 w-4 mr-1" /> Chat</Button>
              <Button variant="outline" size="sm" className="text-sm text-success border-success/30 hover:bg-success/5">
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.252-.149-2.868.852.852-2.868-.149-.252A8 8 0 1112 20z"/></svg>
                WhatsApp
              </Button>
              <Button variant="outline" size="sm" className="text-sm"><Phone className="h-4 w-4 mr-1" /> Call</Button>
            </div>

            <div className="rounded-xl border border-border p-4 flex items-start gap-3">
              <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Compound Delivery</p>
                <p className="text-xs text-muted-foreground">Delivery within Dar Misr Al-Andalus compound</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description_en}</p>
              {product.description_ar && <p className="text-sm text-muted-foreground leading-relaxed mt-2 font-body" dir="rtl">{product.description_ar}</p>}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-foreground mb-6">Reviews ({reviews.length})</h2>

          {currentUserId ? (
            isVerifiedBuyer || userReview ? (
              <div className="rounded-xl border border-border bg-card p-4 mb-6 space-y-3">
                <h3 className="font-semibold text-foreground">{userReview ? "Update your review" : "Write a review"}</h3>
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
                  placeholder={userReview?.comment || "Share your experience..."}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button onClick={submitReview} disabled={submittingReview}>
                    {userReview ? "Update Review" : "Submit Review"}
                  </Button>
                  {userReview && (
                    <Button variant="outline" className="text-destructive" onClick={() => deleteReview(userReview.id)}>
                      Delete my review
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 p-4 mb-6">
                <p className="text-sm text-muted-foreground">
                  ⭐ Only verified buyers can review this product. Place an order and once it's marked as <strong>delivered</strong>, you'll be able to leave a review.
                </p>
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground mb-6">
              <Link to="/login" className="text-primary hover:underline">Log in</Link> to leave a review.
            </p>
          )}

          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No reviews yet — be the first!</p>
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
            <h2 className="text-xl font-bold text-foreground mb-6">Related Products</h2>
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
