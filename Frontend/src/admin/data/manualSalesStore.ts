import { supabase } from '../../lib/supabase'
import type { Invoice } from './types'

export interface ManualDayRecord {
    clientCount: number
    upi?: number
    cash?: number
    retail: number
    service: number
    total?: number
    notes?: string
}

export type ManualSalesData = Record<string, Record<string, ManualDayRecord>>
// schema: { [branch: string]: { [isoDate: string]: ManualDayRecord } }

export type SyncState = 'synced' | 'saving' | 'offline' | 'error'

const STORAGE_KEY = 'cm_manual_daily_sales_v1'
export const OPERATIONAL_BRANCHES = ['Bengaluru', 'Kalaburagi', 'Belgaum']
export const UPCOMING_BRANCHES = ['Upcoming Branch 1 (Yelahanka)', 'Upcoming Branch 2 (Hassan)']
export const DEFAULT_BRANCHES = [...OPERATIONAL_BRANCHES, ...UPCOMING_BRANCHES]

// Metadata encoding helpers to preserve UPI, Cash, Retail, and Total even if DB columns aren't migrated yet
export function encodeSalesNotes(cleanNotes: string, upi: number, cash: number, retail: number, total: number): string {
    const base = (cleanNotes || '').replace(/\s*\[CM_SALES:[^\]]*\]/g, '').trim()
    const meta = `[CM_SALES:upi=${Math.round(upi)}:cash=${Math.round(cash)}:retail=${Math.round(retail)}:total=${Math.round(total)}]`
    return base ? `${base} ${meta}` : meta
}

export function decodeSalesNotes(rawNotes: string): { cleanNotes: string; upi?: number; cash?: number; retail?: number; total?: number } {
    if (!rawNotes) return { cleanNotes: '' }
    const match = rawNotes.match(/\[CM_SALES:upi=([0-9.]+):cash=([0-9.]+):retail=([0-9.]+):total=([0-9.]+)\]/)
    const cleanNotes = rawNotes.replace(/\s*\[CM_SALES:[^\]]*\]/g, '').trim()
    if (!match) return { cleanNotes }
    return {
        cleanNotes,
        upi: parseFloat(match[1]),
        cash: parseFloat(match[2]),
        retail: parseFloat(match[3]),
        total: parseFloat(match[4]),
    }
}

// Debounce timer map for cell inputs
const pendingDebounce: Record<string, ReturnType<typeof setTimeout>> = {}

