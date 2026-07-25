import prisma from '../utils/prisma';
import { paisaToRupees } from '../utils/currency';
import { TokenPayload } from '../utils/jwt';
import { branchScope } from '../auth/scope';
import { inventoryService } from './inventoryService';

export const dashboardService = {
  async getStats(ctx: TokenPayload) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const scope = branchScope(ctx);

    const [todayAppointments, totalClients, monthRevenueAgg, pendingRequests, completedToday, cancelledToday] =
      await Promise.all([
        prisma.appointment.count({ where: { ...scope, date: { gte: today, lt: tomorrow } } }),
        prisma.client.count({ where: scope }),
        prisma.invoice.aggregate({
          where: { ...scope, status: 'PAID', date: { gte: firstOfMonth } },
          _sum: { total: true },
        }),
        prisma.appointment.count({ where: { ...scope, status: 'PENDING' } }),
        prisma.appointment.count({ where: { ...scope, status: 'COMPLETED', date: { gte: today, lt: tomorrow } } }),
        prisma.appointment.count({ where: { ...scope, status: 'CANCELLED', date: { gte: today, lt: tomorrow } } }),
      ]);

    return {
      todayAppointments,
      totalClients,
      monthRevenue: paisaToRupees(monthRevenueAgg._sum.total || 0),
      pendingRequests,
      completedToday,
      cancelledToday,
    };
  },

  /** Delegates to inventoryService so "low stock" has exactly one definition. */
  async getAlerts(ctx: TokenPayload) {
    const lowStockItems = await inventoryService.getLowStock(ctx);
    return { lowStockItems, lowStockCount: lowStockItems.length };
  },
};
