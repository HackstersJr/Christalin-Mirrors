# PHASE 0 — Backend Risk Map

**Agent B — Backend Review Mapper** · **Agent D — Security Boundary Analyst**
Date: 2026-07-23 · Baseline: `Backend/BACKEND_REVIEW.md`

---

## B.0 Severity recalibration

The backend review scored findings on intrinsic severity. Agent A established that **the backend currently has zero consumers** — the frontend runs entirely on `localStorage`. That changes *exploitability today* but not *severity at integration*.

Two columns therefore:

- **Sev (intrinsic)** — severity once the backend serves real traffic. This is what Phase 1 must fix.
- **Live today** — whether it is exploitable right now.

**Do not use "Live today: No" to defer a fix.** Every one of these becomes live on the day the frontend is connected, and integration is a single release. The column exists to sequence work inside Phase 1, not to drop it.

One finding moves **up**: C2 (client-trusted totals). The frontend's `Billing.tsx` computes totals in the browser and the backend was evidently modelled on that code — the same arithmetic appears in both. This is a design intent to correct, not an oversight to patch.

---

## B.1 Critical

### C1 — Branch isolation absent; IDOR on every single-resource route

| | |
|---|---|
| **Affected** | `middleware/rbac.ts:22-35` (dead), `routes/index.ts` (all 40 admin routes), all 8 services' `list`/`getById`/`update`/`remove` |
| **Models** | `Client`, `Appointment`, `Invoice`, `InventoryItem`, `Staff`, `ServiceVisit` |
| **Sev (intrinsic)** | CRITICAL |
| **Live today** | No — no consumers |
| **Frontend contract change** | **Yes** — D1 (branch name vs id); writes must stop accepting client `branchId` for non-owners |

**Implementation impact.** Touches every service method signature. `list()` gains an `AuthContext` first parameter and merges a scope into `where`. `getById`/`update`/`remove` convert `findUnique({where:{id}})` → `findFirst({where:{id, ...scope}})`. Controllers pass `req.user`. Roughly 40 call sites across 8 service files + 2 controller files.

**Recommendation:** Enforce branch scope in the service/data layer via a threaded `AuthContext`, and delete `enforceBranchScope`.
**Why:** Middleware sees only the request. It cannot know that invoice `abc123` belongs to Bengaluru without querying, which is precisely why the existing middleware only guards query params and cannot protect `:id` routes at all.
**Why not:** Do not keep route middleware as the primary control — single-resource routes leak regardless. Do not rely on the frontend to send the right `branchId`; a forged body value reopens the hole.
**Alternatives rejected:** Query-param-only checks (the current dead middleware — cannot cover `:id`); frontend filtering (trivially bypassed); Prisma middleware auto-injecting `branchId` (invisible control, breaks legitimate owner-wide queries, hard to test).
**Risk:** Large diff across many files; a missed call site is a silent leak, not a test failure.
**Verification:** A table-driven test asserting, for each of 8 resources × 3 roles, that out-of-scope reads return 404 and out-of-scope writes return 403. Plus a lint rule or review checklist banning bare `findUnique` in services.

---

### C2 — Invoice totals supplied by the client

| | |
|---|---|
| **Affected** | `services/invoiceService.ts:86-121`, `validators/schemas.ts:110-139`, `routes/index.ts:97` (no `requireRole`) |
| **Models** | `Invoice`, `InvoiceItem`, `Service`, `ServiceBranch`, `InventoryItem`, `ServiceVisit` |
| **Sev (intrinsic)** | CRITICAL |
| **Live today** | No |
| **Frontend contract change** | **Yes — largest one.** See Agent E. |

**Implementation impact.** Rewrite `invoiceService.create` to compute every monetary field server-side. Requires D2 (line items must carry `serviceId`/`productId`). `ServiceBranch.priceOverride` becomes live for the first time. Tax percent must come from a server source, not the request.

