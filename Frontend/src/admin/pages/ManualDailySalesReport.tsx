import { Fragment, useState, useEffect, useMemo, useCallback } from 'react'
import {
    Printer, ChevronLeft, ChevronRight, Edit3, Eye,
    RotateCcw, Download, Copy, Check, FileText,
    Sparkles, Lock, Cloud, CloudOff, RefreshCw, CheckCircle2, Loader2
} from 'lucide-react'
import { branches as branchList } from '../../data/branches'
import { invoiceStore } from '../data/store'
import cmLogo from '../../assets/cm-logo-white.png'
import { toIso, todayIso, monthKeyOf, shiftMonth, monthLabel } from './reportUtils'
import { manualSalesStore, type ManualSalesData, type ManualDayRecord, type SyncState } from '../data/manualSalesStore'
import { useToast } from '../components/Toast'
import '../AdminShared.css'
import '../ReportShared.css'
import './DailySalesReport.css'
import './ManualDailySalesReport.css'

const branchNames = branchList.map(b => b.name.replace('CM — ', '').replace(/\s*\([^)]*\)$/, ''))

type DayCell = { iso: string; inMonth: boolean; dayNum: number }
type Week = { days: DayCell[] }

function buildWeeks(monthKey: string): Week[] {
    const [y, m] = monthKey.split('-').map(Number)
    const first = new Date(y, m - 1, 1)
    const last = new Date(y, m, 0)

    const firstDow = first.getDay()
    const gridStart = new Date(first)
    gridStart.setDate(first.getDate() + (firstDow === 0 ? -6 : 1 - firstDow))
    const lastDow = last.getDay()
    const gridEnd = new Date(last)
    gridEnd.setDate(last.getDate() + (lastDow === 0 ? 0 : 7 - lastDow))

    const weeks: Week[] = []
    const cursor = new Date(gridStart)
    while (cursor.getTime() <= gridEnd.getTime()) {
        const days: DayCell[] = []
        for (let i = 0; i < 7; i++) {
            days.push({
                iso: toIso(cursor),
                inMonth: cursor.getMonth() === m - 1,
                dayNum: cursor.getDate(),
            })
            cursor.setDate(cursor.getDate() + 1)
        }
        weeks.push({ days })
    }
    return weeks
}

