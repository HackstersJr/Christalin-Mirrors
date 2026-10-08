// ═══════════════════════════════════════════════════════════════
//  Admin Store — Live Supabase Integration (Serverless 2-Tier)
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../../lib/supabase'
import type { Appointment, Client, ServiceRecord, StaffMember, SalonSettings, ServiceVisit, Invoice, InventoryItem, AttendanceRecord, Expense, ExpenseCategory, ServicePackage } from './types'
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
    ATTENDANCE: 'cm_admin_attendance',
    DELETED_STAFF: 'cm_admin_deleted_staff_ids',
    INITIALIZED: 'cm_admin_initialized_v3',
}

function paisaToRupees(paisa: number): number {
    return Number(((Number(paisa) || 0) / 100).toFixed(2))
}

function rupeesToPaisa(rupees: number): number {
    return Math.round((Number(rupees) || 0) * 100)
}

// Branch name helper
function mapBranch(nameOrId: string): string {
    if (!nameOrId) return 'Bengaluru'
    const lower = nameOrId.toLowerCase()
    if (lower.includes('manea') || lower.includes('mane')) return 'Manea'
    if (lower.includes('kalaburagi') || lower.includes('kalburgi') || lower.includes('klb') || lower.includes('gulbarga')) return 'Kalaburagi'
    if (lower.includes('belgaum') || lower.includes('belagavi') || lower.includes('bgm')) return 'Belgaum'
    if (lower.includes('yelahanka') || lower.includes('upcoming 1') || lower.includes('upc_1')) return 'Upcoming Branch 1 (Yelahanka)'
    if (lower.includes('hassan') || lower.includes('upcoming 2') || lower.includes('upc_2')) return 'Upcoming Branch 2 (Hassan)'
    return 'Bengaluru'
}

function getBranchId(branchName: string): string {
    if (!branchName) return 'branch_blr'
    const lower = branchName.toLowerCase()
    if (lower.includes('manea') || lower.includes('mane')) return 'branch_manea'
    if (lower.includes('kalaburagi') || lower.includes('kalburgi') || lower.includes('klb') || lower.includes('gulbarga')) return 'branch_klb'
    if (lower.includes('belgaum') || lower.includes('belagavi') || lower.includes('bgm')) return 'branch_bgm'
    if (lower.includes('yelahanka') || lower.includes('upcoming 1') || lower.includes('upc_1')) return 'branch_upc_1'
    if (lower.includes('hassan') || lower.includes('upcoming 2') || lower.includes('upc_2')) return 'branch_upc_2'
    return 'branch_blr'
}

// ─── Initialize local cache fallback ─────────────────────────
export function initializeStore() {
    // Force purge stale local storage caches from earlier mock sessions
    localStorage.removeItem(KEYS.APPOINTMENTS)
    localStorage.removeItem(KEYS.CLIENTS)
    localStorage.removeItem(KEYS.SERVICES)
    localStorage.removeItem(KEYS.VISITS)
    localStorage.removeItem(KEYS.INVOICES)
    localStorage.removeItem('cm_admin_initialized')
    localStorage.removeItem('cm_admin_initialized_v2')
    localStorage.removeItem('cm_admin_initialized_v3')
    localStorage.setItem(KEYS.INITIALIZED, 'true_v5')
}

