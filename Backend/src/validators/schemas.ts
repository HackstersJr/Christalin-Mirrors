import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(6).max(200),
}).strict();

export const createAppointmentSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional(),
  date: z.string().min(1),
  time: z.string().min(1),
  serviceId: z.string().optional(),
  serviceName: z.string().min(1),
  staffId: z.string().optional(),
  staffName: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  branchId: z.string().min(1),
});

export const updateAppointmentSchema = z.object({
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  staffId: z.string().nullable().optional(),
  staffName: z.string().nullable().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().nullable().optional(),
});

export const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  gender: z.enum(['FEMALE', 'MALE', 'OTHER']),
  branchId: z.string().min(1),
  joinedDate: z.string().optional(),
  preferredStaffId: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  gender: z.enum(['FEMALE', 'MALE', 'OTHER']).optional(),
  branchId: z.string().optional(),
  preferredStaffId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const createServiceSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['HAIR', 'SKIN', 'KOREAN', 'WOMENS', 'MENS']),
  duration: z.number().int().positive(),
  price: z.number().positive(),
  isActive: z.boolean().optional(),
  isKorean: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  badge: z.string().optional(),
  description: z.string().min(1),
});

export const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(['HAIR', 'SKIN', 'KOREAN', 'WOMENS', 'MENS']).optional(),
  duration: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  isKorean: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  badge: z.string().nullable().optional(),
  description: z.string().optional(),
});

export const createStaffSchema = z.object({
  name: z.string().min(1),
  role: z.enum(['STYLIST', 'THERAPIST', 'MANAGER', 'RECEPTIONIST']),
  branchId: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  specialties: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  joinedDate: z.string().optional(),
});

export const updateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['STYLIST', 'THERAPIST', 'MANAGER', 'RECEPTIONIST']).optional(),
  branchId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  specialties: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * The client sends INTENT only — what was sold and how many. It sends no prices
 * and no totals; every monetary value is computed server-side (see utils/money.ts).
 * Unknown keys are rejected by .strict(), so a stale frontend still posting
 * `subtotal`/`total` gets a loud 422 instead of being silently ignored.
 */
export const createInvoiceSchema = z.object({
  clientId: z.string().nullable().optional(),
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().min(1).max(200),
  clientPhone: z.string().max(40).optional(),
  date: z.string().min(1).max(40),
  items: z.array(z.object({
    serviceId: z.string().optional(),
    productId: z.string().optional(),
    description: z.string().max(500).optional(),
    quantity: z.number().int().positive().max(1000),
  }).strict().refine((i) => !!(i.serviceId || i.productId), {
    message: 'each item needs a serviceId or a productId',
  })).min(1).max(100),
  discount: z.object({
    type: z.enum(['percent', 'flat']),
    value: z.number().nonnegative(),
  }).strict().optional(),
  amountPaid: z.number().nonnegative().optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'OTHER']).optional(),
  branchId: z.string().optional(),
  staffId: z.string().optional(),
  staffName: z.string().max(200).optional(),
  appointmentId: z.string().optional(),
  notes: z.string().max(2000).optional(),
}).strict();

export const updateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'OTHER']).optional(),
  notes: z.string().max(2000).nullable().optional(),
}).strict();

export const createInventorySchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  category: z.enum(['HAIRCARE', 'SKINCARE', 'COLOR', 'TOOLS', 'CONSUMABLES']),
  sku: z.string().min(1),
  currentStock: z.number().int().nonnegative(),
  minStock: z.number().int().nonnegative().optional(),
  costPrice: z.number().nonnegative(),
  retailPrice: z.number().nonnegative().optional(),
  branchId: z.string().min(1),
  isActive: z.boolean().optional(),
});

export const updateInventorySchema = z.object({
  name: z.string().min(1).optional(),
  brand: z.string().optional(),
  category: z.enum(['HAIRCARE', 'SKINCARE', 'COLOR', 'TOOLS', 'CONSUMABLES']).optional(),
  currentStock: z.number().int().nonnegative().optional(),
  minStock: z.number().int().nonnegative().optional(),
  costPrice: z.number().nonnegative().optional(),
  retailPrice: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
  lastRestocked: z.string().optional(),
});

export const updateSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  hours: z.string().optional(),
  instagram: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
});

export const createBranchSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  isActive: z.boolean().optional(),
  isComingSoon: z.boolean().optional(),
});

export const updateBranchSchema = z.object({
  name: z.string().min(1).optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  isComingSoon: z.boolean().optional(),
});

// Public + unauthenticated: every field is length-bounded.
export const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(2000),
  /** Honeypot — real users never fill this. Not persisted. */
  website: z.string().max(200).optional(),
}).strict();

/** :id params. cuid() would be stricter but the seed also creates readable ids. */
export const idParamSchema = z.object({
  id: z.string().min(1).max(64),
});
