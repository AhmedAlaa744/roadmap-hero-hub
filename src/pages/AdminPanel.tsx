import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Package, ShoppingCart, FileText, CheckCircle, XCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminPanel = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, authLoading]);

  useEffect(() => {
    if (user && isAdmin) fetchAll();
  }, [user, isAdmin]);

  const fetchAll = async () => {
    const [apps, profs, ords, prods, tix] = await Promise.all([
      supabase.from("merchant_applications").select("*, profiles(full_name, phone)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*, user_roles(role)").order("created_at", { ascending: false }),
      supabase.from("orders").select("*, profiles!orders_customer_id_fkey(full_name)").order("created_at", { ascending: false }),
      supabase.from("products").select("*, stores(name_en)").order("created_at", { ascending: false }),
      supabase.from("support_tickets").select("*, profiles(full_name)").order("created_at", { ascending: false }),
    ]);
    setApplications(apps.data || []);
    setUsers(profs.data || []);
    setOrders(ords.data || []);
    setProducts(prods.data || []);
    setTickets(tix.data || []);
    setLoading(false);
  };

  const approveApplication = async (app: any) => {
    try {
      // Update application status
      await supabase.from("merchant_applications").update({ status: "approved" }).eq("id", app.id);
      // Add moderator role
      await supabase.from("user_roles").insert({ user_id: app.user_id, role: "moderator" as any });
      // Create store
      await supabase.from("stores").insert({
        owner_id: app.user_id,
        name_en: app.business_name_en,
        name_ar: app.business_name_ar,
        phone: app.phone,
      });
      toast.success("Application approved! Store created.");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const rejectApplication = async (id: string) => {
    await supabase.from("merchant_applications").update({ status: "rejected" }).eq("id", id);
    toast.success("Application rejected");
    fetchAll();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    toast.success(`Order ${status}`);
    fetchAll();
  };

  const resolveTicket = async (id: string) => {
    await supabase.from("support_tickets").update({ status: "resolved" }).eq("id", id);
    toast.success("Ticket resolved");
    fetchAll();
  };

  if (authLoading || loading) return <div className="min-h-screen bg-background"><Header /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Users", value: users.length, icon: Users, color: "text-primary" },
            { label: "Products", value: products.length, icon: Package, color: "text-success" },
            { label: "Orders", value: orders.length, icon: ShoppingCart, color: "text-accent" },
            { label: "Applications", value: applications.filter(a => a.status === "pending").length, icon: FileText, color: "text-warning" },
            { label: "Open Tickets", value: tickets.filter(t => t.status !== "resolved").length, icon: FileText, color: "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="applications">
          <TabsList className="flex-wrap">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="mt-6 space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-foreground">{app.business_name_en}</p>
                    {app.business_name_ar && <p className="text-sm text-muted-foreground" dir="rtl">{app.business_name_ar}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Phone: {app.phone} • Type: {app.business_type || "N/A"}</p>
                    {app.description && <p className="text-xs text-muted-foreground mt-1">{app.description}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    app.status === "approved" ? "bg-success/10 text-success" :
                    app.status === "rejected" ? "bg-destructive/10 text-destructive" :
                    "bg-warning/10 text-warning"
                  }`}>{app.status}</span>
                </div>
                {app.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => approveApplication(app)}><CheckCircle className="h-3 w-3 mr-1" /> Approve</Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => rejectApplication(app.id)}><XCircle className="h-3 w-3 mr-1" /> Reject</Button>
                  </div>
                )}
              </div>
            ))}
            {applications.length === 0 && <p className="text-center text-muted-foreground py-8">No applications</p>}
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium text-foreground">Name</th>
                    <th className="text-left p-3 font-medium text-foreground">Phone</th>
                    <th className="text-left p-3 font-medium text-foreground">Roles</th>
                    <th className="text-left p-3 font-medium text-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="p-3 text-foreground">{u.full_name || "—"}</td>
                      <td className="p-3 text-muted-foreground">{u.phone || "—"}</td>
                      <td className="p-3">
                        {u.user_roles?.map((r: any) => (
                          <span key={r.role} className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5 mr-1 capitalize">{r.role}</span>
                        ))}
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-6 space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl border border-border bg-card p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-foreground">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">{o.profiles?.full_name || "Customer"} • {new Date(o.created_at).toLocaleDateString()}</p>
                  <p className="text-primary font-bold text-sm">EGP {Number(o.total).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    o.status === "delivered" ? "bg-success/10 text-success" :
                    o.status === "confirmed" ? "bg-primary/10 text-primary" :
                    o.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                    "bg-warning/10 text-warning"
                  }`}>{o.status}</span>
                  {o.status === "confirmed" && (
                    <Button size="sm" onClick={() => updateOrderStatus(o.id, "delivered")}>Mark Delivered</Button>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="products" className="mt-6 space-y-3">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                {p.images?.[0] && <img src={p.images[0]} alt={p.name_en} className="h-10 w-10 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{p.name_en}</p>
                  <p className="text-xs text-muted-foreground">{p.stores?.name_en || "Store"}</p>
                </div>
                <p className="text-sm font-bold text-primary">EGP {Number(p.price).toLocaleString()}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="support" className="mt-6 space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-foreground">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">{t.profiles?.full_name || "User"} • {new Date(t.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t.message}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${t.status === "resolved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{t.status}</span>
                </div>
                {t.status !== "resolved" && (
                  <Button size="sm" className="mt-3" onClick={() => resolveTicket(t.id)}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Mark Resolved
                  </Button>
                )}
              </div>
            ))}
            {tickets.length === 0 && <p className="text-center text-muted-foreground py-8">No support tickets</p>}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPanel;
