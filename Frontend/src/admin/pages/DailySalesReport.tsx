import { Fragment, useEffect, useState } from 'react'
import { Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { invoiceStore } from '../data/store'
import { branches as branchList } from '../../data/branches'
import type { Invoice } from '../data/types'
import cmLogo from '../../assets/cm-logo-white.png'
import { toIso, todayIso, monthKeyOf, shiftMonth, monthLabel } from './reportUtils'
import '../AdminShared.css'
import '../ReportShared.css'
import './DailySalesReport.css'

// Clean short branch name (e.g. "Belgaum"), matching mapBranch() in store.ts —
// not branchList's fuller display label (e.g. "Belgaum (Belagavi)").
const branchNames = branchList.map(b => b.name.replace('CM — ', '').replace(/\s*\([^)]*\)$/, ''))

type DayCell = { iso: string; inMonth: boolean }
type Week = { days: DayCell[] }

function buildWeeks(monthKey: string): Week[] {
    const [y, m] = monthKey.split('-').map(Number)
    const first = new Date(y, m - 1, 1)
    const last = new Date(y, m, 0)

    const firstDow = first.getDay()
    const gridStart = new Date(first); gridStart.setDate(first.getDate() + (firstDow === 0 ? -6 : 1 - firstDow))
    const lastDow = last.getDay()
    const gridEnd = new Date(last); gridEnd.setDate(last.getDate() + (lastDow === 0 ? 0 : 7 - lastDow))

    const weeks: Week[] = []
    const cursor = new Date(gridStart)
    while (cursor.getTime() <= gridEnd.getTime()) {
        const days: DayCell[] = []
        for (let i = 0; i < 7; i++) {
            days.push({ iso: toIso(cursor), inMonth: cursor.getMonth() === m - 1 })
            cursor.setDate(cursor.getDate() + 1)
        }
        weeks.push({ days })
    }
    return weeks
}

type DayStats = { clientCount: number; cash: number; upi: number; retail: number; service: number; total: number }

function money(n: number) { return `₹${Math.round(n).toLocaleString()}` }

