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
    Briefcase
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
    const [extracting, setExtracting] = useState<boolean>(false)
    const [statusMsg, setStatusMsg] = useState<string | null>(null)
    const [branchData, setBranchData] = useState<Record<string, ManualBranchPL>>({})

    const prevMonthKey = shiftMonth(monthKey, -1)
    const editModeId = useId()

    // Fetch on month change
    useEffect(() => {
        let active = true
        setLoading(true)
        manualProfitLossStore.fetchMonth(monthKey).then(allData => {
            if (!active) return
            const monthObj = allData[monthKey] || {}
            // Initialize for all branches
            const init: Record<string, ManualBranchPL> = {}
            for (const b of branchNames) {
                init[b] = monthObj[b] || manualProfitLossStore.getBranchData(monthKey, b)
            }
            setBranchData(init)
            setLoading(false)

            // Auto-prefill if completely empty
            const hasData = branchNames.some((b: string) => {
                const d = init[b]
                return d && (d.hairServices > 0 || d.otherServices > 0 || d.retailSales > 0)
            })
            if (!hasData) {
                handleExtractFromInvoices(false)
            }
        })
        return () => {
            active = false
        }
    }, [monthKey])

    async function handleExtractFromInvoices(notify = true) {
        setExtracting(true)
        try {
            const updated: Record<string, ManualBranchPL> = { ...branchData }
            let totalInvoices = 0

            for (const b of branchNames) {
                const res = await manualProfitLossStore.extractFromInvoices(monthKey, b)
                updated[b] = res.data
                totalInvoices += res.invoiceCount
                manualProfitLossStore.setBranchData(monthKey, b, res.data)
            }

            setBranchData(updated)
            if (notify) {
                setStatusMsg(`Successfully extracted data from ${totalInvoices} paid invoices for ${monthLabel(monthKey)}!`)
                setTimeout(() => setStatusMsg(null), 4000)
            }
        } catch (err) {
            console.error('Failed to extract from invoices', err)
            setStatusMsg('Error extracting from invoices.')
            setTimeout(() => setStatusMsg(null), 3000)
        } finally {
            setExtracting(false)
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
        setStatusMsg(`Cleared P&L data for ${monthLabel(monthKey)}. Click "Prefill from Invoices" to reload.`)
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
        }
    }, zeroBranchPL())

    const consolidatedMetrics = computePLMetrics(consolidatedPL)

    const branchResults: { branch: string; data: ManualBranchPL; metrics: ReturnType<typeof computePLMetrics>; ceoShare: number }[] = branchNames.map((b: string) => {
        const d = branchData[b] || zeroBranchPL()
        const m = computePLMetrics(d)
        return {
            branch: b,
            data: d,
            metrics: m,
            ceoShare: m.netProfit * (ceoPctOf(b) / 100),
        }
    })

    const totalCeoShare = branchResults.reduce((s: number, r: { ceoShare: number }) => s + r.ceoShare, 0)

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
                        Direct editable statement with automatic extraction from saved invoices and multi-branch CEO Share calculations
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

                    {/* Prefill from Invoices Button */}
                    <button
                        id="manual-pl-extract-invoices-btn"
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => handleExtractFromInvoices(true)}
                        disabled={extracting}
                        title="Pull real revenue and product costs directly from paid invoices for this month"
                    >
                        <RefreshCw size={14} className={extracting ? 'spin' : ''} />
                        {extracting ? 'Extracting…' : 'Prefill from Invoices'}
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
                    <span className="manual-pl-metric-title">Total COGS</span>
                    <span className="manual-pl-metric-val">
                        {money(selectedBranch === 'all' ? consolidatedMetrics.totalCogs : activeMetrics.totalCogs)}
                    </span>
                </div>
                <div className="manual-pl-metric-card">
                    <span className="manual-pl-metric-title">Gross Profit</span>
                    <span className="manual-pl-metric-val">
                        {money(selectedBranch === 'all' ? consolidatedMetrics.grossProfit : activeMetrics.grossProfit)}
                    </span>
                </div>
                <div className="manual-pl-metric-card">
                    <span className="manual-pl-metric-title">Total Expenses</span>
                    <span className="manual-pl-metric-val">
                        {money(selectedBranch === 'all' ? consolidatedMetrics.totalExpenses : activeMetrics.totalExpenses)}
                    </span>
                </div>
                <div className="manual-pl-metric-card">
                    <span className="manual-pl-metric-title">Net Profit</span>
                    <span className={`manual-pl-metric-val ${(selectedBranch === 'all' ? consolidatedMetrics.netProfit : activeMetrics.netProfit) >= 0 ? 'positive' : 'negative'}`}>
                        {money(selectedBranch === 'all' ? consolidatedMetrics.netProfit : activeMetrics.netProfit)}
                    </span>
                </div>
                <div className="manual-pl-metric-card">
                    <span className="manual-pl-metric-title">Total CEO Share</span>
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
                                <div><span>Source</span> Saved Invoices &amp; Manual Override</div>
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
                                                        value={activeData[c.key] || ''}
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
                                                        value={activeData[c.key] || ''}
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
                                        <td className="cell-primary">Total Operating Expenses</td>
                                        <td>{money(activeMetrics.totalExpenses)}</td>
                                    </tr>
                                    <tr className="report-totals-row pl-net-profit-row" style={{ background: activeMetrics.netProfit >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                                        <td className="cell-primary">Net Profit (Gross Profit − Total Expenses)</td>
                                        <td style={{ fontWeight: 700, fontSize: 16, color: activeMetrics.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                                            {money(activeMetrics.netProfit)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Profit Split Table */}
                        <div className="report-section-title">Profit Split — {selectedBranch}</div>
                        <div className="table-scroll">
                            <table className="admin-table report-table pl-line-table">
                                <thead>
                                    <tr>
                                        <th>Shareholder / Partner</th>
                                        <th>Ownership %</th>
                                        <th>Share of Net Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(OWNERSHIP[selectedBranch] || []).map(sh => (
                                        <tr key={sh.label} className={sh.isCeo ? 'pl-ceo-row' : ''}>
                                            <td className="cell-primary">{sh.label}</td>
                                            <td>{sh.pct}%</td>
                                            <td style={{ fontWeight: 600 }}>{money(activeMetrics.netProfit * (sh.pct / 100))}</td>
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
                                    placeholder="Add optional notes, invoice verification details, or auditor remarks..."
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
                                <div><span>Source</span> Aggregated Invoices &amp; Branch Records</div>
                                <div><span>Generated</span> {generatedAt}</div>
                            </div>
                        </div>

                        {/* Branch-by-Branch Comparison Table */}
                        <div className="report-section-title">All Branches Revenue &amp; Profit Summary</div>
                        <div className="table-scroll">
                            <table className="admin-table report-table manual-pl-table">
                                <thead>
                                    <tr>
                                        <th>Branch</th>
                                        <th>Gross Revenue</th>
                                        <th>Total COGS</th>
                                        <th>Gross Profit</th>
                                        <th>Operating Expenses</th>
                                        <th>Net Profit</th>
                                        <th>CEO Ownership %</th>
                                        <th>CEO Share</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branchResults.map((r: { branch: string; data: ManualBranchPL; metrics: ReturnType<typeof computePLMetrics>; ceoShare: number }) => (
                                        <tr key={r.branch}>
                                            <td className="cell-primary" style={{ fontWeight: 600 }}>{r.branch}</td>
                                            <td>{money(r.metrics.revenue)}</td>
                                            <td>{money(r.metrics.totalCogs)}</td>
                                            <td>{money(r.metrics.grossProfit)}</td>
                                            <td>{money(r.metrics.totalExpenses)}</td>
                                            <td style={{ fontWeight: 600, color: r.metrics.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                                                {money(r.metrics.netProfit)}
                                            </td>
                                            <td>{ceoPctOf(r.branch)}%</td>
                                            <td style={{ fontWeight: 700, color: 'var(--color-primary, #b59458)' }}>
                                                {money(r.ceoShare)}
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
                                        <td>—</td>
                                        <td style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-primary, #b59458)' }}>
                                            {money(totalCeoShare)}
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
        </div>
    )
}
