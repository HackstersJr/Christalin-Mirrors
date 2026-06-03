// ═══════════════════════════════════════════════════════════════
//  Admin Store — localStorage CRUD (Backend-Ready)
//  Replace these functions with API calls when backend is ready
// ═══════════════════════════════════════════════════════════════

import type { Appointment, Client, ServiceRecord, StaffMember, SalonSettings, ServiceVisit, Invoice, InventoryItem } from './types'
import { mockAppointments, mockClients, mockServices, mockStaff, defaultSettings, mockVisits, mockInvoices, mockInventory } from './mockData'

const KEYS = {
    APPOINTMENTS: 'cm_admin_appointments',
    CLIENTS: 'cm_admin_clients',
    SERVICES: 'cm_admin_services',
    STAFF: 'cm_admin_staff',
    SETTINGS: 'cm_admin_settings',
    VISITS: 'cm_admin_visits',
    INVOICES: 'cm_admin_invoices',
    INVENTORY: 'cm_admin_inventory',
    INITIALIZED: 'cm_admin_initialized_v2',
}

// ─── Initialize with mock data if first load ─────────────────
export function initializeStore() {
    if (localStorage.getItem(KEYS.INITIALIZED)) return
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(mockAppointments))
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(mockClients))
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(mockServices))
    localStorage.setItem(KEYS.STAFF, JSON.stringify(mockStaff))
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(defaultSettings))
    localStorage.setItem(KEYS.VISITS, JSON.stringify(mockVisits))
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(mockInvoices))
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(mockInventory))
    localStorage.setItem(KEYS.INITIALIZED, 'true')
}

// ─── Generic helpers ─────────────────────────────────────────
function getAll<T>(key: string): T[] {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
}

function saveAll<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data))
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ─── Appointments ────────────────────────────────────────────
export const appointmentStore = {
    getAll: (): Appointment[] => getAll(KEYS.APPOINTMENTS),

    getById: (id: string): Appointment | undefined =>
        getAll<Appointment>(KEYS.APPOINTMENTS).find(a => a.id === id),

    create: (apt: Omit<Appointment, 'id' | 'createdAt'>): Appointment => {
        const all = getAll<Appointment>(KEYS.APPOINTMENTS)
        const newApt: Appointment = { ...apt, id: `apt-${generateId()}`, createdAt: new Date().toISOString() }
        all.unshift(newApt)
        saveAll(KEYS.APPOINTMENTS, all)
        return newApt
    },

    update: (id: string, updates: Partial<Appointment>): Appointment | undefined => {
        const all = getAll<Appointment>(KEYS.APPOINTMENTS)
        const idx = all.findIndex(a => a.id === id)
        if (idx === -1) return undefined
        all[idx] = { ...all[idx], ...updates }
        saveAll(KEYS.APPOINTMENTS, all)
        return all[idx]
    },

    delete: (id: string): boolean => {
        const all = getAll<Appointment>(KEYS.APPOINTMENTS)
        const filtered = all.filter(a => a.id !== id)
        if (filtered.length === all.length) return false
        saveAll(KEYS.APPOINTMENTS, filtered)
        return true
    },
}

// ─── Clients ─────────────────────────────────────────────────
export const clientStore = {
    getAll: (): Client[] => getAll(KEYS.CLIENTS),

    getById: (id: string): Client | undefined =>
        getAll<Client>(KEYS.CLIENTS).find(c => c.id === id),

    create: (client: Omit<Client, 'id'>): Client => {
        const all = getAll<Client>(KEYS.CLIENTS)
        const newClient: Client = { ...client, id: `cli-${generateId()}` }
        all.unshift(newClient)
        saveAll(KEYS.CLIENTS, all)
        return newClient
    },

    update: (id: string, updates: Partial<Client>): Client | undefined => {
        const all = getAll<Client>(KEYS.CLIENTS)
        const idx = all.findIndex(c => c.id === id)
        if (idx === -1) return undefined
        all[idx] = { ...all[idx], ...updates }
        saveAll(KEYS.CLIENTS, all)
        return all[idx]
    },

    delete: (id: string): boolean => {
        const all = getAll<Client>(KEYS.CLIENTS)
        const filtered = all.filter(c => c.id !== id)
        if (filtered.length === all.length) return false
        saveAll(KEYS.CLIENTS, filtered)
        return true
    },
}

