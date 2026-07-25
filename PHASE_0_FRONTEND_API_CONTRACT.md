# PHASE 0 — Frontend API Contract

**Agent A — Frontend API Contract Extractor**
Date: 2026-07-23 · Graph commit: `9ed1364a` · Status: **complete, with a premise correction**

---

## A.0 Headline finding — there are zero live frontend API calls

The briefing states "the frontend is already built and deployed." That is true of the *UI*. It is **not** true of backend integration.

Verified three independent ways:

1. **Grep for every call mechanism** across `Frontend/src` — `adminApi`, `publicApi`, `axios`, `fetch(`, imports of `lib/api`:
   the only hits are inside `src/lib/api.ts` itself (its own definition) plus one `emailjs.sendForm` in `Contact.tsx`.
2. **Graphify import graph** — `src/lib/api.ts` exports `adminApi` and `publicApi` into Community 18 with **no inbound `imports_from` edges** from any page or component.
3. **Store call census** — 65 `*Store.*` localStorage calls across 14 files. Every admin page reads and writes `localStorage`.

```
Frontend/src/lib/api.ts        ← axios instances, JWT interceptor, 401 redirect. Imported by NOTHING.
Frontend/src/admin/data/store.ts ← 8 localStorage stores. Imported by 14 files.
```

`store.ts:1-4` says so in its own header: *"Admin Store — localStorage CRUD (Backend-Ready) / Replace these functions with API calls when backend is ready."*

### What this means for Phase 1

| Assumption in the briefing | Reality | Consequence |
|---|---|---|
| A frontend contract exists that Phase 1 must not break | No HTTP contract exists | **Phase 1 is free to design the correct API.** No backwards-compatibility constraint. |
| Backend fixes risk breaking production | Backend has zero consumers | Backend changes are **zero-blast-radius** today. |
| "Fix the backend" is the project | Frontend↔backend integration was never done | Integration is a **separate, larger workstream** that must be scoped explicitly. |

This is the single most consequential Phase 0 output: it **removes** the main constraint the briefing assumed, and **adds** a workstream nobody had costed.

### Two live defects found while establishing the above

Out of scope for the backend review, in scope for the product:

- **`Login.tsx:10-15` accepts any credentials.** It ignores email/password entirely, writes the literal string `'dev-token'` to `localStorage`, and navigates to `/admin`. `ProtectedRoute.tsx:8-13` only checks that *a* token exists — it never validates it. The deployed admin panel has no authentication.
  *Precise impact:* because all data is `localStorage`-scoped, an intruder sees only **their own browser's mock data** — no real customer data is exposed today. The exposure becomes real the moment Phase 1 connects the frontend to live data. Treat as **must-fix in the same release as integration**, not before.
- **`Contact.tsx:33-38` uses placeholder EmailJS credentials** (`'YOUR_SERVICE_ID'`, `'YOUR_TEMPLATE_ID'`, `'YOUR_PUBLIC_KEY'`). The public contact form throws on every submit and shows "Something went wrong." The backend's `POST /api/public/contact` is not called by anything.

---

## A.1 The implied contract

Since no HTTP calls exist, the contract Phase 1 must satisfy is derived from three real artifacts:

- `Frontend/src/admin/data/types.ts` — the shapes pages consume (159 lines, 10 interfaces)
- `Frontend/src/admin/data/store.ts` — the operations pages invoke (8 stores)
- `Frontend/src/lib/api.ts` — the transport decisions already made

**Transport decisions already fixed by `api.ts`:**

| Decision | Value | Source |
|---|---|---|
| Base URL | `VITE_API_BASE_URL` ?? `http://localhost:4000` | `config.ts:2` |
| Auth scheme | `Authorization: Bearer <token>` | `api.ts:22` |
| Token storage | `localStorage['adminToken']` | `api.ts:19` |
| 401 handling | clear token, hard-redirect `/admin/login` | `api.ts:32-35` |
| Refresh handling | **none — not implemented** | `api.ts` (absent) |

> The interceptor has no refresh flow. With 15-minute access tokens, users get logged out every 15 minutes. Phase 1 must add refresh-on-401-then-retry, or the session strategy is unusable. Tracked as Q3 in `PHASE_0_OPEN_QUESTIONS.md`.

---

## A.2 Endpoint-by-endpoint contract

