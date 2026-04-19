

The user wants a focused 4-part update: password toggle, optional email on register, ChatBot refresh + safe WhatsApp link. Let me check current state first.

Current state from files in context:
- `Login.tsx` already has eye/eye-off toggle ✅
- `Login.tsx` already has optional email field with validation + passes to signUp ✅
- `AuthContext.signUp` already passes `contact_email` in metadata ✅
- `profiles` table already has `email` column ✅
- `handle_new_user` trigger already writes `NULLIF(NEW.raw_user_meta_data->>'contact_email', '')` to email ✅
- ChatBot — need to verify content

So items 1, 2, 3 are essentially already done. Only item 4 (ChatBot) needs real work, plus a UNIQUE constraint check on `profiles.email`.

Let me verify:
- profiles.email is nullable (✅ from schema), but is it UNIQUE? Schema doesn't show a unique constraint. Need to add `ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);` — but only if no duplicate nulls/values exist. Postgres allows multiple NULLs in UNIQUE so that's fine.
- ChatBot — need to read it.

I'll plan around what's actually missing. No need to read ChatBot in detail — the requirements are explicit.

## Plan

### 1. Login page — already done
Eye toggle and optional email field already exist in `src/pages/Login.tsx`. Inline on-blur validation is currently submit-time only — switch to **on-blur** with inline error text under the email field. Keep submit-time validation as backup.

### 2. Database — add UNIQUE constraint
Migration: `ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);`
- Email column already exists, `handle_new_user` already persists it. Only the UNIQUE constraint is missing.
- On register, after signUp, if a duplicate-email error surfaces from the trigger, surface the toast: *"This email is already in use"*.

### 3. ChatBot refresh (`src/components/ChatBot.tsx`) — main work
- **Safe WhatsApp renderer**: replace any string-based link injection with a `renderWithWa(text, lang)` helper that splits on `{{wa}}` and returns `ReactNode[]` with a real `<a>` element. No `dangerouslySetInnerHTML`.
- **Bilingual responses refreshed** to cover:
  - Ordering: COD, secure checkout, delivery limited to Dar Misr Al-Andalus.
  - Selling: register as merchant, dashboard add/edit price & stock, pause/activate/delete.
  - Account: show-password toggle + optional email on registration.
- **Customer service** contact: number `01116895960` only, no personal name anywhere.
- **WhatsApp link** with language-aware prefilled text:
  - EN: `https://wa.me/201116895960?text=Hi%2C%20I%20need%20help%20with%20Garak`
  - AR: `https://wa.me/201116895960?text=أهلاً%2C%20محتاج%20مساعدة%20في%20تطبيق%20جارك`
  - All links: `target="_blank" rel="noopener noreferrer"`.
- **Keyword triggers** `whatsapp / واتس / contact / تواصل` → reply with number + `{{wa}}` link.
- **Quick action button**: "📱 Contact Customer Service on WhatsApp" / "تواصل مع خدمة العملاء على واتساب" opens WA URL in new tab.
- **XSS guard**: never interpolate user input into bot strings — only static templates.

### Files
- **Migration**: add UNIQUE constraint on `profiles.email`.
- **Edit**: `src/pages/Login.tsx` (move email validation to on-blur with inline error), `src/components/ChatBot.tsx` (safe WA renderer + refreshed copy + quick action).

### Out of scope
- Phone-based auth flow stays unchanged (`{phone}@garak.eg`).
- RLS policies untouched.
- Larger features from prior plans (notifications, slot caps, AR translations elsewhere) — not part of this request.