// ─── Services ────────────────────────────────────────────────
export const serviceStore = {
    getAll: (): ServiceRecord[] => getAll(KEYS.SERVICES),

    create: (svc: Omit<ServiceRecord, 'id'>): ServiceRecord => {
        const all = getAll<ServiceRecord>(KEYS.SERVICES)
        const newSvc: ServiceRecord = { ...svc, id: `svc-${generateId()}` }
        all.push(newSvc)
        saveAll(KEYS.SERVICES, all)
        return newSvc
    },

    update: (id: string, updates: Partial<ServiceRecord>): ServiceRecord | undefined => {
        const all = getAll<ServiceRecord>(KEYS.SERVICES)
        const idx = all.findIndex(s => s.id === id)
        if (idx === -1) return undefined
        all[idx] = { ...all[idx], ...updates }
        saveAll(KEYS.SERVICES, all)
        return all[idx]
    },

    delete: (id: string): boolean => {
        const all = getAll<ServiceRecord>(KEYS.SERVICES)
        const filtered = all.filter(s => s.id !== id)
        if (filtered.length === all.length) return false
        saveAll(KEYS.SERVICES, filtered)
        return true
    },
}

// ─── Staff ───────────────────────────────────────────────────
export const staffStore = {
    getAll: (): StaffMember[] => getAll(KEYS.STAFF),

    create: (member: Omit<StaffMember, 'id'>): StaffMember => {
        const all = getAll<StaffMember>(KEYS.STAFF)
        const newMember: StaffMember = { ...member, id: `stf-${generateId()}` }
        all.push(newMember)
        saveAll(KEYS.STAFF, all)
        return newMember
    },

    update: (id: string, updates: Partial<StaffMember>): StaffMember | undefined => {
        const all = getAll<StaffMember>(KEYS.STAFF)
        const idx = all.findIndex(s => s.id === id)
        if (idx === -1) return undefined
        all[idx] = { ...all[idx], ...updates }
        saveAll(KEYS.STAFF, all)
        return all[idx]
    },

    delete: (id: string): boolean => {
        const all = getAll<StaffMember>(KEYS.STAFF)
        const filtered = all.filter(s => s.id !== id)
        if (filtered.length === all.length) return false
        saveAll(KEYS.STAFF, filtered)
        return true
    },
}

// ─── Settings ────────────────────────────────────────────────
export const settingsStore = {
    get: (): SalonSettings => {
        const raw = localStorage.getItem(KEYS.SETTINGS)
        return raw ? JSON.parse(raw) : defaultSettings
    },

    update: (updates: Partial<SalonSettings>): SalonSettings => {
        const current = settingsStore.get()
        const updated = { ...current, ...updates }
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated))
        return updated
    },
}

// ─── Service Visits (History) ────────────────────────────────
export const visitStore = {
    getAll: (): ServiceVisit[] => getAll(KEYS.VISITS),

    getByClientId: (clientId: string): ServiceVisit[] =>
        getAll<ServiceVisit>(KEYS.VISITS).filter(v => v.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date)),

    create: (visit: Omit<ServiceVisit, 'id'>): ServiceVisit => {
        const all = getAll<ServiceVisit>(KEYS.VISITS)
        const newVisit: ServiceVisit = { ...visit, id: `vis-${generateId()}` }
        all.unshift(newVisit)
        saveAll(KEYS.VISITS, all)
        return newVisit
    },

    update: (id: string, updates: Partial<ServiceVisit>): ServiceVisit | undefined => {
        const all = getAll<ServiceVisit>(KEYS.VISITS)
        const idx = all.findIndex(v => v.id === id)
        if (idx === -1) return undefined
        all[idx] = { ...all[idx], ...updates }
        saveAll(KEYS.VISITS, all)
        return all[idx]
    },

    delete: (id: string): boolean => {
        const all = getAll<ServiceVisit>(KEYS.VISITS)
        const filtered = all.filter(v => v.id !== id)
        if (filtered.length === all.length) return false
        saveAll(KEYS.VISITS, filtered)
        return true
    },
}

