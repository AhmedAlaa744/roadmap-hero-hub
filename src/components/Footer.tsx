import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-card mt-16">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-extrabold text-primary mb-2">جارك <span className="text-sm font-semibold text-foreground">Garak</span></h3>
          <p className="text-sm text-muted-foreground">Your Neighbor Marketplace — سوق جيرانك</p>
          <p className="text-sm text-muted-foreground mt-1">Dar Misr Al-Andalus • 5th Settlement • New Cairo</p>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-3">Shop</h4>
          <div className="space-y-2">
            <Link to="/browse" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Browse All</Link>
            <Link to="/browse?category=Electronics" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Electronics</Link>
            <Link to="/browse?category=Fashion" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Fashion</Link>
            <Link to="/browse?category=Food+%26+Beverages" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Food & Beverages</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-3">Sell</h4>
          <div className="space-y-2">
            <Link to="/merchant/apply" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Become a Merchant</Link>
            <Link to="/merchant/dashboard" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Merchant Dashboard</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-3">Support</h4>
          <div className="space-y-2">
            <Link to="/track" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Track Order</Link>
            <Link to="/help" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Help Center</Link>
            <Link to="/terms" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
          </div>

        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        © 2026 Garak (جارك). All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
