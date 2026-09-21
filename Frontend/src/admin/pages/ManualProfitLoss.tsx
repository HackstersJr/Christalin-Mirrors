import { useState, useEffect, useId } from 'react'
import {
    Printer,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Check,
    RefreshCw,
    Save,
    RotateCcw,
    FileSpreadsheet,
    DollarSign,
    TrendingUp,
    Briefcase,
    Upload,
    Download,
    Layers,
    Trash2,
    Sparkles
} from 'lucide-react'
import cmLogo from '../../assets/cm-logo-white.png'
import { branches as branchList } from '../../data/branches'
import {
    manualProfitLossStore,
    computePLMetrics,
    zeroBranchPL,
    COGS_KEYS,
    OPEX_KEYS,
    type ManualBranchPL,
} from '../data/manualProfitLossStore'
import { manualSalesStore } from '../data/manualSalesStore'
import ImportExcelExpensesModal from '../components/ImportExcelExpensesModal'
import { downloadSampleExcelTemplate, type ImportExpenseSummary } from '../data/excelExpenseParser'
import './Reports.css'
import './ProfitLoss.css'
import './ManualProfitLoss.css'

const branchNames: string[] = branchList.map(b => b.name.replace('CM — ', '').replace(/\s*\([^)]*\)$/, ''))

function money(n: number): string {
    return `₹${Math.round(n).toLocaleString()}`
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
}

