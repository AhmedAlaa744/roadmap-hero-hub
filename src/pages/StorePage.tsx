import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Store as StoreIcon, Calendar, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const toProduct = (p: any, storeName: string) => ({
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
  store_name: storeName,
  store_id: p.store_id,
  rating: 0,
  reviews_count: 0,
  in_stock: p.stock > 0,
  stock: Number(p.stock ?? 0),
});

const StorePage = () => {
  const { id } = useParams();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: storeData } = await supabase
        .from("stores_public")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      setStore(storeData);

      const { data: prods } = await supabase
        .from("products")
        .select("*, categories(name_en)")
        .eq("store_id", id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      const storeName = storeData?.name_en || "Store";
      setProducts((prods || []).map((p) => toProduct(p, storeName)));

      const productIds = (prods || []).map((p: any) => p.id);
      if (productIds.length > 0) {
        const { data: revs } = await supabase
          .from("reviews")
          .select("*, products(name_en)")
          .in("product_id", productIds)
          .order("created_at", { ascending: false });
        const userIds = [...new Set((revs || []).map((r: any) => r.user_id))];
        const { data: profs } = await supabase
          .from("profiles_public")
          .select("user_id, full_name")
          .in("user_id", userIds);
        const profMap = new Map((profs || []).map((p: any) => [p.user_id, p.full_name]));
        setReviews((revs || []).map((r: any) => ({ ...r, reviewer: profMap.get(r.user_id) || "Customer" })));
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading store...</div>
        <Footer />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-xl text-muted-foreground">Store not found</p>
          <Link to="/browse" className="text-primary font-medium hover:underline mt-4 inline-block">← Back to browse</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const avgRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Store Header */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-24 w-24 rounded-2xl bg-mint flex items-center justify-center overflow-hidden shrink-0">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name_en} className="h-full w-full object-cover" />
              ) : (
                <StoreIcon className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{store.name_en}</h1>
              {store.name_ar && <p className="text-lg text-muted-foreground" dir="rtl">{store.name_ar}</p>}
              {store.description_en && <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{store.description_en}</p>}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" /> {products.length} products
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {avgRating > 0 ? avgRating.toFixed(1) : "—"} ({reviews.length} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            {products.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No products listed yet</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6 space-y-3">
            {reviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No reviews yet</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-foreground">{r.reviewer}</p>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-warning text-warning" : "text-border"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">on {r.products?.name_en} • {new Date(r.created_at).toLocaleDateString()}</p>
                  {r.comment && <p className="text-sm text-foreground mt-1">{r.comment}</p>}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default StorePage;
