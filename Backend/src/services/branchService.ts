import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { parsePagination, paginate, PaginatedResponse } from '../utils/pagination';
import { TokenPayload } from '../utils/jwt';

// Branch is not itself branch-owned — every authenticated user may read the branch
// list (they need it for names and pickers). ctx is accepted for signature
// uniformity so one crud() helper can serve every domain.
export const branchService = {
  async list(_ctx: TokenPayload, query: { page?: string; limit?: string }): Promise<PaginatedResponse<any>> {
    const p = parsePagination(query);
    const [items, total] = await Promise.all([
      prisma.branch.findMany({ skip: p.skip, take: p.limit, orderBy: { name: 'asc' } }),
      prisma.branch.count(),
    ]);
    return paginate(items, total, p);
  },

  async getById(_ctx: TokenPayload, id: string) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundError('Branch');
    return branch;
  },

  async create(_ctx: TokenPayload, data: any) {
    return prisma.branch.create({ data });
  },

  async update(ctx: TokenPayload, id: string, data: any) {
    await this.getById(ctx, id);
    return prisma.branch.update({ where: { id }, data });
  },

  async remove(ctx: TokenPayload, id: string) {
    await this.getById(ctx, id);
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
