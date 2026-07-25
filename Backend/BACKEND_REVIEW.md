# Christalin Mirrors — Backend Review

Security audit + architecture assessment, based on a full read of every file in `Backend/src`, `Backend/prisma`, `tsconfig.json`, and `package.json`.

---

# Part 1 — How the backend actually works

## 1.1 Runtime shape

It is a single-process, stateless Express 4 HTTP API in TypeScript, talking to one PostgreSQL database through Prisma 6. There is no queue, no cache, no background worker, no scheduler. Every request is handled synchronously inside the same Node process, and all state lives in Postgres.

```
index.ts          → validates env, app.listen(PORT)
  app.ts          → cors → express.json → express.urlencoded → /api routes → errorHandler
    routes/index.ts
      /api/health                  (open)
      /api/auth/*                  (login/refresh open, logout/me authenticated)
      /api/public/*                (open)
      /api/admin/*                 (authenticate applied to the whole sub-router)
        → controllers/*.ts         (one-line pass-throughs)
          → services/*.ts          (all business logic + all persistence + all response shaping)
            → utils/prisma.ts      (single global PrismaClient)
```

**Boot sequence.** `src/index.ts` imports `./config/env` first. `env.ts` runs `dotenv.config()`, then parses `process.env` through a Zod schema and calls `process.exit(1)` if anything is missing. This is why the app cannot start without `DATABASE_URL`, both JWT secrets (min 32 chars each), and all three Cloudinary variables. Only then does it import `./app` and bind the port.

**Middleware order in `app.ts`** is: CORS → JSON body parser → URL-encoded parser → routes → error handler. There is nothing else: no `helmet`, no rate limiter, no request logger, no compression, no request-id, no body size limit beyond Express's 100 KB default.

## 1.2 The request lifecycle in detail

Take `POST /api/admin/invoices` as the canonical path:

1. **CORS** — `config/cors.ts` allows exactly three origins (`FRONTEND_URL`, `localhost:5173`, `localhost:3000`), `credentials: true`, and the header allowlist `Content-Type, Authorization`.
2. **Body parse** — `express.json()` turns the payload into `req.body`.
3. **`authenticate`** (`middleware/auth.ts`) — reads the `Authorization` header, requires the `Bearer ` prefix, calls `verifyAccessToken`, and assigns the decoded payload to `req.user`. The payload is `{ sub, email, role, staffId, branchId }`, typed globally by `src/types/express.d.ts`. **This middleware never touches the database** — the whole authorization picture for a request comes from the signed token.
4. **`requireRole(...)`** (`middleware/rbac.ts`) — only on some routes. It is a pure allowlist check against `req.user.role`. Note that `POST /invoices` has *no* `requireRole`, so any authenticated user, including a `RECEPTIONIST`, can create invoices.
5. **`validate(schema)`** (`middleware/validate.ts`) — runs `schema.parse(req.body)` and **reassigns `req.body` to the parsed result**. Because the Zod objects are not `.strict()`, unknown keys are silently dropped here. This is the single most important safety property in the codebase, and several services depend on it without saying so.
6. **Controller** — `controllers/domainControllers.ts` is 93 lines of one-liners. Each is `res.json(await someService.method(req.params.id, req.body))`. The only controllers with any logic are `dashboardController` and `inventoryController.lowStock`, which pick a `branchId` from `req.user`.
7. **Service** — the real work.
8. **`errorHandler`** — if an `AppError` reaches it, it emits `{ error: code, message, details? }` with the right status; anything else becomes a generic 500 with `console.error`.

## 1.3 The domain model

`prisma/schema.prisma` defines 13 models and 8 enums. The centre of gravity is `Branch` — nearly everything hangs off it.

**Identity chain.** `User → Staff → Branch`. `User.staffId` is `@unique`, so it is strictly one login per staff member. `User.role` is `UserRole` (`OWNER | MANAGER | RECEPTIONIST`) and is what governs API permissions. `Staff.role` is a *different* enum, `StaffRole` (`STYLIST | THERAPIST | MANAGER | RECEPTIONIST`), and is purely descriptive — it is a job title, not a permission. The two are easy to confuse and the codebase never comments on the distinction. The `branchId` embedded in every JWT is read from `user.staff.branchId` at login time (`authService.ts:22`).

**Money.** Every monetary column is an `Int` storing **paisa** (`Service.price`, `Invoice.subtotal/total/…`, `InvoiceItem.unitPrice/total`, `InventoryItem.costPrice/retailPrice`, `ServiceVisit.*`). `utils/currency.ts` converts at the API boundary: `rupeesToPaisa` on the way in, `paisaToRupees` on the way out. Integer paisa is the correct choice and avoids float drift in storage. Percentages (`discountPercent`, `taxPercent`) are Postgres `Decimal`, which Prisma returns as Decimal.js objects; the services coerce them with `Number(...)`.

**Optional-link pattern.** `Appointment.clientId`, `staffId`, and `serviceId` are all nullable, and each row *also* stores denormalised snapshots (`clientName`, `staffName`, `serviceName`). Same for `Invoice`. This is a deliberate and reasonable design for a salon: walk-ins have no client record, and you want the invoice to preserve the name and price as they were at the time of sale, not as they are today. `ServiceVisit.services` is a `Json` column holding `[{ name, price }]` for the same reason.

**Uniqueness constraints.** `Branch.name`, `Service.name`, `Staff.email`, `User.email`, `User.staffId`, `Invoice.invoiceNumber`, `Invoice.appointmentId`, `ServiceVisit.invoiceId`, `InventoryItem.sku`, and the composite `ServiceBranch(serviceId, branchId)`. Note what is *not* unique: `Client.email` and `Client.phone`.

**Singletons.** `SalonSettings` and `InvoiceSequence` both use `@id @default("singleton")` — a one-row table addressed by a literal key.

## 1.4 Authentication in detail

`services/authService.ts` implements four operations.

