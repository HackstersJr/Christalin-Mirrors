import prisma from '../utils/prisma';
import { paisaToRupees } from '../utils/currency';

export const dashboardService = {
  async getStats(branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const branchFilter = branchId ? { branchId } : {};

    const [todayAppointments, totalClients, monthRevenueAgg, pendingRequests, completedToday, cancelledToday] = await Promise.all([
      prisma.appointment.count({
        where: { ...branchFilter, date: { gte: today, lt: tomorrow } },
      }),
      prisma.client.count({ where: branchFilter }),
      prisma.invoice.aggregate({
        where: { ...branchFilter, status: 'PAID', date: { gte: firstOfMonth } },
        _sum: { total: true },
      }),
      prisma.appointment.count({
        where: { ...branchFilter, status: 'PENDING' },
      }),
      prisma.appointment.count({
        where: { ...branchFilter, status: 'COMPLETED', date: { gte: today, lt: tomorrow } },
      }),
      prisma.appointment.count({
        where: { ...branchFilter, status: 'CANCELLED', date: { gte: today, lt: tomorrow } },
      }),
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

  async getAlerts(branchId?: string) {
    const branchFilter = branchId ? { branchId } : {};
    const lowStock = await prisma.inventoryItem.findMany({
      where: {
        ...branchFilter,
        isActive: true,
        currentStock: { lte: prisma.inventoryItem.fields?.minStock as any },
      },
    });

    // Manual filter since Prisma can't compare two columns directly
    const allActive = await prisma.inventoryItem.findMany({
      where: { ...branchFilter, isActive: true },
    });
    const lowStockItems = allActive.filter(i => i.currentStock <= i.minStock);

    return {
      lowStockItems: lowStockItems.map(i => ({
        id: i.id,
        name: i.name,
        currentStock: i.currentStock,
        minStock: i.minStock,
        branch: i.branchId,
      })),
      lowStockCount: lowStockItems.length,
    };
  },
};
