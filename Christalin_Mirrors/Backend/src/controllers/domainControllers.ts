import { Request, Response } from 'express';
import { branchService } from '../services/branchService';
import { staffService } from '../services/staffService';
import { clientService } from '../services/clientService';
import { serviceService } from '../services/serviceService';
import { appointmentService } from '../services/appointmentService';
import { invoiceService } from '../services/invoiceService';
import { inventoryService } from '../services/inventoryService';
import { settingsService } from '../services/settingsService';

// ─── Branch ─────────────────────────────────────────────────
export const branchController = {
  async list(req: Request, res: Response) { res.json(await branchService.list(req.query as any)); },
  async getById(req: Request, res: Response) { res.json(await branchService.getById(req.params.id)); },
  async create(req: Request, res: Response) { res.status(201).json(await branchService.create(req.body)); },
  async update(req: Request, res: Response) { res.json(await branchService.update(req.params.id, req.body)); },
  async remove(req: Request, res: Response) { await branchService.remove(req.params.id); res.status(204).end(); },
};

// ─── Staff ──────────────────────────────────────────────────
export const staffController = {
  async list(req: Request, res: Response) { res.json(await staffService.list(req.query as any)); },
  async getById(req: Request, res: Response) { res.json(await staffService.getById(req.params.id)); },
  async create(req: Request, res: Response) { res.status(201).json(await staffService.create(req.body)); },
  async update(req: Request, res: Response) { res.json(await staffService.update(req.params.id, req.body)); },
  async remove(req: Request, res: Response) { await staffService.remove(req.params.id); res.status(204).end(); },
};

// ─── Client ─────────────────────────────────────────────────
export const clientController = {
  async list(req: Request, res: Response) { res.json(await clientService.list(req.query as any)); },
  async getById(req: Request, res: Response) { res.json(await clientService.getById(req.params.id)); },
  async create(req: Request, res: Response) { res.status(201).json(await clientService.create(req.body)); },
  async update(req: Request, res: Response) { res.json(await clientService.update(req.params.id, req.body)); },
  async remove(req: Request, res: Response) { await clientService.remove(req.params.id); res.status(204).end(); },
};

// ─── Service ────────────────────────────────────────────────
export const serviceController = {
  async list(req: Request, res: Response) { res.json(await serviceService.list(req.query as any)); },
  async getById(req: Request, res: Response) { res.json(await serviceService.getById(req.params.id)); },
  async create(req: Request, res: Response) { res.status(201).json(await serviceService.create(req.body)); },
  async update(req: Request, res: Response) { res.json(await serviceService.update(req.params.id, req.body)); },
  async remove(req: Request, res: Response) { await serviceService.remove(req.params.id); res.status(204).end(); },
};

// ─── Appointment ────────────────────────────────────────────
export const appointmentController = {
  async list(req: Request, res: Response) { res.json(await appointmentService.list(req.query as any)); },
  async getById(req: Request, res: Response) { res.json(await appointmentService.getById(req.params.id)); },
  async create(req: Request, res: Response) { res.status(201).json(await appointmentService.create(req.body)); },
  async update(req: Request, res: Response) { res.json(await appointmentService.update(req.params.id, req.body)); },
  async remove(req: Request, res: Response) { await appointmentService.remove(req.params.id); res.status(204).end(); },
};

// ─── Invoice ────────────────────────────────────────────────
export const invoiceController = {
  async list(req: Request, res: Response) { res.json(await invoiceService.list(req.query as any)); },
  async getById(req: Request, res: Response) { res.json(await invoiceService.getById(req.params.id)); },
  async create(req: Request, res: Response) { res.status(201).json(await invoiceService.create(req.body)); },
  async update(req: Request, res: Response) { res.json(await invoiceService.update(req.params.id, req.body)); },
  async remove(req: Request, res: Response) { await invoiceService.remove(req.params.id); res.status(204).end(); },
};

// ─── Inventory ──────────────────────────────────────────────
export const inventoryController = {
  async list(req: Request, res: Response) { res.json(await inventoryService.list(req.query as any)); },
  async getById(req: Request, res: Response) { res.json(await inventoryService.getById(req.params.id)); },
  async create(req: Request, res: Response) { res.status(201).json(await inventoryService.create(req.body)); },
  async update(req: Request, res: Response) { res.json(await inventoryService.update(req.params.id, req.body)); },
  async remove(req: Request, res: Response) { await inventoryService.remove(req.params.id); res.status(204).end(); },
  async lowStock(req: Request, res: Response) {
    const branchId = req.user?.role === 'OWNER' ? (req.query.branchId as string) : req.user?.branchId;
    res.json(await inventoryService.getLowStock(branchId));
  },
};

// ─── Settings ───────────────────────────────────────────────
export const settingsController = {
  async get(_req: Request, res: Response) { res.json(await settingsService.get()); },
  async update(req: Request, res: Response) { res.json(await settingsService.update(req.body)); },
};

// ─── Public ─────────────────────────────────────────────────
export const publicController = {
  async branches(_req: Request, res: Response) { res.json(await branchService.listPublic()); },
  async services(_req: Request, res: Response) { res.json(await serviceService.listPublic()); },
  async contact(req: Request, res: Response) {
    const { default: prisma } = await import('../utils/prisma');
    const submission = await prisma.contactSubmission.create({ data: req.body });
    res.status(201).json(submission);
  },
};