// ─── Invoices ────────────────────────────────────────────────
export const invoiceStore = {
    getAll: (): Invoice[] => getAll(KEYS.INVOICES),

    getById: (id: string): Invoice | undefined =>
        getAll<Invoice>(KEYS.INVOICES).find(i => i.id === id),

    getByClientId: (clientId: string): Invoice[] =>
        getAll<Invoice>(KEYS.INVOICES).filter(i => i.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date)),

    getNextInvoiceNumber: (): string => {
        const all = getAll<Invoice>(KEYS.INVOICES)
        const max = all.reduce((m, inv) => {
            const num = parseInt(inv.invoiceNumber.replace('CM-INV-', ''))
            return num > m ? num : m
        }, 0)
        return `CM-INV-${String(max + 1).padStart(4, '0')}`
    },

    create: (inv: Omit<Invoice, 'id' | 'createdAt'>): Invoice => {
        const all = getAll<Invoice>(KEYS.INVOICES)
        const newInv: Invoice = { ...inv, id: `inv-${generateId()}`, createdAt: new Date().toISOString() }
        all.unshift(newInv)
        saveAll(KEYS.INVOICES, all)
        return newInv
    },

    update: (id: string, updates: Partial<Invoice>): Invoice | undefined => {
        const all = getAll<Invoice>(KEYS.INVOICES)
        const idx = all.findIndex(i => i.id === id)
        if (idx === -1) return undefined
        all[idx] = { ...all[idx], ...updates }
        saveAll(KEYS.INVOICES, all)
        return all[idx]
    },

    delete: (id: string): boolean => {
        const all = getAll<Invoice>(KEYS.INVOICES)
        const filtered = all.filter(i => i.id !== id)
        if (filtered.length === all.length) return false
        saveAll(KEYS.INVOICES, filtered)
        return true
    },
}

// ─── Inventory ───────────────────────────────────────────────
export const inventoryStore = {
    getAll: (): InventoryItem[] => getAll(KEYS.INVENTORY),

    getById: (id: string): InventoryItem | undefined =>
        getAll<InventoryItem>(KEYS.INVENTORY).find(i => i.id === id),

    create: (item: Omit<InventoryItem, 'id'>): InventoryItem => {
        const all = getAll<InventoryItem>(KEYS.INVENTORY)
        const newItem: InventoryItem = { ...item, id: `itm-${generateId()}` }
        all.push(newItem)
        saveAll(KEYS.INVENTORY, all)
        return newItem
    },

    update: (id: string, updates: Partial<InventoryItem>): InventoryItem | undefined => {
        const all = getAll<InventoryItem>(KEYS.INVENTORY)
        const idx = all.findIndex(i => i.id === id)
        if (idx === -1) return undefined
        all[idx] = { ...all[idx], ...updates }
        saveAll(KEYS.INVENTORY, all)
        return all[idx]
    },

    delete: (id: string): boolean => {
        const all = getAll<InventoryItem>(KEYS.INVENTORY)
        const filtered = all.filter(i => i.id !== id)
        if (filtered.length === all.length) return false
        saveAll(KEYS.INVENTORY, filtered)
        return true
    },

    getLowStock: (): InventoryItem[] =>
        getAll<InventoryItem>(KEYS.INVENTORY).filter(i => i.isActive && i.currentStock <= i.minStock),
}

// ─── Reset to defaults ──────────────────────────────────────
export function resetStore() {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key))
    initializeStore()
}
