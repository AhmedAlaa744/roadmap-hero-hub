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

const quickActions = [
  { label: "🛒 How to order?", text: "How do I place an order?" },
  { label: "🏪 Become a seller", text: "How can I become a seller?" },
  { label: "📞 Contact support", text: "I need help from support" },
  { label: "🔒 Account help", text: "I have a problem with my account" },
];

const detectLanguage = (text: string): "ar" | "en" => {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text) ? "ar" : "en";
};

const getResponse = (text: string, lang: "ar" | "en"): string => {
  const lower = text.toLowerCase();
  const isAr = lang === "ar";

  if (lower.includes("order") || lower.includes("طلب") || lower.includes("اطلب")) {
    return isAr
      ? "عشان تطلب، تصفح المنتجات وضيفها للسلة، وبعدين اعمل checkout وحط عنوانك في الكمبوند. الدفع عند الاستلام متاح! 🛒"
      : "To place an order, browse products and add them to your cart, then checkout with your compound address. Cash on delivery is available! 🛒";
  }
  if (lower.includes("sell") || lower.includes("merchant") || lower.includes("بائع") || lower.includes("اب")) {
    return isAr
      ? "عشان تبقى بائع، سجل حساب جديد واختار 'أريد بيع منتجات'. هنراجع طلبك وهنرد عليك في أقرب وقت! 🏪"
      : "To become a seller, create an account and check 'I want to sell products'. We'll review your application and get back to you soon! 🏪";
  }
  if (lower.includes("support") || lower.includes("help") || lower.includes("مساعدة") || lower.includes("دعم")) {
    return isAr
      ? "أنا هنا عشان أساعدك! لو محتاج مساعدة إضافية، اكتب 'تذكرة دعم' وهنوصلك بفريقنا. 💬"
      : "I'm here to help! If you need further assistance, type 'create ticket' and we'll connect you with our team. 💬";
  }
  if (lower.includes("ticket") || lower.includes("تذكرة")) {
    return isAr
      ? "عشان أعملك تذكرة دعم، اكتب مشكلتك وهبعتها لفريق الدعم. 📝"
      : "To create a support ticket, describe your issue and I'll submit it for you. 📝";
  }
  if (lower.includes("delivery") || lower.includes("توصيل")) {
    return isAr
      ? "التوصيل متاح داخل كمبوند دار مصر الأندلس. التوصيل مجاني على معظم الطلبات! 🚚"
      : "Delivery is available within Dar Misr Al-Andalus compound. Free delivery on most orders! 🚚";
  }

  return isAr
    ? "أهلاً! أنا مساعد جارك. ممكن أساعدك في الطلبات، البيع، أو أي سؤال تاني. اكتب سؤالك! 😊"
    : "Hi there! I'm the Garak assistant. I can help you with orders, selling, or any other questions. Just ask! 😊";
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

    // Check if user wants to create a ticket
    const lower = text.toLowerCase();
    if ((lower.includes("create ticket") || lower.includes("تذكرة")) && !isSubmittingTicket) {
      setIsSubmittingTicket(true);
      setMessages((prev) => [...prev, {
        role: "bot",
        text: lang === "ar"
          ? "تمام! اكتب موضوع المشكلة وتفاصيلها وهبعتها لفريق الدعم."
          : "Sure! Please describe your issue and I'll submit a support ticket for you."
      }]);
      return;
    }

    if (isSubmittingTicket && user) {
      supabase.from("support_tickets").insert({
        user_id: user.id,
        subject: text.slice(0, 100),
        message: text,
      }).then(({ error }) => {
        if (error) {
          setMessages((prev) => [...prev, { role: "bot", text: "Sorry, couldn't create the ticket. Please try again." }]);
        } else {
          setMessages((prev) => [...prev, {
            role: "bot",
            text: lang === "ar"
              ? "تم إنشاء تذكرة الدعم بنجاح! ✅ فريقنا هيتواصل معاك قريب."
              : "Support ticket created successfully! ✅ Our team will reach out to you soon."
          }]);
          toast.success("Support ticket created");
        }
        setIsSubmittingTicket(false);
      });
      return;
    }

    setTimeout(() => {
      const response = getResponse(text, lang);
      setMessages((prev) => [...prev, { role: "bot", text: response }]);
    }, 500);
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
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-card shadow-2xl flex flex-col" style={{ height: "480px" }}>
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
                  أهلاً! كيف أقدر أساعدك؟<br />How can I help you?
                </p>
                {quickActions.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => sendMessage(qa.text)}
                    className="block w-full text-left rounded-lg border border-border p-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
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
