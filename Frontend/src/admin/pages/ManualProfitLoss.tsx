import { useState, useEffect, useId } from 'react'
import {
    Printer,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Check,
    RefreshCw,
    RotateCcw,
    FileSpreadsheet,
    DollarSign,
    TrendingUp,
    Briefcase,
    Upload,
    Download,
    Layers,
    Trash2,
    Sparkles,
    ArrowLeftRight,
    Plus,
    Building2,
    PieChart,
    Hammer,
    ShieldCheck,
    Calendar,
    ArrowUpRight,
    Tag,
} from 'lucide-react'
import cmLogo from '../../assets/cm-logo-white.png'
import {
    branches as branchList,
    OPERATIONAL_BRANCH_NAMES,
    UPCOMING_BRANCH_NAMES,
    ALL_SALON_BRANCH_NAMES,
} from '../../data/branches'
import {
    manualProfitLossStore,
    computePLMetrics,
    zeroBranchPL,
    COGS_KEYS,
    OPEX_KEYS,
    type ManualBranchPL,
    type CapExItem,
    type OpExItem,
} from '../data/manualProfitLossStore'
import { manualSalesStore } from '../data/manualSalesStore'
import ImportExcelExpensesModal from '../components/ImportExcelExpensesModal'
import GoogleSheetsSyncModal from '../components/GoogleSheetsSyncModal'
import AddExpenseItemModal from '../components/AddExpenseItemModal'
import { googleSheetsSyncService } from '../data/googleSheetsSyncService'
import { type ImportExpenseSummary } from '../data/excelExpenseParser'
import './Reports.css'
import './ProfitLoss.css'
import './ManualProfitLoss.css'

const branchNames = ALL_SALON_BRANCH_NAMES

function money(n: number): string {
    return `₹${Math.round(n).toLocaleString('en-IN')}`
}

const OWNERSHIP: Record<string, { label: string; pct: number; isCeo?: boolean }[]> = {
    Bengaluru: [
        { label: 'CEO (Sole Owner)', pct: 100, isCeo: true },
    ],
    Kalaburagi: [
        { label: 'Partner 1', pct: 32 },
        { label: 'Partner 2', pct: 32 },
        { label: 'CEO', pct: 36, isCeo: true },
    ],
    Belgaum: [
        { label: 'Partner', pct: 30 },
        { label: 'CEO', pct: 70, isCeo: true },
    ],
    Manea: [
        { label: 'CEO (Sole Owner — 100% Under CEO)', pct: 100, isCeo: true },
    ],
    'Upcoming Branch 1 (Yelahanka)': [
        { label: 'CEO (Sole Owner — 100% Pre-Launch)', pct: 100, isCeo: true },
    ],
    'Upcoming Branch 2 (Hassan)': [
        { label: 'CEO (Sole Owner — 100% Pre-Launch)', pct: 100, isCeo: true },
    ],
}

function ceoPctOf(branch: string): number {
    return OWNERSHIP[branch]?.find(s => s.isCeo)?.pct ?? 100
}

const UPCOMING_METADATA: Record<string, { targetLaunch: string; location: string; fitoutPct: number; budget: number }> = {
    'Upcoming Branch 1 (Yelahanka)': {
        targetLaunch: 'November 2026',
        location: 'Yelahanka Phase 1, Bengaluru',
        fitoutPct: 65,
        budget: 1500000,
    },
    'Upcoming Branch 2 (Hassan)': {
        targetLaunch: 'January 2027',
        location: 'BM Road, Hassan, Karnataka',
        fitoutPct: 40,
        budget: 1200000,
    },
}

function todayIso(): string {
    return new Date().toISOString().slice(0, 10)
}

function monthKeyOf(iso: string): string {
    return iso.slice(0, 7)
}

function shiftMonth(monthKey: string, delta: number): string {
    const [y, m] = monthKey.split('-').map(Number)
    const d = new Date(Date.UTC(y, m - 1 + delta, 1))
    return d.toISOString().slice(0, 7)
}

function monthLabel(monthKey: string): string {
    const [y, m] = monthKey.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    })
}

