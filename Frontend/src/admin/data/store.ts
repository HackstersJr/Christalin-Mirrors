// ═══════════════════════════════════════════════════════════════
//  Admin Store — backed by the real API.
//
//  Same function names and same data shapes as the old localStorage
//  version, so pages only had to switch from sync to async. All business
//  data now lives in Postgres; nothing here reads localStorage except the
//  auth token (see lib/api.ts).
// ═══════════════════════════════════════════════════════════════

import type {
    Appointment, Client, ServiceRecord, StaffMember, SalonSettings,
    ServiceVisit, Invoice, InventoryItem, DashboardStats,
} from './types'
import { adminApi, auth } from '../../lib/api'

/** Lists come back paginated as { items, total, ... }. Pages want the array. */
async function items<T>(url: string, params?: Record<string, unknown>): Promise<T[]> {
    const { data } = await adminApi.get(url, { params: { limit: 100, ...params } })
    return Array.isArray(data) ? data : (data.items ?? [])
}

// ─── Branch name ⇄ id ────────────────────────────────────────
// The UI models branch as a display name; the API needs an id on writes.
// Cached for the session — two branches that rarely change.
let branchCache: { id: string; name: string }[] | null = null

export async function getBranches() {
    if (!branchCache) branchCache = await items<{ id: string; name: string }>('/admin/branches')
    return branchCache
}

/**
 * Resolve a branch display name to an id. Falls back to the logged-in user's
 * own branch, which is what the server would enforce anyway for non-owners.
 */
export async function branchIdFor(name?: string): Promise<string | undefined> {
    const me = auth.user()
    if (!name) return me?.branchId
    const all = await getBranches()
    const hit = all.find(b => b.name === name || b.name.includes(name) || name.includes(b.name))
    return hit?.id ?? me?.branchId
}

