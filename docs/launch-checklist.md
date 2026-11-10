# Launch checklist: deployment + Wallet passes

Work top to bottom. Each phase ends with a check you can run, so you know it
worked before moving on. Console UIs for Apple, Google, Supabase and Vercel
change; where a step names a menu, treat the name as a pointer, not gospel.

## Phase 0 — Decide the shape (5 min)

- [ ] **Pilot mode.** One deployment per café ("Model A": one Supabase
      project + one Vercel project each) or one shared deployment for all
      pilots ("Model B": wildcard subdomains + owner accounts)?
  - Model A is simpler to run for 3–5 pilots. One Google issuer and one
    Apple Pass Type ID can safely be shared across deployments.
  - Model B needs everything in Phase 6 as well.
- [ ] Buy/pick a domain (about $12/yr). Model B needs one you can point
      nameservers for (Phase 6).

## Phase 1 — Pre-launch code fixes

Gaps found while writing this list. Fixed in code; what's left for you is
configuration, plus two items still open.

- [x] **Email sender.** The sender is now `EMAIL_FROM_ADDRESS` (shop name as
      the display name). You still need to verify a domain in Resend and set
      it; unset, mail goes out from Resend's sandbox address and only reaches
      the Resend account owner (the app logs a warning).
- [x] **Mailing address in the footer** (CAN-SPAM) is now `EMAIL_MAILING_ADDRESS`
      instead of a source edit. Set it if you email US customers.
- [x] **Google Wallet class per shop.** Classes are now per shop and created
      automatically on first "Add to Google Wallet" tap (renames are synced);
      the manual provisioning script is gone. Stamp-time updates are
      update-only and no longer create objects for people who never added the
      pass.
- [ ] **Card read exposes email.** `GET /api/cards/[id]` returns a card's
      email to anyone holding its UUID. Low risk (UUIDs are unguessable) but
      worth closing before you collect real customer emails.
- [ ] Consider upgrading Next.js past the open `npm audit` advisories.

## Phase 2 — Supabase

- [ ] Create a project at supabase.com (pick the region closest to the café).
- [ ] Project Settings → Database: copy the **connection string** into
      `DATABASE_URL` (Vercel: Production environment only). Every production
      deploy then applies new migrations automatically before going live.
      No `DATABASE_URL`? Run the files in `supabase/migrations/` in order in
      the SQL editor instead.
- [ ] Project Settings → API: copy the **Project URL**, the **service_role**
      key (server only, never exposed to the browser) and the **anon** key.
- [ ] **Immediately change the seeded staff PIN** (`1234`) via `/setup`, or
      reset it with the SQL in the README's Day-2 operations.
- [ ] Billing: the free tier pauses projects after about a week of inactivity.
      Put real cafés on Pro (about $25/mo) or accept the risk. Check current
      terms.
