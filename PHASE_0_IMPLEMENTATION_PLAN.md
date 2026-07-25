# PHASE 0 — Implementation Plan

**Agent E — Billing Contract Analyst** · **Agent F — Phase 1 Readiness Planner**
Date: 2026-07-23 · Status: **Tasks 1–2 approved and shipped. Tasks 3–8 awaiting approval.**

> **Progress — updated 2026-07-23 after Task 2**
>
> | Task | State | Notes |
> |---|---|---|
> | 1 — asyncHandler + pagination NaN | ✅ **done** | 47/47 handlers wrapped, 0 unwrapped. `npm run check` passes. Closes C3. |
> | 2 — migration baseline + safe seed | ✅ **done** | `0_init` = 14 tables / 8 enums / 20 FKs / 10 unique indexes. Seed idempotent, env password, production guard. Closes L22. **Not verified against a live DB — no Postgres on this machine.** |
> | 3–8 | ⏸ not started | Task 3 needs Q1 + Q7; Task 6 hard-blocked on Q8. |
>
> **Carried forward from Task 2:** Q6's suggested default (a `(branchId, phone)` index)
> was **not** applied, because Q6 was never answered. It is no longer free — it now needs
> its own migration instead of riding along in the baseline. See `PHASE_0_OPEN_QUESTIONS.md`.

---

## P.0 Guiding constraint

Agent A established the backend has **zero consumers**. That buys freedom to design correctly, and it removes the excuse for a big-bang rewrite: with no users to migrate, there is no reason to bundle risk. Phase 1 is therefore **eight small, independently reviewable, independently revertable tasks**, not one refactor.

Ponytail discipline applied throughout. Explicitly **not** in Phase 1, with the trigger that would pull each one in:

| Deferred | Why not now | Pull in when |
|---|---|---|
| Postgres RLS | Application scope closes the hole; RLS is a second belt costing a policy per table | A second team touches the services, or an audit requires it |
| Repository / domain / presenter split | 8 services × ~100 lines. Layering that would add files, not remove risk | A service exceeds ~400 lines |
| OpenAPI generation from Zod | No consumer yet — the frontend is not integrated | Phase 2, alongside integration |
| Cursor pagination | Offset is fine at current volume | Invoices exceed ~50 k rows |
| `crud(service)` controller factory | Correct cut, but the file is rewritten in Task 3 anyway | Do it *as part of* Task 3, not before |
| Express 5 upgrade | `asyncHandler` gets the same result in 4 lines with no surface change | Next major dependency window |
| Redis / job queue / cache | Nothing needs them | Never, on current requirements |

---

## P.1 Recommended stack — keep what exists

| Concern | Decision | Rationale |
|---|---|---|
| Runtime / framework | **Keep** Node + Express 4 | Express 5 buys only async-error handling; `asyncHandler` is 4 lines |
| ORM | **Keep** Prisma 6 | Already correct; the gap is migrations, not the ORM |
| Validation | **Keep** Zod — add `.strict()`, extend to params/query | The schemas already exist and are good |
| Password hashing | **Keep** bcryptjs cost 12 **for passwords only** | Correct primitive, wrong application (H4) |
| Refresh tokens | **Change** → `crypto.randomBytes(32)` + `crypto.createHash('sha256')` | Both are Node stdlib. No new dependency |
| Rate limiting | **Add** `express-rate-limit` | ~40 lines to hand-roll badly; the standard is one dep |
| Security headers | **Add** `helmet` | Same reasoning |
| Logging | **Keep** `console` in Phase 1; defer `pino` | Structured logging is real work; not a security fix |
| Testing | **Add** `vitest`; point it at `DATABASE_URL_TEST` | No test infrastructure exists at all. Testcontainers was cut by the Ponytail review — it makes Docker a hard prerequisite on a Windows dev box, and `prisma migrate deploy` against a test database in a global setup hook does the same job with 0 extra deps |

**Net new runtime dependencies: 2** (`helmet`, `express-rate-limit`). Everything else is stdlib or already installed.

**Recommendation:** Add exactly two runtime dependencies and use Node stdlib for token generation and hashing.
**Why:** `crypto.randomBytes` and `crypto.createHash` are stdlib and are precisely the right primitives for a high-entropy bearer token. Reaching for a token library would add a dependency for two function calls.
**Why not:** Do not hand-roll rate limiting or security headers — both have non-obvious edge cases (proxy handling, header interactions) where a well-tested library is genuinely cheaper than the bugs.
**Alternatives rejected:** `jose`/`paseto` for refresh tokens (opaque random strings need no token format at all); a custom in-memory limiter (does not survive multiple instances).
**Risk:** Two new deps to keep patched.
**Verification:** `npm ls --prod --depth=0` shows exactly two additions.