**`login(email, password)`** — looks up the user with `staff.branch` included, rejects if missing or `!isActive`, `bcrypt.compare`s the password (cost 12, `utils/password.ts`), then builds a `TokenPayload` and signs two tokens: an access token with `JWT_SECRET` expiring in **15m**, and a refresh token with `JWT_REFRESH_SECRET` expiring in **7d** (`utils/jwt.ts`). It then bcrypt-hashes the refresh token, stores that hash in `User.refreshToken`, stamps `lastLogin`, and returns both tokens plus a small user object.

**`refresh(token)`** — verifies the JWT signature, reloads the user, bcrypt-compares the presented token against the stored hash, then issues *and stores* a brand-new pair. This is textbook refresh-token rotation. (Part 2 explains why the rotation does not actually revoke anything.)

**`logout(userId)`** — sets `User.refreshToken = null`. This does work.

**`me(userId)`** — the only place the API re-reads the user from the database after login.

There is **no user-creation, password-change, password-reset, or user-deactivation endpoint anywhere.** `staffService.create` creates a `Staff` row but never a `User`. The only way a login exists is `prisma/seed.ts`, which creates one `OWNER` with a hardcoded password.

## 1.5 The invoice pipeline — the core of the system

`services/invoiceService.ts:75` is the most important function in the repo.

```
prisma.$transaction(async (tx) => {
  1. tx.invoiceSequence.upsert({ where:{id:'singleton'}, update:{ lastNum: { increment: 1 } } })
     → invoiceNumber = `CM-INV-${padStart(lastNum, 4, '0')}`
  2. tx.invoice.create({ ...fields, items: { create: [...] } })   // nested write
  3. if (status === 'PAID') executePaidSideEffects(tx, invoice, data)
})
```

`executePaidSideEffects` (line 180) does four things, all on the transaction client:

- **3a** For each invoice item with a `productId`, read the `InventoryItem` and write back `Math.max(0, currentStock - quantity)`.
- **3b** If `clientId` is set, `totalVisits: { increment: 1 }` and `lastVisit = now`.
- **3c** If *both* `clientId` and `staffId` are set, create a `ServiceVisit` snapshot row carrying the invoice's monetary fields and a JSON array of `{name, price}`.
- **3d** If `appointmentId` is set, force that appointment to `COMPLETED`.

`update` handles the DRAFT→PAID transition specially: it re-reads the invoice, and if the status is moving to `PAID` for the first time it opens a transaction, applies the update, and runs the same side effects. `remove` refuses to delete a `PAID` invoice.

The transaction boundary, the atomic sequence, and the "side effects fire exactly on the paid transition" model are all the right instincts. The problems are in the details (see V2, V10, V11).

## 1.6 The other services