// ─── Appointments ────────────────────────────────────────────
export const appointmentStore = {
    getAll: async (): Promise<Appointment[]> => {
        try {
            const { data, error } = await supabase
                .from('Appointment')
                .select('*')
                .order('date', { ascending: false })

            if (error || !data) return []

            return data.map((a: any) => ({
                id: a.id,
                clientId: a.clientId || '',
                staffId: a.staffId || '',
                serviceId: a.serviceId || '',
                clientName: a.clientName,
                clientEmail: a.clientEmail,
                clientPhone: a.clientPhone || undefined,
                date: a.date ? String(a.date).split('T')[0] : '',
                time: a.time,
                service: a.serviceName,
                stylist: a.staffName || undefined,
                status: a.status ? a.status.toLowerCase() as any : 'pending',
                notes: a.notes || undefined,
                branchId: a.branchId,
                branch: a.branch?.name ? mapBranch(a.branch.name) : mapBranch(a.branchId),
                createdAt: a.createdAt || new Date().toISOString(),
            }))
        } catch {
            return []
        }
    },

    create: async (apt: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> => {
        const branchId = getBranchId(apt.branch)
        let clientId = apt.clientId || null

        // Auto-link or auto-create Client in Supabase database when booking
        if (apt.clientName) {
            try {
                let query = supabase.from('Client').select('id')
                if (apt.clientEmail && apt.clientPhone) {
                    query = query.or(`email.eq.${apt.clientEmail},phone.eq.${apt.clientPhone}`)
                } else if (apt.clientEmail) {
                    query = query.eq('email', apt.clientEmail)
                } else if (apt.clientPhone) {
                    query = query.eq('phone', apt.clientPhone)
                } else {
                    query = query.eq('name', apt.clientName)
                }

                const { data: existingClients } = await query
                if (existingClients && existingClients.length > 0) {
                    clientId = existingClients[0].id
                } else {
                    // Create new Client record so client appears in Clients list immediately
                    const newClientId = crypto.randomUUID()
                    const nowIso = new Date().toISOString()
                    const clientPayload = {
                        id: newClientId,
                        name: apt.clientName,
                        email: apt.clientEmail || `${apt.clientPhone || Date.now()}@guest.com`,
                        phone: apt.clientPhone || '',
                        gender: 'FEMALE',
                        branchId: branchId,
                        joinedDate: nowIso,
                        totalVisits: 0,
                        tags: ['Online Booking'],
                        createdAt: nowIso,
                        updatedAt: nowIso,
                    }
                    const { data: createdClient, error: clientErr } = await supabase
                        .from('Client')
                        .insert(clientPayload)
                        .select('id')
                        .single()

                    if (!clientErr && createdClient) {
                        clientId = createdClient.id
                    }
                }
            } catch (err) {
                console.error('Failed to sync client record on booking:', err)
            }
        }

        const aptId = crypto.randomUUID()
        const nowIso = new Date().toISOString()
        const payload = {
            id: aptId,
            clientId: clientId,
            clientName: apt.clientName,
            clientEmail: apt.clientEmail,
            clientPhone: apt.clientPhone || null,
            date: apt.date,
            time: apt.time,
            serviceId: apt.serviceId || null,
            serviceName: apt.service,
            staffId: apt.staffId || null,
            staffName: apt.stylist || null,
            status: (apt.status || 'pending').toUpperCase(),
            notes: apt.notes || null,
            branchId: branchId,
            createdAt: nowIso,
            updatedAt: nowIso,
        }

        try {
            // Public bookings run as the anon role, which has INSERT-only access
            // to Appointment (no SELECT, to keep other clients' data private).
            // So we must NOT read the row back — build the result from the
            // payload we already constructed.
            const { error } = await supabase.from('Appointment').insert(payload)

            if (!error) {
                return {
                    ...apt,
                    id: aptId,
                    clientId: clientId || apt.clientId || '',
                    status: apt.status || 'pending',
                    createdAt: nowIso,
                }
            }
        } catch {
            // Fallback
        }

        const newApt: Appointment = { ...apt, id: `apt-${Date.now()}`, createdAt: new Date().toISOString() }
        const current = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]')
        current.unshift(newApt)
        localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(current))
        return newApt
    },

    update: async (id: string, updates: Partial<Appointment>): Promise<Appointment | undefined> => {
        const payload: any = { updatedAt: new Date().toISOString() }
        if (updates.status) payload.status = updates.status.toUpperCase()
        if (updates.date) payload.date = updates.date
        if (updates.time) payload.time = updates.time
        if (updates.stylist !== undefined) payload.staffName = updates.stylist
        if (updates.notes !== undefined) payload.notes = updates.notes

        // Auto-update Client totalVisits and lastVisit when status changes to arrived or completed
        if (updates.status && (updates.status.toLowerCase() === 'arrived' || updates.status.toLowerCase() === 'completed')) {
            try {
                const { data: currentApt } = await supabase.from('Appointment').select('*').eq('id', id).single()
                if (currentApt) {
                    let cId = currentApt.clientId
                    if (!cId && (currentApt.clientEmail || currentApt.clientPhone)) {
                        let query = supabase.from('Client').select('id')
                        if (currentApt.clientEmail && currentApt.clientPhone) {
                            query = query.or(`email.eq.${currentApt.clientEmail},phone.eq.${currentApt.clientPhone}`)
                        } else if (currentApt.clientEmail) {
                            query = query.eq('email', currentApt.clientEmail)
                        } else {
                            query = query.eq('phone', currentApt.clientPhone)
                        }
                        const { data: cls } = await query
                        if (cls && cls.length > 0) cId = cls[0].id
                    }

                    if (cId) {
                        const { data: arrivedApts } = await supabase
                            .from('Appointment')
                            .select('id')
                            .eq('clientId', cId)
                            .in('status', ['ARRIVED', 'COMPLETED', 'arrived', 'completed'])

                        const count = Math.max(1, arrivedApts ? arrivedApts.length : 1)
                        const lastVisitDate = currentApt.date ? String(currentApt.date).split('T')[0] : new Date().toISOString().split('T')[0]

                        await supabase
                            .from('Client')
                            .update({
                                totalVisits: count,
                                lastVisit: lastVisitDate,
                                updatedAt: new Date().toISOString(),
                            })
                            .eq('id', cId)
                    }
                }
            } catch (err) {
                console.error('Failed to sync client visits on status update:', err)
            }
        }

        try {
            const { data, error } = await supabase
                .from('Appointment')
                .update(payload)
                .eq('id', id)
                .select('*')
                .single()

            if (!error && data) {
                return {
                    id: data.id,
                    clientId: data.clientId || '',
                    staffId: data.staffId || '',
                    serviceId: data.serviceId || '',
                    clientName: data.clientName,
                    clientEmail: data.clientEmail,
                    clientPhone: data.clientPhone || undefined,
                    date: String(data.date).split('T')[0],
                    time: data.time,
                    service: data.serviceName,
                    stylist: data.staffName || undefined,
                    status: data.status.toLowerCase() as any,
                    notes: data.notes || undefined,
                    branch: mapBranch(data.branch?.name || data.branchId),
                    createdAt: data.createdAt || new Date().toISOString(),
                }
            }
        } catch {
            // Fallback
        }

        const current: Appointment[] = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]')
        const idx = current.findIndex(a => a.id === id)
        if (idx >= 0) {
            current[idx] = { ...current[idx], ...updates }
            localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(current))
            return current[idx]
        }
        return undefined
    },

    delete: async (id: string): Promise<boolean> => {
        try {
            await supabase.from('Appointment').delete().eq('id', id)
        } catch {}
        const current: Appointment[] = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]')
        const filtered = current.filter(a => a.id !== id)
        localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(filtered))
        return true
    },
}

// ─── Clients ─────────────────────────────────────────────────
export const clientStore = {
    getAll: async (): Promise<Client[]> => {
        try {
            const { data, error } = await supabase
                .from('Client')
                .select('*')
                .order('name', { ascending: true })

            if (error || !data) return []

            return data.map((c: any) => ({
                id: c.id,
                name: c.name,
                email: c.email,
                phone: c.phone,
                gender: c.gender ? c.gender.toLowerCase() as any : 'female',
                branch: mapBranch(c.branch?.name || c.branchId),
                joinedDate: c.joinedDate ? String(c.joinedDate).split('T')[0] : '',
                totalVisits: c.totalVisits || 0,
                lastVisit: c.lastVisit ? String(c.lastVisit).split('T')[0] : undefined,
                preferredStylist: c.preferredStaffId || undefined,
                notes: c.notes || undefined,
                tags: c.tags || [],
            }))
        } catch {
            return []
        }
    },

    create: async (client: Omit<Client, 'id'>): Promise<Client> => {
        const id = crypto.randomUUID()
        const nowIso = new Date().toISOString()
        const payload = {
            id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            gender: (client.gender || 'FEMALE').toUpperCase(),
            branchId: getBranchId(client.branch),
            joinedDate: client.joinedDate || nowIso,
            preferredStaffId: client.preferredStylist || null,
            notes: client.notes || null,
            tags: client.tags || [],
            totalVisits: client.totalVisits || 0,
            createdAt: nowIso,
            updatedAt: nowIso,
        }

        try {
            const { data, error } = await supabase.from('Client').insert(payload).select('*').single()
            if (!error && data) {
                return {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    gender: data.gender.toLowerCase() as any,
                    branch: mapBranch(data.branch?.name || data.branchId),
                    joinedDate: String(data.joinedDate).split('T')[0],
                    totalVisits: data.totalVisits || 0,
                    lastVisit: data.lastVisit ? String(data.lastVisit).split('T')[0] : undefined,
                    preferredStylist: data.preferredStaffId || undefined,
                    notes: data.notes || undefined,
                    tags: data.tags || [],
                }
            }
        } catch {}

        const newClient: Client = { ...client, id: `cli-${Date.now()}` }
        const current = JSON.parse(localStorage.getItem(KEYS.CLIENTS) || '[]')
        current.unshift(newClient)
        localStorage.setItem(KEYS.CLIENTS, JSON.stringify(current))
        return newClient
    },

    update: async (id: string, updates: Partial<Client>): Promise<Client | undefined> => {
        const payload: any = { updatedAt: new Date().toISOString() }
        if (updates.name !== undefined) payload.name = updates.name
        if (updates.email !== undefined) payload.email = updates.email
        if (updates.phone !== undefined) payload.phone = updates.phone
        if (updates.gender !== undefined) payload.gender = updates.gender.toUpperCase()
        if (updates.branch !== undefined) payload.branchId = getBranchId(updates.branch)
        if (updates.joinedDate !== undefined) payload.joinedDate = updates.joinedDate
        if (updates.preferredStylist !== undefined) payload.preferredStaffId = updates.preferredStylist
        if (updates.notes !== undefined) payload.notes = updates.notes
        if (updates.tags !== undefined) payload.tags = updates.tags
        if (updates.totalVisits !== undefined) payload.totalVisits = updates.totalVisits
        if (updates.lastVisit !== undefined) payload.lastVisit = updates.lastVisit

        try {
            const { data, error } = await supabase.from('Client').update(payload).eq('id', id).select('*').single()
            if (!error && data) {
                return {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    gender: data.gender.toLowerCase() as any,
                    branch: mapBranch(data.branch?.name || data.branchId),
                    joinedDate: String(data.joinedDate).split('T')[0],
                    totalVisits: data.totalVisits || 0,
                    lastVisit: data.lastVisit ? String(data.lastVisit).split('T')[0] : undefined,
                    preferredStylist: data.preferredStaffId || undefined,
                    notes: data.notes || undefined,
                    tags: data.tags || [],
                }
            }
        } catch (err) {
            console.error('Failed to update client:', err)
        }

        const current: Client[] = JSON.parse(localStorage.getItem(KEYS.CLIENTS) || '[]')
        const idx = current.findIndex(c => c.id === id)
        if (idx >= 0) {
            current[idx] = { ...current[idx], ...updates }
            localStorage.setItem(KEYS.CLIENTS, JSON.stringify(current))
            return current[idx]
        }
        return undefined
    },

    delete: async (id: string): Promise<boolean> => {
        try { await supabase.from('Client').delete().eq('id', id) } catch {}
        const current: Client[] = JSON.parse(localStorage.getItem(KEYS.CLIENTS) || '[]')
        const filtered = current.filter(c => c.id !== id)
        localStorage.setItem(KEYS.CLIENTS, JSON.stringify(filtered))
        return true
    },
}

