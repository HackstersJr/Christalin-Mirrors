import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { paisaToRupees, rupeesToPaisa } from '../utils/currency';
import { parsePagination, paginate } from '../utils/pagination';
import { TokenPayload } from '../utils/jwt';
import { branchScope, writeBranchId } from '../auth/scope';

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
  async list(ctx: TokenPayload, query: { page?: string; limit?: string; branchId?: string; category?: string }) {
    const p = parsePagination(query);
    const where: any = { ...branchScope(ctx) };
    if (query.branchId && ctx.role === 'OWNER') where.branchId = query.branchId;
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

  async getById(ctx: TokenPayload, id: string) {
    const i = await prisma.inventoryItem.findFirst({
      where: { id, ...branchScope(ctx) },
      include: { branch: true },
    });
    if (!i) throw new NotFoundError('InventoryItem');
    return mapToFrontend(i);
  },

  async create(ctx: TokenPayload, data: any) {
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
        branchId: writeBranchId(ctx, data.branchId),
        isActive: data.isActive ?? true,
      },
      include: { branch: true },
    });
    return mapToFrontend(item);
  },

  async update(ctx: TokenPayload, id: string, data: any) {
    await this.getById(ctx, id);
    const { branchId: _ignored, ...rest } = data;
    const updateData: any = { ...rest };
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

  async remove(ctx: TokenPayload, id: string) {
    await this.getById(ctx, id);
    return prisma.inventoryItem.delete({ where: { id } });
  },

  /** Single source of truth for "low stock" — dashboardService calls this too. */
  async getLowStock(ctx: TokenPayload) {
    const all = await prisma.inventoryItem.findMany({
      where: { isActive: true, ...branchScope(ctx) },
      include: { branch: true },
    });
    // ponytail: filters in JS, O(all active items). upgrade: SQL predicate
    // `WHERE current_stock <= min_stock` when the catalogue outgrows one page.
    return all.filter((i: any) => i.currentStock <= i.minStock).map(mapToFrontend);
  },
};
