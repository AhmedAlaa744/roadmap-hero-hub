import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ShoppingCart, DollarSign, Star, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MerchantDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add product form state
  const [newProduct, setNewProduct] = useState({
    name_en: "", name_ar: "", description_en: "", description_ar: "",
    price: "", category_id: "", condition: "new", pricing_model: "fixed",
    brand: "", stock: "1",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", user!.id)
      .single();
    setStore(storeData);

    if (storeData) {
      const [{ data: prods }, { data: ords }, { data: cats }] = await Promise.all([
        supabase.from("products").select("*").eq("store_id", storeData.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*, order_items(*)").eq("store_id", storeData.id).order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("sort_order"),
      ]);
      setProducts(prods || []);
      setOrders(ords || []);
      setCategories(cats || []);
    } else {
      const { data: cats } = await supabase.from("categories").select("*").order("sort_order");
      setCategories(cats || []);
    }
    setLoading(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setLoading(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${store.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from("products").insert({
        store_id: store.id,
        name_en: newProduct.name_en,
        name_ar: newProduct.name_ar || null,
        description_en: newProduct.description_en || null,
        description_ar: newProduct.description_ar || null,
        price: parseFloat(newProduct.price),
        category_id: newProduct.category_id,
        condition: newProduct.condition,
        pricing_model: newProduct.pricing_model,
        brand: newProduct.brand || null,
        stock: parseInt(newProduct.stock),
        images: imageUrl ? [imageUrl] : [],
      });
      if (error) throw error;
      toast.success("Product added!");
      setShowAddProduct(false);
      setNewProduct({ name_en: "", name_ar: "", description_en: "", description_ar: "", price: "", category_id: "", condition: "new", pricing_model: "fixed", brand: "", stock: "1" });
      setImageFile(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Product deleted"); fetchData(); }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Order ${status}`); fetchData(); }
  };

  if (authLoading || loading) return <div className="min-h-screen bg-background"><Header /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></div>;

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">You don't have a store yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Apply as a merchant to get started.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">{store.name_en}</h1>
        <p className="text-sm text-muted-foreground mb-8">Merchant Dashboard</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card p-4">
            <Package className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{products.length}</p>
            <p className="text-xs text-muted-foreground">Products</p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (products.length / 20) * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{products.length}/20 slots used</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <ShoppingCart className="h-5 w-5 text-accent mb-2" />
            <p className="text-2xl font-bold text-foreground">{orders.length}</p>
            <p className="text-xs text-muted-foreground">Orders</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <DollarSign className="h-5 w-5 text-success mb-2" />
            <p className="text-2xl font-bold text-foreground">EGP {totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <Star className="h-5 w-5 text-warning mb-2" />
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
        </div>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-foreground">My Products</h2>
              <Button size="sm" onClick={() => setShowAddProduct(true)} disabled={products.length >= 20}>
                <Plus className="h-4 w-4 mr-1" /> Add Product
              </Button>
            </div>

            {showAddProduct && (
              <form onSubmit={handleAddProduct} className="rounded-xl border border-border bg-card p-6 mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Name (EN) *</label>
                    <Input value={newProduct.name_en} onChange={(e) => setNewProduct({ ...newProduct, name_en: e.target.value })} required className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Name (AR)</label>
                    <Input value={newProduct.name_ar} onChange={(e) => setNewProduct({ ...newProduct, name_ar: e.target.value })} dir="rtl" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Description (EN)</label>
                    <textarea value={newProduct.description_en} onChange={(e) => setNewProduct({ ...newProduct, description_en: e.target.value })} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Description (AR)</label>
                    <textarea value={newProduct.description_ar} onChange={(e) => setNewProduct({ ...newProduct, description_ar: e.target.value })} dir="rtl" className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Price (EGP) *</label>
                    <Input type="number" min="0" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} required className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Category *</label>
                    <select value={newProduct.category_id} onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })} required className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Condition</label>
                    <select value={newProduct.condition} onChange={(e) => setNewProduct({ ...newProduct, condition: e.target.value })} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="new">New</option>
                      <option value="used">Used</option>
                      <option value="used_as_new">Used as New</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Pricing Model</label>
                    <select value={newProduct.pricing_model} onChange={(e) => setNewProduct({ ...newProduct, pricing_model: e.target.value })} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="fixed">Fixed Price</option>
                      <option value="negotiable">Negotiable</option>
                      <option value="auction">Auction</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Brand</label>
                    <Input value={newProduct.brand} onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Stock</label>
                    <Input type="number" min="1" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} className="mt-1" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Product Image</label>
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="mt-1 text-sm" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={loading}>Save Product</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddProduct(false)}>Cancel</Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                  {p.images?.[0] && <img src={p.images[0]} alt={p.name_en} className="h-14 w-14 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{p.name_en}</p>
                    <p className="text-sm text-primary font-bold">EGP {Number(p.price).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${p.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {p.is_active ? "Active" : "Inactive"}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {products.length === 0 && <p className="text-center text-muted-foreground py-8">No products yet. Add your first product!</p>}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{o.order_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                      o.status === "delivered" ? "bg-success/10 text-success" :
                      o.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                      o.status === "pending" ? "bg-warning/10 text-warning" :
                      "bg-primary/10 text-primary"
                    }`}>{o.status.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-primary font-bold">EGP {Number(o.total).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Building {o.building}{o.floor ? `, Floor ${o.floor}` : ""}{o.apartment ? `, Apt ${o.apartment}` : ""}</p>
                  {o.status !== "delivered" && o.status !== "cancelled" && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {o.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => updateOrderStatus(o.id, "confirmed")}><CheckCircle className="h-3 w-3 mr-1" /> Confirm</Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateOrderStatus(o.id, "cancelled")}><XCircle className="h-3 w-3 mr-1" /> Cancel</Button>
                        </>
                      )}
                      {o.status === "confirmed" && (
                        <Button size="sm" onClick={() => updateOrderStatus(o.id, "preparing")}>Mark Preparing</Button>
                      )}
                      {o.status === "preparing" && (
                        <Button size="sm" onClick={() => updateOrderStatus(o.id, "out_for_delivery")}>Out for Delivery</Button>
                      )}
                      {o.status === "out_for_delivery" && (
                        <Button size="sm" onClick={() => updateOrderStatus(o.id, "delivered")}><CheckCircle className="h-3 w-3 mr-1" /> Mark Delivered</Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {orders.length === 0 && <p className="text-center text-muted-foreground py-8">No orders yet</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default MerchantDashboard;