// ─── Services ────────────────────────────────────────────────
export const serviceStore = {
    getAll: async (): Promise<ServiceRecord[]> => {
        try {
            const { data, error } = await supabase.from('Service').select('*').order('name', { ascending: true })
            if (!error && data) {
                return data.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    category: s.category ? s.category.toLowerCase() as any : 'hair',
                    duration: s.duration,
                    price: paisaToRupees(s.price),
                    isActive: s.isActive,
                    isKorean: s.isKorean,
                    description: s.description,
                }))
            }
        } catch {}

        return []
    },

    create: async (svc: Omit<ServiceRecord, 'id'>): Promise<ServiceRecord> => {
        const payload = {
            id: crypto.randomUUID(),
            updatedAt: new Date().toISOString(),
            name: svc.name,
            category: svc.category.toUpperCase(),
            duration: svc.duration,
            price: rupeesToPaisa(svc.price),
            isActive: svc.isActive,
            isKorean: svc.isKorean || false,
            description: svc.description,
        }
        try {
            const { data, error } = await supabase.from('Service').insert(payload).select().single()
            if (!error && data) {
                return {
                    id: data.id,
                    name: data.name,
                    category: data.category.toLowerCase() as any,
                    duration: data.duration,
                    price: paisaToRupees(data.price),
                    isActive: data.isActive,
                    isKorean: data.isKorean,
                    description: data.description,
                }
            }
        } catch {}

        const newSvc: ServiceRecord = { ...svc, id: `svc-${Date.now()}` }
        const current = JSON.parse(localStorage.getItem(KEYS.SERVICES) || '[]')
        current.push(newSvc)
        localStorage.setItem(KEYS.SERVICES, JSON.stringify(current))
        return newSvc
    },

    update: async (id: string, updates: Partial<ServiceRecord>): Promise<ServiceRecord | undefined> => {
        const payload: any = { ...updates }
        if (updates.price !== undefined) payload.price = rupeesToPaisa(updates.price)
        if (updates.category) payload.category = updates.category.toUpperCase()

        try {
            const { data, error } = await supabase.from('Service').update(payload).eq('id', id).select().single()
            if (!error && data) {
                return {
                    id: data.id,
                    name: data.name,
                    category: data.category.toLowerCase() as any,
                    duration: data.duration,
                    price: paisaToRupees(data.price),
                    isActive: data.isActive,
                    isKorean: data.isKorean,
                    description: data.description,
                }
            }
        } catch {}

        const current: ServiceRecord[] = JSON.parse(localStorage.getItem(KEYS.SERVICES) || '[]')
        const idx = current.findIndex(s => s.id === id)
        if (idx >= 0) {
            current[idx] = { ...current[idx], ...updates }
            localStorage.setItem(KEYS.SERVICES, JSON.stringify(current))
            return current[idx]
        }
        return undefined
    },

    delete: async (id: string): Promise<boolean> => {
        try { await supabase.from('Service').delete().eq('id', id) } catch {}
        const current: ServiceRecord[] = JSON.parse(localStorage.getItem(KEYS.SERVICES) || '[]')
        const filtered = current.filter(s => s.id !== id)
        localStorage.setItem(KEYS.SERVICES, JSON.stringify(filtered))
        return true
    },
}

// ─── Packages ────────────────────────────────────────────────
function mapPackageRow(p: any): ServicePackage {
    return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        bundlePrice: paisaToRupees(p.bundlePrice),
        badge: p.badge || undefined,
        imageUrl: p.imageUrl || undefined,
        isActive: p.isActive,
        services: (p.PackageService || []).map((ps: any) => ({
            serviceId: ps.serviceId,
            serviceName: ps.Service?.name || '',
            price: paisaToRupees(ps.Service?.price || 0),
            quantity: ps.quantity,
        })),
    }
}

