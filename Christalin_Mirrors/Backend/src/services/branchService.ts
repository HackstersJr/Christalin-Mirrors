import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { parsePagination, paginate, PaginatedResponse } from '../utils/pagination';

export const branchService = {
  async list(query: { page?: string; limit?: string }): Promise<PaginatedResponse<any>> {
    const p = parsePagination(query);
    const [items, total] = await Promise.all([
      prisma.branch.findMany({ skip: p.skip, take: p.limit, orderBy: { name: 'asc' } }),
      prisma.branch.count(),
    ]);
    return paginate(items, total, p);
  },

  async getById(id: string) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundError('Branch');
    return branch;
  },

  async create(data: any) {
    return prisma.branch.create({ data });
  },

  async update(id: string, data: any) {
    await this.getById(id);
    return prisma.branch.update({ where: { id }, data });
  },

  async remove(id: string) {
    await this.getById(id);
    return prisma.branch.delete({ where: { id } });
  },

  /** Public endpoint — returns active branches only */
  async listPublic() {
    return prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },
};
