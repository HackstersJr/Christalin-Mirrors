# MVP — Current Reality

**Agent A — Current Reality Verifier** · 2026-07-23
Status: verified, then **changed by this session's implementation**. Both states recorded.

---

## A.1 The claim, verified

> "Backend is mostly present, frontend is mostly localStorage, integration is the main gap."

**Confirmed, three independent ways:**

1. **Grep** for `adminApi|publicApi|axios|fetch(|lib/api` across `Frontend/src` — the only hits were inside `api.ts` defining itself, plus one `emailjs.sendForm`.
2. **Graphify import graph** — `adminApi`/`publicApi`/`config` sat in a 3-node community with **zero inbound edges**.
3. **Store census** — 65 `*Store.*` calls across 14 files, every one hitting `localStorage`.

The gap was not partial. It was total: **the backend had zero consumers.**

---

## A.2 What was already built (and correct)

| Area | State before | Verdict |
|---|---|---|
| Prisma schema | 14 models, 8 enums, 20 FKs, 10 unique indexes | Solid. Unchanged by this work. |
| Route surface | 40 admin + 3 public + 4 auth endpoints | Nearly complete; only `service-visits` was missing. |
| Layering | route → controller → service → Prisma, no shortcuts | Clean. Graphify confirmed no layer-skipping. |
| Zod validation | schemas for every write | Present, but non-strict and body-only. |
| Money storage | integer paisa throughout | Correct choice, kept. |
| Frontend UI | 14 admin pages, landing site | Genuinely good. Not redesigned. |
| Error taxonomy | `AppError` + 6 subclasses | Well designed but **unreachable** until Task 1. |

## A.3 What was fake

| Thing | Before | Now |
|---|---|---|
| Admin login | `Login.tsx` ignored the password, wrote the literal string `'dev-token'` | Real `POST /auth/login`, JWT verified by `GET /auth/me` |
| Route protection | `ProtectedRoute` checked only that *a* token string existed | Verifies against the backend; forged/expired tokens fail |
| All business data | `localStorage`, seeded from `mockData.ts` | Postgres via the API |
| Invoice totals | computed in the browser (`Billing.tsx:71-76`) | computed server-side in `utils/money.ts` |
| Paid side effects | stock decrement + visit count in the browser | one server transaction |
| Invoice numbers | `max+1` scan of localStorage | server sequence inside the transaction |
| Public contact form | EmailJS with `'YOUR_SERVICE_ID'` placeholders — **threw on every submit** | `POST /api/public/contact` |
| `mockData.ts` | 96 lines seeding localStorage | **deleted** |

## A.4 Contract mismatches found, and how each was resolved

| # | Mismatch | Resolution |
|---|---|---|
| D1 | Frontend modelled branch as a **display name**; API needs a **cuid** | `store.ts` caches the branch list and resolves name → id; server derives it from the token for non-owners regardless |
| D2 | Invoice lines carried no `serviceId` — nothing to price against | Added `serviceId` to `InvoiceItem`; set in `Billing.updateItem`, `applyAppointment`, `Invoices.updateItem` |
| D3 | Frontend had `discountType: percent\|flat`; backend had only `discountPercent` | API now takes `discount: {type, value}` |
| D4 | Frontend rounded in **rupees**, backend stores **paisa** | Centralised in `utils/money.ts`; see the three-way discrepancy in §A.6 |
| D5 | `Invoice.dueDate` in frontend types, no DB column | Left alone — unused by any page |
| D8 | Enum casing (`'paid'` vs `PAID`) | Mappers kept on both sides; deliberately not "fixed" |
| G1/G2 | `ServiceVisit` was write-only — no read endpoint | Added `GET /admin/service-visits` |
| G3 | `getNextInvoiceNumber()` client-side | Removed; server owns it |
| G6 | No refresh-retry in the axios interceptor | Moot — refresh tokens deleted for v1 |

## A.5 Why this was the fastest path, and why not a rebuild

**Recommendation:** Keep the existing backend and frontend; rewrite `store.ts` as an API-backed adapter with identical function names.
**Why:** Every page used the same shape — `const reload = () => setX(store.getAll())`. Making the store async turned each page's integration into a one-line change instead of a rewrite. The backend's `mapToFrontend` functions already emitted the exact shapes the frontend types declare, because it was built against them. 14 pages were wired without touching a single component's JSX.
**Why not:** Do not rebuild the backend — it was ~85% correct, and the defects were concentrated in four specific places (money, branch scope, stock, auth), all of which were fixable in place.
**Alternatives rejected:** (a) Rebuild the API to match `types.ts` exactly — would have enshrined browser-computed totals. (b) React Query hooks per page — a bigger diff and a new pattern in 14 files for no v1 benefit. (c) Keep localStorage with a sync layer — two sources of truth.
**Risk:** The store adapter is now a chokepoint; a bug there affects every page.
**Verification:** Frontend builds clean; zero `localStorage` business-data reads remain; `mockData.ts` deleted and nothing imports it.

## A.6 A real discrepancy this uncovered

Writing the money golden tests surfaced that **one seeded invoice has three different "correct" totals** in this codebase:

| Source | Tax | Total |
|---|---|---|
| `seed.ts` hardcoded | ₹858.00 | ₹5628.00 |
| `Billing.tsx` (`Math.round` at rupee precision) | ₹859.00 | ₹5629.00 |
| New engine (exact, paisa precision) | ₹858.60 | ₹5628.60 |

₹4770 × 18% = ₹858.60 exactly — no rounding is even required. The older two numbers are simply lossy: the seed truncated, the frontend rounded up. **This is why Q8 needs an accountant**, and why the rule now lives in exactly one file with golden tests pinning it.

---

## A.7 Current endpoint inventory

**Public:** `GET /health` · `GET /public/branches` · `GET /public/services` · `POST /public/contact` (rate-limited 5/hr, honeypot, length-capped) · `POST /auth/login` (rate-limited 10/15min)

**Authenticated:** `POST /auth/logout` (204, client discards token) · `GET /auth/me`

**Admin, all branch-scoped in the service layer:**
`dashboard/stats` · `dashboard/alerts` · `branches` · `staff` · `clients` · `services` · `appointments` · `invoices` · `inventory` · `inventory/low-stock` · `service-visits` (new, read-only) · `settings`
