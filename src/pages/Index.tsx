import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories, products } from "@/data/mockData";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroBanner from "@/assets/hero-banner.jpg";

const Index = () => {
  const featuredProducts = products.slice(0, 4);
  const trendingProducts = products.slice(4, 8);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="Garak community marketplace" width={1920} height={800} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-lg space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-extrabold text-card leading-tight">
              Shop Local,<br />
              <span className="text-primary">Trust Your Neighbors</span>
            </h1>
            <p className="text-lg text-card/80 font-body">
              The community marketplace for Dar Misr Al-Andalus. Buy and sell with your neighbors — from fresh food to electronics.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/browse">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8">
                  Start Shopping
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/merchant/apply">
                <Button size="lg" variant="outline" className="border-card/30 text-card hover:bg-card/10 font-semibold px-8">
                  Become a Seller
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">Browse Categories</h2>
          <Link to="/browse" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/browse?category=${encodeURIComponent(cat.name_en)}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary hover:shadow-md"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{cat.name_en}</span>
              <span className="text-[10px] text-muted-foreground">{cat.product_count} items</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-2xl font-bold text-foreground">Featured Products</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="bg-mint/40 py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Trending Now</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl bg-primary p-8 md:p-14 text-center space-y-5">
          <h2 className="text-3xl font-extrabold text-primary-foreground">Start Selling Today</h2>
          <p className="text-primary-foreground/80 max-w-md mx-auto font-body">
            Join your neighbors on Garak. List up to 20 products for free and reach buyers in your compound.
          </p>
          <Link to="/merchant/apply">
            <Button size="lg" className="bg-card text-primary hover:bg-card/90 font-semibold px-10 mt-2">
              Apply as Merchant
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
