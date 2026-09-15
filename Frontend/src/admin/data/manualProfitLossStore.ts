import { supabase } from '../../lib/supabase'
import { invoiceStore, inventoryStore, serviceStore, expenseStore } from './store'
import type { Invoice, InventoryItem, ServiceRecord, ExpenseCategory } from './types'

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
    
    // Operating Expenses
    salaries_wages: number
    benefits_insurance: number
    payroll_tax: number
    general_admin: number
    utilities: number
    repairs_maintenance: number
    rent_lease: number
    depreciation: number
    debts_loans: number

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
    }
}

export interface ComputedPLMetrics {
    revenue: number
    cogsManualTotal: number
    totalCogs: number
    grossProfit: number
    totalExpenses: number
    netProfit: number
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
    return { revenue, cogsManualTotal, totalCogs, grossProfit, totalExpenses, netProfit }
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
     * Compute and extract figures directly from invoices and inventory
     * for a given month and branch.
     */
    async extractFromInvoices(monthKey: string, branch: string): Promise<{
        data: ManualBranchPL
        invoiceCount: number
    }> {
        const [invoices, inventory, services, expenses] = await Promise.all([
            invoiceStore.getAll(),
            inventoryStore.getAll(),
            serviceStore.getAll(),
            expenseStore.getForMonth(monthKey, branch),
        ])

        const invFiltered = invoices.filter(
            i => i.date.startsWith(monthKey) &&
                 i.status === 'paid' &&
                 (branch === 'all' || i.branch === branch)
        )

        const inventoryById = new Map(inventory.map(i => [i.id, i]))
        const serviceCategoryByName = new Map(services.map(s => [s.name, s.category]))

        let hairServices = 0
        let otherServices = 0
        let retailSales = 0
        let productCost = 0

        invFiltered.forEach(inv => {
            (inv.items || []).forEach(item => {
                if (item.productId) {
                    retailSales += item.total
                    const invItem = inventoryById.get(item.productId)
                    if (invItem) {
                        productCost += invItem.costPrice * item.quantity
                    } else {
                        // Estimated default 25% cost price if not mapped
                        productCost += Math.round(item.total * 0.25)
                    }
                } else {
                    const cat = serviceCategoryByName.get(item.service)
                    if (cat === 'hair') {
                        hairServices += item.total
                    } else {
                        otherServices += item.total
                    }
                }
            })
        })

        // Merge existing expenses from expenseStore
        const expMap: Record<string, number> = {}
        expenses.forEach(e => {
            expMap[e.category] = e.amount
        })

        const currentSaved = this.getBranchData(monthKey, branch)

        const result: ManualBranchPL = {
            hairServices,
            otherServices,
            retailSales,
            productCost,
            service_commissions: expMap['service_commissions'] ?? currentSaved.service_commissions ?? Math.round(hairServices * 0.1),
            retail_commissions: expMap['retail_commissions'] ?? currentSaved.retail_commissions ?? Math.round(retailSales * 0.05),
            direct_professional_labor: expMap['direct_professional_labor'] ?? currentSaved.direct_professional_labor ?? 0,
            transaction_fees: expMap['transaction_fees'] ?? currentSaved.transaction_fees ?? Math.round((hairServices + otherServices + retailSales) * 0.015),
            salaries_wages: expMap['salaries_wages'] ?? currentSaved.salaries_wages ?? 65000,
            benefits_insurance: expMap['benefits_insurance'] ?? currentSaved.benefits_insurance ?? 5000,
            payroll_tax: expMap['payroll_tax'] ?? currentSaved.payroll_tax ?? 3500,
            general_admin: expMap['general_admin'] ?? currentSaved.general_admin ?? 4000,
            utilities: expMap['utilities'] ?? currentSaved.utilities ?? 8500,
            repairs_maintenance: expMap['repairs_maintenance'] ?? currentSaved.repairs_maintenance ?? 3000,
            rent_lease: expMap['rent_lease'] ?? currentSaved.rent_lease ?? (branch === 'Bengaluru' ? 45000 : 30000),
            depreciation: expMap['depreciation'] ?? currentSaved.depreciation ?? 4000,
            debts_loans: expMap['debts_loans'] ?? currentSaved.debts_loans ?? 0,
            notes: currentSaved.notes || `Generated from ${invFiltered.length} paid invoices.`,
        }

        return { data: result, invoiceCount: invFiltered.length }
    },

    clearBranch(monthKey: string, branch: string) {
        const all = this.getAll()
        if (all[monthKey]?.[branch]) {
            delete all[monthKey][branch]
            this.saveAll(all)
        }
    },
}
