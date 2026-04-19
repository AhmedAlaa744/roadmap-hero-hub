import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "bot";
  text: string;
}

const SUPPORT_PHONE_DISPLAY = "01116895960";
const WA_GREETING_EN = encodeURIComponent("Hi, I need help with Garak");
const WA_GREETING_AR = encodeURIComponent("أهلاً، محتاج مساعدة في تطبيق جارك");
const WHATSAPP_URL_EN = `https://api.whatsapp.com/send?phone=201116895960&text=${WA_GREETING_EN}`;
const WHATSAPP_URL_AR = `https://api.whatsapp.com/send?phone=201116895960&text=${WA_GREETING_AR}`;
const WA_TOKEN = "{{wa}}";

const quickActions = [
  { label: "🛒 How to order?", text: "How do I place an order?" },
  { label: "🏪 Become a seller", text: "How can I become a seller?" },
  { label: "✏️ Manage my products", text: "How do I edit, pause or delete my products?" },
  { label: "🔒 Account & login help", text: "I need help with my account or login" },
  { label: "📞 Contact support", text: "I need help from support" },
  { label: "📱 Contact customer service on WhatsApp", text: "How do I contact customer service on WhatsApp?" },
];

const detectLanguage = (text: string): "ar" | "en" => {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text) ? "ar" : "en";
};

const supportLine = (lang: "ar" | "en") =>
  lang === "ar"
    ? `\n\nمحتاج مساعدة إضافية؟ تواصل مع خدمة العملاء على ${SUPPORT_PHONE_DISPLAY} — ${WA_TOKEN}.`
    : `\n\nNeed more help? Contact our customer service at ${SUPPORT_PHONE_DISPLAY} — ${WA_TOKEN}.`;

const getResponse = (text: string, lang: "ar" | "en"): string => {
  const lower = text.toLowerCase();
  const isAr = lang === "ar";

  // WhatsApp / contact support
  if (
    lower.includes("whatsapp") ||
    lower.includes("واتس") ||
    lower.includes("contact") ||
    lower.includes("تواصل") ||
    lower.includes("customer service") ||
    lower.includes("خدمة العملاء")
  ) {
    return isAr
      ? `تقدر تتواصل مع خدمة العملاء مباشرة على ${SUPPORT_PHONE_DISPLAY}. ${WA_TOKEN} 📱`
      : `You can reach our customer service directly at ${SUPPORT_PHONE_DISPLAY}. ${WA_TOKEN} 📱`;
  }

  // Ordering
  if (lower.includes("order") || lower.includes("طلب") || lower.includes("اطلب") || lower.includes("checkout")) {
    return (
      (isAr
        ? "عشان تطلب: تصفح المنتجات، ضيف اللي عايزه للسلة، وبعدين اضغط Checkout. هتدخل عنوانك جوه كمبوند دار مصر الأندلس والدفع كاش عند الاستلام. الطلب بيتسجل بشكل آمن من السيرفر مباشرة. 🛒"
        : "To order: browse products, add to cart, then click Checkout. Enter your address inside Dar Misr Al-Andalus compound and pay cash on delivery. Orders are placed securely on the server. 🛒") +
      supportLine(lang)
    );
  }

  // Becoming a seller
  if (
    lower.includes("seller") ||
    lower.includes("sell") ||
    lower.includes("merchant") ||
    lower.includes("بائع") ||
    lower.includes("بيع") ||
    lower.includes("تاجر")
  ) {
    return (
      (isAr
        ? "عشان تبقى بائع: سجل حساب جديد واختار 'I want to sell products'، واملا بيانات نشاطك. هنراجع الطلب ونرد عليك. 🏪"
        : "To become a seller: create an account, tick 'I want to sell products', and fill in your business details. We'll review your application and get back to you. 🏪") +
      supportLine(lang)
    );
  }

  // Managing products
  if (
    lower.includes("edit") ||
    lower.includes("price") ||
    lower.includes("stock") ||
    lower.includes("pause") ||
    lower.includes("activate") ||
    lower.includes("delete") ||
    lower.includes("سعر") ||
    lower.includes("مخزون") ||
    lower.includes("ايقاف") ||
    lower.includes("إيقاف") ||
    lower.includes("تفعيل") ||
    lower.includes("حذف") ||
    lower.includes("منتج")
  ) {
    return (
      (isAr
        ? "من Merchant Dashboard تقدر: تعدّل السعر والمخزون، توقف المنتج مؤقتًا (Pause) من غير حذف، تفعّله تاني، أو تحذفه نهائيًا لو مفيش طلبات عليه. ✏️"
        : "From your Merchant Dashboard you can: edit price and stock, pause a product (without deleting it), reactivate it, or delete it permanently if it has no past orders. ✏️") +
      supportLine(lang)
    );
  }

  // Account / login
  if (
    lower.includes("account") ||
    lower.includes("login") ||
    lower.includes("sign in") ||
    lower.includes("password") ||
    lower.includes("email") ||
    lower.includes("حساب") ||
    lower.includes("تسجيل") ||
    lower.includes("دخول") ||
    lower.includes("كلمة السر") ||
    lower.includes("ايميل") ||
    lower.includes("إيميل")
  ) {
    return (
      (isAr
        ? "في صفحة تسجيل الدخول تقدر تظهر/تخفي كلمة السر بزرار العين 👁️، وعند إنشاء حساب جديد تقدر تضيف الإيميل (اختياري) عشان نبعتلك تحديثات الطلبات. 🔒"
        : "On the login page you can show/hide your password with the eye icon 👁️, and when creating a new account you can add an email (optional) so we can send you order updates. 🔒") +
      supportLine(lang)
    );
  }

  // Support / help / ticket
  if (
    lower.includes("support") ||
    lower.includes("help") ||
    lower.includes("ticket") ||
    lower.includes("مساعدة") ||
    lower.includes("دعم") ||
    lower.includes("تذكرة")
  ) {
    return (
      (isAr
        ? "أنا هنا أساعدك! اكتب 'create ticket' أو 'تذكرة' وهسجلك تذكرة دعم لفريقنا. 💬"
        : "I'm here to help! Type 'create ticket' and I'll open a support ticket for our team. 💬") + supportLine(lang)
    );
  }

  // Delivery
  if (lower.includes("delivery") || lower.includes("توصيل") || lower.includes("شحن")) {
    return (
      (isAr
        ? "التوصيل متاح داخل كمبوند دار مصر الأندلس فقط، والتوصيل مجاني على معظم الطلبات. 🚚"
        : "Delivery is available only within Dar Misr Al-Andalus compound — free on most orders. 🚚") + supportLine(lang)
    );
  }

  // Default
  return (
    (isAr
      ? "أهلاً! أنا مساعد جارك. ممكن أساعدك في الطلبات، البيع، إدارة منتجاتك، أو الحساب. اكتب سؤالك! 😊"
      : "Hi there! I'm the Garak assistant. I can help you with orders, selling, managing your products, or your account. Just ask! 😊") +
    supportLine(lang)
  );
};