export const packageStore = {
    getAll: async (): Promise<ServicePackage[]> => {
        try {
            const { data, error } = await supabase
                .from('Package')
                .select('*, PackageService(quantity, serviceId, Service(id, name, price))')
                .order('name', { ascending: true })
            if (!error && data) {
                return data.map(mapPackageRow)
            }
        } catch {}
        return []
    },

    create: async (pkg: Omit<ServicePackage, 'id'>): Promise<ServicePackage | undefined> => {
        try {
            const { data: created, error } = await supabase
                .from('Package')
                .insert({
                    id: crypto.randomUUID(),
                    name: pkg.name,
                    description: pkg.description,
                    bundlePrice: rupeesToPaisa(pkg.bundlePrice),
                    badge: pkg.badge || null,
                    imageUrl: pkg.imageUrl || null,
                    isActive: pkg.isActive,
                    updatedAt: new Date().toISOString(),
                })
                .select()
                .single()
            if (error || !created) return undefined

            if (pkg.services.length > 0) {
                await supabase.from('PackageService').insert(
                    pkg.services.map(s => ({
                        id: crypto.randomUUID(),
                        packageId: created.id,
                        serviceId: s.serviceId,
                        quantity: s.quantity,
                    }))
                )
            }
            return packageStore.getById(created.id)
        } catch {}
        return undefined
    },

    getById: async (id: string): Promise<ServicePackage | undefined> => {
        try {
            const { data, error } = await supabase
                .from('Package')
                .select('*, PackageService(quantity, serviceId, Service(id, name, price))')
                .eq('id', id)
                .single()
            if (!error && data) return mapPackageRow(data)
        } catch {}
        return undefined
    },

    update: async (id: string, updates: Partial<ServicePackage>): Promise<ServicePackage | undefined> => {
        try {
            const payload: any = {}
            if (updates.name !== undefined) payload.name = updates.name
            if (updates.description !== undefined) payload.description = updates.description
            if (updates.bundlePrice !== undefined) payload.bundlePrice = rupeesToPaisa(updates.bundlePrice)
            if (updates.badge !== undefined) payload.badge = updates.badge || null
            if (updates.imageUrl !== undefined) payload.imageUrl = updates.imageUrl || null
            if (updates.isActive !== undefined) payload.isActive = updates.isActive
            if (Object.keys(payload).length > 0) {
                payload.updatedAt = new Date().toISOString()
                await supabase.from('Package').update(payload).eq('id', id)
            }

            if (updates.services) {
                await supabase.from('PackageService').delete().eq('packageId', id)
                if (updates.services.length > 0) {
                    await supabase.from('PackageService').insert(
                        updates.services.map(s => ({
                            id: crypto.randomUUID(),
                            packageId: id,
                            serviceId: s.serviceId,
                            quantity: s.quantity,
                        }))
                    )
                }
            }
            return packageStore.getById(id)
        } catch {}
        return undefined
    },

    delete: async (id: string): Promise<boolean> => {
        try {
            await supabase.from('Package').delete().eq('id', id)
            return true
        } catch {}
        return false
    },
}

// ─── Staff ───────────────────────────────────────────────────
export const staffStore = {
    getAll: async (): Promise<StaffMember[]> => {
        const deletedIds = new Set<string>(JSON.parse(localStorage.getItem(KEYS.DELETED_STAFF) || '[]'))
        try {
            const { data, error } = await supabase.from('Staff').select('*').order('name', { ascending: true })
            if (!error && data && data.length > 0) {
                const fetched: StaffMember[] = data
                    .filter((s: any) => !deletedIds.has(s.id))
                    .map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        role: s.role ? s.role.toLowerCase() as any : 'hairstylist',
                        branch: (s.role?.toLowerCase() === 'owner') ? 'All Branches' : mapBranch(s.branch?.name || s.branchId),
                        branchId: s.branchId,
                        phone: s.phone,
                        email: s.email,
                        specialties: s.specialties || [],
                        isActive: s.isActive,
                        joinedDate: s.joinedDate ? String(s.joinedDate).split('T')[0] : '',
                        avatar: s.avatarUrl || undefined,
                        biometricPin: s.biometricPin ?? null,
                    }))

                // If RLS or filtering returned only a branch subset,
                // merge with mockStaff so that all staff across Bengaluru,
                // Kalaburagi, and Belgaum are always available for interchange,
                // BUT NEVER re-introduce staff members that have been deleted!
                const existingIds = new Set(fetched.map(f => f.id))
                const merged = [...fetched]
                for (const m of mockStaff) {
                    if (!existingIds.has(m.id) && !deletedIds.has(m.id)) {
                        merged.push(m.role.toLowerCase() === 'owner' ? { ...m, branch: 'All Branches' } : m)
                    }
                }
                return merged
            }
        } catch {}

        return mockStaff
            .filter(s => !deletedIds.has(s.id))
            .map(s => s.role.toLowerCase() === 'owner' ? { ...s, branch: 'All Branches' } : s)
    },

    create: async (member: Omit<StaffMember, 'id'>): Promise<StaffMember> => {
        const id = crypto.randomUUID()
        const nowIso = new Date().toISOString()
        const payload: any = {
            id,
            name: member.name,
            role: member.role.toUpperCase(),
            branchId: getBranchId(member.branch),
            phone: member.phone || '',
            email: member.email || '',
            specialties: member.specialties || [],
            isActive: member.isActive ?? true,
            joinedDate: member.joinedDate || nowIso,
            createdAt: nowIso,
            updatedAt: nowIso,
        }
        if (member.biometricPin !== undefined) payload.biometricPin = member.biometricPin
        try {
            const { data, error } = await supabase.from('Staff').insert(payload).select('*').single()
            if (!error && data) {
                return {
                    id: data.id,
                    name: data.name,
                    role: data.role.toLowerCase() as any,
                    branch: mapBranch(data.branch?.name || data.branchId),
                    branchId: data.branchId,
                    phone: data.phone,
                    email: data.email,
                    specialties: data.specialties || [],
                    isActive: data.isActive,
                    joinedDate: String(data.joinedDate).split('T')[0],
                    avatar: data.avatarUrl || undefined,
                    biometricPin: data.biometricPin ?? null,
                }
            }
        } catch {}

        const newStaff: StaffMember = { ...member, id: `stf-${Date.now()}` }
        const current = JSON.parse(localStorage.getItem(KEYS.STAFF) || '[]')
        current.push(newStaff)
        localStorage.setItem(KEYS.STAFF, JSON.stringify(current))
        return newStaff
    },

    update: async (id: string, updates: Partial<StaffMember>): Promise<StaffMember | undefined> => {
        const payload: any = { updatedAt: new Date().toISOString() }
        if (updates.name !== undefined) payload.name = updates.name
        if (updates.role !== undefined) payload.role = String(updates.role).toUpperCase()
        if (updates.branch !== undefined) payload.branchId = getBranchId(updates.branch)
        if (updates.phone !== undefined) payload.phone = updates.phone
        if (updates.email !== undefined) payload.email = updates.email
        if (updates.specialties !== undefined) payload.specialties = updates.specialties
        if (updates.isActive !== undefined) payload.isActive = updates.isActive
        if (updates.joinedDate !== undefined) payload.joinedDate = updates.joinedDate
        if (updates.biometricPin !== undefined) payload.biometricPin = updates.biometricPin

        try {
            const { data, error } = await supabase.from('Staff').update(payload).eq('id', id).select('*').single()
            if (!error && data) {
                return {
                    id: data.id,
                    name: data.name,
                    role: data.role.toLowerCase() as any,
                    branch: mapBranch(data.branch?.name || data.branchId),
                    branchId: data.branchId,
                    phone: data.phone,
                    email: data.email,
                    specialties: data.specialties || [],
                    isActive: data.isActive,
                    joinedDate: String(data.joinedDate).split('T')[0],
                    avatar: data.avatarUrl || undefined,
                    biometricPin: data.biometricPin ?? null,
                }
            }
        } catch (err) {
            console.error('Failed to update staff member:', err)
        }

        const current: StaffMember[] = JSON.parse(localStorage.getItem(KEYS.STAFF) || '[]')
        const idx = current.findIndex(s => s.id === id)
        if (idx >= 0) {
            current[idx] = { ...current[idx], ...updates }
            localStorage.setItem(KEYS.STAFF, JSON.stringify(current))
            return current[idx]
        }
        return undefined
    },

    updateBiometricPin: async (staffId: string, pin: number | null): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('Staff')
                .update({ biometricPin: pin || null, updatedAt: new Date().toISOString() })
                .eq('id', staffId)

            if (error) {
                console.error('Error updating biometricPin in Supabase:', error)
                return false
            }

            const current: StaffMember[] = JSON.parse(localStorage.getItem(KEYS.STAFF) || '[]')
            const idx = current.findIndex(s => s.id === staffId)
            if (idx >= 0) {
                current[idx].biometricPin = pin || null
                localStorage.setItem(KEYS.STAFF, JSON.stringify(current))
            }
            return true
        } catch (err) {
            console.error('Failed to update biometric PIN:', err)
            return false
        }
    },

    delete: async (id: string): Promise<boolean> => {
        // 1. Permanently record ID in deleted set so it never resurrects
        try {
            const deletedList: string[] = JSON.parse(localStorage.getItem(KEYS.DELETED_STAFF) || '[]')
            if (!deletedList.includes(id)) {
                deletedList.push(id)
                localStorage.setItem(KEYS.DELETED_STAFF, JSON.stringify(deletedList))
            }
        } catch {}

        // 2. Remove from local staff cache
        try {
            const current: StaffMember[] = JSON.parse(localStorage.getItem(KEYS.STAFF) || '[]')
            const filtered = current.filter(s => s.id !== id)
            localStorage.setItem(KEYS.STAFF, JSON.stringify(filtered))
        } catch {}

        // 3. Clear appointments referencing this staff to prevent FK violation if any
        try {
            await supabase.from('Appointment').update({ staffId: null, stylist: null }).eq('staffId', id)
        } catch {}

        // 4. Delete from Supabase Staff table
        try {
            const { error } = await supabase.from('Staff').delete().eq('id', id)
            if (error) {
                console.warn('Supabase Staff delete notice:', error.message)
            }
            return true
        } catch (err) {
            console.error('Failed to delete staff member from Supabase:', err)
            return false
        }
    },
}

