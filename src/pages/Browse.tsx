import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Filter, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const toProduct = (p: any) => ({
  id: p.id,
  name_en: p.name_en,
  name_ar: p.name_ar || "",
  description_en: p.description_en || "",
  description_ar: p.description_ar || "",
  price: Number(p.price),
  category: p.categories?.name_en || "",
  category_ar: p.categories?.name_ar || "",
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

const Browse = () => {
  const [searchParams] = useSearchParams();
  const { lang, t } = useLanguage();
  const activeCategory = searchParams.get("category") || "All";
  const searchQuery = (searchParams.get("q") || "").trim().toLowerCase();
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, prodRes, storeRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("products").select("*, categories(name_en, name_ar)").eq("is_active", true),
        supabase.from("stores_public").select("id, name_en"),
      ]);
      const storeMap = new Map((storeRes.data || []).map((s: any) => [s.id, s.name_en]));
      setCategories(catRes.data || []);
      setProducts((prodRes.data || []).map((p: any) => toProduct({ ...p, stores: { name_en: storeMap.get(p.store_id) } })));
      setLoading(false);
    };
    fetchData();
  }, []);

  const categoryFiltered = activeCategory === "All"
    ? products
    : products.filter((p) => p.category === activeCategory);

  const filteredProducts = searchQuery
    ? categoryFiltered.filter((p) => {
        const hay = `${p.name_en} ${p.name_ar} ${p.description_en} ${p.description_ar} ${p.category} ${p.category_ar}`.toLowerCase();
        return hay.includes(searchQuery);
      })
    : categoryFiltered;

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price_low") return a.price - b.price;
    if (sortBy === "price_high") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  const activeCategoryAr =
    categories.find((c) => c.name_en === activeCategory)?.name_ar || activeCategory;
  const activeCategoryLabel =
    activeCategory === "All"
      ? t("All Products", "كل المنتجات")
      : t(activeCategory, activeCategoryAr);

  return (
    <div className="min-h-screen bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">{t("Home", "الرئيسية")}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{activeCategoryLabel}</span>
          {searchQuery && (
            <>
              <span>/</span>
              <span className="text-foreground font-medium">
                {t(`Search: "${searchParams.get("q")}"`, `بحث: "${searchParams.get("q")}"`)}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-64 shrink-0 space-y-6`}>
            <div>
              <h3 className="font-semibold text-foreground mb-3">{t("Categories", "الفئات")}</h3>
              <div className="space-y-1">
                <Link
                  to={searchQuery ? `/browse?q=${encodeURIComponent(searchParams.get("q") || "")}` : "/browse"}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${activeCategory === "All" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {t("All Products", "كل المنتجات")}
                </Link>
                {categories.map((cat) => {
                  const params = new URLSearchParams();
                  params.set("category", cat.name_en);
                  if (searchQuery) params.set("q", searchParams.get("q") || "");
                  return (
                    <Link
                      key={cat.id}
                      to={`/browse?${params.toString()}`}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${activeCategory === cat.name_en ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      {cat.icon} {t(cat.name_en, cat.name_ar)}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">{t("Condition", "الحالة")}</h3>
              <div className="space-y-2">
                {[
                  { en: "New", ar: "جديد" },
                  { en: "Used", ar: "مستعمل" },
                  { en: "Used as New", ar: "مستعمل كالجديد" },
                ].map((c) => (
                  <label key={c.en} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
                    {t(c.en, c.ar)}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-4 w-4 mr-1" /> {t("Filters", "فلاتر")}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {sortedProducts.length} {t("products", "منتج")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="newest">{t("Newest", "الأحدث")}</option>
                  <option value="price_low">{t("Price: Low to High", "السعر: من الأقل للأعلى")}</option>
                  <option value="price_high">{t("Price: High to Low", "السعر: من الأعلى للأقل")}</option>
                  <option value="rating">{t("Highest Rated", "الأعلى تقييمًا")}</option>
                </select>
                <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground py-20">{t("Loading products...", "جارٍ تحميل المنتجات...")}</p>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6" : "space-y-4"}>
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {!loading && sortedProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">
                  {searchQuery
                    ? t(`No products match "${searchParams.get("q")}".`, `لا توجد منتجات تطابق "${searchParams.get("q")}".`)
                    : t("No products found in this category.", "لا توجد منتجات في هذه الفئة.")}
                </p>
                <Link to="/browse" className="text-primary font-medium hover:underline mt-2 inline-block">
                  {t("Browse all products", "تصفح كل المنتجات")}
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Browse;
