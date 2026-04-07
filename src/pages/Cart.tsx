import { Link } from "react-router-dom";
import { Trash2, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          Shopping Cart ({totalItems} items)
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Your cart is empty</p>
            <Link to="/browse" className="text-primary font-medium hover:underline mt-2 inline-block">Start shopping</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                  <Link to={`/product/${item.product.id}`} className="shrink-0">
                    <img src={item.product.images[0]} alt={item.product.name_en} loading="lazy" className="h-24 w-24 rounded-lg object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product.id}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                      {item.product.name_en}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.product.store_name}</p>
                    <p className="text-lg font-bold text-primary mt-2">EGP {item.product.price.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="px-2.5 py-1 text-sm text-foreground hover:bg-muted">−</button>
                      <span className="px-3 py-1 text-sm font-semibold text-foreground">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="px-2.5 py-1 text-sm text-foreground hover:bg-muted">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border bg-card p-6 sticky top-32 space-y-4">
                <h2 className="font-bold text-foreground text-lg">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground font-medium">EGP {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span className="text-success font-medium">Free</span>
                  </div>
                </div>
                <div className="border-t border-border pt-4 flex justify-between font-bold text-foreground">
                  <span>Total</span>
                  <span className="text-primary text-xl">EGP {subtotal.toLocaleString()}</span>
                </div>
                <Link to="/checkout">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" size="lg">
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-muted-foreground">Cash on Delivery available</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Cart;
