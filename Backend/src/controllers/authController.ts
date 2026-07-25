import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const authController = {
  async login(req: Request, res: Response) {
    res.json(await authService.login(req.body.email, req.body.password));
  },

  /**
   * v1 has no server-side session state, so logout is client-side only:
   * the frontend discards the token. This endpoint exists so the frontend has
   * something conventional to call and so adding real revocation later is
   * a backend-only change.
   */
  async logout(_req: Request, res: Response) {
    res.status(204).end();
  },

  async me(req: Request, res: Response) {
    res.json(await authService.me(req.user!.sub));
  },
};
