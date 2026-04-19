import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Filter, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
  const activeCategory = searchParams.get("category") || "All";
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
        supabase.from("products").select("*, categories(name_en)").eq("is_active", true),
        supabase.from("stores_public").select("id, name_en"),
      ]);
      const storeMap = new Map((storeRes.data || []).map((s: any) => [s.id, s.name_en]));
      setCategories(catRes.data || []);
      setProducts((prodRes.data || []).map((p: any) => toProduct({ ...p, stores: { name_en: storeMap.get(p.store_id) } })));
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredProducts = activeCategory === "All"
    ? products
    : products.filter((p) => p.category === activeCategory);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price_low") return a.price - b.price;
    if (sortBy === "price_high") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{activeCategory === "All" ? "All Products" : activeCategory}</span>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-64 shrink-0 space-y-6`}>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Categories</h3>
              <div className="space-y-1">
                <Link to="/browse" className={`block rounded-lg px-3 py-2 text-sm transition-colors ${activeCategory === "All" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted"}`}>
                  All Products
                </Link>
                {categories.map((cat) => (
                  <Link key={cat.id} to={`/browse?category=${encodeURIComponent(cat.name_en)}`} className={`block rounded-lg px-3 py-2 text-sm transition-colors ${activeCategory === cat.name_en ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted"}`}>
                    {cat.icon} {cat.name_en}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Condition</h3>
              <div className="space-y-2">
                {["New", "Used", "Used as New"].map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-4 w-4 mr-1" /> Filters
                </Button>
                <p className="text-sm text-muted-foreground">{sortedProducts.length} products</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="newest">Newest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
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
              <p className="text-center text-muted-foreground py-20">Loading products...</p>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6" : "space-y-4"}>
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {!loading && sortedProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">No products found in this category.</p>
                <Link to="/browse" className="text-primary font-medium hover:underline mt-2 inline-block">Browse all products</Link>
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