Legend — **Auth**: P = public, A = authenticated, O = owner-only, M = manager+.
**Branch**: SCOPED = must be filtered to caller's branch; GLOBAL = cross-branch by design.
**Flags**: review IDs from `PHASE_0_BACKEND_RISK_MAP.md`.

### Auth

| Method | Endpoint | Frontend source | Request | Query | Expected response | Auth | Branch | Flags |
|---|---|---|---|---|---|---|---|---|
| POST | `/api/auth/login` | `Login.tsx:12` *(TODO comment only)* | `{email, password}` | — | `{accessToken, refreshToken, user{id,email,role,staffId,name,branch}}` | P | — | C4, H5, L14 |
| POST | `/api/auth/refresh` | **not implemented** | `{refreshToken}` | — | `{accessToken, refreshToken}` | P | — | C4, H5 |
| POST | `/api/auth/logout` | **not implemented** | — | — | `{message}` | A | — | — |
| GET | `/api/auth/me` | **not implemented** (`ProtectedRoute` should call it) | — | — | `{id,email,role,staffId,name,branch,branchId}` | A | — | M7 |

### Public

| Method | Endpoint | Frontend source | Request | Query | Expected response | Auth | Branch | Flags |
|---|---|---|---|---|---|---|---|---|
| GET | `/api/public/branches` | **unused** — `Branches.tsx` uses hardcoded data | — | — | `Branch[]` | P | GLOBAL | — |
| GET | `/api/public/services` | **unused** — `Services.tsx` uses hardcoded data | — | — | `ServiceRecord[]` | P | GLOBAL | — |
| POST | `/api/public/contact` | **unused** — `Contact.tsx` uses EmailJS | `{name,email,phone?,subject?,message}` | — | `201 {}` | P | — | H5, M9 |

### Dashboard

| Method | Endpoint | Frontend source | Request | Query | Expected response | Auth | Branch | Flags |
|---|---|---|---|---|---|---|---|---|
| GET | `/api/admin/dashboard/stats` | `Dashboard.tsx` (via stores) | — | — | `DashboardStats` (6 numeric fields) | A | SCOPED | — |
| GET | `/api/admin/dashboard/alerts` | `Dashboard.tsx` → `inventoryStore.getLowStock` | — | — | `{lowStockItems[], lowStockCount}` | A | SCOPED | L16 |

### Appointments · Clients · Services · Staff · Inventory · Branches

All follow the same five-operation shape. Backend already provides every one.

| Method | Endpoint | Frontend store call | Auth | Branch | Flags |
|---|---|---|---|---|---|
| GET | `/api/admin/appointments` | `appointmentStore.getAll` | A | SCOPED | C1 |
| GET | `/api/admin/appointments/:id` | `appointmentStore.getById` | A | SCOPED | C1 |
| POST | `/api/admin/appointments` | `appointmentStore.create` | A | SCOPED | C1 |
| PUT | `/api/admin/appointments/:id` | `appointmentStore.update` | A | SCOPED | C1, M8 |
| DELETE | `/api/admin/appointments/:id` | `appointmentStore.delete` | M | SCOPED | C1 |
| GET/POST/PUT | `/api/admin/clients[/:id]` | `clientStore.*` | A | SCOPED | C1, M8, L19 |
| DELETE | `/api/admin/clients/:id` | `clientStore.delete` | M | SCOPED | C1 |
| GET/POST/PUT | `/api/admin/services[/:id]` | `serviceStore.*` | M (write) | GLOBAL | C1 |
| DELETE | `/api/admin/services/:id` | `serviceStore.delete` | O | GLOBAL | C1 |
| GET/POST/PUT | `/api/admin/staff[/:id]` | `staffStore.*` | M (write) | SCOPED | C1, **H6** |
| DELETE | `/api/admin/staff/:id` | `staffStore.delete` | O | SCOPED | C1 |
| GET/POST/PUT | `/api/admin/inventory[/:id]` | `inventoryStore.*` | M (write) | SCOPED | C1 |
| GET | `/api/admin/inventory/low-stock` | `inventoryStore.getLowStock` | A | SCOPED | L16 |
| DELETE | `/api/admin/inventory/:id` | `inventoryStore.delete` | O | SCOPED | C1 |
| GET | `/api/admin/branches[/:id]` | *(implied — needed for branch pickers)* | A | GLOBAL | — |

