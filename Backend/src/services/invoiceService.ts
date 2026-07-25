import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { paisaToRupees, rupeesToPaisa } from '../utils/currency';
import { computeInvoiceTotals, lineTotal, Discount, PricedLine } from '../utils/money';
import { parsePagination, paginate } from '../utils/pagination';
import { TokenPayload } from '../utils/jwt';
import { branchScope, writeBranchId, assertDiscountAllowed } from '../auth/scope';

const DEFAULT_TAX_PERCENT = 18;

function mapToFrontend(inv: any) {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientId: inv.clientId || '',
    clientName: inv.clientName,
    clientEmail: inv.clientEmail,
    clientPhone: inv.clientPhone || undefined,
    date: inv.date instanceof Date ? inv.date.toISOString().split('T')[0] : inv.date,
    items: (inv.items || []).map((it: any) => ({
      serviceId: it.serviceId || undefined,
      service: it.serviceName,
      description: it.description || undefined,
      quantity: it.quantity,
      unitPrice: paisaToRupees(it.unitPrice),
      total: paisaToRupees(it.total),
      productId: it.productId || undefined,
    })),
    subtotal: paisaToRupees(inv.subtotal),
    discountPercent: Number(inv.discountPercent),
    discountAmount: paisaToRupees(inv.discountAmount),
    taxPercent: Number(inv.taxPercent),
    taxAmount: paisaToRupees(inv.taxAmount),
    total: paisaToRupees(inv.total),
    amountPaid: paisaToRupees(inv.amountPaid),
    status: inv.status.toLowerCase(),
    paymentMethod: inv.paymentMethod?.toLowerCase(),
    branch: inv.branch?.name || inv.branchId,
    stylist: inv.staffName || undefined,
    notes: inv.notes || undefined,
    createdAt: inv.createdAt?.toISOString() || new Date().toISOString(),
    appointmentId: inv.appointmentId || undefined,
  };
}

/**
 * Resolve every line's price from the catalogue. The request supplies intent
 * (what and how many); the server supplies all money.
 */
async function priceLines(tx: any, branchId: string, items: any[]) {
  const priced: (PricedLine & {
    serviceId: string | null;
    serviceName: string;
    description?: string;
    productId: string | null;
  })[] = [];

  for (const item of items) {
    const quantity = item.quantity;

    if (item.productId) {
      const product = await tx.inventoryItem.findFirst({
        where: { id: item.productId, branchId, isActive: true },
      });
      if (!product) throw new BadRequestError(`Product ${item.productId} not found in this branch`);
      priced.push({
        serviceId: null,
        serviceName: product.name,
        description: item.description,
        productId: product.id,
        quantity,
        unitPrice: product.retailPrice,
        total: lineTotal(product.retailPrice, quantity),
      });
      continue;
    }

    if (item.serviceId) {
      const service = await tx.service.findFirst({ where: { id: item.serviceId, isActive: true } });
      if (!service) throw new BadRequestError(`Service ${item.serviceId} not found`);
      // Per-branch price override — modelled all along, wired up here for the first time.
      const override = await tx.serviceBranch.findUnique({
        where: { serviceId_branchId: { serviceId: service.id, branchId } },
      });
      const unitPrice = override?.priceOverride ?? service.price;
      priced.push({
        serviceId: service.id,
        serviceName: service.name,
        description: item.description,
        productId: null,
        quantity,
        unitPrice,
        total: lineTotal(unitPrice, quantity),
      });
      continue;
    }

    throw new BadRequestError('Each invoice item needs a serviceId or a productId');
  }

  return priced;
}

async function taxPercentFromSettings(tx: any): Promise<number> {
  // SalonSettings has no tax column yet; keep the rate in one place until it does.
  void tx;
  return DEFAULT_TAX_PERCENT;
}

