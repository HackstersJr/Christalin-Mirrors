import type { Invoice } from './types'

export interface ManualDayRecord {
    clientCount: number
    retail: number
    service: number
    notes?: string
}

export type ManualSalesData = Record<string, Record<string, ManualDayRecord>>
// schema: { [branch: string]: { [isoDate: string]: ManualDayRecord } }

const STORAGE_KEY = 'cm_manual_daily_sales_v1'
const DEFAULT_BRANCHES = ['Bengaluru', 'Kalaburagi', 'Belgaum']

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
            // Aggregate from all individual branches
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

            // Fallback: if no branch entries found, check if an explicit entry was made under 'all'
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

    setRecord(branch: string, isoDate: string, update: Partial<ManualDayRecord>) {
        const data = this.getAll()
        if (!data[branch]) data[branch] = {}
        const prev = data[branch][isoDate] || { clientCount: 0, retail: 0, service: 0, notes: '' }
        data[branch][isoDate] = {
            clientCount: update.clientCount !== undefined ? Math.max(0, update.clientCount) : prev.clientCount,
            retail: update.retail !== undefined ? Math.max(0, update.retail) : prev.retail,
            service: update.service !== undefined ? Math.max(0, update.service) : prev.service,
            notes: update.notes !== undefined ? update.notes : prev.notes,
        }
        this.saveAll(data)
    },

    setBatch(branch: string, entries: Record<string, Partial<ManualDayRecord>>) {
        const data = this.getAll()
        if (!data[branch]) data[branch] = {}
        for (const [isoDate, update] of Object.entries(entries)) {
            const prev = data[branch][isoDate] || { clientCount: 0, retail: 0, service: 0, notes: '' }
            data[branch][isoDate] = {
                clientCount: update.clientCount !== undefined ? Math.max(0, update.clientCount) : prev.clientCount,
                retail: update.retail !== undefined ? Math.max(0, update.retail) : prev.retail,
                service: update.service !== undefined ? Math.max(0, update.service) : prev.service,
                notes: update.notes !== undefined ? update.notes : prev.notes,
            }
        }
        this.saveAll(data)
    },

    clearMonth(branch: string, monthKey: string) {
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
    },

    prefillFromInvoices(invoices: Invoice[], monthKey: string, branch: string): number {
        const data = this.getAll()
        const targetBranches = branch === 'all' ? DEFAULT_BRANCHES : [branch]
        let populatedDays = 0

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
                data[b][isoDate] = {
                    clientCount: stats.clientIds.size,
                    retail: Math.round(stats.retail),
                    service: Math.round(stats.service),
                    notes: `Prefilled from ${branchInvoices.filter(i => i.date === isoDate).length} system invoices`,
                }
                populatedDays++
            }
        }

        this.saveAll(data)
        return populatedDays
    }
}
