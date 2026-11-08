# Café pitch and pilot offer

Working draft. Anything in [brackets] is for you to fill in. Prices and terms
are hypotheses to test, not facts. Don't promise a feature on this page until
it's live on a real phone (see "Say only what's true" at the bottom).

## Who to approach first

Independent cafés (1–3 locations) that:
- run paper punch cards or nothing, **or**
- have a card terminal/POS with no built-in loyalty (or loyalty behind a paid tier).

Skip, for now: cafés already happy with Square/Toast/Clover loyalty. For them
a second tool is friction, and you'd lose the argument.

Best person to talk to: the owner or owner-manager, mid-morning or mid-afternoon
(not the rush). Go in person, buy a coffee first, look at the counter. Do they
have a paper card by the till? That's your opening.

## The 30-second pitch (spoken)

> "Hi, I'm [name]. I'm building a simple digital stamp card for local cafés —
> the paper punch card, but on your customers' phones. They scan a QR code at
> the counter, no app to download, and their card lives in their phone. Your
> staff scan it to add a stamp. You'd see how many cards and stamps you've
> given out. I'm looking for a few local cafés to try it free for two months
> and tell me honestly what's wrong with it. Can I show you in two minutes?"

Then show it on your phone: scan the signage QR, get a card, have them stamp it
on the staff page. Let them hold the phone. Stop talking while they try it.

## Questions to ask (listen more than pitch)

1. How do you do loyalty today? Paper cards? How many do you hand out vs. get back?
2. What do you give for a full card, and how often do people actually redeem?
3. Do you have a card terminal or POS? Which one? Does it do loyalty?
4. Who'd be stamping at the counter, and what's the busiest hour like?
5. If this worked perfectly, what would it change for you?

Write down the answers. They're worth more than the pitch: 10 conversations
tell you whether there's a real problem and which words to use.

## What the café gets (the offer)

**A free two-month pilot.**

- I set everything up for you, personally. About [30–45 min], no technical work on your side.
- Your own digital stamp card with your name and your reward (e.g. "9 stamps, free coffee").
- A printable counter sign with a QR code that customers scan to join.
- A staff screen on any phone or tablet you already own. No new hardware.
- A simple dashboard: cards issued, stamps given, free rewards redeemed.
- Optional "you're one stamp away" email for customers who share their address.
- I check in with you every [two weeks] and fix what's broken, usually the same day.

**What I ask in return:**

- Put the sign at the counter and tell customers about it for the two months.
- Use it for real, even when it's imperfect.
- A 15-minute honest conversation every two weeks: what worked, what annoyed staff or customers.
- If it's been good, a short quote I can use. If it hasn't, tell me why. That's just as useful.

**After two months:**

- No obligation, no card on file, nothing auto-renews.
- If you want to keep it: [founder price, e.g. $15/month, locked for as long as you stay], versus the [$19–29/month] list price I'll charge new cafés.
- If you don't, I'll send you your customers' sign-up emails (the ones they chose to share) and shut your card down. Your customer list is yours.

## Pricing (hypothesis to test, not a promise)

- Pilot: free for 60 days.
- Founder price for pilot cafés: [$15/month], flat.
- Later list price: [$19–29/month], flat, per location.
- No per-customer fees, no setup fee, no contract.

The point to land: the well-known stamp-card apps charge more (roughly
$25–50+/month) and bundled POS loyalty tends to need a paid POS plan. Verify
those numbers again before you quote them to anyone; they change.

## Likely objections

**"We already have paper cards and they work."**
They do. This isn't about replacing them overnight. Paper cards get lost, can
be faked, and you learn nothing from them. Here you see how many people are
actually coming back. Try it alongside paper for a few weeks.

**"My customers won't download an app."**
Right, there's no app. They scan a QR code and it opens in their phone's
browser. [Once Wallet passes are live: they can also add it to Apple Wallet or
Google Wallet in one tap.]

**"We use Square/Toast and it has loyalty."**
Then you're probably covered. Is it switched on and do your staff use it? If
yes, you don't need me. If it's on a paid plan you aren't using, this is the
cheaper way to get the same thing. (Say this honestly. It earns trust.)

**"What if it breaks during the rush?"**
Staff PIN and stamping are simple and I'll be on call for the pilot. If it ever
fails, a stamp by hand on a paper card still works for that customer. [Be
honest: you're a one-person operation. Say so.]

**"What happens to my customers' data?"**
Customers choose whether to share an email. You own the list. I don't sell it
or use it for anything else. [Write a one-paragraph privacy note before
launching, even a short one.]

**"How much will it cost later?"**
[Founder price], flat, locked for as long as you stay. No per-customer or
per-stamp fees.

## Follow-up message (after the visit, or if you can't visit)

> Hi [name], thanks for the chat at [café] today. As promised: a free two-month
> trial of a digital stamp card for [café], set up by me in about [30–45] minutes.
> No app for customers, no hardware, no card on file. I only ask for an honest
> catch-up every couple of weeks. Would [day/time] work to set it up? — [name, number]

If no reply after about 5 days, one short nudge, then let it go.

## What to track during the pilot

- Cards issued per week.
- Stamps given per week.
- Free rewards redeemed.
- Staff friction: does stamping slow the line? Any customers confused?
- The café's own words for what's good and bad. Write them down verbatim.

You can read the first three from each café's `/setup` page. There is no
repeat-visit metric yet.

## Decide in advance when to stop

- After ~15 café conversations: if fewer than 3 agree to a pilot, the problem
  is demand or message, not features. Stop building, change the pitch or the
  segment.
- After the pilots: if fewer than [2 of 5] would pay the founder price, listen
  hard to why before writing any more code.

## Say only what's true

Before using any line above, check it against what's live:

- **Apple/Google Wallet:** only mention it after you've added a card to a real
  phone. Apple passes don't auto-update yet (customers re-add them to refresh
  the count); Google passes update live.
- **Email reminders:** only promise them once `EMAIL_FROM_ADDRESS` is set on a
  Resend-verified domain. Until then they won't reach customers.
- **Dashboard:** it shows totals (cards, stamps, redemptions), not repeat visits
  or revenue. Don't imply more.
- **Reliability:** this is one person's new software. Promise fast fixes, not
  uptime guarantees.