### Invoices — see Agent E for the full billing contract

| Method | Endpoint | Frontend store call | Auth | Branch | Flags |
|---|---|---|---|---|---|
| GET | `/api/admin/invoices` | `invoiceStore.getAll` (Invoices, Dashboard) | A | SCOPED | C1 |
| GET | `/api/admin/invoices?clientId=` | `invoiceStore.getByClientId` (ClientDetail) | A | SCOPED | C1 |
| GET | `/api/admin/invoices/:id` | `invoiceStore.getById` | A | SCOPED | C1 |
| POST | `/api/admin/invoices` | `invoiceStore.create` (Billing, Invoices) | A | SCOPED | **C2**, M10, M11 |
| PUT | `/api/admin/invoices/:id` | `invoiceStore.update` | A | SCOPED | **C2**, M10 |
| DELETE | `/api/admin/invoices/:id` | `invoiceStore.delete` | M | SCOPED | M12 |

### Settings

| Method | Endpoint | Frontend store call | Auth | Branch | Flags |
|---|---|---|---|---|---|
| GET | `/api/admin/settings` | `settingsStore.get` (Settings, Billing) | A | GLOBAL | L17 |
| PUT | `/api/admin/settings` | `settingsStore.update` | M | GLOBAL | L17 |

---

## A.3 Contract gaps — frontend needs it, backend does not provide it

These are **missing endpoints**, not bugs. Each blocks a page that exists today.

| # | Frontend need | Source | Backend status | Impact |
|---|---|---|---|---|
| **G1** | `visitStore.getByClientId(clientId)` | `ClientDetail.tsx` | **No endpoint.** `ServiceVisit` rows are *written* by the invoice pipeline and can never be read back. | Client service-history tab cannot be built. |
| **G2** | `visitStore.getAll()` | `Dashboard.tsx` | **No endpoint.** Same table. | Dashboard visit widgets cannot be built. |
| **G3** | `invoiceStore.getNextInvoiceNumber()` | `Billing.tsx:171`, `Invoices.tsx` | Backend generates the number **server-side inside the transaction** (correct). | Frontend must **delete** this call and stop sending `invoiceNumber`. |
| **G4** | Contact submissions read | — | `ContactSubmission` is write-only; no GET endpoint. | Submissions accumulate unreadable. No frontend consumer today, so low priority. |
| **G5** | User management (create login, change password) | — | **No endpoints at all.** Only `prisma/seed.ts` creates users. | Cannot onboard a second staff login without a DB script. |
| **G6** | Token refresh flow | `api.ts` | Backend provides `/auth/refresh`; frontend interceptor does not use it. | Forced logout every 15 min once integrated. |

---

## A.4 Shape divergences — same concept, incompatible representation

These are the real integration hazards. Each needs a decision before Phase 1 writes code.

| # | Field | Frontend | Backend | Severity | Notes |
|---|---|---|---|---|---|
| **D1** | **Branch identity** | `branch: string` — a **display name** (`"CM — Bengaluru"`) on `Client`, `Appointment`, `Invoice`, `StaffMember`, `InventoryItem` | `branchId: string` — a **cuid FK**; reads map back to `branch.name` via `mapToFrontend` | **HIGH** | Reads already align. **Writes do not** — every create/update needs `branchId`, which the frontend never holds. Blocks all writes. |
| **D2** | **Invoice line item** | `{service: string, description?, quantity, unitPrice, total, productId?}` — no `serviceId` | `{serviceName, serviceId?, description?, quantity, unitPrice, total, productId?}` | **HIGH** | Frontend has no service ID on the line, so server-authoritative pricing (C2) has nothing to price against. Must add `serviceId`. |
| **D3** | **Discount model** | `discountType: 'percent' \| 'flat'` + `discountValue` (`Billing.tsx:72`) | `discountPercent` + `discountAmount`, no type discriminator | **MEDIUM** | Backend can *store* both but cannot distinguish which the user chose, so a flat discount round-trips as a percent. |
| **D4** | **Rounding granularity** | Rounds in **rupees**: `Math.round(subtotal * pct/100)` | Stores **paisa** (`Int`) | **MEDIUM** | Frontend rounds to the rupee before the server converts to paisa. Server-side recompute will produce different totals unless the rule is pinned. |
| **D5** | `Invoice.dueDate` | Present in `types.ts:118` | **No column** in `schema.prisma` | LOW | Either add the column or drop the field. |
| **D6** | `Appointment.clientId/staffId/serviceId` | Non-optional `string` | Nullable (walk-ins) | LOW | Backend maps null → `''`. Works, but the frontend type lies. |
| **D7** | `ServiceVisit.stylist` / `.branch` | Names | `staffId`+`staffName`, `branchId` | LOW | Ties into G1/G2 — resolve when the endpoint is built. |
| **D8** | Enum casing | lowercase (`'paid'`, `'female'`, `'hair-care'`) | UPPERCASE (`PAID`, `FEMALE`, `HAIRCARE`) | LOW | Backend already normalises both directions. Keep the mappers; do not "fix" this. |

