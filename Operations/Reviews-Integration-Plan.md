# Google Reviews Integration — Draft Plan

**Status: planning only — nothing below has been built or applied yet.**

## 1. Supabase check

Confirmed working. The Supabase MCP is connected to the real project (`xykoedllapxslyxbvbsd`), and it's the actual backend behind the admin app — not a placeholder:

- `Branch` — 3 rows: `branch_blr` (Bengaluru), `branch_klb` (Kalaburagi), `branch_bgm` (Belgaum), all active
- `Client` — 179 rows, `Invoice` — 217 rows, `InvoiceItem` — 367 rows, `Staff` — 9 rows, `InventoryItem` — 8 rows
- `ClientReview` — 2 rows. This is a **different feature**: in-salon voice reviews (transcript, derived rating, sentiment) recorded at checkout — not Google Maps. The new table below is separate from this one.
- Schema is Prisma-managed (camelCase columns, `createdAt`/`updatedAt`, RLS already enabled per your `rls_role_branch_scoping` migration). IDs on existing tables have no DB-side default — they're generated in application code. I'd follow that same pattern for new tables rather than introducing DB-generated UUIDs, so it stays consistent with how the rest of the schema works. (`pgcrypto` is installed if you'd rather switch to DB-generated IDs later.)

## 2. Two tables, two timelines

- **`GoogleReview`** — build now, pending your go-ahead below. Holds scraped Google Maps reviews per branch.
- **`BranchDailyReport`** — **not being built yet.** The WhatsApp daily figures (cash/UPI/stock/staff/etc.) stay in `Operations/christalin_briefings.db` (local SQLite) until all three branches are consistently sending the standard format from `Daily-Report-Format.md`. Once that's reliable, this table lets us move history over in one export/import rather than a redesign — schema drafted below so it's ready when you are.

## 3. Resolving each branch's Google Maps listing

None of the three `mapUrl` values in `branches.ts` are stable "place" links yet:

| Branch | Current `mapUrl` | Issue |
|---|---|---|
| Bengaluru | `maps.google.com/?q=Century+Ethos+Club+House+Bellary+Road+Bengaluru` | text search, not a locked listing |
| Kalaburagi | `maps.google.com/?q=Orchid+Mall+Kalaburagi` | text search, and it's the mall, not the salon specifically |
| Belgaum | `maps.app.goo.gl/yyaWwhcgf2MnbfbP8` | short link — resolves to a listing, needs confirming it's the right one |

First implementation step (before any scraping) is opening each, confirming it lands on Christalin Mirrors' own listing (not the mall or a neighbour), and locking in the canonical URL. I can do this myself if you'd rather not.

## 4. Scraping approach

Google's review panel is JS-rendered and loads reviews as you scroll inside it — not present in the raw page HTML — so this needs a headless browser, not a simple HTTP fetch. Plan:

- **Playwright (Python)**: load the listing → open the reviews panel → scroll to load review cards → extract author name, star rating, relative time ("2 weeks ago"), review text, and owner reply if any.
- **No exact dates.** Google only shows relative time, so "new since yesterday" is inferred (a review whose relative time reads "a day ago" that we didn't see before), not exact — good enough to flag something new, not to certify it arrived in a specific 24h window.
- **Dedup**: fingerprint each review as a hash of (author name + review text + rating); only insert fingerprints not already stored, so re-running daily doesn't duplicate rows.
- **Cadence**: once a day is plenty at 3 branches.
- **Where it runs**: a standalone script for now (this repo, run manually or via cron on your machine), writing to Supabase directly with the service role key. Could move onto `whatsapp-gateway`'s host later since that's already always-on — not doing that yet.
- **Worth having in writing**: scraping Google Maps' pages directly sits outside Google's Terms of Service — their sanctioned path is the paid Places API. For checking your own three listings once a day the practical risk is low, but it isn't authorized by Google. That's your call to make, not mine, so flagging it plainly before building anything.

## 5. Draft schema — `GoogleReview` (not applied)

```sql
create table "GoogleReview" (
  id             text primary key,
  "branchId"     text not null references "Branch"(id),
  "placeUrl"     text not null,
  "authorName"   text not null,
  rating         integer not null check (rating between 1 and 5),
  "relativeTime" text,               -- Google's own phrasing, e.g. "2 weeks ago"
  "reviewText"   text,
  "ownerReply"   text,
  fingerprint    text not null,      -- dedup key: hash(author + reviewText + rating)
  "scrapedAt"    timestamp without time zone not null default now(),
  "createdAt"    timestamp without time zone not null default now(),
  unique ("branchId", fingerprint)
);

create index on "GoogleReview" ("branchId", "scrapedAt" desc);

alter table "GoogleReview" enable row level security;
-- policies would mirror rls_role_branch_scoping (branch-scoped read for managers, full for owner)
```

## 6. Draft schema — `BranchDailyReport` (future, not building now)

```sql
create table "BranchDailyReport" (
  id                text primary key,
  "branchId"        text not null references "Branch"(id),
  date              date not null,
  cash              integer not null default 0,
  upi               integer not null default 0,
  card              integer not null default 0,
  "invoicesRaised"  integer not null default 0,
  "invoicesPending" integer not null default 0,
  "stockAlerts"     text,
  "staffTotal"      integer not null default 0,
  "staffPresent"    integer not null default 0,
  "staffAbsent"     integer not null default 0,
  "staffLate"       integer not null default 0,
  "staffNote"       text,
  "newClients"      integer not null default 0,
  "avgRating"       text,
  "reviewNote"      text,
  "apptDone"        integer not null default 0,
  "apptCancel"      integer not null default 0,
  "apptNoShow"      integer not null default 0,
  "apptTomorrow"    integer not null default 0,
  "preparedBy"      text,
  "createdAt"       timestamp without time zone not null default now(),
  unique ("branchId", date)
);
```

This mirrors the fields already in `Operations/daily_briefing.py` field-for-field, so moving off SQLite later is a straight export, not a rebuild.

## 7. What I need from you before building anything

1. Go-ahead to actually create `GoogleReview` (I'd run it as a migration through the Supabase MCP — you'd see it before/as it's applied, nothing silent).
2. A decision on the ToS point in §4 — proceed anyway, or hold off.
3. Confirmation on the three listing URLs — want me to resolve/verify them, or will you send the correct ones?
4. Where the scraper should live long-term (this repo for now is my default assumption — say so if you'd rather somewhere else).
