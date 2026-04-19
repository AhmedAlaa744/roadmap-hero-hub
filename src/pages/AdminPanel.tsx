import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Users, Package, ShoppingCart, FileText, CheckCircle, XCircle, Shield,
  BarChart3, Trash2, Pencil, Store as StoreIcon, Download, DollarSign, AlertTriangle, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";

const ORDER_STATUSES = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"] as const;
const ROLES = ["admin", "moderator", "user"] as const;
const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

const downloadCSV = (filename: string, rows: any[]) => {
  if (rows.length === 0) {
    toast.error("Nothing to export");
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminPanel = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [slotRequests, setSlotRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingStore, setEditingStore] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) fetchAll();
  }, [user, isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    const [apps, profs, roles, ords, items, prods, strs, tix, revs, cats, slots] = await Promise.all([
      supabase.from("merchant_applications").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("order_items").select("*"),
      supabase.from("products").select("*, stores(name_en), categories(name_en)").order("created_at", { ascending: false }),
      supabase.from("stores").select("*").order("created_at", { ascending: false }),
      supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
      supabase.from("reviews").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("slot_requests").select("*").order("created_at", { ascending: false }),
    ]);
    const profileMap = new Map((profs.data || []).map((p: any) => [p.user_id, p]));
    const storeMap = new Map((strs.data || []).map((s: any) => [s.id, s]));
    const rolesMap = new Map<string, string[]>();
    (roles.data || []).forEach((r: any) => {
      const arr = rolesMap.get(r.user_id) || [];
      arr.push(r.role);
      rolesMap.set(r.user_id, arr);
    });
    const enrichedUsers = (profs.data || []).map((p: any) => ({ ...p, roles: rolesMap.get(p.user_id) || [] }));
    setApplications((apps.data || []).map((a: any) => ({ ...a, profile: profileMap.get(a.user_id) })));
    setUsers(enrichedUsers);
    setOrders((ords.data || []).map((o: any) => ({ ...o, profile: profileMap.get(o.customer_id) })));
    setOrderItems(items.data || []);
    setProducts(prods.data || []);
    setStores(strs.data || []);
    setTickets((tix.data || []).map((t: any) => ({ ...t, profile: profileMap.get(t.user_id) })));
    setReviews(revs.data || []);
    setCategories(cats.data || []);
    setSlotRequests((slots.data || []).map((s: any) => ({
      ...s,
      profile: profileMap.get(s.user_id),
      store: storeMap.get(s.store_id),
    })));
    setLoading(false);
  };

  // ===== Slot requests =====
  const reviewSlotRequest = async (req: any, status: "approved" | "rejected", grantedExtra: number) => {
    const { error } = await supabase.from("slot_requests").update({
      status,
      granted_extra: status === "approved" ? grantedExtra : 0,
    }).eq("id", req.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("notifications").insert({
      user_id: req.user_id,
      title: status === "approved" ? "Slot request approved 🎉" : "Slot request update",
      body: status === "approved"
        ? `You've been granted +${grantedExtra} extra product slots.`
        : `Your request for +${req.requested_extra} extra slots was not approved.`,
    });
    toast.success(`Request ${status}`);
    fetchAll();
  };

  // ===== Applications =====
  const approveApplication = async (app: any) => {
    try {
      await supabase.from("merchant_applications").update({ status: "approved" }).eq("id", app.id);
      await supabase.from("user_roles").insert({ user_id: app.user_id, role: "moderator" as any });
      await supabase.from("stores").insert({
        owner_id: app.user_id,
        name_en: app.business_name_en,
        name_ar: app.business_name_ar,
        phone: app.phone,
      });
      await supabase.from("notifications").insert({
        user_id: app.user_id,
        title: "Congratulations, you became a partner! 🎉",
        body: `Your store "${app.business_name_en}" is now live.`,
      });
      toast.success("Application approved");
      fetchAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const rejectApplication = async (app: any) => {
    try {
      await supabase.from("merchant_applications").update({ status: "rejected" }).eq("id", app.id);
      await supabase.from("notifications").insert({
        user_id: app.user_id,
        title: "Merchant application update",
        body: `Your application for "${app.business_name_en}" was not approved.`,
      });
      toast.success("Application rejected");
      fetchAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm("Delete this application?")) return;
    await supabase.from("merchant_applications").delete().eq("id", id);
    toast.success("Deleted");
    fetchAll();
  };

  // ===== Orders =====
  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Order set to ${status.replace(/_/g, " ")}`);
    fetchAll();
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    await supabase.from("order_items").delete().eq("order_id", id);
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Order deleted");
    fetchAll();
  };

  // ===== Tickets =====
  const resolveTicket = async (id: string) => {
    await supabase.from("support_tickets").update({ status: "resolved" }).eq("id", id);
    toast.success("Resolved");
    fetchAll();
  };
  const deleteTicket = async (id: string) => {
    if (!confirm("Delete this ticket?")) return;
    await supabase.from("support_tickets").delete().eq("id", id);
    toast.success("Deleted");
    fetchAll();
  };

  // ===== Products =====
  const toggleProductActive = async (id: string, active: boolean) => {
    await supabase.from("products").update({ is_active: active }).eq("id", id);
    toast.success(active ? "Product active" : "Product hidden");
    fetchAll();
  };
  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        await supabase.from("products").update({ is_active: false }).eq("id", id);
        toast.success("Product hidden (kept for past order history)");
      } else { toast.error(error.message); }
    } else {
      toast.success("Product deleted");
    }
    fetchAll();
  };
  const saveProductEdit = async () => {
    if (!editingProduct) return;
    const { id, name_en, name_ar, price, stock, is_active, category_id } = editingProduct;
    const { error } = await supabase.from("products").update({
      name_en, name_ar, price: Number(price), stock: Number(stock), is_active, category_id
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Product updated");
    setEditingProduct(null);
    fetchAll();
  };

  // ===== Stores =====
  const toggleStoreActive = async (id: string, active: boolean) => {
    await supabase.from("stores").update({ is_active: active }).eq("id", id);
    toast.success(active ? "Store activated" : "Store deactivated");
    fetchAll();
  };
  const deleteStore = async (id: string) => {
    if (!confirm("Delete this store and ALL its products? This cannot be undone.")) return;
    await supabase.from("products").delete().eq("store_id", id);
    const { error } = await supabase.from("stores").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Store deleted");
    fetchAll();
  };
  const saveStoreEdit = async () => {
    if (!editingStore) return;
    const { id, name_en, name_ar, description_en, phone, is_active } = editingStore;
    const { error } = await supabase.from("stores").update({
      name_en, name_ar, description_en, phone, is_active
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Store updated");
    setEditingStore(null);
    fetchAll();
  };

  // ===== Users / Roles =====
  const toggleRole = async (userId: string, role: string, hasRole: boolean) => {
    if (hasRole) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
      if (error) { toast.error(error.message); return; }
      toast.success(`${role} revoked`);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
      if (error) { toast.error(error.message); return; }
      toast.success(`${role} granted`);
    }
    fetchAll();
  };

  const saveUserEdit = async () => {
    if (!editingUser) return;
    const { id, full_name, phone, email } = editingUser;
    const { error } = await supabase.from("profiles").update({ full_name, phone, email }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("User updated");
    setEditingUser(null);
    fetchAll();
  };

  const deleteUserAccount = async (userId: string) => {
    if (userId === user?.id) { toast.error("You cannot delete your own account"); return; }
    if (!confirm("PERMANENTLY delete this user and all their data? This cannot be undone.")) return;
    const { data, error } = await supabase.functions.invoke("admin-delete-user", { body: { user_id: userId } });
    if (error) { toast.error(error.message); return; }
    if ((data as any)?.error) { toast.error((data as any).error); return; }
    toast.success("User deleted");
    fetchAll();
  };

  // ===== Reports computations =====
  const reports = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);

    const delivered = orders.filter((o) => o.status === "delivered");
    const totalRevenue = delivered.reduce((s, o) => s + Number(o.total || 0), 0);
    const ordersToday = orders.filter((o) => new Date(o.created_at) >= startOfDay).length;
    const ordersWeek = orders.filter((o) => new Date(o.created_at) >= weekAgo).length;
    const ordersMonth = orders.filter((o) => new Date(o.created_at) >= monthAgo).length;
    const newUsers7d = users.filter((u) => new Date(u.created_at) >= weekAgo).length;
    const newUsers30d = users.filter((u) => new Date(u.created_at) >= monthAgo).length;
    const activeStores = stores.filter((s) => s.is_active).length;
    const lowStock = products.filter((p) => p.stock <= 5).length;
    const pendingApps = applications.filter((a) => a.status === "pending").length;
    const openTickets = tickets.filter((t) => t.status !== "resolved").length;

    // Orders/revenue per day (30d)
    const dayBuckets: Record<string, { date: string; orders: number; revenue: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayBuckets[key] = { date: key.slice(5), orders: 0, revenue: 0 };
    }
    orders.forEach((o) => {
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      if (dayBuckets[key]) {
        dayBuckets[key].orders += 1;
        if (o.status === "delivered") dayBuckets[key].revenue += Number(o.total || 0);
      }
    });
    const dailyData = Object.values(dayBuckets);

    // Orders by status
    const statusCounts: Record<string, number> = {};
    orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

    // Top stores by revenue
    const storeRev: Record<string, number> = {};
    delivered.forEach((o) => { storeRev[o.store_id] = (storeRev[o.store_id] || 0) + Number(o.total || 0); });
    const storeMap = new Map(stores.map((s) => [s.id, s.name_en]));
    const topStores = Object.entries(storeRev)
      .map(([id, revenue]) => ({ name: storeMap.get(id) || "Unknown", revenue }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Top products by units sold
    const prodUnits: Record<string, number> = {};
    orderItems.forEach((it) => { prodUnits[it.product_id] = (prodUnits[it.product_id] || 0) + Number(it.quantity || 0); });
    const prodMap = new Map(products.map((p) => [p.id, p.name_en]));
    const topProducts = Object.entries(prodUnits)
      .map(([id, units]) => ({ name: prodMap.get(id) || "Unknown", units }))
      .sort((a, b) => b.units - a.units).slice(0, 5);

    return { totalRevenue, ordersToday, ordersWeek, ordersMonth, newUsers7d, newUsers30d, activeStores, lowStock, pendingApps, openTickets, dailyData, statusData, topStores, topProducts };
  }, [orders, orderItems, users, stores, products, applications, tickets]);

  if (authLoading || loading) return <div className="min-h-screen bg-background"><Header /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <span className="ml-2 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Full Access</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Users", value: users.length, icon: Users, color: "text-primary" },
            { label: "Products", value: products.length, icon: Package, color: "text-success" },
            { label: "Orders", value: orders.length, icon: ShoppingCart, color: "text-accent" },
            { label: "Pending Apps", value: reports.pendingApps, icon: FileText, color: "text-warning" },
            { label: "Open Tickets", value: reports.openTickets, icon: FileText, color: "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="reports">
          <TabsList className="flex-wrap">
            <TabsTrigger value="reports"><BarChart3 className="h-4 w-4 mr-1" />Reports</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="stores">Stores</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="slots">
              Slot Requests
              {slotRequests.filter((r) => r.status === "pending").length > 0 && (
                <span className="ml-1.5 text-[10px] bg-warning text-warning-foreground px-1.5 py-0.5 rounded-full">
                  {slotRequests.filter((r) => r.status === "pending").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* ============ REPORTS ============ */}
          <TabsContent value="reports" className="mt-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Revenue", value: `EGP ${reports.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-success" },
                { label: "Orders Today", value: reports.ordersToday, icon: ShoppingCart, color: "text-primary" },
                { label: "Orders (7d)", value: reports.ordersWeek, icon: TrendingUp, color: "text-primary" },
                { label: "Orders (30d)", value: reports.ordersMonth, icon: TrendingUp, color: "text-accent" },
                { label: "New Users (7d)", value: reports.newUsers7d, icon: Users, color: "text-primary" },
                { label: "New Users (30d)", value: reports.newUsers30d, icon: Users, color: "text-accent" },
                { label: "Active Stores", value: reports.activeStores, icon: StoreIcon, color: "text-success" },
                { label: "Low Stock (≤5)", value: reports.lowStock, icon: AlertTriangle, color: "text-warning" },
              ].map((k) => (
                <div key={k.label} className="rounded-xl border border-border bg-card p-4">
                  <k.icon className={`h-5 w-5 ${k.color} mb-2`} />
                  <p className="text-xl font-bold text-foreground">{k.value}</p>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground mb-3">Orders per day (last 30 days)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={reports.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground mb-3">Revenue per day (EGP)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reports.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="revenue" fill="hsl(var(--accent))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground mb-3">Orders by status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={reports.statusData} dataKey="value" nameKey="name" outerRadius={80} label>
                      {reports.statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground mb-3">Top 5 stores by revenue</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reports.topStores} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
                <h3 className="font-semibold text-foreground mb-3">Top 5 products (units sold)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reports.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={150} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="units" fill="hsl(var(--success))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-3">Export Data (CSV)</h3>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => downloadCSV("orders.csv", orders)}><Download className="h-3 w-3 mr-1" />Orders</Button>
                <Button size="sm" variant="outline" onClick={() => downloadCSV("products.csv", products)}><Download className="h-3 w-3 mr-1" />Products</Button>
                <Button size="sm" variant="outline" onClick={() => downloadCSV("users.csv", users)}><Download className="h-3 w-3 mr-1" />Users</Button>
                <Button size="sm" variant="outline" onClick={() => downloadCSV("stores.csv", stores)}><Download className="h-3 w-3 mr-1" />Stores</Button>
                <Button size="sm" variant="outline" onClick={() => downloadCSV("reviews.csv", reviews)}><Download className="h-3 w-3 mr-1" />Reviews</Button>
                <Button size="sm" variant="outline" onClick={() => downloadCSV("applications.csv", applications)}><Download className="h-3 w-3 mr-1" />Applications</Button>
              </div>
            </div>
          </TabsContent>

          {/* ============ APPLICATIONS ============ */}
          <TabsContent value="applications" className="mt-6 space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{app.business_name_en}</p>
                    <p className="text-xs text-muted-foreground">By {app.profile?.full_name || "—"} • Phone: {app.phone}</p>
                    {app.description && <p className="text-xs text-muted-foreground mt-1 italic">"{app.description}"</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize whitespace-nowrap ${
                    app.status === "approved" ? "bg-success/10 text-success" :
                    app.status === "rejected" ? "bg-destructive/10 text-destructive" :
                    "bg-warning/10 text-warning"
                  }`}>{app.status}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {app.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => approveApplication(app)}><CheckCircle className="h-3 w-3 mr-1" /> Approve</Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => rejectApplication(app)}><XCircle className="h-3 w-3 mr-1" /> Reject</Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteApplication(app.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
            {applications.length === 0 && <p className="text-center text-muted-foreground py-8">No applications</p>}
          </TabsContent>

          {/* ============ USERS ============ */}
          <TabsContent value="users" className="mt-6 space-y-3">
            <p className="text-xs text-muted-foreground">Total: {users.length} users</p>
            {users.map((u) => (
              <div key={u.id} className="rounded-xl border border-border bg-card p-4">
                {editingUser?.id === u.id ? (
                  <div className="space-y-2">
                    <Input value={editingUser.full_name || ""} onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })} placeholder="Full name" />
                    <Input value={editingUser.phone || ""} onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })} placeholder="Phone" />
                    <Input value={editingUser.email || ""} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} placeholder="Email" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveUserEdit}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{u.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{u.email || "no email"} • {u.phone || "no phone"}</p>
                        <p className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditingUser(u)}><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" disabled={u.user_id === user?.id} onClick={() => deleteUserAccount(u.user_id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {ROLES.map((role) => {
                        const has = u.roles.includes(role);
                        return (
                          <button
                            key={role}
                            onClick={() => toggleRole(u.user_id, role, has)}
                            className={`text-xs px-2.5 py-1 rounded-full capitalize transition-colors ${
                              has ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {has ? "✓ " : "+ "}{role}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
          </TabsContent>

          {/* ============ STORES ============ */}
          <TabsContent value="stores" className="mt-6 space-y-3">
            {stores.map((s) => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                {editingStore?.id === s.id ? (
                  <div className="space-y-2">
                    <Input value={editingStore.name_en || ""} onChange={(e) => setEditingStore({ ...editingStore, name_en: e.target.value })} placeholder="Name (EN)" />
                    <Input value={editingStore.name_ar || ""} onChange={(e) => setEditingStore({ ...editingStore, name_ar: e.target.value })} placeholder="Name (AR)" dir="rtl" />
                    <Input value={editingStore.phone || ""} onChange={(e) => setEditingStore({ ...editingStore, phone: e.target.value })} placeholder="Phone" />
                    <textarea value={editingStore.description_en || ""} onChange={(e) => setEditingStore({ ...editingStore, description_en: e.target.value })} placeholder="Description" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editingStore.is_active} onChange={(e) => setEditingStore({ ...editingStore, is_active: e.target.checked })} /> Active
                    </label>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveStoreEdit}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingStore(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{s.name_en}</p>
                      <p className="text-xs text-muted-foreground">{s.phone || "no phone"} • {s.is_active ? "Active" : "Inactive"}</p>
                    </div>
                    <div className="flex gap-1">
                      <Link to={`/store/${s.id}`} target="_blank"><Button size="sm" variant="ghost"><StoreIcon className="h-3 w-3" /></Button></Link>
                      <Button size="sm" variant="outline" onClick={() => toggleStoreActive(s.id, !s.is_active)}>{s.is_active ? "Deactivate" : "Activate"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingStore(s)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteStore(s.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {stores.length === 0 && <p className="text-center text-muted-foreground py-8">No stores</p>}
          </TabsContent>

          {/* ============ ORDERS ============ */}
          <TabsContent value="orders" className="mt-6 space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl border border-border bg-card p-4 flex justify-between items-center flex-wrap gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">{o.profile?.full_name || "Customer"} • {new Date(o.created_at).toLocaleDateString()}</p>
                  <p className="text-primary font-bold text-sm">EGP {Number(o.total).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={o.status}
                    onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium"
                  >
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteOrder(o.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-center text-muted-foreground py-8">No orders</p>}
          </TabsContent>

          {/* ============ PRODUCTS ============ */}
          <TabsContent value="products" className="mt-6 space-y-3">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                {editingProduct?.id === p.id ? (
                  <div className="space-y-2">
                    <Input value={editingProduct.name_en || ""} onChange={(e) => setEditingProduct({ ...editingProduct, name_en: e.target.value })} placeholder="Name (EN)" />
                    <Input value={editingProduct.name_ar || ""} onChange={(e) => setEditingProduct({ ...editingProduct, name_ar: e.target.value })} placeholder="Name (AR)" dir="rtl" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} placeholder="Price" />
                      <Input type="number" value={editingProduct.stock} onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })} placeholder="Stock" />
                    </div>
                    <select value={editingProduct.category_id} onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editingProduct.is_active} onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })} /> Active
                    </label>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveProductEdit}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {p.images?.[0] && <img src={p.images[0]} alt={p.name_en} className="h-10 w-10 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{p.name_en}</p>
                      <p className="text-xs text-muted-foreground">{p.stores?.name_en || "Store"} • Stock: {p.stock}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.is_active ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {p.is_active ? "Active" : "Hidden"}
                    </span>
                    <p className="text-sm font-bold text-primary">EGP {Number(p.price).toLocaleString()}</p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => toggleProductActive(p.id, !p.is_active)}>{p.is_active ? "Hide" : "Show"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingProduct(p)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteProduct(p.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          {/* ============ SLOT REQUESTS ============ */}
          <TabsContent value="slots" className="mt-6 space-y-3">
            {slotRequests.length === 0 && <p className="text-center text-muted-foreground py-8">No slot requests</p>}
            {slotRequests.map((r) => (
              <SlotRequestRow key={r.id} req={r} onReview={reviewSlotRequest} />
            ))}
          </TabsContent>

          {/* ============ SUPPORT ============ */}
          <TabsContent value="support" className="mt-6 space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">{t.profile?.full_name || "User"} • {new Date(t.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t.message}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${t.status === "resolved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{t.status}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {t.status !== "resolved" && (
                    <Button size="sm" onClick={() => resolveTicket(t.id)}><CheckCircle className="h-3 w-3 mr-1" /> Resolve</Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteTicket(t.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-center text-muted-foreground py-8">No tickets</p>}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPanel;

interface SlotRequestRowProps {
  req: any;
  onReview: (req: any, status: "approved" | "rejected", grantedExtra: number) => void;
}

const SlotRequestRow = ({ req, onReview }: SlotRequestRowProps) => {
  const [granted, setGranted] = useState<string>(String(req.granted_extra || req.requested_extra));
  const isPending = req.status === "pending";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">
            {req.store?.name_en || "Store"} — requesting +{req.requested_extra} slots
          </p>
          <p className="text-xs text-muted-foreground">
            By {req.profile?.full_name || "Merchant"} • {new Date(req.created_at).toLocaleDateString()}
          </p>
          {req.reason && <p className="text-sm text-muted-foreground mt-1 italic">"{req.reason}"</p>}
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize whitespace-nowrap ${
          req.status === "approved" ? "bg-success/10 text-success" :
          req.status === "rejected" ? "bg-destructive/10 text-destructive" :
          "bg-warning/10 text-warning"
        }`}>
          {req.status}{req.status === "approved" ? ` (+${req.granted_extra})` : ""}
        </span>
      </div>
      {isPending && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <label className="text-xs text-muted-foreground">Grant:</label>
          <Input type="number" min="0" value={granted} onChange={(e) => setGranted(e.target.value)} className="h-8 w-20" />
          <Button size="sm" onClick={() => onReview(req, "approved", parseInt(granted) || 0)}>
            <CheckCircle className="h-3 w-3 mr-1" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => onReview(req, "rejected", 0)}>
            <XCircle className="h-3 w-3 mr-1" /> Reject
          </Button>
        </div>
      )}
    </div>
  );
};
