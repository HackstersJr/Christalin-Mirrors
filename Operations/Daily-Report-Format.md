# Daily Report — Standard Format

## Why this exists

Right now each branch sends a photo of a handwritten ledger page over WhatsApp at close. It works, but it has three problems:

- **Handwriting has to be re-read and re-totalled by hand every evening** — slow, and arithmetic mistakes on the page carry through.
- **No two branches use the same layout** — Bengaluru and Belgaum keep a running cash/UPI ledger; Kalaburagi has produced two differently-named ledgers ("Christalin Mirrors Gulbarga" vs "Mane'a Salon") in the past, which is exactly the kind of mix-up a text format prevents.
- **Nothing besides revenue gets reported** — stock, staff attendance, and client issues never leave the branch unless someone happens to mention them.

The fix isn't to stop keeping the paper ledger (keep it — it's the physical cash record). It's to add one short WhatsApp **text** message at closing, in the same format every day, from every branch. Text can be pasted straight into the briefing tool instead of being re-typed from a photo.

## The message every branch sends at closing

Copy this, fill it in, send as one WhatsApp message:

```
CHRISTALIN MIRRORS — DAILY REPORT
Branch: Bengaluru
Date: 10-09-2026

Cash: 4200
UPI: 6100
Card: 0

Invoices raised: 12
Invoices pending: 1

Stock low/out: none

Staff total: 8
Staff present: 7
Staff absent: 1

New clients: 5
Appointments done: 22
Appointments cancelled: 2
Appointments no-show: 1

Notes: 
```

Rules for filling it in:

- **Branch** is the branch name — Bengaluru, Kalaburagi, or Belgaum — exactly as written above.
- **Date** is DD-MM-YYYY.
- Every number field gets a number, even if it's `0` — an empty field reads as "not reported," a `0` reads as "reported and nothing happened."
- **Stock low/out** — comma-separated item names, or `none`.
- **Notes** — anything that needs a decision from HQ: a complaint, a repair needed, a staffing gap. Leave blank if there's nothing.

## How it's used

Paste the branch's message into the matching branch tab in `daily-briefing.html` (in this folder) and hit **Fill from text** — it reads the labelled lines and fills the form automatically, so nothing gets retyped by hand.

## Rollout

1. Share this format with all three branch managers and ask them to send it alongside (not instead of, for now) tonight's ledger photo.
2. Once a branch's text report and their ledger photo agree for a few days running, that branch can stop sending the photo.
3. If a branch's number ever looks off, the paper ledger is still there to check against — this format doesn't replace bookkeeping, it replaces re-typing it by hand.
