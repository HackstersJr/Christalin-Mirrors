# MVP — Implementation Plan & Change Summary

2026-07-23 · **Steps 0–8 implemented.** Step 9 (review/debt) complete.
Not yet run against a live database — see "Remaining blockers".

---

## Steps, as executed

| # | Step | State | Notes |
|---|---|---|---|
| 0 | Tool/context setup | ✅ | Claude-Mem degraded (see below), Graphify refreshed, Ponytail audit run |
| 1 | Current reality docs | ✅ | `MVP_CURRENT_REALITY.md`, `MVP_API_WIRING_MAP.md` |
| 2 | Stability patch | ✅ **pre-existing** | Shipped earlier as Task 1; verified still green |
| 3 | Auth simplification | ✅ | 12h token, refresh deleted, real login |
| 4 | Server-side money | ✅ | `utils/money.ts` + golden checks |
| 5 | Stock / payment correctness | ✅ | atomic decrement, conditional transition |
| 6 | Branch scoping | ✅ | `auth/scope.ts` threaded through 8 services |
| 7 | Public hardening | ✅ | helmet, tiered rate limits, honeypot, strict Zod |
| 8 | Frontend integration | ✅ | 14 pages, 0 localStorage business reads |
| 9 | Review + debt | ✅ | `MVP_DEFERRED_TECH_DEBT.md` |

---

## Files changed

**Backend — new (8)**
`src/auth/scope.ts` · `src/utils/money.ts` · `src/middleware/rateLimit.ts` · `src/services/contactService.ts` · `src/services/serviceVisitService.ts` · `src/utils/__checks__/money.check.ts` · (from Task 1: `src/utils/asyncHandler.ts`, `src/utils/__checks__/task1.check.ts`)

**Backend — modified (17)**
`app.ts` · `config/env.ts` · `config/cors.ts` · `utils/jwt.ts` · `services/authService.ts` · `controllers/authController.ts` · `controllers/dashboardController.ts` · `controllers/domainControllers.ts` · `middleware/rbac.ts` · `middleware/validate.ts` · `routes/index.ts` · `validators/schemas.ts` · `services/{invoice,client,appointment,inventory,staff,branch,service,dashboard,settings}Service.ts` · `package.json`

**Frontend — modified (14)**
`lib/api.ts` · `admin/data/store.ts` · `admin/data/types.ts` · `admin/components/ProtectedRoute.tsx` · `admin/pages/{Login,Dashboard,Clients,ClientDetail,Appointments,Calendar,Services,Staff,Inventory,Invoices,Billing,Settings}.tsx` · `components/Contact.tsx` · `package.json`

**Deleted:** `Frontend/src/admin/data/mockData.ts`, `enforceBranchScope`, `/auth/refresh`, `getNextInvoiceNumber`, "Reset All Data" button, `@emailjs/browser`

---

## Key decisions

**Recommendation:** Delete refresh tokens; issue one 12-hour access token.
**Why:** The old implementation was broken — bcrypt truncates at 72 bytes, so every refresh JWT for a given user hashed identically and rotation revoked nothing. Deleting removes the bug, the table, the rotation logic and the frontend retry interceptor, and *shrinks* the exposure window versus a 7-day unrevokable refresh token.
**Why not:** Do not keep 15-minute tokens without a refresh flow — that logs the cashier out mid-invoice.
**Alternatives rejected:** Full `RefreshToken` table with SHA-256 and family revocation (correct at scale, ~2 days, no perceivable v1 benefit); frontend-only retry (keeps the broken revocation).
**Risk:** No revocation; a deactivated staff member keeps access up to 12h.
**Verification:** Login with wrong password → 401. Valid login → token. `GET /auth/me` gates every admin route.

**Recommendation:** All invoice money computed server-side in one module.
**Why:** Browser-computed totals mean the ledger records whatever the browser says. `POST /invoices` has no role gate, so the lowest-privileged user could previously write arbitrary financial records.
**Why not:** Do not merely validate the client's arithmetic — internally-consistent-but-wrong prices still pass.
**Alternatives rejected:** Trust-but-verify against `Service.price` (same work, weaker guarantee); a DB CHECK constraint (catches typos, not tampering).
**Risk:** Changed the invoice request shape — the largest frontend change.
**Verification:** `money.check.ts` golden fixtures; `priceLines()` ignores any client price.