**Recommendation:** Make the server the sole authority on price; the client sends intent (`serviceId`, `quantity`, `discount`), never money.
**Why:** Every downstream number — dashboard revenue, `ServiceVisit` history, month-to-date aggregates — inherits the trust placed in the request body. `POST /invoices` has no role gate, so the lowest-privileged user can write arbitrary financial records.
**Why not:** Do not merely *validate* the client's arithmetic (e.g. assert `total == subtotal - discount + tax`). Internally-consistent-but-wrong prices still pass, so the fraud vector survives.
**Alternatives rejected:** Trust-but-verify against `Service.price` (equivalent work, weaker guarantee); a DB `CHECK` constraint on the sum (catches typos, not tampering).
**Risk:** Changes the invoice request shape — the biggest single frontend rework item. Rounding rule (D4) must be pinned or historical totals will not reproduce.
**Verification:** A test posting inflated and deflated prices asserting the persisted invoice matches catalogue price; a golden-value test fixing the rounding rule.

---

### C3 — Unhandled async rejections: dead error handler + single-request DoS ✅ CLOSED (Task 1)

> **Closed 2026-07-23.** `src/utils/asyncHandler.ts` added; 47/47 handlers wrapped, 0 unwrapped
> (`/health` is sync inline). `parsePagination` NaN-guarded. `unhandledRejection` /
> `uncaughtException` logging added to `index.ts` as a backstop for future unwrapped routes.
> Verified by `src/utils/__checks__/task1.check.ts` (`npm run check`). The `AppError` taxonomy
> — 11 `NotFoundError` throws among them — is now reachable instead of dead code.

| | |
|---|---|
| **Affected** | all 45 handlers in `controllers/*.ts`; `express@^4.21.2`; `utils/pagination.ts:18` |
| **Models** | none |
| **Sev (intrinsic)** | CRITICAL |
| **Live today** | **Yes** — if the API is reachable at all |
| **Frontend contract change** | No |

**Implementation impact.** Smallest fix on this list: one `asyncHandler` helper + wrapping each route registration, or upgrade to Express 5. Plus a two-token guard in `parsePagination`. No schema, no contract change.

**Recommendation:** Add `asyncHandler` and wrap every route; fix `parsePagination` NaN; add `process.on('unhandledRejection')` logging.
**Why:** Express 4 discards rejected promises, so `errorHandler` never runs for service-layer errors and Node's default `--unhandled-rejections=throw` kills the process. `GET /admin/clients?page=abc` is a complete outage with no auth knowledge required.
**Why not:** Do not fix by wrapping each controller body in try/catch — 45 duplicated blocks, and a new route added later silently reintroduces the bug.
**Alternatives rejected:** Upgrading to Express 5 (correct long-term but a larger surface change during a security push — defer); `express-async-errors` (a monkey-patching dependency where 3 lines suffice).
**Risk:** Very low. This is the safest change in the whole plan.
**Verification:** Request a nonexistent id and `?page=abc`; assert 404 and 422 respectively **and** that the process is still alive afterwards.

**This must be task #1.** Until it lands, every other fix is being written against an API that cannot report its own errors.

---

## B.2 High

### H4 — Refresh-token revocation is a no-op (bcrypt 72-byte truncation)

| | |
|---|---|
| **Affected** | `services/authService.ts:29,63,76`; `utils/password.ts`; `User.refreshToken` column |
| **Sev** | HIGH · **Live today:** No |
| **Frontend contract change** | Response shape unchanged; **frontend must add refresh-retry** (gap G6) |

**Implementation impact.** New `RefreshToken` table + migration; drop `User.refreshToken`; refresh tokens become opaque `randomBytes(32)` rather than JWTs; `verifyRefreshToken` disappears in favour of a table lookup.

**Recommendation:** Opaque 256-bit random refresh tokens, stored as SHA-256 digests in a dedicated `RefreshToken` table with `expiresAt`, `revokedAt`, `replacedById`.
**Why:** bcrypt ignores input past 72 bytes. A refresh JWT's first 72 bytes are the fixed header plus part of `sub` — `iat`/`exp` sit far beyond — so every token ever issued to a user hashes identically and the "revoked" branch can never fire. A separate table also fixes the single-device limitation of one column.
**Why not:** Do not keep bcrypt with a truncation workaround (e.g. pre-hashing). bcrypt exists to slow brute force on low-entropy human passwords; a 256-bit random token needs no stretching, and cost-12 twice per refresh is ~500 ms of blocking CPU on an unauthenticated endpoint.
**Alternatives rejected:** Storing the JWT verbatim (readable DB compromise = usable tokens); shortening the JWT under 72 bytes (impossible with claims); keeping one column and accepting single-device (breaks real usage).
**Risk:** Invalidates all existing sessions on deploy. Acceptable — there is one seeded user.
**Verification:** Refresh once, then replay the *old* token; assert 401 and that the whole token family is revoked.

