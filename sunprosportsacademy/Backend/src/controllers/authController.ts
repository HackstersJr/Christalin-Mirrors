import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const authController = {
  async login(req: Request, res: Response) {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  },

  async refresh(req: Request, res: Response) {
    const result = await authService.refresh(req.body.refreshToken);
    res.json(result);
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.user!.sub);
    res.json({ message: 'Logged out successfully' });
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(req.user!.sub);
    res.json(user);
  },
};
