# MVP — Deferred Tech Debt

Everything deliberately cut for v1. Each entry: what, why now, why not forever, and the trigger to revisit.

`grep -rnE '(#|//) ?ponytail:' Backend/src` finds the in-code markers.

---

## Demo-readiness pass (2026-07-25) — new items

### Per-branch summary count chips read 0 (cosmetic)
**What:** On Staff and Inventory, the small per-branch count chips ("BENGALURU 0 / KALABURAGI 0") always show 0. They filter on the bare string `branch === 'Bengaluru'`, but the backend returns the full display name `'CM — Bengaluru'`. Leftover from the mock-data era, which used short names.
**Why now:** Cosmetic only — the main stat (total count), the table, and the branch filter dropdown are all correct. The page is fully usable; a runtime test did not prove it broken, and the demo-readiness brief says not to change UI unless a page is unusable.
**Why not forever:** A demo viewer will notice "Bengaluru: 0 staff" next to 4 Bengaluru staff.
**Trigger / fix:** One-line change per page — match on the real branch name (`includes('Bengaluru')`) or compare against `branchId`. Do it opportunistically, or when polishing the UI.

## Runtime verification pass (2026-07-24) — new items

### Docker was not actually used
**What:** `RUNTIME_VERIFICATION_DOCKER_POSTGRES.md` proves the app against a real Postgres 16 server, but launched via `embedded-postgres` (npm), not Docker — Docker Desktop isn't installed on the verification machine and installing it needs admin rights + a reboot.
**Why now:** Wire-protocol identical outcome; blocking on a Docker install would have added nothing but a reboot.
**Why not forever:** `docker-compose.dev.yml` is committed but has never itself been started. Nothing in the app is Docker-aware, so risk is low, but it is genuinely unverified.
**Trigger:** First `docker compose -f docker-compose.dev.yml up -d postgres` on a machine that has Docker — should be a non-event, but confirm it.