---

### H5 — No rate limiting anywhere

| | |
|---|---|
| **Affected** | `app.ts` (absent), `/auth/login`, `/auth/refresh`, `/public/contact`; `contactSchema.message` unbounded |
| **Sev** | HIGH · **Live today:** **Yes** for `/public/contact` and `/auth/login` |
| **Frontend contract change** | No (adds 429 the client should surface) |

**Recommendation:** `express-rate-limit` with per-route tiers, `app.set('trust proxy', 1)`, and `.max()` bounds on every unbounded string/array.
**Why:** `/auth/login` allows unlimited guessing against a single seeded account. `/public/contact` is an unauthenticated DB write with no length cap, so an attacker controls your disk usage. `createInvoiceSchema.items` has no `.max()`, so one 100 KB body becomes thousands of rows in one long transaction holding the global `InvoiceSequence` lock.
**Why not:** Do not apply one global limiter — auth endpoints need far tighter limits than authenticated list reads, and a single bucket either fails to protect login or throttles normal admin use.
**Alternatives rejected:** WAF/reverse-proxy-only limits (invisible in local/dev, no per-account granularity); CAPTCHA on login (heavy for a staff tool).
**Risk:** `trust proxy` misconfiguration behind a load balancer makes every request share one IP — limiter either useless or bans all users.
**Verification:** Assert 429 after N+1 logins; assert 422 on an over-length contact message; confirm the limiter sees distinct IPs behind the proxy.

---

### H6 — MANAGER can rewrite any staff member's branch, including the OWNER's

| | |
|---|---|
| **Affected** | `routes/index.ts:70`, `validators/schemas.ts:100-108`, `services/staffService.ts:71-74` |
| **Sev** | HIGH · **Live today:** No |
| **Frontend contract change** | Minor — `branchId`/`role` leave the generic staff-update form |

**Recommendation:** Remove `branchId` and `role` from `updateStaffSchema`; expose transfer/role-change as explicit OWNER-only operations; replace the raw `data` spread with an explicit field allowlist.
**Why:** `Staff.branchId` is the source of the `branchId` claim minted at login (`authService.ts:22`). A manager can therefore rewrite the owner's branch binding, and once C1 lands that directly controls what the owner can see.
**Why not:** Do not rely on `Staff.role` being harmless because it is `StaffRole` (a job title) rather than `UserRole` — the two enums share member names and are one refactor away from being confused.
**Alternatives rejected:** Blocking only edits to OWNER-linked staff (special-case logic that misses future privileged roles).
**Risk:** Legitimate staff transfers now need an owner. Confirm that matches how the salon actually operates (Q4).
**Verification:** Assert a MANAGER `PUT /staff/:id` with `branchId` returns 422 (stripped/rejected) and leaves the record unchanged.

---

## B.3 Medium

| ID | Finding | Affected | Live today | FE change | Required response |
|---|---|---|---|---|---|
| **M7** | Access tokens unrevokable; deactivation has ≤15-min lag; `jwt.verify` not algorithm-pinned | `middleware/auth.ts`, `utils/jwt.ts` | No | No | Add `User.tokenVersion` to the payload and compare per request; pin `algorithms:['HS256']`, `issuer`, `audience` |
| **M8** | Mass assignment via raw `data` spread, contained only by Zod's implicit key-stripping | `clientService:87`, `staffService:73`, `branchService:22,27`, `appointmentService:110`, `serviceService:61`, `inventoryService:98` | No | No | `.strict()` on all schemas (422 instead of silent drop) + explicit `data` objects in services |
| **M9** | Raw `req.body` → Prisma on the only unauthenticated write; controller bypasses the service layer | `controllers/domainControllers.ts:88-92` | **Yes** | No | Route through a service, allowlist fields, add honeypot, return `201 {}` not the stored row |
| **M10** | Paid-transition not idempotent — read outside the transaction, guard inside | `invoiceService.ts:132-154` | No | No | Conditional `updateMany({where:{id, status:{not:'PAID'}}})` inside the tx; `Idempotency-Key` on POST |
| **M11** | Stock decrement clamps at 0 silently; read-then-write races | `invoiceService.ts:184-195` | No | Yes — new 400 case | Atomic `updateMany` with `currentStock: {gte: qty}`; reject with `BadRequestError` when count is 0 |
| **M12** | Financial records hard-deleted; `InvoiceItem` cascades; no audit log anywhere | `invoiceService.ts:169-176`, `schema.prisma:254`, all services | No | Yes — `VOID` replaces delete | `deletedAt` + `VOID` status; `AuditLog` written in the same transaction |
| **M13** | No `helmet`, no body limit tuning, `credentials:true` unused, `X-Powered-By` on, `console.error` may log PII | `app.ts`, `config/cors.ts`, `middleware/errorHandler.ts` | **Yes** | No | `helmet()`, drop `credentials`, `disable('x-powered-by')`, structured logging with redaction |