export const manualSalesStore = {
    getAll(): ManualSalesData {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            const parsed = raw ? JSON.parse(raw) : {}
            if (parsed['Manea']) {
                delete parsed['Manea']
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
                } catch {
                    // ignore
                }
            }
            return parsed
        } catch (e) {
            console.error('Failed to load manual sales data from storage', e)
            return {}
        }
    },

    saveAll(data: ManualSalesData) {
        try {
            if (data['Manea']) {
                delete data['Manea']
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        } catch (e) {
            console.error('Failed to save manual sales data to storage', e)
        }
    },

    getRecord(branch: string, isoDate: string): ManualDayRecord {
        const data = this.getAll()
        if (branch === 'all' || branch === 'all_operational' || branch === 'consolidated_all') {
            let clientCount = 0
            let upi = 0
            let cash = 0
            let retail = 0
            let service = 0
            let total = 0
            let notes = ''

            const targetList = branch === 'all_operational' ? OPERATIONAL_BRANCHES : DEFAULT_BRANCHES
            let hasBranchEntry = false
            for (const b of targetList) {
                const rec = data[b]?.[isoDate]
                if (rec) {
                    hasBranchEntry = true
                    const rUpi = rec.upi || 0
                    const rCash = rec.cash || 0
                    const rRetail = rec.retail || 0
                    const rService = (rUpi + rCash > 0) ? (rUpi + rCash) : (rec.service || 0)
                    const rTotal = (rec.total !== undefined && rec.total > 0)
                        ? rec.total
                        : (rUpi + rCash + rRetail > 0 ? (rUpi + rCash + rRetail) : (rService + rRetail))

                    clientCount += rec.clientCount || 0
                    upi += rUpi
                    cash += rCash
                    retail += rRetail
                    service += rService
                    total += rTotal
                    if (rec.notes) notes = notes ? `${notes}; ${b}: ${rec.notes}` : `${b}: ${rec.notes}`
                }
            }

            if (!hasBranchEntry && data[branch]?.[isoDate]) {
                const direct = data[branch][isoDate]
                const dUpi = direct.upi || 0
                const dCash = direct.cash || 0
                const dRetail = direct.retail || 0
                const dService = (dUpi + dCash > 0) ? (dUpi + dCash) : (direct.service || 0)
                const dTotal = (direct.total !== undefined && direct.total > 0)
                    ? direct.total
                    : (dUpi + dCash + dRetail > 0 ? (dUpi + dCash + dRetail) : (dService + dRetail))

                return {
                    clientCount: direct.clientCount || 0,
                    upi: dUpi,
                    cash: dCash,
                    retail: dRetail,
                    service: dService,
                    total: dTotal,
                    notes: direct.notes || '',
                }
            }

            return {
                clientCount,
                upi,
                cash,
                retail,
                service,
                total: total > 0 ? total : (upi + cash + retail),
                notes
            }
        }

        const rec = data[branch]?.[isoDate]
        const upi = rec?.upi || 0
        const cash = rec?.cash || 0
        const retail = rec?.retail || 0
        const service = (upi + cash > 0) ? (upi + cash) : (rec?.service || 0)
        const total = (rec?.total !== undefined && rec.total > 0)
            ? rec.total
            : (upi + cash + retail > 0 ? (upi + cash + retail) : (service + retail))

        return {
            clientCount: rec?.clientCount || 0,
            upi,
            cash,
            retail,
            service,
            total,
            notes: rec?.notes || '',
        }
    },

    /**
     * Fetch month data from Supabase and merge with local storage cache
     */
    async fetchMonth(monthKey: string): Promise<{ data: ManualSalesData; fromOnline: boolean }> {
        const localData = this.getAll()
        try {
            const { data: rows, error } = await supabase
                .from('ManualDailySales')
                .select('*')
                .like('date', `${monthKey}%`)

            if (error) {
                // Table might not be created yet or network issue
                return { data: localData, fromOnline: false }
            }

            if (rows && rows.length > 0) {
                for (const row of rows) {
                    const b = row.branch || 'Bengaluru'
                    const d = row.date
                    if (!localData[b]) localData[b] = {}

                    const decoded = decodeSalesNotes(row.notes || '')
                    const rUpi = (row.upi !== undefined && row.upi !== null) ? Number(row.upi) : (decoded.upi ?? (localData[b][d]?.upi ?? 0))
                    const rCash = (row.cash !== undefined && row.cash !== null) ? Number(row.cash) : (decoded.cash ?? (localData[b][d]?.cash ?? 0))
                    const rRetail = (row.retail !== undefined && row.retail !== null) ? Number(row.retail) : (decoded.retail ?? (localData[b][d]?.retail ?? 0))
                    const rService = (row.service !== undefined && row.service !== null) ? Number(row.service) : (rUpi + rCash)
                    const rTotal = (row.total !== undefined && row.total !== null)
                        ? Number(row.total)
                        : (decoded.total ?? (rUpi + rCash + rRetail))

                    localData[b][d] = {
                        clientCount: Number(row.clientCount) || 0,
                        upi: rUpi,
                        cash: rCash,
                        retail: rRetail,
                        service: rService,
                        total: rTotal,
                        notes: decoded.cleanNotes,
                    }
                }
                this.saveAll(localData)
                return { data: localData, fromOnline: true }
            }

            return { data: localData, fromOnline: true }
        } catch {
            return { data: localData, fromOnline: false }
        }
    },

    /**
     * Save a single day's record to local storage and sync to Supabase online
     */
    setRecord(
        branch: string,
        isoDate: string,
        update: Partial<ManualDayRecord>,
        onSyncStatus?: (status: SyncState) => void
    ) {
        const data = this.getAll()
        if (!data[branch]) data[branch] = {}
        const prev = data[branch][isoDate] || { clientCount: 0, upi: 0, cash: 0, retail: 0, service: 0, total: 0, notes: '' }
        
        const nextUpi = update.upi !== undefined ? Math.max(0, update.upi) : (prev.upi || 0)
        const nextCash = update.cash !== undefined ? Math.max(0, update.cash) : (prev.cash || 0)
        const nextRetail = update.retail !== undefined ? Math.max(0, update.retail) : (prev.retail || 0)
        
        // Service is sum of UPI + Cash for services, or passed explicitly
        const nextService = update.service !== undefined
            ? Math.max(0, update.service)
            : (nextUpi + nextCash > 0 ? (nextUpi + nextCash) : prev.service)

        // Total = UPI + Cash + Retail
        const nextTotal = update.total !== undefined
            ? Math.max(0, update.total)
            : (nextUpi + nextCash + nextRetail)

        const merged: ManualDayRecord = {
            clientCount: update.clientCount !== undefined ? Math.max(0, update.clientCount) : prev.clientCount,
            upi: nextUpi,
            cash: nextCash,
            retail: nextRetail,
            service: nextService,
            total: nextTotal,
            notes: update.notes !== undefined ? update.notes : prev.notes,
        }

        data[branch][isoDate] = merged
        this.saveAll(data)

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cm_sales_record_updated'))
        }

        // Inform UI it's saving online
        onSyncStatus?.('saving')

        // Debounce cloud upsert to avoid spamming network while typing numbers
        const debounceKey = `${branch}_${isoDate}`
        if (pendingDebounce[debounceKey]) {
            clearTimeout(pendingDebounce[debounceKey])
        }

        pendingDebounce[debounceKey] = setTimeout(async () => {
            delete pendingDebounce[debounceKey]
            try {
                // Try saving with upi, cash, retail, service, total, and metadata in notes
                const total = (merged.upi || 0) + (merged.cash || 0) + (merged.retail || 0)
                const payload: any = {
                    branch,
                    date: isoDate,
                    clientCount: merged.clientCount,
                    retail: merged.retail,
                    service: (merged.upi || 0) + (merged.cash || 0) > 0 ? ((merged.upi || 0) + (merged.cash || 0)) : merged.service,
                    upi: merged.upi || 0,
                    cash: merged.cash || 0,
                    total: total,
                    notes: encodeSalesNotes(merged.notes || '', merged.upi || 0, merged.cash || 0, merged.retail || 0, total),
                    updatedAt: new Date().toISOString()
                }

                const { error } = await supabase
                    .from('ManualDailySales')
                    .upsert(payload, { onConflict: 'branch,date' })

                if (error && (error.code === '42703' || error.message.includes('column'))) {
                    // Fallback without upi/cash/total columns if DB table hasn't added columns yet
                    // Notes safely contains the encoded backup metadata
                    delete payload.upi
                    delete payload.cash
                    delete payload.total
                    await supabase
                        .from('ManualDailySales')
                        .upsert(payload, { onConflict: 'branch,date' })
                }

                if (error && !error.message.includes('column')) {
                    console.warn('Supabase upsert note:', error.message)
                    onSyncStatus?.('offline')
                } else {
                    onSyncStatus?.('synced')
                }
            } catch {
                onSyncStatus?.('offline')
            }
        }, 500)
    },

    /**
     * Clear month records locally and from Supabase
     */
    async clearMonth(branch: string, monthKey: string): Promise<boolean> {
        const data = this.getAll()
        const targetBranches = branch === 'all' ? [...DEFAULT_BRANCHES, 'all'] : [branch]
        for (const b of targetBranches) {
            if (data[b]) {
                for (const date of Object.keys(data[b])) {
                    if (date.startsWith(monthKey)) {
                        delete data[b][date]
                    }
                }
            }
        }
        this.saveAll(data)

        try {
            let query = supabase.from('ManualDailySales').delete().like('date', `${monthKey}%`)
            if (branch !== 'all') {
                query = query.eq('branch', branch)
            }
            await query
            return true
        } catch {
            return false
        }
    },

    /**
     * Prefill from invoiceStore and sync batch to Supabase
     */
    async prefillFromInvoices(invoices: Invoice[], monthKey: string, branch: string): Promise<number> {
        const data = this.getAll()
        const targetBranches = branch === 'all' ? DEFAULT_BRANCHES : [branch]
        let populatedDays = 0
        const upsertBatch: Array<any> = []

        for (const b of targetBranches) {
            if (!data[b]) data[b] = {}
            const branchInvoices = invoices.filter(i => i.date.startsWith(monthKey) && i.status === 'paid' && i.branch === b)
            
            // Group by date
            const dateMap: Record<string, { clientIds: Set<string>; retail: number; service: number; upi: number; cash: number }> = {}
            for (const inv of branchInvoices) {
                if (!dateMap[inv.date]) {
                    dateMap[inv.date] = { clientIds: new Set(), retail: 0, service: 0, upi: 0, cash: 0 }
                }
                dateMap[inv.date].clientIds.add(inv.clientId || inv.clientEmail || inv.clientName)
                for (const item of inv.items || []) {
                    if (item.productId) {
                        dateMap[inv.date].retail += item.total || 0
                    } else {
                        dateMap[inv.date].service += item.total || 0
                    }
                }
                if (inv.paymentMethod === 'upi') {
                    dateMap[inv.date].upi += inv.total || 0
                } else if (inv.paymentMethod === 'cash') {
                    dateMap[inv.date].cash += inv.total || 0
                } else if (inv.paymentMethod === 'split' && inv.splitPayment) {
                    dateMap[inv.date].upi += inv.splitPayment.upi || 0
                    dateMap[inv.date].cash += inv.splitPayment.cash || 0
                } else {
                    dateMap[inv.date].upi += inv.total || 0
                }
            }

            for (const [isoDate, stats] of Object.entries(dateMap)) {
                const u = Math.round(stats.upi)
                const c = Math.round(stats.cash)
                const r = Math.round(stats.retail)
                const s = Math.round(stats.service) || (u + c)
                const tot = u + c + r

                const cleanNote = `Prefilled from ${branchInvoices.filter(i => i.date === isoDate).length} system invoices`
                const rec: ManualDayRecord = {
                    clientCount: stats.clientIds.size,
                    upi: u,
                    cash: c,
                    retail: r,
                    service: s,
                    total: tot,
                    notes: cleanNote,
                }
                data[b][isoDate] = rec
                populatedDays++

                upsertBatch.push({
                    branch: b,
                    date: isoDate,
                    clientCount: rec.clientCount,
                    retail: rec.retail,
                    service: rec.service,
                    upi: u,
                    cash: c,
                    total: tot,
                    notes: encodeSalesNotes(cleanNote, u, c, r, tot),
                    updatedAt: new Date().toISOString()
                })
            }
        }

        this.saveAll(data)

        // Sync batch to Supabase
        if (upsertBatch.length > 0) {
            try {
                await supabase
                    .from('ManualDailySales')
                    .upsert(upsertBatch, { onConflict: 'branch,date' })
            } catch (err) {
                console.warn('Batch Supabase sync note:', err)
            }
        }

        return populatedDays
    }
}