### `/live` and `/ready` endpoints don't exist
**What:** Only `GET /api/health` is implemented. `/live` and `/ready` both 404.
**Why now:** `/health` already answers "is the process up"; nothing currently needs a separate readiness probe (no orchestrator, no load balancer health checks configured).
**Why not forever:** A real deployment behind a load balancer wants `/ready` to fail while DB connections aren't yet warm, distinct from `/live` (process up) — conflating them means a broken DB connection still reports "healthy."
**Trigger:** Deploying behind anything that does its own health-check-driven routing (Kubernetes, an ALB, Cloudflare's health checks).

---

## Cut by explicit v1 decision

### 1. Refresh tokens, rotation, token families
**Cut:** `/auth/refresh`, `User.refreshToken` runtime use, `JWT_REFRESH_SECRET`, no `RefreshToken` table.
**Why now:** The old implementation was broken — bcrypt truncates at 72 bytes, so every refresh JWT for a user hashed identically and rotation revoked nothing. Deleting it removed four problems at once (the bug, the table, the rotation logic, the frontend retry interceptor) and *shrank* the exposure window: 12h access token vs a 7-day unrevokable refresh token.
**Why not forever:** No server-side revocation at all. A compromised token is valid until it expires.
**Trigger:** Staff count grows past ~10, turnover increases, franchise/multi-owner use, or handling more sensitive data.

### 2. `tokenVersion` / server-side session revocation
**Cut:** Deactivating a staff member does not immediately invalidate their token.
**Why now:** 12h window, ~5 trusted staff. Would cost one indexed lookup per request.
**Why not forever:** A fired employee retains access for up to 12 hours.
**Trigger:** Same as #1, or the first time someone is let go on bad terms.
**Marker:** `Backend/src/utils/jwt.ts`

### 3. Audit log
**Cut:** No record of who changed what.
**Why now:** Five staff, owner knows everyone personally.
**Why not forever:** Discounts, stock adjustments and voided invoices are unattributable. Insider misuse is undetectable.
**Trigger:** Headcount growth, a billing dispute, or an accountant asking "who applied this discount?"

### 4. Void / soft-delete for financial records
**Cut:** Invoices are still hard-deleted; `InvoiceItem` cascades.
**Why now:** PAID invoices already cannot be deleted, which covers the money-critical case.
**Why not forever:** Deleting an OVERDUE invoice erases evidence of a receivable.
**Trigger:** Accountant asks for it, or the first "where did that invoice go?"

### 5. Postgres RLS
**Cut:** Branch isolation is application-layer only.
**Why now:** `branchScope(ctx)` closes the actual hole. RLS needs per-request session vars, pool discipline, and a policy per table.
**Why not forever:** One forgotten `where` clause is a silent cross-branch leak.
**Trigger:** A second developer touches `src/services/`, or an audit requires DB-level enforcement.
**Marker:** `Backend/src/auth/scope.ts`

### 6. Idempotency-key table
**Cut:** No dedup table on invoice create.
**Why now:** The dangerous path — the PAID transition — is already idempotent via a conditional `updateMany`. A double-submitted *create* yields two visible DRAFT invoices: a nuisance, not corruption.
**Why not forever:** Duplicate drafts are still confusing.
**Trigger:** Duplicate invoices actually observed in use.

### 7. OpenAPI generation
**Cut:** No generated spec or frontend types.
**Why now:** One frontend, one backend, one repo. Shapes are pinned by `types.ts` and the store adapter.
**Why not forever:** Backend mapper output and frontend types can drift with nothing detecting it.
**Trigger:** A second client (mobile app, partner integration).

### 8. Cursor pagination
**Cut:** Offset pagination; the store requests `limit=100`.
**Why now:** Two branches, hundreds of rows.
**Why not forever:** Lists silently truncate past 100, and OFFSET degrades.
**Trigger:** Any branch exceeding ~100 clients or invoices — which will happen within a year.

### 9. `pino` / structured logging
**Cut:** `console.error` in the error handler.
**Why now:** Not a security fix; real work.
**Why not forever:** Production 500s are untraceable, and Prisma error objects can carry client PII into logs.
**Trigger:** First production incident you cannot trace.

### 10. Full user-management CRUD
**Cut:** No create-user / change-password / deactivate endpoints. Logins come from the seed.
**Why now:** ~5 staff; seeding 2–3 logins is faster than building CRUD.
**Why not forever:** No password rotation, no self-service, no offboarding.
**Trigger:** First staff change, or anyone needing to change their own password.

### 11. Cloudinary upload wiring
**Cut:** Helper exists, no routes. Env vars made **optional** so the app boots without them.
**Why now:** No UI uploads anything. `avatarUrl`/`imageUrl` columns stay null.
**Why not forever:** Staff photos and branch images are modelled and unusable.
**Trigger:** Product wants staff photos.

### 12. Discount ceilings by role
**Cut:** Any authenticated user can apply any discount.
**Why now:** Q1 unanswered. Server-side pricing already prevents arbitrary *prices*.
**Why not forever:** An unbounded discount is functionally the same as setting the price.
**Trigger:** **Q1 answered** — this is the smallest open money risk.

---

## Cut by Ponytail review

| Cut | Why | Add back when |
|---|---|---|
| Separate `AuthContext` type | It was `TokenPayload` with `sub` renamed. Reused `TokenPayload`. | never |
| `src/pricing/` directory | One file, one caller. `utils/money.ts` is enough. | a second pricing consumer |
| Testcontainers | Docker as a hard test prereq on Windows. Use `DATABASE_URL_TEST`. | CI needs disposable DBs |
| `changeDue` on invoice response | `Billing.tsx` already derives it from two fields it holds. | never |
| `before`/`after` JSON in audit log | Moot — audit log itself deferred (#3). | with #3 |
| Vitest suite | Two assert-based `__checks__` scripts cover the risky logic with zero framework. | a third check, or CI |
| `express.urlencoded` | API is JSON-only. Removed. | a form POST exists |
| `cors credentials: true` | Auth is a Bearer header, not cookies. Removed. | never |
| `mockData.ts` (96 lines) | Orphaned once the store went API-backed. Deleted. | never |
| `@emailjs/browser` | Contact form now uses the backend. Uninstalled. | never |
| `enforceBranchScope` | Never mounted; exempted MANAGER; couldn't protect `:id`. Deleted. | never |
| Dead low-stock query | Result was discarded two lines later. Deleted; rule now lives once in `inventoryService.getLowStock`. | never |
| `tsconfig` `baseUrl`/`paths` | Zero `@/` imports. Deleted; also cleared the TS deprecation. | never |

---

## Known ceilings accepted in shipped code

| Marker | Ceiling | Upgrade |
|---|---|---|
| `utils/asyncHandler.ts` | Every new route must remember `ah()` | delete on the Express 5 bump |
| `utils/jwt.ts` | No revocation; 12h window after deactivation | add `tokenVersion` |
| `auth/scope.ts` | One forgotten `where` is a silent leak | Postgres RLS |
| `inventoryService.getLowStock` | Filters in JS, O(all active items) | SQL `WHERE current_stock <= min_stock` |

## Still-open questions

| Q | Blocks | Default taken if unanswered |
|---|---|---|
| **Q8 — GST/rounding** | Nothing now — implemented with a documented assumption | GST on post-discount, half-up, rounded at discount + tax only, integer paisa. **Needs accountant sign-off before filing.** |
| Q1 — receptionist PAID/discount limits | Discount ceiling (#12) | No ceiling; anyone may mark PAID |
| Q2 — invoice numbering | Per-FY/per-branch series | Global `CM-INV-0000`; overflows at 10,000 |
| Q4 — staff transfers | — | OWNER-only; not built |
| Q6 — client dedup | — | No index; needs its own migration now |
| Q7 — MANAGER editing settings | — | MANAGER retains write access (unchanged) |