export default function DailySalesReport() {
    const [monthKey, setMonthKey] = useState(monthKeyOf(todayIso()))
    const [branch, setBranch] = useState('all')
    const [invoices, setInvoices] = useState<Invoice[]>([])

    useEffect(() => { invoiceStore.getAll().then(setInvoices) }, [])

    function dayStats(iso: string): DayStats {
        const inv = invoices.filter(i => i.date === iso && i.status === 'paid' && (branch === 'all' || i.branch === branch))
        const clientIds = new Set<string>()
        let retail = 0, service = 0, cash = 0, upi = 0
        inv.forEach(i => {
            clientIds.add(i.clientId || i.clientEmail || i.clientName)
            i.items.forEach(it => { if (it.productId) retail += it.total; else service += it.total })
            if (i.paymentMethod === 'cash') cash += i.total
            else if (i.paymentMethod === 'upi') upi += i.total
            else if (i.paymentMethod === 'split' && i.splitPayment) {
                cash += i.splitPayment.cash || 0
                upi += i.splitPayment.upi || 0
            } else {
                upi += i.total
            }
        })
        const total = (cash + upi > 0) ? (cash + upi + retail) : (service + retail)
        return { clientCount: clientIds.size, cash, upi, retail, service, total }
    }

    const weeks = buildWeeks(monthKey)

    const monthTotals = weeks.flatMap(w => w.days).filter(d => d.inMonth).reduce((t, d) => {
        const s = dayStats(d.iso)
        return {
            clientCount: t.clientCount + s.clientCount,
            cash: t.cash + s.cash,
            upi: t.upi + s.upi,
            retail: t.retail + s.retail,
            service: t.service + s.service,
            total: t.total + s.total,
        }
    }, { clientCount: 0, cash: 0, upi: 0, retail: 0, service: 0, total: 0 })

    const branchLabel = branch === 'all' ? 'All Branches' : branch
    const reportNo = `CM/DSR/${branch === 'all' ? 'ALL' : branch.slice(0, 3).toUpperCase()}/${monthKey.replace('-', '')}`
    const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

    return (
        <div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                    <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Daily Sales Report</h1>
                    <p className="admin-page-sub">Client count, retail &amp; service sales by day and week — per branch or combined</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => window.print()}><Printer size={14} /> Print</button>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setMonthKey(shiftMonth(monthKey, -1))}><ChevronLeft size={16} /></button>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 150, textAlign: 'center' }}>{monthLabel(monthKey)}</span>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setMonthKey(shiftMonth(monthKey, 1))}><ChevronRight size={16} /></button>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setMonthKey(monthKeyOf(todayIso()))}>This Month</button>
                </div>
                <select className="admin-filter-select" value={branch} onChange={e => setBranch(e.target.value)}>
                    <option value="all">All Branches</option>
                    {branchNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
            </div>

            <div className="report-sheet print-doc">
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
                        <div><span>Generated</span> {generatedAt}</div>
                    </div>
                </div>

                <div className="report-section-title">Daily Sales — {monthLabel(monthKey)}</div>
                <div className="table-scroll">
                    <table className="admin-table report-table dsr-week-table">
                        <thead>
                            <tr>
                                <th></th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th><th>Sun</th><th>Totals</th>
                            </tr>
                        </thead>
                        <tbody>
                            {weeks.map((week, wi) => {
                                const weekLabel = `${new Date(week.days[0].iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(week.days[6].iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                                const stats = week.days.map(d => d.inMonth ? dayStats(d.iso) : null)
                                const weekTotals = stats.filter((s): s is DayStats => s !== null).reduce((t, s) => ({
                                    clientCount: t.clientCount + s.clientCount,
                                    cash: t.cash + s.cash,
                                    upi: t.upi + s.upi,
                                    retail: t.retail + s.retail,
                                    service: t.service + s.service,
                                    total: t.total + s.total,
                                }), { clientCount: 0, cash: 0, upi: 0, retail: 0, service: 0, total: 0 })

                                return (
                                    <Fragment key={wi}>
                                        <tr className="dsr-week-label-row">
                                            <td colSpan={9} className="cell-primary" style={{ fontWeight: 700, letterSpacing: '0.5px' }}>
                                                Week {wi + 1}
                                            </td>
                                        </tr>
                                        <tr className="dsr-date-row" style={{ background: 'rgba(181, 148, 88, 0.06)' }}>
                                            <td className="cell-primary" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Date</td>
                                            {week.days.map((d, i) => {
                                                if (!d.inMonth) {
                                                    return <td key={i}><span className="text-muted">—</span></td>
                                                }
                                                const dObj = new Date(d.iso + 'T00:00:00')
                                                return (
                                                    <td key={i} className="dsr-date-cell" style={{ fontWeight: 700, color: 'var(--color-primary, #b59458)' }}>
                                                        {dObj.getDate()} {dObj.toLocaleDateString('en-IN', { month: 'short' })}
                                                    </td>
                                                )
                                            })}
                                            <td className="dsr-week-total" style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-muted)' }}>
                                                Week {wi + 1}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="cell-primary">Client Count</td>
                                            {stats.map((s, i) => <td key={i}>{s ? s.clientCount : '—'}</td>)}
                                            <td className="dsr-week-total">{weekTotals.clientCount}</td>
                                        </tr>
                                        <tr>
                                            <td className="cell-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>CASH</span>
                                                <span>Cash Sales</span>
                                            </td>
                                            {stats.map((s, i) => <td key={i}>{s ? money(s.cash) : '—'}</td>)}
                                            <td className="dsr-week-total" style={{ color: '#10b981' }}>{money(weekTotals.cash)}</td>
                                        </tr>
                                        <tr>
                                            <td className="cell-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', fontWeight: 700 }}>UPI</span>
                                                <span>UPI Sales</span>
                                            </td>
                                            {stats.map((s, i) => <td key={i}>{s ? money(s.upi) : '—'}</td>)}
                                            <td className="dsr-week-total" style={{ color: '#6366f1' }}>{money(weekTotals.upi)}</td>
                                        </tr>
                                        <tr>
                                            <td className="cell-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 700 }}>RETAIL</span>
                                                <span>Retail Sales</span>
                                            </td>
                                            {stats.map((s, i) => <td key={i}>{s ? money(s.retail) : '—'}</td>)}
                                            <td className="dsr-week-total" style={{ color: '#f59e0b' }}>{money(weekTotals.retail)}</td>
                                        </tr>
                                        <tr className="report-totals-row">
                                            <td className="cell-primary" style={{ fontWeight: 700, color: 'var(--color-primary, #b59458)' }}>
                                                Total Sales (Cash + UPI + Retail)
                                            </td>
                                            {stats.map((s, i) => <td key={i}>{s ? money(s.total) : '—'}</td>)}
                                            <td style={{ fontWeight: 800, color: 'var(--color-primary, #b59458)' }}>{money(weekTotals.total)}</td>
                                        </tr>
                                    </Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="report-bottom-section">
                    <div className="report-bottom-totals">
                        <div className="report-section-title" style={{ marginTop: 0 }}>Monthly Totals — {monthLabel(monthKey)}</div>
                        <div className="table-scroll">
                            <table className="admin-table report-table report-totals-table monthly-totals-table">
                                <tbody>
                                    <tr><td className="cell-primary">Client Count</td><td>{monthTotals.clientCount.toLocaleString()}</td></tr>
                                    <tr>
                                        <td className="cell-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>CASH</span>
                                            <span>Cash Sales</span>
                                        </td>
                                        <td style={{ color: '#10b981', fontWeight: 600 }}>{money(monthTotals.cash)}</td>
                                    </tr>
                                    <tr>
                                        <td className="cell-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', fontWeight: 700 }}>UPI</span>
                                            <span>UPI Sales</span>
                                        </td>
                                        <td style={{ color: '#6366f1', fontWeight: 600 }}>{money(monthTotals.upi)}</td>
                                    </tr>
                                    <tr>
                                        <td className="cell-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 700 }}>RETAIL</span>
                                            <span>Retail Sales</span>
                                        </td>
                                        <td style={{ color: '#f59e0b', fontWeight: 600 }}>{money(monthTotals.retail)}</td>
                                    </tr>
                                    <tr className="report-totals-row">
                                        <td className="cell-primary" style={{ fontWeight: 700 }}>Grand Total Sales (Cash + UPI + Retail)</td>
                                        <td style={{ color: 'var(--color-primary, #b59458)', fontWeight: 800 }}>{money(monthTotals.total)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="report-bottom-meta">
                        <div className="report-note">
                            Note: figures cover {branchLabel === 'All Branches' ? 'all branches combined' : `the ${branchLabel} branch only`}, drawn from paid invoices only. Client Count is the number of distinct clients billed that day. Days shaded outside the calendar month belong to the adjacent month and are excluded from all totals.
                        </div>

                        <div className="report-signoff">
                            <div className="signoff-block"><span>Prepared by</span></div>
                            <div className="signoff-block"><span>Reviewed by</span></div>
                            <div className="signoff-block"><span>Date</span></div>
                        </div>
                    </div>
                </div>

                <div className="report-footer">
                    {reportNo} · Generated {generatedAt} · Christalin Mirrors — Confidential, Internal Use Only. Retain for records.
                </div>
            </div>
        </div>
    )
}
