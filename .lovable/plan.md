
The user wants 4 things on the Login page and ChatBot:

1. **Show/hide password toggle** on login page (eye icon)
2. **Optional email field** during registration
3. **Update ChatBot** knowledge with recent site updates (merchant editing, pause/activate, secure checkout, etc.)
4. **ChatBot owner contact**: recommend contacting Ahmed at `01116895960` and include a WhatsApp link `https://wa.me/201116895960` for any WhatsApp-related item

Let me confirm my read of the current code (already in context):
- `src/pages/Login.tsx` — has phone + password fields, no email, no show-password toggle
- `src/components/ChatBot.tsx` — has hardcoded bilingual responses, no owner contact, no WhatsApp link

Database note: `profiles` table currently stores `full_name`, `phone`, `avatar_url`. To store optional email, I'll need to add an `email` column. I'll add it as nullable so existing users aren't affected, and pass it through `signUp` user metadata so the existing profile-creation trigger picks it up (or update the profile right after signup if the trigger doesn't handle email).

## Plan

### 1. Login page — show/hide password
- Add an eye / eye-off icon button inside the password input (right side).
- Toggle `type` between `password` and `text` via local state.
- Apply to both Sign In and Register forms (single password field, so one toggle).

### 2. Login page — optional email on register
- Add an `Email (optional)` input, shown only when `isRegister` is true.
- Validate format only when filled (zod-style minimal check).
- Pass email into `signUp` metadata; update the profile row with email after signup.

### 3. Database — add email to profiles
- New migration: `ALTER TABLE public.profiles ADD COLUMN email text;`
- Update the existing `handle_new_user` trigger to also persist `email` from `raw_user_meta_data` if present.

### 4. ChatBot updates
Refresh the bilingual response logic with current site reality:
- **Ordering**: cash on delivery, secure server-side checkout, delivery inside Dar Misr Al-Andalus.
- **Selling**: register as merchant, dashboard supports add / edit price & stock / pause-activate / delete.
- **Account help**: mention show-password and optional email on login page.
- **Owner contact (NEW)**: For anything the bot can't resolve, recommend contacting **Ahmed — 01116895960**, and render a WhatsApp link:  
  `<a href="https://wa.me/201116895960" target="_blank" rel="noopener noreferrer">Chat with us on WhatsApp</a>`
- Update message rendering: switch from plain text to safe rendering of the WhatsApp link only (whitelisted), so the anchor actually becomes clickable. Use a tiny renderer that splits on a placeholder like `{{wa}}` and injects an `<a>` element — no `dangerouslySetInnerHTML`, no markdown lib.
- Add a new quick action: **"📱 Contact owner on WhatsApp"** that opens `https://wa.me/201116895960` in a new tab.
- Any time a user mentions "whatsapp" / "واتس", reply with the WhatsApp link + Ahmed's number.

### Files to edit
- `src/pages/Login.tsx` — show-password toggle, optional email field, pass email to signUp
- `src/contexts/AuthContext.tsx` — accept optional email in `signUp`, write to profile after insert
- `src/components/ChatBot.tsx` — refreshed responses, WhatsApp quick action, safe link renderer
- New SQL migration — add `email` column to `profiles`, update trigger

### Technical notes
- Phone-to-email synthetic login (`{phone}@garak.eg`) stays unchanged — the new optional email is just contact info stored on the profile, NOT used for auth.
- WhatsApp number normalized to international format: `201116895960` (Egypt country code 20, drop leading 0).
- Keep all RLS rules intact; `profiles` already restricts to owner.
