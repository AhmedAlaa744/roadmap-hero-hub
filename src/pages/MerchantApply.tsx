import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Store, Clock, CheckCircle, XCircle } from "lucide-react";

const MerchantApply = () => {
  const { user, isMerchant, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [existingApp, setExistingApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [businessNameEn, setBusinessNameEn] = useState("");
  const [businessNameAr, setBusinessNameAr] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?redirect=/merchant/apply", { replace: true });
      return;
    }
    if (!authLoading && isMerchant) {
      navigate("/merchant/dashboard", { replace: true });
      return;
    }
    if (user) checkExisting();
  }, [user, isMerchant, authLoading]);

  const checkExisting = async () => {
    const { data } = await supabase
      .from("merchant_applications")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setExistingApp(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("merchant_applications").insert({
        user_id: user.id,
        business_name_en: businessNameEn,
        business_name_ar: businessNameAr || null,
        business_type: businessType || null,
        description: description || null,
        phone,
      });
      if (error) throw error;
      toast.success("Application submitted! An admin will review it shortly.");
      checkExisting();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Store className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Become a Merchant</h1>
        </div>

        {existingApp ? (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              {existingApp.status === "pending" && <Clock className="h-6 w-6 text-warning" />}
              {existingApp.status === "approved" && <CheckCircle className="h-6 w-6 text-success" />}
              {existingApp.status === "rejected" && <XCircle className="h-6 w-6 text-destructive" />}
              <div>
                <p className="font-semibold text-foreground capitalize">Status: {existingApp.status}</p>
                <p className="text-sm text-muted-foreground">
                  {existingApp.status === "pending" && "Your application is under review. You'll be notified once approved."}
                  {existingApp.status === "approved" && "Congrats! Your store is live."}
                  {existingApp.status === "rejected" && "Your application was not approved. Contact support for details."}
                </p>
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Business:</span> <span className="font-medium text-foreground">{existingApp.business_name_en}</span></p>
              {existingApp.business_type && <p><span className="text-muted-foreground">Type:</span> <span className="font-medium text-foreground capitalize">{existingApp.business_type}</span></p>}
              <p><span className="text-muted-foreground">Phone:</span> <span className="font-medium text-foreground">{existingApp.phone}</span></p>
            </div>
            {existingApp.status === "approved" && (
              <Link to="/merchant/dashboard">
                <Button className="w-full">Go to Merchant Dashboard</Button>
              </Link>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <p className="text-sm text-muted-foreground mb-2">
              Fill out your business details. An admin will review your application.
            </p>

            <div>
              <label className="text-sm font-medium text-foreground">Business Name (English) *</label>
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
              <label className="text-sm font-medium text-foreground">Contact Phone *</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required dir="ltr" placeholder="01XXXXXXXXX" className="mt-1" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]" placeholder="Tell us about your business..." />
            </div>

            <Button type="submit" disabled={submitting} className="w-full" size="lg">
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MerchantApply;