function money(n: number) {
    if (n === 0) return '—'
    return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function formatCount(n: number) {
    if (n === 0) return '—'
    return n.toLocaleString('en-IN')
}

export default function ManualDailySalesReport() {
    const { showToast } = useToast()
    const [monthKey, setMonthKey] = useState(monthKeyOf(todayIso()))
    const [branch, setBranch] = useState('all')
    const [isEditMode, setIsEditMode] = useState(true)
    const [data, setData] = useState<ManualSalesData>(() => manualSalesStore.getAll())
    const [copiedUrl, setCopiedUrl] = useState(false)
    const [syncStatus, setSyncStatus] = useState<SyncState>('synced')
    const [isSyncing, setIsSyncing] = useState(false)

    // Modal state
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false)
    const [pasteText, setPasteText] = useState('')

    // Load month data from Supabase (with fallback to local storage)
    const loadOnlineData = useCallback(async (mKey: string) => {
        setIsSyncing(true)
        try {
            const { data: remoteData, fromOnline } = await manualSalesStore.fetchMonth(mKey)
            setData(remoteData)
            setSyncStatus(fromOnline ? 'synced' : 'offline')
        } catch {
            setSyncStatus('offline')
        } finally {
            setIsSyncing(false)
        }
    }, [])

    // Refresh store on mount and on monthKey change
    useEffect(() => {
        loadOnlineData(monthKey)
    }, [monthKey, loadOnlineData])

    const weeks = useMemo(() => buildWeeks(monthKey), [monthKey])

    // Helper to get day data
    function getDayStats(iso: string): ManualDayRecord & { total: number } {
        if (branch === 'all') {
            let clientCount = 0
            let retail = 0
            let service = 0
            let hasBranchEntry = false

            for (const b of branchNames) {
                const rec = data[b]?.[iso]
                if (rec) {
                    hasBranchEntry = true
                    clientCount += rec.clientCount || 0
                    retail += rec.retail || 0
                    service += rec.service || 0
                }
            }

            if (!hasBranchEntry && data['all']?.[iso]) {
                const direct = data['all'][iso]
                return {
                    clientCount: direct.clientCount || 0,
                    retail: direct.retail || 0,
                    service: direct.service || 0,
                    total: (direct.retail || 0) + (direct.service || 0),
                    notes: direct.notes,
                }
            }

            return { clientCount, retail, service, total: retail + service }
        }

        const rec = data[branch]?.[iso]
        const clientCount = rec?.clientCount || 0
        const retail = rec?.retail || 0
        const service = rec?.service || 0
        return {
            clientCount,
            retail,
            service,
            total: retail + service,
            notes: rec?.notes,
        }
    }

    // Update single field with online sync callback
    const handleCellChange = (iso: string, field: 'clientCount' | 'retail' | 'service', rawValue: string) => {
        const num = rawValue === '' ? 0 : Math.max(0, parseInt(rawValue, 10) || 0)
        const targetBranch = branch === 'all' ? 'Bengaluru' : branch // default to first branch if editing directly in all
        
        manualSalesStore.setRecord(
            targetBranch,
            iso,
            { [field]: num },
            (status) => setSyncStatus(status)
        )
        setData(manualSalesStore.getAll())
    }

    // Monthly totals calculation
    const monthTotals = useMemo(() => {
        return weeks
            .flatMap(w => w.days)
            .filter(d => d.inMonth)
            .reduce((t, d) => {
                const s = getDayStats(d.iso)
                return {
                    clientCount: t.clientCount + s.clientCount,
                    retail: t.retail + s.retail,
                    service: t.service + s.service,
                    total: t.total + s.total,
                }
            }, { clientCount: 0, retail: 0, service: 0, total: 0 })
    }, [weeks, data, branch])

    // Copy URL helper
    const handleCopyUrl = () => {
        const fullUrl = `${window.location.origin}/admin/daily-sales-report-manual`
        navigator.clipboard.writeText(fullUrl)
        setCopiedUrl(true)
        showToast('info', 'Private URL copied to clipboard')
        setTimeout(() => setCopiedUrl(false), 2500)
    }

    // Clear month data
    const handleClearMonth = async () => {
        const branchNotice = branch === 'all' ? 'all branches' : `branch "${branch}"`
        if (window.confirm(`Clear all typed sales numbers for ${monthLabel(monthKey)} for ${branchNotice}?`)) {
            setSyncStatus('saving')
            await manualSalesStore.clearMonth(branch, monthKey)
            setData(manualSalesStore.getAll())
            setSyncStatus('synced')
            showToast('info', 'Monthly sales data cleared')
        }
    }

    // Prefill from system invoices
    const handlePrefillFromInvoices = async () => {
        if (window.confirm(`Populate ${monthLabel(monthKey)} from recorded system invoices as a starting template? Existing manual entries for this month will be overwritten.`)) {
            setSyncStatus('saving')
            const invs = await invoiceStore.getAll()
            const count = await manualSalesStore.prefillFromInvoices(invs, monthKey, branch)
            setData(manualSalesStore.getAll())
            setSyncStatus('synced')
            showToast('success', `Prefilled ${count} day entries from system invoices`)
        }
    }

    // WhatsApp parser
    const handleParseAndApplyWhatsApp = () => {
        if (!pasteText.trim()) return

        try {
            // Find branch if mentioned
            let detectedBranch = branch === 'all' ? 'Bengaluru' : branch
            for (const b of branchNames) {
                if (new RegExp(`Branch:\\s*${b}`, 'i').test(pasteText) || new RegExp(b, 'i').test(pasteText)) {
                    detectedBranch = b
                    break
                }
            }

            // Find date: DD-MM-YYYY or YYYY-MM-DD
            let isoDate = todayIso()
            const dmyMatch = pasteText.match(/Date:\s*(\d{1,2})[-/](\d{1,2})[-/](\d{4})/i) || pasteText.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
            if (dmyMatch) {
                const day = dmyMatch[1].padStart(2, '0')
                const month = dmyMatch[2].padStart(2, '0')
                const year = dmyMatch[3]
                isoDate = `${year}-${month}-${day}`
            } else {
                const ymdMatch = pasteText.match(/Date:\s*(\d{4})[-/](\d{1,2})[-/](\d{1,2})/i)
                if (ymdMatch) {
                    const year = ymdMatch[1]
                    const month = ymdMatch[2].padStart(2, '0')
                    const day = ymdMatch[3].padStart(2, '0')
                    isoDate = `${year}-${month}-${day}`
                }
            }

            // Extract clients / invoices
            let clients = 0
            const clientsMatch = pasteText.match(/(?:Invoices raised|New clients|Clients|Bills):\s*(\d+)/i)
            if (clientsMatch) {
                clients = parseInt(clientsMatch[1], 10) || 0
            }

            // Extract retail / service or cash/upi/card
            let retail = 0
            let service = 0

            const retailMatch = pasteText.match(/Retail(?:\s*Sales)?:\s*(\d+)/i)
            if (retailMatch) retail = parseInt(retailMatch[1], 10) || 0

            const serviceMatch = pasteText.match(/Service(?:\s*Sales)?:\s*(\d+)/i)
            if (serviceMatch) service = parseInt(serviceMatch[1], 10) || 0

            // If retail & service aren't explicitly split, check Cash / UPI / Card
            if (retail === 0 && service === 0) {
                const cashMatch = pasteText.match(/Cash:\s*(\d+)/i)
                const upiMatch = pasteText.match(/UPI:\s*(\d+)/i)
                const cardMatch = pasteText.match(/Card:\s*(\d+)/i)

                const cash = cashMatch ? parseInt(cashMatch[1], 10) || 0 : 0
                const upi = upiMatch ? parseInt(upiMatch[1], 10) || 0 : 0
                const card = cardMatch ? parseInt(cardMatch[1], 10) || 0 : 0
                
                // Assign to service by default as salon revenue
                service = cash + upi + card
            }

            manualSalesStore.setRecord(detectedBranch, isoDate, {
                clientCount: clients,
                retail,
                service,
                notes: 'Pasted from WhatsApp report',
            })

            setData(manualSalesStore.getAll())
            setIsPasteModalOpen(false)
            setPasteText('')
            setMonthKey(isoDate.slice(0, 7))
            if (branch !== 'all' && branch !== detectedBranch) {
                setBranch(detectedBranch)
            }
            showToast('success', `Recorded ${detectedBranch} report for ${isoDate} (₹${(retail + service).toLocaleString()})`)
        } catch (err) {
            console.error('Failed to parse text', err)
            showToast('error', 'Could not parse daily report format. Check the text format and try again.')
        }
    }

    const branchLabel = branch === 'all' ? 'All Branches' : branch
    const reportNo = `CM/DSR-MANUAL/${branch === 'all' ? 'ALL' : branch.slice(0, 3).toUpperCase()}/${monthKey.replace('-', '')}`
    const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

    return (
        <div className="manual-dsr-container">
            {/* Private Hidden URL Banner */}
            <div className="manual-dsr-hidden-banner no-print">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div className="manual-dsr-badge" style={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: 'var(--text-bright)' }}>
                        <Cloud size={14} />
                        <span>Cloud Synced Report</span>
                    </div>

                    {/* Online Sync Status */}
                    {syncStatus === 'saving' || isSyncing ? (
                        <div className="manual-dsr-sync-pill saving">
                            <Loader2 size={12} className="animate-spin" />
                            <span>Saving online...</span>
                        </div>
                    ) : syncStatus === 'synced' ? (
                        <div className="manual-dsr-sync-pill synced">
                            <Cloud size={12} />
                            <span>Saved online (Supabase)</span>
                        </div>
                    ) : (
                        <div className="manual-dsr-sync-pill offline">
                            <CloudOff size={12} />
                            <span>Offline / Local Cache</span>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={() => loadOnlineData(monthKey)}
                        title="Reload latest numbers from Supabase"
                        style={{ height: 28, padding: '0 8px', fontSize: 11 }}
                        disabled={isSyncing}
                    >
                        <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                        <span>Sync</span>
                    </button>
                    <span style={{ fontSize: 11 }}>URL:</span>
                    <span className="manual-dsr-url-pill">/admin/daily-sales-report-manual</span>
                    <button
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={handleCopyUrl}
                        title="Copy direct link"
                        style={{ height: 28, padding: '0 8px', fontSize: 11 }}
                    >
                        {copiedUrl ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                        <span>{copiedUrl ? 'Copied' : 'Copy Link'}</span>
                    </button>
                </div>
            </div>

            {/* Header and Title */}
            <div className="no-print manual-dsr-toolbar">
                <div>
                    <h1 className="admin-page-title" style={{ marginBottom: 2 }}>
                        Daily Sales Report <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.7 }}>(Manual Entry)</span>
                    </h1>
                    <p className="admin-page-sub">
                        Type each day's client count, retail, and service sales manually. Auto-calculates daily, weekly, and monthly totals.
                    </p>
                </div>
                <div className="manual-dsr-controls">
                    <button
                        className={`admin-btn ${isEditMode ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                        onClick={() => setIsEditMode(!isEditMode)}
                    >
                        {isEditMode ? <Eye size={14} /> : <Edit3 size={14} />}
                        <span>{isEditMode ? 'Switch to View / Print Mode' : 'Switch to Edit Mode'}</span>
                    </button>
                    <button
                        className="admin-btn admin-btn-secondary"
                        onClick={() => setIsPasteModalOpen(true)}
                        title="Paste WhatsApp closing report"
                    >
                        <FileText size={14} />
                        <span>Paste WhatsApp Text</span>
                    </button>
                    <button
                        className="admin-btn admin-btn-primary"
                        onClick={() => window.print()}
                    >
                        <Printer size={14} />
                        <span>Print</span>
                    </button>
                </div>
            </div>

            {/* Filters and Month Controls */}
            <div className="no-print" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setMonthKey(shiftMonth(monthKey, -1))}>
                        <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 140, textAlign: 'center', fontWeight: 600 }}>
                        {monthLabel(monthKey)}
                    </span>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setMonthKey(shiftMonth(monthKey, 1))}>
                        <ChevronRight size={16} />
                    </button>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setMonthKey(monthKeyOf(todayIso()))}>
                        This Month
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select className="admin-filter-select" value={branch} onChange={e => setBranch(e.target.value)}>
                        <option value="all">All Branches (Combined)</option>
                        {branchNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>

                    {branch === 'all' && isEditMode && (
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            * Editing in All Branches saves under Bengaluru by default. Select a specific branch above to target it directly.
                        </span>
                    )}
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={handlePrefillFromInvoices}
                        title="Prefill from system invoices"
                    >
                        <Sparkles size={13} />
                        <span>Prefill from Invoices</span>
                    </button>
                    <button
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={handleClearMonth}
                        title="Clear this month"
                        style={{ color: 'var(--danger, #f87171)' }}
                    >
                        <RotateCcw size={13} />
                        <span>Clear Month</span>
                    </button>
                </div>
            </div>

            {/* Printable & Filed A4 Document */}
            <div className="report-sheet print-doc">
                {/* Letterhead */}
                <div className="report-letterhead">
                    <div className="report-letterhead-main">
                        <img src={cmLogo} alt="Christalin Mirrors" className="report-logo" />
                        <div>
                            <div className="report-title">Christalin Mirrors — Daily Sales Report</div>
                            <div className="report-range">{monthLabel(monthKey)} · {branchLabel}</div>
                        </div>
                    </div>
                    <div className="report-letterhead-meta">
                        <div><span>Report No.</span> {reportNo}</div>
                        <div><span>Mode</span> Manual Typed Entry</div>
                        <div><span>Generated</span> {generatedAt}</div>
                    </div>
                </div>

                {/* Calendar Weeks Table */}
                <div className="report-section-title">
                    Daily Sales — {monthLabel(monthKey)}
                    {isEditMode && <span className="no-print" style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-primary, #b59458)' }}>· Edit Mode Active: Type numbers directly into each cell</span>}
                </div>

                <div className="table-scroll">
                    <table className="admin-table report-table manual-dsr-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: 120 }}>Metric</th>
                                <th>Mon</th>
                                <th>Tue</th>
                                <th>Wed</th>
                                <th>Thu</th>
                                <th>Fri</th>
                                <th>Sat</th>
                                <th>Sun</th>
                                <th style={{ minWidth: 100 }}>Week Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {weeks.map((week, wi) => {
                                const weekLabel = `${new Date(week.days[0].iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(week.days[6].iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                                
                                const dayStatsList = week.days.map(d => d.inMonth ? getDayStats(d.iso) : null)
                                
                                const weekTotals = dayStatsList
                                    .filter((s): s is (ManualDayRecord & { total: number }) => s !== null)
                                    .reduce((acc, s) => ({
                                        clientCount: acc.clientCount + s.clientCount,
                                        retail: acc.retail + s.retail,
                                        service: acc.service + s.service,
                                        total: acc.total + s.total,
                                    }), { clientCount: 0, retail: 0, service: 0, total: 0 })

                                return (
                                    <Fragment key={wi}>
                                        <tr className="manual-dsr-week-label">
                                            <td colSpan={9} className="cell-primary">
                                                Week {wi + 1} — {weekLabel}
                                            </td>
                                        </tr>

                                        {/* Client Count Row */}
                                        <tr>
                                            <td className="cell-primary">Client Count</td>
                                            {week.days.map((d, i) => {
                                                if (!d.inMonth) {
                                                    return <td key={i}><span className="manual-dsr-val-dim">—</span></td>
                                                }
                                                const stats = dayStatsList[i]!
                                                return (
                                                    <td key={i}>
                                                        {isEditMode ? (
                                                            <div className="manual-dsr-input-wrap">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="manual-dsr-input"
                                                                    placeholder="0"
                                                                    value={stats.clientCount === 0 ? '' : stats.clientCount}
                                                                    onChange={e => handleCellChange(d.iso, 'clientCount', e.target.value)}
                                                                    title={`${d.iso} Client Count`}
                                                                />
                                                                {/* Fallback printable text */}
                                                                <span className="manual-dsr-val-text" style={{ display: 'none' }}>
                                                                    {formatCount(stats.clientCount)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="manual-dsr-val-text">
                                                                {formatCount(stats.clientCount)}
                                                            </span>
                                                        )}
                                                    </td>
                                                )
                                            })}
                                            <td className="manual-dsr-total-col">
                                                {formatCount(weekTotals.clientCount)}
                                            </td>
                                        </tr>

                                        {/* Retail Sales Row */}
                                        <tr>
                                            <td className="cell-primary">Retail Sales</td>
                                            {week.days.map((d, i) => {
                                                if (!d.inMonth) {
                                                    return <td key={i}><span className="manual-dsr-val-dim">—</span></td>
                                                }
                                                const stats = dayStatsList[i]!
                                                return (
                                                    <td key={i}>
                                                        {isEditMode ? (
                                                            <div className="manual-dsr-input-wrap">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="manual-dsr-input"
                                                                    placeholder="₹0"
                                                                    value={stats.retail === 0 ? '' : stats.retail}
                                                                    onChange={e => handleCellChange(d.iso, 'retail', e.target.value)}
                                                                    title={`${d.iso} Retail Sales`}
                                                                />
                                                                <span className="manual-dsr-val-text" style={{ display: 'none' }}>
                                                                    {money(stats.retail)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="manual-dsr-val-text">
                                                                {money(stats.retail)}
                                                            </span>
                                                        )}
                                                    </td>
                                                )
                                            })}
                                            <td className="manual-dsr-total-col">
                                                {money(weekTotals.retail)}
                                            </td>
                                        </tr>

                                        {/* Service Sales Row */}
                                        <tr>
                                            <td className="cell-primary">Service Sales</td>
                                            {week.days.map((d, i) => {
                                                if (!d.inMonth) {
                                                    return <td key={i}><span className="manual-dsr-val-dim">—</span></td>
                                                }
                                                const stats = dayStatsList[i]!
                                                return (
                                                    <td key={i}>
                                                        {isEditMode ? (
                                                            <div className="manual-dsr-input-wrap">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="manual-dsr-input"
                                                                    placeholder="₹0"
                                                                    value={stats.service === 0 ? '' : stats.service}
                                                                    onChange={e => handleCellChange(d.iso, 'service', e.target.value)}
                                                                    title={`${d.iso} Service Sales`}
                                                                />
                                                                <span className="manual-dsr-val-text" style={{ display: 'none' }}>
                                                                    {money(stats.service)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="manual-dsr-val-text">
                                                                {money(stats.service)}
                                                            </span>
                                                        )}
                                                    </td>
                                                )
                                            })}
                                            <td className="manual-dsr-total-col">
                                                {money(weekTotals.service)}
                                            </td>
                                        </tr>

                                        {/* Total Sales Row (Calculated: Retail + Service) */}
                                        <tr className="report-totals-row">
                                            <td className="cell-primary">Total Sales</td>
                                            {week.days.map((d, i) => {
                                                if (!d.inMonth) {
                                                    return <td key={i}><span className="manual-dsr-val-dim">—</span></td>
                                                }
                                                const stats = dayStatsList[i]!
                                                return (
                                                    <td key={i}>
                                                        <span className="manual-dsr-calculated-val">
                                                            {money(stats.total)}
                                                        </span>
                                                    </td>
                                                )
                                            })}
                                            <td className="manual-dsr-total-col">
                                                {money(weekTotals.total)}
                                            </td>
                                        </tr>
                                    </Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Monthly Totals Summary */}
                <div className="report-section-title">Monthly Totals — {monthLabel(monthKey)}</div>
                <div className="table-scroll">
                    <table className="admin-table report-table" style={{ maxWidth: 460 }}>
                        <tbody>
                            <tr>
                                <td className="cell-primary">Total Client Count</td>
                                <td style={{ fontWeight: 600 }}>{monthTotals.clientCount.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                                <td className="cell-primary">Total Retail Sales</td>
                                <td style={{ fontWeight: 600 }}>{money(monthTotals.retail)}</td>
                            </tr>
                            <tr>
                                <td className="cell-primary">Total Service Sales</td>
                                <td style={{ fontWeight: 600 }}>{money(monthTotals.service)}</td>
                            </tr>
                            <tr className="report-totals-row">
                                <td className="cell-primary">Grand Total Sales</td>
                                <td style={{ color: 'var(--color-primary, #b59458)' }}>{money(monthTotals.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Report Note */}
                <div className="report-note">
                    Note: Figures shown above are manually entered and stored locally for {branchLabel === 'All Branches' ? 'all branches combined' : `the ${branchLabel} branch`}. Total Sales is the sum of Retail and Service sales for each day. Days shaded outside the calendar month belong to the adjacent month and are excluded from all totals.
                </div>

                {/* Sign-off Blocks */}
                <div className="report-signoff">
                    <div className="signoff-block"><span>Prepared by (Branch / Manager)</span></div>
                    <div className="signoff-block"><span>Reviewed by (Owner / Executive)</span></div>
                    <div className="signoff-block"><span>Date</span></div>
                </div>

                {/* Report Footer */}
                <div className="report-footer">
                    {reportNo} · Generated {generatedAt} · Christalin Mirrors — Confidential, Internal Manual Record.
                </div>
            </div>

            {/* WhatsApp Text Paste Modal */}
            {isPasteModalOpen && (
                <div className="manual-dsr-modal-backdrop no-print" onClick={() => setIsPasteModalOpen(false)}>
                    <div className="manual-dsr-modal" onClick={e => e.stopPropagation()}>
                        <div className="manual-dsr-modal-header">
                            <h3 className="manual-dsr-modal-title">Paste Daily WhatsApp Report</h3>
                            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setIsPasteModalOpen(false)}>✕</button>
                        </div>
                        <div className="manual-dsr-modal-body">
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                                Paste the branch closing text message from WhatsApp. The parser automatically reads the branch, date, client count, and sales numbers.
                            </p>
                            <textarea
                                className="manual-dsr-textarea"
                                placeholder={`CHRISTALIN MIRRORS — DAILY REPORT\nBranch: Bengaluru\nDate: 10-09-2026\n\nCash: 4200\nUPI: 6100\nCard: 0\nInvoices raised: 12`}
                                value={pasteText}
                                onChange={e => setPasteText(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="manual-dsr-modal-footer">
                            <button className="admin-btn admin-btn-secondary" onClick={() => setIsPasteModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="admin-btn admin-btn-primary" onClick={handleParseAndApplyWhatsApp} disabled={!pasteText.trim()}>
                                Fill Report from Text
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
