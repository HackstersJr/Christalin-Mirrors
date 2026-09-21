import { supabase } from '../../lib/supabase'
import { manualSalesStore } from './manualSalesStore'

export interface CapExItem {
    id: string
    date: string
    title: string
    category: string
    amount: number
    notes?: string
}

export interface OpExItem {
    id: string
    date: string
    title: string
    category: string
    amount: number
    notes?: string
}

export interface ManualBranchPL {
    // Revenue
    hairServices: number
    otherServices: number
    retailSales: number
    
    // COGS
    productCost: number
    service_commissions: number
    retail_commissions: number
    direct_professional_labor: number
    transaction_fees: number
    
    // Operating Expenses (OpEx)
    salaries_wages: number
    benefits_insurance: number
    payroll_tax: number
    general_admin: number
    utilities: number
    repairs_maintenance: number
    rent_lease: number
    depreciation: number
    debts_loans: number

    // CapEx (Capital Expenditures: New equipment, renovations, chairs, AC units)
    capex?: number
    capex_items?: CapExItem[]
    opex_items?: OpExItem[]

    notes?: string
    updatedAt?: string
}

export type ManualProfitLossData = Record<string, Record<string, ManualBranchPL>>
// Format: { [monthKey: string]: { [branch: string]: ManualBranchPL } }

export const COGS_KEYS: { key: keyof ManualBranchPL; label: string }[] = [
    { key: 'service_commissions', label: 'Service Commissions' },
    { key: 'retail_commissions', label: 'Retail Commissions' },
    { key: 'direct_professional_labor', label: 'Direct Professional Labor' },
    { key: 'transaction_fees', label: 'Transaction Fees' },
]

export const OPEX_KEYS: { key: keyof ManualBranchPL; label: string }[] = [
    { key: 'salaries_wages', label: 'Salaries and Wages' },
    { key: 'benefits_insurance', label: 'Benefits and Insurance' },
    { key: 'payroll_tax', label: 'Payroll Tax' },
    { key: 'general_admin', label: 'General and Administrative' },
    { key: 'utilities', label: 'Utilities' },
    { key: 'repairs_maintenance', label: 'Repairs and Maintenance' },
    { key: 'rent_lease', label: 'Rent/Lease' },
    { key: 'depreciation', label: 'Depreciation' },
    { key: 'debts_loans', label: 'Debts and Loans' },
]

export function zeroBranchPL(): ManualBranchPL {
    return {
        hairServices: 0,
        otherServices: 0,
        retailSales: 0,
        productCost: 0,
        service_commissions: 0,
        retail_commissions: 0,
        direct_professional_labor: 0,
        transaction_fees: 0,
        salaries_wages: 0,
        benefits_insurance: 0,
        payroll_tax: 0,
        general_admin: 0,
        utilities: 0,
        repairs_maintenance: 0,
        rent_lease: 0,
        depreciation: 0,
        debts_loans: 0,
        capex: 0,
        capex_items: [],
        opex_items: [],
    }
}

export interface ComputedPLMetrics {
    revenue: number
    cogsManualTotal: number
    totalCogs: number
    grossProfit: number
    totalExpenses: number
    netProfit: number
    capex: number
    netCashFlow: number
}

export function computePLMetrics(pl: ManualBranchPL): ComputedPLMetrics {
    const revenue = (pl.hairServices || 0) + (pl.otherServices || 0) + (pl.retailSales || 0)
    const cogsManualTotal =
        (pl.service_commissions || 0) +
        (pl.retail_commissions || 0) +
        (pl.direct_professional_labor || 0) +
        (pl.transaction_fees || 0)
    const totalCogs = (pl.productCost || 0) + cogsManualTotal
    const grossProfit = revenue - totalCogs

    const totalExpenses =
        (pl.salaries_wages || 0) +
        (pl.benefits_insurance || 0) +
        (pl.payroll_tax || 0) +
        (pl.general_admin || 0) +
        (pl.utilities || 0) +
        (pl.repairs_maintenance || 0) +
        (pl.rent_lease || 0) +
        (pl.depreciation || 0) +
        (pl.debts_loans || 0)

    const netProfit = grossProfit - totalExpenses
    const capex = pl.capex || 0
    const netCashFlow = netProfit - capex
    return { revenue, cogsManualTotal, totalCogs, grossProfit, totalExpenses, netProfit, capex, netCashFlow }
}

const STORAGE_KEY = 'cm_manual_profit_loss_v1'

