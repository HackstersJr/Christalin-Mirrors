# PHASE 0 — Graphify Findings

**Agent C — Graphify Knowledge Base Reader**
Date: 2026-07-23 · Graphify 0.9.25 · Graph commit `9ed1364a`

---

## C.0 How the graph was built, and its limits

```bash
uv tool install graphifyy          # uv was absent; installed via pip first
graphify install
graphify extract . --code-only --max-workers 4
graphify cluster-only . --no-label
```

**Result (initial build):** 443 nodes · 747 edges · 21 communities · 82 code files indexed.

> **Refreshed 2026-07-23 after Tasks 1–2** via `graphify update .` → **637 nodes · 937 edges ·
> 32 communities.** Two caveats on the new numbers: the `PHASE_0_*.md` documents are now
> themselves indexed, so markdown headings appear in the god-node list and inflate the counts
> — ignore them. And `0_init/migration.sql` contributed **nothing** (`tree_sitter_sql` not
> installed; `pip install "graphifyy[sql]"` if SQL coverage is ever wanted).
>
> The refresh did serve one real purpose — independent verification of Task 1:
> `graphify affected "ah()"` shows `routes/index.ts [imports]` and reachability from
> `app.ts`, confirming the wrapper is genuinely wired and not just present.
> `parsePagination()` moved 8 → 11 edges, the new ones from its self-check.
**Outputs:** `graphify-out/GRAPH_REPORT.md`, `graph.json` (431 KB), `graph.html` (366 KB), `.graphify_analysis.json`, `manifest.json`.

### Deviation from the requested command — read this before trusting coverage

The briefing asked for `/graphify . --mode deep`. **Deep mode did not run.** It requires an LLM backend for semantic INFERRED-edge extraction, and no API key is configured (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `KIMI_API_KEY` all unset; `claude` CLI not on PATH).

What ran instead is the local tree-sitter AST extraction. Consequences:

| | AST mode (what ran) | Deep mode (not run) |
|---|---|---|
| `imports`, `imports_from`, `calls`, `contains` edges | ✅ complete | ✅ |
| Symbol/function/type nodes | ✅ complete | ✅ |
| Semantic INFERRED edges ("this route conceptually owns this model") | ⚠️ 3 edges only, avg confidence 0.6 | ✅ |
| Community *names* | ❌ placeholders (`Community 0`…) | ✅ LLM-named |

`GRAPH_REPORT.md` reports **100% EXTRACTED · 0% INFERRED**. Every structural claim below is therefore backed by a real parsed edge, not an inference — higher precision, lower recall. The gap that matters: the graph **cannot see HTTP call relationships** (a frontend `axios.get('/api/x')` → backend route is a string, not an import). That gap was closed manually by grep, and is what surfaced the finding in §C.2.

**To upgrade later:** set an API key and run `graphify extract . --mode deep --force`.

**Also skipped:** 26 non-code files (`--code-only`) and 46 unclassified files (all `.css`). `stitch.json` produced zero nodes.

---

## C.1 Verified architecture

### Route → service path (graph-confirmed)

```
graphify path "router" "invoiceService"
→ router <--contains-- routes/index.ts --imports_from--> domainControllers.ts --imports--> invoiceService
```

Three hops, no shortcuts. This confirms the layering is genuinely clean — **there is no path from a route to Prisma that bypasses a service.** The one exception the graph does *not* show, found by reading, is `publicController.contact` doing a dynamic `await import('../utils/prisma')` inside the handler (`domainControllers.ts:89`) — an untracked back-channel that skips the service layer (finding M9).

### Backend request flow (text diagram)

```
                        ┌─────────────────────────────────────────┐
  HTTP ──> app.ts ──>   │ cors → express.json → express.urlencoded│
                        └─────────────────────────────────────────┘
                                        │
                              routes/index.ts (router)
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 │                      │                      │
            /api/health          /api/public/*           /api/admin/*
              (open)            (open, unlimited)               │
                                        │             admin.use(authenticate)
                                        │                       │
                                        │              [requireRole] on SOME
                                        │              [validate(schema)] on body only
                                        │                       │
                                        └──> publicController   ├──> dashboardController
                                             (⚠ direct prisma)  └──> domainControllers (8 controllers)
                                                                          │
                                                            services/*.ts (business + persistence + mapping)
                                                                          │
                                                                  utils/prisma.ts (single client)
                                                                          │
                                                                     PostgreSQL
  errors ──> errorHandler (LAST)   ⚠ unreachable from async services — finding C3
```

### Auth flow (Community 9, cohesion 0.18 — the tightest backend cluster)