- **`branchService`** — plain CRUD, plus `listPublic()` filtering `isActive: true`. `create`/`update` pass `data` straight to Prisma.
- **`serviceService`** — CRUD with paisa conversion and `category.toUpperCase()` normalisation; `listPublic()` returns active services mapped to rupees. Notably `list()` does **not** filter by `isActive`, so the admin list shows everything — correct — but there is no branch-price resolution anywhere: `ServiceBranch.priceOverride` exists in the schema and is read by nothing.
- **`staffService`** — CRUD; `list`/`getById` hand-map to a frontend shape including `avatar: s.avatarUrl`. `update` spreads `data` raw.
- **`clientService`** — CRUD with a `search` filter doing case-insensitive `contains` across name/email/phone. `update` spreads `data` raw.
- **`appointmentService`** — the only service with an explicit state machine: `VALID_TRANSITIONS` (line 5) enforces `PENDING → {CONFIRMED, CANCELLED}`, `CONFIRMED → {COMPLETED, CANCELLED}`, and terminal `COMPLETED`/`CANCELLED`. Note that `executePaidSideEffects` step 3d **bypasses this machine** and writes `COMPLETED` directly, which is intentional but undocumented — it means a `PENDING` appointment can jump straight to `COMPLETED` via billing.
- **`inventoryService`** — CRUD plus a `CATEGORY_MAP`/`CATEGORY_REVERSE` pair translating between the frontend's kebab-case (`hair-care`) and the DB enum (`HAIRCARE`). `getLowStock` loads all active items and filters `currentStock <= minStock` in JavaScript.
- **`settingsService`** — reads the `singleton` row and merges in the branch list to build the frontend's `SalonSettings` shape. `update` is a field-by-field conditional spread, then re-reads via `this.get()`.
- **`dashboardService`** — `getStats` runs six counts/aggregates in `Promise.all` (today's appointments, total clients, month-to-date paid revenue, pending requests, completed today, cancelled today). `getAlerts` computes low stock — twice, once with a query that does nothing and once by loading the table into memory.

## 1.7 Supporting utilities

- `utils/errors.ts` — an `AppError` base carrying `statusCode`, `code`, `message`, optional `details`, with six subclasses (404/400/401/403/409/422).
- `utils/pagination.ts` — `parsePagination` clamps `limit` to `[1, 100]` (default 20) and `page` to `>= 1`; `paginate` wraps results with `total/page/limit/totalPages/hasNext/hasPrev`.
- `utils/prisma.ts` — one module-level `new PrismaClient()`, imported everywhere. No connection-pool config, no logging, no `$disconnect`.
- `middleware/upload.ts` — a fully-written multer memory-storage config (5 MB cap, `image/*` filter) and a `uploadToCloudinary` streaming helper. **Imported by nothing.**
- `prisma/seed.ts` — deletes every table in FK-safe order, then builds two branches, a service catalogue, staff, clients, appointments, invoices, inventory, salon settings, the invoice sequence, and one `OWNER` user with the password `Admin@1234` hardcoded at line 297.

---

# Part 2 — Vulnerabilities

Ordered by real-world severity. Each entry states the flaw, the exploit, and the fix.

## CRITICAL

### V1 — Branch isolation does not exist. Every authenticated user can read and write every branch's data.

**Where:** `src/middleware/rbac.ts:22`, `src/routes/index.ts` (all 40 admin routes).

`enforceBranchScope` is written but **never imported and never mounted**. `routes/index.ts:3` imports only `requireRole`. So the multi-tenant boundary the whole product depends on is enforced in exactly two places in the entire codebase — `dashboardController` and `inventoryController.lowStock` — and nowhere else.

**Exploit.** A `RECEPTIONIST` at the Kalaburagi branch, with a completely legitimate login:

```
GET /api/admin/clients?branchId=<bengaluru-branch-id>
→ full PII dump of another branch: names, emails, phones, private notes, tags

GET /api/admin/invoices?branchId=<bengaluru-branch-id>
→ every invoice, every total, complete revenue history

GET /api/admin/invoices/<any-id>
→ any single invoice in the system, no branch filter at all

GET /api/admin/inventory?branchId=<other>
→ cost prices (margin data) for another branch
```

And it is not read-only. `PUT /api/admin/clients/:id` and `PUT /api/admin/appointments/:id` have no `requireRole` and no ownership check, so a receptionist can modify another branch's records.

**Two independent failures stack here:**

1. **Missing tenant filter on list endpoints.** Every `list()` builds `where` from `req.query` alone. Omit `?branchId` and you get *all* branches; supply someone else's and you get theirs.
2. **IDOR on every single-resource endpoint.** Every `getById`/`update`/`remove` is `prisma.X.findUnique({ where: { id } })`. The id is a cuid, so it is not enumerable by guessing — but ids leak constantly through list responses, and `findUnique` by definition cannot be branch-filtered.

**Also note the middleware would not have worked even if mounted.** `enforceBranchScope` (a) exempts `MANAGER` entirely — the guard only fires for `RECEPTIONIST`; (b) only checks `branchId` *if it is present* — omitting it passes; (c) never looks at `req.params.id`, so it cannot protect any single-resource route.

**Fix.** Do not fix this in middleware. Middleware cannot know that invoice `abc123` belongs to Bengaluru without a query. Push the scope into the data layer:

```ts
// src/auth/scope.ts
export type AuthContext = { userId: string; role: string; branchId: string };

export function branchScope(ctx: AuthContext) {
  return ctx.role === 'OWNER' ? {} : { branchId: ctx.branchId };
}
```

Pass `ctx` as the first argument to every service method, merge `branchScope(ctx)` into every `where`, and replace `findUnique({ where: { id } })` with `findFirst({ where: { id, ...branchScope(ctx) } })` so out-of-scope reads return a clean 404. Reject writes whose `data.branchId` is outside scope.

---

### V2 — Invoice totals are supplied by the client. Anyone who can create an invoice can set any price.

**Where:** `src/services/invoiceService.ts:86-121`, `src/validators/schemas.ts:110-139`, `src/routes/index.ts:97`.

The server takes `subtotal`, `discountAmount`, `taxAmount`, `total`, `amountPaid`, and each item's `unitPrice` and `total` directly from the request body. Zod validates only that they are non-negative numbers. **The server never looks up what anything actually costs.** `Service.price` and `ServiceBranch.priceOverride` are in the schema and are read by no code path in the billing pipeline.

`POST /api/admin/invoices` carries **no `requireRole`**, so the lowest-privileged role can do this.

**Exploit — under-billing / theft:**

```json
POST /api/admin/invoices
{
  "clientName": "walk-in", "clientEmail": "x@y.com", "date": "2026-07-23",
  "branchId": "<any>", "status": "PAID", "paymentMethod": "CASH",
  "items": [{ "serviceName": "Korean Glass Skin Facial", "quantity": 1,
              "unitPrice": 0.01, "total": 0.01, "productId": "<retail-item-id>" }],
  "subtotal": 0.01, "taxAmount": 0, "total": 0.01, "amountPaid": 0.01
}
```

The invoice is recorded as paid for one paisa. Inventory is still decremented, the client's visit count still goes up, a `ServiceVisit` is still written, and the linked appointment is still closed. The system's own books say the service was delivered and paid for. Cash collected at the counter never has to match anything.

**Exploit — over-billing / fraud:** the same request with inflated totals fabricates revenue, which matters if commissions, targets, or investor reporting are ever derived from this table.

**There is also no arithmetic check at all.** Nothing verifies that `sum(items.total) == subtotal`, that `total == subtotal - discountAmount + taxAmount`, or that `discountAmount` is consistent with `discountPercent`. A frontend bug produces silently corrupt financial records with no error.

**Fix.** Make the server authoritative. The client should send intent, not arithmetic:

```json
{ "items": [{ "serviceId": "...", "quantity": 1 },
            { "productId": "...", "quantity": 2 }],
  "discountPercent": 10, "clientId": "...", "branchId": "..." }
```

Inside the transaction, load each `Service`/`InventoryItem`, resolve `ServiceBranch.priceOverride ?? Service.price`, compute line totals, subtotal, discount, tax (from `SalonSettings`, not the request), and grand total in integer paisa. Optionally accept the client's computed `total` and return `409 CONFLICT` on mismatch — that catches frontend drift without trusting it. Additionally: gate `POST /invoices` behind `requireRole`, and gate the ability to set `status: 'PAID'` at creation time behind a manager role.

---

### V3 — Async errors never reach the error handler; several trivially reachable requests crash the process.

**Where:** every controller in `src/controllers/*.ts`; `express: ^4.21.2` in `package.json`.

Express 4 does not handle rejected promises returned from route handlers. Every controller in this codebase is `async`, and there is no `asyncHandler` wrapper anywhere (verified by grep). So when a service throws:

1. The handler returns a rejected promise.
2. Express discards it — `errorHandler` is **never invoked**.
3. The HTTP request hangs until the client times out.
4. Node's default `--unhandled-rejections=throw` (v15+) **terminates the process**.

This means `src/middleware/errorHandler.ts` is effectively dead code for the entire service layer. Every `NotFoundError`, `BadRequestError`, and `ConflictError` you carefully defined in `utils/errors.ts` is unreachable. (`authenticate` and `validate` throw *synchronously*, so those two — 401 and 422 — do work. That is why the bug is easy to miss: auth errors look fine.)

**Exploit — single-request denial of service:**

```
GET /api/admin/invoices/does-not-exist     → NotFoundError → process exits
GET /api/admin/clients?page=abc            → parseInt('abc') = NaN
                                           → Math.max(1, NaN) = NaN
                                           → Prisma skip: NaN → throws → process exits
```

The second one needs no knowledge of the system at all. Any authenticated user, or an automated scanner, takes the API down repeatedly. On a single-instance deployment this is a complete outage.

**Fix — two lines, and it must be done first because everything else depends on errors being observable:**

```ts
// src/utils/asyncHandler.ts
import { RequestHandler } from 'express';
export const ah = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
```

Wrap every controller (`ah(invoiceController.create)`), or upgrade to Express 5, which forwards rejections to `next` natively. Separately, fix `parsePagination` to handle `NaN` (`Number.isFinite(n) ? n : 1`), and add `process.on('unhandledRejection')` / `uncaughtException` logging so this class of bug is never silent again.

---

## HIGH

### V4 — Refresh-token rotation revokes nothing (bcrypt's 72-byte truncation).

**Where:** `src/services/authService.ts:29, 63, 76`; `src/utils/password.ts`.

The refresh token is a JWT (roughly 200–400 characters) that is stored using `bcrypt.hash`. **bcrypt ignores everything past the first 72 bytes of its input.** So the stored hash only covers the first 72 bytes of the token.

Those 72 bytes are: 36 characters of base64 header (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` — identical for every token), a `.`, and ~35 characters of payload, which only reaches partway through the `sub` claim. The `iat` and `exp` claims — the *only* fields that differ between two tokens issued to the same user — are far past byte 72.

**Consequence: every refresh token ever issued to a given user has an identical first 72 bytes.** So `comparePassword(presentedToken, user.refreshToken)` returns `true` for *any* valid refresh JWT for that user, including ones that were supposedly replaced by rotation. The `throw new UnauthorizedError('Refresh token revoked')` branch at line 64 can essentially never fire.

**Impact.** Rotation is the mechanism that limits the blast radius of a stolen refresh token. Here it provides none: a token captured on day 1 remains usable for the full 7-day lifetime no matter how many times the legitimate user refreshes. Detection of token theft (the classic "reuse of a rotated token" signal) is impossible.

This is *not* a forgery vector — an attacker still needs `JWT_REFRESH_SECRET` to produce a token that passes `verifyRefreshToken`. The impact is confined to revocation, but revocation is the entire point of storing the hash.

**Secondary problem, same code:** bcrypt at cost 12 runs **twice** per `/auth/refresh` call (one compare, one hash) — roughly 400–600 ms of blocking CPU on an unauthenticated endpoint, on a single-threaded process. A few concurrent requests stall the entire API.

**Fix.** bcrypt is the wrong primitive here. It exists to make *low-entropy human passwords* expensive to brute-force. A refresh token should be 256 bits of `crypto.randomBytes` — brute-forcing it is already impossible, so a single `sha256` is both correct and ~10,000× faster:

```ts
const raw = crypto.randomBytes(32).toString('base64url');   // opaque, not a JWT
const digest = crypto.createHash('sha256').update(raw).digest('hex');
```

Store `digest` in a dedicated `RefreshToken` table (see A8) with `userId`, `expiresAt`, `revokedAt`, `replacedById`, and device metadata. Keep bcrypt cost 12 for the login password, where it belongs.

---

### V5 — No rate limiting on any endpoint.

**Where:** absent from `src/app.ts` and `package.json` entirely.

| Endpoint | Consequence |
|---|---|
| `POST /api/auth/login` | Unlimited password guessing. One seeded `OWNER` account, no lockout, no backoff, no CAPTCHA, no alerting. |
| `POST /api/auth/refresh` | ~500 ms of blocking bcrypt CPU per request (see V4) → cheap CPU exhaustion on a single-threaded server. |
| `POST /api/public/contact` | Unauthenticated write to the database. `contactSchema.message` is `z.string().min(1)` with **no maximum**. Bounded only by the 100 KB body limit, so ~100 KB per request, unlimited requests → the attacker controls your disk usage. |
| Every `/api/admin/*` list | Unbounded read amplification. |

`POST /api/public/contact` is the worst of these because it is completely open and it writes. There is also **no endpoint to read `ContactSubmission` rows** — data enters and can never be retrieved through the API, so the table only ever grows.

**Fix.** `express-rate-limit` with tiered buckets: strict on `/auth/login` (e.g. 5 per 15 min per IP + per email), strict on `/public/contact` (e.g. 3/hour/IP) plus a honeypot field, generous on authenticated routes. Add `app.set('trust proxy', 1)` — without it, every request behind a load balancer shares one IP and rate limiting is either useless or bans everyone. Add `z.string().min(1).max(2000)` to the contact message, and build a read endpoint plus a retention policy.

---

### V6 — A MANAGER can rewrite any staff member's branch binding, including the OWNER's.

**Where:** `src/routes/index.ts:70`, `src/validators/schemas.ts:100-108`, `src/services/staffService.ts:71`.

`PUT /admin/staff/:id` requires only `OWNER, MANAGER`. `updateStaffSchema` permits `branchId` and `role`. `staffService.update` spreads `data` straight into `prisma.staff.update`.

`Staff.branchId` is not cosmetic — it is the **source of the `branchId` claim in every JWT** (`authService.ts:22`, `user.staff.branchId`). So a manager can move any staff record, including the one attached to the `OWNER`'s user, to a different branch. On the owner's next login, their token carries the attacker's branch. Once V1 is fixed and branch scoping is real, this becomes a direct route to locking the owner out of their own data or redirecting their view.

`role` here is `StaffRole` (a job title) and is *not* the permission enum, so changing it does not directly escalate API privileges — but the two fields are named identically across two enums and it is one refactor away from being a real escalation.

**Fix.** Remove `branchId` and `role` from `updateStaffSchema` and expose them only through explicit, `OWNER`-only operations (`POST /admin/staff/:id/transfer`). Replace the raw spread with an explicit field allowlist. Forbid any user from modifying the staff record linked to a `User` whose role outranks their own.

---

## MEDIUM

### V7 — Access tokens cannot be revoked; deactivating a user has no effect for 15 minutes.

`authenticate` verifies the signature and nothing else — it never reads the database. There is no `jti`, no `tokenVersion`, no denylist. So:

- Setting `User.isActive = false` (which no endpoint does anyway) does not stop an in-flight session for up to 15 minutes.
- A role or branch change does not take effect until the access token expires.
- A leaked access token is valid for its full 15-minute window with no way to kill it.

Fifteen minutes is a defensible window — but it should be a *decision*, not an accident. For an app that manages money and PII, "fire an employee and they retain access for 15 minutes" needs to be explicit.

`jwt.verify` is also called without `{ algorithms: ['HS256'] }`. jsonwebtoken v9 already rejects `alg: none` by default so this is not currently exploitable, but pinning the algorithm is one line and removes a whole class of future risk. Same for `issuer`/`audience`.

**Fix.** Add `tokenVersion: Int @default(0)` to `User`, include it in the payload, and compare it in `authenticate` (cache the value in Redis or accept one indexed lookup per request). Pin `algorithms`, `issuer`, `audience` on both sign and verify.

---

### V8 — Mass assignment is prevented only by an implicit Zod behaviour.

`clientService.update`, `staffService.update`, `branchService.create`/`update`, `appointmentService.update`, `serviceService.update`, and `inventoryService.update` all pass `data` (i.e. `req.body`) into Prisma with a raw spread and no allowlist.

Right now this is contained, because Zod's default object mode **strips** unknown keys and `validate()` reassigns `req.body` to the parsed output. Nothing malicious gets through today. But this is an undocumented invariant holding up six write paths:

- Add one field to a Zod schema for the frontend's convenience and it instantly becomes writable through a path nobody reviewed.
- Call any service from a new code path (a script, a job, a new route) without `validate()` and mass assignment is live.
- `appointmentService.update` spreads `data` including a possible `date`; add `branchId` to that schema and appointments become movable across branches.

Additionally, silent stripping **hides frontend bugs**: send a misspelled field and the API returns 200 while quietly ignoring it.

**Fix.** Two changes, both cheap. Make schemas `.strict()` so unknown keys produce a 422 instead of vanishing. And build explicit `data` objects in services (`{ name: data.name, phone: data.phone }`) rather than spreading — `invoiceService`, `inventoryService.create`, and `serviceService.create` already do this correctly, so it is a consistency fix, not a new pattern.

---

### V9 — Raw request body written straight to the database on the public endpoint.

`src/controllers/domainControllers.ts:88-92`:

```ts
const submission = await prisma.contactSubmission.create({ data: req.body });
res.status(201).json(submission);
```

Same reliance on Zod stripping as V8, but on the **only unauthenticated write in the system**. It also does a dynamic `await import('../utils/prisma')` inside the handler — a controller reaching directly into the data layer, bypassing the service pattern used everywhere else. There is no anti-automation of any kind, and the created row (including its id) is echoed back to the anonymous caller.

**Fix.** Route it through a real service, allowlist the fields explicitly, add `max()` bounds to the schema, add a honeypot field and rate limiting, and return `201 {}` rather than the stored row.

---

### V10 — The paid-invoice transition is not idempotent and can double-apply under concurrency.

`src/services/invoiceService.ts:132-154`. `update` reads `existing` **outside** the transaction, then checks `existing.status !== 'PAID'` and enters the transaction.

Two concurrent `PUT /invoices/:id { status: 'PAID' }` — a double-clicked button, a retried request, two terminals — both read `DRAFT`, both pass the guard, both run `executePaidSideEffects`. Result: inventory decremented twice, `totalVisits` incremented twice.

The `@unique` constraint on `ServiceVisit.invoiceId` accidentally catches the second write and rolls its transaction back — but **only when both `clientId` and `staffId` are set** (line 209). For a walk-in with no client, or an invoice with no assigned stylist, no `ServiceVisit` is written and there is nothing to collide. Those cases double-apply cleanly.

**Fix.** Move the read-and-guard inside the transaction and make the state change conditional, so the database arbitrates:

```ts
const { count } = await tx.invoice.updateMany({
  where: { id, status: { not: 'PAID' } },
  data: { status: 'PAID', /* ... */ },
});
if (count === 0) return existing;   // already paid — no-op, no side effects
await executePaidSideEffects(tx, invoice, data);
```

Add an `Idempotency-Key` header on `POST /invoices` for the same reason on the create path.

---

### V11 — Inventory decrement silently clamps at zero and is read-then-write.

`src/services/invoiceService.ts:188`: `Math.max(0, product.currentStock - item.quantity)`.

**Overselling is swallowed.** Sell 10 units of an item with 3 in stock and the system records stock 0, no error, no warning, no backorder. Nothing anywhere reflects that you sold 7 units you did not have. For a business tracking cost prices and margins, this quietly corrupts inventory accounting.

**And it is a read-modify-write.** `findUnique` then `update` with a computed value. Under Postgres's default READ COMMITTED isolation, two concurrent invoices for the same product can both read `5` and both write `3` — one sale disappears. Prisma's atomic `decrement` operator exists precisely for this.

**Fix.** Validate stock before committing and reject with a `BadRequestError` (or explicitly record a backorder — a product decision, but it must be *a* decision). Then use an atomic conditional write:

```ts
const { count } = await tx.inventoryItem.updateMany({
  where: { id: item.productId, currentStock: { gte: item.quantity } },
  data:  { currentStock: { decrement: item.quantity } },
});
if (count === 0) throw new BadRequestError(`Insufficient stock for ${item.serviceName}`);
```

---

### V12 — Financial records are hard-deleted, and there is no audit trail anywhere.

`invoiceService.remove` refuses to delete `PAID` invoices — good instinct — but `DRAFT`, `SENT`, `OVERDUE`, and `CANCELLED` invoices are hard-deleted, and `InvoiceItem` has `onDelete: Cascade`, so the line items go with them. An `OVERDUE` invoice is a real receivable; deleting it erases evidence of a debt. Clients, staff, services, branches, and inventory items are all hard-deleted too, with no `onDelete` policy declared on most relations — so deleting a `Branch` with rows attached will fail with a raw Prisma FK error, which under V3 crashes the process.

**More broadly: there is no audit log in the entire system.** No table, no middleware, no `updatedBy` column. For an application that records revenue, applies discounts, and adjusts stock, there is no way to answer "who marked this invoice paid?", "who changed this price?", or "who deleted this record?".

**Fix.** Soft-delete via `deletedAt` + a Prisma extension that filters it globally; a `VOID` invoice status instead of deletion; and an `AuditLog { id, actorId, action, entity, entityId, before, after, at }` table written **inside the same transaction** as the change it describes.

---

### V13 — Missing baseline HTTP hardening.

- **No `helmet`** — no `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or HSTS.
- **No explicit body limit.** `express.json()` defaults to 100 KB, and `createInvoiceSchema.items` has `.min(1)` but **no `.max()`** — so ~100 KB of items becomes thousands of `InvoiceItem` rows created inside a single long-running transaction. That holds the `InvoiceSequence` row lock the whole time and blocks every other invoice creation in the business.
- **`credentials: true` in CORS is unnecessary.** The API authenticates by `Authorization` header, not cookies. It is attack surface with no benefit.
- **`X-Powered-By: Express` not disabled.**
- **`console.error(err)` in the error handler** dumps whole error objects — under Prisma that can include query parameters, i.e. client PII, into plaintext logs. No request id, so a 500 in production cannot be correlated to a request.

