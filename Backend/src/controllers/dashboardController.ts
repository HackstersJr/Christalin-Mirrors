import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';

// Branch scoping is derived from the token inside the service — see auth/scope.ts.
export const dashboardController = {
  async getStats(req: Request, res: Response) {
    res.json(await dashboardService.getStats(req.user!));
  },

  async getAlerts(req: Request, res: Response) {
    res.json(await dashboardService.getAlerts(req.user!));
  },
};