```
POST /auth/login ──> authController.login ──> authService.login
                                                │
                    ┌───────────────────────────┼────────────────────────────┐
              prisma.user.findUnique        comparePassword            signAccessToken (15m, JWT_SECRET)
              include staff.branch          (bcryptjs, cost 12)        signRefreshToken (7d, JWT_REFRESH_SECRET)
                                                                             │
                                            hashPassword(refreshToken) ──> User.refreshToken
                                            ⚠ bcrypt truncates at 72 bytes — finding H4

Protected request ──> authenticate() ──> verifyAccessToken ──> req.user = TokenPayload
                                          ⚠ NO database read. Token is the entire authorization picture.
                                          {sub, email, role, staffId, branchId}
                                                    │
                                          branchId originates from Staff.branchId at login time
                                          ⟹ whoever can write Staff.branchId controls token scope (H6)
```

The graph places `authenticate()`, `authService`, `jwt.ts`, `TokenPayload`, and `express.d.ts` in one community — the auth surface is genuinely self-contained, which makes H4/M7 a **contained** refactor. Good news for sequencing.

### Invoice flow — the critical path

```
POST /admin/invoices
  └─> validate(createInvoiceSchema)      ⚠ body only; nothing validates params/query (C3)
  └─> invoiceController.create           ⚠ async, unwrapped (C3)
      └─> invoiceService.create
          └─ prisma.$transaction:
             1. invoiceSequence.upsert {increment}   ⚠ ONE global row — serialises all invoice
                → `CM-INV-0001`                         creation business-wide (L21)
             2. invoice.create + nested items.create
                ⚠ all monetary fields taken verbatim from request body (C2)
             3. if status === 'PAID' → executePaidSideEffects(tx, ...)
                ├─ 3a per item.productId: findUnique → update Math.max(0, stock-qty)
                │     ⚠ read-then-write race + silent clamp (M11)
                ├─ 3b client.update {totalVisits: increment, lastVisit}
                ├─ 3c serviceVisit.create   (only when clientId AND staffId present)
                │     ⚠ the accidental idempotency guard — absent for walk-ins (M10)
                └─ 3d appointment.update {status: COMPLETED}
                      ⚠ bypasses appointmentService.VALID_TRANSITIONS state machine
```

Graph-confirmed call edges into the currency layer:

```
invoiceService.mapToFrontend()        --calls--> paisaToRupees()   [currency.ts]
invoiceService.executePaidSideEffects()--calls--> paisaToRupees()   [currency.ts:212]
inventoryService.mapToFrontend()      --calls--> paisaToRupees()   [currency.ts:31]
serviceService.mapToFrontend()        --calls--> paisaToRupees()   [currency.ts:12]
```

---

## C.2 The finding the graph surfaced that grep would have missed

Community 0 and Community 1 contain, side by side:

```
Community 0 (33 nodes): ProtectedRoute(), InvoiceDetail(), InvoiceList(), Login(),
                        "TODO: Replace with real POST /api/auth/login call", queryClient
Community 1 (42 nodes): mockAppointments, mockClients, mockInventory, mockInvoices,
                        mockServices, mockStaff, defaultSettings, useToast()
Community 18 (3 nodes): adminApi, publicApi, config          ← isolated, zero inbound edges
```

A TODO string promoted to a graph node, a full mock-data community, and the API client sitting in a **3-node island** — that combination is what prompted the verification in Agent A that proved the frontend makes no API calls at all. The clustering made the isolation visible; grep then confirmed it.

**Knowledge-base note for future sessions:** Community 18 having no inbound edges is the canonical signal that frontend↔backend integration has not happened. If a future graph shows pages importing `adminApi`, integration has begun.

---

## C.3 God nodes — architectural hubs

| Rank | Node | Edges | Why it matters for Phase 1 |
|---|---|---|---|
| 1–2 | `compilerOptions` ×2 | 17 | tsconfig artifacts, not code. Backend's `baseUrl`+`paths` are **unused** (zero `@/` imports) — deleting them also clears the TS deprecation error. |
| 3 | `NotFoundError` | 11 | Thrown by every service `getById`. **Every one of those 11 throws is currently unreachable** (C3). Fixing `asyncHandler` activates 11 call sites at once — highest-leverage single fix. |
| 4 | `prisma` | 11 | Single global client, no pool config, no `$disconnect` (L20). |
| 5 | `paisaToRupees()` | 9 | The money boundary. Any rounding change (D4) ripples to all 9. |
| 6 | `AppError` | 9 | Error taxonomy root — same reachability problem as `NotFoundError`. |
| 9–10 | `parsePagination()` / `paginate()` | 8 each | 8 callers each. The `NaN` bug (C3) is reachable from **all 8 list endpoints**, not just one. |
| 11,14,15 | `Appointment`, `Client`, `Invoice` types | 7–8 | Shared frontend types — the D1–D8 divergence surface. |

**Sequencing read:** the top of this table is dominated by error handling and pagination — both fixed by Phase 1 Task 1. The graph independently confirms Task 1 is the correct first move.

---

## C.4 Risky couplings

