import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PHONE = "01116895960";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto px-4 py-12">
      <article className="prose prose-slate max-w-3xl mx-auto dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Effective Date: April 19, 2026 · Garak — Dar Misr Al-Andalus</p>

        <p>
          This Privacy Policy explains what personal information Garak ("we", "us") collects from users of the Platform, how we use it, and the choices you have. By using Garak you agree to the practices described here.
        </p>

        <h2>1. What we collect</h2>
        <ul>
          <li><strong>Account information:</strong> phone number (used as your login), an optional email address, and your full name.</li>
          <li><strong>Delivery information:</strong> building, floor, and apartment inside Dar Misr Al-Andalus compound.</li>
          <li><strong>Order information:</strong> the items you order, prices, order status, and any notes you add.</li>
          <li><strong>Merchant information (sellers only):</strong> business name, business type, business phone, and product listings.</li>
          <li><strong>Support information:</strong> messages and tickets you send to our support team or chatbot.</li>
          <li><strong>Technical information:</strong> standard log data such as device type, browser, and IP address used to keep the service secure.</li>
        </ul>

        <h2>2. How we use your information</h2>
        <ul>
          <li>To create and operate your account and authenticate you.</li>
          <li>To process and deliver your orders and communicate updates about them.</li>
          <li>To allow Merchants to fulfill orders placed with them.</li>
          <li>To provide customer service and respond to support tickets.</li>
          <li>To detect and prevent fraud, abuse, and security incidents.</li>
          <li>To improve the Platform.</li>
        </ul>

        <h2>3. Where your data is stored</h2>
        <p>
          Your data is stored on our secure backend infrastructure (Lovable Cloud, powered by Supabase). Access is restricted by row-level security so that you can only see your own data; merchants can only see orders placed with their store.
        </p>

        <h2>4. Sharing</h2>
        <p>We do <strong>not</strong> sell your personal information to third parties. We share data only:</p>
        <ul>
          <li>With the Merchant fulfilling your order (name, phone, delivery address, order details).</li>
          <li>With service providers strictly necessary to operate the Platform (hosting, database).</li>
          <li>When required by law or to protect the rights and safety of our users.</li>
        </ul>

        <h2>5. Your rights</h2>
        <ul>
          <li>Access, correct, or update your profile information at any time from the Account page.</li>
          <li>Request deletion of your account and personal data by contacting us at {PHONE}.</li>
          <li>Opt out of optional communications at any time.</li>
        </ul>

        <h2>6. Security</h2>
        <p>
          We use industry-standard security measures including encrypted connections, hashed passwords, and row-level database security. No system can be 100% secure; please keep your password confidential and notify us immediately if you suspect unauthorized access.
        </p>

        <h2>7. Children</h2>
        <p>The Platform is intended for users 18 years of age or older. We do not knowingly collect data from minors.</p>

        <h2>8. Changes to this policy</h2>
        <p>We may update this Privacy Policy from time to time. Material changes will be communicated through the Platform.</p>

        <h2>9. Contact</h2>
        <p>For privacy questions or data requests, contact our customer service at <a href={`tel:${PHONE}`}>{PHONE}</a>.</p>
      </article>
    </main>
    <Footer />
  </div>
);

export default Privacy;
