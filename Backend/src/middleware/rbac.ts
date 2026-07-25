import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

/**
 * Coarse role gate. Answers "may this role attempt this action at all?"
 *
 * It deliberately does NOT answer "does this record belong to the caller's
 * branch?" — middleware cannot know that without a query. Branch isolation
 * lives in the service layer; see src/auth/scope.ts.
 *
 * The old `enforceBranchScope` that used to live here was deleted: it was never
 * mounted, exempted MANAGER entirely, and could not protect :id routes.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new ForbiddenError('Authentication required');
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(`Role '${req.user.role}' is not permitted for this action`);
    }
    next();
  };
}
