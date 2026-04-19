import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Sparkles, ShieldCheck, Truck, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroBanner from "@/assets/hero-banner.jpg";

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
});

interface DbCategory {
  id: string;
  name_en: string;
  name_ar: string;
  icon: string;
  sort_order: number;
}

const Index = () => {
  const { user, isAdmin, isMerchant, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("products").select("*, stores(name_en), categories(name_en)").eq("is_active", true).limit(8),
      ]);
      setCategories(catRes.data || []);
      const prods = (prodRes.data || []).map(toProduct);
      setFeaturedProducts(prods.slice(0, 4));
      setTrendingProducts(prods.slice(4, 8));
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="Garak community marketplace" width={1920} height={800} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-lg space-y-6 animate-fade-in">
            <p className="text-lg text-primary font-semibold" dir="rtl">جارك — سوق جيرانك</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-card leading-tight">
              Shop Local,<br />
              <span className="text-primary">Trust Your Neighbors</span>
            </h1>
            <p className="text-lg text-card/80 font-body">
              The community marketplace for Dar Misr Al-Andalus. Buy and sell with your neighbors — from fresh food to electronics.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/browse">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8">
                  Start Shopping
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              {!authLoading && !user && (
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10 font-semibold px-8">
                    Log In
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin">
                  <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10 font-semibold px-8">
                    Admin Panel
                  </Button>
                </Link>
              )}
              {isMerchant ? (
                <Link to="/merchant/dashboard">
                  <Button size="lg" variant="outline" className="border-card/30 hover:bg-card/10 font-semibold px-8 text-primary hover:text-primary">
                    My Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/merchant/apply">
                  <Button size="lg" variant="outline" className="border-card/30 hover:bg-card/10 font-semibold px-8 text-primary hover:text-primary">
                    Become a Seller
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, label: "Verified Merchants", sublabel: "تجار موثقين", color: "text-primary" },
              { icon: Truck, label: "Compound Delivery", sublabel: "توصيل داخل الكمبوند", color: "text-success" },
              { icon: Star, label: "Rated & Reviewed", sublabel: "تقييمات حقيقية", color: "text-warning" },
              { icon: Users, label: "Your Neighbors", sublabel: "جيرانك", color: "text-accent" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon className={`h-8 w-8 ${item.color} shrink-0`} />
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground" dir="rtl">{item.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Garak Works */}
      <section className="container mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">How Garak Works</h2>
        <p className="text-sm text-muted-foreground text-center mb-10" dir="rtl">إزاي جارك بيشتغل</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Browse & Discover", subtitle: "تصفح واكتشف", desc: "Explore products from verified merchants in your compound." },
            { step: "2", title: "Add to Cart & Order", subtitle: "اطلب وادفع", desc: "Add items to your cart and checkout with your building address." },
            { step: "3", title: "Receive at Your Door", subtitle: "استلم عند بابك", desc: "Get your order delivered right to your apartment in the compound." },
          ].map((s) => (
            <div key={s.step} className="text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">{s.step}</div>
              <h3 className="font-bold text-foreground">{s.title}</h3>
              <p className="text-xs text-muted-foreground" dir="rtl">{s.subtitle}</p>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">Browse Categories</h2>
          <Link to="/browse" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/browse?category=${encodeURIComponent(cat.name_en)}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary hover:shadow-md"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{cat.name_en}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Product Condition Explainer */}
      <section className="container mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-foreground mb-6">Product Conditions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "New", labelAr: "جديد", desc: "Brand new, unused, sealed or with tags", color: "bg-success/15 text-success border-success/30" },
            { label: "Used as New", labelAr: "مستعمل كالجديد", desc: "Like new condition, barely used, no defects", color: "bg-primary/15 text-primary border-primary/30" },
            { label: "Used", labelAr: "مستعمل", desc: "Previously owned, may show signs of use", color: "bg-accent/15 text-accent border-accent/30" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
              <span className={`rounded-full border px-3 py-1 text-sm font-semibold shrink-0 ${c.color}`}>{c.label}</span>
              <div>
                <p className="text-xs text-muted-foreground" dir="rtl">{c.labelAr}</p>
                <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-2xl font-bold text-foreground">Featured Products</h2>
        </div>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading products...</p>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No products yet. Be the first to list!</p>
        )}
      </section>

      {/* Trending */}
      {trendingProducts.length > 0 && (
        <section className="bg-mint/40 py-14">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-8">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Trending Now</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {!isMerchant && (
        <section className="container mx-auto px-4 py-16">
          <div className="rounded-2xl bg-primary p-8 md:p-14 text-center space-y-5">
            <h2 className="text-3xl font-extrabold text-primary-foreground">Start Selling Today</h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto font-body">
              Join your neighbors on Garak. List up to 20 products for free and reach buyers in your compound.
            </p>
            <Link to="/merchant/apply">
              <Button size="lg" className="bg-card text-primary hover:bg-card/90 font-semibold px-10 mt-2">
                Apply as Merchant
              </Button>
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Index;