**Recommendation (M8):** Make every Zod object `.strict()` and build explicit `data` objects in services.
**Why:** Today safety rests on an undocumented Zod default (unknown keys are stripped) holding up six write paths. Adding one field to a schema, or calling a service from a path without `validate()`, silently makes it writable.
**Why not:** Do not rely on stripping as the control — it also hides frontend bugs by returning 200 for misspelled fields.
**Alternatives rejected:** A shared `pick()` helper (indirection for what an object literal states plainly).
**Risk:** `.strict()` will 422 requests the frontend currently gets away with — surfaces latent bugs at integration time, which is the point.
**Verification:** POST an unknown field; assert 422 and no write.

**Recommendation (M10/M11):** Let the database arbitrate state transitions and stock via conditional writes.
**Why:** Read-then-write across a transaction boundary is a race. Double-clicks and retries are routine, and the `ServiceVisit.invoiceId` unique constraint only accidentally catches the double-apply when both `clientId` and `staffId` are set — walk-ins double-apply cleanly.
**Why not:** Do not solve this with application-level locks or a mutex — it does not survive multiple instances.
**Alternatives rejected:** `SERIALIZABLE` isolation (retry storms, heavier than needed); optimistic `version` columns (more schema for what a `where` clause already does).
**Risk:** Silent no-op on repeat calls could confuse the UI; return the existing invoice and a clear status.
**Verification:** Fire two concurrent PAID transitions; assert stock decremented once and exactly one `ServiceVisit`.

---

## B.4 Low

| ID | Finding | Affected | Response |
|---|---|---|---|
| **L14** | Login timing oracle enables user enumeration | `authService.ts:12` | Always run a dummy bcrypt compare on lookup miss |
| **L15** | Cloudinary env vars gate boot for a feature wired to nothing | `config/env.ts:12-14`, `middleware/upload.ts` | Make optional and validate lazily, **or** wire up the upload routes (Q5) |
| **L16** | Dead low-stock query; rule duplicated; both load the whole table | `dashboardService.ts:47-59`, `inventoryService.ts:117` | Delete the dead query; one SQL predicate shared by both |
| **L17** | `settingsService.update` 500s on an unseeded DB | `settingsService.ts:32` | `upsert` |
| **L18** | `Decimal` coerced via `Number()` | `invoiceService.ts:24,26` | Basis points as `Int`, or commit to `Decimal` |
| **L19** | `Client.email`/`phone` not unique, no dedup | `schema.prisma:163-183` | Product decision (Q6); at minimum a soft duplicate warning |
| **L20** | No graceful shutdown | `index.ts` | `SIGTERM` → drain → `prisma.$disconnect()` |
| **L21** | Invoice numbering global, not per-FY, overflows at 10 000; sequence row serialises all invoice creation | `invoiceService.ts:78-83` | Per-branch/per-FY series (Q2); widen padding |
| **L22** ✅ | ~~No migrations; seed wipes every table + hardcoded password~~ **CLOSED (Task 2)** | `prisma/migrations/0_init/`, `seed.ts`, `package.json` | Baseline captured (14 tables / 8 enums / 20 FKs / 10 unique indexes). Seed is idempotent upserts, `SEED_OWNER_PASSWORD` required, refuses `NODE_ENV=production`. `db push` removed. **Caveat: not verified against a live database** — no Postgres available here. See `prisma/migrations/README.md` for the baseline-vs-deploy decision. |
| **L23** | No tests, no `test` script | repo | Vitest + Testcontainers before Phase 1 is called complete |

