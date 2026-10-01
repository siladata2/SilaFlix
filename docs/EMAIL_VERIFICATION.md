# Testing signup + email verification

To test the real signup/verification flow with your own inbox
(`silatrix22@gmail.com`):

1. Go to `/register` and sign up with `silatrix22@gmail.com`.
2. Supabase sends a confirmation email automatically — **no code change
   needed for this to work**, it's a Supabase project setting.
3. Check that inbox (and the spam folder — Supabase's default sender
   frequently lands there, see note below).
4. Click the link → lands on `/verify-email` → account is confirmed →
   sign in normally at `/login`.

## If the email never arrives
Supabase's **built-in** email sender (used automatically until you
configure your own) is meant for testing only:
- Low sending limits (a handful of emails per hour on the free tier)
- Frequently filtered as spam by Gmail specifically
- Shared reputation across all Supabase projects using the default sender

For reliable delivery — to Gmail addresses especially — configure a real
SMTP provider: Supabase Dashboard → **Authentication → Settings → SMTP
Settings** (Resend, Postmark, SendGrid, or Gmail's own SMTP for testing all
work). Until that's configured, treat missed/delayed/spam-filtered
confirmation emails as expected on the default sender, not a bug in this
codebase.

## Manually confirming an account (skip email entirely)
For your own testing, you can also confirm an account directly instead of
waiting on email: Supabase Dashboard → **Authentication → Users** → find
the user → the row shows an unconfirmed badge → use **Auto Confirm User**
retroactively is not available post-creation via the UI, but running this
in the SQL editor works:
```sql
update auth.users set email_confirmed_at = now() where email = 'silatrix22@gmail.com';
```
