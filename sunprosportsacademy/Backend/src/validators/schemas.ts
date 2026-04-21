import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

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

export const createInvoiceSchema = z.object({
  clientId: z.string().nullable().optional(),
  clientName: z.string().min(1),
  clientEmail: z.string().min(1),
  clientPhone: z.string().optional(),
  date: z.string().min(1),
  items: z.array(z.object({
    serviceId: z.string().optional(),
    serviceName: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    total: z.number().nonnegative(),
    productId: z.string().optional(),
  })).min(1),
  subtotal: z.number().nonnegative(),
  discountPercent: z.number().nonnegative().optional(),
  discountAmount: z.number().nonnegative().optional(),
  taxPercent: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(),
  total: z.number().nonnegative(),
  amountPaid: z.number().nonnegative().optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'OTHER']).optional(),
  branchId: z.string().min(1),
  staffId: z.string().optional(),
  staffName: z.string().optional(),
  appointmentId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'OTHER']).optional(),
  amountPaid: z.number().nonnegative().optional(),
  notes: z.string().nullable().optional(),
});

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

export const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1),
});
