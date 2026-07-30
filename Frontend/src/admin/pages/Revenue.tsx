import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { invoiceStore } from '../data/store'
import { branches as branchList } from '../../data/branches'
import type { Invoice } from '../data/types'
import '../AdminShared.css'
import './Revenue.css'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const sum = (items: Invoice[]) => items.reduce((s, i) => s + i.total, 0)

export default function Revenue() {
    const location = useLocation()
    const initialBranch = (location.state as { branch?: string } | null)?.branch || 'all'
    const [branchFilter, setBranchFilter] = useState(initialBranch)
    const [invoices, setInvoices] = useState<Invoice[]>([])

    useEffect(() => { setInvoices(invoiceStore.getAll()) }, [])

    const today = new Date().toISOString().split('T')[0]
    const thisMonth = today.slice(0, 7)
    const thisYear = today.slice(0, 4)
    const branchNames = branchList.map(b => b.name.replace('CM — ', ''))

    const paid = invoices.filter(i => i.status === 'paid')
    const scoped = branchFilter === 'all' ? paid : paid.filter(i => i.branch === branchFilter)

    const todayRevenue = sum(scoped.filter(i => i.date === today))
    const monthRevenue = sum(scoped.filter(i => i.date.startsWith(thisMonth)))
    const yearRevenue = sum(scoped.filter(i => i.date.startsWith(thisYear)))
    const allTimeRevenue = sum(scoped)

    // Branch-by-branch comparison, independent of the active filter.
    const branchComparison = branchNames.map(name => {
        const branchPaid = paid.filter(i => i.branch === name)
        return {
            name,
            today: sum(branchPaid.filter(i => i.date === today)),
            month: sum(branchPaid.filter(i => i.date.startsWith(thisMonth))),
            year: sum(branchPaid.filter(i => i.date.startsWith(thisYear))),
            allTime: sum(branchPaid),
        }
    })

    // Monthly trend for the current year, within the active branch scope.
    const monthlyTrend = MONTH_LABELS.map((label, i) => {
        const monthKey = `${thisYear}-${String(i + 1).padStart(2, '0')}`
        return { label, revenue: sum(scoped.filter(inv => inv.date.startsWith(monthKey))) }
    })
    const maxMonthly = Math.max(...monthlyTrend.map(m => m.revenue), 1)

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Revenue</h1>
                    <p className="admin-page-sub">
                        {branchFilter === 'all' ? 'Money flow across all branches' : `Money flow for ${branchFilter}`}
                    </p>
                </div>
            </div>

            {/* Branch filter */}
            <div className="revenue-branch-tabs">
                <button className={`revenue-tab ${branchFilter === 'all' ? 'active' : ''}`} onClick={() => setBranchFilter('all')}>
                    All Branches
                </button>
                {branchNames.map(name => (
                    <button key={name} className={`revenue-tab ${branchFilter === name ? 'active' : ''}`} onClick={() => setBranchFilter(name)}>
                        {name}
                    </button>
                ))}
            </div>

            {/* Stat cards */}
            <div className="admin-stats-grid">
                <div className="admin-stat-card" style={{ borderTop: '4px solid var(--border-strong)' }}>
                    <div className="stat-label">Today</div>
                    <div className="stat-value accent">₹{todayRevenue.toLocaleString()}</div>
                </div>
                <div className="admin-stat-card" style={{ borderTop: '4px solid var(--warning)' }}>
                    <div className="stat-label">This Month</div>
                    <div className="stat-value accent">₹{monthRevenue.toLocaleString()}</div>
                </div>
                <div className="admin-stat-card" style={{ borderTop: '4px solid var(--success)' }}>
                    <div className="stat-label">This Year</div>
                    <div className="stat-value accent">₹{yearRevenue.toLocaleString()}</div>
                </div>
                <div className="admin-stat-card" style={{ borderTop: '4px solid var(--accent-alt)' }}>
                    <div className="stat-label">All Time</div>
                    <div className="stat-value accent">₹{allTimeRevenue.toLocaleString()}</div>
                </div>
            </div>

            {/* Monthly trend */}
            <div className="admin-form-card" style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14 }}>Monthly Revenue — {thisYear}</h3>
                <div className="revenue-trend">
                    {monthlyTrend.map(m => (
                        <div key={m.label} className="revenue-trend-row">
                            <span className="revenue-trend-label">{m.label}</span>
                            <div className="revenue-trend-bar-track">
                                <div className="revenue-trend-bar" style={{ width: `${(m.revenue / maxMonthly) * 100}%` }} />
                            </div>
                            <span className="revenue-trend-value">₹{m.revenue.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Branch comparison — only meaningful when not already scoped to one */}
            {branchFilter === 'all' && (
                <div className="admin-form-card">
                    <h3 style={{ margin: '0 0 16px', fontSize: 14 }}>Branch Comparison</h3>
                    <div className="admin-table-wrapper" style={{ marginBottom: 0 }}>
                        <table className="admin-table">
                            <thead><tr><th>Branch</th><th>Today</th><th>This Month</th><th>This Year</th><th>All Time</th></tr></thead>
                            <tbody>
                                {branchComparison.map(b => (
                                    <tr key={b.name} style={{ cursor: 'pointer' }} onClick={() => setBranchFilter(b.name)}>
                                        <td className="cell-primary" style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                                            <Building2 size={13} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--accent)' }} />
                                            {b.name}
                                        </td>
                                        <td className="cell-secondary">₹{b.today.toLocaleString()}</td>
                                        <td className="cell-secondary">₹{b.month.toLocaleString()}</td>
                                        <td className="cell-secondary">₹{b.year.toLocaleString()}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{b.allTime.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
