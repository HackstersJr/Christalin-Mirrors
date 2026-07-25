/**
 * Golden fixtures for the money rules. No DB, no framework.
 *   npx tsx src/utils/__checks__/money.check.ts
 *
 * These lock in the accounting assumption documented in utils/money.ts.
 * If an accountant changes that assumption, these numbers change with it —
 * that is the point. They must never drift silently.
 */
import assert from 'node:assert/strict';
import { computeInvoiceTotals, roundHalfUp, lineTotal } from '../money';

const R = (rupees: number) => rupees * 100; // paisa

// ── line totals are exact ────────────────────────────────────
assert.equal(lineTotal(R(2500), 1), R(2500));
assert.equal(lineTotal(R(250), 3), R(750));

// ── half-up, including negatives ─────────────────────────────
assert.equal(roundHalfUp(0.5), 1);
assert.equal(roundHalfUp(1.5), 2);
assert.equal(roundHalfUp(2.4), 2);
assert.equal(roundHalfUp(-0.5), -1, 'half-up must be symmetric, not toward +Inf');

// ── ₹5300 subtotal, 10% off, 18% GST ─────────────────────────
// NOTE: three different answers exist in this codebase for this one invoice.
//   seed.ts hardcodes  tax 858.00 / total 5628.00  (hand-written, TRUNCATED)
//   Billing.tsx yields tax 859.00 / total 5629.00  (Math.round at RUPEE precision)
//   this engine yields tax 858.60 / total 5628.60  (exact at PAISA precision)
// 4770 * 0.18 = 858.6 exactly, so no rounding is even required here — the older
// two numbers are simply lossy. Paisa precision is the correct one and is what
// we persist. Flagged for the accountant under Q8.
{
  const t = computeInvoiceTotals(
    [
      { quantity: 1, unitPrice: R(5000), total: R(5000) },
      { quantity: 1, unitPrice: R(300), total: R(300) },
    ],
    { type: 'percent', value: 10 },
    18
  );
  assert.equal(t.subtotal, R(5300));
  assert.equal(t.discountAmount, R(530));
  assert.equal(t.taxAmount, 85860, 'GST must be on the POST-discount amount, at paisa precision');
  assert.equal(t.total, 562860);
}

// ── no discount ──────────────────────────────────────────────
{
  const t = computeInvoiceTotals([{ quantity: 1, unitPrice: R(3500), total: R(3500) }], undefined, 18);
  assert.equal(t.discountAmount, 0);
  assert.equal(t.taxAmount, R(630));
  assert.equal(t.total, R(4130));
}

// ── flat discount ────────────────────────────────────────────
{
  const t = computeInvoiceTotals([{ quantity: 1, unitPrice: R(1000), total: R(1000) }], { type: 'flat', value: R(100) }, 18);
  assert.equal(t.discountAmount, R(100));
  assert.equal(t.taxAmount, R(162)); // 18% of 900
  assert.equal(t.total, R(1062));
}

// ── discount cannot exceed subtotal ──────────────────────────
{
  const t = computeInvoiceTotals([{ quantity: 1, unitPrice: R(500), total: R(500) }], { type: 'flat', value: R(9999) }, 18);
  assert.equal(t.discountAmount, R(500));
  assert.equal(t.total, 0);
}

// ── sub-rupee rounding actually rounds ───────────────────────
{
  // 333 paisa @ 18% = 59.94 paisa → 60
  const t = computeInvoiceTotals([{ quantity: 1, unitPrice: 333, total: 333 }], undefined, 18);
  assert.equal(t.taxAmount, 60);
  assert.equal(t.total, 393);
  assert.ok(Number.isInteger(t.total), 'money must never be fractional paisa');
}

// ── every output is an integer ───────────────────────────────
{
  const t = computeInvoiceTotals(
    [{ quantity: 3, unitPrice: 777, total: 2331 }],
    { type: 'percent', value: 7 },
    18
  );
  for (const [k, v] of Object.entries(t)) {
    if (k === 'discountPercent' || k === 'taxPercent') continue;
    assert.ok(Number.isInteger(v), `${k} = ${v} must be integer paisa`);
  }
}

console.log('money checks passed');