---

## LOW

### V14 — User enumeration by timing on `/auth/login`.
`authService.login:12` returns immediately if the user is not found; a found user costs ~250 ms of bcrypt. The message is correctly identical ("Invalid credentials"), but the response time is not. Combined with no rate limiting (V5), an attacker can enumerate valid accounts. **Fix:** always run a bcrypt compare against a dummy hash when the lookup misses.

### V15 — The app refuses to boot without credentials for a feature that does not exist.
`env.ts:12-14` hard-requires all three Cloudinary variables. `middleware/upload.ts` is imported by nothing — the upload feature is fully written and completely unwired. So CI, a new developer's laptop, and any test environment all fail to start over credentials for dead code. **Fix:** make the Cloudinary block optional and validate it lazily at the point of use, or wire up the upload routes (`Staff.avatarUrl`, `Branch.imageUrl`, and `Service.imageUrl` all exist in the schema and are never populated).

### V16 — `dashboardService.getAlerts` runs a query whose result is discarded, then loads the whole table.
`dashboardService.ts:47-59` issues a `findMany` using `prisma.inventoryItem.fields?.minStock as any` — a field-reference construct that requires a preview feature and is defeated here by the `as any` — then throws the result away and re-queries all active items to filter in JavaScript. Two round trips to compute one number, one of which is pure waste. `inventoryService.getLowStock` implements the same rule a second time. Both load the entire inventory table into Node memory, so neither can be paginated and both degrade linearly with catalogue size. **Fix:** one raw SQL predicate (`WHERE current_stock <= min_stock`) or a generated column with an index, in one place, called from both.

