-- The P&L now needs each branch's own Net Profit to compute the CEO Share
-- (ownership % differs per branch: Bengaluru 100%, Kalaburagi 32/32/36,
-- Belgaum 70/30), so Expense moves from one company-wide row per
-- (month, category) to one row per (month, branch, category).
-- No real cost data has been entered yet (feature just shipped), so it's
-- safe to require branchId going forward rather than backfill old rows.

alter table public."Expense" add column "branchId" text references public."Branch"(id);

delete from public."Expense" where "branchId" is null;
alter table public."Expense" alter column "branchId" set not null;

alter table public."Expense" drop constraint if exists "Expense_month_category_key";
alter table public."Expense" add constraint "Expense_month_branchId_category_key" unique (month, "branchId", category);

create index if not exists "expense_branch_idx" on public."Expense" ("branchId");
