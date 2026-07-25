import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Express 4 discards promises returned by route handlers, so a rejected one
 * never reaches errorHandler and Node's default --unhandled-rejections=throw
 * kills the process. Wrap every async handler with this.
 */
// ponytail: shim exists only because Express 4 drops rejections; ceiling is that
// every new route must remember ah(). upgrade: delete on the Express 5 bump.
export function ah(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
