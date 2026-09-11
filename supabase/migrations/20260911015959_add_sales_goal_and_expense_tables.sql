-- Backs two new owner-only reports: the Daily Sales Report (goals vs.
-- actuals, see Frontend/src/admin/pages/DailySalesReport.tsx) and the
-- Monthly P&L Statement (see Frontend/src/admin/pages/ProfitLoss.tsx).
-- Both are company-wide (not branch-scoped) — the salon's owner sets one
-- monthly goal and one set of monthly costs across all branches combined.

create table public."SalesGoal" (
    month text primary key,                          -- 'YYYY-MM'
    "daysOpen" integer not null default 26,
    "clientCountGoal" integer not null default 0,
    "retailSalesGoal" integer not null default 0,     -- paisa
    "serviceSalesGoal" integer not null default 0,    -- paisa
    "updatedAt" timestamptz not null default now()
);

alter table public."SalesGoal" enable row level security;

create policy "owner_insert" on public."SalesGoal"
    for insert
    to authenticated
    with check (public.auth_role() = 'owner');

create policy "owner_read" on public."SalesGoal"
    for select
    to authenticated
    using (public.auth_role() = 'owner');

create policy "owner_update" on public."SalesGoal"
    for update
    to authenticated
    using (public.auth_role() = 'owner');

-- One editable amount per (month, category) — the fixed line items from the
-- P&L template that aren't derivable from existing sales/inventory data
-- (commissions, labor, rent, salaries, etc). Revenue and product COGS are
-- computed from Invoice/InvoiceItem/InventoryItem instead of stored here.
create table public."Expense" (
    id text primary key default gen_random_uuid()::text,
    month text not null,                              -- 'YYYY-MM'
    category text not null check (category in (
        'SERVICE_COMMISSIONS', 'RETAIL_COMMISSIONS', 'DIRECT_PROFESSIONAL_LABOR', 'TRANSACTION_FEES',
        'SALARIES_WAGES', 'BENEFITS_INSURANCE', 'PAYROLL_TAX', 'GENERAL_ADMIN', 'UTILITIES',
        'REPAIRS_MAINTENANCE', 'RENT_LEASE', 'DEPRECIATION', 'DEBTS_LOANS'
    )),
    amount integer not null default 0,                -- paisa
    notes text,
    "updatedAt" timestamptz not null default now(),
    unique (month, category)
);

alter table public."Expense" enable row level security;

create policy "owner_insert" on public."Expense"
    for insert
    to authenticated
    with check (public.auth_role() = 'owner');

create policy "owner_read" on public."Expense"
    for select
    to authenticated
    using (public.auth_role() = 'owner');

create policy "owner_update" on public."Expense"
    for update
    to authenticated
    using (public.auth_role() = 'owner');

create index "expense_month_idx" on public."Expense" (month);
