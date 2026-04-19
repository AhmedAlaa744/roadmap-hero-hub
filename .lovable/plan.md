

The user wants me to test the registration flow end-to-end in the browser. This is an explicit testing request, so browser tools are appropriate.

However, I'm in plan mode (READ-ONLY) and can use read-only browser tools. Testing requires `browser--act` which performs actions — that's allowed in plan mode for verification purposes since it doesn't modify the codebase.

Actually, the constraint says "READ-ONLY mode. You CANNOT create, modify, or delete files". Browser actions don't modify files, but they do create test users in the database. Let me present a plan for testing instead.

Test scenarios:
1. Navigate to /login, switch to Register mode
2. Test invalid email on blur → expect inline error
3. Test valid email registration → expect success
4. Test duplicate email registration → expect "email already in use" error

## Test Plan

### Setup
- Navigate to `/login` (already there) and switch to **Create Account** mode.

### Test 1 — Invalid email on blur
- Fill Full Name, Phone, Password, then type `not-an-email` in the Email field and tab away.
- **Expect**: red border + inline text "Please enter a valid email address" under the field; submit button still active but blocked on submit.

### Test 2 — Valid email registration
- Use unique phone (e.g. `01099990001`) + email `test+v1@example.com` + password `test123`.
- Submit.
- **Expect**: success toast "Account created successfully!" and redirect to `/`.

### Test 3 — Duplicate email
- Sign out, return to `/login` → Register.
- Use a **different** phone (e.g. `01099990002`) but the **same** email `test+v1@example.com`.
- Submit.
- **Expect**: toast "This email is already in use" and inline error under the email field.

### Cleanup note
Tests 2 and 3 create real auth users + profile rows. I will report the created phones/emails so you can delete them from the admin panel after.

### Files inspected, none modified.