// ─── Appointments ────────────────────────────────────────────
export const appointmentStore = {
    getAll: (): Promise<Appointment[]> => items<Appointment>('/admin/appointments'),

    getById: async (id: string): Promise<Appointment | undefined> => {
        const { data } = await adminApi.get(`/admin/appointments/${id}`)
        return data
    },

    create: async (apt: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> => {
        const { data } = await adminApi.post('/admin/appointments', {
            clientId: apt.clientId || undefined,
            clientName: apt.clientName,
            clientEmail: apt.clientEmail,
            clientPhone: apt.clientPhone,
            date: apt.date,
            time: apt.time,
            serviceId: apt.serviceId || undefined,
            serviceName: apt.service,
            staffId: apt.staffId || undefined,
            staffName: apt.stylist,
            status: apt.status?.toUpperCase(),
            notes: apt.notes,
            branchId: await branchIdFor(apt.branch),
        })
        return data
    },

    update: async (id: string, u: Partial<Appointment>): Promise<Appointment | undefined> => {
        const { data } = await adminApi.put(`/admin/appointments/${id}`, {
            ...(u.clientName !== undefined ? { clientName: u.clientName } : {}),
            ...(u.clientEmail !== undefined ? { clientEmail: u.clientEmail } : {}),
            ...(u.clientPhone !== undefined ? { clientPhone: u.clientPhone } : {}),
            ...(u.date !== undefined ? { date: u.date } : {}),
            ...(u.time !== undefined ? { time: u.time } : {}),
            ...(u.service !== undefined ? { serviceName: u.service } : {}),
            ...(u.stylist !== undefined ? { staffName: u.stylist } : {}),
            ...(u.status !== undefined ? { status: u.status.toUpperCase() } : {}),
            ...(u.notes !== undefined ? { notes: u.notes } : {}),
        })
        return data
    },

    delete: async (id: string): Promise<boolean> => {
        await adminApi.delete(`/admin/appointments/${id}`)
        return true
    },
}

// ─── Clients ─────────────────────────────────────────────────
export const clientStore = {
    getAll: (): Promise<Client[]> => items<Client>('/admin/clients'),

    getById: async (id: string): Promise<Client | undefined> => {
        const { data } = await adminApi.get(`/admin/clients/${id}`)
        return data
    },

    create: async (c: Omit<Client, 'id'>): Promise<Client> => {
        const { data } = await adminApi.post('/admin/clients', {
            name: c.name,
            email: c.email,
            phone: c.phone,
            gender: c.gender.toUpperCase(),
            branchId: await branchIdFor(c.branch),
            joinedDate: c.joinedDate,
            notes: c.notes,
            tags: c.tags ?? [],
        })
        return data
    },

    update: async (id: string, u: Partial<Client>): Promise<Client | undefined> => {
        const { data } = await adminApi.put(`/admin/clients/${id}`, {
            ...(u.name !== undefined ? { name: u.name } : {}),
            ...(u.email !== undefined ? { email: u.email } : {}),
            ...(u.phone !== undefined ? { phone: u.phone } : {}),
            ...(u.gender !== undefined ? { gender: u.gender.toUpperCase() } : {}),
            ...(u.notes !== undefined ? { notes: u.notes } : {}),
            ...(u.tags !== undefined ? { tags: u.tags } : {}),
        })
        return data
    },

    delete: async (id: string): Promise<boolean> => {
        await adminApi.delete(`/admin/clients/${id}`)
        return true
    },
}

// ─── Services ────────────────────────────────────────────────
export const serviceStore = {
    getAll: (): Promise<ServiceRecord[]> => items<ServiceRecord>('/admin/services'),

    create: async (s: Omit<ServiceRecord, 'id'>): Promise<ServiceRecord> => {
        const { data } = await adminApi.post('/admin/services', {
            name: s.name,
            category: s.category.toUpperCase(),
            duration: s.duration,
            price: s.price,
            isActive: s.isActive,
            isKorean: s.isKorean,
            description: s.description,
        })
        return data
    },

    update: async (id: string, u: Partial<ServiceRecord>): Promise<ServiceRecord | undefined> => {
        const { data } = await adminApi.put(`/admin/services/${id}`, {
            ...(u.name !== undefined ? { name: u.name } : {}),
            ...(u.category !== undefined ? { category: u.category.toUpperCase() } : {}),
            ...(u.duration !== undefined ? { duration: u.duration } : {}),
            ...(u.price !== undefined ? { price: u.price } : {}),
            ...(u.isActive !== undefined ? { isActive: u.isActive } : {}),
            ...(u.isKorean !== undefined ? { isKorean: u.isKorean } : {}),
            ...(u.description !== undefined ? { description: u.description } : {}),
        })
        return data
    },

    delete: async (id: string): Promise<boolean> => {
        await adminApi.delete(`/admin/services/${id}`)
        return true
    },
}

// ─── Staff ───────────────────────────────────────────────────
export const staffStore = {
    getAll: (): Promise<StaffMember[]> => items<StaffMember>('/admin/staff'),

    create: async (m: Omit<StaffMember, 'id'>): Promise<StaffMember> => {
        const { data } = await adminApi.post('/admin/staff', {
            name: m.name,
            role: m.role.toUpperCase(),
            branchId: await branchIdFor(m.branch),
            phone: m.phone,
            email: m.email,
            specialties: m.specialties ?? [],
            isActive: m.isActive,
            joinedDate: m.joinedDate,
        })
        return data
    },

    // branchId and role are server-rejected on update by design — staff transfers
    // are an OWNER-only operation not built for v1.
    update: async (id: string, u: Partial<StaffMember>): Promise<StaffMember | undefined> => {
        const { data } = await adminApi.put(`/admin/staff/${id}`, {
            ...(u.name !== undefined ? { name: u.name } : {}),
            ...(u.phone !== undefined ? { phone: u.phone } : {}),
            ...(u.email !== undefined ? { email: u.email } : {}),
            ...(u.specialties !== undefined ? { specialties: u.specialties } : {}),
            ...(u.isActive !== undefined ? { isActive: u.isActive } : {}),
        })
        return data
    },

    delete: async (id: string): Promise<boolean> => {
        await adminApi.delete(`/admin/staff/${id}`)
        return true
    },
}

// ─── Settings ────────────────────────────────────────────────
export const settingsStore = {
    get: async (): Promise<SalonSettings> => {
        const { data } = await adminApi.get('/admin/settings')
        return data
    },
    update: async (u: Partial<SalonSettings>): Promise<SalonSettings> => {
        const { data } = await adminApi.put('/admin/settings', {
            ...(u.name !== undefined ? { name: u.name } : {}),
            ...(u.email !== undefined ? { email: u.email } : {}),
            ...(u.phone !== undefined ? { phone: u.phone } : {}),
            ...(u.hours !== undefined ? { hours: u.hours } : {}),
            ...(u.socialLinks?.instagram !== undefined ? { instagram: u.socialLinks.instagram } : {}),
            ...(u.socialLinks?.facebook !== undefined ? { facebook: u.socialLinks.facebook } : {}),
            ...(u.socialLinks?.website !== undefined ? { website: u.socialLinks.website } : {}),
        })
        return data
    },
}

// ─── Service Visits (history) ────────────────────────────────
export const visitStore = {
    getAll: (): Promise<ServiceVisit[]> => items<ServiceVisit>('/admin/service-visits'),
    getByClientId: (clientId: string): Promise<ServiceVisit[]> =>
        items<ServiceVisit>('/admin/service-visits', { clientId }),
}

// ─── Invoices ────────────────────────────────────────────────
export interface InvoiceLineIntent {
    serviceId?: string
    productId?: string
    description?: string
    quantity: number
}

export interface CreateInvoiceIntent {
    clientId?: string
    clientName: string
    clientEmail: string
    clientPhone?: string
    date: string
    items: InvoiceLineIntent[]
    discount?: { type: 'percent' | 'flat'; value: number }
    amountPaid?: number
    status?: 'DRAFT' | 'SENT' | 'PAID'
    paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'OTHER'
    staffId?: string
    staffName?: string
    appointmentId?: string
    notes?: string
    branch?: string
}

export const invoiceStore = {
    getAll: (): Promise<Invoice[]> => items<Invoice>('/admin/invoices'),

    getById: async (id: string): Promise<Invoice | undefined> => {
        const { data } = await adminApi.get(`/admin/invoices/${id}`)
        return data
    },

    getByClientId: (clientId: string): Promise<Invoice[]> =>
        items<Invoice>('/admin/invoices', { clientId }),

    /**
     * Sends INTENT only — what was sold and how many. The server resolves every
     * price from the catalogue and computes subtotal/discount/tax/total.
     * The returned invoice is authoritative; display that, not local arithmetic.
     */
    create: async (intent: CreateInvoiceIntent): Promise<Invoice> => {
        const { data } = await adminApi.post('/admin/invoices', {
            clientId: intent.clientId || undefined,
            clientName: intent.clientName,
            clientEmail: intent.clientEmail,
            clientPhone: intent.clientPhone,
            date: intent.date,
            items: intent.items,
            discount: intent.discount,
            amountPaid: intent.amountPaid,
            status: intent.status,
            paymentMethod: intent.paymentMethod,
            staffId: intent.staffId || undefined,
            staffName: intent.staffName,
            appointmentId: intent.appointmentId || undefined,
            notes: intent.notes,
            branchId: await branchIdFor(intent.branch),
        })
        return data
    },

    update: async (id: string, u: { status?: string; paymentMethod?: string; notes?: string | null }): Promise<Invoice | undefined> => {
        const { data } = await adminApi.put(`/admin/invoices/${id}`, {
            ...(u.status !== undefined ? { status: u.status.toUpperCase() } : {}),
            ...(u.paymentMethod !== undefined ? { paymentMethod: u.paymentMethod.toUpperCase() } : {}),
            ...(u.notes !== undefined ? { notes: u.notes } : {}),
        })
        return data
    },

    delete: async (id: string): Promise<boolean> => {
        await adminApi.delete(`/admin/invoices/${id}`)
        return true
    },
}

// ─── Inventory ───────────────────────────────────────────────
export const inventoryStore = {
    getAll: (): Promise<InventoryItem[]> => items<InventoryItem>('/admin/inventory'),

    getById: async (id: string): Promise<InventoryItem | undefined> => {
        const { data } = await adminApi.get(`/admin/inventory/${id}`)
        return data
    },

    create: async (i: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
        const { data } = await adminApi.post('/admin/inventory', {
            name: i.name,
            brand: i.brand,
            category: i.category,
            sku: i.sku,
            currentStock: i.currentStock,
            minStock: i.minStock,
            costPrice: i.costPrice,
            retailPrice: i.retailPrice,
            branchId: await branchIdFor(i.branch),
            isActive: i.isActive,
        })
        return data
    },

    update: async (id: string, u: Partial<InventoryItem>): Promise<InventoryItem | undefined> => {
        const { data } = await adminApi.put(`/admin/inventory/${id}`, {
            ...(u.name !== undefined ? { name: u.name } : {}),
            ...(u.brand !== undefined ? { brand: u.brand } : {}),
            ...(u.category !== undefined ? { category: u.category } : {}),
            ...(u.currentStock !== undefined ? { currentStock: u.currentStock } : {}),
            ...(u.minStock !== undefined ? { minStock: u.minStock } : {}),
            ...(u.costPrice !== undefined ? { costPrice: u.costPrice } : {}),
            ...(u.retailPrice !== undefined ? { retailPrice: u.retailPrice } : {}),
            ...(u.isActive !== undefined ? { isActive: u.isActive } : {}),
            ...(u.lastRestocked !== undefined ? { lastRestocked: u.lastRestocked } : {}),
        })
        return data
    },

    delete: async (id: string): Promise<boolean> => {
        await adminApi.delete(`/admin/inventory/${id}`)
        return true
    },

    getLowStock: async (): Promise<InventoryItem[]> => {
        const { data } = await adminApi.get('/admin/inventory/low-stock')
        return data
    },
}

// ─── Dashboard ───────────────────────────────────────────────
export const dashboardStore = {
    stats: async (): Promise<DashboardStats> => {
        const { data } = await adminApi.get('/admin/dashboard/stats')
        return data
    },
    alerts: async (): Promise<{ lowStockItems: InventoryItem[]; lowStockCount: number }> => {
        const { data } = await adminApi.get('/admin/dashboard/alerts')
        return data
    },
}

/** No-op: data lives on the server now. Kept so App.tsx needs no change. */
export function initializeStore() { /* server-backed */ }
