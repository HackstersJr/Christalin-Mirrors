import prisma from '../utils/prisma';

export const settingsService = {
  async get() {
    const s = await prisma.salonSettings.findUnique({ where: { id: 'singleton' } });
    if (!s) return null;

    // Also fetch branches for the frontend SalonSettings shape
    const branches = await prisma.branch.findMany({ orderBy: { name: 'asc' } });

    return {
      name: s.name,
      email: s.email,
      phone: s.phone,
      hours: s.hours,
      branches: branches.map((b: any) => ({
        name: b.name,
        city: b.city,
        address: b.address,
        phone: b.phone,
        isActive: b.isActive,
      })),
      socialLinks: {
        instagram: s.instagram || undefined,
        facebook: s.facebook || undefined,
        website: s.website || undefined,
      },
    };
  },

  async update(data: any) {
    // upsert, not update — an unseeded database would otherwise 500 (P2025).
    await prisma.salonSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        name: data.name ?? 'Christalin Mirrors',
        email: data.email ?? 'info@christalinmirrors.com',
        phone: data.phone ?? '',
        hours: data.hours ?? '',
        instagram: data.instagram ?? null,
        facebook: data.facebook ?? null,
        website: data.website ?? null,
      },
      update: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.hours ? { hours: data.hours } : {}),
        ...(data.instagram !== undefined ? { instagram: data.instagram } : {}),
        ...(data.facebook !== undefined ? { facebook: data.facebook } : {}),
        ...(data.website !== undefined ? { website: data.website } : {}),
      },
    });
    return this.get();
  },
};