export default function ManualProfitLoss() {
    const [monthKey, setMonthKey] = useState(monthKeyOf(todayIso()))
    const [selectedBranch, setSelectedBranch] = useState<string>('all_operational')
    const [activeTab, setActiveTab] = useState<'statement' | 'dedicated_hub'>('statement')
    const [isEditMode, setIsEditMode] = useState<boolean>(true)
    const [loading, setLoading] = useState<boolean>(true)
    const [syncing, setSyncing] = useState<boolean>(false)
    const [statusMsg, setStatusMsg] = useState<string | null>(null)
    const [branchData, setBranchData] = useState<Record<string, ManualBranchPL>>({})
    const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false)
    const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState<boolean>(false)
    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState<boolean>(false)
    const [addExpenseModalType, setAddExpenseModalType] = useState<'opex' | 'capex'>('opex')
    const [registryFilterBranch, setRegistryFilterBranch] = useState<string>('all')
    const [registryFilterType, setRegistryFilterType] = useState<'all' | 'opex' | 'capex'>('all')

    const hasGoogleSheetConnected = !!googleSheetsSyncService.getConfig().spreadsheetId
    const prevMonthKey = shiftMonth(monthKey, -1)
    const editModeId = useId()

    // Fetch on month change and sync revenue strictly from Manual Daily Sales
    useEffect(() => {
        let active = true
        setLoading(true)
        Promise.all([
            manualProfitLossStore.fetchMonth(monthKey),
            manualSalesStore.fetchMonth(monthKey),
        ]).then(([allPL]) => {
            if (!active) return
            const monthObj = allPL[monthKey] || {}
            const allSales = manualSalesStore.getAll()

            const init: Record<string, ManualBranchPL> = {}
            for (const b of branchNames) {
                const saved = monthObj[b] || manualProfitLossStore.getBranchData(monthKey, b)
                const isUpcoming = UPCOMING_BRANCH_NAMES.includes(b)
                const isManea = b === 'Manea'

                // Sum actual service and retail sales from Manual Daily Sales for this branch & month
                let manualService = 0
                let manualRetail = 0
                let activeDays = 0
                const bSales = allSales[b] || {}
                for (const [date, rec] of Object.entries(bSales)) {
                    if (date.startsWith(monthKey)) {
                        const s = Number(rec.service) || 0
                        const r = Number(rec.retail) || 0
                        manualService += s
                        manualRetail += r
                        if (s > 0 || r > 0) activeDays++
                    }
                }

                // If saved exists, keep user expenses/customizations & capex but take sales strictly from manual daily sales
                if (saved && (saved.hairServices > 0 || saved.retailSales > 0 || saved.salaries_wages > 0 || (saved.capex || 0) > 0 || (saved.rent_lease || 0) > 0)) {
                    init[b] = {
                        ...saved,
                        hairServices: manualService,
                        retailSales: manualRetail,
                        capex: saved.capex || 0,
                        capex_items: saved.capex_items || [],
                        opex_items: saved.opex_items || [],
                    }
                } else if (isUpcoming) {
                    // Default initial pre-launch data for upcoming branches
                    const defaultRent = b.includes('Yelahanka') ? 35000 : 25000
                    const initialCapexItems: CapExItem[] = b.includes('Yelahanka') ? [
                        { id: 'upc1-c1', title: 'Civil & Flooring Interior Fitout (Advance)', amount: 280000, category: 'fitout', date: `${monthKey}-05` },
                        { id: 'upc1-c2', title: 'Styling Chairs & Hydraulic Stations (4 Nos)', amount: 90000, category: 'salon_chairs', date: `${monthKey}-12` },
                        { id: 'upc1-c3', title: 'Storefront Facia Signage & 3D Logo', amount: 50000, category: 'signage', date: `${monthKey}-20` },
                    ] : [
                        { id: 'upc2-c1', title: 'Civil Partitioning & Electrical Conduiting', amount: 180000, category: 'fitout', date: `${monthKey}-08` },
                        { id: 'upc2-c2', title: 'HVAC Air Conditioning Advance', amount: 70000, category: 'hvac', date: `${monthKey}-18` },
                    ]
                    const totalCapex = initialCapexItems.reduce((s, i) => s + i.amount, 0)

                    init[b] = {
                        ...zeroBranchPL(),
                        hairServices: manualService,
                        retailSales: manualRetail,
                        productCost: 0,
                        service_commissions: 0,
                        retail_commissions: 0,
                        transaction_fees: 0,
                        salaries_wages: 0,
                        benefits_insurance: 0,
                        payroll_tax: 0,
                        general_admin: 2000,
                        utilities: 2500,
                        repairs_maintenance: 0,
                        rent_lease: defaultRent,
                        depreciation: 0,
                        debts_loans: 0,
                        capex: totalCapex,
                        capex_items: initialCapexItems,
                        opex_items: [],
                        notes: `Upcoming branch in pre-launch stage. Advance rent & fit-out CapEx active.`,
                    }
                } else {
                    const totalSales = manualService + manualRetail
                    init[b] = {
                        ...zeroBranchPL(),
                        hairServices: manualService,
                        retailSales: manualRetail,
                        productCost: Math.round(manualRetail * 0.25),
                        service_commissions: Math.round(manualService * 0.1),
                        retail_commissions: Math.round(manualRetail * 0.05),
                        transaction_fees: Math.round(totalSales * 0.015),
                        salaries_wages: 65000,
                        benefits_insurance: 5000,
                        payroll_tax: 3500,
                        general_admin: 4000,
                        utilities: 8500,
                        repairs_maintenance: 3000,
                        rent_lease: b === 'Bengaluru' ? 45000 : (isManea ? 50000 : 30000),
                        depreciation: 4000,
                        debts_loans: 0,
                        capex: 0,
                        capex_items: [],
                        opex_items: [],
                        notes: activeDays > 0 ? `Synced from Manual Daily Sales (${activeDays} active days).` : (isManea ? 'Manea Salon — Under CEO Direct Portfolio.' : undefined),
                    }
                }
                manualProfitLossStore.setBranchData(monthKey, b, init[b])
            }

            setBranchData(init)
            setLoading(false)
        })
        return () => {
            active = false
        }
    }, [monthKey])

    async function handleSyncFromManualDailySales(notify = true) {
        setSyncing(true)
        try {
            const updated: Record<string, ManualBranchPL> = { ...branchData }
            let totalSales = 0
            let activeDays = 0

            for (const b of branchNames) {
                const res = await manualProfitLossStore.extractFromManualDailySales(monthKey, b)
                updated[b] = res.data
                totalSales += res.totalSales
                activeDays += res.daysWithSales
                manualProfitLossStore.setBranchData(monthKey, b, res.data)
            }

            setBranchData(updated)
            if (notify) {
                setStatusMsg(`Successfully synced with Manual Daily Sales (Total Sales: ₹${totalSales.toLocaleString('en-IN')}, ${activeDays} active daily records) for ${monthLabel(monthKey)}!`)
                setTimeout(() => setStatusMsg(null), 4500)
            }
        } catch (err) {
            console.error('Failed to sync from manual daily sales', err)
            setStatusMsg('Error syncing from Manual Daily Sales.')
            setTimeout(() => setStatusMsg(null), 3000)
        } finally {
            setSyncing(false)
        }
    }

    function handleFieldChange(branch: string, key: keyof ManualBranchPL, val: string | number) {
        const numVal = typeof val === 'number' ? val : Number(val) || 0
        setBranchData(prev => {
            const cur = prev[branch] || zeroBranchPL()
            const updatedBranch = { ...cur, [key]: numVal }
            manualProfitLossStore.setBranchData(monthKey, branch, { [key]: numVal })
            return { ...prev, [branch]: updatedBranch }
        })
    }

    function handleRemoveCapExItem(branch: string, itemId: string) {
        manualProfitLossStore.removeCapExItem(monthKey, branch, itemId)
        const updated = manualProfitLossStore.getBranchData(monthKey, branch)
        setBranchData(prev => ({ ...prev, [branch]: updated }))
        setStatusMsg('CapEx item removed.')
        setTimeout(() => setStatusMsg(null), 2500)
    }

    function handleRemoveOpExItem(branch: string, itemId: string) {
        manualProfitLossStore.removeOpExItem(monthKey, branch, itemId)
        const updated = manualProfitLossStore.getBranchData(monthKey, branch)
        setBranchData(prev => ({ ...prev, [branch]: updated }))
        setStatusMsg('OpEx item removed.')
        setTimeout(() => setStatusMsg(null), 2500)
    }

    function handleExpenseAdded(targetBranch: string, type: 'opex' | 'capex', amount: number) {
        const updated = manualProfitLossStore.getBranchData(monthKey, targetBranch)
        setBranchData(prev => ({ ...prev, [targetBranch]: updated }))
        setStatusMsg(`Successfully recorded ₹${amount.toLocaleString('en-IN')} ${type === 'capex' ? 'CapEx' : 'OpEx'} for ${targetBranch}!`)
        setTimeout(() => setStatusMsg(null), 4000)
    }

    function handleImportSuccess(summary: ImportExpenseSummary) {
        const refreshed: Record<string, ManualBranchPL> = {}
        for (const b of branchNames) {
            refreshed[b] = manualProfitLossStore.getBranchData(monthKey, b)
        }
        setBranchData(refreshed)
        setStatusMsg(`Successfully imported ${summary.totalRows} expenses (OpEx: ₹${Math.round(summary.totalOpEx).toLocaleString('en-IN')}, CapEx: ₹${Math.round(summary.totalCapEx).toLocaleString('en-IN')}) across ${summary.months.length} month(s).`)
        setTimeout(() => setStatusMsg(null), 5000)
    }

    function handleNotesChange(branch: string, notes: string) {
        setBranchData(prev => {
            const cur = prev[branch] || zeroBranchPL()
            const updatedBranch = { ...cur, notes }
            manualProfitLossStore.setBranchData(monthKey, branch, { notes })
            return { ...prev, [branch]: updatedBranch }
        })
    }

    function handleResetMonth() {
        if (!window.confirm(`Are you sure you want to reset all manual P&L numbers for ${monthLabel(monthKey)}?`)) {
            return
        }
        for (const b of branchNames) {
            manualProfitLossStore.clearBranch(monthKey, b)
        }
        const cleared: Record<string, ManualBranchPL> = {}
        for (const b of branchNames) cleared[b] = zeroBranchPL()
        setBranchData(cleared)
        setStatusMsg(`Cleared P&L data for ${monthLabel(monthKey)}. Click "Sync Sales" to reload.`)
        setTimeout(() => setStatusMsg(null), 3500)
    }

    const currMonthLabel = monthLabel(monthKey)
    const prevMonthLabel = monthLabel(prevMonthKey)
    const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

    // Aggregations:
    // 1. Operating P&L (Active Salons: Bengaluru, Kalaburagi, Belgaum, Manea)
    const operationalPL = OPERATIONAL_BRANCH_NAMES.reduce((acc: ManualBranchPL, b: string) => {
        const d = branchData[b] || zeroBranchPL()
        return {
            hairServices: acc.hairServices + d.hairServices,
            otherServices: acc.otherServices + d.otherServices,
            retailSales: acc.retailSales + d.retailSales,
            productCost: acc.productCost + d.productCost,
            service_commissions: acc.service_commissions + d.service_commissions,
            retail_commissions: acc.retail_commissions + d.retail_commissions,
            direct_professional_labor: acc.direct_professional_labor + d.direct_professional_labor,
            transaction_fees: acc.transaction_fees + d.transaction_fees,
            salaries_wages: acc.salaries_wages + d.salaries_wages,
            benefits_insurance: acc.benefits_insurance + d.benefits_insurance,
            payroll_tax: acc.payroll_tax + d.payroll_tax,
            general_admin: acc.general_admin + d.general_admin,
            utilities: acc.utilities + d.utilities,
            repairs_maintenance: acc.repairs_maintenance + d.repairs_maintenance,
            rent_lease: acc.rent_lease + d.rent_lease,
            depreciation: acc.depreciation + d.depreciation,
            debts_loans: acc.debts_loans + d.debts_loans,
            capex: (acc.capex || 0) + (d.capex || 0),
            capex_items: [...(acc.capex_items || []), ...(d.capex_items || [])],
            opex_items: [...(acc.opex_items || []), ...(d.opex_items || [])],
        }
    }, zeroBranchPL())

    const operationalMetrics = computePLMetrics(operationalPL)

    // 2. Full Consolidated (All Operational + Upcoming Pre-Launch Fitout CapEx)
    const masterConsolidatedPL = ALL_SALON_BRANCH_NAMES.reduce((acc: ManualBranchPL, b: string) => {
        const d = branchData[b] || zeroBranchPL()
        return {
            hairServices: acc.hairServices + d.hairServices,
            otherServices: acc.otherServices + d.otherServices,
            retailSales: acc.retailSales + d.retailSales,
            productCost: acc.productCost + d.productCost,
            service_commissions: acc.service_commissions + d.service_commissions,
            retail_commissions: acc.retail_commissions + d.retail_commissions,
            direct_professional_labor: acc.direct_professional_labor + d.direct_professional_labor,
            transaction_fees: acc.transaction_fees + d.transaction_fees,
            salaries_wages: acc.salaries_wages + d.salaries_wages,
            benefits_insurance: acc.benefits_insurance + d.benefits_insurance,
            payroll_tax: acc.payroll_tax + d.payroll_tax,
            general_admin: acc.general_admin + d.general_admin,
            utilities: acc.utilities + d.utilities,
            repairs_maintenance: acc.repairs_maintenance + d.repairs_maintenance,
            rent_lease: acc.rent_lease + d.rent_lease,
            depreciation: acc.depreciation + d.depreciation,
            debts_loans: acc.debts_loans + d.debts_loans,
            capex: (acc.capex || 0) + (d.capex || 0),
            capex_items: [...(acc.capex_items || []), ...(d.capex_items || [])],
            opex_items: [...(acc.opex_items || []), ...(d.opex_items || [])],
        }
    }, zeroBranchPL())

    const masterConsolidatedMetrics = computePLMetrics(masterConsolidatedPL)

    // Individual Branch Results
    const branchResults = ALL_SALON_BRANCH_NAMES.map((b: string) => {
        const d = branchData[b] || zeroBranchPL()
        const m = computePLMetrics(d)
        const ceoPct = ceoPctOf(b) / 100
        const isUpcoming = UPCOMING_BRANCH_NAMES.includes(b)
        const isManea = b === 'Manea'
        return {
            branch: b,
            data: d,
            metrics: m,
            ceoShare: m.netProfit * ceoPct,
            ceoCashShare: m.netCashFlow * ceoPct,
            isUpcoming,
            isManea,
        }
    })

    const operationalCeoShare = branchResults
        .filter(r => !r.isUpcoming)
        .reduce((s, r) => s + r.ceoShare, 0)
    const operationalCeoCashShare = branchResults
        .filter(r => !r.isUpcoming)
        .reduce((s, r) => s + r.ceoCashShare, 0)

    const masterCeoCashShare = branchResults.reduce((s, r) => s + r.ceoCashShare, 0)

    // Current active selection resolution
    const isViewingOperationalConsolidated = selectedBranch === 'all_operational' || selectedBranch === 'all'
    const isViewingMasterConsolidated = selectedBranch === 'all_consolidated'
    const isViewingConsolidated = isViewingOperationalConsolidated || isViewingMasterConsolidated

    const activeData = isViewingMasterConsolidated
        ? masterConsolidatedPL
        : isViewingOperationalConsolidated
        ? operationalPL
        : branchData[selectedBranch] || zeroBranchPL()

    const activeMetrics = isViewingMasterConsolidated
        ? masterConsolidatedMetrics
        : isViewingOperationalConsolidated
        ? operationalMetrics
        : computePLMetrics(activeData)

    const isSelectedUnderCeo = selectedBranch === 'Manea' || selectedBranch === 'Bengaluru'
    const isSelectedUpcoming = UPCOMING_BRANCH_NAMES.includes(selectedBranch)

    // Gather all dedicated items for the hub registry
    const allOpExItems: { branch: string; item: OpExItem }[] = []
    const allCapExItems: { branch: string; item: CapExItem }[] = []

    for (const b of ALL_SALON_BRANCH_NAMES) {
        const d = branchData[b]
        if (d?.opex_items) {
            d.opex_items.forEach(item => allOpExItems.push({ branch: b, item }))
        }
        if (d?.capex_items) {
            d.capex_items.forEach(item => allCapExItems.push({ branch: b, item }))
        }
    }

    return (
        <div>
            {/* Header & Controls */}
            <div className="no-print manual-pl-toolbar">
                <div>
                    <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <FileSpreadsheet className="text-primary" size={24} />
                        Profit &amp; Loss — Multi-Branch Executive Center
                    </h1>
                    <p className="admin-page-sub">
                        Direct P&amp;L with dedicated OpEx &amp; CapEx tracking, Manea (Under CEO), and upcoming pre-launch branches.
                    </p>
                </div>

                <div className="manual-pl-controls">
                    {/* Month Picker */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                            id="manual-pl-prev-month-btn"
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            onClick={() => setMonthKey(shiftMonth(monthKey, -1))}
                            title="Previous Month"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-bright)', minWidth: 140, textAlign: 'center' }}>
                            {currMonthLabel}
                        </span>
                        <button
                            id="manual-pl-next-month-btn"
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            onClick={() => setMonthKey(shiftMonth(monthKey, 1))}
                            title="Next Month"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            id="manual-pl-this-month-btn"
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            onClick={() => setMonthKey(monthKeyOf(todayIso()))}
                        >
                            This Month
                        </button>
                    </div>

                    {/* Branch Filter */}
                    <select
                        id="manual-pl-branch-select"
                        className="admin-filter-select"
                        value={selectedBranch}
                        onChange={e => setSelectedBranch(e.target.value)}
                    >
                        <option value="all_operational">All Operational Salons (Operating P&amp;L)</option>
                        <option value="all_consolidated">Consolidated Master (All Salons + Upcoming CapEx)</option>
                        <optgroup label="Operational Salons">
                            {OPERATIONAL_BRANCH_NAMES.map((b: string) => (
                                <option key={b} value={b}>
                                    {b === 'Manea' ? '★ Manea (Under CEO)' : b}
                                </option>
                            ))}
                        </optgroup>
                        <optgroup label="Upcoming / Pre-Launch Branches">
                            {UPCOMING_BRANCH_NAMES.map((b: string) => (
                                <option key={b} value={b}>
                                    🏗️ {b}
                                </option>
                            ))}
                        </optgroup>
                    </select>

                    {/* Add Dedicated Expense Modal Button */}
                    <button
                        id="manual-pl-add-expense-btn"
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        onClick={() => {
                            setAddExpenseModalType('opex')
                            setIsAddExpenseModalOpen(true)
                        }}
                        title="Add dedicated OpEx or CapEx item to any branch"
                        style={{ gap: 6 }}
                    >
                        <Plus size={14} />
                        <span>Add Dedicated OpEx/CapEx</span>
                    </button>

                    {/* Sync Sales Button */}
                    <button
                        id="manual-pl-sync-daily-sales-btn"
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => handleSyncFromManualDailySales(true)}
                        disabled={syncing}
                        title="Pull service and retail sales directly from Manual Daily Sales records for this month"
                    >
                        <RefreshCw size={14} className={syncing ? 'spin' : ''} />
                        {syncing ? 'Syncing…' : 'Sync Sales'}
                    </button>

                    {/* Google Sheets Two-Way Sync */}
                    <button
                        id="manual-pl-google-sheets-sync-btn"
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => setIsGoogleSheetsModalOpen(true)}
                        title="Two-way synchronization with existing Google Spreadsheet"
                        style={{ gap: 6, borderColor: hasGoogleSheetConnected ? '#10b981' : undefined }}
                    >
                        <ArrowLeftRight size={14} style={{ color: '#10b981' }} />
                        <span>Google Sheets Sync</span>
                        {hasGoogleSheetConnected && (
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                        )}
                    </button>

                    {/* Import OpEx & CapEx from Excel */}
                    <button
                        id="manual-pl-import-excel-btn"
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => setIsImportModalOpen(true)}
                        title="Import operating expenses and capital expenditure investments from Excel spreadsheet"
                        style={{ gap: 6 }}
                    >
                        <FileSpreadsheet size={14} className="text-primary" />
                        Import Excel
                    </button>

                    {/* Edit Mode Toggle */}
                    <button
                        id="manual-pl-edit-toggle-btn"
                        className={`admin-btn admin-btn-sm ${isEditMode ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                        onClick={() => setIsEditMode(!isEditMode)}
                    >
                        {isEditMode ? <Check size={14} /> : <Edit3 size={14} />}
                        {isEditMode ? 'Done Editing' : 'Edit Cells'}
                    </button>

                    {/* Print Button */}
                    <button
                        id="manual-pl-print-btn"
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={() => window.print()}
                    >
                        <Printer size={14} /> Print
                    </button>

                    {/* Reset Button */}
                    <button
                        id="manual-pl-reset-btn"
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={handleResetMonth}
                        title="Reset all values for this month"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>

            {/* Navigation Tabs between P&L Statement and Dedicated OpEx/CapEx Hub */}
            <div className="no-print pl-tabs-container">
                <button
                    className={`pl-tab-btn ${activeTab === 'statement' ? 'active' : ''}`}
                    onClick={() => setActiveTab('statement')}
                >
                    <FileSpreadsheet size={16} />
                    <span>P&amp;L Financial Statement</span>
                </button>
                <button
                    className={`pl-tab-btn ${activeTab === 'dedicated_hub' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dedicated_hub')}
                >
                    <Layers size={16} />
                    <span>Dedicated OpEx &amp; CapEx Hub</span>
                    <span style={{ fontSize: 10, background: 'var(--color-primary, #b59458)', color: '#000', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                        NEW
                    </span>
                </button>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {selectedBranch === 'Manea' && (
                        <span className="pl-badge-ceo">
                            ★ Manea — 100% Under CEO Direct Portfolio
                        </span>
                    )}
                    {isSelectedUpcoming && (
                        <span className="pl-badge-upcoming">
                            🏗️ {selectedBranch} — Pre-Launch Construction &amp; Fitout
                        </span>
                    )}
                    {isViewingOperationalConsolidated && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Operating Salons Only (Excludes Pre-Launch Fitouts)
                        </span>
                    )}
                </div>
            </div>

            {statusMsg && (
                <div className="no-print admin-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 16px', borderRadius: 8, marginBottom: 16 }}>
                    {statusMsg}
                </div>
            )}

            {/* TAB 1: P&L STATEMENT */}
            {activeTab === 'statement' && (
                <div>
                    {/* Executive KPI Overview Cards */}
                    <div className="no-print manual-pl-metrics-grid">
                        <div className="manual-pl-metric-card">
                            <span className="manual-pl-metric-title">Gross Revenue</span>
                            <span className="manual-pl-metric-val">{money(activeMetrics.revenue)}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                Hair: {money(activeData.hairServices)} · Retail: {money(activeData.retailSales)}
                            </span>
                        </div>
                        <div className="manual-pl-metric-card">
                            <span className="manual-pl-metric-title">Gross Profit (Margin)</span>
                            <span className="manual-pl-metric-val">{money(activeMetrics.grossProfit)}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {activeMetrics.revenue > 0 ? `${((activeMetrics.grossProfit / activeMetrics.revenue) * 100).toFixed(1)}% margin` : '0%'}
                            </span>
                        </div>
                        <div className="manual-pl-metric-card">
                            <span className="manual-pl-metric-title">Operating Expenses (OpEx)</span>
                            <span className="manual-pl-metric-val" style={{ color: '#f59e0b' }}>{money(activeMetrics.totalExpenses)}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                Rent: {money(Number(activeData.rent_lease) || 0)} · Wages: {money(Number(activeData.salaries_wages) || 0)}
                            </span>
                        </div>
                        <div className="manual-pl-metric-card">
                            <span className="manual-pl-metric-title">Operating Net Profit</span>
                            <span className={`manual-pl-metric-val ${activeMetrics.netProfit >= 0 ? 'positive' : 'negative'}`}>
                                {money(activeMetrics.netProfit)}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {activeMetrics.revenue > 0 ? `${((activeMetrics.netProfit / activeMetrics.revenue) * 100).toFixed(1)}% net margin` : '0%'}
                            </span>
                        </div>
                        <div className="manual-pl-metric-card">
                            <span className="manual-pl-metric-title">CapEx Outlay</span>
                            <span className="manual-pl-metric-val" style={{ color: '#a855f7' }}>{money(activeData.capex || 0)}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {activeData.capex_items?.length || 0} capital assets recorded
                            </span>
                        </div>
                        <div className="manual-pl-metric-card" style={{ borderLeft: '3px solid var(--color-primary, #b59458)' }}>
                            <span className="manual-pl-metric-title">
                                {isViewingConsolidated ? 'Total CEO Share' : `CEO Share (${ceoPctOf(selectedBranch)}%)`}
                            </span>
                            <span className="manual-pl-metric-val" style={{ color: 'var(--color-primary, #b59458)' }}>
                                {money(isViewingConsolidated ? operationalCeoShare : (activeMetrics.netProfit * (ceoPctOf(selectedBranch) / 100)))}
                            </span>
                            <span style={{ fontSize: 11, color: '#3b82f6' }}>
                                Cash after CapEx: {money(isViewingConsolidated ? masterCeoCashShare : (activeMetrics.netCashFlow * (ceoPctOf(selectedBranch) / 100)))}
                            </span>
                        </div>
                    </div>

                    {/* Pre-launch Project banner if viewing an upcoming branch */}
                    {isSelectedUpcoming && (
                        <div className="no-print" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <div style={{ fontWeight: 700, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15 }}>
                                    <Hammer size={18} />
                                    {selectedBranch} — Pre-Opening Fit-out Project
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                                    Target Opening: <strong>{UPCOMING_METADATA[selectedBranch]?.targetLaunch}</strong> · Location: {UPCOMING_METADATA[selectedBranch]?.location}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    className="admin-btn admin-btn-sm admin-btn-secondary"
                                    onClick={() => {
                                        setAddExpenseModalType('capex')
                                        setIsAddExpenseModalOpen(true)
                                    }}
                                >
                                    <Plus size={13} /> Add Fitout CapEx
                                </button>
                                <button
                                    className="admin-btn admin-btn-sm admin-btn-primary"
                                    onClick={() => setActiveTab('dedicated_hub')}
                                >
                                    View in Dedicated Hub
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Document Printable Statement Sheet */}
                    <div className="report-sheet print-doc">
                        {!isViewingConsolidated ? (
                            /* Single Branch View */
                            <div>
                                {/* Letterhead */}
                                <div className="report-letterhead">
                                    <div className="report-letterhead-main">
                                        <img src={cmLogo} alt="Christalin Mirrors" className="report-logo" />
                                        <div>
                                            <div className="report-title">
                                                Christalin Mirrors — {selectedBranch}
                                                {selectedBranch === 'Manea' ? ' (Under CEO)' : ''}
                                            </div>
                                            <div className="report-range">For the Month Ended {currMonthLabel} · {isSelectedUpcoming ? 'Pre-Opening Statement' : 'Operational P&L'}</div>
                                        </div>
                                    </div>
                                    <div className="report-letterhead-meta">
                                        <div><span>Report No.</span> CM/PL-MANUAL/{selectedBranch.slice(0, 3).toUpperCase()}/{monthKey.replace('-', '')}</div>
                                        <div><span>Status</span> {isSelectedUpcoming ? 'Pre-Launch / CapEx Phase' : 'Operational Branch'}</div>
                                        <div><span>Ownership</span> {OWNERSHIP[selectedBranch]?.[0]?.label || 'CEO'}</div>
                                        <div><span>Generated</span> {generatedAt}</div>
                                    </div>
                                </div>

                                {/* Revenue Section */}
                                <div className="report-section-title">
                                    Revenue
                                    {isEditMode && <span className="no-print" style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-primary, #b59458)' }}>· Editable fields active</span>}
                                </div>
                                <div className="table-scroll">
                                    <table className="admin-table report-table manual-pl-table">
                                        <thead>
                                            <tr>
                                                <th>Revenue Line</th>
                                                <th style={{ width: 180 }}>Amount (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="cell-primary">Hair Services</td>
                                                <td>
                                                    {isEditMode ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="manual-pl-input"
                                                            value={activeData.hairServices || ''}
                                                            onChange={e => handleFieldChange(selectedBranch, 'hairServices', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    ) : (
                                                        money(activeData.hairServices)
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="cell-primary">Other Services (Beauty, Spa, Nails)</td>
                                                <td>
                                                    {isEditMode ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="manual-pl-input"
                                                            value={activeData.otherServices || ''}
                                                            onChange={e => handleFieldChange(selectedBranch, 'otherServices', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    ) : (
                                                        money(activeData.otherServices)
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="cell-primary">Retail Sales</td>
                                                <td>
                                                    {isEditMode ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="manual-pl-input"
                                                            value={activeData.retailSales || ''}
                                                            onChange={e => handleFieldChange(selectedBranch, 'retailSales', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    ) : (
                                                        money(activeData.retailSales)
                                                    )}
                                                </td>
                                            </tr>
                                            <tr className="report-totals-row">
                                                <td className="cell-primary">Gross Revenue</td>
                                                <td>{money(activeMetrics.revenue)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Cost of Goods Sold Section */}
                                <div className="report-section-title">Cost of Goods Sold (COGS)</div>
                                <div className="table-scroll">
                                    <table className="admin-table report-table manual-pl-table">
                                        <thead>
                                            <tr>
                                                <th>COGS Line</th>
                                                <th style={{ width: 180 }}>Amount (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="cell-primary">Hair &amp; Retail Product Cost</td>
                                                <td>
                                                    {isEditMode ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="manual-pl-input"
                                                            value={activeData.productCost || ''}
                                                            onChange={e => handleFieldChange(selectedBranch, 'productCost', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    ) : (
                                                        money(activeData.productCost)
                                                    )}
                                                </td>
                                            </tr>
                                            {COGS_KEYS.map(c => (
                                                <tr key={c.key}>
                                                    <td className="cell-primary">{c.label}</td>
                                                    <td>
                                                        {isEditMode ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="manual-pl-input"
                                                                value={(activeData[c.key] as number) || ''}
                                                                onChange={e => handleFieldChange(selectedBranch, c.key, e.target.value)}
                                                                placeholder="0"
                                                            />
                                                        ) : (
                                                            money(Number(activeData[c.key]) || 0)
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="report-totals-row">
                                                <td className="cell-primary">Total COGS</td>
                                                <td>{money(activeMetrics.totalCogs)}</td>
                                            </tr>
                                            <tr className="report-totals-row" style={{ background: 'rgba(181, 148, 88, 0.08)' }}>
                                                <td className="cell-primary">Gross Profit (Gross Revenue − Total COGS)</td>
                                                <td style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{money(activeMetrics.grossProfit)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Operating Expenses Section */}
                                <div className="report-section-title">Dedicated Operating Expenses (OpEx)</div>
                                <div className="table-scroll">
                                    <table className="admin-table report-table manual-pl-table">
                                        <thead>
                                            <tr>
                                                <th>Expense Category</th>
                                                <th style={{ width: 180 }}>Amount (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {OPEX_KEYS.map(c => (
                                                <tr key={c.key}>
                                                    <td className="cell-primary">{c.label}</td>
                                                    <td>
                                                        {isEditMode ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="manual-pl-input"
                                                                value={(activeData[c.key] as number) || ''}
                                                                onChange={e => handleFieldChange(selectedBranch, c.key, e.target.value)}
                                                                placeholder="0"
                                                            />
                                                        ) : (
                                                            money(Number(activeData[c.key]) || 0)
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="report-totals-row">
                                                <td className="cell-primary">Total Operating Expenses (OpEx)</td>
                                                <td>{money(activeMetrics.totalExpenses)}</td>
                                            </tr>
                                            <tr className="report-totals-row pl-net-profit-row" style={{ background: activeMetrics.netProfit >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                                                <td className="cell-primary">Operating Net Profit (Gross Profit − Total OpEx)</td>
                                                <td style={{ fontWeight: 700, fontSize: 16, color: activeMetrics.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                                                    {money(activeMetrics.netProfit)}
                                                </td>
                                            </tr>

                                            {/* Capital Expenditures (CapEx) Row */}
                                            <tr>
                                                <td className="cell-primary" style={{ paddingTop: 12 }}>
                                                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={{ color: '#a855f7' }}>●</span> Dedicated Capital Expenditures (CapEx)
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                                        Fixed assets, fitout works, salon styling stations, shampoo backwashes, AC installations
                                                    </div>
                                                </td>
                                                <td style={{ verticalAlign: 'middle' }}>
                                                    {isEditMode ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="manual-pl-input"
                                                            value={activeData.capex || ''}
                                                            onChange={e => handleFieldChange(selectedBranch, 'capex', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    ) : (
                                                        <span style={{ fontWeight: 600, color: '#a855f7' }}>
                                                            {money(activeData.capex || 0)}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Net Cash Retained Row */}
                                            <tr className="report-totals-row" style={{ background: activeMetrics.netCashFlow >= 0 ? 'rgba(59, 130, 246, 0.08)' : 'rgba(239, 68, 68, 0.1)' }}>
                                                <td className="cell-primary" style={{ fontWeight: 700 }}>
                                                    Net Cash Retained (Operating Profit − CapEx)
                                                </td>
                                                <td style={{ fontWeight: 700, fontSize: 16, color: activeMetrics.netCashFlow >= 0 ? '#3b82f6' : '#ef4444' }}>
                                                    {money(activeMetrics.netCashFlow)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Itemized CapEx Asset Breakdown if present */}
                                {activeData.capex_items && activeData.capex_items.length > 0 && (
                                    <div style={{ marginTop: 16, marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <div className="report-section-title" style={{ margin: 0, fontSize: 13 }}>
                                                Dedicated CapEx Assets for {selectedBranch} ({activeData.capex_items.length} items)
                                            </div>
                                        </div>
                                        <div className="table-scroll">
                                            <table className="admin-table report-table" style={{ fontSize: 12 }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: 110 }}>Date</th>
                                                        <th>Asset / Equipment Description</th>
                                                        <th style={{ width: 160 }}>Category</th>
                                                        <th style={{ textAlign: 'right', width: 140 }}>Amount</th>
                                                        {isEditMode && <th style={{ width: 44 }}></th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activeData.capex_items.map(item => (
                                                        <tr key={item.id}>
                                                            <td style={{ whiteSpace: 'nowrap' }}>{item.date}</td>
                                                            <td style={{ fontWeight: 600 }}>{item.title}</td>
                                                            <td>
                                                                <span style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                                                                    {item.category.toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{money(item.amount)}</td>
                                                            {isEditMode && (
                                                                <td style={{ textAlign: 'center' }}>
                                                                    <button
                                                                        type="button"
                                                                        className="admin-btn-icon text-muted"
                                                                        onClick={() => handleRemoveCapExItem(selectedBranch, item.id)}
                                                                        title="Remove asset"
                                                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Profit Split Table */}
                                <div className="report-section-title">Profit &amp; Cash Split — {selectedBranch}</div>
                                <div className="table-scroll">
                                    <table className="admin-table report-table pl-line-table">
                                        <thead>
                                            <tr>
                                                <th>Shareholder / Partner</th>
                                                <th>Ownership %</th>
                                                <th>Share of Operating Profit</th>
                                                <th>Share of Net Cash Flow (After CapEx)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(OWNERSHIP[selectedBranch] || [{ label: 'CEO (Sole Owner)', pct: 100, isCeo: true }]).map(sh => (
                                                <tr key={sh.label} className={sh.isCeo ? 'pl-ceo-row' : ''}>
                                                    <td className="cell-primary">{sh.label}</td>
                                                    <td>{sh.pct}%</td>
                                                    <td style={{ fontWeight: 600 }}>{money(activeMetrics.netProfit * (sh.pct / 100))}</td>
                                                    <td style={{ fontWeight: 700, color: (activeMetrics.netCashFlow * (sh.pct / 100)) >= 0 ? '#3b82f6' : '#ef4444' }}>
                                                        {money(activeMetrics.netCashFlow * (sh.pct / 100))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Notes Section */}
                                <div className="report-section-title">Branch Notes</div>
                                <div style={{ marginBottom: 20 }}>
                                    {isEditMode ? (
                                        <textarea
                                            className="manual-pl-input-notes"
                                            rows={2}
                                            placeholder="Add optional notes, daily sales verification details, or auditor remarks..."
                                            value={activeData.notes || ''}
                                            onChange={e => handleNotesChange(selectedBranch, e.target.value)}
                                        />
                                    ) : (
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                            {activeData.notes || 'No remarks recorded for this branch statement.'}
                                        </p>
                                    )}
                                </div>

                                <div className="report-sign-grid">
                                    <div className="report-sign-block">
                                        <div className="report-sign-line" />
                                        <div className="report-sign-role">Branch Manager Signature</div>
                                    </div>
                                    <div className="report-sign-block">
                                        <div className="report-sign-line" />
                                        <div className="report-sign-role">CEO / Managing Partner</div>
                                    </div>
                                </div>

                                <div className="report-footer">
                                    <div className="report-footer-left">
                                        Christalin Mirrors Luxury Salon · {selectedBranch} · Manual P&amp;L Statement
                                    </div>
                                    <div className="report-footer-right">
                                        Confidential · Management Eyes Only
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Consolidated Multi-Branch View */
                            <div>
                                <div className="report-letterhead">
                                    <div className="report-letterhead-main">
                                        <img src={cmLogo} alt="Christalin Mirrors" className="report-logo" />
                                        <div>
                                            <div className="report-title">
                                                Christalin Mirrors — {isViewingMasterConsolidated ? 'Consolidated Master Profit & Loss (All Salons + Upcoming CapEx)' : 'Operational Salons Consolidated Profit & Loss'}
                                            </div>
                                            <div className="report-range">
                                                For the Month Ended {currMonthLabel} · {isViewingMasterConsolidated ? 'Comprehensive Group Financials' : 'Active Mature Salons (Bengaluru, Kalaburagi, Belgaum, Manea)'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="report-letterhead-meta">
                                        <div><span>Report No.</span> CM/PL-CONSOL/{monthKey.replace('-', '')}</div>
                                        <div><span>Scope</span> {isViewingMasterConsolidated ? 'Consolidated Group (6 Salons)' : 'Operating Salons (4 Salons)'}</div>
                                        <div><span>Generated</span> {generatedAt}</div>
                                    </div>
                                </div>

                                {/* Comparison Table */}
                                <div className="report-section-title">
                                    Branch-by-Branch Financial Performance Summary
                                </div>
                                <div className="table-scroll">
                                    <table className="admin-table report-table manual-pl-table">
                                        <thead>
                                            <tr>
                                                <th>Branch</th>
                                                <th>Status</th>
                                                <th>Gross Revenue</th>
                                                <th>COGS</th>
                                                <th>Gross Profit</th>
                                                <th>OpEx</th>
                                                <th>Operating Profit</th>
                                                <th>CapEx Outlay</th>
                                                <th>Net Cash</th>
                                                <th>CEO %</th>
                                                <th>CEO Profit Share</th>
                                                <th>CEO Cash Share</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {branchResults
                                                .filter(r => isViewingMasterConsolidated ? true : !r.isUpcoming)
                                                .map(r => (
                                                    <tr key={r.branch}>
                                                        <td className="cell-primary" style={{ fontWeight: 600 }}>
                                                            {r.branch}
                                                            {r.isManea && <span style={{ color: '#d97706', marginLeft: 4 }}>★</span>}
                                                        </td>
                                                        <td>
                                                            {r.isUpcoming ? (
                                                                <span className="pl-badge-upcoming" style={{ fontSize: 10 }}>Pre-Launch</span>
                                                            ) : r.isManea ? (
                                                                <span className="pl-badge-ceo" style={{ fontSize: 10 }}>Under CEO</span>
                                                            ) : (
                                                                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Active</span>
                                                            )}
                                                        </td>
                                                        <td>{money(r.metrics.revenue)}</td>
                                                        <td>{money(r.metrics.totalCogs)}</td>
                                                        <td>{money(r.metrics.grossProfit)}</td>
                                                        <td>{money(r.metrics.totalExpenses)}</td>
                                                        <td style={{ fontWeight: 600, color: r.metrics.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                                                            {money(r.metrics.netProfit)}
                                                        </td>
                                                        <td style={{ fontWeight: 600, color: '#a855f7' }}>
                                                            {money(r.metrics.capex)}
                                                        </td>
                                                        <td style={{ fontWeight: 600, color: r.metrics.netCashFlow >= 0 ? '#3b82f6' : '#ef4444' }}>
                                                            {money(r.metrics.netCashFlow)}
                                                        </td>
                                                        <td>{ceoPctOf(r.branch)}%</td>
                                                        <td style={{ fontWeight: 700, color: 'var(--color-primary, #b59458)' }}>
                                                            {money(r.ceoShare)}
                                                        </td>
                                                        <td style={{ fontWeight: 700, color: '#3b82f6' }}>
                                                            {money(r.ceoCashShare)}
                                                        </td>
                                                    </tr>
                                                ))}

                                            {/* Subtotal / Consolidated Total */}
                                            <tr className="report-totals-row" style={{ background: 'rgba(181, 148, 88, 0.12)' }}>
                                                <td className="cell-primary" style={{ fontWeight: 700 }} colSpan={2}>
                                                    {isViewingMasterConsolidated ? 'Consolidated Master Total' : 'Operational Salons Subtotal'}
                                                </td>
                                                <td>{money(activeMetrics.revenue)}</td>
                                                <td>{money(activeMetrics.totalCogs)}</td>
                                                <td>{money(activeMetrics.grossProfit)}</td>
                                                <td>{money(activeMetrics.totalExpenses)}</td>
                                                <td style={{ fontWeight: 700, color: activeMetrics.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                                                    {money(activeMetrics.netProfit)}
                                                </td>
                                                <td style={{ fontWeight: 700, color: '#a855f7' }}>
                                                    {money(activeMetrics.capex)}
                                                </td>
                                                <td style={{ fontWeight: 700, color: activeMetrics.netCashFlow >= 0 ? '#3b82f6' : '#ef4444' }}>
                                                    {money(activeMetrics.netCashFlow)}
                                                </td>
                                                <td>—</td>
                                                <td style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-primary, #b59458)' }}>
                                                    {money(isViewingMasterConsolidated ? branchResults.reduce((s, r) => s + r.ceoShare, 0) : operationalCeoShare)}
                                                </td>
                                                <td style={{ fontWeight: 800, fontSize: 15, color: '#3b82f6' }}>
                                                    {money(isViewingMasterConsolidated ? masterCeoCashShare : operationalCeoCashShare)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="report-sign-grid">
                                    <div className="report-sign-block">
                                        <div className="report-sign-line" />
                                        <div className="report-sign-role">Chief Financial Officer</div>
                                    </div>
                                    <div className="report-sign-block">
                                        <div className="report-sign-line" />
                                        <div className="report-sign-role">CEO &amp; Founder</div>
                                    </div>
                                </div>

                                <div className="report-footer">
                                    <div className="report-footer-left">
                                        Christalin Mirrors Luxury Salon Chain · Consolidated Financial Operations
                                    </div>
                                    <div className="report-footer-right">
                                        Confidential · Management Eyes Only
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: DEDICATED OPEX & CAPEX HUB */}
            {activeTab === 'dedicated_hub' && (
                <div>
                    {/* Summary cards for OpEx vs CapEx */}
                    <div className="manual-pl-metrics-grid">
                        <div className="manual-pl-metric-card" style={{ borderLeft: '3px solid #f59e0b' }}>
                            <span className="manual-pl-metric-title">Total Dedicated OpEx</span>
                            <span className="manual-pl-metric-val" style={{ color: '#f59e0b' }}>
                                {money(masterConsolidatedMetrics.totalExpenses)}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                Operating Run-Rate across all branches
                            </span>
                        </div>
                        <div className="manual-pl-metric-card" style={{ borderLeft: '3px solid #a855f7' }}>
                            <span className="manual-pl-metric-title">Total Dedicated CapEx</span>
                            <span className="manual-pl-metric-val" style={{ color: '#a855f7' }}>
                                {money(masterConsolidatedMetrics.capex)}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                Fitout &amp; salon assets deployed this month
                            </span>
                        </div>
                        <div className="manual-pl-metric-card" style={{ borderLeft: '3px solid #6366f1' }}>
                            <span className="manual-pl-metric-title">Upcoming Branches Pre-Launch CapEx</span>
                            <span className="manual-pl-metric-val" style={{ color: '#6366f1' }}>
                                {money(
                                    UPCOMING_BRANCH_NAMES.reduce((s, b) => s + (branchData[b]?.capex || 0), 0)
                                )}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                Yelahanka &amp; Hassan fitout capital deployment
                            </span>
                        </div>
                        <div className="manual-pl-metric-card" style={{ borderLeft: '3px solid var(--color-primary, #b59458)' }}>
                            <span className="manual-pl-metric-title">Total Cash Outflow (OpEx + CapEx)</span>
                            <span className="manual-pl-metric-val" style={{ color: 'var(--color-primary, #b59458)' }}>
                                {money(masterConsolidatedMetrics.totalExpenses + masterConsolidatedMetrics.capex)}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                Gross disbursements for {currMonthLabel}
                            </span>
                        </div>
                    </div>

                    {/* Pre-Launch Fitout & Project Tracker for Upcoming Branches */}
                    <div style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                                    <Hammer size={18} className="text-primary" />
                                    Upcoming Branches — Pre-Launch Fitout &amp; CapEx Trackers
                                </h3>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                                    Dedicated project oversight for new salon additions prior to revenue commencement.
                                </p>
                            </div>
                        </div>

                        <div className="pl-project-grid">
                            {UPCOMING_BRANCH_NAMES.map(b => {
                                const meta = UPCOMING_METADATA[b] || { targetLaunch: 'Q4 2026', location: 'Karnataka', fitoutPct: 50, budget: 1200000 }
                                const bData = branchData[b] || zeroBranchPL()
                                const capexDeployed = bData.capex || 0
                                const preOpeningOpEx = computePLMetrics(bData).totalExpenses
                                const budgetRemaining = Math.max(0, meta.budget - capexDeployed)

                                return (
                                    <div key={b} className="pl-project-card">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-bright)' }}>
                                                    {b}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                                    📍 {meta.location}
                                                </div>
                                            </div>
                                            <span className="pl-badge-upcoming">
                                                Launch: {meta.targetLaunch}
                                            </span>
                                        </div>

                                        {/* Fitout Completion Bar */}
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Interior Fitout Completion</span>
                                                <span style={{ fontWeight: 700, color: '#6366f1' }}>{meta.fitoutPct}%</span>
                                            </div>
                                            <div className="pl-progress-bar-bg">
                                                <div className="pl-progress-bar-fill" style={{ width: `${meta.fitoutPct}%` }} />
                                            </div>
                                        </div>

                                        {/* Metrics Mini-Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                            <div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>CapEx Invested</div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: '#a855f7' }}>{money(capexDeployed)}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pre-Opening OpEx</div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>{money(preOpeningOpEx)}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rent / Lease</div>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>{money(Number(bData.rent_lease) || 0)}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Budget Cap Remaining</div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>{money(budgetRemaining)}</div>
                                            </div>
                                        </div>

                                        {/* Quick Action Buttons */}
                                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                            <button
                                                className="admin-btn admin-btn-sm admin-btn-secondary"
                                                style={{ flex: 1, justifyContent: 'center', gap: 6 }}
                                                onClick={() => {
                                                    setAddExpenseModalType('capex')
                                                    setIsAddExpenseModalOpen(true)
                                                }}
                                            >
                                                <Plus size={13} /> Add CapEx
                                            </button>
                                            <button
                                                className="admin-btn admin-btn-sm admin-btn-ghost"
                                                style={{ flex: 1, justifyContent: 'center', gap: 6 }}
                                                onClick={() => {
                                                    setAddExpenseModalType('opex')
                                                    setIsAddExpenseModalOpen(true)
                                                }}
                                            >
                                                <Plus size={13} /> Add OpEx
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Dedicated OpEx & CapEx Cross-Branch Comparison Matrix */}
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Layers size={18} className="text-primary" />
                                    Dedicated Cross-Branch Expense Comparison Matrix
                                </h3>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                                    Side-by-side OpEx and CapEx audit across Bengaluru, Kalaburagi, Belgaum, Manea (Under CEO), and upcoming branches.
                                </p>
                            </div>
                        </div>

                        <div className="table-scroll">
                            <table className="admin-table report-table manual-pl-table pl-matrix-table">
                                <thead>
                                    <tr>
                                        <th style={{ minWidth: 200 }}>Category / Line Item</th>
                                        <th>Bengaluru</th>
                                        <th>Kalaburagi</th>
                                        <th>Belgaum</th>
                                        <th style={{ color: '#d97706' }}>Manea ★ (CEO)</th>
                                        <th style={{ color: '#6366f1' }}>Upcoming 1 (Yelahanka)</th>
                                        <th style={{ color: '#6366f1' }}>Upcoming 2 (Hassan)</th>
                                        <th className="matrix-total">Operating Salons</th>
                                        <th className="matrix-total" style={{ background: 'rgba(181, 148, 88, 0.15)' }}>Grand Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* SECTION 1: OPEX */}
                                    <tr className="matrix-section-hdr">
                                        <td colSpan={9}>Section A: Dedicated Operating Expenses (OpEx)</td>
                                    </tr>
                                    {OPEX_KEYS.map(k => {
                                        const opSum = OPERATIONAL_BRANCH_NAMES.reduce((s, b) => s + (Number(branchData[b]?.[k.key]) || 0), 0)
                                        const masterSum = ALL_SALON_BRANCH_NAMES.reduce((s, b) => s + (Number(branchData[b]?.[k.key]) || 0), 0)

                                        return (
                                            <tr key={k.key}>
                                                <td className="cell-primary">{k.label}</td>
                                                {ALL_SALON_BRANCH_NAMES.map(b => (
                                                    <td key={b}>
                                                        {money(Number(branchData[b]?.[k.key]) || 0)}
                                                    </td>
                                                ))}
                                                <td className="matrix-total">{money(opSum)}</td>
                                                <td className="matrix-total" style={{ fontWeight: 700 }}>{money(masterSum)}</td>
                                            </tr>
                                        )
                                    })}
                                    <tr className="report-totals-row" style={{ background: 'rgba(245, 158, 11, 0.08)' }}>
                                        <td className="cell-primary" style={{ fontWeight: 700 }}>Total Operating Expenses (OpEx)</td>
                                        {ALL_SALON_BRANCH_NAMES.map(b => (
                                            <td key={b} style={{ fontWeight: 700, color: '#f59e0b' }}>
                                                {money(computePLMetrics(branchData[b] || zeroBranchPL()).totalExpenses)}
                                            </td>
                                        ))}
                                        <td className="matrix-total" style={{ fontWeight: 700, color: '#f59e0b' }}>
                                            {money(operationalMetrics.totalExpenses)}
                                        </td>
                                        <td className="matrix-total" style={{ fontWeight: 800, color: '#f59e0b' }}>
                                            {money(masterConsolidatedMetrics.totalExpenses)}
                                        </td>
                                    </tr>

                                    {/* SECTION 2: CAPEX */}
                                    <tr className="matrix-section-hdr">
                                        <td colSpan={9}>Section B: Dedicated Capital Expenditure Outlays (CapEx)</td>
                                    </tr>
                                    <tr>
                                        <td className="cell-primary">Civil &amp; Interior Fitout</td>
                                        {ALL_SALON_BRANCH_NAMES.map(b => {
                                            const items = (branchData[b]?.capex_items || []).filter(i => i.category === 'fitout')
                                            const sum = items.reduce((s, i) => s + i.amount, 0)
                                            return <td key={b}>{money(sum)}</td>
                                        })}
                                        <td className="matrix-total">{money(OPERATIONAL_BRANCH_NAMES.reduce((s, b) => s + (branchData[b]?.capex_items || []).filter(i => i.category === 'fitout').reduce((ss, ii) => ss + ii.amount, 0), 0))}</td>
                                        <td className="matrix-total">{money(ALL_SALON_BRANCH_NAMES.reduce((s, b) => s + (branchData[b]?.capex_items || []).filter(i => i.category === 'fitout').reduce((ss, ii) => ss + ii.amount, 0), 0))}</td>
                                    </tr>
                                    <tr>
                                        <td className="cell-primary">Styling Stations &amp; Hydraulic Chairs</td>
                                        {ALL_SALON_BRANCH_NAMES.map(b => {
                                            const items = (branchData[b]?.capex_items || []).filter(i => i.category === 'salon_chairs')
                                            const sum = items.reduce((s, i) => s + i.amount, 0)
                                            return <td key={b}>{money(sum)}</td>
                                        })}
                                        <td className="matrix-total">{money(OPERATIONAL_BRANCH_NAMES.reduce((s, b) => s + (branchData[b]?.capex_items || []).filter(i => i.category === 'salon_chairs').reduce((ss, ii) => ss + ii.amount, 0), 0))}</td>
                                        <td className="matrix-total">{money(ALL_SALON_BRANCH_NAMES.reduce((s, b) => s + (branchData[b]?.capex_items || []).filter(i => i.category === 'salon_chairs').reduce((ss, ii) => ss + ii.amount, 0), 0))}</td>
                                    </tr>
                                    <tr>
                                        <td className="cell-primary">Shampoo Stations &amp; Backwash Units</td>
                                        {ALL_SALON_BRANCH_NAMES.map(b => {
                                            const items = (branchData[b]?.capex_items || []).filter(i => i.category === 'wash_stations')
                                            const sum = items.reduce((s, i) => s + i.amount, 0)
                                            return <td key={b}>{money(sum)}</td>
                                        })}
                                        <td className="matrix-total">{money(OPERATIONAL_BRANCH_NAMES.reduce((s, b) => s + (branchData[b]?.capex_items || []).filter(i => i.category === 'wash_stations').reduce((ss, ii) => ss + ii.amount, 0), 0))}</td>
                                        <td className="matrix-total">{money(ALL_SALON_BRANCH_NAMES.reduce((s, b) => s + (branchData[b]?.capex_items || []).filter(i => i.category === 'wash_stations').reduce((ss, ii) => ss + ii.amount, 0), 0))}</td>
                                    </tr>
                                    <tr>
                                        <td className="cell-primary">HVAC, Air Conditioning &amp; Electrical</td>
                                        {ALL_SALON_BRANCH_NAMES.map(b => {
                                            const items = (branchData[b]?.capex_items || []).filter(i => i.category === 'hvac')
                                            const sum = items.reduce((s, i) => s + i.amount, 0)
                                            return <td key={b}>{money(sum)}</td>
                                        })}
                                        <td className="matrix-total">{money(OPERATIONAL_BRANCH_NAMES.reduce((s, b) => s + (branchData[b]?.capex_items || []).filter(i => i.category === 'hvac').reduce((ss, ii) => ss + ii.amount, 0), 0))}</td>
                                        <td className="matrix-total">{money(ALL_SALON_BRANCH_NAMES.reduce((s, b) => s + (branchData[b]?.capex_items || []).filter(i => i.category === 'hvac').reduce((ss, ii) => ss + ii.amount, 0), 0))}</td>
                                    </tr>
                                    <tr>
                                        <td className="cell-primary">Storefront Signage &amp; Branding</td>
                                        {ALL_SALON_BRANCH_NAMES.map(b => {
                                            const items = (branchData[b]?.capex_items || []).filter(i => i.category === 'signage')
                                            const sum = items.reduce((s, i) => s + i.amount, 0)
                                            return <td key={b}>{money(sum)}</td>
                                        })}
                                        <td className="matrix-total">{money(OPERATIONAL_BRANCH_NAMES.reduce((s, b) => s + (branchData[b]?.capex_items || []).filter(i => i.category === 'signage').reduce((ss, ii) => ss + ii.amount, 0), 0))}</td>
                                        <td className="matrix-total">{money(ALL_SALON_BRANCH_NAMES.reduce((s, b) => s + (branchData[b]?.capex_items || []).filter(i => i.category === 'signage').reduce((ss, ii) => ss + ii.amount, 0), 0))}</td>
                                    </tr>
                                    <tr>
                                        <td className="cell-primary">Other Machinery &amp; Fixed Assets</td>
                                        {ALL_SALON_BRANCH_NAMES.map(b => {
                                            const items = (branchData[b]?.capex_items || []).filter(i => !['fitout', 'salon_chairs', 'wash_stations', 'hvac', 'signage'].includes(i.category))
                                            const sum = items.reduce((s, i) => s + i.amount, 0)
                                            return <td key={b}>{money(sum)}</td>
                                        })}
                                        <td className="matrix-total">{money(OPERATIONAL_BRANCH_NAMES.reduce((s, b) => s + (branchData[b]?.capex_items || []).filter(i => !['fitout', 'salon_chairs', 'wash_stations', 'hvac', 'signage'].includes(i.category)).reduce((ss, ii) => ss + ii.amount, 0), 0))}</td>
                                        <td className="matrix-total">{money(ALL_SALON_BRANCH_NAMES.reduce((s, b) => s + (branchData[b]?.capex_items || []).filter(i => !['fitout', 'salon_chairs', 'wash_stations', 'hvac', 'signage'].includes(i.category)).reduce((ss, ii) => ss + ii.amount, 0), 0))}</td>
                                    </tr>
                                    <tr className="report-totals-row" style={{ background: 'rgba(168, 85, 247, 0.08)' }}>
                                        <td className="cell-primary" style={{ fontWeight: 700 }}>Total Capital Expenditures (CapEx)</td>
                                        {ALL_SALON_BRANCH_NAMES.map(b => (
                                            <td key={b} style={{ fontWeight: 700, color: '#a855f7' }}>
                                                {money(branchData[b]?.capex || 0)}
                                            </td>
                                        ))}
                                        <td className="matrix-total" style={{ fontWeight: 700, color: '#a855f7' }}>
                                            {money(operationalMetrics.capex)}
                                        </td>
                                        <td className="matrix-total" style={{ fontWeight: 800, color: '#a855f7' }}>
                                            {money(masterConsolidatedMetrics.capex)}
                                        </td>
                                    </tr>

                                    {/* SECTION 3: TOTAL CASH OUTFLOW */}
                                    <tr className="report-totals-row" style={{ background: 'rgba(181, 148, 88, 0.16)' }}>
                                        <td className="cell-primary" style={{ fontWeight: 800, fontSize: 13 }}>
                                            Total Cash Outflow (OpEx + CapEx)
                                        </td>
                                        {ALL_SALON_BRANCH_NAMES.map(b => {
                                            const op = computePLMetrics(branchData[b] || zeroBranchPL()).totalExpenses
                                            const cap = branchData[b]?.capex || 0
                                            return (
                                                <td key={b} style={{ fontWeight: 800, color: 'var(--color-primary, #b59458)' }}>
                                                    {money(op + cap)}
                                                </td>
                                            )
                                        })}
                                        <td className="matrix-total" style={{ fontWeight: 800, color: 'var(--color-primary, #b59458)' }}>
                                            {money(operationalMetrics.totalExpenses + operationalMetrics.capex)}
                                        </td>
                                        <td className="matrix-total" style={{ fontWeight: 900, fontSize: 14, color: 'var(--color-primary, #b59458)' }}>
                                            {money(masterConsolidatedMetrics.totalExpenses + masterConsolidatedMetrics.capex)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Dedicated Items Registry (Searchable & Filterable) */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Tag size={16} className="text-primary" />
                                    Itemized Dedicated OpEx &amp; CapEx Registry
                                </h3>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                                    Individual line-item audit trail of custom expenses and capital assets logged for {currMonthLabel}.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <select
                                    className="admin-filter-select"
                                    value={registryFilterBranch}
                                    onChange={e => setRegistryFilterBranch(e.target.value)}
                                >
                                    <option value="all">All Branches</option>
                                    {ALL_SALON_BRANCH_NAMES.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>

                                <select
                                    className="admin-filter-select"
                                    value={registryFilterType}
                                    onChange={e => setRegistryFilterType(e.target.value as any)}
                                >
                                    <option value="all">All Types (OpEx &amp; CapEx)</option>
                                    <option value="opex">OpEx Only</option>
                                    <option value="capex">CapEx Only</option>
                                </select>

                                <button
                                    className="admin-btn admin-btn-sm admin-btn-primary"
                                    onClick={() => {
                                        setAddExpenseModalType(registryFilterType === 'capex' ? 'capex' : 'opex')
                                        setIsAddExpenseModalOpen(true)
                                    }}
                                    style={{ gap: 6 }}
                                >
                                    <Plus size={13} />
                                    <span>Log Expense</span>
                                </button>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="table-scroll">
                            <table className="admin-table report-table" style={{ fontSize: 13 }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: 100 }}>Date</th>
                                        <th style={{ width: 140 }}>Branch</th>
                                        <th style={{ width: 90 }}>Type</th>
                                        <th>Description</th>
                                        <th style={{ width: 140 }}>Category</th>
                                        <th>Notes / Vendor</th>
                                        <th style={{ textAlign: 'right', width: 130 }}>Amount (₹)</th>
                                        <th style={{ width: 44 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Combine and filter items */}
                                    {(() => {
                                        const combined: {
                                            id: string
                                            branch: string
                                            type: 'opex' | 'capex'
                                            date: string
                                            title: string
                                            category: string
                                            amount: number
                                            notes?: string
                                        }[] = []

                                        if (registryFilterType !== 'capex') {
                                            allOpExItems.forEach(({ branch, item }) => {
                                                if (registryFilterBranch === 'all' || registryFilterBranch === branch) {
                                                    combined.push({
                                                        id: item.id,
                                                        branch,
                                                        type: 'opex',
                                                        date: item.date,
                                                        title: item.title,
                                                        category: item.category,
                                                        amount: item.amount,
                                                        notes: item.notes,
                                                    })
                                                }
                                            })
                                        }

                                        if (registryFilterType !== 'opex') {
                                            allCapExItems.forEach(({ branch, item }) => {
                                                if (registryFilterBranch === 'all' || registryFilterBranch === branch) {
                                                    combined.push({
                                                        id: item.id,
                                                        branch,
                                                        type: 'capex',
                                                        date: item.date,
                                                        title: item.title,
                                                        category: item.category,
                                                        amount: item.amount,
                                                        notes: item.notes,
                                                    })
                                                }
                                            })
                                        }

                                        combined.sort((a, b) => b.date.localeCompare(a.date))

                                        if (combined.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                                                        No custom OpEx or CapEx items recorded for this filter. Click "+ Log Expense" or "Import Excel" to add items.
                                                    </td>
                                                </tr>
                                            )
                                        }

                                        return combined.map(row => (
                                            <tr key={`${row.type}-${row.id}`}>
                                                <td style={{ whiteSpace: 'nowrap' }}>{row.date}</td>
                                                <td style={{ fontWeight: 600 }}>
                                                    {row.branch}
                                                    {row.branch === 'Manea' && <span style={{ color: '#d97706', marginLeft: 4 }}>★</span>}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        padding: '2px 6px',
                                                        borderRadius: 4,
                                                        background: row.type === 'capex' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                                        color: row.type === 'capex' ? '#a855f7' : '#f59e0b',
                                                    }}>
                                                        {row.type.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 600 }}>{row.title}</td>
                                                <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                                                    {row.category.replace(/_/g, ' ')}
                                                </td>
                                                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                    {row.notes || '—'}
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: row.type === 'capex' ? '#a855f7' : '#f59e0b' }}>
                                                    {money(row.amount)}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        type="button"
                                                        className="admin-btn-icon text-muted"
                                                        onClick={() => {
                                                            if (row.type === 'capex') {
                                                                handleRemoveCapExItem(row.branch, row.id)
                                                            } else {
                                                                handleRemoveOpExItem(row.branch, row.id)
                                                            }
                                                        }}
                                                        title="Delete expense"
                                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Excel OpEx & CapEx Import Modal */}
            <ImportExcelExpensesModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                defaultBranch={isViewingConsolidated ? 'Bengaluru' : selectedBranch}
                currentMonthKey={monthKey}
                onImportSuccess={handleImportSuccess}
            />

            {/* Google Sheets Two-Way Sync Modal */}
            <GoogleSheetsSyncModal
                isOpen={isGoogleSheetsModalOpen}
                onClose={() => setIsGoogleSheetsModalOpen(false)}
                onSyncComplete={res => {
                    if (res.success) {
                        setStatusMsg(`Google Sheets synchronized! (${res.pulledSales} sales & ${res.pulledExpenses} expenses pulled, ${res.pushedSales} sales pushed)`)
                        setTimeout(() => setStatusMsg(null), 4500)
                        handleSyncFromManualDailySales(false)
                    }
                }}
            />

            {/* Add Dedicated Expense Item Modal */}
            <AddExpenseItemModal
                isOpen={isAddExpenseModalOpen}
                onClose={() => setIsAddExpenseModalOpen(false)}
                defaultBranch={isViewingConsolidated ? 'Bengaluru' : selectedBranch}
                defaultType={addExpenseModalType}
                currentMonthKey={monthKey}
                onSuccess={handleExpenseAdded}
            />
        </div>
    )
}
