import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ShoppingCart, DollarSign, Star, Plus, Trash2, CheckCircle, XCircle, Pencil, Check, X, Eye, EyeOff, RefreshCw, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { suggestCategoryName } from "@/lib/categorize";

const MerchantDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [waEnabled, setWaEnabled] = useState(false);
  const [waPhone, setWaPhone] = useState("");
  const [storePhone, setStorePhone] = useState("");
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [slotLimit, setSlotLimit] = useState<number>(20);
  const [slotRequests, setSlotRequests] = useState<any[]>([]);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestExtra, setRequestExtra] = useState("5");
  const [requestReason, setRequestReason] = useState("");

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
      setStorePhone(storeData.phone || "");
      setWaEnabled(!!storeData.whatsapp_enabled);
      setWaPhone(storeData.whatsapp_phone || "");
    }

    if (storeData) {
      const [{ data: prods }, { data: ords }, { data: cats }, { data: limit }, { data: reqs }] = await Promise.all([
        supabase.from("products").select("*").eq("store_id", storeData.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*, order_items(*)").eq("store_id", storeData.id).order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("sort_order"),
        supabase.rpc("merchant_active_slot_limit", { _store_id: storeData.id }),
        supabase.from("slot_requests").select("*").eq("store_id", storeData.id).order("created_at", { ascending: false }),
      ]);
      setProducts(prods || []);
      setOrders(ords || []);
      setCategories(cats || []);
      setSlotLimit(typeof limit === "number" ? limit : 20);
      setSlotRequests(reqs || []);
    } else {
      const { data: cats } = await supabase.from("categories").select("*").order("sort_order");
      setCategories(cats || []);
    }
    setLoading(false);
  };

  const submitSlotRequest = async () => {
    if (!store || !user) return;
    const extra = parseInt(requestExtra);
    if (isNaN(extra) || extra <= 0) { toast.error("Enter a valid number"); return; }
    const { error } = await supabase.from("slot_requests").insert({
      user_id: user.id,
      store_id: store.id,
      requested_extra: extra,
      reason: requestReason || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Request sent — admin will review it");
    setShowRequestDialog(false);
    setRequestReason("");
    setRequestExtra("5");
    fetchData();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setLoading(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        // Path MUST start with store.id so storage RLS allows the upload
        const path = `${store.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
        imageUrl = publicUrl;
      }

      const productPayload: any = {
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
        is_active: true,
      };
      if (imageUrl) productPayload.images = [imageUrl];

      let error;
      if (replacingId) {
        ({ error } = await supabase.from("products").update(productPayload).eq("id", replacingId));
      } else {
        ({ error } = await supabase.from("products").insert(productPayload));
      }
      if (error) throw error;
      toast.success(replacingId ? "Product replaced!" : "Product added!");
      setShowAddProduct(false);
      setReplacingId(null);
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
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      // FK violation → product has past orders. Soft-delete by deactivating.
      if (error.code === "23503" || error.message.includes("foreign key")) {
        const { error: updateError } = await supabase
          .from("products")
          .update({ is_active: false })
          .eq("id", id);
        if (updateError) {
          toast.error(updateError.message);
          return;
        }
        toast.success("Product hidden (kept for past order history)");
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: false } : p))
        );
        return;
      }
      toast.error(error.message);
      return;
    }
    toast.success("Product deleted");
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !current })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(!current ? "Product activated" : "Product paused");
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p))
    );
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setEditPrice(String(p.price));
    setEditStock(String(p.stock));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice("");
    setEditStock("");
  };

  const saveEdit = async (id: string) => {
    const priceNum = parseFloat(editPrice);
    const stockNum = parseInt(editStock);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Invalid price");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error("Invalid stock");
      return;
    }
    const { error } = await supabase
      .from("products")
      .update({ price: priceNum, stock: stockNum })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product updated");
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price: priceNum, stock: stockNum } : p))
    );
    cancelEdit();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    // Optimistic update so the select reflects the change immediately
    const prev = orders;
    setOrders((curr) => curr.map((o) => (o.id === id ? { ...o, status } : o)));
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      setOrders(prev); // revert
      toast.error(error.message);
      return;
    }
    toast.success(`Order ${status.replace(/_/g, " ")}`);
  };

  const saveStoreContact = async (whatsapp_enabled: boolean, whatsapp_phone: string, phone: string) => {
    if (!store) return;
    const { error } = await supabase
      .from("stores")
      .update({ phone: phone || null, whatsapp_enabled, whatsapp_phone: whatsapp_phone || null })
      .eq("id", store.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Store contact info saved");
    setStore({ ...store, phone, whatsapp_enabled, whatsapp_phone });
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
  const activeCount = products.filter((p) => p.is_active).length;
  const atSlotLimit = activeCount >= slotLimit;
  const pendingSlotRequest = slotRequests.find((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">{store.name_en}</h1>
        <p className="text-sm text-muted-foreground mb-8">{t("Merchant Dashboard", "لوحة التاجر")}</p>

        {/* Store contact card */}
        <div className="rounded-xl border border-border bg-card p-4 mb-6 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            {t("Store Contact", "بيانات تواصل المتجر")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground">{t("Phone", "الهاتف")} *</label>
              <Input value={storePhone} onChange={(e) => setStorePhone(e.target.value)} placeholder="01xxxxxxxxx" className="mt-1" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="wa-enabled" checked={waEnabled} onChange={(e) => setWaEnabled(e.target.checked)} />
              <label htmlFor="wa-enabled" className="text-sm text-foreground">{t("WhatsApp available", "واتساب متاح")}</label>
            </div>
            {waEnabled && (
              <div>
                <label className="text-xs font-medium text-foreground">{t("WhatsApp number", "رقم واتساب")}</label>
                <Input value={waPhone} onChange={(e) => setWaPhone(e.target.value)} placeholder={storePhone || "01xxxxxxxxx"} className="mt-1" />
              </div>
            )}
          </div>
          <Button size="sm" onClick={() => saveStoreContact(waEnabled, waPhone, storePhone)}>
            {t("Save Contact Info", "حفظ بيانات التواصل")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card p-4">
            <Package className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active Products</p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (activeCount / slotLimit) * 100)}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">{activeCount}/{slotLimit} slots</p>
              <button onClick={() => setShowRequestDialog(true)} className="text-xs text-primary hover:underline font-medium">
                Request more
              </button>
            </div>
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
              <Button size="sm" onClick={() => { setReplacingId(null); setShowAddProduct(true); }} disabled={atSlotLimit} title={atSlotLimit ? "Slot limit reached — request more or replace a product" : ""}>
                <Plus className="h-4 w-4 mr-1" /> Add Product
              </Button>
            </div>
            {atSlotLimit && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 mb-4 text-xs text-foreground">
                You've reached your {slotLimit}-product limit. Use <strong>Replace</strong> on an existing item, or{" "}
                <button className="underline text-primary" onClick={() => setShowRequestDialog(true)}>request more slots</button>.
                {pendingSlotRequest && <span className="ml-2 text-muted-foreground">(A request for +{pendingSlotRequest.requested_extra} is pending review.)</span>}
              </div>
            )}

            {showAddProduct && (
              <form onSubmit={handleAddProduct} className="rounded-xl border border-border bg-card p-6 mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Name (EN) *</label>
                    <Input
                      value={newProduct.name_en}
                      onChange={(e) => setNewProduct({ ...newProduct, name_en: e.target.value })}
                      onBlur={(e) => {
                        if (newProduct.category_id) return;
                        const suggestion = suggestCategoryName(`${e.target.value} ${newProduct.name_ar}`);
                        if (!suggestion) return;
                        const match = categories.find((c) => c.name_en === suggestion);
                        if (match) {
                          setNewProduct((prev) => prev.category_id ? prev : { ...prev, category_id: match.id });
                          toast.success(`Category auto-selected: ${suggestion}`);
                        }
                      }}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Name (AR)</label>
                    <Input
                      value={newProduct.name_ar}
                      onChange={(e) => setNewProduct({ ...newProduct, name_ar: e.target.value })}
                      onBlur={(e) => {
                        if (newProduct.category_id) return;
                        const suggestion = suggestCategoryName(`${newProduct.name_en} ${e.target.value}`);
                        if (!suggestion) return;
                        const match = categories.find((c) => c.name_en === suggestion);
                        if (match) {
                          setNewProduct((prev) => prev.category_id ? prev : { ...prev, category_id: match.id });
                          toast.success(`Category auto-selected: ${suggestion}`);
                        }
                      }}
                      dir="rtl"
                      className="mt-1"
                    />
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
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {replacingId && (
                    <p className="text-xs text-muted-foreground">
                      🔄 Replacing existing product. Saving will overwrite it (no new slot used).
                    </p>
                  )}
                  <div className="flex gap-3 ml-auto">
                    <Button type="submit" disabled={loading}>{replacingId ? "Save Replacement" : "Save Product"}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowAddProduct(false); setReplacingId(null); }}>Cancel</Button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                  {p.images?.[0] && <img src={p.images[0]} alt={p.name_en} className="h-14 w-14 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{p.name_en}</p>
                    {editingId === p.id ? (
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <label className="text-xs text-muted-foreground">Price</label>
                        <Input type="number" min="0" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-8 w-24" />
                        <label className="text-xs text-muted-foreground">Stock</label>
                        <Input type="number" min="0" value={editStock} onChange={(e) => setEditStock(e.target.value)} className="h-8 w-20" />
                      </div>
                    ) : (
                      <p className="text-sm text-primary font-bold">
                        EGP {Number(p.price).toLocaleString()}
                        <span className="text-xs text-muted-foreground font-normal ml-2">Stock: {p.stock}</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleActive(p.id, p.is_active)}
                    className={`text-xs px-2 py-1 rounded-full transition-colors cursor-pointer ${p.is_active ? "bg-success/10 text-success hover:bg-success/20" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                    title={p.is_active ? "Click to pause" : "Click to activate"}
                  >
                    {p.is_active ? "Active" : "Paused"}
                  </button>
                  {editingId === p.id ? (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => saveEdit(p.id)} className="text-success">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => toggleActive(p.id, p.is_active)} title={p.is_active ? "Pause listing" : "Activate listing"}>
                        {p.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => startEdit(p)} title="Edit price/stock">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Replace product (does not consume a slot)"
                        onClick={() => {
                          setReplacingId(p.id);
                          setNewProduct({ name_en: "", name_ar: "", description_en: "", description_ar: "", price: "", category_id: "", condition: "new", pricing_model: "fixed", brand: "", stock: "1" });
                          setImageFile(null);
                          setShowAddProduct(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
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
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <label className="text-xs text-muted-foreground">Set status:</label>
                    <select
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                      className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p className="text-center text-muted-foreground py-8">No orders yet</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Request more product slots</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Current limit: <strong>{slotLimit}</strong> active products. Tell the admin how many extra slots you need and why.
            </p>
            <div>
              <label className="text-sm font-medium text-foreground">Extra slots requested</label>
              <Input type="number" min="1" value={requestExtra} onChange={(e) => setRequestExtra(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Reason (optional)</label>
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                placeholder="e.g. expanding our product line for the new season..."
              />
            </div>
            {slotRequests.length > 0 && (
              <div className="rounded-lg border border-border p-2 max-h-32 overflow-y-auto text-xs space-y-1">
                <p className="font-medium text-foreground">Recent requests</p>
                {slotRequests.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex justify-between text-muted-foreground">
                    <span>+{r.requested_extra} slots</span>
                    <span className={r.status === "approved" ? "text-success" : r.status === "rejected" ? "text-destructive" : "text-warning"}>
                      {r.status}{r.status === "approved" && r.granted_extra ? ` (+${r.granted_extra})` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>Cancel</Button>
            <Button onClick={submitSlotRequest}><Send className="h-4 w-4 mr-1" /> Send Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MerchantDashboard;
