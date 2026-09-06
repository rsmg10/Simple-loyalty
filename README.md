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

### Custom domain

Most cafés will want their own domain (e.g. `loyalty.mycafe.com`) instead of
the default `*.vercel.app` URL:

1. In the Vercel project, go to **Settings → Domains** and add the domain.
2. Vercel will give you a DNS record to create (usually a **CNAME** pointing
   a subdomain like `loyalty` at `cname.vercel-dns.com`, or an **A** record
   if you're using a bare apex domain). Add that record at your domain
   registrar.
3. Once the domain verifies, update `NEXT_PUBLIC_APP_URL` to the new custom
   domain (e.g. `https://loyalty.mycafe.com`) and redeploy — it's used to
   build absolute links such as the unsubscribe link in reminder emails and
   the QR code on the `/signage` page.

## Wallet passes (optional)

Customers can add their card to Apple Wallet / Google Wallet instead of just
holding a QR code in the browser. Both are fully optional — without the env
vars below set, the app behaves exactly as it does today and the "Add to
Wallet" buttons simply don't appear.

**Apple Wallet** — requires a paid
[Apple Developer Program](https://developer.apple.com/programs/) membership:

1. Register a **Pass Type ID** (Certificates, Identifiers & Profiles →
   Identifiers → Pass Type IDs) — this becomes `APPLE_PASS_TYPE_IDENTIFIER`
   (looks like `pass.com.yourcafe.loyalty`).
2. Your **Team ID** (top-right of the Apple Developer account page) becomes
   `APPLE_TEAM_IDENTIFIER`.
3. Create a certificate for that Pass Type ID, download it, and export it
   from Keychain Access as a `.p12` file (set a password when prompted — that
   password is `APPLE_PASS_SIGNER_KEY_PASSPHRASE`). Then, with OpenSSL:
   ```bash
   openssl pkcs12 -in Certificates.p12 -clcerts -nokeys -out cert.pem -passin pass:<your .p12 password>
   openssl pkcs12 -in Certificates.p12 -nocerts -out key.pem -passin pass:<your .p12 password> -passout pass:<your .p12 password>
   base64 -w0 cert.pem   # → APPLE_PASS_SIGNER_CERT_BASE64
   base64 -w0 key.pem    # → APPLE_PASS_SIGNER_KEY_BASE64
   ```
4. The WWDR intermediate certificate is already bundled in this repo
   ([`certs/AppleWWDRCAG4.pem`](certs/AppleWWDRCAG4.pem)) — nothing to do
   there unless Apple rotates it (see the comment in that file).

The pass icon/logo images in [`public/wallet`](public/wallet) are plain
placeholders generated from `public/icon.svg`. Replace them with real
branded PNGs at the same filenames (or re-run
`node scripts/generate-wallet-images.mjs` after replacing `public/icon.svg`),
then redeploy.

**Google Wallet** — requires a Google Cloud project with the
[Google Wallet API](https://developers.google.com/wallet/generic/gs-getting-started)
enabled:

1. Request Wallet API access and get your **Issuer ID** from the
   [Google Pay & Wallet Console](https://pay.google.com/business/console) —
   this becomes `GOOGLE_WALLET_ISSUER_ID`.
2. Create a service account with the "Wallet Object Issuer" role, download
   its JSON key. `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL` is the key's
   `client_email`; `GOOGLE_WALLET_SERVICE_ACCOUNT_KEY` is its `private_key`
   (paste it as-is — literal `\n` escapes in the value are handled
   automatically).
3. Run the one-off class-provisioning script once, after the env vars above
   are set:
   ```bash
   node --env-file=.env.local scripts/setup-google-wallet-class.mjs "Your Cafe Name"
   ```
   A newly-created class starts in Google's `UNDER_REVIEW` state — Google
   must approve it (a manual review on their end) before passes are visible
   to real customers outside your own test Google account.

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
- [ ] Print or display `/signage` at the counter — a "scan to join" poster
      with a large QR code, the shop name, and the stamps-required count.
      It's publicly accessible (no staff PIN needed), so pull it up once the
      real shop name and stamps count are set via `/setup` and print it or
      leave it open on a tablet.

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
- **Apple Wallet passes don't auto-update.** Google Wallet passes update
  live (Google hosts the pass state, so the app pushes the new stamp count
  after every stamp), but Apple Wallet passes are generated once at download
  time — a customer needs to re-add the pass to see a fresh count.
  Auto-updating Apple passes requires a separate device-registration +
  APNs push web service, not built yet. See [`src/lib/apple-wallet.ts`](src/lib/apple-wallet.ts).

## Tests

```bash
npm test
```

Covers the stamp/redemption math, the staff session cookie's HMAC
sign/verify logic, and the card progress copy — the parts of the app where a
silent regression would be worst and hardest to notice by eye.
