# Loyalty Card

A digital stamp card for a single café: customers collect stamps toward a free
item by showing a QR code (or code) to staff, who scan it from `/staff` after
entering a shop PIN. Shop name, stamps-required, and the staff PIN are
configured from `/setup`.

Built with Next.js (App Router) and a Supabase Postgres backend — all card
and shop state lives server-side, so a customer's phone and the staff
tablet/register always see the same data.

## Deploying

This app runs as one Next.js deployment (Vercel is the obvious choice) backed
by one Supabase project. It's built for a **single café per deployment** —
there's no multi-tenant signup flow. To run it for a second café, deploy a
second copy with its own Supabase project.

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
   From Project Settings → API, grab the **Project URL** and the
   **`service_role`** key (not the `anon` key — the app only ever talks to
   Supabase from the server).
2. **Run the schema.** Paste [`supabase/schema.sql`](supabase/schema.sql)
   into the Supabase SQL editor and run it. This creates the `shops` and
   `cards` tables and seeds one shop row (name "Cafe Meridian", 9 stamps,
   PIN `1234`). The script is safe to re-run.
3. **Set environment variables** (see [`.env.local.example`](.env.local.example)
   for the full list and descriptions) — locally in `.env.local`, and in
   your hosting provider's project settings for production:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — from step 1.
   - `STAFF_SESSION_SECRET` — any random string (`openssl rand -hex 32`).
     Signs the staff login cookie; changing it logs out all staff sessions.
   - `NEXT_PUBLIC_APP_URL` — the deployment's own URL, no trailing slash
     (e.g. `https://your-cafe.vercel.app`). Used to build the unsubscribe
     link in reminder emails.
   - `RESEND_API_KEY` — optional. Without it, the app still works; it just
     skips sending the "1 stamp away" reminder email (logs a warning
     instead of failing).
4. **Deploy** (`vercel deploy` or connect the repo in the Vercel dashboard).
5. Go through the [pre-launch checklist](#pre-launch-checklist) below before
   handing it to the café.

### Local development

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project's values
npm run dev
```

## Pre-launch checklist

- [ ] Change the staff PIN from the seeded `1234` — visit `/setup`, unlock
      with `1234`, set a new one.
- [ ] Set the real shop name and stamps-required on the same `/setup` page.
- [ ] If you'll be sending reminder emails to real customers in the US, add
      your business's physical mailing address to the email footer in
      [`src/lib/email.ts`](src/lib/email.ts) — CAN-SPAM requires it, and it
      isn't something the app can infer, so it's left as a manual edit.
- [ ] Point an uptime monitor (UptimeRobot, Vercel's own, etc.) at
      `GET /api/health` — returns `200` when the app can reach the
      database, `503` otherwise.

## Day-2 operations

- **Forgot the staff PIN?** There's no self-service recovery flow. Reset it
  directly in the Supabase SQL editor:
  ```sql
  update shops set staff_pin = 'NEW-PIN', failed_pin_attempts = 0, pin_locked_until = null;
  ```
- **Staff PIN lockout.** After 5 wrong PIN attempts in a row, `/staff` locks
  out further attempts for 5 minutes (even with the correct PIN) — protects
  against someone guessing a 4-digit PIN by brute force. This resets
  automatically; no action needed unless staff are actually locked out and
  need in sooner, in which case run the SQL above.
- **A customer wants their data removed.** Their card row can be deleted
  directly in Supabase (`delete from cards where id = '...'`); the card id
  is the code printed under their QR code.

## Known limitations (by design, for this MVP)

- **Single café per deployment.** No multi-tenant signup or billing — see
  the "Scope recommendation" in this repo's plan history if that becomes a
  goal; the schema (`shop_id` on every table) was built to make that an
  additive change later, not a rewrite.
- **No PIN-recovery UI** — see [Day-2 operations](#day-2-operations) above.
- **No rate limiting on card creation** (`POST /api/cards` is public and
  unauthenticated, same trust model as the QR code itself). Low risk for a
  single small shop; would need attention before this became a public
  multi-tenant product.
- **Card identity is device-local.** A customer's card is remembered via
  their browser's storage, not an account. Clearing browser data or
  switching devices starts a new card.

## Tests

```bash
npm test
```

Covers the stamp/redemption math, the staff session cookie's HMAC
sign/verify logic, and the card progress copy — the parts of the app where a
silent regression would be worst and hardest to notice by eye.
