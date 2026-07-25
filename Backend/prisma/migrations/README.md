# Migrations

`0_init` is the **baseline** — it is the current `schema.prisma` expressed as SQL,
generated with `prisma migrate diff --from-empty`. It was never "applied" to the
database that already exists, because that database was built with `prisma db push`.

Pick the right path or you will lose data.

## Fresh / empty database

```bash
npm run migrate:deploy
```

## A database that already has the schema (built with `db push`)

The tables already exist, so **do not** run `migrate deploy` — it will try to
`CREATE TABLE` and fail. Mark the baseline as already applied instead:

```bash
npm run migrate:status     # expect: "1 migration found ... not yet applied"
npm run migrate:baseline   # records 0_init as applied, runs no SQL
npm run migrate:status     # expect: "Database schema is up to date"
```

`migrate:baseline` is `prisma migrate resolve --applied 0_init`. It only writes a
row to `_prisma_migrations`; it does not touch your tables.

> Take a backup before either path. Verify `migrate:status` is clean before Task 3
> adds the first real migration.

## From here on

Schema changes go through `npm run migrate:dev -- --name <what_changed>`.
`prisma db push` has been removed from `package.json` — it is what left this
project without a migration history in the first place.

## Seeding

`package.json` declares `prisma.seed`, so `migrate dev` and `migrate reset` run it
automatically. It requires `SEED_OWNER_PASSWORD` (12+ chars) and refuses to run
with `NODE_ENV=production`. It is idempotent — re-running converges rather than
duplicating, and it never deletes.

To wipe and rebuild in development: `npx prisma migrate reset`.
