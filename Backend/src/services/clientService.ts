import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { parsePagination, paginate } from '../utils/pagination';
import { TokenPayload } from '../utils/jwt';
import { branchScope, writeBranchId } from '../auth/scope';

export const clientService = {
  async list(ctx: TokenPayload, query: { page?: string; limit?: string; branchId?: string; search?: string }) {
    const p = parsePagination(query);
    const where: any = { ...branchScope(ctx) };
    if (query.branchId && ctx.role === 'OWNER') where.branchId = query.branchId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: p.skip,
        take: p.limit,
        include: { branch: true },
        orderBy: { name: 'asc' },
      }),
      prisma.client.count({ where }),
    ]);

    const mapped = items.map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      gender: c.gender.toLowerCase(),
      branch: c.branch.name,
      joinedDate: c.joinedDate.toISOString().split('T')[0],
      totalVisits: c.totalVisits,
      lastVisit: c.lastVisit?.toISOString().split('T')[0],
      preferredStylist: c.preferredStaffId || undefined,
      notes: c.notes || undefined,
      tags: c.tags,
    }));

    return paginate(mapped, total, p);
  },

  async getById(ctx: TokenPayload, id: string) {
    const c = await prisma.client.findFirst({
      where: { id, ...branchScope(ctx) },
      include: { branch: true },
    });
    if (!c) throw new NotFoundError('Client');
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      gender: c.gender.toLowerCase(),
      branch: c.branch.name,
      joinedDate: c.joinedDate.toISOString().split('T')[0],
      totalVisits: c.totalVisits,
      lastVisit: c.lastVisit?.toISOString().split('T')[0],
      preferredStylist: c.preferredStaffId || undefined,
      notes: c.notes || undefined,
      tags: c.tags,
    };
  },

  async create(ctx: TokenPayload, data: any) {
    return prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        branchId: writeBranchId(ctx, data.branchId),
        joinedDate: data.joinedDate ? new Date(data.joinedDate) : new Date(),
        preferredStaffId: data.preferredStaffId,
        notes: data.notes,
        tags: data.tags || [],
      },
    });
  },

  async update(ctx: TokenPayload, id: string, data: any) {
    await this.getById(ctx, id);
    const { branchId, ...rest } = data;
    return prisma.client.update({
      where: { id },
      data: { ...rest, ...(branchId ? { branchId: writeBranchId(ctx, branchId) } : {}) },
    });
  },

  async remove(ctx: TokenPayload, id: string) {
    await this.getById(ctx, id);
    return prisma.client.delete({ where: { id } });
  },
};
