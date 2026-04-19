import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle } from "lucide-react";

const PHONE = "01116895960";
const WHATSAPP_URL = `https://api.whatsapp.com/send?phone=201116895960&text=${encodeURIComponent(
  "Hi, I need help with Garak"
)}`;

const Help = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-foreground mb-2">Help Center</h1>
          <p className="text-muted-foreground">
            Find answers to common questions about Garak — your neighbor marketplace.
          </p>
        </header>

        <Accordion type="single" collapsible className="w-full mb-10">
          <AccordionItem value="order">
            <AccordionTrigger>🛒 How do I place an order?</AccordionTrigger>
            <AccordionContent>
              Browse products, add what you want to your cart, then click Checkout. Enter your address inside Dar Misr Al-Andalus compound (building, floor, apartment) and confirm. Payment is cash on delivery.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="delivery">
            <AccordionTrigger>🚚 What is the delivery zone?</AccordionTrigger>
            <AccordionContent>
              Garak currently delivers <strong>only inside Dar Misr Al-Andalus compound</strong> in 5th Settlement, New Cairo. Delivery is free on most orders. Payment is cash on delivery (COD).
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="seller">
            <AccordionTrigger>🏪 How do I become a seller?</AccordionTrigger>
            <AccordionContent>
              Create an account, tick "I want to sell products," and fill in your business details (name, type, phone). Our team will review your application and get back to you. Once approved, you can start adding products from your Merchant Dashboard.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="manage">
            <AccordionTrigger>✏️ How do I manage my products?</AccordionTrigger>
            <AccordionContent>
              From your Merchant Dashboard you can:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Edit a product's price, stock, description, and images.</li>
                <li><strong>Pause</strong> a product to temporarily hide it without deleting.</li>
                <li><strong>Reactivate</strong> a paused product anytime.</li>
                <li><strong>Delete</strong> a product permanently if it has no past orders.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="stock">
            <AccordionTrigger>📦 How does stock work?</AccordionTrigger>
            <AccordionContent>
              Each merchant sets a stock quantity per product. Customers cannot order more than the available stock. When an order is placed, the stock is automatically decreased. If stock reaches zero, the product is shown as "Out of Stock" until the merchant restocks.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="account">
            <AccordionTrigger>🔒 Account & login help</AccordionTrigger>
            <AccordionContent>
              You log in with your phone number and password. On the login page you can show/hide your password using the eye icon. Adding an email is optional but helps us send you order updates. If you forgot your password, contact customer service.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="contact">
            <AccordionTrigger>📞 How do I contact customer service?</AccordionTrigger>
            <AccordionContent>
              You can reach customer service at <a href={`tel:${PHONE}`} className="text-primary underline">{PHONE}</a> or chat with us on WhatsApp using the buttons below.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Still need help?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Our customer service team is here for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <a href={`tel:${PHONE}`}>
                <Phone className="h-4 w-4 mr-2" />
                Call {PHONE}
              </a>
            </Button>
            <Button asChild>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default Help;
