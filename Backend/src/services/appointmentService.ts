import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { parsePagination, paginate } from '../utils/pagination';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

function mapToFrontend(a: any) {
  return {
    id: a.id,
    clientId: a.clientId || '',
    staffId: a.staffId || '',
    serviceId: a.serviceId || '',
    clientName: a.clientName,
    clientEmail: a.clientEmail,
    clientPhone: a.clientPhone || undefined,
    date: a.date instanceof Date ? a.date.toISOString().split('T')[0] : a.date,
    time: a.time,
    service: a.serviceName,
    stylist: a.staffName || undefined,
    status: a.status.toLowerCase(),
    notes: a.notes || undefined,
    branch: a.branch?.name || a.branchId,
    createdAt: a.createdAt?.toISOString() || new Date().toISOString(),
  };
}

export const appointmentService = {
  async list(query: { page?: string; limit?: string; branchId?: string; status?: string; search?: string }) {
    const p = parsePagination(query);
    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.status) where.status = query.status.toUpperCase();
    if (query.search) {
      where.OR = [
        { clientName: { contains: query.search, mode: 'insensitive' } },
        { serviceName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: p.skip,
        take: p.limit,
        include: { branch: true },
        orderBy: [{ date: 'desc' }, { time: 'desc' }],
      }),
      prisma.appointment.count({ where }),
    ]);

    return paginate(items.map(mapToFrontend), total, p);
  },

  async getById(id: string) {
    const a = await prisma.appointment.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!a) throw new NotFoundError('Appointment');
    return mapToFrontend(a);
  },

  async create(data: any) {
    const apt = await prisma.appointment.create({
      data: {
        clientId: data.clientId || null,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        date: new Date(data.date),
        time: data.time,
        serviceId: data.serviceId || null,
        serviceName: data.serviceName,
        staffId: data.staffId || null,
        staffName: data.staffName,
        status: data.status || 'PENDING',
        notes: data.notes,
        branchId: data.branchId,
      },
      include: { branch: true },
    });
    return mapToFrontend(apt);
  },

  async update(id: string, data: any) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Appointment');

    // Enforce status transitions
    if (data.status) {
      const currentStatus = existing.status;
      const allowed = VALID_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(data.status)) {
        throw new BadRequestError(
          `Cannot transition from ${currentStatus} to ${data.status}. Allowed: ${allowed.join(', ') || 'none'}`
        );
      }
    }

    const updateData: any = { ...data };
    if (data.date) updateData.date = new Date(data.date);

    const apt = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { branch: true },
    });
    return mapToFrontend(apt);
  },

  async remove(id: string) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Appointment');
    return prisma.appointment.delete({ where: { id } });
  },
};
