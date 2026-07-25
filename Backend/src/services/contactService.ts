import prisma from '../utils/prisma';
import { BadRequestError } from '../utils/errors';

export const contactService = {
  /**
   * Only unauthenticated write in the system. Fields are allowlisted explicitly
   * rather than spreading req.body into Prisma.
   */
  async submit(data: { name: string; email: string; phone?: string; subject?: string; message: string; website?: string }) {
    // Honeypot: a real browser leaves the hidden `website` field empty.
    // Answer 201 anyway so bots get no signal.
    if (data.website) return;

    if (!data.name || !data.email || !data.message) {
      throw new BadRequestError('name, email and message are required');
    }

    await prisma.contactSubmission.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        subject: data.subject ?? null,
        message: data.message,
      },
    });
  },
};
