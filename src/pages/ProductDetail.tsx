import { useParams, Link } from "react-router-dom";
import { Star, ShoppingCart, Heart, MessageCircle, Phone, Share2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const conditionStyles = {
  new: "bg-success/15 text-success border-success/30",
  used: "bg-accent/15 text-accent border-accent/30",
  used_as_new: "bg-primary/15 text-primary border-primary/30",
};
const conditionLabels = { new: "New", used: "Used", used_as_new: "Used as New" };

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

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("*, stores(name_en), categories(name_en)")
        .eq("id", id)
        .single();

      if (data) {
        const p = toProduct(data);
        setProduct(p);
        // Fetch related
        const { data: related } = await supabase
          .from("products")
          .select("*, stores(name_en), categories(name_en)")
          .eq("category_id", data.category_id)
          .eq("is_active", true)
          .neq("id", id!)
          .limit(4);
        setRelatedProducts((related || []).map(toProduct));
      }
      setLoading(false);
    };
    if (id) fetchProduct();
  }, [id]);

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
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-warning text-warning" : "text-border"}`} />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">{product.rating}</span>
              <span className="text-sm text-muted-foreground">({product.reviews_count} reviews)</span>
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
                <>
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 text-foreground hover:bg-muted">−</button>
                    <span className="px-4 py-2 text-sm font-semibold text-foreground">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 text-foreground hover:bg-muted">+</button>
                  </div>
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" onClick={() => { addToCart(product, quantity); toast.success("Added to cart!"); }}>
                    <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                  </Button>
                </>
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
