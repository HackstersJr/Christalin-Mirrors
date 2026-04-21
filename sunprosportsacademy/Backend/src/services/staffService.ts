import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { parsePagination, paginate } from '../utils/pagination';

export const staffService = {
  async list(query: { page?: string; limit?: string; branchId?: string }) {
    const p = parsePagination(query);
    const where = query.branchId ? { branchId: query.branchId } : {};
    const [items, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip: p.skip,
        take: p.limit,
        include: { branch: true },
        orderBy: { name: 'asc' },
      }),
      prisma.staff.count({ where }),
    ]);

    const mapped = items.map(s => ({
      id: s.id,
      name: s.name,
      role: s.role.toLowerCase(),
      branch: s.branch.name,
      phone: s.phone,
      email: s.email,
      specialties: s.specialties,
      isActive: s.isActive,
      joinedDate: s.joinedDate.toISOString().split('T')[0],
      avatar: s.avatarUrl || undefined,
    }));

    return paginate(mapped, total, p);
  },

  async getById(id: string) {
    const s = await prisma.staff.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!s) throw new NotFoundError('Staff');
    return {
      id: s.id,
      name: s.name,
      role: s.role.toLowerCase(),
      branch: s.branch.name,
      phone: s.phone,
      email: s.email,
      specialties: s.specialties,
      isActive: s.isActive,
      joinedDate: s.joinedDate.toISOString().split('T')[0],
      avatar: s.avatarUrl || undefined,
    };
  },

  async create(data: any) {
    return prisma.staff.create({
      data: {
        name: data.name,
        role: data.role,
        branchId: data.branchId,
        phone: data.phone,
        email: data.email,
        specialties: data.specialties || [],
        isActive: data.isActive ?? true,
        joinedDate: data.joinedDate ? new Date(data.joinedDate) : new Date(),
      },
    });
  },

  async update(id: string, data: any) {
    await this.getById(id);
    return prisma.staff.update({ where: { id }, data });
  },

  async remove(id: string) {
    await this.getById(id);
    return prisma.staff.delete({ where: { id } });
  },
};
