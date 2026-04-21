import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { rupeesToPaisa, paisaToRupees } from '../utils/currency';
import { parsePagination, paginate } from '../utils/pagination';

function mapToFrontend(s: any) {
  return {
    id: s.id,
    name: s.name,
    category: s.category.toLowerCase(),
    duration: s.duration,
    price: paisaToRupees(s.price),
    isActive: s.isActive,
    isKorean: s.isKorean,
    description: s.description,
  };
}

export const serviceService = {
  async list(query: { page?: string; limit?: string; category?: string }) {
    const p = parsePagination(query);
    const where: any = {};
    if (query.category) where.category = query.category.toUpperCase();

    const [items, total] = await Promise.all([
      prisma.service.findMany({ where, skip: p.skip, take: p.limit, orderBy: { name: 'asc' } }),
      prisma.service.count({ where }),
    ]);

    return paginate(items.map(mapToFrontend), total, p);
  },

  async getById(id: string) {
    const s = await prisma.service.findUnique({ where: { id } });
    if (!s) throw new NotFoundError('Service');
    return mapToFrontend(s);
  },

  async create(data: any) {
    const svc = await prisma.service.create({
      data: {
        name: data.name,
        category: data.category,
        duration: data.duration,
        price: rupeesToPaisa(data.price),
        isActive: data.isActive ?? true,
        isKorean: data.isKorean ?? false,
        isFeatured: data.isFeatured ?? false,
        badge: data.badge,
        description: data.description,
      },
    });
    return mapToFrontend(svc);
  },

  async update(id: string, data: any) {
    await this.getById(id);
    const updateData = { ...data };
    if (data.price !== undefined) updateData.price = rupeesToPaisa(data.price);
    if (data.category) updateData.category = data.category.toUpperCase();
    const svc = await prisma.service.update({ where: { id }, data: updateData });
    return mapToFrontend(svc);
  },

  async remove(id: string) {
    await this.getById(id);
    return prisma.service.delete({ where: { id } });
  },

  /** Public — all active services in rupees */
  async listPublic() {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return services.map(mapToFrontend);
  },
};
