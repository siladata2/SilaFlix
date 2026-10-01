# Admin login setup — sila22

`/admin-login` lets staff sign in with a short **username** (e.g. `sila22`)
instead of typing a full email. Under the hood it's still real Supabase Auth —
the username is just converted to an email address
(`sila22@silaflix.app` by default — change the domain via
`NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN` in your env vars) before signing in. This
keeps everything working through the same secure, RLS-backed auth system as
every other account — nothing is hardcoded or bypassed.

**I can't create this account for you** — I have no access to your live
Supabase project. Do this once, yourself, directly in Supabase:

## 1. Create the auth user
Supabase Dashboard → **Authentication → Users → Add user**:
- Email: `sila22@silaflix.app` (must match `NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN`
  in your deployed env vars — it does not need to be a real inbox, it's
  only ever used to sign in)
- Password: **see the warning below before you type `sila`**
- Tick **Auto Confirm User** (so it doesn't wait on an email that address
  will never receive)

## 2. ⚠️ About the password "sila"
Supabase's default minimum password length is **6 characters**. `sila` is
4 — the dashboard (and any sign-up flow) will likely reject it as-is. Two
options, your call:
- **Safer, still simple**: use something like `sila2026` or `silaAdmin1`
  instead — five extra keystrokes for a real admin account guarding your
  whole content library is a good trade.
- **Exactly `sila`**: lower the minimum in Supabase Dashboard →
  **Authentication → Providers → Email → Minimum password length**. This
  weakens the rule for *every* account on the project, not just this one,
  so I'd only do this on a project nobody else can sign up to yet.

## 3. Promote the account to admin
Copy the new user's UUID from the Users list, then run in the SQL editor:
```sql
update profiles
set role = 'super_admin', username = 'sila22', display_name = 'Sila Admin'
where user_id = '<paste-the-uuid-here>';
```
(The row already exists — it was created automatically by the
`handle_new_user` trigger the moment the auth user was created.)

## 4. Sign in
Go to `/admin-login`, username `sila22`, the password you set in step 1.

## 5. Regular users are unaffected
Everyone else still signs in with their real email at `/login` — this
username shortcut only applies at `/admin-login`. A regular account can
never reach `/admin` even by URL — `src/lib/auth.ts`'s `requireRole()`
checks the real `profiles.role` column server-side and RLS enforces the
same thing underneath at the database level.
