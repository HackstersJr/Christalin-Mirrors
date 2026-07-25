import { Request, Response } from 'express';
import { branchService } from '../services/branchService';
import { staffService } from '../services/staffService';
import { clientService } from '../services/clientService';
import { serviceService } from '../services/serviceService';
import { appointmentService } from '../services/appointmentService';
import { invoiceService } from '../services/invoiceService';
import { inventoryService } from '../services/inventoryService';
import { settingsService } from '../services/settingsService';
import { contactService } from '../services/contactService';
import { serviceVisitService } from '../services/serviceVisitService';
import { TokenPayload } from '../utils/jwt';

/**
 * Every domain service exposes the same five methods with the same shape
 * (ctx first). One helper replaces eight hand-written copies.
 */
interface CrudService {
  list(ctx: TokenPayload, query: any): Promise<unknown>;
  getById(ctx: TokenPayload, id: string): Promise<unknown>;
  create(ctx: TokenPayload, data: any): Promise<unknown>;
  update(ctx: TokenPayload, id: string, data: any): Promise<unknown>;
  remove(ctx: TokenPayload, id: string): Promise<unknown>;
}

function crud(service: CrudService) {
  return {
    async list(req: Request, res: Response) {
      res.json(await service.list(req.user!, req.query));
    },
    async getById(req: Request, res: Response) {
      res.json(await service.getById(req.user!, req.params.id as string));
    },
    async create(req: Request, res: Response) {
      res.status(201).json(await service.create(req.user!, req.body));
    },
    async update(req: Request, res: Response) {
      res.json(await service.update(req.user!, req.params.id as string, req.body));
    },
    async remove(req: Request, res: Response) {
      await service.remove(req.user!, req.params.id as string);
      res.status(204).end();
    },
  };
}

export const branchController = crud(branchService);
export const staffController = crud(staffService);
export const clientController = crud(clientService);
export const serviceController = crud(serviceService);
export const appointmentController = crud(appointmentService);
export const invoiceController = crud(invoiceService);

export const inventoryController = {
  ...crud(inventoryService),
  async lowStock(req: Request, res: Response) {
    res.json(await inventoryService.getLowStock(req.user!));
  },
};

export const serviceVisitController = {
  async list(req: Request, res: Response) {
    res.json(await serviceVisitService.list(req.user!, req.query));
  },
};

export const settingsController = {
  async get(_req: Request, res: Response) {
    res.json(await settingsService.get());
  },
  async update(req: Request, res: Response) {
    res.json(await settingsService.update(req.body));
  },
};

export const publicController = {
  async branches(_req: Request, res: Response) {
    res.json(await branchService.listPublic());
  },
  async services(_req: Request, res: Response) {
    res.json(await serviceService.listPublic());
  },
  async contact(req: Request, res: Response) {
    await contactService.submit(req.body);
    // Deliberately does not echo the stored row back to an anonymous caller.
    res.status(201).json({ ok: true });
  },
};
