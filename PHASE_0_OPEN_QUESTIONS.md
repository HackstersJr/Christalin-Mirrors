# PHASE 0 — Open Questions

Only questions that **block** Phase 1. Each has a suggested default so that silence does not stall work — if a question is not answered before its blocking task begins, the default is taken and recorded in the Ponytail debt ledger.

Sorted by the task they block.

---

## Q1 — May a RECEPTIONIST mark an invoice PAID and apply discounts?

**Blocks:** Task 3 (role matrix), Task 6 (billing)

**Why it matters.** `POST /invoices` currently has no role gate at all, so the lowest-privileged role can create an invoice, mark it PAID, and trigger every side effect (stock decrement, visit increment, appointment closure). Once pricing is server-authoritative the price is safe, but *discount* remains a legitimate money-moving lever — an unbounded discount is functionally the same as setting the price. This is a cash-handling policy question, not a technical one.

**If unanswered.** The role matrix in the risk map cannot be finalised, so Task 3 either over-restricts (receptionists cannot run the till — breaks the business) or under-restricts (the C2 fraud vector survives in discount form).

**Suggested default.** RECEPTIONIST **may** create and mark invoices PAID — that is the front-desk job. RECEPTIONIST **may** apply a discount up to a configurable ceiling (default 10%); above that requires MANAGER. Store the ceiling in `SalonSettings` so it is changeable without a deploy.

---

## Q2 — Invoice numbering: global, per-branch, or per-financial-year?

**Blocks:** Task 6 (billing), and the migration in Task 2 if the sequence table changes shape

**Why it matters.** Today: one global `InvoiceSequence` row, format `CM-INV-0000`, which overflows its padding at 10 000 invoices and is shared across all branches. Indian GST rules generally expect a per-financial-year consecutive series, and a per-branch series is normal for multi-location businesses. Separately, the single row is locked for the duration of every invoice transaction, so **every invoice created anywhere in the business serialises through it** — a throughput ceiling that also lengthens the window for the concurrency issues in M10/M11.

**If unanswered.** Task 6 ships a numbering scheme that may be non-compliant, and renumbering historical invoices later is painful and audit-visible.

**Suggested default.** Per-branch, per-financial-year: `CM-{BRANCH}-{FY}-{00000}` (e.g. `CM-BLR-2627-00001`), 5-digit padding, one sequence row per `(branchId, fy)`. This also removes the global lock. **Confirm with whoever files the GST returns** — this is a compliance question and I am not the right authority on it.

---

## Q3 — Confirm the 15-minute access token, and that the frontend will implement refresh-retry

**Blocks:** Task 5 (auth)

**Why it matters.** Access tokens expire in 15 minutes and `Frontend/src/lib/api.ts` has **no refresh flow** — its 401 interceptor clears the token and hard-redirects to the login page. As written, integration produces a forced logout every 15 minutes mid-transaction, including mid-invoice at the till. Separately, `tokenVersion` gives immediate revocation but every request then pays one indexed lookup; if 15 minutes of staleness is acceptable, that lookup can be skipped.

**If unanswered.** Task 5 builds a token strategy the client cannot consume, and the first integration test fails on a losing-work-at-the-till scenario.

**Suggested default.** Keep 15 minutes. Add refresh-on-401-then-retry to the axios interceptor as an explicit Phase 2 line item (a single-flight queue so concurrent 401s trigger one refresh). Implement `tokenVersion` and accept the per-request lookup — correctness over a micro-optimisation at this scale.

---

## Q4 — Who may transfer staff between branches?

**Blocks:** Task 3 (H6 fix)

**Why it matters.** `Staff.branchId` is the source of the `branchId` claim minted into every JWT at login. Whoever can write it controls what that user can see once branch scoping is live. Today any MANAGER can rewrite it for any staff member, including the OWNER's own record. But if managers routinely move staff between the Bengaluru and Kalaburagi branches for cover, locking this to OWNER creates real friction.

**If unanswered.** Either H6 stays open, or a legitimate day-to-day operation now needs the owner.

**Suggested default.** OWNER only. Transfers are rare in a two-branch salon, and the blast radius of getting it wrong is the whole authorization model. Expose it as an explicit `POST /admin/staff/:id/transfer` endpoint rather than a field on the generic update, so it is separately auditable.

---

## Q5 — Cloudinary: wire up image upload, or remove it?

**Blocks:** Task 8 (env/config cleanup) — low blast radius but needs a decision

**Why it matters.** `middleware/upload.ts` and `config/cloudinary.ts` are fully written and imported by **nothing**, yet three Cloudinary env vars are hard-required at boot (`config/env.ts:12-14`), so the app refuses to start without credentials for dead code. That blocks CI, new-developer setup, and test environments today. Meanwhile `Staff.avatarUrl`, `Branch.imageUrl`, and `Service.imageUrl` all exist in the schema and are never populated — so the feature was clearly intended.

