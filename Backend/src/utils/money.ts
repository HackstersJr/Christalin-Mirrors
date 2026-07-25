/**
 * The ONLY place invoice money arithmetic happens. Do not scatter rounding
 * across services.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ACCOUNTING ASSUMPTION — REVIEW BEFORE GST FILING
 *
 * This encodes a product assumption, not a verified accounting rule. It matches
 * what the frontend's Billing.tsx did (Math.round on rupee values), one
 * granularity finer. An accountant should confirm all three points:
 *
 *   1. GST is charged on the POST-discount amount.
 *   2. Rounding is HALF-UP.
 *   3. Rounding is applied at exactly two points — the discount amount and the
 *      tax amount. Line totals and the subtotal are exact (no per-line rounding),
 *      and the grand total is a pure sum, never re-rounded.
 *
 * All persisted money is an integer count of paisa. Rupees exist only at the
 * API boundary.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Half-up. Math.round() is half-up for positives but half-toward-+Inf for negatives. */
export function roundHalfUp(n: number): number {
  return Math.sign(n) * Math.round(Math.abs(n));
}

export type Discount = { type: 'percent' | 'flat'; value: number };

export interface PricedLine {
  quantity: number;
  /** paisa, resolved server-side from the catalogue — never from the request */
  unitPrice: number;
  /** paisa */
  total: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
}

/** Exact: quantity is an integer and unitPrice is already integer paisa. */
export function lineTotal(unitPricePaisa: number, quantity: number): number {
  return unitPricePaisa * quantity;
}

/**
 * @param lines     server-priced lines (paisa)
 * @param discount  percent (0-100) or flat rupee-free paisa amount
 * @param taxPercent GST percent, from settings — not from the request
 */
export function computeInvoiceTotals(
  lines: PricedLine[],
  discount: Discount | undefined,
  taxPercent: number
): InvoiceTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.total, 0);

  // ROUNDING POINT 1
  let discountAmount = 0;
  let discountPercent = 0;
  if (discount && discount.value > 0) {
    if (discount.type === 'percent') {
      discountPercent = discount.value;
      discountAmount = roundHalfUp((subtotal * discount.value) / 100);
    } else {
      discountAmount = Math.min(discount.value, subtotal);
      discountPercent = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
    }
  }
  if (discountAmount > subtotal) discountAmount = subtotal;

  const taxable = subtotal - discountAmount;

  // ROUNDING POINT 2 — GST on the post-discount amount
  const taxAmount = roundHalfUp((taxable * taxPercent) / 100);

  return {
    subtotal,
    discountPercent,
    discountAmount,
    taxPercent,
    taxAmount,
    total: taxable + taxAmount, // pure sum, never re-rounded
  };
}