- [ ] Only if using owner accounts: Authentication → URL Configuration. Set
      the Site URL to your app URL and add `<app URL>/owner/login` to the
      allowed redirect URLs (signup's confirmation email sends people there).
      For Model B, allow the wildcard subdomain pattern too.
- [ ] Only if using owner accounts: Authentication → email. Supabase's
      built-in email sender is heavily rate-limited. Configure custom SMTP
      (Resend works) before inviting more than a couple of owners.

**Check:** `select name from shops;` returns your seeded shop.

## Phase 3 — Vercel (first deploy, no Wallet yet)

- [ ] Import the GitHub repo as a new Vercel project.
- [ ] Hobby plans are non-commercial; a paid café business needs Pro (about
      $20/mo). Check current terms.
- [ ] Set environment variables (see `.env.local.example`):
  - [ ] `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `STAFF_SESSION_SECRET` (`openssl rand -hex 32`)
  - [ ] `NEXT_PUBLIC_APP_URL` (final URL, no trailing slash; set after you
        know the domain, then redeploy)
  - [ ] `RESEND_API_KEY` (after Phase 1's sender fix)
  - [ ] Owner auth, if used: `NEXT_PUBLIC_SUPABASE_URL`,
        `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Deploy. Attach your domain; update `NEXT_PUBLIC_APP_URL`; redeploy.

**Check, on a real phone, on mobile data (not your wifi):**
- [ ] `GET /api/health` returns 200.
- [ ] `/` creates a card and shows the QR code.
- [ ] `/staff` accepts the PIN and stamps that card from a second device.
- [ ] The card on the first phone updates within a few seconds.
- [ ] `/signage` renders and the QR on it opens the site.
- [ ] Point an uptime monitor at `/api/health`.

## Phase 4 — Apple Wallet

Needs a paid Apple Developer Program membership ($99/yr). An organization
membership additionally needs a D-U-N-S number, so an individual account is
the faster start.

- [ ] Enroll at developer.apple.com/programs (approval can take from hours to
      days; start this first and in parallel with everything else).
- [ ] Certificates, Identifiers & Profiles → Identifiers → **Pass Type IDs**:
      register one (e.g. `pass.com.yourbrand.loyalty`). This is
      `APPLE_PASS_TYPE_IDENTIFIER`.
- [ ] Your **Team ID** (Membership details) is `APPLE_TEAM_IDENTIFIER`.
- [ ] Create the signing certificate without needing a Mac:
  ```bash
  openssl req -new -newkey rsa:2048 -nodes -keyout pass-key.pem -out pass.csr \
    -subj "/CN=Pass Type ID/O=Your Name"
  ```
  Upload `pass.csr` to the Pass Type ID's "Create Certificate" step, download
  the resulting `.cer`, then:
  ```bash
  openssl x509 -inform DER -in pass.cer -out pass-cert.pem
  base64 -w0 pass-cert.pem   # → APPLE_PASS_SIGNER_CERT_BASE64
  base64 -w0 pass-key.pem    # → APPLE_PASS_SIGNER_KEY_BASE64
  ```
  Because the key was generated with `-nodes` it has no passphrase, so leave
  `APPLE_PASS_SIGNER_KEY_PASSPHRASE` unset.
- [ ] Add the four values to Vercel, redeploy.
- [ ] The WWDR intermediate cert is already in the repo
      (`certs/AppleWWDRCAG4.pem`, valid to 2030). Nothing to do unless Apple
      rotates it.
- [ ] Replace the placeholder images in `public/wallet/` with real branded
      PNGs at the same filenames, or regenerate them with
      `node scripts/generate-wallet-images.mjs` after swapping `public/icon.svg`.
- [ ] Keep `pass-key.pem` and the `.p12`/`.cer` files out of git (the repo's
      `.gitignore` blocks `*.pem`); store them in a password manager.

**Check, on an iPhone, in Safari (not an in-app browser):**
- [ ] `/` now shows "Add to Apple Wallet".
- [ ] Tapping it opens the Wallet add-sheet; the pass shows the shop name,
      stamp count and a QR.
- [ ] The staff scanner can scan the QR **from the pass on the phone screen**.
- [ ] Known limitation: after a stamp the Apple pass does **not** refresh;
      the customer re-adds it. Decide whether that is acceptable for pilots.

## Phase 5 — Google Wallet

Free, but needs Google approval before passes are visible to the public.

- [ ] Google Pay & Wallet Console (pay.google.com/business/console): create a
      business profile and open the **Google Wallet API** section to get an
      **Issuer ID** → `GOOGLE_WALLET_ISSUER_ID`.
- [ ] Google Cloud: create/select a project, enable the **Google Wallet API**.
- [ ] Create a **service account** and download its JSON key.
  - [ ] `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL` = the key's `client_email`.
  - [ ] `GOOGLE_WALLET_SERVICE_ACCOUNT_KEY` = the key's `private_key`
        (paste as-is; literal `\n` escapes are handled).
- [ ] **Authorize the service account in the Wallet console** (Users →
      invite the service account's email). Missing this step is the most
      common cause of 401/403 from the Wallet API, and the README does not
      cover it.
- [ ] In the Wallet console, while the issuer is in demo mode, add your own
      Google accounts as **test users**; only they can save passes until
      you're approved.
- [ ] Add the three values to Vercel (and make sure `NEXT_PUBLIC_APP_URL` is
      the public HTTPS URL, since Google fetches the class logo from it),
      then redeploy. No per-shop setup: each shop's class is created on the
      first "Add to Google Wallet" tap.
- [ ] After the first tap, the shop's class appears in the Wallet console
      under "under review". Submit/track it there to leave demo mode (allow
      days). Pilots can run in demo mode with test users meanwhile.

**Check, on an Android phone signed in as a test user:**
- [ ] "Add to Google Wallet" appears and saves the pass (the first tap also
      creates the class, so it can take a couple of seconds).
- [ ] Stamp the card from `/staff`; the pass in Wallet updates on its own
      (this is the live-update path that Apple's static pass lacks).
- [ ] Watch Vercel logs during that stamp. The Wallet update is
      fire-and-forget, so a failure is silent in the UI; a 401/403 in the log
      means the service-account authorization step above was missed.

## Phase 6 — Model B only (shared deployment)

- [ ] Set `APP_ROOT_DOMAIN` **and** `NEXT_PUBLIC_APP_ROOT_DOMAIN` to the bare
      domain (e.g. `yourapp.com`, no scheme).
- [ ] Vercel wildcard domain: add `yourapp.com` and `*.yourapp.com`.
      Wildcards generally require delegating the domain's nameservers to
      Vercel (for the wildcard certificate); confirm in their domain docs.
- [ ] Owner auth env vars from Phase 3 are required here.
- [ ] Supabase Auth redirect URLs must cover the subdomains (Phase 2).
- [ ] Remember: on the bare root domain the shop pages intentionally error
      (there is no marketing site yet). Only `/owner/*` and `/api/onboarding`
      are meaningful there.

**Check:**
- [ ] Sign up at `/owner/signup`, confirm the email, land on
      `/owner/onboarding`, create a shop, get redirected to
      `<slug>.yourapp.com/setup` **still signed in**. This is the one path
      that has never been run against a real Supabase Auth backend, and the
      wildcard cookie domain is the likeliest place for a surprise.
- [ ] A second account creates a second shop; each subdomain shows only its
      own shop; staff PIN at one shop cannot stamp the other's cards.

## Phase 7 — Hand-off to a café

- [ ] Staff PIN set and written down where the café keeps such things.
- [ ] Print `/signage` and put it at the counter.
- [ ] Add the site to the staff tablet's home screen; confirm the camera
      permission prompt is accepted for the scanner.
- [ ] Show the owner `/setup` (stamps required, stats).
- [ ] Agree who they call when it breaks, and what "broken" means.
- [ ] Note the café's real stamp rule and reward so the copy matches.

## Recurring costs to expect

| Item | Cost |
|---|---|
| Apple Developer Program | $99/yr |
| Google Wallet API | free |
| Domain | about $12/yr |
| Supabase Pro | about $25/mo |
| Vercel Pro | about $20/mo |
| Resend | free tier likely enough at pilot scale |

Roughly $45–50/month plus about $110/yr, shared across every café on a
single deployment. Verify current pricing before relying on these numbers.