// ─── Settings ────────────────────────────────────────────────
export const settingsStore = {
    get: async (): Promise<SalonSettings> => {
        try {
            const { data: s } = await supabase.from('SalonSettings').select('*').eq('id', 'singleton').single()
            const { data: branches } = await supabase.from('Branch').select('*').order('name', { ascending: true })

            if (s) {
                return {
                    name: s.name,
                    email: s.email,
                    phone: s.phone,
                    hours: s.hours,
                    branches: (branches || []).map((b: any) => ({
                        name: mapBranch(b.name),
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
                }
            }
        } catch {}

        const raw = localStorage.getItem(KEYS.SETTINGS)
        let loaded: SalonSettings = raw ? JSON.parse(raw) : { ...defaultSettings }

        // Always ensure all 6 corporate branches are present and enriched
        const existingNames = new Set((loaded.branches || []).map(b => b.name))
        let needsSave = false
        const branches = [...(loaded.branches || [])]

        for (const def of defaultSettings.branches) {
            if (!existingNames.has(def.name)) {
                branches.push({ ...def })
                needsSave = true
            }
        }

        if (needsSave || !loaded.branches) {
            loaded.branches = branches
            localStorage.setItem(KEYS.SETTINGS, JSON.stringify(loaded))
        }

        return loaded
    },

    update: async (updates: Partial<SalonSettings>): Promise<SalonSettings> => {
        const current = await settingsStore.get()
        const merged: SalonSettings = {
            ...current,
            ...updates,
            branches: updates.branches || current.branches,
            socialLinks: {
                ...current.socialLinks,
                ...(updates.socialLinks || {})
            }
        }
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged))

        try {
            await supabase.from('SalonSettings').update(updates).eq('id', 'singleton')
        } catch {}
        return merged
    },
}

// ─── Inventory ───────────────────────────────────────────────
export const inventoryStore = {
    getAll: async (): Promise<InventoryItem[]> => {
        try {
            const { data, error } = await supabase.from('InventoryItem').select('*').order('name', { ascending: true })
            if (!error && data && data.length > 0) {
                return data.map((i: any) => ({
                    id: i.id,
                    name: i.name,
                    brand: i.brand,
                    category: i.category ? i.category.toLowerCase() as any : 'hair-care',
                    sku: i.sku,
                    currentStock: i.currentStock,
                    minStock: i.minStock,
                    costPrice: paisaToRupees(i.costPrice),
                    retailPrice: paisaToRupees(i.retailPrice),
                    branch: mapBranch(i.branch?.name || i.branchId),
                    lastRestocked: i.lastRestocked ? String(i.lastRestocked).split('T')[0] : undefined,
                    isActive: i.isActive,
                }))
            }
        } catch {}

        const raw = localStorage.getItem(KEYS.INVENTORY)
        return raw ? JSON.parse(raw) : mockInventory
    },

    getById: async (id: string): Promise<InventoryItem | undefined> => {
        const all = await inventoryStore.getAll()
        return all.find(i => i.id === id)
    },

    create: async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
        const payload = {
            id: crypto.randomUUID(),
            updatedAt: new Date().toISOString(),
            name: item.name,
            brand: item.brand,
            category: item.category.toUpperCase().replace('-', ''),
            sku: item.sku,
            currentStock: item.currentStock,
            minStock: item.minStock,
            costPrice: rupeesToPaisa(item.costPrice),
            retailPrice: rupeesToPaisa(item.retailPrice),
            branchId: getBranchId(item.branch),
            isActive: item.isActive,
        }
        try {
            const { data, error } = await supabase.from('InventoryItem').insert(payload).select('*').single()
            if (!error && data) {
                return {
                    id: data.id,
                    name: data.name,
                    brand: data.brand,
                    category: data.category.toLowerCase() as any,
                    sku: data.sku,
                    currentStock: data.currentStock,
                    minStock: data.minStock,
                    costPrice: paisaToRupees(data.costPrice),
                    retailPrice: paisaToRupees(data.retailPrice),
                    branch: mapBranch(data.branch?.name || data.branchId),
                    lastRestocked: data.lastRestocked ? String(data.lastRestocked).split('T')[0] : undefined,
                    isActive: data.isActive,
                }
            }
        } catch {}

        const newItem: InventoryItem = { ...item, id: `itm-${Date.now()}` }
        const current = JSON.parse(localStorage.getItem(KEYS.INVENTORY) || '[]')
        current.push(newItem)
        localStorage.setItem(KEYS.INVENTORY, JSON.stringify(current))
        return newItem
    },

    update: async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> => {
        try {
            const { data, error } = await supabase.from('InventoryItem').update(updates).eq('id', id).select('*').single()
            if (!error && data) {
                return {
                    id: data.id,
                    name: data.name,
                    brand: data.brand,
                    category: data.category.toLowerCase() as any,
                    sku: data.sku,
                    currentStock: data.currentStock,
                    minStock: data.minStock,
                    costPrice: paisaToRupees(data.costPrice),
                    retailPrice: paisaToRupees(data.retailPrice),
                    branch: mapBranch(data.branch?.name || data.branchId),
                    lastRestocked: data.lastRestocked ? String(data.lastRestocked).split('T')[0] : undefined,
                    isActive: data.isActive,
                }
            }
        } catch {}

        const current: InventoryItem[] = JSON.parse(localStorage.getItem(KEYS.INVENTORY) || '[]')
        const idx = current.findIndex(i => i.id === id)
        if (idx >= 0) {
            current[idx] = { ...current[idx], ...updates }
            localStorage.setItem(KEYS.INVENTORY, JSON.stringify(current))
            return current[idx]
        }
        return undefined
    },

    delete: async (id: string): Promise<boolean> => {
        try { await supabase.from('InventoryItem').delete().eq('id', id) } catch {}
        const current: InventoryItem[] = JSON.parse(localStorage.getItem(KEYS.INVENTORY) || '[]')
        const filtered = current.filter(i => i.id !== id)
        localStorage.setItem(KEYS.INVENTORY, JSON.stringify(filtered))
        return true
    },

    getLowStock: async (): Promise<InventoryItem[]> => {
        const all = await inventoryStore.getAll()
        return all.filter(i => i.isActive && i.currentStock <= i.minStock)
    },
}