**If unanswered.** Either the dead code and boot-blocking env vars persist, or upload capability is deleted and has to be rebuilt later.

**Suggested default.** Make the Cloudinary env block **optional** in Task 8 (validate lazily at point of use) and keep the helper. Defer wiring the actual upload routes to Phase 2 alongside frontend integration — that is when there is a UI to upload from. This unblocks CI now without deleting intended work.

---

## Q6 — Should clients be deduplicated on email or phone?

**Blocks:** ~~Task 2~~ — **now needs its own migration.** Task 2 shipped without it.

> **Status change (2026-07-23).** Task 2 was approved and shipped while this question was
> still open, so no index was added — the baseline is a faithful capture of the existing
> schema and nothing more. The suggested default is still the right answer, but it is no
> longer free: it now needs a dedicated migration rather than riding along in `0_init`.
> Cost of the delay is small (one extra migration file). Cost grows with every duplicate
> client row created in the meantime.
>
> Note the seed already works around the missing constraint — it matches clients on
> `(email, branchId)` manually because `Client` has no unique column to upsert against.

**Why it matters.** `Client.email` and `Client.phone` are not unique and there is no dedup on create. The same person booked twice becomes two records with split visit history, which then feeds `totalVisits`, `lastVisit`, and the dashboard client count. Adding a unique constraint later requires resolving existing duplicates, which is much harder than preventing them.

**If unanswered.** Duplicate clients accumulate and quietly degrade the CRM value of the product; retrofitting the constraint gets more expensive with every row.

**Suggested default.** Add a **non-unique index** on `(branchId, phone)` in Task 2. Nothing else. Avoid a hard unique constraint — families genuinely share phone numbers and walk-ins legitimately have no email. The index is what makes any future dedup cheap; a 409-and-merge flow is a Phase 2 feature request, not a Phase 1 decision, and was cut here by the Ponytail review for smuggling a feature into a constraint question.

---

## Q7 — May a MANAGER edit salon settings?

**Blocks:** Task 3 (role matrix)

**Why it matters.** `PUT /admin/settings` currently allows `OWNER, MANAGER`. Settings are global (name, email, phone, hours, social links) and are **not** branch-scoped, so a manager at one branch edits values shown on the public site for the whole business. Once Q1's discount ceiling lands in `SalonSettings`, this becomes a privilege-escalation path: a manager who can edit settings can raise their own discount ceiling.

**If unanswered.** The discount ceiling from Q1 is not actually enforceable against managers.

**Suggested default.** OWNER only for `PUT /admin/settings`. MANAGER retains read access. If managers need to edit branch phone or hours, that belongs on the `Branch` record (which *is* scopeable), not on global settings.

---

## Q8 — Sign off the money rounding rule

**Blocks:** Task 6 (billing) — **hard blocker, cannot proceed without it**

**Why it matters.** The frontend rounds in whole rupees (`Math.round(subtotal * pct/100)`); the backend stores integer paisa. Moving the arithmetic server-side without pinning the rule changes computed totals by up to a rupee per invoice versus what the mock UI shows today. Graphify shows `paisaToRupees()` is called from four services including inside the invoice transaction (RC2), so this rule is load-bearing for revenue reporting and `ServiceVisit` history, not just display.

**If unanswered.** Task 6 cannot produce a golden test, which means server-authoritative pricing ships without a reproducibility guarantee — the one thing it exists to provide.

**Suggested default.** The §E.5 rule in `PHASE_0_IMPLEMENTATION_PLAN.md`: all arithmetic in integer paisa; exact line totals and subtotal; half-up rounding at exactly two points (discount amount, then tax amount); GST computed on the post-discount amount. This matches the frontend's order of operations at one finer granularity, so differences are sub-rupee and explainable.

**Confirm specifically:** (a) is GST charged on the post-discount amount? (b) half-up or banker's rounding? (c) is a flat-rupee discount entered inclusive or exclusive of GST? Whoever signs the GST returns should answer these — they are accounting policy, not engineering preference.

---

## Non-blocking — noted, deferred, do not answer now

Recorded so they are not lost, but no Phase 1 task waits on them:

- Should `ContactSubmission` get a read endpoint and a retention policy? (G4 — no consumer today)
- `Invoice.dueDate` exists in the frontend types but not the schema — add the column or drop the field? (D5)
- Should `ServiceVisit` get read endpoints? (G1/G2 — blocks the client-history UI in Phase 2, not Phase 1)
- User management endpoints — create login, change password, deactivate. (G5 — currently seed-only; needed before a second staff member can log in, so it lands early in Phase 2)
