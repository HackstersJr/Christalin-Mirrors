import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';

export const dashboardController = {
  async getStats(req: Request, res: Response) {
    const branchId = req.user?.role === 'OWNER' ? undefined : req.user?.branchId;
    const stats = await dashboardService.getStats(branchId);
    res.json(stats);
  },

  async getAlerts(req: Request, res: Response) {
    const branchId = req.user?.role === 'OWNER' ? undefined : req.user?.branchId;
    const alerts = await dashboardService.getAlerts(branchId);
    res.json(alerts);
  },
};
