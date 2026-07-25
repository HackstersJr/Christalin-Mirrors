/**
 * Discount ceiling rules. No DB, no framework.
 *   npx tsx src/utils/__checks__/discount.check.ts
 *
 * The cap is checked against the EFFECTIVE percentage, so a flat discount
 * cannot be used to sneak past a percent-based limit.
 */
import assert from 'node:assert/strict';
import { assertDiscountAllowed } from '../../auth/scope';
import { computeInvoiceTotals } from '../money';
import { TokenPayload } from '../jwt';

const as = (role: string): TokenPayload => ({
  sub: 'u', email: 'e@e.com', role, staffId: 's', branchId: 'b',
});

const allowed = (role: string, pct: number) => {
  try { assertDiscountAllowed(as(role), pct); return true; } catch { return false; }
};

// ── caps per role ────────────────────────────────────────────
assert.equal(allowed('OWNER', 100), true, 'owner may discount fully');
assert.equal(allowed('MANAGER', 30), true, 'manager at the cap is allowed');
assert.equal(allowed('MANAGER', 30.5), false, 'manager above cap rejected');
assert.equal(allowed('RECEPTIONIST', 10), true, 'receptionist at the cap is allowed');
assert.equal(allowed('RECEPTIONIST', 11), false, 'receptionist above cap rejected');
assert.equal(allowed('RECEPTIONIST', 100), false, 'receptionist cannot zero an invoice');

// unknown role gets nothing
assert.equal(allowed('INTERN', 1), false, 'unknown role defaults to no discount');
assert.equal(allowed('INTERN', 0), true, 'unknown role may still bill at full price');

// ── the bypass this guards: flat discount == 100% ────────────
{
  const lines = [{ quantity: 1, unitPrice: 500000, total: 500000 }]; // ₹5000
  const t = computeInvoiceTotals(lines, { type: 'flat', value: 500000 }, 18);
  assert.equal(t.discountPercent, 100, 'a flat discount equal to subtotal is 100%');
  assert.equal(t.total, 0);
  assert.equal(allowed('RECEPTIONIST', t.discountPercent), false,
    'flat-discount bypass must be rejected for receptionist');
  assert.equal(allowed('OWNER', t.discountPercent), true);
}

// ── a modest flat discount stays within a receptionist's cap ──
{
  const lines = [{ quantity: 1, unitPrice: 500000, total: 500000 }]; // ₹5000
  const t = computeInvoiceTotals(lines, { type: 'flat', value: 25000 }, 18); // ₹250 = 5%
  assert.equal(t.discountPercent, 5);
  assert.equal(allowed('RECEPTIONIST', t.discountPercent), true);
}

// ── no discount is always fine ───────────────────────────────
assert.equal(allowed('RECEPTIONIST', 0), true);

console.log('discount checks passed');
