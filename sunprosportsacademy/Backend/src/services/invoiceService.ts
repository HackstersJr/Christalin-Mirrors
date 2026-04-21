import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { rupeesToPaisa, paisaToRupees } from '../utils/currency';
import { parsePagination, paginate } from '../utils/pagination';

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

export const invoiceService = {
  async list(query: { page?: string; limit?: string; branchId?: string; status?: string; clientId?: string }) {
    const p = parsePagination(query);
    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
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

  async getById(id: string) {
    const inv = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, branch: true },
    });
    if (!inv) throw new NotFoundError('Invoice');
    return mapToFrontend(inv);
  },

  /**
   * BILLING PIPELINE — The most critical business logic
   * All operations inside a single Prisma transaction
   */
  async create(data: any) {
    return prisma.$transaction(async (tx) => {
      // 1. Generate invoice number atomically
      const seq = await tx.invoiceSequence.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', lastNum: 1 },
        update: { lastNum: { increment: 1 } },
      });
      const invoiceNumber = `CM-INV-${String(seq.lastNum).padStart(4, '0')}`;

      // 2. Create invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId: data.clientId || null,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientPhone: data.clientPhone,
          date: new Date(data.date),
          subtotal: rupeesToPaisa(data.subtotal),
          discountPercent: data.discountPercent ?? 0,
          discountAmount: rupeesToPaisa(data.discountAmount ?? 0),
          taxPercent: data.taxPercent ?? 18,
          taxAmount: rupeesToPaisa(data.taxAmount ?? 0),
          total: rupeesToPaisa(data.total),
          amountPaid: rupeesToPaisa(data.amountPaid ?? 0),
          status: data.status?.toUpperCase() || 'DRAFT',
          paymentMethod: data.paymentMethod?.toUpperCase() || null,
          branchId: data.branchId,
          staffId: data.staffId || null,
          staffName: data.staffName || null,
          appointmentId: data.appointmentId || null,
          notes: data.notes,
          items: {
            create: data.items.map((item: any) => ({
              serviceId: item.serviceId || null,
              serviceName: item.serviceName,
              description: item.description,
              quantity: item.quantity,
              unitPrice: rupeesToPaisa(item.unitPrice),
              total: rupeesToPaisa(item.total),
              productId: item.productId || null,
            })),
          },
        },
        include: { items: true, branch: true },
      });

      // 3. If PAID — execute side effects
      if (invoice.status === 'PAID') {
        await executePaidSideEffects(tx, invoice, data);
      }

      return mapToFrontend(invoice);
    });
  },

  async update(id: string, data: any) {
    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) throw new NotFoundError('Invoice');

    // If transitioning to PAID
    if (data.status === 'PAID' && existing.status !== 'PAID') {
      return prisma.$transaction(async (tx) => {
        const updated = await tx.invoice.update({
          where: { id },
          data: {
            status: 'PAID',
            paymentMethod: data.paymentMethod?.toUpperCase() || existing.paymentMethod,
            amountPaid: data.amountPaid ? rupeesToPaisa(data.amountPaid) : existing.total,
          },
          include: { items: true, branch: true },
        });
        await executePaidSideEffects(tx, updated, data);
        return mapToFrontend(updated);
      });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status.toUpperCase() } : {}),
        ...(data.paymentMethod ? { paymentMethod: data.paymentMethod.toUpperCase() } : {}),
        ...(data.amountPaid !== undefined ? { amountPaid: rupeesToPaisa(data.amountPaid) } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      include: { items: true, branch: true },
    });
    return mapToFrontend(updated);
  },

  async remove(id: string) {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Invoice');
    if (existing.status === 'PAID') {
      throw new BadRequestError('Cannot delete a paid invoice');
    }
    return prisma.invoice.delete({ where: { id } });
  },
};

/** Side effects when an invoice reaches PAID status */
async function executePaidSideEffects(tx: any, invoice: any, _data: any) {
  const items = await tx.invoiceItem.findMany({ where: { invoiceId: invoice.id } });

  // 3a. Decrement inventory for retail product items
  for (const item of items) {
    if (item.productId) {
      const product = await tx.inventoryItem.findUnique({ where: { id: item.productId } });
      if (product) {
        const newStock = Math.max(0, product.currentStock - item.quantity);
        await tx.inventoryItem.update({
          where: { id: item.productId },
          data: { currentStock: newStock },
        });
      }
    }
  }

  // 3b. Increment client totalVisits + set lastVisit (skip walk-ins)
  if (invoice.clientId) {
    await tx.client.update({
      where: { id: invoice.clientId },
      data: {
        totalVisits: { increment: 1 },
        lastVisit: new Date(),
      },
    });
  }

  // 3c. Create ServiceVisit record (skip walk-ins)
  if (invoice.clientId && invoice.staffId) {
    const serviceItems = items.map((it: any) => ({
      name: it.serviceName,
      price: paisaToRupees(it.unitPrice),
    }));
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
        services: serviceItems,
      },
    });
  }

  // 3d. Update linked appointment to COMPLETED
  if (invoice.appointmentId) {
    await tx.appointment.update({
      where: { id: invoice.appointmentId },
      data: { status: 'COMPLETED' },
    });
  }
}
