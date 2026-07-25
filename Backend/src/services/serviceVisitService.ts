import prisma from '../utils/prisma';
import { paisaToRupees } from '../utils/currency';
import { parsePagination, paginate } from '../utils/pagination';
import { TokenPayload } from '../utils/jwt';
import { branchScope } from '../auth/scope';

/**
 * Read-only. ServiceVisit rows are written exclusively by the invoice pipeline
 * when an invoice reaches PAID — there is no create/update/delete here on purpose.
 * Without this endpoint the rows were write-only and the client history tab
 * had no data source.
 */
function mapToFrontend(v: any) {
  return {
    id: v.id,
    clientId: v.clientId,
    clientName: v.clientName,
    date: v.date instanceof Date ? v.date.toISOString().split('T')[0] : v.date,
    services: v.services ?? [],
    stylist: v.staffName,
    branch: v.branch?.name ?? v.branchId,
    subtotal: paisaToRupees(v.subtotal),
    discount: paisaToRupees(v.discount),
    tax: paisaToRupees(v.tax),
    total: paisaToRupees(v.total),
    paymentMethod: v.paymentMethod?.toLowerCase(),
    notes: v.notes || undefined,
    rating: v.rating ?? undefined,
    invoiceId: v.invoiceId || undefined,
  };
}

export const serviceVisitService = {
  async list(ctx: TokenPayload, query: { page?: string; limit?: string; clientId?: string }) {
    const p = parsePagination(query);
    const where: any = { ...branchScope(ctx) };
    if (query.clientId) where.clientId = query.clientId;

    const [rows, total] = await Promise.all([
      prisma.serviceVisit.findMany({
        where,
        skip: p.skip,
        take: p.limit,
        orderBy: { date: 'desc' },
      }),
      prisma.serviceVisit.count({ where }),
    ]);

    return paginate(rows.map(mapToFrontend), total, p);
  },
};