> **L22 note.** Ranked LOW in the original review for security impact but it was the highest
> *irrecoverable* risk here: `npm run seed` against production destroyed every table.
> Closed by Task 2 — the seed now upserts, never deletes, and refuses to run in production.

---

## B.5 Agent D — Trust boundaries

The target model. Nothing below is implemented today except column 1.

### Public (no token)

`GET /api/health` · `GET /api/public/branches` · `GET /api/public/services` · `POST /api/public/contact` · `POST /api/auth/login` · `POST /api/auth/refresh`

Rate-limited, length-bounded, and **must never expose branch-internal fields** — `listPublic()` on services currently returns the full mapped object; confirm no cost/margin data leaks.

### Authenticated — all roles, branch-scoped

Dashboard, and read+create+update on appointments, clients, invoices, inventory, staff, services. Every query filtered by `AuthContext.branchId` unless the role is OWNER.

### Role matrix (target)

| Capability | OWNER | MANAGER | RECEPTIONIST |
|---|---|---|---|
| Cross-branch read | ✅ all | ❌ own only | ❌ own only |
| Cross-branch write | ✅ explicit `branchId` | ❌ | ❌ |
| Create appointment / client | ✅ | ✅ own branch | ✅ own branch |
| Create invoice (DRAFT) | ✅ | ✅ own branch | ✅ own branch |
| Mark invoice PAID | ✅ | ✅ own branch | ⚠️ **decision — Q1** |
| Void / delete invoice | ✅ | ✅ own branch | ❌ |
| Apply discount > threshold | ✅ | ✅ | ❌ **Q1** |
| Create / update staff | ✅ | ✅ own branch, no `branchId`/`role` | ❌ |
| Transfer staff between branches | ✅ | ❌ (H6) | ❌ |
| Manage services catalogue | ✅ | ✅ | ❌ |
| Manage inventory | ✅ | ✅ own branch | ❌ |
| Delete anything | ✅ | ⚠️ limited | ❌ |
| Salon settings | ✅ | ⚠️ **decision — Q7** | ❌ |
| Manage users / passwords | ✅ | ❌ | ❌ |

### Data-layer branch-scope strategy

```ts
// src/auth/scope.ts
// Reuses TokenPayload from utils/jwt.ts — it already carries
// {sub, email, role, staffId, branchId}. No second context type.
import { TokenPayload } from '../utils/jwt';

export const branchScope = (ctx: TokenPayload) =>
  ctx.role === 'OWNER' ? {} : { branchId: ctx.branchId };

// resolve the branch a write lands in — never trust the body for non-owners
export const writeBranchId = (ctx: TokenPayload, requested?: string) =>
  ctx.role === 'OWNER' ? (requested ?? ctx.branchId) : ctx.branchId;
```

> Ponytail review cut an `AuthContext` type here: it was `TokenPayload` with `sub`
> renamed to `userId`, plus a mapper and the drift between the two. `req.user` is
> already typed as `TokenPayload` by `src/types/express.d.ts` — pass it directly.

Three mechanical rules, reviewable by grep:

1. Every service method takes `ctx: TokenPayload` first.
2. Every read merges `...branchScope(ctx)`; **no bare `findUnique` in a service** — use `findFirst`.
3. Every write derives `branchId` from `writeBranchId(ctx, body.branchId)`, never from the body directly.

**Recommendation:** Defer Postgres RLS to a later phase; ship the application-layer scope first.
**Why:** RLS is the only control that makes C1 structurally unreintroducible, but it requires per-request session variables, connection-pool discipline, and a policy per table. Application scope plus the grep-able rules above closes the actual hole at a fraction of the effort.
**Why not:** Do not treat application scope as permanently sufficient — one forgotten `where` is a silent leak, which is exactly how C1 arose.
**Alternatives rejected:** RLS-first (blocks the whole phase on infrastructure); Prisma middleware auto-injection (invisible, breaks owner-wide queries).
**Risk:** Accepting a known ceiling — recorded in the Ponytail debt ledger with the upgrade path.
**Verification:** The 8×3 scope test matrix, plus a CI grep asserting no `findUnique` appears in `src/services/`.
