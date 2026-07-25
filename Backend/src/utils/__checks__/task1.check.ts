/**
 * Task 1 self-check. No framework, no DB.
 *   npx tsx src/utils/__checks__/task1.check.ts
 *
 * Fails if either half of Task 1 regresses:
 *   1. ah() must route a rejected promise to next(), not leave it unhandled.
 *   2. parsePagination() must never emit NaN.
 */
import assert from 'node:assert/strict';
import { ah } from '../asyncHandler';
import { parsePagination } from '../pagination';

async function main() {
// ── 1. ah() forwards async rejections to next() ──────────────
const boom = new Error('boom');
let forwarded: unknown = null;

await new Promise<void>((resolve) => {
  ah(async () => {
    throw boom;
  })({} as any, {} as any, (err?: unknown) => {
    forwarded = err;
    resolve();
  });
});
assert.equal(forwarded, boom, 'ah() must pass the rejection to next()');

// a resolving handler must NOT call next()
let calledNext = false;
await ah(async () => {})({} as any, {} as any, (() => {
  calledNext = true;
}) as any);
assert.equal(calledNext, false, 'ah() must not call next() on success');

// ── 2. parsePagination never yields NaN ──────────────────────
for (const q of [
  { page: 'abc' }, // the crash that took the API down
  { limit: 'xyz' },
  { page: '', limit: '' },
  { page: '-5' },
  { page: undefined, limit: undefined },
  { page: '1e999' }, // Infinity
  { limit: '99999' }, // above the cap
]) {
  const p = parsePagination(q as any);
  for (const [k, v] of Object.entries(p)) {
    assert.ok(Number.isFinite(v), `parsePagination(${JSON.stringify(q)}).${k} = ${v}`);
  }
  assert.ok(p.page >= 1 && p.limit >= 1 && p.limit <= 100 && p.skip >= 0);
}

// defaults and clamps still behave
assert.deepEqual(parsePagination({}), { page: 1, limit: 20, skip: 0 });
assert.equal(parsePagination({ limit: '500' }).limit, 100);
assert.equal(parsePagination({ page: '3', limit: '10' }).skip, 20);

console.log('task1 checks passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