// ─── Service Visits (History) ────────────────────────────────
export const visitStore = {
    getAll: async (): Promise<ServiceVisit[]> => {
        try {
            const { data, error } = await supabase.from('ServiceVisit').select('*').order('date', { ascending: false })
            if (!error && data) {
                return data.map((v: any) => ({
                    id: v.id,
                    clientId: v.clientId,
                    clientName: v.clientName,
                    date: String(v.date).split('T')[0],
                    services: v.services || [],
                    stylist: v.staffName || '',
                    branch: mapBranch(v.branchId),
                    subtotal: paisaToRupees(v.subtotal),
                    discount: paisaToRupees(v.discount),
                    tax: paisaToRupees(v.tax),
                    total: paisaToRupees(v.total),
                    paymentMethod: v.paymentMethod?.toLowerCase() as any || 'other',
                    notes: v.notes || undefined,
                    rating: v.rating || undefined,
                    invoiceId: v.invoiceId || undefined,
                }))
            }
        } catch {}

        return []
    },

    getByClientId: async (clientId: string): Promise<ServiceVisit[]> => {
        // 1. Fetch direct visits
        const allVisits = await visitStore.getAll()
        const directVisits = allVisits.filter(v => v.clientId === clientId)

        // 2. Fetch client details to check matching emails/phones
        const clients = await clientStore.getAll()
        const client = clients.find(c => c.id === clientId)
        if (!client) return directVisits

        // 3. Synthesize visits from invoices
        const invoices = await invoiceStore.getByClientId(clientId)
        const invoiceVisits: ServiceVisit[] = invoices.map(inv => ({
            id: `inv-visit-${inv.id}`,
            clientId: client.id,
            clientName: client.name,
            date: inv.date,
            services: inv.items.map(item => ({
                name: item.service,
                price: item.total,
            })),
            stylist: inv.stylist || '—',
            branch: inv.branch,
            subtotal: inv.subtotal,
            discount: inv.discountAmount,
            tax: inv.taxAmount,
            total: inv.total,
            paymentMethod: inv.paymentMethod || 'other',
            notes: inv.notes,
            invoiceId: inv.id,
        }))

        // Deduplicate
        const directInvoiceIds = new Set(directVisits.map(v => v.invoiceId).filter(Boolean))
        const filteredInvoiceVisits = invoiceVisits.filter(v => !directInvoiceIds.has(v.invoiceId))

        return [...directVisits, ...filteredInvoiceVisits].sort((a, b) => b.date.localeCompare(a.date))
    },

    create: async (visit: Omit<ServiceVisit, 'id'>): Promise<ServiceVisit> => {
        const nowIso = new Date().toISOString()
        const payload = {
            id: crypto.randomUUID(),
            clientId: visit.clientId || null,
            clientName: visit.clientName,
            date: visit.date || nowIso.split('T')[0],
            staffName: visit.stylist || null,
            branchId: getBranchId(visit.branch),
            subtotal: rupeesToPaisa(visit.subtotal),
            discount: rupeesToPaisa(visit.discount),
            tax: rupeesToPaisa(visit.tax),
            total: rupeesToPaisa(visit.total),
            paymentMethod: (visit.paymentMethod || 'OTHER').toUpperCase(),
            notes: visit.notes || null,
            rating: visit.rating || null,
            invoiceId: visit.invoiceId || null,
            services: visit.services,
            createdAt: nowIso,
        }

        try {
            await supabase.from('ServiceVisit').insert(payload)
        } catch (err) {
            console.error('Failed to create ServiceVisit in Supabase:', err)
        }

        return { ...visit, id: `vis-${Date.now()}` }
    },
}

