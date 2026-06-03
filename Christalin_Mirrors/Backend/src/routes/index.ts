import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { authController } from '../controllers/authController';
import { dashboardController } from '../controllers/dashboardController';
import {
  branchController, staffController, clientController, serviceController,
  appointmentController, invoiceController, inventoryController,
  settingsController, publicController,
} from '../controllers/domainControllers';
import {
  loginSchema, refreshSchema,
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
router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/refresh', validate(refreshSchema), authController.refresh);
router.post('/auth/logout', authenticate, authController.logout);
router.get('/auth/me', authenticate, authController.me);

// ═══════════════════════════════════════════════════════════
//  Public API (no auth)
// ═══════════════════════════════════════════════════════════
router.get('/public/branches', publicController.branches);
router.get('/public/services', publicController.services);
router.post('/public/contact', validate(contactSchema), publicController.contact);

// ═══════════════════════════════════════════════════════════
//  Admin API (authenticated)
// ═══════════════════════════════════════════════════════════
const admin = Router();
admin.use(authenticate);

// Dashboard
admin.get('/dashboard/stats', dashboardController.getStats);
admin.get('/dashboard/alerts', dashboardController.getAlerts);

// Branches
admin.get('/branches', branchController.list);
admin.get('/branches/:id', branchController.getById);
admin.post('/branches', requireRole('OWNER', 'MANAGER'), validate(createBranchSchema), branchController.create);
admin.put('/branches/:id', requireRole('OWNER', 'MANAGER'), validate(updateBranchSchema), branchController.update);
admin.delete('/branches/:id', requireRole('OWNER'), branchController.remove);

// Staff
admin.get('/staff', staffController.list);
admin.get('/staff/:id', staffController.getById);
admin.post('/staff', requireRole('OWNER', 'MANAGER'), validate(createStaffSchema), staffController.create);
admin.put('/staff/:id', requireRole('OWNER', 'MANAGER'), validate(updateStaffSchema), staffController.update);
admin.delete('/staff/:id', requireRole('OWNER'), staffController.remove);

// Clients
admin.get('/clients', clientController.list);
admin.get('/clients/:id', clientController.getById);
admin.post('/clients', validate(createClientSchema), clientController.create);
admin.put('/clients/:id', validate(updateClientSchema), clientController.update);
admin.delete('/clients/:id', requireRole('OWNER', 'MANAGER'), clientController.remove);

// Services
admin.get('/services', serviceController.list);
admin.get('/services/:id', serviceController.getById);
admin.post('/services', requireRole('OWNER', 'MANAGER'), validate(createServiceSchema), serviceController.create);
admin.put('/services/:id', requireRole('OWNER', 'MANAGER'), validate(updateServiceSchema), serviceController.update);
admin.delete('/services/:id', requireRole('OWNER'), serviceController.remove);

// Appointments
admin.get('/appointments', appointmentController.list);
admin.get('/appointments/:id', appointmentController.getById);
admin.post('/appointments', validate(createAppointmentSchema), appointmentController.create);
admin.put('/appointments/:id', validate(updateAppointmentSchema), appointmentController.update);
admin.delete('/appointments/:id', requireRole('OWNER', 'MANAGER'), appointmentController.remove);

// Invoices
admin.get('/invoices', invoiceController.list);
admin.get('/invoices/:id', invoiceController.getById);
admin.post('/invoices', validate(createInvoiceSchema), invoiceController.create);
admin.put('/invoices/:id', validate(updateInvoiceSchema), invoiceController.update);
admin.delete('/invoices/:id', requireRole('OWNER', 'MANAGER'), invoiceController.remove);

// Inventory
admin.get('/inventory', inventoryController.list);
admin.get('/inventory/low-stock', inventoryController.lowStock);
admin.get('/inventory/:id', inventoryController.getById);
admin.post('/inventory', requireRole('OWNER', 'MANAGER'), validate(createInventorySchema), inventoryController.create);
admin.put('/inventory/:id', requireRole('OWNER', 'MANAGER'), validate(updateInventorySchema), inventoryController.update);
admin.delete('/inventory/:id', requireRole('OWNER'), inventoryController.remove);

// Settings
admin.get('/settings', settingsController.get);
admin.put('/settings', requireRole('OWNER', 'MANAGER'), validate(updateSettingsSchema), settingsController.update);

router.use('/admin', admin);

export default router;