---

## P.2 Agent E — Billing contract

### E.1 Current frontend invoice payload

From `Billing.tsx:71-76,170-186` — all arithmetic runs **in the browser, in rupees**:

```ts
item.total      = item.unitPrice * item.quantity
subtotal        = items.reduce((sum, i) => sum + i.total, 0)
discountAmount  = discountType === 'percent' ? Math.round(subtotal * (discountValue/100)) : discountValue
taxableAmount   = subtotal - discountAmount
taxAmount       = Math.round(taxableAmount * (taxPercent/100))
total           = taxableAmount + taxAmount
```

and the object handed to `invoiceStore.create`:

```jsonc
{
  "invoiceNumber": "CM-INV-0007",   // client-generated — max+1 scan of localStorage
  "clientId": "...", "clientName": "...", "clientEmail": "...", "clientPhone": "...",
  "date": "2026-07-23",
  "items": [ { "service": "Korean Glass Skin Facial",   // NAME ONLY — no serviceId
               "description": "Product", "quantity": 1,
               "unitPrice": 2500, "total": 2500, "productId": "itm-..." } ],
  "subtotal": 2500, "discountPercent": 10, "discountAmount": 250,
  "taxPercent": 18, "taxAmount": 405, "total": 2655,
  "amountPaid": 2655, "status": "paid", "paymentMethod": "cash",
  "branch": "CM — Bengaluru",       // NAME, not id
  "stylist": "Priya", "notes": "..."
}
```

The frontend also performs the paid side effects locally — `totalVisits` increment (`Billing.tsx:195`) and stock decrement (`:224-225`). **The backend's `executePaidSideEffects` is a direct port of this browser code**, which is why it inherits client-trusted totals. C2 is a design lineage, not an accident.

### E.2 Unsafe client-trusted fields

| Field | Today | Must become |
|---|---|---|
| `unitPrice` | client | **server** — `ServiceBranch.priceOverride ?? Service.price`, or `InventoryItem.retailPrice` |
| `items[].total` | client | **server** — `unitPrice × quantity` |
| `subtotal` | client | **server** — Σ line totals |
| `discountAmount` | client | **server** — derived from a validated discount input |
| `taxPercent` | client (defaults 18) | **server** — from `SalonSettings` |
| `taxAmount` | client | **server** |
| `total` | client | **server** |
| `amountPaid` | client | **client-supplied but validated** — cash tendered is real input; must be ≤ `total` and drive `status` |
| `invoiceNumber` | client | **server** — already correct; frontend must stop sending it |
| `branch` (name) | client | **server** — from `AuthContext`; owner may pass explicit `branchId` |
| `status: 'paid'` | client, ungated | **role-gated** (Q1) |

### E.3 Proposed safe invoice request

```jsonc
POST /api/admin/invoices
{
  "clientId": "cmx..." | null,                 // null = walk-in
  "walkInName": "Anita",                       // required only when clientId is null
  "walkInEmail": "a@b.com", "walkInPhone": "+91...",
  "date": "2026-07-23",
  "items": [
    { "kind": "service", "serviceId": "cmx...", "quantity": 1, "notes": "..." },
    { "kind": "product", "productId": "cmy...", "quantity": 2 }
  ],
  "discount": { "type": "percent", "value": 10 },   // or {"type":"flat","value":250}
  "staffId": "cmz..." | null,
  "status": "DRAFT" | "PAID",
  "paymentMethod": "CASH" | "CARD" | "UPI" | "OTHER",   // required iff PAID
  "amountPaid": 2655,                                    // required iff PAID
  "appointmentId": "cma..." | null,
  "notes": "...",
  "branchId": "cmb..."                                   // OWNER only; ignored otherwise
}
```

No money in, except `amountPaid`. No names where an id belongs. No totals.

### E.4 Proposed safe invoice response

Unchanged from today's `mapToFrontend` shape — rupees out, lowercase enums, `branch` as a display name — **plus** the fields the client can no longer compute:

```jsonc
201 {
  "id": "cmi...", "invoiceNumber": "CM-INV-0007",
  "clientId": "...", "clientName": "...", "clientEmail": "...", "clientPhone": "...",
  "date": "2026-07-23",
  "items": [ { "serviceId": "...", "service": "Korean Glass Skin Facial",
               "description": null, "quantity": 1,
               "unitPrice": 2500, "total": 2500, "productId": null } ],
  "subtotal": 2500,
  "discountPercent": 10, "discountAmount": 250,
  "taxPercent": 18,      "taxAmount": 405,
  "total": 2655, "amountPaid": 2655,
  "status": "paid", "paymentMethod": "cash",
  "branch": "CM — Bengaluru",
  "stylist": "Priya", "notes": "...",
  "createdAt": "...", "appointmentId": null
}
```