// Safe renderer: only injects the WhatsApp <a> at the {{wa}} token. No HTML parsing.
const renderMessage = (text: string, lang: "ar" | "en") => {
  const linkLabel = lang === "ar" ? "كلّمنا على واتساب" : "Chat with us on WhatsApp";
  const href = lang === "ar" ? WHATSAPP_URL_AR : WHATSAPP_URL_EN;
  const parts = text.split(WA_TOKEN);
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline font-medium"
        >
          {linkLabel}
        </a>
      )}
    </span>
  ));
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const lang = detectLanguage(text);
    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const lower = text.toLowerCase();
    if ((lower.includes("create ticket") || lower.includes("تذكرة")) && !isSubmittingTicket) {
      setIsSubmittingTicket(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            lang === "ar"
              ? "تمام! اكتب موضوع المشكلة وتفاصيلها وهبعتها لفريق الدعم."
              : "Sure! Please describe your issue and I'll submit a support ticket for you.",
        },
      ]);
      return;
    }

    if (isSubmittingTicket && user) {
      supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: text.slice(0, 100),
          message: text,
        })
        .then(({ error }) => {
          if (error) {
            setMessages((prev) => [
              ...prev,
              { role: "bot", text: "Sorry, couldn't create the ticket. Please try again." },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                role: "bot",
                text:
                  lang === "ar"
                    ? `تم إنشاء تذكرة الدعم بنجاح! ✅ فريقنا هيتواصل معاك قريب. لو مستعجل تواصل مع خدمة العملاء على ${SUPPORT_PHONE_DISPLAY} — ${WA_TOKEN}.`
                    : `Support ticket created successfully! ✅ Our team will reach out soon. For urgent issues contact customer service at ${SUPPORT_PHONE_DISPLAY} — ${WA_TOKEN}.`,
              },
            ]);
            toast.success("Support ticket created");
          }
          setIsSubmittingTicket(false);
        });
      return;
    }

    setTimeout(() => {
      const response = getResponse(text, lang);
      setMessages((prev) => [...prev, { role: "bot", text: response }]);
    }, 400);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-card shadow-2xl flex flex-col"
          style={{ height: "520px" }}
        >
          {/* Header */}
          <div className="rounded-t-2xl bg-primary p-4">
            <h3 className="font-bold text-primary-foreground">مساعد جارك • Garak Assistant</h3>
            <p className="text-xs text-primary-foreground/70">Ask me anything about Garak!</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  أهلاً! كيف أقدر أساعدك؟
                  <br />
                  How can I help you?
                </p>
                {quickActions.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => {
                      if (qa.label.startsWith("📱")) {
                        window.open(WHATSAPP_URL_EN, "_blank", "noopener,noreferrer");
                      }
                      sendMessage(qa.text);
                    }}
                    className="block w-full text-left rounded-lg border border-border p-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg, i) => {
              const lang = detectLanguage(msg.text);
              return (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.role === "bot" ? renderMessage(msg.text, lang) : msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="icon" onClick={() => sendMessage(input)} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
