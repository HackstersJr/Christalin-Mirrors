import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { parsePagination, paginate } from '../utils/pagination';
import { TokenPayload } from '../utils/jwt';
import { branchScope, writeBranchId } from '../auth/scope';

export const staffService = {
  async list(ctx: TokenPayload, query: { page?: string; limit?: string; branchId?: string }) {
    const p = parsePagination(query);
    const where: any = { ...branchScope(ctx) };
    if (query.branchId && ctx.role === 'OWNER') where.branchId = query.branchId;
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

    const mapped = items.map((s: any) => ({
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

  async getById(ctx: TokenPayload, id: string) {
    const s = await prisma.staff.findFirst({
      where: { id, ...branchScope(ctx) },
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

  async create(ctx: TokenPayload, data: any) {
    return prisma.staff.create({
      data: {
        name: data.name,
        role: data.role,
        branchId: writeBranchId(ctx, data.branchId),
        phone: data.phone,
        email: data.email,
        specialties: data.specialties || [],
        isActive: data.isActive ?? true,
        joinedDate: data.joinedDate ? new Date(data.joinedDate) : new Date(),
      },
    });
  },

  /**
   * branchId and role are NOT updatable here. Staff.branchId is the source of the
   * branchId claim minted at login, so letting a MANAGER rewrite it would let them
   * move the OWNER's record — and with it, what the owner can see.
   * Transfers are an OWNER-only operation and are deliberately not built for v1.
   */
  async update(ctx: TokenPayload, id: string, data: any) {
    await this.getById(ctx, id);
    const { branchId: _b, role: _r, ...safe } = data;
    return prisma.staff.update({ where: { id }, data: safe });
  },

  async remove(ctx: TokenPayload, id: string) {
    await this.getById(ctx, id);
    return prisma.staff.delete({ where: { id } });
  },
};
