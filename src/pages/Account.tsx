import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Package, Heart, LogOut, Store, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Account = () => {
  const { user, profile, roles, signOut, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      supabase
        .from("orders")
        .select("*, order_items(*, products(name_en, images))")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setOrders(data || []));
    }
  }, [user]);

  if (loading || !user) return null;

  const initial = profile?.full_name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Profile card */}
        <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
            {initial}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{profile?.full_name || "User"}</h1>
            <p className="text-sm text-muted-foreground">{profile?.phone}</p>
            <div className="flex gap-2 mt-1">
              {roles.map((r) => (
                <span key={r} className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium capitalize">{r}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Link to="/browse" className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors">
            <Package className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium text-foreground">Browse</span>
          </Link>
          <Link to="/account" className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors">
            <Heart className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium text-foreground">Wishlist</span>
          </Link>
          {roles.includes("moderator") && (
            <Link to="/merchant/dashboard" className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors">
              <Store className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-foreground">My Store</span>
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors">
              <Shield className="h-5 w-5 text-accent" />
              <span className="text-xs font-medium text-foreground">Admin</span>
            </Link>
          )}
        </div>

        {/* Orders */}
        <h2 className="text-lg font-bold text-foreground mb-4">My Orders</h2>
        {orders.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-border bg-card">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No orders yet</p>
            <Link to="/browse" className="text-primary text-sm font-medium hover:underline mt-2 inline-block">Start shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/order/${order.id}`}
                className="block rounded-xl border border-border bg-card p-4 hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-foreground">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    order.status === "delivered" ? "bg-success/10 text-success" :
                    order.status === "confirmed" || order.status === "preparing" || order.status === "out_for_delivery" ? "bg-primary/10 text-primary" :
                    order.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                    "bg-warning/10 text-warning"
                  }`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-primary font-bold mt-2">EGP {Number(order.total).toLocaleString()}</p>
                <p className="text-xs text-primary mt-1">Track order →</p>
              </Link>
            ))}
          </div>
        )}

        <Button variant="outline" className="w-full mt-8 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => { signOut(); navigate("/"); }}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
      <Footer />
    </div>
  );
};

export default Account;
