import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { ah } from '../utils/asyncHandler';
import { authController } from '../controllers/authController';
import { dashboardController } from '../controllers/dashboardController';
import {
  branchController, staffController, clientController, serviceController,
  appointmentController, invoiceController, inventoryController,
  settingsController, publicController, serviceVisitController,
} from '../controllers/domainControllers';
import { loginLimiter, contactLimiter } from '../middleware/rateLimit';
import {
  loginSchema,
  createAppointmentSchema, updateAppointmentSchema,
  createClientSchema, updateClientSchema,
  createServiceSchema, updateServiceSchema,
  createStaffSchema, updateStaffSchema,
  createInvoiceSchema, updateInvoiceSchema,
  createInventorySchema, updateInventorySchema,
  updateSettingsSchema,
  createBranchSchema, updateBranchSchema,
  contactSchema,
} from '../validators/schemas';

const router = Router();

// ═══════════════════════════════════════════════════════════
//  Health
// ═══════════════════════════════════════════════════════════
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════
//  Auth (public)
// ═══════════════════════════════════════════════════════════
// v1 has no refresh token — a single 12h access token. See utils/jwt.ts.
router.post('/auth/login', loginLimiter, validate(loginSchema), ah(authController.login));
router.post('/auth/logout', authenticate, ah(authController.logout));
router.get('/auth/me', authenticate, ah(authController.me));

// ═══════════════════════════════════════════════════════════
//  Public API (no auth)
// ═══════════════════════════════════════════════════════════
router.get('/public/branches', ah(publicController.branches));
router.get('/public/services', ah(publicController.services));
router.post('/public/contact', contactLimiter, validate(contactSchema), ah(publicController.contact));

// ═══════════════════════════════════════════════════════════
//  Admin API (authenticated)
// ═══════════════════════════════════════════════════════════
const admin = Router();
admin.use(authenticate);

// Dashboard
admin.get('/dashboard/stats', ah(dashboardController.getStats));
admin.get('/dashboard/alerts', ah(dashboardController.getAlerts));

// Branches
admin.get('/branches', ah(branchController.list));
admin.get('/branches/:id', ah(branchController.getById));
admin.post('/branches', requireRole('OWNER', 'MANAGER'), validate(createBranchSchema), ah(branchController.create));
admin.put('/branches/:id', requireRole('OWNER', 'MANAGER'), validate(updateBranchSchema), ah(branchController.update));
admin.delete('/branches/:id', requireRole('OWNER'), ah(branchController.remove));

// Staff
admin.get('/staff', ah(staffController.list));
admin.get('/staff/:id', ah(staffController.getById));
admin.post('/staff', requireRole('OWNER', 'MANAGER'), validate(createStaffSchema), ah(staffController.create));
admin.put('/staff/:id', requireRole('OWNER', 'MANAGER'), validate(updateStaffSchema), ah(staffController.update));
admin.delete('/staff/:id', requireRole('OWNER'), ah(staffController.remove));

// Clients
admin.get('/clients', ah(clientController.list));
admin.get('/clients/:id', ah(clientController.getById));
admin.post('/clients', validate(createClientSchema), ah(clientController.create));
admin.put('/clients/:id', validate(updateClientSchema), ah(clientController.update));
admin.delete('/clients/:id', requireRole('OWNER', 'MANAGER'), ah(clientController.remove));

// Services
admin.get('/services', ah(serviceController.list));
admin.get('/services/:id', ah(serviceController.getById));
admin.post('/services', requireRole('OWNER', 'MANAGER'), validate(createServiceSchema), ah(serviceController.create));
admin.put('/services/:id', requireRole('OWNER', 'MANAGER'), validate(updateServiceSchema), ah(serviceController.update));
admin.delete('/services/:id', requireRole('OWNER'), ah(serviceController.remove));

// Appointments
admin.get('/appointments', ah(appointmentController.list));
admin.get('/appointments/:id', ah(appointmentController.getById));
admin.post('/appointments', validate(createAppointmentSchema), ah(appointmentController.create));
admin.put('/appointments/:id', validate(updateAppointmentSchema), ah(appointmentController.update));
admin.delete('/appointments/:id', requireRole('OWNER', 'MANAGER'), ah(appointmentController.remove));

// Invoices
admin.get('/invoices', ah(invoiceController.list));
admin.get('/invoices/:id', ah(invoiceController.getById));
// Creating/editing invoices is front-desk work, so no role gate here — but
// totals are server-computed (see utils/money.ts), so a receptionist cannot
// set a price. Discount ceilings by role are deferred to v2 (see Q1).
admin.post('/invoices', validate(createInvoiceSchema), ah(invoiceController.create));
admin.put('/invoices/:id', validate(updateInvoiceSchema), ah(invoiceController.update));
admin.delete('/invoices/:id', requireRole('OWNER', 'MANAGER'), ah(invoiceController.remove));

// Inventory
admin.get('/inventory', ah(inventoryController.list));
admin.get('/inventory/low-stock', ah(inventoryController.lowStock));
admin.get('/inventory/:id', ah(inventoryController.getById));
admin.post('/inventory', requireRole('OWNER', 'MANAGER'), validate(createInventorySchema), ah(inventoryController.create));
admin.put('/inventory/:id', requireRole('OWNER', 'MANAGER'), validate(updateInventorySchema), ah(inventoryController.update));
admin.delete('/inventory/:id', requireRole('OWNER'), ah(inventoryController.remove));

// Service visits (read-only; written by the invoice pipeline)
admin.get('/service-visits', ah(serviceVisitController.list));

// Settings
admin.get('/settings', ah(settingsController.get));
admin.put('/settings', requireRole('OWNER', 'MANAGER'), validate(updateSettingsSchema), ah(settingsController.update));

router.use('/admin', admin);

export default router;
