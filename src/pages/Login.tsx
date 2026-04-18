import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessNameEn, setBusinessNameEn] = useState("");
  const [businessNameAr, setBusinessNameAr] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDesc, setBusinessDesc] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, isAdmin, isMerchant: isMerchantRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      redirectByRole();
    }
  }, [user, isAdmin, isMerchantRole, authLoading]);

  const redirectByRole = () => {
    if (redirectTo) {
      navigate(redirectTo, { replace: true });
    } else if (isAdmin) {
      navigate("/admin", { replace: true });
    } else if (isMerchantRole) {
      navigate("/merchant/dashboard", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister && !agreed) {
      toast.error("Please agree to the terms and conditions");
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await signUp(phone, password, fullName);
        if (error) throw error;

        if (isMerchant && businessNameEn) {
          // Submit merchant application after a short delay for profile creation
          setTimeout(async () => {
            const { data: { user: newUser } } = await supabase.auth.getUser();
            if (newUser) {
              await supabase.from("merchant_applications").insert({
                user_id: newUser.id,
                business_name_en: businessNameEn,
                business_name_ar: businessNameAr || null,
                business_type: businessType || null,
                description: businessDesc || null,
                phone,
              });
            }
          }, 1000);
          toast.success("Account created! Your merchant application has been submitted for review.");
        } else {
          toast.success("Account created successfully!");
        }
        navigate("/");
      } else {
        const { error } = await signIn(phone, password);
        if (error) throw error;
        toast.success("Welcome back!");
        // Role-based redirect happens via useEffect above
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <span className="text-4xl font-extrabold text-primary">جارك</span>
            <span className="block text-sm font-semibold text-muted-foreground mt-1">Garak</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-6">
            {isRegister ? (isMerchant ? "Become a Merchant" : "Create Account") : "Welcome Back"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isRegister ? "Join your neighborhood marketplace" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card rounded-2xl border border-border p-6">
          {isRegister && (
            <div>
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required className="mt-1" />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground">Phone Number</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" required className="mt-1" dir="ltr" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} className="mt-1" />
          </div>

          {isRegister && (
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <input type="checkbox" checked={isMerchant} onChange={(e) => setIsMerchant(e.target.checked)} className="rounded" />
              <div>
                <p className="text-sm font-medium text-foreground">I want to sell products</p>
                <p className="text-xs text-muted-foreground">Apply as a merchant</p>
              </div>
            </div>
          )}

          {isRegister && isMerchant && (
            <div className="space-y-3 border-t border-border pt-4">
              <div>
                <label className="text-sm font-medium text-foreground">Business Name (English)</label>
                <Input value={businessNameEn} onChange={(e) => setBusinessNameEn(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Business Name (Arabic)</label>
                <Input value={businessNameAr} onChange={(e) => setBusinessNameAr(e.target.value)} dir="rtl" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Business Type</label>
                <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select type</option>
                  <option value="retail">Retail</option>
                  <option value="food">Food & Beverages</option>
                  <option value="services">Services</option>
                  <option value="handmade">Handmade / Crafts</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea value={businessDesc} onChange={(e) => setBusinessDesc(e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" />
              </div>
            </div>
          )}

          {isRegister && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 rounded" />
              I agree to the Terms of Service and Privacy Policy
            </label>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-semibold" size="lg">
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button type="button" onClick={() => { setIsRegister(!isRegister); setIsMerchant(false); }} className="text-primary font-medium hover:underline">
              {isRegister ? "Sign In" : "Create Account"}
            </button>
          </p>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
