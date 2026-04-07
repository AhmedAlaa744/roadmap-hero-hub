import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

const Checkout = () => {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground mb-4">Please sign in to checkout</p>
          <Link to="/login"><Button>Sign In</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (orderNumber) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Order Placed!</h1>
          <p className="text-muted-foreground mt-2">Your order number is</p>
          <p className="text-2xl font-bold text-primary mt-2">{orderNumber}</p>
          <p className="text-sm text-muted-foreground mt-4">You'll receive updates on your order status.</p>
          <div className="flex gap-3 justify-center mt-8">
            <Link to="/account"><Button variant="outline">My Orders</Button></Link>
            <Link to="/browse"><Button>Continue Shopping</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!building.trim()) {
      toast.error("Building number is required");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setLoading(true);
    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const rand = Math.floor(1000 + Math.random() * 9000);
      const orderNum = `GRK-${dateStr}-${rand}`;

      // Group items by store
      const storeGroups = items.reduce((acc, item) => {
        const sid = item.product.store_id;
        if (!acc[sid]) acc[sid] = [];
        acc[sid].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      for (const [storeId, storeItems] of Object.entries(storeGroups)) {
        const storeTotal = storeItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            customer_id: user.id,
            store_id: storeId,
            order_number: `${orderNum}-${storeId.slice(0, 4)}`,
            total: storeTotal,
            building,
            floor: floor || null,
            apartment: apartment || null,
            payment_method: paymentMethod,
            notes: notes || null,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        const orderItems = storeItems.map((item) => ({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
        }));

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;
      }

      clearCart();
      setOrderNumber(orderNum);
      toast.success("Order placed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-8">Checkout</h1>

        <div className="space-y-6">
          {/* Delivery address */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-bold text-foreground">Delivery Address</h2>
            <p className="text-xs text-muted-foreground">Dar Misr Al-Andalus compound</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Building *</label>
                <Input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="e.g. B12" required className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Floor</label>
                <Input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="e.g. 3" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Apartment</label>
                <Input value={apartment} onChange={(e) => setApartment(e.target.value)} placeholder="e.g. 5" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" placeholder="Any special instructions..." />
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-bold text-foreground">Payment Method</h2>
            <div className="flex gap-3">
              <button onClick={() => setPaymentMethod("cod")} className={`flex-1 rounded-lg border p-3 text-sm font-medium transition-colors ${paymentMethod === "cod" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
                💵 Cash on Delivery
              </button>
              <button onClick={() => setPaymentMethod("online")} className={`flex-1 rounded-lg border p-3 text-sm font-medium transition-colors ${paymentMethod === "online" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
                💳 Online Payment
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-bold text-foreground">Order Summary</h2>
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.product.name_en} × {item.quantity}</span>
                <span className="font-medium text-foreground">EGP {(item.product.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground">
              <span>Total</span>
              <span className="text-primary text-xl">EGP {subtotal.toLocaleString()}</span>
            </div>
          </div>

          <Button onClick={handlePlaceOrder} disabled={loading} className="w-full bg-primary text-primary-foreground font-semibold" size="lg">
            {loading ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
