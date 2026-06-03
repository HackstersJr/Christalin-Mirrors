import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { paisaToRupees, rupeesToPaisa } from '../utils/currency';
import { parsePagination, paginate } from '../utils/pagination';

const CATEGORY_MAP: Record<string, string> = {
  'hair-care': 'HAIRCARE',
  'skin-care': 'SKINCARE',
  color: 'COLOR',
  tools: 'TOOLS',
  consumables: 'CONSUMABLES',
};

const CATEGORY_REVERSE: Record<string, string> = {
  HAIRCARE: 'hair-care',
  SKINCARE: 'skin-care',
  COLOR: 'color',
  TOOLS: 'tools',
  CONSUMABLES: 'consumables',
};

function mapToFrontend(i: any) {
  return {
    id: i.id,
    name: i.name,
    brand: i.brand,
    category: CATEGORY_REVERSE[i.category] || i.category.toLowerCase(),
    sku: i.sku,
    currentStock: i.currentStock,
    minStock: i.minStock,
    costPrice: paisaToRupees(i.costPrice),
    retailPrice: paisaToRupees(i.retailPrice),
    branch: i.branch?.name || i.branchId,
    lastRestocked: i.lastRestocked?.toISOString().split('T')[0],
    isActive: i.isActive,
  };
}

export const inventoryService = {
  async list(query: { page?: string; limit?: string; branchId?: string; category?: string }) {
    const p = parsePagination(query);
    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.category) where.category = CATEGORY_MAP[query.category] || query.category.toUpperCase();

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip: p.skip,
        take: p.limit,
        include: { branch: true },
        orderBy: { name: 'asc' },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return paginate(items.map(mapToFrontend), total, p);
  },

  async getById(id: string) {
    const i = await prisma.inventoryItem.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!i) throw new NotFoundError('InventoryItem');
    return mapToFrontend(i);
  },

  async create(data: any) {
    const item = await prisma.inventoryItem.create({
      data: {
        name: data.name,
        brand: data.brand,
        category: CATEGORY_MAP[data.category] || data.category,
        sku: data.sku,
        currentStock: data.currentStock,
        minStock: data.minStock ?? 3,
        costPrice: rupeesToPaisa(data.costPrice),
        retailPrice: rupeesToPaisa(data.retailPrice ?? 0),
        branchId: data.branchId,
        isActive: data.isActive ?? true,
      },
      include: { branch: true },
    });
    return mapToFrontend(item);
  },

  async update(id: string, data: any) {
    await this.getById(id);
    const updateData: any = { ...data };
    if (data.costPrice !== undefined) updateData.costPrice = rupeesToPaisa(data.costPrice);
    if (data.retailPrice !== undefined) updateData.retailPrice = rupeesToPaisa(data.retailPrice);
    if (data.category) updateData.category = CATEGORY_MAP[data.category] || data.category;
    if (data.lastRestocked) updateData.lastRestocked = new Date(data.lastRestocked);

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: { branch: true },
    });
    return mapToFrontend(item);
  },

  async remove(id: string) {
    await this.getById(id);
    return prisma.inventoryItem.delete({ where: { id } });
  },

  async getLowStock(branchId?: string) {
    const where: any = { isActive: true };
    if (branchId) where.branchId = branchId;

    const all = await prisma.inventoryItem.findMany({
      where,
      include: { branch: true },
    });
    return all.filter(i => i.currentStock <= i.minStock).map(mapToFrontend);
  },
};
