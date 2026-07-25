import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

function toDetails(err: ZodError) {
  return err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
}

/** Body-only validation (the common case). */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) throw new ValidationError(toDetails(err));
      throw err;
    }
  };
}

/**
 * Validates any combination of body, params and query.
 * req.query is a getter on Express 5 and read-only in some setups, so parsed
 * query is assigned back defensively rather than replaced wholesale.
 */
export function validateRequest(schemas: { body?: ZodSchema; params?: ZodSchema; query?: ZodSchema }) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) Object.assign(req.params, schemas.params.parse(req.params));
      if (schemas.query) Object.assign(req.query, schemas.query.parse(req.query));
      next();
    } catch (err) {
      if (err instanceof ZodError) throw new ValidationError(toDetails(err));
      throw err;
    }
  };
}
