import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Package, CheckCircle, Clock, Truck, XCircle, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const STATUS_FLOW = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"] as const;

const statusMeta: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-warning" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "text-primary" },
  preparing: { label: "Preparing", icon: Package, color: "text-primary" },
  out_for_delivery: { label: "Out for Delivery", icon: Truck, color: "text-primary" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-success" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-destructive" },
};

const OrderTracking = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const fetchOrder = async () => {
    if (!id || !user) return;
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name_en, images)), stores(name_en, phone)")
      .eq("id", id)
      .single();
    setOrder(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [id, user]);

  // Realtime updates
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, () => fetchOrder())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Link to="/account"><Button>Back to My Orders</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const currentStep = STATUS_FLOW.indexOf(order.status as any);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/account" className="text-sm text-primary hover:underline">← Back to My Orders</Link>

        <div className="mt-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-muted-foreground">Order Number</p>
              <h1 className="text-xl font-bold text-foreground">{order.order_number}</h1>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
              isCancelled ? "bg-destructive/10 text-destructive" :
              order.status === "delivered" ? "bg-success/10 text-success" :
              "bg-primary/10 text-primary"
            }`}>{statusMeta[order.status]?.label || order.status}</span>
          </div>
          <p className="text-xs text-muted-foreground">Placed {new Date(order.created_at).toLocaleString()}</p>
          {order.stores?.name_en && (
            <p className="text-sm text-muted-foreground mt-2">From <span className="font-medium text-foreground">{order.stores.name_en}</span></p>
          )}
        </div>

        {/* Status Timeline */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-bold text-foreground mb-6">Order Status</h2>
          {isCancelled ? (
            <div className="flex items-center gap-3 text-destructive">
              <XCircle className="h-6 w-6" />
              <div>
                <p className="font-semibold">Order Cancelled</p>
                <p className="text-xs text-muted-foreground">This order was cancelled.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {STATUS_FLOW.map((step, idx) => {
                const meta = statusMeta[step];
                const Icon = meta.icon;
                const isDone = idx <= currentStep;
                const isActive = idx === currentStep;
                return (
                  <div key={step} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                        isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {idx < STATUS_FLOW.length - 1 && (
                        <div className={`w-0.5 h-8 ${idx < currentStep ? "bg-primary" : "bg-border"}`} />
                      )}
                    </div>
                    <div className="pb-8 pt-2">
                      <p className={`font-semibold ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                        {meta.label}
                      </p>
                      {isActive && <p className="text-xs text-primary mt-0.5">Current status</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-bold text-foreground mb-4">Items</h2>
          <div className="space-y-3">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex gap-3 items-center">
                {item.products?.images?.[0] && (
                  <img src={item.products.images[0]} alt={item.products.name_en} className="h-14 w-14 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.products?.name_en || "Item"}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity} × EGP {Number(item.unit_price).toLocaleString()}</p>
                </div>
                <p className="font-semibold text-foreground">EGP {(Number(item.unit_price) * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-3 flex justify-between font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-primary text-xl">EGP {Number(order.total).toLocaleString()}</span>
          </div>
        </div>

        {/* Delivery & Payment */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Delivery Address</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Building {order.building}
              {order.floor && `, Floor ${order.floor}`}
              {order.apartment && `, Apt ${order.apartment}`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Dar Misr Al-Andalus</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Payment</h3>
            </div>
            <p className="text-sm text-muted-foreground capitalize">
              {order.payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}
            </p>
          </div>
        </div>

        {order.notes && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default OrderTracking;
