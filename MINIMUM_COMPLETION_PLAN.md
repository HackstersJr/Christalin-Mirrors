# Minimum Completion Plan

Scope: get Christalin Mirrors to a state the salon can actually use, safely. Not
"every finding closed" — the smallest set that makes the product real.

Assumed context, correct me if wrong: 2 branches, ~5 staff, 1 owner, staff are
trusted employees, the site is internet-facing (there's a `Dockerfile`, `nginx.conf`,
and `cloudflared-config.yaml` in `Frontend/`).

---

## What "complete" means here

The owner can log in, see real data shared across devices, book appointments, bill a
client, and have stock and revenue come out right. Nothing on the public internet is
trivially abusable.

That's it. Everything below is measured against that bar.

---

## The honest picture

| Layer | State |
|---|---|
| Backend API | ~85% done. Tasks 1–2 shipped: errors reachable, migrations safe, seed non-destructive. |
| Frontend UI | ~95% done. Genuinely nice. |
| **The two connected** | **0%.** No page calls the API. Everything is `localStorage`. |
| Auth | Backend real. Frontend fake — any password works. |

The single biggest risk is not on the backend findings list: **the deployed admin
panel lets anyone in.** `Login.tsx:10-15` ignores the password and writes the string
`'dev-token'`. Today that only exposes the intruder's own browser data, so nothing
real leaks — but it is the first thing to fix and it must land with integration.

---

## Plan — 6 steps, roughly 2–3 weeks

Ordered so each step leaves the app working.

### Step 1 — Simplify auth, then wire login end-to-end · ~2 days

**Backend:** bump the access token from 15m to 12h. **Delete the refresh mechanism
for v1** — `/auth/refresh`, `User.refreshToken`, the bcrypt hashing of it.

**Frontend:** make `Login.tsx` actually `POST /api/auth/login`, store the returned
token, and have `ProtectedRoute` verify it via `GET /auth/me` instead of checking a
string exists.

**Recommendation:** Drop refresh tokens entirely; issue a 12-hour access token.
**Why:** It deletes the H4 bcrypt-truncation bug, the missing `RefreshToken` table, the
rotation logic, *and* the frontend refresh-retry interceptor that doesn't exist yet —
four problems removed by writing less code. A 12-hour token plus a logout button is
appropriate for five trusted staff on a shift.
**Why not:** Don't keep 15-minute tokens without building refresh-retry — that logs the
cashier out mid-invoice. And don't keep the current refresh code: rotation silently
revokes nothing, so a stolen 7-day refresh token is *worse* than a 12-hour access token.
**Alternatives rejected:** Full `RefreshToken` table with SHA-256 and family revocation
(right for a larger product, ~2 days for a benefit nobody here can perceive);
frontend-only refresh-retry (keeps the broken revocation).
**Risk:** A stolen token is valid up to 12 hours with no revocation. Accepted at this
team size; revisit when staff count or turnover grows.
**Verification:** Log in with a wrong password → 401. Log in correctly → land on the
dashboard. Clear the token → bounced to login.

---

### Step 2 — Server-authoritative money · ~3 days

The one place "good enough" isn't. It's a billing system; if totals come from the
browser, the books are whatever the browser says.

- Invoice request carries `{serviceId | productId, quantity}` and a discount — **no
  prices, no totals**.
- Server resolves `ServiceBranch.priceOverride ?? Service.price` (this activates
  per-branch pricing, already modelled and currently unused), computes in integer
  paisa, half-up rounding at two points: discount, then tax.
- Server owns `invoiceNumber`; frontend stops generating it.
- `Billing.tsx` keeps its live preview arithmetic for the cashier, but the server's
  returned total is what gets displayed on the confirmation screen and recorded.

**Blocked on:** the rounding rule (Q8) — GST on post-discount amount? half-up? Needs
whoever files the GST returns, not me.

---

### Step 3 — Stock and payment correctness · ~1 day

Two small, high-value fixes in `executePaidSideEffects`:

- **Atomic decrement that rejects oversell.** Currently `Math.max(0, stock - qty)`
  silently swallows selling 10 units of a 3-unit item. Replace with a conditional
  `updateMany({where: {id, currentStock: {gte: qty}}})` and throw `BadRequestError`
  when it matches nothing.
- **Idempotent paid transition.** The DRAFT→PAID guard currently reads outside the
  transaction, so a double-clicked "Collect Payment" decrements stock twice. Move the
  check into a conditional `updateMany` so the database arbitrates.

~15 lines each. Cheapest correctness wins available.

---

### Step 4 — Branch scoping · ~2 days

