import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

/**
 * OWNER  — full access everywhere
 * MANAGER — full access within own branch, view-only other branches
 * RECEPTIONIST — own branch only, no deletes, no settings
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(`Role '${req.user.role}' is not permitted for this action`);
    }
    next();
  };
}

/** Ensures RECEPTIONIST can only access own-branch resources */
export function enforceBranchScope(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }
  // OWNER has no branch restriction
  if (req.user.role === 'OWNER') return next();

  // For branch-scoped queries via query param
  const branchId = req.query.branchId || req.body?.branchId || req.params.branchId;
  if (branchId && branchId !== req.user.branchId && req.user.role === 'RECEPTIONIST') {
    throw new ForbiddenError('Cannot access resources outside your branch');
  }
  next();
}
