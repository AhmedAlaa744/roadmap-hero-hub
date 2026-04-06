import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {/* Top bar */}
      <div className="bg-primary px-4 py-1.5 text-center text-sm font-medium text-primary-foreground">
        🏘️ Serving Dar Misr Al-Andalus • 5th Settlement • New Cairo
      </div>

      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl font-extrabold text-primary">جارك</span>
          <span className="hidden sm:block text-sm font-semibold text-muted-foreground">Garak</span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={lang === "en" ? "Search products..." : "ابحث عن منتجات..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-10 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            {lang === "en" ? "عربي" : "EN"}
          </button>

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" className="text-foreground">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                3
              </span>
            </Button>
          </Link>

          <Link to="/login">
            <Button variant="ghost" size="icon" className="text-foreground">
              <User className="h-5 w-5" />
            </Button>
          </Link>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-10 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <nav className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3">
          <Link to="/browse" className="block text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>Browse All</Link>
          <Link to="/browse?category=Electronics" className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>Electronics</Link>
          <Link to="/browse?category=Fashion" className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>Fashion</Link>
          <Link to="/browse?category=Food+%26+Beverages" className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>Food & Beverages</Link>
          <Link to="/browse?category=Home+%26+Garden" className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>Home & Garden</Link>
        </nav>
      )}
    </header>
  );
};

export default Header;