Thread `TokenPayload` as the first argument of every service method; merge
`branchScope(ctx)` into every read; convert `findUnique({where:{id}})` to
`findFirst({where:{id, ...scope}})`. Owner sees everything, everyone else sees their
branch. Delete the unused `enforceBranchScope` middleware.

**Recommendation:** Do this even though the staff are trusted.
**Why:** Without it, "multi-branch" is a label rather than a behaviour — Kalaburagi
staff see Bengaluru's clients, invoices, and cost prices. It's mechanical work, not
hard work, and retrofitting it after the frontend depends on unscoped responses is
much worse.
**Why not:** Don't defer it to "after launch" — every page built against unscoped data
is a page that changes behaviour when scoping lands.
**Alternatives rejected:** Route middleware (can't protect `:id` routes); Postgres RLS
(right ceiling, wrong phase — application scope closes the actual hole).
**Risk:** Touches ~40 call sites; a missed one is a silent leak, not a test failure.
**Verification:** A CI grep banning `findUnique` in `src/services/`, plus a spot check
per resource that a non-owner gets 404 for another branch's record.

---

### Step 5 — Public-facing hardening · ~half a day

`helmet()`, `express-rate-limit` (tight on `/auth/login` and `/public/contact`,
generous elsewhere), `app.set('trust proxy', 1)` since you're behind Cloudflare,
`.max()` on `contactSchema.message` and `createInvoiceSchema.items`, drop the unused
`cors credentials` and `x-powered-by`.

Also fix the public contact form — it currently throws on every submit because
`Contact.tsx:34-37` still has `'YOUR_SERVICE_ID'` placeholders. Either configure
EmailJS or point it at the backend's `POST /api/public/contact`, which already exists.

---

### Step 6 — Frontend integration · ~1 week

The big one. Replace 65 `*Store.*` calls across 14 pages with API calls. `src/lib/api.ts`
and `@tanstack/react-query` are already installed and configured — they were built for
exactly this and never wired up.

Two blockers to clear first:
- **Branch is a name, not an id.** The frontend has `branch: "CM — Bengaluru"`; the API
  needs `branchId`. Source it from `GET /auth/me` once per session. Non-owner writes
  should take it from the token, not the body.
- **Invoice lines have no `serviceId`.** The item picker must carry ids for Step 2 to
  price anything.

Two small backend additions this needs:
- `GET /admin/service-visits?clientId=` — `ServiceVisit` rows are written by the invoice
  pipeline and currently cannot be read back, so `ClientDetail.tsx`'s history tab has no
  data source.
- Seed 2–3 extra staff logins. There are no user-management endpoints; building CRUD for
  a 5-person salon is not worth it yet.

Do one page end-to-end first (Clients is simplest) before converting the rest.

---

## Deliberately cut

Each of these is a real improvement. None is needed for the salon to use the product.

| Cut | Why it can wait | Revisit when |
|---|---|---|
| Audit log | 5 staff, owner knows everyone | headcount grows or a dispute happens |
| Void / soft-delete | paid invoices already can't be deleted | accountant asks for it |
| `tokenVersion` revocation | 12h tokens + small team | staff turnover |
| Postgres RLS | app-layer scoping closes the hole | second team touches the services |
| Idempotency keys | Step 3 covers the dangerous path | duplicate invoices actually observed |
| OpenAPI generation | one frontend, one backend, same repo | a second client appears |
| Cursor pagination | offset is fine under ~50k rows | it isn't |
| User management CRUD | seed the 3 logins needed | staff churn makes seeding annoying |
| Cloudinary uploads | no UI for it; make env vars optional so CI can boot | you want staff photos |
| Structured logging (`pino`) | `console` is survivable at this size | first production incident you can't trace |

---

## Order and totals

```
1. Auth simplify + real login      2 days   ← unblocks everything
2. Server-side money               3 days   ← blocked on Q8
3. Stock + idempotency             1 day
4. Branch scoping                  2 days
5. Public hardening              0.5 days
6. Frontend integration            5 days   ← the actual bulk
                                  ─────────
                                  ~14 working days
```

Steps 1–5 are backend and can proceed now. Step 6 is where the project becomes real.

## Before starting

- **Q8 — the rounding rule.** Hard blocker on Step 2. GST on post-discount? Half-up?
- **Confirm the assumed context** at the top — if this is heading for franchise use with
  many branches and untrusted staff, several "cuts" above move back in.
- **Provision a Postgres database.** Nothing has run against a real one yet; the Task 2
  migration baseline is structurally verified but not round-tripped. Read
  `Backend/prisma/migrations/README.md` before applying — the wrong command against an
  existing database fails or destroys.
