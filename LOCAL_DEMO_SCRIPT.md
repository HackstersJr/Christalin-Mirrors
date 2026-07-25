# Local Demo Script — Christalin Mirrors

A step-by-step run of the app end to end against a real Postgres. Every command
below was executed during runtime verification (see
`RUNTIME_VERIFICATION_DOCKER_POSTGRES.md`).

Two terminals: one for Postgres + backend, one for the frontend.

---

## 0. Prerequisites

- Node 20+ and npm
- **A Postgres 16 database.** Two ways:
  - **Docker (preferred):** `docker compose -f docker-compose.dev.yml up -d postgres`
  - **No Docker:** any local Postgres works — just point `DATABASE_URL` at it.
    (Verification used an `embedded-postgres` binary on port 5433; the Docker
    compose file uses the same port and credentials, so nothing else changes.)

---

## 1. Start Postgres

```bash
docker compose -f docker-compose.dev.yml up -d postgres
docker compose -f docker-compose.dev.yml ps        # wait for "healthy"
```

This gives you database `christalin_dev` on `localhost:5433`, user `christalin`,
password `christalin_dev_password` — all dev-only, matching the `.env` below.

---

## 2. Backend env

```bash
cd Backend
cp .env.example .env
```

Then edit `.env` — the only value you must change is `JWT_SECRET` (any 32+ char
string for local dev):

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://christalin:christalin_dev_password@localhost:5433/christalin_dev?schema=public
JWT_SECRET=<paste 32+ random chars>
FRONTEND_URL=http://localhost:5173
SEED_OWNER_EMAIL=owner@christalin.local
SEED_OWNER_PASSWORD=StrongLocalPassword123!
```

Generate a secret quickly:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

---

## 3. Install, migrate, seed

```bash
cd Backend
npm install
npm run migrate:deploy      # applies 0_init — creates all 14 tables
npm run prisma:generate
npm run seed                # idempotent; safe to re-run
```

> If your database already has these tables from an older `db push`, run
> `npm run migrate:baseline` instead of `migrate:deploy` — see
> `prisma/migrations/README.md`. `migrate:deploy` is correct for a fresh DB.

Seed output ends with `🎉 Seed complete. Re-running is safe.` and creates the
owner login below.

---

## 4. Start the backend

```bash
cd Backend
npm run dev
```

Wait for:
```
🪞 Christalin Mirrors API running on port 4000
```

Sanity check in another terminal:
```bash
curl http://localhost:4000/api/health          # {"status":"ok",...}
```

---

## 5. Start the frontend

```bash
cd Frontend
npm install
echo "VITE_API_BASE_URL=http://localhost:4000" > .env.local
npm run dev
```

Open **http://localhost:5173/admin/login**.

> `VITE_API_BASE_URL` is the bare origin — **no** `/api` suffix. The client
> appends `/api` itself.

---

## Demo login

| Field | Value |
|---|---|
| Email | `owner@christalin.local` |
| Password | whatever you set as `SEED_OWNER_PASSWORD` (e.g. `StrongLocalPassword123!`) |

These are local seed values, not production secrets.

---

## Demo flow

Do these in order — later steps read data the earlier ones create.

1. **Log in.** At `/admin/login`, enter the owner credentials → lands on the
   dashboard showing seeded revenue, appointments, and low-stock alerts.
   - *Show it's real auth:* type a wrong password first → "Invalid email or
     password". No password-bypass.

2. **Create a client.** Clients → Add Client → fill name / email / phone /
   gender → Save. It appears in the list immediately.

3. **Create an appointment.** Appointments → Add → pick the client, a service, a
   date/time → Save.

4. **Create an invoice.** Billing → pick the client → add a service line (and
   optionally a retail product) → set a discount if you like → the preview
   shows a running total.
   - *The point:* the browser sends only *what* and *how many*. The **server**
     prices every line from the catalogue and computes subtotal, discount, tax,
     and total. The confirmation screen shows the server's numbers, not the
     browser's.

5. **Mark it paid.** Collect Payment → confirm. Status flips to **Paid**.

6. **Verify stock moved once.** If the invoice included a product, open
   Inventory — its stock dropped by the quantity sold, exactly once.
   - *Show idempotency:* re-marking the same invoice paid does **not** decrement
     again.
   - *Show the guard:* try billing more of a product than exists → clean
     "Insufficient stock" error, and **no** invoice is created.

7. **Submit the public contact form.** Open the landing site (http://localhost:5173),
   go to the contact/booking form → submit. Succeeds against the backend (the old
   EmailJS placeholder is gone). Spam protection: honeypot + 5/hour rate limit.

8. **Prove persistence across sessions.** Open a second browser (or an incognito
   window), log in again → the client, appointment, and invoice from steps 2–5
   are all there. Nothing lived in the first browser's localStorage.

---

## Optional: show branch isolation

The seed makes one owner login. To demo scoping, create a branch-scoped user
(one-off, dev only):

```bash
cd Backend && npx prisma studio      # or a quick script
```
Add a `User` with role `RECEPTIONIST` linked to a Kalaburagi `Staff` row, then
log in as them: they see only Kalaburagi clients / invoices / inventory. A Bengaluru
record fetched by id returns **404**, and creating into another branch returns **403**.

---

## Known caveats

- **Docker compose not yet smoke-tested** if Docker was unavailable when this was
  written. The app is not Docker-aware, so `docker compose … up` should be a
  non-event — but it hasn't been run. (`RUNTIME_VERIFICATION_DOCKER_POSTGRES.md` R1.)
- **GST / rounding needs accountant sign-off.** The tax rule (18% on the
  post-discount amount, half-up, integer paisa) is a documented assumption in
  `Backend/src/utils/money.ts`, not a verified accounting rule. Review before any
  real GST filing.
- **v1 scope.** No refresh tokens (single 12h access token — a deactivated user
  keeps access until it expires), no audit log, no user-management UI (extra
  logins are seeded or added via Prisma). The full list and the trigger to revisit
  each is in `MVP_DEFERRED_TECH_DEBT.md`.

---

## Reset to a clean slate

```bash
cd Backend
npx prisma migrate reset      # drops, re-migrates, re-seeds (dev only)
```
