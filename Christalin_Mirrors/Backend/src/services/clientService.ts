import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { parsePagination, paginate } from '../utils/pagination';

export const clientService = {
  async list(query: { page?: string; limit?: string; branchId?: string; search?: string }) {
    const p = parsePagination(query);
    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
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

    const mapped = items.map(c => ({
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

  async getById(id: string) {
    const c = await prisma.client.findUnique({
      where: { id },
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

  async create(data: any) {
    return prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        branchId: data.branchId,
        joinedDate: data.joinedDate ? new Date(data.joinedDate) : new Date(),
        preferredStaffId: data.preferredStaffId,
        notes: data.notes,
        tags: data.tags || [],
      },
    });
  },

  async update(id: string, data: any) {
    await this.getById(id);
    return prisma.client.update({ where: { id }, data });
  },

  async remove(id: string) {
    await this.getById(id);
    return prisma.client.delete({ where: { id } });
  },
};