### V17 — `settingsService.update` fails on a fresh database.
`prisma.salonSettings.update({ where: { id: 'singleton' } })` throws `P2025` if the row does not exist, which happens on any database that has not been seeded. Under V3 that crashes the process. **Fix:** `upsert`, exactly as `invoiceService` already does for `InvoiceSequence`.

### V18 — Prisma `Decimal` is coerced through `Number()`.
`invoiceService.ts:24, 26`. It works for percentages, but it discards the reason `Decimal` was chosen. Either commit to `Decimal` end-to-end or store basis points as an `Int`.

### V19 — `Client.email` and `Client.phone` are not unique and there is no dedup on create.
The same person booked twice becomes two client records with split visit history — which then feeds `totalVisits`, `lastVisit`, and the dashboard's client count. A data-quality problem rather than a security one, but it silently degrades the CRM value of the product.

### V20 — No graceful shutdown.
`index.ts` calls `app.listen` with no `SIGTERM`/`SIGINT` handler and never calls `prisma.$disconnect()`. On every deploy, in-flight requests are killed mid-flight. Open transactions roll back safely, so the database stays consistent — but the client sees a dropped connection with no idea whether the invoice was created, and V10 means their retry may double-apply.

### V21 — Invoice numbering will not survive the business.
`CM-INV-${padStart(lastNum, 4, '0')}` is global, not per-branch and not per-financial-year, and overflows its format at 10,000 invoices. Indian GST rules generally expect a per-financial-year series. Separately, `InvoiceSequence` is a single row locked for the duration of every invoice transaction — so **every invoice created anywhere in the business serialises through one row lock**, and that lock is held while inventory updates and side effects run.

