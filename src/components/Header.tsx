import { useState, FormEvent, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Menu, X, User, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Suggestion {
  id: string;
  name_en: string;
  name_ar: string | null;
  price: number;
  images: string[] | null;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const desktopWrapRef = useRef<HTMLDivElement>(null);
  const mobileWrapRef = useRef<HTMLDivElement>(null);
  const { user, profile, signOut, isAdmin, isMerchant } = useAuth();
  const { totalItems } = useCart();
  const { lang, toggleLang, t } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("Signed out", "تم تسجيل الخروج"));
    navigate("/");
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setShowSuggestions(false);
    navigate(q ? `/browse?q=${encodeURIComponent(q)}` : "/browse");
    setIsMenuOpen(false);
  };

  // Live suggestions (debounced 200ms)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const escaped = q.replace(/[%,]/g, " ").trim();
      const { data } = await supabase
        .from("products")
        .select("id,name_en,name_ar,price,images")
        .eq("is_active", true)
        .or(`name_en.ilike.%${escaped}%,name_ar.ilike.%${escaped}%`)
        .limit(5);
      if (cancelled) return;
      setSuggestions((data as Suggestion[]) || []);
      setShowSuggestions(true);
      setActiveIdx(-1);
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        desktopWrapRef.current && !desktopWrapRef.current.contains(target) &&
        mobileWrapRef.current && !mobileWrapRef.current.contains(target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      const s = suggestions[activeIdx];
      setShowSuggestions(false);
      setIsMenuOpen(false);
      navigate(`/product/${s.id}`);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) return null;
    return (
      <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden">
        {suggestions.map((s, i) => {
          const name = lang === "ar" && s.name_ar ? s.name_ar : s.name_en;
          return (
            <Link
              key={s.id}
              to={`/product/${s.id}`}
              onClick={() => { setShowSuggestions(false); setIsMenuOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                i === activeIdx ? "bg-muted" : "hover:bg-muted/60"
              }`}
            >
              {s.images?.[0] ? (
                <img src={s.images[0]} alt={name} className="h-9 w-9 rounded object-cover shrink-0" />
              ) : (
                <div className="h-9 w-9 rounded bg-muted shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{name}</p>
                <p className="text-xs text-primary font-semibold">EGP {Number(s.price).toLocaleString()}</p>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="bg-primary px-4 py-1.5 text-center text-sm font-medium text-primary-foreground">
        {t(
          "🏘️ Serving Dar Misr Al-Andalus • 5th Settlement • New Cairo",
          "🏘️ نخدم دار مصر الأندلس • التجمع الخامس • القاهرة الجديدة"
        )}
      </div>

      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl font-extrabold text-primary">جارك</span>
          <span className="hidden sm:block text-sm font-semibold text-muted-foreground">Garak</span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
          <div ref={desktopWrapRef} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={t("Search products...", "ابحث عن منتجات...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              dir={lang === "ar" ? "rtl" : "ltr"}
              className="w-full rounded-lg border border-input bg-background px-10 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {renderSuggestions()}
          </div>
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            aria-label={t("Switch to Arabic", "Switch to English")}
            className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            {lang === "en" ? "عربي" : "EN"}
          </button>

          <NotificationBell />

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" className="text-foreground">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  {profile?.full_name ? (
                    <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card z-50">
                <DropdownMenuLabel className="truncate">{profile?.full_name || t("Account", "الحساب")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/account")}>
                  <User className="h-4 w-4 mr-2" /> {t("My Account", "حسابي")}
                </DropdownMenuItem>
                {isMerchant && (
                  <DropdownMenuItem onClick={() => navigate("/merchant/dashboard")}>
                    <LayoutDashboard className="h-4 w-4 mr-2" /> {t("Merchant Dashboard", "لوحة التاجر")}
                  </DropdownMenuItem>
                )}
                {!isMerchant && !isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/merchant/apply")}>
                    <LayoutDashboard className="h-4 w-4 mr-2" /> {t("Become a Seller", "كن بائعًا")}
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="h-4 w-4 mr-2" /> {t("Admin Panel", "لوحة الإدارة")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> {t("Sign Out", "تسجيل الخروج")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="icon" className="text-foreground">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
        <div ref={mobileWrapRef} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={t("Search products...", "ابحث عن منتجات...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            dir={lang === "ar" ? "rtl" : "ltr"}
            className="w-full rounded-lg border border-input bg-background px-10 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {renderSuggestions()}
        </div>
      </form>

      {isMenuOpen && (
        <nav className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3">
          <Link to="/browse" className="block text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>{t("Browse All", "تصفح الكل")}</Link>
          <Link to="/browse?category=Electronics" className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>{t("Electronics", "إلكترونيات")}</Link>
          <Link to="/browse?category=Fashion" className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>{t("Fashion", "أزياء")}</Link>
          <Link to="/browse?category=Food+%26+Beverages" className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>{t("Food & Beverages", "أطعمة ومشروبات")}</Link>
          <Link to="/browse?category=Bakery+%26+Sweets" className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>{t("Bakery & Sweets", "مخبوزات وحلويات")}</Link>
        </nav>
      )}
    </header>
  );
};

export default Header;