Keeping the response shape stable means the frontend's *display* code survives; only its *submission* code changes.

> Ponytail review cut two proposed additions here. `changeDue` — `Billing.tsx:76`
> already computes `amountReceived - total` from fields it holds. `branchId` —
> Agent A sources it from `GET /auth/me` once per session, so repeating it on every
> invoice is redundant. The response is now *identical* to today's `mapToFrontend`
> output, which means **zero frontend display changes**; only submission changes.

### E.5 The rounding rule — must be pinned before any code

Frontend rounds in **rupees**; backend stores **paisa**. Recomputing server-side without a fixed rule will produce totals that differ from the mock data by up to a rupee per invoice.

**Proposed rule (Q8 — needs sign-off):** all arithmetic in integer paisa, half-up rounding applied at exactly two points:

```
lineTotal      = unitPricePaisa * quantity                    // exact, no rounding
subtotal       = Σ lineTotal                                  // exact
discountAmount = round_half_up(subtotal * pct / 100)          // ROUNDING POINT 1
taxable        = subtotal - discountAmount
taxAmount      = round_half_up(taxable * taxPct / 100)        // ROUNDING POINT 2
total          = taxable + taxAmount
```

Same order of operations as the frontend, one granularity finer. GST is computed on the post-discount amount, matching current behaviour.

### E.6 Fields requiring frontend adjustment

| # | Change | Effort |
|---|---|---|
| F1 | Send `serviceId`/`productId` per line, not a name (D2) | **High** — the item picker must carry ids |
| F2 | Stop computing `subtotal`/`tax`/`total` for submission; keep computing for *live preview* only | Medium — display math stays, submit math goes |
| F3 | Stop calling `getNextInvoiceNumber()`; read `invoiceNumber` from the response (G3) | Low |
| F4 | Send `discount: {type, value}` instead of `discountPercent`+`discountAmount` (D3) | Low |
| F5 | Stop sending `branch` name; rely on server (D1) | Low |
| F6 | Remove client-side `totalVisits` increment and stock decrement — the server owns these | Medium — delete `Billing.tsx:195,224-225` |
| F7 | Handle new `400 INSUFFICIENT_STOCK` (M11) | Low |
| F8 | Surface server totals in the success screen instead of local `total` | Low |

**Recommendation:** Have the frontend keep its live-preview arithmetic and treat the server response as authoritative on submit.
**Why:** The preview is a UX requirement (the cashier sees the total before collecting payment) and cannot round-trip to the server per keystroke. Keeping both, with the server winning at commit time, satisfies both needs.
**Why not:** Do not let the previewed total be the recorded total — that is C2 restated.
**Alternatives rejected:** A `POST /invoices/quote` endpoint called on every change (chatty, adds latency to the till); server-rendered totals only (unusable UI).
**Risk:** Preview and server can disagree if the rounding rule drifts. Mitigate by returning `total` in the response and having the UI display the server value on the confirmation screen, so any drift is visible immediately rather than silently recorded.
**Verification:** A shared golden-value fixture (same inputs, same expected total) asserted in both a backend unit test and a frontend test.

---

## P.3 Agent F — Phase 1 task sequence

Strict order. Each task is one PR, independently revertable. **Do not reorder** — the dependencies are real.

### Task 1 — Make errors reachable *(fixes C3)*

- **Files:** `src/utils/asyncHandler.ts` (new), `src/routes/index.ts`, `src/utils/pagination.ts:18`, `src/index.ts`
- **Migrations:** none · **Contract change:** none
- **Why first:** 11 `NotFoundError` throws and both pagination helpers (8 callers each) are currently unreachable. Every later task needs to see its own errors.
- **Tests:** nonexistent id → 404; `?page=abc` → 422; process alive after both.
- **Risk:** minimal.

### Task 2 — Migration baseline + safe seed *(fixes L22)*

- **Files:** `prisma/migrations/**` (new), `prisma/seed.ts`, `package.json`
- **Migrations:** initial baseline captured from the current schema — **no schema change**
- **Why second:** `schema.prisma` is frozen until this lands (see Graphify §C.5). Every later task adds migrations.
- **Detail:** `prisma migrate dev --create-only --name init`; rewrite the seed to `upsert`, read `SEED_OWNER_PASSWORD` from env, and `process.exit(1)` if `NODE_ENV === 'production'`.
- **Tests:** `migrate deploy` against an empty DB reproduces the schema; seed run twice is idempotent; seed refuses with `NODE_ENV=production`.
- **Risk:** **Highest-consequence task in the plan.** Take a database backup first.