---

# Part 3 — Architectural changes

Each entry: what changes, why it must change, and what you gain.

## A1 — Wrap async handlers (or move to Express 5)

**Change.** Add `asyncHandler` and apply it to all ~45 route handlers; add `process.on('unhandledRejection')` logging.

**Why.** Express 4 silently drops rejected promises. Today that makes `errorHandler` unreachable for every service-layer error and turns any thrown error into a process crash (V3).

**Advantage.** Your existing `AppError` taxonomy starts working — 404s become 404s instead of outages. The single highest value-to-effort change in the codebase, and a prerequisite for the rest: until errors are observable, every other fix is being written blind.

## A2 — Move authorization from middleware into the data layer

**Change.** Introduce `AuthContext`, thread it through every service method, derive `where` clauses from it, and convert `findUnique({id})` → `findFirst({id, ...scope})`. Delete `enforceBranchScope`.

**Why.** Middleware inspects the request; it cannot know which branch owns record `abc123` without querying. That is why the existing middleware only guards query parameters and cannot protect a single-resource route — the design is unfixable in place (V1).

**Advantage.** Authorization becomes structurally impossible to forget, because a service method cannot be called without a context. Out-of-scope access returns 404 rather than 403, which stops leaking existence. And the same mechanism supports future roles without touching routes.

