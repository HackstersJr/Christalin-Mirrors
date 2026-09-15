import { supabase } from '../../lib/supabase'
import type { Invoice } from './types'

export interface ManualDayRecord {
    clientCount: number
    retail: number
    service: number
    notes?: string
}

export type ManualSalesData = Record<string, Record<string, ManualDayRecord>>
// schema: { [branch: string]: { [isoDate: string]: ManualDayRecord } }

export type SyncState = 'synced' | 'saving' | 'offline' | 'error'

const STORAGE_KEY = 'cm_manual_daily_sales_v1'
const DEFAULT_BRANCHES = ['Bengaluru', 'Kalaburagi', 'Belgaum']

// Debounce timer map for cell inputs
const pendingDebounce: Record<string, ReturnType<typeof setTimeout>> = {}

export const manualSalesStore = {
    getAll(): ManualSalesData {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            return raw ? JSON.parse(raw) : {}
        } catch (e) {
            console.error('Failed to load manual sales data from storage', e)
            return {}
        }
    },

    saveAll(data: ManualSalesData) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        } catch (e) {
            console.error('Failed to save manual sales data to storage', e)
        }
    },

    getRecord(branch: string, isoDate: string): ManualDayRecord {
        const data = this.getAll()
        if (branch === 'all') {
            let clientCount = 0
            let retail = 0
            let service = 0
            let notes = ''

            let hasBranchEntry = false
            for (const b of DEFAULT_BRANCHES) {
                const rec = data[b]?.[isoDate]
                if (rec) {
                    hasBranchEntry = true
                    clientCount += rec.clientCount || 0
                    retail += rec.retail || 0
                    service += rec.service || 0
                    if (rec.notes) notes = notes ? `${notes}; ${b}: ${rec.notes}` : `${b}: ${rec.notes}`
                }
            }

            if (!hasBranchEntry && data['all']?.[isoDate]) {
                const direct = data['all'][isoDate]
                return {
                    clientCount: direct.clientCount || 0,
                    retail: direct.retail || 0,
                    service: direct.service || 0,
                    notes: direct.notes || '',
                }
            }

            return { clientCount, retail, service, notes }
        }

        const rec = data[branch]?.[isoDate]
        return {
            clientCount: rec?.clientCount || 0,
            retail: rec?.retail || 0,
            service: rec?.service || 0,
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
                    localData[b][d] = {
                        clientCount: Number(row.clientCount) || 0,
                        retail: Number(row.retail) || 0,
                        service: Number(row.service) || 0,
                        notes: row.notes || '',
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
        const prev = data[branch][isoDate] || { clientCount: 0, retail: 0, service: 0, notes: '' }
        
        const merged: ManualDayRecord = {
            clientCount: update.clientCount !== undefined ? Math.max(0, update.clientCount) : prev.clientCount,
            retail: update.retail !== undefined ? Math.max(0, update.retail) : prev.retail,
            service: update.service !== undefined ? Math.max(0, update.service) : prev.service,
            notes: update.notes !== undefined ? update.notes : prev.notes,
        }

        data[branch][isoDate] = merged
        this.saveAll(data)

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
                const { error } = await supabase
                    .from('ManualDailySales')
                    .upsert({
                        branch,
                        date: isoDate,
                        clientCount: merged.clientCount,
                        retail: merged.retail,
                        service: merged.service,
                        notes: merged.notes || '',
                        updatedAt: new Date().toISOString()
                    }, { onConflict: 'branch,date' })

                if (error) {
                    console.warn('Supabase upsert note:', error.message)
                    onSyncStatus?.('offline')
                } else {
                    onSyncStatus?.('synced')
                }
            } catch {
                onSyncStatus?.('offline')
            }
        }, 600)
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
        const upsertBatch: Array<{
            branch: string
            date: string
            clientCount: number
            retail: number
            service: number
            notes: string
            updatedAt: string
        }> = []

        for (const b of targetBranches) {
            if (!data[b]) data[b] = {}
            const branchInvoices = invoices.filter(i => i.date.startsWith(monthKey) && i.status === 'paid' && i.branch === b)
            
            // Group by date
            const dateMap: Record<string, { clientIds: Set<string>; retail: number; service: number }> = {}
            for (const inv of branchInvoices) {
                if (!dateMap[inv.date]) {
                    dateMap[inv.date] = { clientIds: new Set(), retail: 0, service: 0 }
                }
                dateMap[inv.date].clientIds.add(inv.clientId || inv.clientEmail || inv.clientName)
                for (const item of inv.items || []) {
                    if (item.productId) {
                        dateMap[inv.date].retail += item.total || 0
                    } else {
                        dateMap[inv.date].service += item.total || 0
                    }
                }
            }

            for (const [isoDate, stats] of Object.entries(dateMap)) {
                const rec: ManualDayRecord = {
                    clientCount: stats.clientIds.size,
                    retail: Math.round(stats.retail),
                    service: Math.round(stats.service),
                    notes: `Prefilled from ${branchInvoices.filter(i => i.date === isoDate).length} system invoices`,
                }
                data[b][isoDate] = rec
                populatedDays++

                upsertBatch.push({
                    branch: b,
                    date: isoDate,
                    clientCount: rec.clientCount,
                    retail: rec.retail,
                    service: rec.service,
                    notes: rec.notes || '',
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