| # | Coupling | Evidence | Risk |
|---|---|---|---|
| **RC1** | All 8 services import the same global `prisma` singleton | 11 edges on `prisma` | No seam to inject an `AuthContext`-scoped client. Scoping must be threaded explicitly (per-parameter), not injected — confirms Agent D's design. |
| **RC2** | `paisaToRupees` called from 4 services incl. inside a transaction | graph edges above | Changing the rounding rule silently changes historical figures. Pin the rule with a golden test **before** touching C2. |
| **RC3** | `errorHandler` reachable only from sync middleware | `app.ts` last, controllers all async | The taxonomy is dead weight until C3 lands. Do not build new error types first. |
| **RC4** | `executePaidSideEffects` writes 4 tables in one function | `invoiceService.ts:180-241` | Highest-fan-out mutation in the codebase. M10+M11 must be fixed together, in one change, with one test. |
| **RC5** | `InvoiceSequence` single row inside every invoice transaction | `invoiceService.ts:78` | Global write lock held while inventory updates run. Concurrency work (M10/M11) must not lengthen this transaction. |
| **RC6** | 4 duplicate `mapToFrontend` functions, same name, different modules | invoice / inventory / service / appointment | Name collision makes graph queries and greps ambiguous. Rename when touched — do not do a dedicated pass. |
| **RC7** | Frontend `types.ts` is the de facto shared contract with **zero** enforcement | 1 edge, 14 consumers | Backend mapper output and frontend types can drift with nothing detecting it. This is the case for generating types from Zod later. |

---

## C.5 Files that must NOT change yet

> **Updated after Task 2** — `prisma/schema.prisma` is **no longer frozen**. The baseline was
> captured, so schema edits are now safe *provided* they go through `npm run migrate:dev`.
> `prisma db push` has been removed from `package.json`; do not reintroduce it.

| File | Why frozen |
|---|---|
| ~~`prisma/schema.prisma`~~ | ✅ **unfrozen** — baseline `0_init` captured in Task 2. Edits must go through `migrate:dev`. |
| `prisma/seed.ts` | Contains `deleteMany()` on all 15 tables. Do not run, do not partially edit. Rewrite wholesale in Task 2. |
| `Frontend/src/**` | Out of Phase 1 backend scope. Changing it now creates a moving target for the contract. |
| `Frontend/src/lib/api.ts` | Dead but **load-bearing for Phase 2**. Ponytail flagged it for deletion; Agent A overrules — keep. |
| `src/services/invoiceService.ts` | Not frozen, but must not be touched until Task 1 (`asyncHandler`) and the golden rounding test both exist. RC2+RC4. |
| `src/middleware/rbac.ts` | Delete only when the data-layer scope replaces it, in the same commit. Removing it early leaves a phantom control in review diffs. |

---

## C.6 Knowledge-base notes for future sessions

1. **Graph freshness.** Built at `9ed1364a`. Run `git rev-parse HEAD` and compare; `graphify update .` re-extracts with no API cost.
2. **The graph has no HTTP edges.** Route↔frontend links must always be established by grep. Do not conclude "no coupling" from graph silence.
3. **Community 18 isolation = integration not started.** The canary described in §C.2.
4. **Import cycles: none detected.** Layering is genuinely acyclic; keep it that way when adding `src/auth/scope.ts`.
5. **153 isolated nodes** are almost all `package.json`/`tsconfig` keys — noise, not knowledge gaps.
6. **Useful queries:**
   ```bash
   graphify path "router" "<service>"      # confirm no layer is skipped
   graphify affected "paisaToRupees()"     # money blast radius before touching C2
   graphify god-nodes --top 20             # re-check hubs after refactors
   ```
7. **Cohesion is low across the board** (0.05–0.12 for the big communities). The report suggests splitting them. **Ignore that suggestion** — it reflects a small codebase with flat layering, not a design flaw. Splitting would be exactly the over-engineering Ponytail is here to prevent.

---

## C.7 Recommendation

**Recommendation:** Adopt the graph as the Phase 1 navigation aid, but re-run `graphify update .` after each Phase 1 task and treat `god-nodes` drift as a review signal.
**Why:** Task 1 (`asyncHandler`) and Task 3 (`AuthContext`) both touch every controller and service. The god-node list is a cheap check that the intended files — and only those — actually changed.
**Why not:** Do not treat the graph as authoritative on coupling that crosses HTTP; it has no such edges, and the biggest Phase 0 finding lived exactly in that blind spot.
**Alternatives rejected:** Grep-only navigation (missed the Community 18 isolation signal); running deep mode now (needs an API key, and the AST edges already answer the structural questions).
**Risk:** A stale graph is worse than none — it invites confident wrong conclusions.
**Verification:** Compare `graph.json` commit against `git rev-parse HEAD` at the start of every session; re-extract if they differ.
