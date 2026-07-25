# Ponytail Debt Ledger — Christalin Mirrors

Scan of `Backend/`, `Frontend/` for `ponytail:` markers: **1 found** (was 0 before Task 1).

| File | Line | Ceiling | Upgrade trigger |
|---|---|---|---|
| `Backend/src/utils/asyncHandler.ts` | 8 | every new route must remember `ah()` | delete on the Express 5 bump |

Row **D1↔D4** below has now migrated from this document into source, as intended.

This ledger is therefore seeded from **Phase 0 decisions**. Every row names the file where a
`ponytail:` comment must be planted when Phase 1 writes that code, so the next
`/ponytail-debt` scan picks it up from source instead of from this document.

Legend — **ceiling**: the limit being accepted. **upgrade**: the trigger to revisit.
`no-trigger` = rots silently, needs an owner and a date.

---

## A. Accepted ceilings — deliberate, revisit on trigger

| # | Decision | Ceiling | Upgrade trigger | Marker goes in |
|---|---|---|---|---|
| D1 | Branch scope enforced in application code, not Postgres RLS | one forgotten `where` clause is a silent cross-branch leak; CI grep is the only backstop | a second team touches `src/services/`, or an audit requires DB-level enforcement | `src/auth/scope.ts` |
| D2 | Offset pagination retained | `OFFSET` degrades linearly; results shift when rows are inserted mid-page | invoices exceed ~50 k rows | `src/utils/pagination.ts` |
| D3 | `console.error` retained; `pino` deferred | production 500s are untraceable to a request; Prisma error objects may carry client PII into logs | first production incident that needs request correlation | `src/middleware/errorHandler.ts` |
| D4 | Express 4 + `asyncHandler` instead of Express 5 | every new route must remember the wrapper; a forgotten one reintroduces the crash | next major dependency window | `src/utils/asyncHandler.ts` |
| D5 | `tokenVersion` costs one indexed DB read per authenticated request | ~1 extra query per request; no cache | requests/sec makes the lookup measurable | `src/middleware/auth.ts` |
| D6 | 15-minute access-token staleness accepted for role/branch changes | a role change takes up to 15 min to apply unless `tokenVersion` is bumped | — | `src/utils/jwt.ts` |
| D7 | Services keep persistence + business logic + response mapping in one layer | no repository/domain/presenter split | a service file exceeds ~400 lines | `src/services/README` or top of `invoiceService.ts` |
| D8 | 4 duplicate `mapToFrontend` functions left in place | same name in 4 modules makes grep and graph queries ambiguous | rename opportunistically when a file is touched; no dedicated pass | each `mapToFrontend` |
| D9 | `InvoiceSequence` global row lock retained if Q2 defaults to global numbering | all invoice creation business-wide serialises through one row | Q2 answered as per-branch/per-FY, or throughput complaints | `src/services/invoiceService.ts` |

## B. Cut by `/ponytail-review` — add back only on evidence

| # | Cut | Why cut | Add back when |
|---|---|---|---|
| C1 | `Idempotency` table + `Idempotency-Key` on invoice create | the conditional `updateMany` already makes the PAID transition idempotent; a double-submitted create yields two visible DRAFT invoices — a nuisance, not corruption | duplicate invoices are actually observed in use |
| C2 | Separate `AuthContext` type | it was `TokenPayload` with `sub` renamed, plus a mapper and drift between them | never — `TokenPayload` is the type |
| C3 | `src/pricing/` directory | one file, one caller; the pure function is equally testable exported from `invoiceService.ts` | a second consumer of pricing appears (e.g. a quote endpoint) |
| C4 | `@testcontainers/postgresql` | makes Docker a hard prerequisite for tests on a Windows dev box; `DATABASE_URL_TEST` + `prisma migrate deploy` does the same with 0 deps | CI needs disposable per-run databases |
| C5 | `changeDue` on the invoice response | `Billing.tsx:76` already derives it from two fields it holds | never |
| C6 | `branchId` alongside `branch` on every invoice response | Agent A sources it from `GET /auth/me` once per session | never |
| C7 | `before`/`after` JSON snapshots in `AuditLog` | who-did-what-to-which answers the disputes an audit log exists for | a real dispute needs field-level diffs |
| C8 | 409-and-merge client dedup flow | smuggled a Phase 2 feature into a Phase 1 constraint question | product asks for client merging |

## C. Deferred to Phase 2 — scoped, not forgotten

| # | Item | Why not Phase 1 | Blocks |
|---|---|---|---|
| P1 | **Frontend↔backend integration** — 14 pages, 65 `*Store.*` calls → HTTP | separate workstream; Phase 1 is backend-only | the product being real |
| P2 | **`Login.tsx` authenticates nobody** (`Login.tsx:10-15`, `ProtectedRoute.tsx:8-13`) | data is `localStorage`-scoped today, so nothing real leaks yet | **must ship in the same release as P1** — becomes a live breach the moment real data flows |
| P3 | Refresh-on-401-then-retry in `src/lib/api.ts` (single-flight) | frontend work | usable sessions — without it, forced logout every 15 min |
| P4 | `ServiceVisit` read endpoints (G1/G2) | no Phase 1 task needs them | client service-history tab, dashboard visit widgets |
| P5 | User management — create login, change password, deactivate (G5) | seed-only today | onboarding a second staff login without a DB script |
| P6 | OpenAPI generated from Zod | no consumer until P1 | frontend type generation |
| P7 | Cloudinary upload routes (Q5) | no UI to upload from yet | `avatarUrl`/`imageUrl` ever being populated |
| P8 | EmailJS placeholder credentials (`Contact.tsx:34-37`) | public contact form throws on every submit today | the public contact form working at all |

## D. `no-trigger` — rot risk, needs an owner and a date

| # | Item | Risk |
|---|---|---|
| N1 | **D6** — 15-minute token staleness has a ceiling but no upgrade trigger. It is a permanent accepted risk or it is not; decide explicitly. |
| N2 | **P2** — "same release as P1" is a dependency, not a date. If P1 slips, a fake login stays deployed indefinitely. Needs an owner. |
| N3 | **D8** — "opportunistically when touched" is how deferrals become permanent. Either accept 4 duplicates forever or schedule the rename. |

---

**0 markers in source, 9 accepted ceilings, 8 cuts, 8 Phase 2 deferrals, 3 with no trigger.**

Re-run `/ponytail-debt` after each Phase 1 task — rows should migrate from this document into
`ponytail:` comments in source as the code that carries each ceiling gets written.