// ─── Invoices ────────────────────────────────────────────────
export const invoiceStore = {
    getAll: async (): Promise<Invoice[]> => {
        try {
            const { data, error } = await supabase.from('Invoice').select('*, items:InvoiceItem(*)').order('createdAt', { ascending: false })
            if (!error && data) {
                return data.map((inv: any) => ({
                    id: inv.id,
                    invoiceNumber: inv.invoiceNumber,
                    clientId: inv.clientId || '',
                    clientName: inv.clientName,
                    clientEmail: inv.clientEmail,
                    clientPhone: inv.clientPhone || undefined,
                    date: String(inv.date).split('T')[0],
                    items: (inv.items || []).map((it: any) => ({
                        service: it.serviceName,
                        description: it.description || undefined,
                        quantity: it.quantity,
                        unitPrice: paisaToRupees(it.unitPrice),
                        total: paisaToRupees(it.total),
                        productId: it.productId || undefined,
                    })),
                    subtotal: paisaToRupees(inv.subtotal),
                    discountPercent: Number(inv.discountPercent || 0),
                    discountAmount: paisaToRupees(inv.discountAmount || 0),
                    taxPercent: Number(inv.taxPercent || 18),
                    taxAmount: paisaToRupees(inv.taxAmount || 0),
                    total: paisaToRupees(inv.total),
                    amountPaid: paisaToRupees(inv.amountPaid || 0),
                    status: inv.status ? inv.status.toLowerCase() as any : 'draft',
                    paymentMethod: inv.paymentMethod ? inv.paymentMethod.toLowerCase() as any : undefined,
                    branch: mapBranch(inv.branch?.name || inv.branchId),
                    stylist: inv.staffName || undefined,
                    notes: inv.notes || undefined,
                    createdAt: inv.createdAt || new Date().toISOString(),
                    appointmentId: inv.appointmentId || undefined,
                }))
            }
        } catch {}

        return []
    },

    getById: async (id: string): Promise<Invoice | undefined> => {
        const all = await invoiceStore.getAll()
        return all.find(i => i.id === id)
    },

    getByClientId: async (clientId: string): Promise<Invoice[]> => {
        const all = await invoiceStore.getAll()
        return all.filter(i => i.clientId === clientId)
    },

    getNextInvoiceNumber: async (): Promise<string> => {
        const all = await invoiceStore.getAll()
        const max = all.reduce((m, inv) => {
            const num = parseInt(inv.invoiceNumber.replace('CM-INV-', ''))
            return !isNaN(num) && num > m ? num : m
        }, 0)
        return `CM-INV-${String(max + 1).padStart(4, '0')}`
    },

    create: async (inv: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> => {
        const id = crypto.randomUUID()
        const nowIso = new Date().toISOString()
        const payload = {
            id,
            updatedAt: nowIso,
            invoiceNumber: inv.invoiceNumber,
            clientId: inv.clientId || null,
            clientName: inv.clientName,
            clientEmail: inv.clientEmail,
            clientPhone: inv.clientPhone || null,
            date: inv.date,
            subtotal: rupeesToPaisa(inv.subtotal),
            discountPercent: inv.discountPercent || 0,
            discountAmount: rupeesToPaisa(inv.discountAmount || 0),
            taxPercent: inv.taxPercent || 18,
            taxAmount: rupeesToPaisa(inv.taxAmount || 0),
            total: rupeesToPaisa(inv.total),
            amountPaid: rupeesToPaisa(inv.amountPaid || 0),
            status: (inv.status || 'draft').toUpperCase(),
            paymentMethod: inv.paymentMethod ? inv.paymentMethod.toUpperCase() : null,
            branchId: getBranchId(inv.branch),
            staffName: inv.stylist || null,
            appointmentId: inv.appointmentId || null,
            notes: inv.notes || null,
        }

        try {
            const { data: invoice, error } = await supabase.from('Invoice').insert(payload).select('*').single()
            if (!error && invoice) {
                if (inv.items && inv.items.length > 0) {
                    const itemsPayload = inv.items.map(it => ({
                        id: crypto.randomUUID(),
                        invoiceId: invoice.id,
                        serviceName: it.service,
                        description: it.description || null,
                        quantity: it.quantity,
                        unitPrice: rupeesToPaisa(it.unitPrice),
                        total: rupeesToPaisa(it.total),
                        productId: it.productId || null,
                    }))
                    await supabase.from('InvoiceItem').insert(itemsPayload)
                }

                // Update linked appointment to completed if paid
                if (inv.appointmentId && (inv.status === 'paid' || inv.status === ('PAID' as any))) {
                    await supabase.from('Appointment').update({ status: 'COMPLETED' }).eq('id', inv.appointmentId)
                }

                return { ...inv, id: invoice.id, createdAt: invoice.createdAt || new Date().toISOString() }
            }
        } catch {}

        const newInv: Invoice = { ...inv, id: `inv-${Date.now()}`, createdAt: new Date().toISOString() }
        const current = JSON.parse(localStorage.getItem(KEYS.INVOICES) || '[]')
        current.unshift(newInv)
        localStorage.setItem(KEYS.INVOICES, JSON.stringify(current))
        return newInv
    },

    update: async (id: string, updates: Partial<Invoice>): Promise<Invoice | undefined> => {
        try {
            const payload: any = { ...updates }
            if (updates.status) payload.status = updates.status.toUpperCase()
            await supabase.from('Invoice').update(payload).eq('id', id)
        } catch {}

        const current: Invoice[] = JSON.parse(localStorage.getItem(KEYS.INVOICES) || '[]')
        const idx = current.findIndex(i => i.id === id)
        if (idx >= 0) {
            current[idx] = { ...current[idx], ...updates }
            localStorage.setItem(KEYS.INVOICES, JSON.stringify(current))
            return current[idx]
        }
        return undefined
    },

    delete: async (id: string): Promise<boolean> => {
        try { await supabase.from('Invoice').delete().eq('id', id) } catch {}
        const current: Invoice[] = JSON.parse(localStorage.getItem(KEYS.INVOICES) || '[]')
        const filtered = current.filter(i => i.id !== id)
        localStorage.setItem(KEYS.INVOICES, JSON.stringify(filtered))
        return true
    },
}

// ─── Staff Attendance ────────────────────────────────────────
// dbStatus/fromDbStatus: the DB stores upper-snake-case ('HALF_DAY'),
// matching the uppercase convention every other status/role column in this
// schema uses; the app type keeps the friendlier hyphenated 'half-day'.
function dbStatus(status: AttendanceRecord['status']): string {
    return status.toUpperCase().replace('-', '_')
}
function fromDbStatus(status: string): AttendanceRecord['status'] {
    return status.toLowerCase().replace('_', '-') as AttendanceRecord['status']
}

export const attendanceStore = {
    getAll: async (): Promise<AttendanceRecord[]> => {
        const localList: AttendanceRecord[] = JSON.parse(localStorage.getItem(KEYS.ATTENDANCE) || '[]')
        const localMap = new Map<string, AttendanceRecord>(localList.map(a => [`${a.staffId}_${a.date}`, a]))

        try {
            const { data, error } = await supabase.from('Attendance').select('*').order('date', { ascending: false })
            if (!error && data) {
                const merged: AttendanceRecord[] = data.map((a: any) => {
                    const key = `${a.staffId}_${a.date}`
                    const local = localMap.get(key)
                    return {
                        id: a.id || local?.id || `att-${a.staffId}-${a.date}`,
                        staffId: a.staffId,
                        staffName: a.staffName,
                        branch: mapBranch(a.branchId),
                        date: a.date,
                        status: fromDbStatus(a.status),
                        punchIn: a.punchIn || local?.punchIn || undefined,
                        punchOut: a.punchOut || local?.punchOut || undefined,
                        notes: a.notes || local?.notes || undefined,
                        updatedBy: a.updatedBy || local?.updatedBy || undefined,
                    }
                })
                // Merge any purely local records that might not be in Supabase yet
                for (const loc of localList) {
                    if (!data.some((d: any) => d.staffId === loc.staffId && d.date === loc.date)) {
                        merged.push(loc)
                    }
                }
                localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(merged))
                return merged
            }
        } catch {}
        return localList
    },

    getByDate: async (date: string): Promise<AttendanceRecord[]> => {
        const all = await attendanceStore.getAll()
        return all.filter(a => a.date === date)
    },

    getByStaffId: async (staffId: string): Promise<AttendanceRecord[]> => {
        const all = await attendanceStore.getAll()
        return all.filter(a => a.staffId === staffId)
    },

    mark: async (
        staffId: string,
        staffName: string,
        branch: string,
        date: string,
        status: AttendanceRecord['status'],
        options?: { punchIn?: string; punchOut?: string; notes?: string; updatedBy?: string }
    ): Promise<AttendanceRecord> => {
        const payloadWithPunch: any = {
            staffId,
            staffName,
            branchId: getBranchId(branch),
            date,
            status: dbStatus(status),
            updatedAt: new Date().toISOString()
        }
        if (options?.punchIn !== undefined) payloadWithPunch.punchIn = options.punchIn
        if (options?.punchOut !== undefined) payloadWithPunch.punchOut = options.punchOut
        if (options?.notes !== undefined) payloadWithPunch.notes = options.notes
        if (options?.updatedBy !== undefined) payloadWithPunch.updatedBy = options.updatedBy

        try {
            // Attempt with full punch payload
            const res = await supabase
                .from('Attendance')
                .upsert(payloadWithPunch, { onConflict: 'staffId,date' })
                .select()
                .maybeSingle()

            let data = res.data
            let error = res.error

            // If RLS blocked the returning SELECT representation (cross-branch policy),
            // attempt plain upsert without .select()
            if (error && (error.code === '42501' || error.message?.includes('policy'))) {
                const plainRes = await supabase
                    .from('Attendance')
                    .upsert(payloadWithPunch, { onConflict: 'staffId,date' })
                if (!plainRes.error) {
                    error = null
                }
            }

            if (!error) {
                const record: AttendanceRecord = {
                    id: data?.id || `att-${staffId}-${date}`,
                    staffId: data?.staffId || staffId,
                    staffName: data?.staffName || staffName,
                    branch: data?.branchId ? mapBranch(data.branchId) : branch,
                    date: data?.date || date,
                    status: data?.status ? fromDbStatus(data.status) : status,
                    punchIn: data?.punchIn || options?.punchIn,
                    punchOut: data?.punchOut || options?.punchOut,
                    notes: data?.notes || options?.notes,
                    updatedBy: data?.updatedBy || options?.updatedBy,
                }
                // Sync to local
                const all: AttendanceRecord[] = JSON.parse(localStorage.getItem(KEYS.ATTENDANCE) || '[]')
                const idx = all.findIndex(a => a.staffId === staffId && a.date === date)
                if (idx >= 0) all[idx] = record
                else all.push(record)
                localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(all))
                return record
            } else if (error && (error.message.includes('column') || error.code === '42703')) {
                // Column does not exist in Supabase yet, retry without new columns
                const fallbackPayload = {
                    staffId,
                    staffName,
                    branchId: getBranchId(branch),
                    date,
                    status: dbStatus(status),
                    updatedAt: new Date().toISOString()
                }
                const { data: fbData } = await supabase
                    .from('Attendance')
                    .upsert(fallbackPayload, { onConflict: 'staffId,date' })
                    .select()
                    .single()
                
                const recId = fbData?.id || `att-${Date.now()}`
                const record: AttendanceRecord = {
                    id: recId,
                    staffId,
                    staffName,
                    branch,
                    date,
                    status,
                    punchIn: options?.punchIn,
                    punchOut: options?.punchOut,
                    notes: options?.notes,
                    updatedBy: options?.updatedBy,
                }
                const all: AttendanceRecord[] = JSON.parse(localStorage.getItem(KEYS.ATTENDANCE) || '[]')
                const idx = all.findIndex(a => a.staffId === staffId && a.date === date)
                if (idx >= 0) all[idx] = record
                else all.push(record)
                localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(all))
                return record
            }
        } catch {}

        // Fallback: local-only
        const all: AttendanceRecord[] = JSON.parse(localStorage.getItem(KEYS.ATTENDANCE) || '[]')
        const idx = all.findIndex(a => a.staffId === staffId && a.date === date)
        if (idx >= 0) {
            all[idx] = {
                ...all[idx],
                status,
                punchIn: options?.punchIn !== undefined ? options.punchIn : all[idx].punchIn,
                punchOut: options?.punchOut !== undefined ? options.punchOut : all[idx].punchOut,
                notes: options?.notes !== undefined ? options.notes : all[idx].notes,
                updatedBy: options?.updatedBy || all[idx].updatedBy,
            }
            localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(all))
            return all[idx]
        }
        const record: AttendanceRecord = {
            id: `att-${Date.now()}`,
            staffId,
            staffName,
            branch,
            date,
            status,
            punchIn: options?.punchIn,
            punchOut: options?.punchOut,
            notes: options?.notes,
            updatedBy: options?.updatedBy,
        }
        all.push(record)
        localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(all))
        return record
    },

    deleteRecord: async (staffId: string, date: string): Promise<boolean> => {
        try {
            await supabase.from('Attendance').delete().eq('staffId', staffId).eq('date', date)
        } catch {}
        const all: AttendanceRecord[] = JSON.parse(localStorage.getItem(KEYS.ATTENDANCE) || '[]')
        const filtered = all.filter(a => !(a.staffId === staffId && a.date === date))
        localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(filtered))
        return true
    },
}

