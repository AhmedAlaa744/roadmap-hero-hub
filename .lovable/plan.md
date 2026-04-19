
The user wants me to fix and secure the website and data. They are currently viewing the Security view, so this is about addressing security findings.

Let me check the security scan results and the current state of the database to understand what needs fixing.
<lov-tool-use id="toolu_vrtx_01U9XaN1Do189hEfkGLBKcdo" name="security--get_scan_results" integration-id="security" data="">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01GyQB2VsXZQgNwaf5aqUmh1" name="security--get_scan_results" integration-id="security" data="{\"force\": true}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01GjEMPfhTu2gNvgc7qbsZjh" name="supabase--linter" integration-id="supabase" data="">
</lov-tool-use>
<lov-plan>
Security hardening plan to fix all scanner findings.

## Issues to fix

1. **Profiles publicly readable (ERROR)** — Anyone can read all users' full names and phone numbers.
2. **Product-images storage wide open (ERROR)** — Any logged-in user can upload/overwrite/delete any product image.
3. **Stores phone publicly visible (WARN)** — Store phone numbers exposed to unauthenticated visitors.
4. **Public bucket allows listing (WARN)** — Anyone can list every file in `product-images`.
5. **user_roles privilege escalation risk (WARN)** — No explicit INSERT deny policy for non-admins.

## Migration plan

**Profiles table**
- Drop `Profiles viewable by everyone` policy.
- Add `Users can view own profile` (`auth.uid() = user_id`).
- Add `Admins can view all profiles` (`has_role(auth.uid(), 'admin')`).
- Create `public.profiles_public` view (security_invoker) exposing only `user_id`, `full_name`, `avatar_url` — used where merchant/customer display name is needed publicly (e.g., reviews).

**Stores table**
- Drop existing public SELECT policy.
- Add `Active stores public view` (no phone exposure) via view `public.stores_public` (security_invoker) selecting `id, owner_id, name_en, name_ar, description_en, description_ar, logo_url, is_active`.
- Restrict base table SELECT to: owner, admins, and customers who have an order from this store (so checkout still works). Update frontend reads to use `stores_public`.

**user_roles table**
- Add explicit `Deny user inserts` policy: `INSERT WITH CHECK (false)` for non-admins (admin ALL policy already covers admins).

**Storage: product-images bucket**
- Drop existing INSERT/UPDATE/DELETE policies.
- Replace with policies that require the file path's first segment to equal a `store_id` owned by `auth.uid()` (path convention: `{store_id}/{filename}`).
- Restrict SELECT/listing: keep public read for individual objects (needed to display images), but block listing by adding a policy that requires authentication for list operations OR change bucket to private + serve via signed URLs. Simpler fix: keep bucket public for object reads; the listing warning is acceptable if we accept that filenames are guessable. **Decision needed below.**

## Frontend updates

- `MerchantDashboard.tsx` — when uploading product images, prefix path with `${store.id}/`.
- `Header.tsx`, `AdminPanel.tsx`, anywhere that reads `profiles` for other users' data — switch to `profiles_public` view (Admin panel still uses base `profiles` since admins keep access).
- Anywhere reading `stores` for public listing (Browse, ProductDetail) — switch to `stores_public` view.

## Question for the user

Storage bucket strategy:

1. **Keep public, just lock writes** — fastest, image URLs stay simple, `product-images` listing warning remains (low risk).
2. **Make bucket private, use signed URLs** — fully closes listing, but adds complexity (signed URL generation on every product display).

Recommend option 1 unless the user wants maximum lockdown.

## Files to edit

- New SQL migration (policies + views)
- `src/pages/MerchantDashboard.tsx` (image upload path + read from `stores_public` if applicable)
- `src/pages/Browse.tsx`, `src/pages/ProductDetail.tsx` (read stores via `stores_public`)
- `src/contexts/AuthContext.tsx` (already uses own `user_id` — no change)
- `src/components/Header.tsx` (no change — reads own profile)

After approval, I'll run the migration and code edits in one pass.
