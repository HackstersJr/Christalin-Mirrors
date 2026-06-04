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
      branches: branches.map(b => ({
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
    const updated = await prisma.salonSettings.update({
      where: { id: 'singleton' },
      data: {
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
