# Libya: market assessment and product fit

Written November 2026. Facts come from the sources listed at the bottom.
Anything marked **(inference)** is my judgement, not a sourced fact. Check
the inferences in real café conversations before acting on them.

## 1. Verdict

**The idea is viable in Libya, arguably more than in the US/EU markets we
assessed before. But the product as built is aimed at the wrong market and
needs a Libya-specific version.**

- **Why the idea fits:**
  - Libya has a strong, everyday espresso culture.
  - Small independent cafés are numerous.
  - Social media and phone use is near-universal.
  - Square, Toast and the other bundled-loyalty POS products we worried about don't operate in Libya. I found no local café-loyalty product either (absence of evidence, so worth confirming on the ground).
- **Why the current build doesn't fit:**
  - It is English-only.
  - It relies on email and on Apple/Google Wallet. Google Wallet isn't available in Libya, and Apple is about 16% of phones.
  - A card can't be recovered if the customer changes phone.
  - The manual fallback is a 36-character code.
  - There is no way to collect a subscription in Libya, because Stripe and PayPal don't work there.
- **The biggest unknown is willingness to pay.** Café owners may like it and still not pay a monthly fee. Test that in the pilot before building anything beyond the Libya-specific changes in section 4.

## 2. What the market looks like

### People and phones
- **Population and connectivity:**
  - About 7.5M people.
  - 6.6M internet users (88.5%).
  - 14.9M mobile connections, so many people carry two SIMs (Libyana and Al-Madar).
  - Median mobile download speed is about 25 Mbps.
- **Social media:** 6.7M users.
  - Facebook reaches essentially everyone online.
  - TikTok's ad reach is about 6.2M.
  - Messenger is about 4.9M.
  - Instagram is 2.3M.
  - Social media users are 61% male and 39% female.
- **Phones:** Android has about 84% share and iOS about 16% (Statcounter, mid/late 2026).
- **Messaging (inference):** WhatsApp, Messenger and Viber are where people actually talk. Email is little used day to day.
  - Phone numbers are the de facto identity.
  - Businesses market on Facebook pages and Instagram, and take orders over WhatsApp and Messenger.

### Money
- **Cash crisis, digital boom:**
  - Recurring cash shortages pushed people to cards and phone payments.
  - From January 2025 to February 2026 the central bank reported 313.6bn LYD in e-payments.
  - Over the same period it reported 165k POS terminals (up 15k), 5.5M active bank cards and 4.3M mobile-banking users.
  - The LYPAY instant-transfer platform handled 18.3M transfers worth 108.7bn LYD.
  - E-wallets are still small: about 187k accounts.
- **Merchant fees:** the central bank cut POS fees to 1–1.5% (from 3.75%) in late 2024.
  - Dual pricing (a higher price for card payments) is common enough that the religious authority ruled on it.
  - (inference) Owners are sensitive to anything that looks like a cut of their revenue.
- **Currency:** the official rate is about 6.4 LYD per USD after the January 2026 devaluation.
  - The parallel market was above 10 per USD in October 2026, a gap of about 60%.
  - Food prices are rising quickly.
- **International payments:**
  - Annual caps apply: $10k on cards and $20k in total transfers per person.
  - PayPal and Stripe don't serve Libya.
  - **Implication:** you can't charge cafés by card online. You pay your hosting bills in USD and earn in LYD.

### Cafés
- Libyans drink espresso and macchiato habitually, a legacy of Italian rule. Cafés multiplied after 2011.
- **Prices:**
  - About 2 LYD for a coffee in a regular café.
  - 4–6+ LYD in "family" and trendy cafés.
  - About 4–4.5 LYD for a cappuccino (2026 cost-of-living sites).
- **Two segments (inference):**
  - **Neighbourhood men's cafés.** Cheap coffee, regulars the owner already knows, little need for a loyalty card.
  - **Family and trendy cafés.** Higher prices, younger and mixed customers, more competition, active Instagram and TikTok. **This is the target.**
- **Visit frequency (inference):** probably higher than in Western markets (several espressos a day). Stamp cards suit this. Nine stamps can fill in a week, so cafés may want 10–15.

### Operating conditions
- **Electricity:** load shedding of up to about 7 hours a day hit parts of Libya in summer 2026, and there were protests in Tripoli.
  - Cafés with generators keep trading, but Wi-Fi routers may drop.
  - (inference) Mobile data usually keeps working.
- **Political and FX instability:** quote prices in LYD and review them often. Expect occasional disruption.