---

## A.5 Verification performed

| Claim | Method | Result |
|---|---|---|
| Zero API calls from frontend | `Grep` for `adminApi\|publicApi\|axios\|fetch(\|lib/api` over `Frontend/src` | Only self-references in `api.ts` + 1 `emailjs` |
| `api.ts` is orphaned | Graphify import graph, Community 18 inbound edges | Zero inbound |
| Pages use localStorage | `Grep -c` for `Store\.` | 65 hits / 14 files |
| Login is unauthenticated | Direct read `Login.tsx:10-15`, `ProtectedRoute.tsx:8-13` | Confirmed |
| `ServiceVisit` unreadable | `Grep` route table in `routes/index.ts` | No `serviceVisit` route |
| Route→service path | `graphify path "router" "invoiceService"` | `router → routes/index.ts → domainControllers.ts → invoiceService` |

---

## A.6 Recommendations

**Recommendation:** Treat the frontend as **un-integrated** and design the Phase 1 API for correctness first, then write a thin frontend adapter layer.
**Why:** No HTTP contract exists to preserve, so the usual "don't break the client" constraint does not apply. Designing around a contract that was never implemented would lock in the client-trusted-totals flaw (C2) for no benefit.
**Why not:** Do not assume the mock shapes in `types.ts` are the required API shape — they encode client-side computation (`getNextInvoiceNumber`, client-computed totals) that must **not** survive into the API.
**Alternatives rejected:** (a) Make the backend match `types.ts` exactly — this would enshrine C2. (b) Ship backend fixes and defer integration indefinitely — leaves the deployed panel on mock data with a bypassable login.
**Risk:** Frontend rework is larger than "swap store calls for fetch calls" because of D1 (branch name vs id) and D2 (missing `serviceId`).
**Verification:** Build one vertical slice end-to-end (login → `/auth/me` → `GET /clients`) before converting the other 13 pages.

---

**Recommendation:** Keep `src/lib/api.ts` and `@tanstack/react-query`; do not delete them in the Ponytail cleanup.
**Why:** Both are dead today, but they are the exact seam Phase 1 needs, and the axios interceptor already encodes the correct auth decisions (Bearer header, 401 redirect).
**Why not:** Do not leave them untouched either — `api.ts` lacks the refresh-retry flow (G6), so as written it produces a 15-minute forced logout.
**Alternatives rejected:** Deleting them per the Ponytail audit — that trades 2 deps for re-deriving the same decisions in Phase 1.
**Risk:** They stay dead if integration slips again, and dead scaffolding decays.
**Verification:** Phase 1 exit criterion — zero `*Store.*` calls remain in `Frontend/src/admin/pages`.

---

**Recommendation:** Resolve D1 by adding a branch context provider on the frontend that holds `branchId`, sourced from `GET /auth/me`.
**Why:** The JWT already carries `branchId`, and `/auth/me` already returns it. Non-owner users have exactly one branch, so their `branchId` is a constant for the session — no picker needed.
**Why not:** Do not send `branchId` from the client on writes for non-owner roles — the server must derive it from `AuthContext`, or C1 reopens via a forged `branchId` in the body.
**Alternatives rejected:** Looking up branch by name server-side (fragile, `Branch.name` is user-editable); adding a branch picker for all roles (wrong for single-branch users).
**Risk:** OWNER genuinely needs cross-branch writes, so owner-only requests must still accept an explicit `branchId`.
**Verification:** Test that a RECEPTIONIST sending someone else's `branchId` in the body gets 403, not a cross-branch write.