export const invoiceService = {
  async list(ctx: TokenPayload, query: { page?: string; limit?: string; branchId?: string; status?: string; clientId?: string }) {
    const p = parsePagination(query);
    const where: any = { ...branchScope(ctx) };
    if (query.branchId && ctx.role === 'OWNER') where.branchId = query.branchId;
    if (query.status) where.status = query.status.toUpperCase();
    if (query.clientId) where.clientId = query.clientId;

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: p.skip,
        take: p.limit,
        include: { items: true, branch: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return paginate(items.map(mapToFrontend), total, p);
  },

  async getById(ctx: TokenPayload, id: string) {
    const inv = await prisma.invoice.findFirst({
      where: { id, ...branchScope(ctx) },
      include: { items: true, branch: true },
    });
    if (!inv) throw new NotFoundError('Invoice');
    return mapToFrontend(inv);
  },

  /**
   * BILLING PIPELINE — server-authoritative.
   * The request carries {serviceId|productId, quantity} and a discount.
   * Every monetary value below is computed here.
   */
  async create(ctx: TokenPayload, data: any) {
    const branchId = writeBranchId(ctx, data.branchId);

    return prisma.$transaction(async (tx) => {
      const priced = await priceLines(tx, branchId, data.items);
      const taxPercent = await taxPercentFromSettings(tx);
      // The request sends money in rupees (a flat discount of 500 means ₹500);
      // money.ts works in paisa. Convert the flat value at this boundary, the
      // same place line prices cross over. A percent discount is unitless.
      const discount: Discount | undefined = data.discount
        ? {
            type: data.discount.type,
            value: data.discount.type === 'flat'
              ? rupeesToPaisa(data.discount.value)
              : data.discount.value,
          }
        : undefined;
      const totals = computeInvoiceTotals(priced, discount, taxPercent);

      // Checked after totals so a flat discount is measured as a real percentage.
      // Throws inside the transaction, so nothing is written on rejection.
      assertDiscountAllowed(ctx, totals.discountPercent);

      const status = (data.status || 'DRAFT').toUpperCase();
      if (status === 'PAID' && data.amountPaid !== undefined) {
        const paid = Math.round(data.amountPaid * 100);
        if (paid < totals.total) {
          throw new BadRequestError('amountPaid is less than the invoice total');
        }
      }

      const seq = await tx.invoiceSequence.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', lastNum: 1 },
        update: { lastNum: { increment: 1 } },
      });
      const invoiceNumber = `CM-INV-${String(seq.lastNum).padStart(4, '0')}`;

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId: data.clientId || null,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientPhone: data.clientPhone,
          date: new Date(data.date),
          subtotal: totals.subtotal,
          discountPercent: totals.discountPercent,
          discountAmount: totals.discountAmount,
          taxPercent: totals.taxPercent,
          taxAmount: totals.taxAmount,
          total: totals.total,
          amountPaid: status === 'PAID' ? totals.total : 0,
          status,
          paymentMethod: data.paymentMethod?.toUpperCase() || null,
          branchId,
          staffId: data.staffId || null,
          staffName: data.staffName || null,
          appointmentId: data.appointmentId || null,
          notes: data.notes,
          items: {
            create: priced.map((l) => ({
              serviceId: l.serviceId,
              serviceName: l.serviceName,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              total: l.total,
              productId: l.productId,
            })),
          },
        },
        include: { items: true, branch: true },
      });

      if (invoice.status === 'PAID') {
        await executePaidSideEffects(tx, invoice);
      }

      return mapToFrontend(invoice);
    });
  },

  async update(ctx: TokenPayload, id: string, data: any) {
    const existing = await prisma.invoice.findFirst({ where: { id, ...branchScope(ctx) } });
    if (!existing) throw new NotFoundError('Invoice');

    if (data.status && data.status.toUpperCase() === 'PAID') {
      return prisma.$transaction(async (tx) => {
        // Conditional transition — the DB decides, so a double-click applies once.
        const { count } = await tx.invoice.updateMany({
          where: { id, status: { not: 'PAID' } },
          data: {
            status: 'PAID',
            paymentMethod: data.paymentMethod?.toUpperCase() || existing.paymentMethod,
            amountPaid: existing.total,
          },
        });

        const updated = await tx.invoice.findUnique({
          where: { id },
          include: { items: true, branch: true },
        });

        // count === 0 means it was already PAID: no-op, no side effects re-applied.
        if (count > 0) await executePaidSideEffects(tx, updated);

        return mapToFrontend(updated);
      });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status.toUpperCase() } : {}),
        ...(data.paymentMethod ? { paymentMethod: data.paymentMethod.toUpperCase() } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      include: { items: true, branch: true },
    });
    return mapToFrontend(updated);
  },

  async remove(ctx: TokenPayload, id: string) {
    const existing = await prisma.invoice.findFirst({ where: { id, ...branchScope(ctx) } });
    if (!existing) throw new NotFoundError('Invoice');
    if (existing.status === 'PAID') {
      throw new BadRequestError('Cannot delete a paid invoice');
    }
    return prisma.invoice.delete({ where: { id } });
  },
};

/** Side effects when an invoice reaches PAID. Runs exactly once per invoice. */
async function executePaidSideEffects(tx: any, invoice: any) {
  const items = await tx.invoiceItem.findMany({ where: { invoiceId: invoice.id } });

  // Atomic conditional decrement — rejects overselling instead of clamping to 0.
  for (const item of items) {
    if (!item.productId) continue;
    const { count } = await tx.inventoryItem.updateMany({
      where: { id: item.productId, currentStock: { gte: item.quantity } },
      data: { currentStock: { decrement: item.quantity } },
    });
    if (count === 0) {
      const product = await tx.inventoryItem.findUnique({ where: { id: item.productId } });
      throw new BadRequestError(
        `Insufficient stock for ${item.serviceName}: ${product?.currentStock ?? 0} left, ${item.quantity} requested`
      );
    }
  }

  if (invoice.clientId) {
    await tx.client.update({
      where: { id: invoice.clientId },
      data: { totalVisits: { increment: 1 }, lastVisit: new Date() },
    });
  }

  if (invoice.clientId && invoice.staffId) {
    await tx.serviceVisit.create({
      data: {
        clientId: invoice.clientId,
        clientName: invoice.clientName,
        date: invoice.date,
        staffId: invoice.staffId,
        staffName: invoice.staffName || '',
        branchId: invoice.branchId,
        subtotal: invoice.subtotal,
        discount: invoice.discountAmount,
        tax: invoice.taxAmount,
        total: invoice.total,
        paymentMethod: invoice.paymentMethod || 'OTHER',
        notes: invoice.notes,
        invoiceId: invoice.id,
        services: items.map((it: any) => ({ name: it.serviceName, price: paisaToRupees(it.unitPrice) })),
      },
    });
  }

  if (invoice.appointmentId) {
    await tx.appointment.update({
      where: { id: invoice.appointmentId },
      data: { status: 'COMPLETED' },
    });
  }
}