// ─── Expenses (Monthly P&L) ───────────────────────────────────
// Fixed line items the P&L can't derive from existing data (commissions,
// labor, rent, salaries, etc) — one editable amount per (month, branch,
// category). Branch-scoped (not company-wide) so each branch's own Net
// Profit can be computed for the CEO Share breakdown.
function dbExpenseCategory(category: ExpenseCategory): string {
    return category.toUpperCase()
}
function fromDbExpenseCategory(category: string): ExpenseCategory {
    return category.toLowerCase() as ExpenseCategory
}

export const expenseStore = {
    getForMonth: async (month: string, branch: string): Promise<Expense[]> => {
        try {
            const { data, error } = await supabase.from('Expense').select('*').eq('month', month).eq('branchId', getBranchId(branch))
            if (!error && data) {
                return data.map((e: any) => ({
                    id: e.id,
                    month: e.month,
                    branch: mapBranch(e.branchId),
                    category: fromDbExpenseCategory(e.category),
                    amount: paisaToRupees(e.amount),
                    notes: e.notes || undefined,
                }))
            }
        } catch {}

        const raw = localStorage.getItem(`cm_admin_expenses_${month}_${branch}`)
        return raw ? JSON.parse(raw) : []
    },

    save: async (month: string, branch: string, category: ExpenseCategory, amount: number, notes?: string): Promise<Expense> => {
        const payload = {
            month,
            branchId: getBranchId(branch),
            category: dbExpenseCategory(category),
            amount: rupeesToPaisa(amount),
            notes: notes || null,
            updatedAt: new Date().toISOString(),
        }
        try {
            const { data, error } = await supabase.from('Expense').upsert(payload, { onConflict: 'month,branchId,category' }).select('*').single()
            if (!error && data) {
                return {
                    id: data.id,
                    month: data.month,
                    branch: mapBranch(data.branchId),
                    category: fromDbExpenseCategory(data.category),
                    amount: paisaToRupees(data.amount),
                    notes: data.notes || undefined,
                }
            }
        } catch {}

        const key = `cm_admin_expenses_${month}_${branch}`
        const current: Expense[] = JSON.parse(localStorage.getItem(key) || '[]')
        const idx = current.findIndex(e => e.category === category)
        const record: Expense = { id: idx >= 0 ? current[idx].id : `exp-${Date.now()}`, month, branch, category, amount, notes }
        if (idx >= 0) current[idx] = record
        else current.push(record)
        localStorage.setItem(key, JSON.stringify(current))
        return record
    },
}

export function resetStore() {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key))
    initializeStore()
}