export const manualProfitLossStore = {
    getAll(): ManualProfitLossData {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            return raw ? JSON.parse(raw) : {}
        } catch (e) {
            console.error('Failed to load manual P&L from storage', e)
            return {}
        }
    },

    saveAll(data: ManualProfitLossData) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        } catch (e) {
            console.error('Failed to save manual P&L to storage', e)
        }
    },

    getBranchData(monthKey: string, branch: string): ManualBranchPL {
        const all = this.getAll()
        return all[monthKey]?.[branch] || zeroBranchPL()
    },

    setBranchData(monthKey: string, branch: string, data: Partial<ManualBranchPL>) {
        const all = this.getAll()
        if (!all[monthKey]) all[monthKey] = {}
        const current = all[monthKey][branch] || zeroBranchPL()
        const updated: ManualBranchPL = {
            ...current,
            ...data,
            updatedAt: new Date().toISOString(),
        }
        all[monthKey][branch] = updated
        this.saveAll(all)

        // Asynchronously persist to Supabase if table exists
        this.syncToOnline(monthKey, branch, updated).catch(() => {})
        return updated
    },

    async fetchMonth(monthKey: string): Promise<ManualProfitLossData> {
        const local = this.getAll()
        try {
            const { data: rows, error } = await supabase
                .from('ManualProfitLoss')
                .select('*')
                .eq('month', monthKey)

            if (!error && rows && rows.length > 0) {
                if (!local[monthKey]) local[monthKey] = {}
                for (const row of rows) {
                    local[monthKey][row.branch] = {
                        hairServices: row.hairServices || 0,
                        otherServices: row.otherServices || 0,
                        retailSales: row.retailSales || 0,
                        productCost: row.productCost || 0,
                        service_commissions: row.service_commissions || 0,
                        retail_commissions: row.retail_commissions || 0,
                        direct_professional_labor: row.direct_professional_labor || 0,
                        transaction_fees: row.transaction_fees || 0,
                        salaries_wages: row.salaries_wages || 0,
                        benefits_insurance: row.benefits_insurance || 0,
                        payroll_tax: row.payroll_tax || 0,
                        general_admin: row.general_admin || 0,
                        utilities: row.utilities || 0,
                        repairs_maintenance: row.repairs_maintenance || 0,
                        rent_lease: row.rent_lease || 0,
                        depreciation: row.depreciation || 0,
                        debts_loans: row.debts_loans || 0,
                        notes: row.notes || undefined,
                        updatedAt: row.updatedAt,
                    }
                }
                this.saveAll(local)
            }
        } catch {
            // Local storage fallback
        }
        return local
    },

    async syncToOnline(monthKey: string, branch: string, pl: ManualBranchPL) {
        try {
            await supabase.from('ManualProfitLoss').upsert({
                month: monthKey,
                branch,
                hairServices: pl.hairServices,
                otherServices: pl.otherServices,
                retailSales: pl.retailSales,
                productCost: pl.productCost,
                service_commissions: pl.service_commissions,
                retail_commissions: pl.retail_commissions,
                direct_professional_labor: pl.direct_professional_labor,
                transaction_fees: pl.transaction_fees,
                salaries_wages: pl.salaries_wages,
                benefits_insurance: pl.benefits_insurance,
                payroll_tax: pl.payroll_tax,
                general_admin: pl.general_admin,
                utilities: pl.utilities,
                repairs_maintenance: pl.repairs_maintenance,
                rent_lease: pl.rent_lease,
                depreciation: pl.depreciation,
                debts_loans: pl.debts_loans,
                notes: pl.notes || null,
                updatedAt: new Date().toISOString(),
            }, { onConflict: 'month,branch' })
        } catch {
            // Silent fallback to local cache
        }
    },

    /**
     * Compute and extract figures directly from Manual Daily Sales
     * for a given month and branch.
     */
    async extractFromManualDailySales(monthKey: string, branch: string): Promise<{
        data: ManualBranchPL
        daysWithSales: number
        totalService: number
        totalRetail: number
        totalSales: number
    }> {
        // Ensure latest data is loaded from Supabase & local storage
        await manualSalesStore.fetchMonth(monthKey)
        const allSales = manualSalesStore.getAll()

        const targetBranches = branch === 'all' ? ['Bengaluru', 'Kalaburagi', 'Belgaum'] : [branch]
        let totalService = 0
        let totalRetail = 0
        let daysWithSales = 0

        for (const b of targetBranches) {
            const branchMap = allSales[b] || {}
            for (const [date, rec] of Object.entries(branchMap)) {
                if (date.startsWith(monthKey)) {
                    const s = Number(rec.service) || 0
                    const r = Number(rec.retail) || 0
                    totalService += s
                    totalRetail += r
                    if (s > 0 || r > 0) {
                        daysWithSales++
                    }
                }
            }
        }

        const totalSales = totalService + totalRetail
        const currentSaved = this.getBranchData(monthKey, branch)

        const result: ManualBranchPL = {
            hairServices: totalService,
            otherServices: currentSaved.otherServices || 0,
            retailSales: totalRetail,
            productCost: currentSaved.productCost || Math.round(totalRetail * 0.25),
            service_commissions: currentSaved.service_commissions || Math.round(totalService * 0.1),
            retail_commissions: currentSaved.retail_commissions || Math.round(totalRetail * 0.05),
            direct_professional_labor: currentSaved.direct_professional_labor || 0,
            transaction_fees: currentSaved.transaction_fees || Math.round(totalSales * 0.015),
            salaries_wages: currentSaved.salaries_wages || 65000,
            benefits_insurance: currentSaved.benefits_insurance || 5000,
            payroll_tax: currentSaved.payroll_tax || 3500,
            general_admin: currentSaved.general_admin || 4000,
            utilities: currentSaved.utilities || 8500,
            repairs_maintenance: currentSaved.repairs_maintenance || 3000,
            rent_lease: currentSaved.rent_lease || (branch === 'Bengaluru' ? 45000 : 30000),
            depreciation: currentSaved.depreciation || 4000,
            debts_loans: currentSaved.debts_loans || 0,
            notes: currentSaved.notes || (totalSales > 0 ? `Synced from Manual Daily Sales (${daysWithSales} active days, ₹${totalSales.toLocaleString('en-IN')}).` : 'Synced from Manual Daily Sales.'),
        }

        return { data: result, daysWithSales, totalService, totalRetail, totalSales }
    },

    /**
     * Backward-compatible alias for extractFromManualDailySales
     */
    async extractFromInvoices(monthKey: string, branch: string): Promise<{
        data: ManualBranchPL
        invoiceCount: number
    }> {
        const res = await this.extractFromManualDailySales(monthKey, branch)
        return { data: res.data, invoiceCount: res.daysWithSales }
    },

    clearBranch(monthKey: string, branch: string) {
        const all = this.getAll()
        if (all[monthKey]?.[branch]) {
            delete all[monthKey][branch]
            this.saveAll(all)
        }
    },

    /**
     * Apply an imported Excel summary into the local store and sync.
     * Updates OpEx categories and sets CapEx for each affected month & branch.
     */
    applyExcelImportSummary(summary: {
        byMonthAndBranch: Record<string, Record<string, {
            opexTotal: number
            capexTotal: number
            opexByCategory: Partial<Record<keyof ManualBranchPL, number>>
            capexItems: CapExItem[]
            opexItems: OpExItem[]
        }>>
    }, mode: 'merge' | 'replace' = 'merge') {
        const all = this.getAll()
        let count = 0

        for (const [mKey, branchMap] of Object.entries(summary.byMonthAndBranch)) {
            if (!all[mKey]) all[mKey] = {}

            for (const [branch, data] of Object.entries(branchMap)) {
                const current = all[mKey][branch] || zeroBranchPL()

                const updatedOpEx: Partial<ManualBranchPL> = {}
                for (const [catKey, amt] of Object.entries(data.opexByCategory)) {
                    const k = catKey as keyof ManualBranchPL
                    if (mode === 'merge') {
                        const prevVal = Number(current[k]) || 0
                        updatedOpEx[k] = (prevVal + amt) as any
                    } else {
                        updatedOpEx[k] = amt as any
                    }
                }

                const existingCapexItems = mode === 'merge' ? (current.capex_items || []) : []
                const mergedCapexItems = [...existingCapexItems, ...data.capexItems]
                const totalCapex = mergedCapexItems.reduce((sum, item) => sum + (item.amount || 0), 0)

                const existingOpexItems = mode === 'merge' ? (current.opex_items || []) : []
                const mergedOpexItems = [...existingOpexItems, ...data.opexItems]

                const updatedRecord: ManualBranchPL = {
                    ...current,
                    ...updatedOpEx,
                    capex: totalCapex,
                    capex_items: mergedCapexItems,
                    opex_items: mergedOpexItems,
                    updatedAt: new Date().toISOString(),
                }

                all[mKey][branch] = updatedRecord
                this.syncToOnline(mKey, branch, updatedRecord).catch(() => {})
                count++
            }
        }

        this.saveAll(all)
        return count
    },

    addCapExItem(monthKey: string, branch: string, item: Omit<CapExItem, 'id'>) {
        const cur = this.getBranchData(monthKey, branch)
        const newItem: CapExItem = {
            id: `capex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            ...item,
        }
        const items = [...(cur.capex_items || []), newItem]
        const totalCapex = items.reduce((s, i) => s + (i.amount || 0), 0)
        return this.setBranchData(monthKey, branch, {
            capex: totalCapex,
            capex_items: items,
        })
    },

    removeCapExItem(monthKey: string, branch: string, itemId: string) {
        const cur = this.getBranchData(monthKey, branch)
        const items = (cur.capex_items || []).filter(i => i.id !== itemId)
        const totalCapex = items.reduce((s, i) => s + (i.amount || 0), 0)
        return this.setBranchData(monthKey, branch, {
            capex: totalCapex,
            capex_items: items,
        })
    },
}
