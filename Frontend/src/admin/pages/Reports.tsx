import { useEffect, useState } from 'react'
import { Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { invoiceStore, appointmentStore, clientStore, staffStore, inventoryStore } from '../data/store'
import { branches as branchList } from '../../data/branches'
import type { Invoice, Appointment, Client, StaffMember, InventoryItem } from '../data/types'
import cmLogo from '../../assets/cm-logo-white.png'
import { toIso, todayIso, addDays, Trend } from './reportUtils'
import '../AdminShared.css'
import '../ReportShared.css'
import './Reports.css'

type Period = 'daily' | 'weekly' | 'monthly'

// Clean short branch name (e.g. "Belgaum"), matching mapBranch() in store.ts —
// not branchList's fuller display label (e.g. "Belgaum (Belagavi)").
const branchNames = branchList.map(b => b.name.replace('CM — ', '').replace(/\s*\([^)]*\)$/, ''))

function getRange(period: Period, anchor: string) {
    const d = new Date(anchor + 'T00:00:00')
    if (period === 'daily') {
        return { start: anchor, end: anchor, label: d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
    }
    if (period === 'weekly') {
        const day = d.getDay()
        const diffToMonday = day === 0 ? -6 : 1 - day
        const monday = new Date(d); monday.setDate(d.getDate() + diffToMonday)
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
        return {
            start: toIso(monday), end: toIso(sunday),
            label: `${monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        }
    }
    const first = new Date(d.getFullYear(), d.getMonth(), 1)
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    return { start: toIso(first), end: toIso(last), label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) }
}

function shiftAnchor(period: Period, anchor: string, dir: 1 | -1) {
    const d = new Date(anchor + 'T00:00:00')
    if (period === 'daily') d.setDate(d.getDate() + dir)
    else if (period === 'weekly') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    return toIso(d)
}

type PeriodAgg = {
    revenue: number
    paidCount: number
    cancelledCount: number
    completed: number
    apptCancelled: number
    apptPending: number
    newClients: number
    apptTotal: number
}

function SnapshotCard({ label, sub, stats, prev }: { label: string; sub: string; stats: PeriodAgg; prev: PeriodAgg }) {
    return (
        <div className="snapshot-card">
            <div className="snapshot-label">{label}</div>
            <div className="snapshot-sub">{sub}</div>
            <div className="snapshot-value-row">
                <div className="snapshot-value">₹{stats.revenue.toLocaleString()}</div>
                <Trend curr={stats.revenue} prev={prev.revenue} />
            </div>
            <div className="snapshot-metrics">
                <span>{stats.paidCount} paid inv.</span>
                <span>{stats.completed} appts done</span>
                <span>{stats.newClients} new clients</span>
            </div>
        </div>
    )
}

export default function Reports() {
    const [period, setPeriod] = useState<Period>('daily')
    const [anchor, setAnchor] = useState(todayIso())
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])

    useEffect(() => {
        invoiceStore.getAll().then(setInvoices)
        appointmentStore.getAll().then(setAppointments)
        clientStore.getAll().then(setClients)
        staffStore.getAll().then(setStaff)
        inventoryStore.getAll().then(setInventory)
    }, [])

    const { start, end, label } = getRange(period, anchor)

    function aggregate(rangeStart: string, rangeEnd: string): PeriodAgg {
        const inv = invoices.filter(i => i.date >= rangeStart && i.date <= rangeEnd)
        const paid = inv.filter(i => i.status === 'paid')
        const cancelled = inv.filter(i => i.status === 'cancelled')
        const revenue = paid.reduce((s, i) => s + i.total, 0)

        const appts = appointments.filter(a => a.date >= rangeStart && a.date <= rangeEnd)
        const completed = appts.filter(a => a.status === 'completed').length
        const apptCancelled = appts.filter(a => a.status === 'cancelled').length
        const apptPending = appts.filter(a => a.status === 'pending' || a.status === 'confirmed' || a.status === 'arrived').length

        const newClients = clients.filter(c => c.joinedDate >= rangeStart && c.joinedDate <= rangeEnd).length

        return { revenue, paidCount: paid.length, cancelledCount: cancelled.length, completed, apptCancelled, apptPending, newClients, apptTotal: appts.length }
    }

    const branchStats = branchNames.map(name => {
        const inv = invoices.filter(i => i.branch === name && i.date >= start && i.date <= end)
        const paid = inv.filter(i => i.status === 'paid')
        const cancelled = inv.filter(i => i.status === 'cancelled')
        const revenue = paid.reduce((s, i) => s + i.total, 0)

        const appts = appointments.filter(a => a.branch === name && a.date >= start && a.date <= end)
        const completed = appts.filter(a => a.status === 'completed').length
        const apptCancelled = appts.filter(a => a.status === 'cancelled').length
        const apptPending = appts.filter(a => a.status === 'pending' || a.status === 'confirmed' || a.status === 'arrived').length

        const newClients = clients.filter(c => c.branch === name && c.joinedDate >= start && c.joinedDate <= end).length
        const staffCount = staff.filter(s => s.branch === name && s.isActive).length
        const lowStock = inventory.filter(i => i.branch === name && i.isActive && i.currentStock <= i.minStock)

        return { name, revenue, paidCount: paid.length, cancelledCount: cancelled.length, completed, apptCancelled, apptPending, newClients, staffCount, lowStock }
    })

    const totals = branchStats.reduce((t, b) => ({
        revenue: t.revenue + b.revenue,
        paidCount: t.paidCount + b.paidCount,
        cancelledCount: t.cancelledCount + b.cancelledCount,
        completed: t.completed + b.completed,
        apptCancelled: t.apptCancelled + b.apptCancelled,
        apptPending: t.apptPending + b.apptPending,
        newClients: t.newClients + b.newClients,
        staffCount: t.staffCount + b.staffCount,
        lowStockCount: t.lowStockCount + b.lowStock.length,
    }), { revenue: 0, paidCount: 0, cancelledCount: 0, completed: 0, apptCancelled: 0, apptPending: 0, newClients: 0, staffCount: 0, lowStockCount: 0 })

    // ─── Performance Snapshot: Yesterday / Week-to-Date / Month-to-Date ───
    const today = todayIso()

    const yesterday = shiftAnchor('daily', today, -1)
    const dayBefore = shiftAnchor('daily', yesterday, -1)
    const yesterdayStats = aggregate(yesterday, yesterday)
    const dayBeforeStats = aggregate(dayBefore, dayBefore)

    const weekRange = getRange('weekly', today)
    const wtdStats = aggregate(weekRange.start, today)
    const prevWeekStart = getRange('weekly', shiftAnchor('weekly', today, -1)).start
    const wtdOffsetDays = Math.round((new Date(today + 'T00:00:00').getTime() - new Date(weekRange.start + 'T00:00:00').getTime()) / 86400000)
    const prevWtdStats = aggregate(prevWeekStart, addDays(prevWeekStart, wtdOffsetDays))

    const monthRange = getRange('monthly', today)
    const mtdStats = aggregate(monthRange.start, today)
    const prevMonthRange = getRange('monthly', shiftAnchor('monthly', today, -1))
    const dayOfMonth = new Date(today + 'T00:00:00').getDate()
    const prevMonthLastDay = new Date(prevMonthRange.end + 'T00:00:00').getDate()
    const prevMtdEnd = addDays(prevMonthRange.start, Math.min(dayOfMonth, prevMonthLastDay) - 1)
    const prevMtdStats = aggregate(prevMonthRange.start, prevMtdEnd)

    // ─── Trend for the currently selected period, vs the prior equivalent period ───
    const prevPeriodRange = getRange(period, shiftAnchor(period, anchor, -1))
    const prevPeriodStats = aggregate(prevPeriodRange.start, prevPeriodRange.end)

    // ─── Business insights ───
    const topBranch = branchStats.reduce((best, b) => (b.revenue > best.revenue ? b : best), branchStats[0])
    const avgTicket = totals.paidCount > 0 ? totals.revenue / totals.paidCount : 0
    const apptDecided = totals.completed + totals.apptCancelled + totals.apptPending
    const completionRate = apptDecided > 0 ? (totals.completed / apptDecided) * 100 : 0
    const branchesWithAlerts = branchStats.filter(b => b.lowStock.length > 0).length

    const reportNo = `CM/RPT/${period.toUpperCase()}/${anchor.replace(/-/g, '')}`
    const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

    return (
        <div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                    <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Reports</h1>
                    <p className="admin-page-sub">Printable daily / weekly / monthly summary — all branches</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => window.print()}><Printer size={14} /> Print</button>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
                    <button key={p} className={`admin-btn ${period === p ? 'admin-btn-primary' : 'admin-btn-secondary'}`} onClick={() => setPeriod(p)} style={{ textTransform: 'capitalize' }}>{p}</button>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setAnchor(shiftAnchor(period, anchor, -1))}><ChevronLeft size={16} /></button>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 170, textAlign: 'center' }}>{label}</span>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setAnchor(shiftAnchor(period, anchor, 1))}><ChevronRight size={16} /></button>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setAnchor(todayIso())}>Today</button>
                </div>
            </div>

            <div id="report-print" className="report-sheet print-doc">
                <div className="report-letterhead">
                    <div className="report-letterhead-main">
                        <img src={cmLogo} alt="Christalin Mirrors" className="report-logo" />
                        <div>
                            <div className="report-title">Christalin Mirrors — {period.charAt(0).toUpperCase() + period.slice(1)} Executive Report</div>
                            <div className="report-range">{label}</div>
                        </div>
                    </div>
                    <div className="report-letterhead-meta">
                        <div><span>Report No.</span> {reportNo}</div>
                        <div><span>Generated</span> {generatedAt}</div>
                        <div><span>Branches Covered</span> {branchNames.length}</div>
                    </div>
                </div>

                <div className="report-section-title">Performance Snapshot</div>
                <div className="report-snapshot-grid">
                    <SnapshotCard label="Yesterday" sub={new Date(yesterday + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} stats={yesterdayStats} prev={dayBeforeStats} />
                    <SnapshotCard label="Week to Date" sub={`${new Date(weekRange.start + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – today, vs. same days last week`} stats={wtdStats} prev={prevWtdStats} />
                    <SnapshotCard label="Month to Date" sub={`${new Date(monthRange.start + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – today, vs. same days last month`} stats={mtdStats} prev={prevMtdStats} />
                </div>

                <div className="report-section-title">
                    Branch Performance — {label}
                    <span className="report-section-trend">vs. previous {period} period <Trend curr={totals.revenue} prev={prevPeriodStats.revenue} /></span>
                </div>

                <div className="table-scroll">
                    <table className="admin-table report-table">
                        <thead>
                            <tr>
                                <th>Branch</th><th>Revenue</th><th>Paid Inv.</th><th>Cancelled Inv.</th>
                                <th>Completed Appts</th><th>Cancelled Appts</th><th>Pending Appts</th>
                                <th>New Clients</th><th>Active Staff</th><th>Low Stock Items</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branchStats.map(b => (
                                <tr key={b.name}>
                                    <td className="cell-primary">{b.name}</td>
                                    <td>₹{b.revenue.toLocaleString()}</td>
                                    <td>{b.paidCount}</td>
                                    <td>{b.cancelledCount}</td>
                                    <td>{b.completed}</td>
                                    <td>{b.apptCancelled}</td>
                                    <td>{b.apptPending}</td>
                                    <td>{b.newClients}</td>
                                    <td>{b.staffCount}</td>
                                    <td>{b.lowStock.length > 0 ? b.lowStock.map(i => i.name).join(', ') : '—'}</td>
                                </tr>
                            ))}
                            <tr className="report-totals-row">
                                <td className="cell-primary">Total</td>
                                <td>₹{totals.revenue.toLocaleString()}</td>
                                <td>{totals.paidCount}</td>
                                <td>{totals.cancelledCount}</td>
                                <td>{totals.completed}</td>
                                <td>{totals.apptCancelled}</td>
                                <td>{totals.apptPending}</td>
                                <td>{totals.newClients}</td>
                                <td>{totals.staffCount}</td>
                                <td>{totals.lowStockCount}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="report-section-title">Business Insights</div>
                <div className="report-insights-grid">
                    <div className="insight-tile">
                        <div className="insight-label">Top Performing Branch</div>
                        <div className="insight-value">{topBranch?.name ?? '—'}</div>
                        <div className="insight-note">₹{(topBranch?.revenue ?? 0).toLocaleString()} revenue this {period}</div>
                    </div>
                    <div className="insight-tile">
                        <div className="insight-label">Average Ticket Size</div>
                        <div className="insight-value">₹{Math.round(avgTicket).toLocaleString()}</div>
                        <div className="insight-note">across {totals.paidCount} paid invoice{totals.paidCount === 1 ? '' : 's'}</div>
                    </div>
                    <div className="insight-tile">
                        <div className="insight-label">Appointment Completion Rate</div>
                        <div className="insight-value">{completionRate.toFixed(1)}%</div>
                        <div className="insight-note">{totals.completed} completed of {apptDecided} decided</div>
                    </div>
                    <div className="insight-tile">
                        <div className="insight-label">Inventory Alerts</div>
                        <div className="insight-value">{totals.lowStockCount}</div>
                        <div className="insight-note">low-stock item{totals.lowStockCount === 1 ? '' : 's'} across {branchesWithAlerts} branch{branchesWithAlerts === 1 ? '' : 'es'}</div>
                    </div>
                </div>

                <div className="report-note">
                    Note: staff attendance is recorded per-device only (not yet centralized), so it's excluded here — "Active Staff" is the current roster headcount, not who showed up today. Week/Month-to-Date figures compare the same number of elapsed days against the prior week/month for a like-for-like trend.
                </div>

                <div className="report-signoff">
                    <div className="signoff-block"><span>Prepared by</span></div>
                    <div className="signoff-block"><span>Reviewed by</span></div>
                    <div className="signoff-block"><span>Date</span></div>
                </div>

                <div className="report-footer">
                    {reportNo} · Generated {generatedAt} · Christalin Mirrors — Confidential, Internal Use Only. Retain for records.
                </div>
            </div>
        </div>
    )
}