function ceoPctOf(branch: string): number {
    return OWNERSHIP[branch]?.find(s => s.isCeo)?.pct || 0
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
    const [selectedBranch, setSelectedBranch] = useState<string>(branchNames[0])
    const [isEditMode, setIsEditMode] = useState<boolean>(true)
    const [loading, setLoading] = useState<boolean>(true)
    const [syncing, setSyncing] = useState<boolean>(false)
    const [statusMsg, setStatusMsg] = useState<string | null>(null)
    const [branchData, setBranchData] = useState<Record<string, ManualBranchPL>>({})
    const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false)

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
                if (saved && (saved.hairServices > 0 || saved.retailSales > 0 || saved.salaries_wages > 0 || (saved.capex || 0) > 0)) {
                    init[b] = {
                        ...saved,
                        hairServices: manualService,
                        retailSales: manualRetail,
                        capex: saved.capex || 0,
                        capex_items: saved.capex_items || [],
                        opex_items: saved.opex_items || [],
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
                        rent_lease: b === 'Bengaluru' ? 45000 : 30000,
                        depreciation: 4000,
                        debts_loans: 0,
                        capex: 0,
                        capex_items: [],
                        opex_items: [],
                        notes: activeDays > 0 ? `Synced from Manual Daily Sales (${activeDays} active days).` : undefined,
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

    function handleImportSuccess(summary: ImportExpenseSummary, affectedMonths: string[]) {
        // Refresh local branchData
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
        setStatusMsg(`Cleared P&L data for ${monthLabel(monthKey)}. Click "Sync from Manual Daily Sales" to reload.`)
        setTimeout(() => setStatusMsg(null), 3500)
    }

    const currMonthLabel = monthLabel(monthKey)
    const prevMonthLabel = monthLabel(prevMonthKey)
    const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

    // Active branch metrics or all branches consolidated
    const activeData = branchData[selectedBranch] || zeroBranchPL()
    const activeMetrics = computePLMetrics(activeData)

    // Consolidated metrics
    const consolidatedPL = branchNames.reduce((acc: ManualBranchPL, b: string) => {
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

    const consolidatedMetrics = computePLMetrics(consolidatedPL)

    const branchResults: {
        branch: string
        data: ManualBranchPL
        metrics: ReturnType<typeof computePLMetrics>
        ceoShare: number
        ceoCashShare: number
    }[] = branchNames.map((b: string) => {
        const d = branchData[b] || zeroBranchPL()
        const m = computePLMetrics(d)
        const ceoPct = ceoPctOf(b) / 100
        return {
            branch: b,
            data: d,
            metrics: m,
            ceoShare: m.netProfit * ceoPct,
            ceoCashShare: m.netCashFlow * ceoPct,
        }
    })

    const totalCeoShare = branchResults.reduce((s: number, r: { ceoShare: number }) => s + r.ceoShare, 0)
    const totalCeoCashShare = branchResults.reduce((s: number, r: { ceoCashShare: number }) => s + r.ceoCashShare, 0)

    return (
        <div>
            {/* Header & Controls */}
            <div className="no-print manual-pl-toolbar">
                <div>
                    <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <FileSpreadsheet className="text-primary" size={24} />
                        Manual Profit &amp; Loss
                    </h1>
                    <p className="admin-page-sub">
                        Direct editable statement taking revenue directly from Manual Daily Sales with multi-branch CEO Share calculations
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
                        {branchNames.map((b: string) => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                        <option value="all">All Branches (Consolidated)</option>
                    </select>

                    {/* Sync from Manual Daily Sales Button */}
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

                    {/* Import OpEx & CapEx from Excel */}
                    <button
                        id="manual-pl-import-excel-btn"
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => setIsImportModalOpen(true)}
                        title="Import operating expenses and capital expenditure investments from Excel spreadsheet"
                        style={{ gap: 6 }}
                    >
                        <FileSpreadsheet size={14} className="text-primary" />
                        Import OpEx &amp; CapEx
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

            {statusMsg && (
                <div className="no-print admin-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 16px', borderRadius: 8, marginBottom: 16 }}>
                    {statusMsg}
                </div>
            )}

            {/* Quick KPI Overview */}
            <div className="no-print manual-pl-metrics-grid">
                <div className="manual-pl-metric-card">
                    <span className="manual-pl-metric-title">Gross Revenue ({selectedBranch === 'all' ? 'All' : selectedBranch})</span>
                    <span className="manual-pl-metric-val">
                        {money(selectedBranch === 'all' ? consolidatedMetrics.revenue : activeMetrics.revenue)}
                    </span>
                </div>
                <div className="manual-pl-metric-card">
                    <span className="manual-pl-metric-title">Gross Profit</span>
                    <span className="manual-pl-metric-val">
                        {money(selectedBranch === 'all' ? consolidatedMetrics.grossProfit : activeMetrics.grossProfit)}
                    </span>
                </div>
                <div className="manual-pl-metric-card">
                    <span className="manual-pl-metric-title">Operating Expenses (OpEx)</span>
                    <span className="manual-pl-metric-val">
                        {money(selectedBranch === 'all' ? consolidatedMetrics.totalExpenses : activeMetrics.totalExpenses)}
                    </span>
                </div>
                <div className="manual-pl-metric-card">
                    <span className="manual-pl-metric-title">Operating Net Profit</span>
                    <span className={`manual-pl-metric-val ${(selectedBranch === 'all' ? consolidatedMetrics.netProfit : activeMetrics.netProfit) >= 0 ? 'positive' : 'negative'}`}>
                        {money(selectedBranch === 'all' ? consolidatedMetrics.netProfit : activeMetrics.netProfit)}
                    </span>
                </div>
                <div className="manual-pl-metric-card">
                    <span className="manual-pl-metric-title">CapEx Outlay (Assets)</span>
                    <span className="manual-pl-metric-val" style={{ color: '#a855f7' }}>
                        {money(selectedBranch === 'all' ? consolidatedMetrics.capex : activeMetrics.capex)}
                    </span>
                </div>
                <div className="manual-pl-metric-card">
                    <span className="manual-pl-metric-title">Net Cash Retained</span>
                    <span className={`manual-pl-metric-val ${(selectedBranch === 'all' ? consolidatedMetrics.netCashFlow : activeMetrics.netCashFlow) >= 0 ? 'positive' : 'negative'}`}>
                        {money(selectedBranch === 'all' ? consolidatedMetrics.netCashFlow : activeMetrics.netCashFlow)}
                    </span>
                </div>
                <div className="manual-pl-metric-card">
                    <span className="manual-pl-metric-title">Total CEO Profit Share</span>
                    <span className="manual-pl-metric-val text-primary">
                        {money(totalCeoShare)}
                    </span>
                </div>
            </div>

            {/* Document Printable Statement Sheet */}
            <div className="report-sheet print-doc">
                {/* When a specific branch is selected, render that branch's statement */}
                {selectedBranch !== 'all' ? (
                    <div>
                        {/* Letterhead */}
                        <div className="report-letterhead">
                            <div className="report-letterhead-main">
                                <img src={cmLogo} alt="Christalin Mirrors" className="report-logo" />
                                <div>
                                    <div className="report-title">Christalin Mirrors — {selectedBranch} — Profit &amp; Loss Statement</div>
                                    <div className="report-range">For the Month Ended {currMonthLabel} · Manual Statement</div>
                                </div>
                            </div>
                            <div className="report-letterhead-meta">
                                <div><span>Report No.</span> CM/PL-MANUAL/{selectedBranch.slice(0, 3).toUpperCase()}/{monthKey.replace('-', '')}</div>
                                <div><span>Source</span> Manual Daily Sales &amp; Custom Expenses</div>
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
                        <div className="report-section-title">Operating Expenses</div>
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
                                                <span style={{ color: '#a855f7' }}>●</span> Capital Expenditures (CapEx)
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                                Fixed assets, salon equipment, chairs, machines, AC installations, renovation (imported from Excel)
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
                                        Itemized CapEx Assets for {currMonthLabel} ({activeData.capex_items.length} recorded items)
                                    </div>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        Imported from Excel CapEx Sheet
                                    </span>
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
                                    {(OWNERSHIP[selectedBranch] || []).map(sh => (
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
                                Christalin Mirrors Luxury Salon · {selectedBranch} Branch · Manual P&amp;L Statement
                            </div>
                            <div className="report-footer-right">
                                Confidential · Management Eyes Only
                            </div>
                        </div>
                    </div>
                ) : (
                    /* All Branches Consolidated View */
                    <div>
                        {/* Consolidated Letterhead */}
                        <div className="report-letterhead">
                            <div className="report-letterhead-main">
                                <img src={cmLogo} alt="Christalin Mirrors" className="report-logo" />
                                <div>
                                    <div className="report-title">Christalin Mirrors — Consolidated Profit &amp; Loss</div>
                                    <div className="report-range">For the Month Ended {currMonthLabel} · All Branches</div>
                                </div>
                            </div>
                            <div className="report-letterhead-meta">
                                <div><span>Report No.</span> CM/PL-MANUAL/ALL/{monthKey.replace('-', '')}</div>
                                <div><span>Source</span> Aggregated Manual Daily Sales &amp; Branch Records</div>
                                <div><span>Generated</span> {generatedAt}</div>
                            </div>
                        </div>

                        {/* Branch-by-Branch Comparison Table */}
                        <div className="report-section-title">All Branches Revenue, CapEx &amp; Profit Summary</div>
                        <div className="table-scroll">
                            <table className="admin-table report-table manual-pl-table">
                                <thead>
                                    <tr>
                                        <th>Branch</th>
                                        <th>Gross Revenue</th>
                                        <th>Total COGS</th>
                                        <th>Gross Profit</th>
                                        <th>OpEx</th>
                                        <th>Operating Profit</th>
                                        <th>CapEx Outlay</th>
                                        <th>Net Cash Retained</th>
                                        <th>CEO Ownership</th>
                                        <th>CEO Profit Share</th>
                                        <th>CEO Cash Share</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branchResults.map((r: {
                                        branch: string
                                        data: ManualBranchPL
                                        metrics: ReturnType<typeof computePLMetrics>
                                        ceoShare: number
                                        ceoCashShare: number
                                    }) => (
                                        <tr key={r.branch}>
                                            <td className="cell-primary" style={{ fontWeight: 600 }}>{r.branch}</td>
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
                                    <tr className="report-totals-row" style={{ background: 'rgba(181, 148, 88, 0.1)' }}>
                                        <td className="cell-primary" style={{ fontWeight: 700 }}>Consolidated Total</td>
                                        <td>{money(consolidatedMetrics.revenue)}</td>
                                        <td>{money(consolidatedMetrics.totalCogs)}</td>
                                        <td>{money(consolidatedMetrics.grossProfit)}</td>
                                        <td>{money(consolidatedMetrics.totalExpenses)}</td>
                                        <td style={{ fontWeight: 700, color: consolidatedMetrics.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                                            {money(consolidatedMetrics.netProfit)}
                                        </td>
                                        <td style={{ fontWeight: 700, color: '#a855f7' }}>
                                            {money(consolidatedMetrics.capex)}
                                        </td>
                                        <td style={{ fontWeight: 700, color: consolidatedMetrics.netCashFlow >= 0 ? '#3b82f6' : '#ef4444' }}>
                                            {money(consolidatedMetrics.netCashFlow)}
                                        </td>
                                        <td>—</td>
                                        <td style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-primary, #b59458)' }}>
                                            {money(totalCeoShare)}
                                        </td>
                                        <td style={{ fontWeight: 800, fontSize: 15, color: '#3b82f6' }}>
                                            {money(totalCeoCashShare)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Each Branch's Full Breakdown on Separate Pages for Printing */}
                        {branchResults.map((r: { branch: string; data: ManualBranchPL; metrics: ReturnType<typeof computePLMetrics>; ceoShare: number }, idx: number) => (
                            <div key={r.branch} className="pl-page-break">
                                <div className="report-section-title" style={{ fontSize: 16 }}>
                                    Branch Statement: {r.branch} — {currMonthLabel}
                                </div>
                                <div className="table-scroll">
                                    <table className="admin-table report-table manual-pl-table">
                                        <thead>
                                            <tr>
                                                <th>Line Item</th>
                                                <th style={{ width: 160 }}>Category</th>
                                                <th style={{ width: 160 }}>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td className="cell-primary">Hair Services</td><td>Revenue</td><td>{money(r.data.hairServices)}</td></tr>
                                            <tr><td className="cell-primary">Other Services</td><td>Revenue</td><td>{money(r.data.otherServices)}</td></tr>
                                            <tr><td className="cell-primary">Retail Sales</td><td>Revenue</td><td>{money(r.data.retailSales)}</td></tr>
                                            <tr className="report-totals-row"><td className="cell-primary">Total Revenue</td><td>Revenue</td><td>{money(r.metrics.revenue)}</td></tr>

                                            <tr><td className="cell-primary">Hair &amp; Retail Product Cost</td><td>COGS</td><td>{money(r.data.productCost)}</td></tr>
                                            {COGS_KEYS.map(c => (
                                                <tr key={c.key}><td className="cell-primary">{c.label}</td><td>COGS</td><td>{money(Number(r.data[c.key]) || 0)}</td></tr>
                                            ))}
                                            <tr className="report-totals-row"><td className="cell-primary">Total COGS</td><td>COGS</td><td>{money(r.metrics.totalCogs)}</td></tr>
                                            <tr className="report-totals-row" style={{ background: 'rgba(181, 148, 88, 0.08)' }}><td className="cell-primary">Gross Profit</td><td>Gross Margin</td><td>{money(r.metrics.grossProfit)}</td></tr>

                                            {OPEX_KEYS.map(c => (
                                                <tr key={c.key}><td className="cell-primary">{c.label}</td><td>OPEX</td><td>{money(Number(r.data[c.key]) || 0)}</td></tr>
                                            ))}
                                            <tr className="report-totals-row"><td className="cell-primary">Total Expenses</td><td>OPEX</td><td>{money(r.metrics.totalExpenses)}</td></tr>
                                            <tr className="report-totals-row pl-net-profit-row" style={{ background: r.metrics.netProfit >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                                                <td className="cell-primary">Net Profit</td>
                                                <td>Bottom Line</td>
                                                <td style={{ fontWeight: 700, color: r.metrics.netProfit >= 0 ? '#10b981' : '#ef4444' }}>{money(r.metrics.netProfit)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="report-section-title" style={{ marginTop: 16 }}>Profit Split — {r.branch}</div>
                                <div className="table-scroll">
                                    <table className="admin-table report-table pl-line-table">
                                        <thead>
                                            <tr>
                                                <th>Partner</th>
                                                <th>Share %</th>
                                                <th>Share of Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(OWNERSHIP[r.branch] || []).map(sh => (
                                                <tr key={sh.label} className={sh.isCeo ? 'pl-ceo-row' : ''}>
                                                    <td className="cell-primary">{sh.label}</td>
                                                    <td>{sh.pct}%</td>
                                                    <td>{money(r.metrics.netProfit * (sh.pct / 100))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}

                        <div className="report-sign-grid">
                            <div className="report-sign-block">
                                <div className="report-sign-line" />
                                <div className="report-sign-role">Finance Controller</div>
                            </div>
                            <div className="report-sign-block">
                                <div className="report-sign-line" />
                                <div className="report-sign-role">CEO / Founder Signature</div>
                            </div>
                        </div>

                        <div className="report-footer">
                            <div className="report-footer-left">
                                Christalin Mirrors Luxury Salon Chain · Consolidated Manual P&amp;L
                            </div>
                            <div className="report-footer-right">
                                Confidential · Management Eyes Only
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Excel OpEx & CapEx Import Modal */}
            <ImportExcelExpensesModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                defaultBranch={selectedBranch === 'all' ? branchNames[0] : selectedBranch}
                currentMonthKey={monthKey}
                onImportSuccess={handleImportSuccess}
            />
        </div>
    )
}
