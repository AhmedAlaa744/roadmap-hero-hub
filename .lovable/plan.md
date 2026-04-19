

## Plan

### 1. Hide owner name + fix WhatsApp link in ChatBot
**File:** `src/components/ChatBot.tsx`

- Remove all references to "Ahmed" / "احمد" / "أحمد" — both in keyword matching and in response text.
- Replace the `OWNER_NAME` constant usage with a neutral label: **"Customer Service"** (EN) / **"خدمة العملاء"** (AR).
- Keep the number `01116895960` and WhatsApp link.
- **Fix the WhatsApp link**: `wa.me` requires the country code with no `+` and no leading `0`. Egypt = `20`, so the local number `01116895960` becomes `201116895960`. Current value `https://wa.me/201116895960` is already correctly formatted, but the issue is likely:
  - the link may be opened from a context that strips it, OR
  - `wa.me` redirects to `api.whatsapp.com` which requires a non-empty `text` param to open the chat reliably on desktop.
  - **Fix**: switch to `https://api.whatsapp.com/send?phone=201116895960&text=...` with a default greeting (`"Hi, I need help with Garak"` / `"أهلاً، محتاج مساعدة في تطبيق جارك"`). This is the recommended format and works on both mobile and desktop.
- Update the response copy so it reads naturally without the owner's name, e.g.:  
  EN: *"Need more help? Contact our customer service at 01116895960 — Chat with us on WhatsApp"*  
  AR: *"محتاج مساعدة إضافية؟ تواصل مع خدمة العملاء على 01116895960 — كلّمنا على واتساب"*
- Remove the keyword triggers `owner / ahmed / أحمد / احمد`; keep `whatsapp / واتس / contact / تواصل`.
- Quick action label changes from "Contact owner on WhatsApp" → **"Contact customer service on WhatsApp"** / **"تواصل مع خدمة العملاء على واتساب"**.

### 2. Add Terms / Privacy / Help pages
**New routes**, all linked from `Footer.tsx`:

- `/terms` → `src/pages/Terms.tsx` — full content from the uploaded `Marketplace_Terms_and_Conditions.docx`, with all `[Your Marketplace Name]` placeholders replaced by **"Garak — Dar Misr Al-Andalus"** and `[Your Phone Number]` replaced by **01116895960**. Render as a clean, scrollable typography page (Tailwind `prose` with `max-w-3xl`, headings, lists, callouts).
- `/privacy` → `src/pages/Privacy.tsx` — short, project-specific privacy policy covering: what data we collect (phone, optional email, address, orders), how we use it, that it's stored on Lovable Cloud / Supabase, no third-party sale, contact for data requests via 01116895960.
- `/help` → `src/pages/Help.tsx` — Help Center with FAQ accordion sections: How to order, Delivery zone (Dar Misr Al-Andalus only, COD), Become a merchant, Manage products (edit / pause / activate / delete), Stock & availability, Account & login, Contact customer service (number + WhatsApp button using same `api.whatsapp.com` URL).

### 3. Footer wiring
**File:** `src/components/Footer.tsx`

- Replace the three `<a href="#">` placeholders with `<Link>` to `/help`, `/terms`, `/privacy`.

### 4. Routing
**File:** `src/App.tsx`

- Register the three new routes.

### Files to touch
- `src/components/ChatBot.tsx` — drop owner name, switch to `api.whatsapp.com/send?phone=...&text=...`, update copy + quick action
- `src/components/Footer.tsx` — wire support links
- `src/App.tsx` — add 3 routes
- `src/pages/Terms.tsx` — new (T&C content from uploaded doc)
- `src/pages/Privacy.tsx` — new
- `src/pages/Help.tsx` — new

### Out of scope
- Email-based support, contact form, ticketing changes — existing `support_tickets` flow remains.
- Auth / DB schema — no changes.