## A3 — Make pricing server-authoritative

**Change.** The invoice API accepts `{ serviceId | productId, quantity, discountPercent }`. The server resolves `ServiceBranch.priceOverride ?? Service.price`, computes every total in integer paisa, and returns the computed invoice.

**Why.** Client-supplied totals mean the ledger records whatever the caller says (V2). Every financial figure in the system — dashboard revenue, `ServiceVisit` history, month-to-date aggregates — inherits that trust.

**Advantage.** The books become trustworthy, which is the entire point of a billing system. It also activates `ServiceBranch.priceOverride`, a modelled feature currently doing nothing, enabling per-branch pricing without new schema. And the frontend gets simpler: no duplicated tax arithmetic to keep in sync.

## A4 — A single money module

**Change.** One `Money` type (integer paisa, or `Decimal`), parsed once at the boundary, never a float in between. Delete ad-hoc `rupeesToPaisa` calls scattered through six services.

**Why.** Conversion currently happens in each service independently, and `Math.round(rupees * 100)` is applied to floats arriving from JSON.

**Advantage.** Rounding is defined in exactly one place, so it cannot drift between the invoice service and the inventory service. Rounding rules (per-line vs. per-invoice, half-up vs. banker's) become a reviewable decision instead of an emergent property.

## A5 — Idempotency and optimistic concurrency on state transitions

**Change.** Conditional `updateMany` for the paid transition; an `Idempotency-Key` header on `POST /invoices` backed by a small dedup table; an atomic conditional `decrement` for stock.

**Why.** Read-then-write across a transaction boundary is a race, and retries are inevitable on mobile networks (V10, V11).

**Advantage.** Double-clicks and retries stop corrupting inventory and visit counts. The database, not application logic, enforces the "paid exactly once" invariant, so it holds regardless of how many code paths reach it.

## A6 — Audit log and domain events

**Change.** An `AuditLog` table written inside the same transaction as every mutation, via a Prisma client extension so it cannot be bypassed.

**Why.** No record exists of who did what (V12). For discounts, refunds, stock adjustments, and price changes, that is not optional in a business handling cash.

**Advantage.** Disputes become answerable. Insider misuse becomes detectable. And the same event stream later powers notifications, reporting, and analytics without a rewrite.

## A7 — Soft deletes and void semantics for financial records

**Change.** `deletedAt` plus a global Prisma filter; a `VOID` invoice status replacing deletion; explicit `onDelete` policies on every relation.

**Why.** Hard deletes with cascades destroy financial history, and undeclared FK behaviour surfaces as raw Prisma errors (V12).

**Advantage.** Records become recoverable, accounting history stays intact, and referential integrity produces clean domain errors instead of 500s.

## A8 — Rebuild the refresh-token store

**Change.** A `RefreshToken` table: `{ id, userId, tokenHash (sha256), expiresAt, revokedAt, replacedById, userAgent, ip }`. Refresh tokens become opaque 256-bit random strings, not JWTs.

**Why.** bcrypt truncates at 72 bytes, so rotation revokes nothing (V4); and a single `User.refreshToken` column cannot represent more than one device.

**Advantage.** Rotation actually revokes. Reuse of a rotated token becomes a *detectable theft signal* — the standard response is to revoke that user's whole token family. Multi-device sessions work correctly, "sign out everywhere" becomes possible, and `/auth/refresh` drops from ~500 ms of blocking CPU to under a millisecond.

## A9 — Token versioning for immediate revocation

**Change.** `User.tokenVersion`, included in the JWT and compared on every authenticated request; bump on deactivate, role change, branch change, or password change.

**Why.** Access tokens are currently unrevokable for their full 15-minute life (V7).

**Advantage.** Deactivating an employee takes effect immediately. Role and branch changes apply without waiting for expiry — which matters a great deal once A2 makes `branchId` security-relevant.

## A10 — HTTP hardening layer

**Change.** `helmet`, `express-rate-limit` with per-route tiers, explicit body limits, `.max()` on every unbounded string and array, `app.set('trust proxy', 1)`, drop `credentials: true`.

**Why.** V5 and V13 — currently there is no defence against brute force, spam, or oversized payloads.

**Advantage.** Cheap, standard, and it removes the most commonly exploited category of attack. `trust proxy` in particular is easy to forget and quietly makes rate limiting useless behind a load balancer.

## A11 — Prisma Migrate, and a safe seed

**Change.** Replace `prisma db push` with `prisma migrate dev`/`deploy` and commit the `migrations/` directory. Make `seed.ts` idempotent (`upsert` instead of `deleteMany`), read the owner password from `process.env.SEED_OWNER_PASSWORD`, and refuse to run when `NODE_ENV === 'production'`.

**Why.** `prisma/` contains only `schema.prisma` and `seed.ts` — **there is no migration history**. Schema changes to a database holding financial records are unversioned, unreviewable, and unrollbackable. And the current seed opens with `deleteMany()` on every table — running it against production destroys the business's data, with a hardcoded password (`Admin@1234`, `seed.ts:297`) as the cherry on top.

**Advantage.** Schema changes become reviewable artifacts in code review with a rollback path. The seed stops being a loaded gun. This is arguably the highest-risk item on the list in terms of *irrecoverable* loss — every other bug is fixable after the fact.

## A12 — Validate params and query, not just body

**Change.** Extend `validate()` to `validate({ body?, query?, params? })`; add `z.string().cuid()` on `:id` and a typed query schema per list endpoint.

**Why.** `req.query` and `req.params` are currently unvalidated and flow directly into Prisma and `parsePagination` — the source of the `?page=abc` crash (V3).

**Advantage.** Malformed input produces a clean 422 at the edge instead of a Prisma error deep in a service. It also documents each endpoint's real contract, which is currently only discoverable by reading service internals.

## A13 — Fix pagination, then move large lists to cursors

**Change.** Immediately: handle `NaN` in `parsePagination`. Then: cursor pagination for invoices and appointments.

**Why.** `parseInt('abc')` produces `NaN` that propagates into `skip`. And `OFFSET` degrades linearly — invoices grow forever.

**Advantage.** Correct behaviour on bad input today; stable performance on the tables that will actually get large, plus consistent results when rows are inserted mid-pagination.

## A14 — Push the low-stock rule into SQL, once

**Change.** One predicate comparing the two columns in the database, in one place, used by both `dashboardService.getAlerts` and `inventoryService.getLowStock`. Delete the dead field-reference query.

**Why.** The rule is implemented twice, both implementations load the whole inventory table into Node, and one of the two queries is pure waste (V16).

**Advantage.** One implementation means the definition of "low stock" cannot diverge between the dashboard and the inventory page. It becomes indexable and paginable, and dashboard load stops scaling with catalogue size.

## A15 — Structured logging with request correlation

**Change.** `pino` + `pino-http` with a per-request id echoed in the response, replacing `console.error`. Redact PII fields explicitly.

**Why.** A production 500 currently yields an untraceable stack trace, possibly containing client PII from Prisma query parameters.

**Advantage.** Incidents become debuggable — you can follow one request end to end. Logs become queryable, and PII redaction becomes a policy rather than a hope.

## A16 — Real health checks and graceful shutdown

**Change.** Split `/live` (process up) from `/ready` (`SELECT 1` against Postgres); handle `SIGTERM` by closing the HTTP server, draining in-flight requests, then `prisma.$disconnect()`.

**Why.** `/api/health` returns `ok` even when the database is unreachable, so a load balancer keeps routing to a broken instance. And there is no shutdown handling at all (V20).

**Advantage.** Broken instances get pulled from rotation automatically. Deploys stop killing in-flight invoice creation, which — given V10 — is currently a route to duplicate side effects on retry.

## A17 — Tests, starting with the billing pipeline

**Change.** Vitest + Testcontainers Postgres. Cover: the paid transition and each of its four side effects, invoice number generation under concurrency, stock decrement at and below zero, every RBAC/branch-scope combination, and the appointment state machine.

**Why.** There are no tests and no `test` script. The invoice pipeline is the most business-critical and most concurrency-sensitive code in the repo, and it is entirely unverified.

**Advantage.** The scope and pricing changes in A2/A3 touch every service — without tests, that refactor is a gamble. RBAC in particular is only meaningfully verifiable by test, since the failure mode is silent data exposure rather than a crash.

## A18 — Generate an OpenAPI spec from the Zod schemas

**Change.** `zod-to-openapi`, served at `/api/docs`, with types generated for the frontend.

**Why.** Every service hand-maps Prisma rows into a frontend shape (`mapToFrontend`, and inline maps in `staffService`/`clientService`). Those shapes are the API contract and they exist nowhere but in the mapping functions.

**Advantage.** The contract stops drifting, because it is derived from the validators that already exist. The frontend gets generated types, so a renamed field becomes a compile error instead of an `undefined` in production.

## A19 — Separate mapping from business logic

**Change.** Extract the `mapToFrontend` functions into `src/mappers/`, and pricing into `src/pricing/`. Keep the service layer — it is the right size for this app — but stop having it do persistence, business rules, and presentation in one function.

**Why.** `invoiceService.list` currently queries, paginates, and reshapes for a specific UI. That couples the data layer to the frontend's current shape.

**Advantage.** Presentation changes stop touching business logic. Pricing rules become independently testable without a database. And the mapping layer is where A18's generated types naturally attach.

## A20 — Postgres Row-Level Security as a backstop

**Change.** Enable RLS on branch-scoped tables with a policy keyed off a session variable set per request from `AuthContext`.

**Why.** A2 makes scoping correct, but it is still enforced by application code, and one forgotten `where` clause silently leaks another branch's data — exactly the class of bug that produced V1.

**Advantage.** Defence in depth at the layer that cannot be bypassed. A missing filter becomes an empty result set instead of a data breach. This is the only change on the list that makes V1 *structurally* impossible to reintroduce. Highest effort of the set, so it belongs last — but it is what turns "we fixed the bug" into "the bug can't happen again."

---

# Part 4 — Suggested order

**Phase 0 — stop the bleeding (days)**
1. A1 — async handler wrapper + `parsePagination` NaN fix. *Nothing else is safe to change until errors are visible.*
2. A11 — commit migrations; de-weaponise the seed (`deleteMany` on every table is one command away from destroying production).
3. A10 — helmet, rate limiting, body/string bounds, `trust proxy`.

**Phase 1 — close the security holes (1–2 weeks)**
4. A2 — branch scoping in the data layer (V1).
5. A3 — server-authoritative pricing (V2).
6. A8 — refresh-token store (V4), plus V6 field allowlisting and V14 timing.
7. A12 — validate params and query.

**Phase 2 — correctness and integrity (2–3 weeks)**
8. A5 — idempotency and atomic stock (V10, V11).
9. A6 — audit log.
10. A7 — soft deletes and void semantics.
11. A17 — tests over everything from Phases 1–2.

**Phase 3 — operability (ongoing)**
12. A15, A16, A9, A13, A14, A18, A19.

**Phase 4 — hardening**
13. A20 — RLS.

A note on ordering: A2 and A3 are the two changes that alter the most files, and both are much safer once A1 makes errors observable and A17 gives you a net. Resist doing them first even though they are the scariest findings.