**Recommendation:** Branch scope in the service layer, not middleware.
**Why:** Middleware cannot know which branch owns record `abc123` without querying — which is exactly why the old `enforceBranchScope` only guarded query params and could never protect an `:id` route.
**Why not:** Do not trust `branchId` from the request body; `writeBranchId()` overrides it for non-owners.
**Alternatives rejected:** Query-param checks (the dead middleware); Prisma middleware auto-injection (invisible, breaks owner-wide queries); RLS (right ceiling, wrong phase).
**Risk:** ~40 call sites; a missed one is a silent leak.
**Verification:** `grep -rn "findUnique" src/services/` returns only non-branch-owned models (`Service`, `Branch`, `SalonSettings`, `InvoiceSequence`).

---

## Tests run

| Check | Result |
|---|---|
| `npx tsc --noEmit` (backend) | ✅ clean |
| `npx tsc -b` + `vite build` (frontend) | ✅ clean, 2101 modules |
| `npm run check` — asyncHandler + pagination NaN | ✅ passed |
| `money.check.ts` — 8 golden fixtures | ✅ passed |
| No `localStorage` business reads | ✅ only theme prefs + auth token |
| `mockData.ts` unreferenced | ✅ deleted |
| `emailjs` unreferenced | ✅ uninstalled |

**Not run:** anything requiring a live Postgres. No database, Docker, or `.env` exists on this machine.

---

## Manual verification steps

```bash
# 1. Backend env
cd Backend
cat > .env <<'EOF'
DATABASE_URL=postgresql://user:pass@localhost:5432/christalin
JWT_SECRET=<at least 32 characters, random>
FRONTEND_URL=http://localhost:5173
EOF

# 2. Schema. Fresh DB:
npm run migrate:deploy
# DB that already has tables from `db push` — do NOT use migrate:deploy:
#   npm run migrate:baseline

# 3. Seed
SEED_OWNER_PASSWORD='<a strong password>' npm run seed

# 4. Run both
npm run dev                    # backend :4000
cd ../Frontend && npm run dev  # frontend :5173
```

Then confirm:

1. **Login** — wrong password → "Invalid email or password". Correct → dashboard.
2. **Persistence** — create a client, hard-refresh, still there. Open in a different browser: still there. *(This is the single clearest proof the localStorage era is over.)*
3. **Route protection** — `localStorage.removeItem('adminToken')`, refresh → bounced to login.
4. **Price tampering** — `POST /api/admin/invoices` with a `subtotal` field → **422** (strict schema). Without it, the total comes from the catalogue regardless of what the client wanted.
5. **Stock** — bill more units of a product than are in stock → `400 Insufficient stock for X: N left, M requested`, and **nothing** is written.
6. **Idempotency** — mark the same invoice PAID twice → stock decrements once, `totalVisits` increments once.
7. **Branch scope** — log in as a Kalaburagi user, `GET /api/admin/clients` → only their branch. `GET /api/admin/clients/<bengaluru-id>` → **404**.
8. **Rate limits** — 11 failed logins → 429. 6 contact submissions in an hour → 429.
9. **Contact form** — submit on the landing page → 201, row in `ContactSubmission`.
10. **Invoice number** — created server-side, sequential, `CM-INV-0009` onward after seeding.

---

## Remaining blockers

| # | Blocker | Severity |
|---|---|---|
| **B1** | **Nothing has run against a live Postgres.** No DB/Docker here. Typechecks, builds and pure-logic checks pass; runtime is unverified. | **High** — must be done before any real use |
| **B2** | **Q8 rounding needs accountant sign-off.** Implemented with a documented default. One seeded invoice has three different historical totals (₹858 / ₹859 / ₹858.60) — see `MVP_CURRENT_REALITY.md` §A.6. | **High** before GST filing |
| **B3** | No user-management endpoints. Extra logins must be seeded; nobody can change their own password. | Medium |
| **B4** | Q1 unanswered — no discount ceiling, so any user can discount to zero. | Medium — smallest open money risk |
| **B5** | Lists cap at `limit=100` and silently truncate. | Low now, certain later |
| **B6** | Existing seeded invoice totals will not reproduce under the new engine (they were lossy). | Low — mock data only |

---

## Approval checklist before real use

- [ ] Postgres provisioned; `.env` populated with a real 32+ char `JWT_SECRET`
- [ ] **Backup taken**, then correct migration path chosen (`migrate:deploy` vs `migrate:baseline` — see `Backend/prisma/migrations/README.md`)
- [ ] Seeded with a strong `SEED_OWNER_PASSWORD`; `Admin@1234` rotated anywhere it was used
- [ ] Manual verification steps 1–10 above all pass
- [ ] Q8 rounding rule reviewed by the accountant
- [ ] `VITE_API_BASE_URL` set for the deployed frontend
- [ ] Confirm `trust proxy` behaviour behind Cloudflare (rate limits see real client IPs, not one shared IP)