### Competition
- **No global player is present.** Square, Toast, Clover, Stamp Me, Loyverse loyalty and the others have no Libyan presence that I could find.
- **Real alternatives:** paper punch cards, informal "the 10th is free" arrangements, and Instagram giveaways.
- **Future threats (inference):**
  - Banks and payment networks (Moamalat, Tadawul, Sadad) adding cashback.
  - A delivery app (Presto, Libya's biggest startup) adding loyalty.
  - Either could also be a **partner or distribution channel** later.

## 3. Our product, measured against this market

Scores are out of 5 for the Libyan context, not in general.

| Area | Score | Why |
|---|---|---|
| No app, scan a QR to join | 5 | Exactly right for Android-heavy, data-conscious users |
| Staff stamping (scan, confirm, done) | 4 | Fast, works on any staff phone over mobile data |
| Visual design | 3 | Clean, but Latin-only fonts and LTR layout |
| **Language** | **0** | English only. Signage, card, staff screen and setup must be Arabic-first |
| **Card recovery / identity** | **1** | Card lives only in browser storage. A new phone, cleared data, or opening it in Facebook's in-app browser gives a new empty card. No recovery path |
| **Manual fallback** | **1** | Staff must type a 36-character UUID. Unusable at a busy counter |
| Customer re-engagement | 1 | Email only. Libyans don't read email; WhatsApp and phone are the channels |
| Wallet passes | 1 | Google Wallet isn't available in Libya. Apple covers about 16% of phones, and enrolling in Apple's developer program from Libya is reportedly hard |
| Reward flexibility | 2 | "Free coffee" is hard-coded. Family cafés may want "free dessert" or "free shisha" |
| Redemption | 3 | Auto-redeems on the final stamp. Fine, but staff can't let a customer save it |
| Owner dashboard | 2 | Totals only. No repeat visits, no customer list |
| Multi-branch / multi-tenant | 4 | Built, unverified live. Small Libyan chains with 2–5 branches are a natural fit |
| Resilience to outages | 3 | Needs internet, but mobile data usually survives power cuts. No offline mode |
| Billing | 0 | None. Stripe can't work anyway. Will need LYD bank transfer, LYPAY or cash |

### The user flows as they are today

1. **Join.**
   - Today: the customer scans the counter poster, a card opens in their browser, and they see the "Digital Stamp Card" screen.
   - Breaks in Libya: the poster and screen are in English, and the reward is hard-coded.
2. **First stamp.**
   - Today: the customer shows the QR, staff scan it, and staff tap "Add stamp".
   - Breaks in Libya: nothing major.
3. **Return visit.**
   - Today: the customer re-scans the poster or reopens the browser tab.
   - Breaks in Libya: a different browser, the Facebook in-app browser or a new phone gives a new blank card, and the customer is annoyed.
4. **No phone or no data on the customer.**
   - Today: staff type the 36-character code shown under the QR.
   - Breaks in Libya: in practice there's no way to stamp.
5. **One stamp away.**
   - Today: an email reminder, if the customer gave an address.
   - Breaks in Libya: almost nobody will.
6. **Reward.**
   - Today: the final stamp auto-redeems as "Free coffee", with confetti for both sides.
   - Breaks in Libya: copy and reward type are fixed.
7. **Owner.**
   - Today: the English setup page with totals.
   - Breaks in Libya: no customer list to reach regulars.

## 4. What to change for Libya (in priority order)

Small, focused changes. Each one removes a pilot blocker. No new platforms.

1. **Arabic-first UI with RTL.**
   - Covers the customer card, signage, staff screen and setup.
   - English stays as a toggle.
   - Use Arabic UI text and an Arabic web font.
   - (inference) Western digits are probably fine for stamp counts in Libya. Confirm with cafés.
2. **Phone number as an optional identity.**
   - The customer enters their mobile number once.
   - Staff can then look up a card by phone number, which replaces typing the UUID.
   - It also fixes recovery: a new phone, "what's your number?", same card.
   - Start without SMS verification. The stakes are a free coffee. Add OTP only if abuse shows up.
3. **Short card code.** A 6-digit code instead of the UUID wherever a human reads or types it.
4. **WhatsApp instead of email.**
   - The simplest version is to show the owner their opted-in customers' numbers, with a `wa.me` link or an export for a WhatsApp broadcast list.
   - No API, no per-message cost.
   - Keep email code in place but hidden for Libyan deployments.
5. **Configurable reward text** ("free coffee", "free dessert", …) and a recommended 10–12 stamps.
6. **Repeat-visit metric on the dashboard.** Owners will judge the product by "are people coming back?".
7. **Hide Wallet buttons for Libya.**
   - The code is fine and stays for other markets.
   - Don't spend Apple fees or Google onboarding time on Libya.

Not now: native apps, an offline mode, a POS integration, a bank partnership, self-serve online billing.

## 5. Go-to-market adjustments

- **Target:** family and trendy cafés plus small chains in Tripoli first (one city, so you can visit). Then Benghazi and Misrata.
- **Sell in person, follow up on WhatsApp.**
  - (inference) B2B in Libya runs on relationships and referrals.
  - One respected café owner using it is worth more than any ad.
- **Pitch value in their terms:**
  - "Know your regulars, message them on WhatsApp."
  - "A stamp card that can't be lost or faked."
  - "Looks modern on your Instagram."
- **Pricing (hypothesis):**
  - Price in LYD, not USD.
  - Roughly 50–100 LYD a month after a free pilot, about the value of 15–30 coffees a month.
  - The earlier $15 founder price is about 96 LYD at the official rate, so it sits at the top of that range.
  - Collect by bank transfer, LYPAY instant transfer or cash. Monthly in-person collection during pilots is fine.
- **Cost side:**
  - Hosting is paid in USD on a capped card.
  - Keep infrastructure on free or low tiers until revenue covers it.
  - Factor in the parallel-rate gap if you buy USD informally.
- **Stop rules from `pilot-offer.md` still apply.** Translate the pitch into Libyan Arabic, not formal Modern Standard Arabic.

## 6. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Cafés like it but won't pay monthly | High | Pilot with explicit price conversations. Consider a one-time setup fee plus a low monthly fee |
| Neighbourhood cafés see no need | High | Target the family/trendy segment |
| FX swings break pricing | Medium | Price in LYD, review quarterly |
| Power/internet outages during rush | Medium | Mobile data on staff phone. Paper backup stamp |
| A bank or delivery app launches loyalty | Low–medium | Move fast in one city. Treat them as possible partners |
| Customer abuse (fake numbers, staff over-stamping) | Low | Stamp audit log per staff later. Low stakes per stamp |

## 7. What to verify in the first 10 café visits

- Do they want Arabic only, or Arabic and English?
- Do customers trust giving their phone number to a café?
- Would the owner actually message customers on WhatsApp?
- What reward and how many stamps?
- What monthly price makes them hesitate? Ask for a number in LYD.
- Do they run on mobile data or Wi-Fi during power cuts?

## Sources

- [DataReportal: Digital 2026 Libya](https://datareportal.com/reports/digital-2026-libya)
- [Statcounter: mobile OS share, Libya](https://gs.statcounter.com/os-market-share/mobile/libya)
- [Google Wallet: supported countries (Libya not listed)](https://support.google.com/wallet/answer/12060037?hl=en-GB)
- [Libyan Express: e-payments exceed 313bn LYD (2025–Feb 2026)](https://www.libyanexpress.com/?p=61557)
- [Transfi: Libya's payment rails (Moamalat, Tadawul, Sadad, POS counts)](https://www.transfi.com/blog/libyas-payment-rails-how-they-work---challenges-in-banking-mobile-money-card-payments)
- [The Fintech Times: Libya's fintech ecosystem in 2026](https://thefintechtimes.com/the-fintech-ecosystem-of-libya-in-2026/)
- [Libya Herald: CBL cuts POS charges to 1–1.5%](https://www.libyaherald.com/2024/11/cbl-reduces-pos-e-payment-charges-to-1-and-1-5-percent-from-3-75-percent)
- [Libyan Express: Dar Al-Ifta on card vs cash pricing](https://www.libyanexpress.com/?p=61759)
- [Rio Times: parallel market above 10 LYD/USD (Oct 2026)](https://www.riotimesonline.com/libyan-dinar-parallel-market-above-10-per-dollar-2026/)
- [NCB: prepaid Visa limits](https://www.ncb.ly/en/media-center/news/prepaid-card-visa-limit)
- [Technology.ly: PayPal4Libya campaign](https://technology.ly/en/paypal4libya-campaign/)
- [Apple Developer Forums: enrollment payment issues](https://developer.apple.com/forums/thread/126314?page=17)
- [Al Jazeera: Libya blackout protests (July 2026)](https://www.aljazeera.com/economy/2026/7/29/libya-electricity-blackout-protests-expose-countrys-failing-grid)
- [Oman Observer: Tripoli family cafés and coffee prices](https://www.omanobserver.om/finding-respite/)
- [Culture Trip: Libyan coffee culture, the Italian connection](https://theculturetrip.com/africa/libya/articles/libyan-coffee-culture-the-italian-connection)
- [Combien-coûte: cappuccino price in Libya 2026](https://www.combien-coute.net/cappuccino/libye/)
- [Wild Cats and Black Sheep: Presto, Libya's biggest startup](https://wildcatsandblacksheep.com/?p=14960)