### Task 3 — `AuthContext` + data-layer branch scope *(fixes C1, H6)*

- **Files:** `src/auth/scope.ts` (new), all 8 `src/services/*.ts`, both controller files, `src/routes/index.ts`; delete `src/middleware/rbac.ts:22-35`
- **Migrations:** none · **Contract change:** yes — writes stop honouring body `branchId` for non-owners
- **Note:** collapse `domainControllers.ts` into a `crud(service)` helper **in this task**, per the Ponytail audit — the file is being rewritten anyway.
- **Tests:** the 8 resources × 3 roles matrix; CI grep asserting no `findUnique` in `src/services/`.
- **Risk:** largest diff. A missed call site is a silent leak — hence the grep gate.

### Task 4 — Strict validation across body, params, query *(fixes M8, part of C3)*

- **Files:** `src/middleware/validate.ts`, `src/validators/schemas.ts`, `src/routes/index.ts`
- **Migrations:** none · **Contract change:** unknown fields now 422 instead of being silently dropped
- **Detail:** `validate({body?, params?, query?})`; `.strict()` everywhere; `z.string().cuid()` on `:id`; `.max()` on every unbounded string/array (notably `contactSchema.message` and `createInvoiceSchema.items`).
- **Tests:** unknown field → 422 and no write; malformed `:id` → 422; oversized contact message → 422.

### Task 5 — Auth hardening *(fixes H4, M7, L14)*

- **Files:** `prisma/schema.prisma` (+`RefreshToken`, +`User.tokenVersion`, −`User.refreshToken`), `src/services/authService.ts`, `src/utils/jwt.ts`, `src/middleware/auth.ts`
- **Migrations:** yes · **Contract change:** none in shape; **frontend must add refresh-retry (G6)**
- **Detail:** opaque `randomBytes(32)` refresh tokens stored as SHA-256; rotation sets `revokedAt` + `replacedById`; reuse of a revoked token revokes the whole family; `tokenVersion` in the JWT compared per request; pin `algorithms:['HS256']`, `issuer`, `audience`; dummy bcrypt compare on login miss.
- **Tests:** replay a rotated token → 401 + family revoked; `tokenVersion` bump invalidates immediately; login timing within tolerance for hit vs miss.
- **Risk:** invalidates existing sessions — acceptable, one seeded user.

### Task 6 — Server-authoritative billing *(fixes C2, M10, M11)*

- **Files:** `src/services/invoiceService.ts` (export a pure `computeInvoice()` from here — Ponytail cut the one-file `src/pricing/` directory), `src/validators/schemas.ts`
- **Migrations:** none · **Contract change:** **largest** — F1–F8 above
- **Detail:** price resolution from `ServiceBranch.priceOverride ?? Service.price` / `InventoryItem.retailPrice`; the §E.5 rounding rule; conditional `updateMany` for the PAID transition; atomic stock decrement with `currentStock: {gte: qty}` rejecting on `count === 0`.
- **Cut by Ponytail review:** the `Idempotency` table and `Idempotency-Key` header. The conditional `updateMany` already makes the dangerous path — the PAID transition — idempotent. A double-submitted *create* produces two visible DRAFT invoices: a nuisance, not corruption. Recorded in the debt ledger; add if duplicates are actually observed.
- **Tests:** inflated/deflated price rejected in favour of catalogue price; golden rounding fixture; two concurrent PAID transitions → one decrement, one `ServiceVisit`; oversell → 400; `priceOverride` honoured. `computeInvoice()` is a pure function, so the golden fixture needs no database.
- **Risk:** highest business risk. Land only after Tasks 1–5, with RC2's golden test written **first**.

### Task 7 — Audit log + void semantics *(fixes M12)*

- **Files:** `prisma/schema.prisma` (+`AuditLog`, +`deletedAt`, +`VOID` status), `src/utils/prisma.ts` (client extension), all services
- **Migrations:** yes · **Contract change:** DELETE becomes void for invoices
- **Detail:** `AuditLog { id, actorId, action, entity, entityId, at }` only. Ponytail cut the `before`/`after` JSON snapshots — who-did-what-to-which answers the disputes that motivate an audit log; add diffs when a real dispute needs one.
- **Tests:** every mutation writes exactly one audit row in the same transaction; a rolled-back transaction writes none; voided invoices excluded from revenue aggregates.

