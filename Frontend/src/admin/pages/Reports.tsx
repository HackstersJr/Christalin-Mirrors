import { useEffect, useState } from 'react'
import { Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { invoiceStore, appointmentStore, clientStore, staffStore, inventoryStore } from '../data/store'
import { branches as branchList } from '../../data/branches'
import type { Invoice, Appointment, Client, StaffMember, InventoryItem } from '../data/types'
import cmLogo from '../../assets/cm-logo-white.png'
import '../AdminShared.css'
import './Reports.css'

type Period = 'daily' | 'weekly' | 'monthly'

// Clean short branch name (e.g. "Belgaum"), matching mapBranch() in store.ts —
// not branchList's fuller display label (e.g. "Belgaum (Belagavi)").
const branchNames = branchList.map(b => b.name.replace('CM — ', '').replace(/\s*\([^)]*\)$/, ''))

function pad(n: number) { return String(n).padStart(2, '0') }
function toIso(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function todayIso() { return toIso(new Date()) }

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

            <div id="report-print" className="report-sheet">
                <div className="report-letterhead">
                    <img src={cmLogo} alt="Christalin Mirrors" className="report-logo" />
                    <div>
                        <div className="report-title">Christalin Mirrors — {period.charAt(0).toUpperCase() + period.slice(1)} Report</div>
                        <div className="report-range">{label}</div>
                    </div>
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

                <div className="report-note">
                    Note: staff attendance is recorded per-device only (not yet centralized), so it's excluded here — "Active Staff" is the current roster headcount, not who showed up today.
                </div>

                <div className="report-footer">
                    Generated {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · Christalin Mirrors — Executive Report
                </div>
            </div>
        </div>
    )
}
