import { TokenPayload } from '../utils/jwt';
import { ForbiddenError } from '../utils/errors';

/**
 * Branch isolation lives here and is applied in the service layer, not in
 * middleware. Middleware sees only the request — it cannot know which branch
 * owns record `abc123` without querying, which is why the old
 * `enforceBranchScope` could never protect an :id route.
 *
 * Rules, all grep-able:
 *   1. every branch-owned service method takes ctx as its first argument
 *   2. every read merges ...branchScope(ctx)
 *   3. every write derives branchId via writeBranchId(ctx, body.branchId)
 *   4. no bare findUnique on a branch-owned model — use findFirst
 */

// ponytail: isolation is application-layer only. ceiling is that one forgotten
// `where` clause is a silent cross-branch leak. upgrade: Postgres RLS as a
// backstop when a second developer touches src/services/.

/** OWNER sees everything; everyone else is pinned to their own branch. */
export function branchScope(ctx: TokenPayload): { branchId?: string } {
  return ctx.role === 'OWNER' ? {} : { branchId: ctx.branchId };
}

/**
 * Resolve the branch a write lands in. Non-owners can never target another
 * branch, no matter what the request body says.
 */
export function writeBranchId(ctx: TokenPayload, requested?: string | null): string {
  if (ctx.role === 'OWNER') return requested || ctx.branchId;
  if (requested && requested !== ctx.branchId) {
    throw new ForbiddenError('Cannot create or modify resources in another branch');
  }
  return ctx.branchId;
}

/** Roles allowed to mutate the shared (non-branch-owned) catalogue and settings. */
export function requireManager(ctx: TokenPayload): void {
  if (ctx.role !== 'OWNER' && ctx.role !== 'MANAGER') {
    throw new ForbiddenError(`Role '${ctx.role}' is not permitted for this action`);
  }
}

/**
 * Maximum discount percentage each role may apply to an invoice.
 *
 * Server pricing (utils/money.ts) already stops anyone inventing a price, but an
 * unbounded discount reaches the same place: a ₹5000 service discounted 100% is
 * a ₹0 invoice. This is the cheapest control that closes that gap.
 */
const MAX_DISCOUNT_PERCENT: Record<string, number> = {
  OWNER: 100,
  MANAGER: 30,
  RECEPTIONIST: 10,
};

/**
 * Checked against the EFFECTIVE percentage, after flat amounts have been
 * resolved against the subtotal — otherwise `{type:'flat', value:<subtotal>}`
 * would be a 100% discount that never trips a percent-based cap.
 */
export function assertDiscountAllowed(ctx: TokenPayload, effectivePercent: number): void {
  const max = MAX_DISCOUNT_PERCENT[ctx.role] ?? 0;
  // Tolerate float dust from the flat→percent conversion (e.g. 10.0000001).
  if (effectivePercent > max + 0.001) {
    throw new ForbiddenError(
      `Role '${ctx.role}' may apply at most ${max}% discount (this invoice is ${effectivePercent.toFixed(2)}%)`
    );
  }
}
