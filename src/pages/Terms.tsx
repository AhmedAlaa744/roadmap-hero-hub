import Header from "@/components/Header";
import Footer from "@/components/Footer";

const BRAND = "Garak — Dar Misr Al-Andalus";
const PHONE = "01116895960";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto px-4 py-12">
      <article className="prose prose-slate max-w-3xl mx-auto dark:prose-invert">
        <h1>Terms and Conditions</h1>
        <p className="text-sm text-muted-foreground">Online Marketplace Platform — Including Policies for Customers and Merchants</p>
        <p className="text-sm text-muted-foreground">Effective Date: April 19, 2026 · {BRAND}</p>

        <blockquote>
          <strong>IMPORTANT:</strong> Please read these Terms and Conditions carefully before using the Platform. By accessing or using the Platform, you agree to be bound by these Terms.
        </blockquote>

        <h2>Part I: General Terms and Conditions</h2>

        <h3>1. Introduction and Definitions</h3>
        <p>
          Welcome to {BRAND} (the "Platform," "we," "us," or "our"). The Platform operates as an online marketplace that connects independent third-party sellers ("Merchants") with buyers ("Customers"). These Terms and Conditions ("Terms") govern the use of our Platform by all users, including Merchants, Customers, and visitors.
        </p>
        <p>
          By accessing, browsing, or using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms, our Privacy Policy, and any additional policies referenced herein.
        </p>

        <h4>1.1 Key Definitions</h4>
        <ul>
          <li><strong>Platform</strong> — the website, mobile application, and all related services operated by {BRAND}.</li>
          <li><strong>Merchant</strong> — any individual or business entity that lists, offers, or sells products through the Platform.</li>
          <li><strong>Customer</strong> — any individual who browses, purchases, or otherwise engages with products listed on the Platform.</li>
          <li><strong>Listing</strong> — any product or service posted by a Merchant on the Platform for sale.</li>
          <li><strong>Transaction</strong> — any purchase or sale completed through the Platform.</li>
          <li><strong>Content</strong> — all text, images, descriptions, reviews, and other materials posted on the Platform by any user.</li>
        </ul>

        <h3>2. Platform Role and Limitation of Responsibility</h3>
        <p>
          The Platform serves solely as an intermediary that facilitates transactions between Merchants and Customers. We do not manufacture, store, inspect, endorse, or guarantee any products or services listed on the Platform.
        </p>
        <h4>2.1 What We Do</h4>
        <ul>
          <li>Provide a technology platform for Merchants to list eligible items for sale.</li>
          <li>Facilitate the discovery of products by Customers through search, browsing, and recommendation features.</li>
          <li>Process payments securely between Customers and Merchants through our approved payment processors.</li>
          <li>Offer communication tools to enable interaction between Customers and Merchants.</li>
          <li>Enforce eligibility criteria for items listed on the Platform.</li>
          <li>Provide dispute resolution assistance as outlined in these Terms.</li>
        </ul>

        <h4>2.2 What We Do Not Do</h4>
        <ul>
          <li>We do not own, handle, or have physical possession of any products listed by Merchants.</li>
          <li>We do not verify, guarantee, or warrant the quality, safety, legality, accuracy, or suitability of any Listing or product.</li>
          <li>We do not guarantee that any Transaction will be completed to either party's satisfaction.</li>
          <li>We are not a party to the transaction between Merchants and Customers; we act only as a facilitator.</li>
          <li>We do not provide warranties of any kind regarding products sold through the Platform.</li>
        </ul>
        <blockquote>
          <strong>IMPORTANT DISCLAIMER:</strong> The Platform is a marketplace facilitator only. All products are sold directly by independent Merchants. We do not control, inspect, or guarantee product quality, authenticity, or fitness for any particular purpose.
        </blockquote>

        <h3>3. Eligibility and Account Registration</h3>
        <h4>3.1 General Eligibility</h4>
        <p>To use the Platform, you must be at least 18 years of age or the age of legal majority in your jurisdiction, whichever is greater.</p>
        <h4>3.2 Account Registration</h4>
        <p>Certain features require account registration. You agree to provide accurate, current, and complete information. You are solely responsible for maintaining the confidentiality of your credentials and for all activities under your account.</p>
        <h4>3.3 Account Security</h4>
        <ul>
          <li>You must immediately notify us of any unauthorized use of your account.</li>
          <li>We reserve the right to suspend or terminate any account at our sole discretion for any violation of these Terms.</li>
          <li>You may not transfer, assign, or share your account without prior written consent.</li>
        </ul>

        <h3>4. Item Eligibility Policy</h3>
        <h4>4.1 Permitted Items</h4>
        <p>Items must comply with all applicable local, national, and international laws. Merchants are solely responsible for ensuring their Listings comply with all legal requirements.</p>
        <h4>4.2 Prohibited Items</h4>
        <ul>
          <li>Illegal, counterfeit, or stolen goods.</li>
          <li>Items that infringe on intellectual property rights.</li>
          <li>Hazardous materials, weapons, explosives, or controlled substances.</li>
          <li>Products subject to government recall or regulatory bans.</li>
          <li>Adult content or age-restricted items without appropriate verification.</li>
          <li>Items that promote hatred, violence, discrimination, or illegal activity.</li>
          <li>Live animals or protected wildlife products.</li>
          <li>Human remains, body parts, or bodily fluids.</li>
          <li>Any items violating our Community Guidelines or supplementary policies.</li>
        </ul>
        <h4>4.3 Eligibility Review Process</h4>
        <p>We reserve the right to review, approve, reject, or remove any Listing at our sole discretion. Our review does not constitute an endorsement, inspection, or guarantee.</p>

        <h3>5. Intellectual Property</h3>
        <p>All content, design, logos, trademarks, and software associated with the Platform are the exclusive property of {BRAND} or its licensors. Merchants retain ownership of uploaded content but grant {BRAND} a non-exclusive, worldwide, royalty-free license to use, display, reproduce, and distribute such content for operating and promoting the Platform.</p>

        <h3>6. Privacy and Data Protection</h3>
        <p>Our collection, use, and protection of personal data are governed by our Privacy Policy, incorporated into these Terms by reference.</p>

        <h3>7. Limitation of Liability</h3>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</p>
        <ol>
          <li>The Platform shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</li>
          <li>Our total aggregate liability shall not exceed the total fees paid by you in the twelve (12) months preceding the claim.</li>
          <li>We are not liable for any losses resulting from product defects, misrepresentation by Merchants, shipping delays, or other Transaction issues.</li>
          <li>The Platform is provided on an "AS IS" and "AS AVAILABLE" basis.</li>
        </ol>

        <h3>8. Indemnification</h3>
        <p>You agree to indemnify, defend, and hold harmless {BRAND}, its affiliates, officers, directors, employees, and agents from claims arising from your use of the Platform, your Listings or Transactions, your violation of any law, or any dispute with another user.</p>

        <h3>9. Dispute Resolution</h3>
        <h4>9.1 Between Users</h4>
        <p>Customers and Merchants are encouraged to resolve disputes directly. The Platform may, at its sole discretion, provide mediation assistance.</p>
        <h4>9.2 With the Platform</h4>
        <p>Disputes shall first be addressed through informal negotiation. Unresolved disputes after thirty (30) days may proceed to binding arbitration.</p>

        <h3>10. Governing Law</h3>
        <p>These Terms shall be governed by the laws of the Arab Republic of Egypt. Legal proceedings shall be brought exclusively in the courts of Cairo, Egypt.</p>

        <h3>11. Modifications to Terms</h3>
        <p>We reserve the right to modify these Terms at any time. Material changes will be communicated at least thirty (30) days before they take effect. Continued use constitutes acceptance.</p>

        <h3>12. Termination</h3>
        <p>We may suspend or terminate your access to the Platform at any time for conduct that violates these Terms. Sections that by their nature should survive termination shall survive.</p>

        <h2>Part II: Customer Policy</h2>
        <h3>13. Customer Rights and Obligations</h3>
        <h4>13.1 Purchasing on the Platform</h4>
        <p>When you place an order, you enter into a direct Transaction with the Merchant, not with the Platform. You agree to:</p>
        <ol>
          <li>Review all Listing details before purchasing.</li>
          <li>Provide accurate shipping and contact information.</li>
          <li>Pay the full purchase price plus any applicable fees at the time of purchase.</li>
          <li>Comply with any Merchant-specific terms.</li>
        </ol>
        <h4>13.2 Payment Terms</h4>
        <p>Payments are processed through our approved payment methods (currently cash on delivery within Dar Misr Al-Andalus). Prices are set by the respective Merchant and may change without notice.</p>
        <h4>13.3 Shipping and Delivery</h4>
        <p>Delivery is currently limited to Dar Misr Al-Andalus compound. Shipping is the responsibility of the Merchant. Delivery time estimates are approximations only.</p>
        <h4>13.4 Returns and Refunds</h4>
        <p>Return and refund policies are set individually by each Merchant. Customers are responsible for reviewing the applicable policy before purchasing.</p>
        <blockquote>REMINDER: Each Merchant sets their own return and refund policy. Always review before purchasing.</blockquote>
        <h4>13.5 Product Reviews and Ratings</h4>
        <p>Reviews must be honest, accurate, and based on genuine experience. We may remove fraudulent, abusive, or defamatory reviews.</p>
        <h4>13.6 Customer Responsibilities</h4>
        <ul>
          <li>Use the Platform only for lawful purposes.</li>
          <li>Refrain from fraudulent activity, including false claims or chargebacks.</li>
          <li>Treat Merchants and other users with respect.</li>
          <li>Report any suspected counterfeit, illegal, or prohibited items immediately.</li>
          <li>Keep your account credentials secure.</li>
        </ul>
        <h4>13.7 Customer Protections</h4>
        <ul>
          <li>Eligibility screening of all Listings.</li>
          <li>Dispute assistance and mediation support.</li>
          <li>Fraud detection systems.</li>
          <li>Secure payment processing.</li>
          <li>Easy reporting tools for prohibited items or safety concerns.</li>
        </ul>

        <h2>Part III: Merchant Policy</h2>
        <h3>14. Merchant Rights and Obligations</h3>
        <h4>14.1 Merchant Registration and Verification</h4>
        <p>To sell on the Platform, you must complete our Merchant registration and verification process. We reserve the right to reject any application at our sole discretion.</p>
        <h4>14.2 Listing Requirements</h4>
        <ol>
          <li>Provide accurate, complete, and truthful product descriptions.</li>
          <li>Upload clear, high-quality images representing the product.</li>
          <li>Set fair and transparent pricing including any mandatory charges.</li>
          <li>Clearly state return, refund, and exchange policies.</li>
          <li>Ensure all items comply with our Item Eligibility Policy and applicable laws.</li>
          <li>Maintain accurate stock levels and update Listings promptly.</li>
        </ol>
        <h4>14.3 Merchant Responsibilities</h4>
        <ul>
          <li>The quality, safety, legality, and authenticity of all products.</li>
          <li>Accurate representation of products in Listings.</li>
          <li>Timely processing, packaging, and delivery of orders.</li>
          <li>Responsive and professional customer service.</li>
          <li>Compliance with all consumer protection laws.</li>
          <li>Handling returns, refunds, and exchanges per stated policies.</li>
          <li>Payment of all applicable taxes and fees.</li>
          <li>Maintaining all required licenses and permits.</li>
        </ul>
        <h4>14.4 Platform Fees and Payouts</h4>
        <p>{BRAND} is currently free to use for Merchants at launch. Future fees (commission, listing, payment processing, or subscription) will be communicated with at least thirty (30) days' notice.</p>
        <h4>14.5 Prohibited Merchant Conduct</h4>
        <ul>
          <li>Listing counterfeit, illegal, or prohibited items.</li>
          <li>Price manipulation or artificially inflating reviews.</li>
          <li>Circumventing the Platform by directing Customers off-platform.</li>
          <li>Using the Platform to collect Customer data for unrelated purposes.</li>
          <li>Misrepresenting product origin, condition, or characteristics.</li>
          <li>Engaging in discriminatory practices.</li>
          <li>Violating any applicable law or third-party right.</li>
        </ul>
        <h4>14.6 Merchant Account Suspension and Termination</h4>
        <p>We may suspend or terminate Merchant accounts for repeated violations, excessive complaints, fraudulent activity, failure to respond to Customers, or failure to fulfill orders.</p>
        <h4>14.7 Merchant Indemnification</h4>
        <p>Merchants specifically agree to indemnify {BRAND} from claims arising from product liability, IP infringement, tax liability, regulatory non-compliance, or any other claims related to their products.</p>

        <h2>Part IV: General Provisions</h2>
        <h3>15. Communication and Notices</h3>
        <p>Notices will be sent via the contact channels associated with your account or through in-app notifications. Keep your contact information up to date.</p>
        <h3>16. Force Majeure</h3>
        <p>We are not liable for delays caused by circumstances beyond our reasonable control, including natural disasters, pandemics, war, government actions, internet failures, or cyberattacks.</p>
        <h3>17. Severability</h3>
        <p>If any provision is found invalid, the remaining provisions shall continue in full force and effect.</p>
        <h3>18. Entire Agreement</h3>
        <p>These Terms, together with the Privacy Policy, constitute the entire agreement between you and {BRAND}.</p>
        <h3>19. Waiver</h3>
        <p>Failure to enforce any provision shall not constitute a waiver of such provision.</p>
        <h3>20. Assignment</h3>
        <p>You may not assign your rights without our consent. We may assign these Terms without restriction.</p>

        <h3>21. Contact Information</h3>
        <p>If you have any questions, concerns, or complaints regarding these Terms or the Platform, please contact us:</p>
        <p>
          <strong>{BRAND}</strong><br />
          Customer Service: <a href={`tel:${PHONE}`}>{PHONE}</a><br />
          Address: Dar Misr Al-Andalus, 5th Settlement, New Cairo, Egypt
        </p>
        <p><strong>BY USING THE PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND CONDITIONS.</strong></p>
      </article>
    </main>
    <Footer />
  </div>
);

export default Terms;