### Task 8 — HTTP hardening + operability *(fixes H5, M9, M13, L17, L20)*

- **Files:** `src/app.ts`, `src/config/cors.ts`, `src/index.ts`, `src/services/settingsService.ts`, `src/services/contactService.ts` (new)
- **Migrations:** none · **Contract change:** adds 429
- **Detail:** `helmet()`; tiered `express-rate-limit`; `app.set('trust proxy', 1)`; drop `credentials:true` and `x-powered-by`; move contact through a service with a honeypot; `settingsService.update` → `upsert`; SIGTERM drain + `prisma.$disconnect()`.
- **Tests:** 429 after limit; contact honeypot rejects; settings update succeeds on an unseeded DB; SIGTERM drains in-flight requests.

### Optional cleanup — Ponytail audit items

Fold into whichever task touches the file; do not make it a separate PR. Notable: delete `baseUrl`+`paths` from `tsconfig.json` (unused, and clears the deprecation error); delete the dead low-stock query; delete `updateTheme*.cjs`; decide Cloudinary (Q5).

---

## P.4 Strategy summary

**Validation.** Zod at the edge for body + params + query, `.strict()` throughout, bounds on every unbounded field. Services keep explicit `data` objects rather than spreads, so safety does not depend on Zod's stripping behaviour.

**Auth / session.** 15-minute `HS256` access token carrying `{sub, email, role, staffId, branchId, tokenVersion}`, algorithm/issuer/audience pinned. Opaque 32-byte refresh token, SHA-256 at rest, rotating, family-revoking on reuse, in its own table. `tokenVersion` gives immediate revocation. Frontend adds refresh-on-401-then-retry.

**Branch scope.** `AuthContext` threaded as the first parameter of every service method. Reads merge `branchScope(ctx)`; writes derive `branchId` via `writeBranchId(ctx, body.branchId)`. No bare `findUnique` in services, enforced by CI grep. RLS deferred with the ceiling recorded.

**Billing.** Server-authoritative pricing from the catalogue; client sends intent only. Integer paisa with half-up rounding at two fixed points. Idempotency key on create, conditional update on the PAID transition, atomic conditional decrement on stock with an explicit insufficient-stock error.

**Audit / logging.** `AuditLog` written inside the same transaction via a Prisma client extension. Invoices voided, never deleted. Structured logging (`pino`) deferred to Phase 2 — it is operability, not security.

**Testing.** Vitest + Testcontainers Postgres. Mandatory coverage before Phase 1 is called complete: the 8×3 branch-scope matrix; the invoice pricing golden fixture; concurrent PAID transitions; stock at and below zero; refresh-token rotation and reuse; the appointment state machine.

---

## P.5 Approval checklist

Phase 1 may begin when every box is ticked.

**Decisions required** — see `PHASE_0_OPEN_QUESTIONS.md`
- [ ] Q1 — may a RECEPTIONIST mark invoices PAID / apply discounts?
- [ ] Q2 — invoice numbering: global, per-branch, or per-financial-year?
- [ ] Q3 — confirm 15-minute access token + frontend refresh-retry
- [ ] Q4 — who may transfer staff between branches?
- [ ] Q5 — Cloudinary: wire it up or remove it?
- [ ] Q6 — client dedup on email/phone?
- [ ] Q7 — may a MANAGER edit salon settings?
- [ ] Q8 — **sign off the §E.5 rounding rule** (blocks Task 6)

**Scope acknowledgements**
- [ ] Accepted: the frontend is **not** integrated; Phase 1 is backend-only and integration is a separately scoped Phase 2
- [ ] Accepted: `Login.tsx` currently authenticates nobody — must be fixed in the same release as integration
- [ ] Accepted: RLS is deferred with a known ceiling
- [ ] Accepted: 2 new runtime dependencies (`helmet`, `express-rate-limit`)

**Pre-flight**
- [ ] Database backup taken before Task 2
- [ ] Confirmed nobody has run `npm run seed` against a database holding real data
- [ ] `SEED_OWNER_PASSWORD` provisioned; `Admin@1234` rotated wherever it was used
- [ ] Graph re-checked for freshness (`git rev-parse HEAD` vs `9ed1364a`)

**Definition of done for Phase 1**
- [ ] Tasks 1–8 merged, each independently revertable
- [ ] All mandatory tests green
- [ ] CI grep gate active (no `findUnique` in `src/services/`)
- [ ] `BACKEND_REVIEW.md` findings C1–C3, H4–H6, M7–M13, L14–L23 each closed or explicitly deferred in the debt ledger
