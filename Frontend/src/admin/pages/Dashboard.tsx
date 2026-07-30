import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Users, TrendingUp, Clock, FileText, Building2, Receipt, UserPlus, UserCheck } from 'lucide-react'
import { appointmentStore, clientStore, invoiceStore, visitStore, staffStore } from '../data/store'
import { authStore, getBranchScope, scopeByBranch } from '../data/authStore'
import { branches as branchList } from '../../data/branches'
import { cld } from '../../lib/cld'
import type { Appointment } from '../data/types'
import '../AdminShared.css'
import './Dashboard.css'

export default function Dashboard() {
    const navigate = useNavigate()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [invoices, setInvoices] = useState<any[]>([])
    const [visits, setVisits] = useState<any[]>([])
    const [staffList, setStaffList] = useState<any[]>([])

    const today = new Date().toISOString().split('T')[0]
    const session = authStore.getSession()
    const branchScope = getBranchScope()
    const isReceptionist = session?.role === 'receptionist'

    useEffect(() => {
        const loadAll = async () => {
            const [apts, cls, invs, vsts, stfs] = await Promise.all([
                appointmentStore.getAll(),
                clientStore.getAll(),
                invoiceStore.getAll(),
                visitStore.getAll(),
                staffStore.getAll(),
            ])
            setAppointments(apts)
            setClients(scopeByBranch(cls))
            setInvoices(scopeByBranch(invs))
            setVisits(scopeByBranch(vsts))
            setStaffList(stfs)
        }
        loadAll()
    }, [])

    const scopedAppointments = scopeByBranch(appointments)

    const todayApts = scopedAppointments.filter(a => a.date === today)
    const pendingApts = scopedAppointments.filter(a => a.status === 'pending')
    const upcoming = scopedAppointments.filter(a => a.date >= today && (a.status === 'confirmed' || a.status === 'pending' || a.status === 'arrived')).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 6)

    // Revenue calculations
    const thisMonthInvoices = invoices.filter(i => i.status === 'paid' && i.date.startsWith(today.slice(0, 7)))
    const monthRevenue = thisMonthInvoices.reduce((s, i) => s + i.total, 0)
    const allPaidTotal = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
    const todayRevenue = invoices.filter(i => i.status === 'paid' && i.date === today).reduce((s, i) => s + i.total, 0)

    // Top services by frequency
    const serviceCount: Record<string, number> = {}
    visits.forEach(v => (v.services || []).forEach((s: any) => { serviceCount[s.name] = (serviceCount[s.name] || 0) + 1 }))
    const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

    // Recent invoices
    const recentInvoices = invoices.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

    // Owner-only: per-branch breakdown (invoices/scopedAppointments/clients
    // are already the full unscoped datasets when branchScope is null).
    const isOwner = session?.role === 'owner'
    const thisMonth = today.slice(0, 7)
    const branchOverview = isOwner ? branchList.map((b) => {
        const name = b.name.replace('CM — ', '')
        const branchPaidInvoices = invoices.filter((i) => i.branch === name && i.status === 'paid')
        const todayRevenue = branchPaidInvoices.filter((i) => i.date === today).reduce((s, i) => s + i.total, 0)
        const monthRevenueForBranch = branchPaidInvoices.filter((i) => i.date.startsWith(thisMonth)).reduce((s, i) => s + i.total, 0)
        const completedToday = scopedAppointments.filter((a) => a.branch === name && a.status === 'completed' && a.date === today).length
        const bookingsToday = scopedAppointments.filter((a) => a.branch === name && a.date === today).length
        const monthAppointments = scopedAppointments.filter((a) => a.branch === name && a.date.startsWith(thisMonth)).length
        const totalClients = clients.filter((c) => c.branch === name).length
        const staffCount = staffList.filter((s) => s.branch === name && s.isActive).length
        return { name, image: b.image, todayRevenue, monthRevenueForBranch, completedToday, bookingsToday, monthAppointments, totalClients, staffCount }
    }) : []

    return (
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-title">
                    {branchScope ? `${branchScope} Dashboard` : 'Dashboard'}
                </h1>
                {!branchScope && (
                    <p className="admin-page-sub">Overview of salon operations — all branches</p>
                )}
            </div>

            {/* Quick Actions */}
            {session?.role !== 'owner' && (
                <div className="dashboard-quick-actions">
                    <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/billing')}>
                        <Receipt size={14} /> New Bill
                    </button>
                    <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/clients', { state: { openForm: true } })}>
                        <UserPlus size={14} /> New Client
                    </button>
                    {session?.role === 'manager' && (
                        <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/attendance')}>
                            <UserCheck size={14} /> Take Attendance
                        </button>
                    )}
                </div>
            )}

            {/* Branch Overview (Owner only) */}
            {isOwner && (
                <div className="dashboard-branch-grid">
                    {branchOverview.map((b) => (
                        <div
                            key={b.name}
                            className="dashboard-branch-card"
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate('/admin/revenue', { state: { branch: b.name } })}
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/admin/revenue', { state: { branch: b.name } }) }}
                        >
                            <img
                                src={cld(b.image, 500)}
                                alt=""
                                className="dashboard-branch-card-img"
                                loading="lazy"
                            />
                            <div className="dashboard-branch-card-fade" />
                            <div className="dashboard-branch-card-content">
                                <h3><Building2 size={15} /> {b.name}</h3>
                                <div className="dashboard-branch-metrics">
                                    <div className="dashboard-branch-metric">
                                        <span className="value">₹{b.todayRevenue.toLocaleString()}</span>
                                        <span className="label">Today's Revenue</span>
                                    </div>
                                    <div className="dashboard-branch-metric">
                                        <span className="value">{b.completedToday}</span>
                                        <span className="label">Completed</span>
                                    </div>
                                    <div className="dashboard-branch-metric">
                                        <span className="value">{b.bookingsToday}</span>
                                        <span className="label">Bookings</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="admin-stats-grid">
                <div className="admin-stat-card" onClick={() => navigate('/admin/appointments')} style={{ cursor: 'pointer', borderTop: '4px solid var(--border-strong)' }}>
                    <div className="stat-icon"><Calendar size={20} /></div>
                    <div className="stat-label">Today's Appointments</div>
                    <div className="stat-value accent">{todayApts.length}</div>
                </div>
                <div className="admin-stat-card" onClick={() => navigate('/admin/appointments')} style={{ cursor: 'pointer', borderTop: '4px solid var(--warning)' }}>
                    <div className="stat-icon"><Clock size={20} /></div>
                    <div className="stat-label">Pending Requests</div>
                    <div className="stat-value" style={{ color: pendingApts.length > 0 ? 'var(--warning-light)' : 'var(--success-light)' }}>{pendingApts.length}</div>
                </div>
                <div className="admin-stat-card" onClick={() => navigate('/admin/clients')} style={{ cursor: 'pointer', borderTop: '4px solid var(--success)' }}>
                    <div className="stat-icon"><Users size={20} /></div>
                    <div className="stat-label">Total Clients</div>
                    <div className="stat-value green">{clients.length}</div>
                </div>
                {isOwner ? (
                    <div className="admin-stat-card" style={{ borderTop: '4px solid var(--accent-alt)' }}>
                        <div className="stat-icon"><TrendingUp size={20} /></div>
                        <div className="stat-label">Today's Revenue</div>
                        <div className="stat-value accent">₹{todayRevenue.toLocaleString()}</div>
                        <button
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            style={{ marginTop: 10, padding: '4px 0' }}
                            onClick={() => navigate('/admin/revenue')}
                        >
                            View Revenue →
                        </button>
                    </div>
                ) : !isReceptionist && (
                    <div className="admin-stat-card" onClick={() => navigate('/admin/invoices')} style={{ cursor: 'pointer', borderTop: '4px solid var(--accent-alt)' }}>
                        <div className="stat-icon"><TrendingUp size={20} /></div>
                        <div className="stat-label">This Month Revenue</div>
                        <div className="stat-value accent">₹{monthRevenue.toLocaleString()}</div>
                    </div>
                )}
            </div>

            {/* Alerts — branch staff only; owner sees all branches, so this
                per-branch confirmation nudge isn't relevant on their dashboard */}
            {pendingApts.length > 0 && session?.role !== 'owner' && (
                <div className="dashboard-alerts">
                    <div className="dashboard-alert alert-warning" onClick={() => navigate('/admin/appointments')}>
                        <Clock size={16} className="dashboard-alert-icon" />
                        <span className="dashboard-alert-text">
                            <strong>{pendingApts.length}</strong> pending appointment{pendingApts.length > 1 ? 's' : ''} need{pendingApts.length === 1 ? 's' : ''} confirmation
                        </span>
                        <button className="admin-btn admin-btn-ghost admin-btn-sm dashboard-alert-action">Review &rarr;</button>
                    </div>
                </div>
            )}

            <div className="dashboard-grid">
                <div>
                    {isOwner ? (
                        /* Branch Performance — strategic cross-branch view instead of
                           per-appointment / per-invoice operational detail */
                        <div className="admin-form-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ margin: 0, fontSize: 14 }}>Branch Performance — This Month</h3>
                            </div>
                            <div className="admin-table-wrapper mobile-table-wrapper" style={{ marginBottom: 0 }}>
                                <table className="admin-table">
                                    <thead><tr><th>Branch</th><th>Revenue</th><th>Clients</th><th>Staff</th><th>Appointments</th></tr></thead>
                                    <tbody>
                                        {branchOverview.map(b => (
                                            <tr key={b.name}>
                                                <td className="cell-primary" style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{b.name}</td>
                                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{b.monthRevenueForBranch.toLocaleString()}</td>
                                                <td className="cell-secondary">{b.totalClients}</td>
                                                <td className="cell-secondary">{b.staffCount}</td>
                                                <td className="cell-secondary">{b.monthAppointments}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mobile-cards">
                                {branchOverview.map(b => (
                                    <div className="mobile-card" key={b.name}>
                                        <div className="mobile-card-top">
                                            <div className="mobile-card-heading">
                                                <div>
                                                    <div className="mobile-card-title">{b.name}</div>
                                                    <div className="mobile-card-sub">This month's performance</div>
                                                </div>
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>₹{b.monthRevenueForBranch.toLocaleString()}</span>
                                        </div>
                                        <div className="mobile-card-meta">
                                            <div className="mobile-card-meta-item">
                                                <span className="mobile-card-meta-label">Clients</span>
                                                <span>{b.totalClients}</span>
                                            </div>
                                            <div className="mobile-card-meta-item">
                                                <span className="mobile-card-meta-label">Staff</span>
                                                <span>{b.staffCount}</span>
                                            </div>
                                            <div className="mobile-card-meta-item">
                                                <span className="mobile-card-meta-label">Appointments</span>
                                                <span>{b.monthAppointments}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Upcoming Appointments */}
                            <div className="admin-form-card" style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3 style={{ margin: 0, fontSize: 14 }}>Upcoming Appointments</h3>
                                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => navigate('/admin/calendar')}>View Calendar →</button>
                                </div>
                                <div className="admin-table-wrapper mobile-table-wrapper" style={{ marginBottom: 0 }}>
                                    <table className="admin-table">
                                        <thead><tr><th>Date</th><th>Time</th><th>Client</th><th>Service</th><th>Branch</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {upcoming.length === 0 ? (
                                                <tr><td colSpan={6}>
                                                    <div className="admin-empty" style={{ padding: 40 }}>
                                                        <Calendar size={32} className="admin-empty-icon" style={{ opacity: 0.5, margin: '0 auto 16px' }} />
                                                        <h3 style={{ fontSize: 16 }}>No upcoming appointments</h3>
                                                    </div>
                                                </td></tr>
                                            ) : upcoming.map(apt => (
                                                <tr key={apt.id}>
                                                    <td>{new Date(apt.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                                    <td>{apt.time}</td>
                                                    <td className="cell-primary" style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{apt.clientName}</td>
                                                    <td className="cell-secondary">{apt.service}</td>
                                                    <td className="cell-secondary">{apt.branch}</td>
                                                    <td><span className={`status-badge ${apt.status}`}>{apt.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mobile-cards">
                                    {upcoming.length === 0 ? (
                                        <div className="admin-empty" style={{ padding: 32 }}>
                                            <Calendar size={28} className="admin-empty-icon" style={{ opacity: 0.5 }} />
                                            <h3 style={{ fontSize: 15 }}>No upcoming appointments</h3>
                                        </div>
                                    ) : upcoming.map(apt => (
                                        <div className="mobile-card" key={apt.id}>
                                            <div className="mobile-card-top">
                                                <div className="mobile-card-heading">
                                                    <div>
                                                        <div className="mobile-card-title">{apt.clientName}</div>
                                                        <div className="mobile-card-sub">
                                                            {new Date(apt.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {apt.time}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`status-badge ${apt.status}`}>{apt.status}</span>
                                            </div>
                                            <div className="mobile-card-meta">
                                                <div className="mobile-card-meta-item full">
                                                    <span className="mobile-card-meta-label">Service</span>
                                                    <span>{apt.service}</span>
                                                </div>
                                                <div className="mobile-card-meta-item">
                                                    <span className="mobile-card-meta-label">Branch</span>
                                                    <span>{apt.branch}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Invoices */}
                            {!isReceptionist && (
                                <div className="admin-form-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 style={{ margin: 0, fontSize: 14 }}>Recent Invoices</h3>
                                        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => navigate('/admin/invoices')}>View All →</button>
                                    </div>
                                    <div className="admin-table-wrapper mobile-table-wrapper" style={{ marginBottom: 0 }}>
                                        <table className="admin-table">
                                            <thead><tr><th>Invoice</th><th>Client</th><th>Total</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {recentInvoices.map(inv => (
                                                    <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/invoices/${inv.id}`)}>
                                                        <td className="cell-primary" style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{inv.invoiceNumber}</td>
                                                        <td className="cell-primary">{inv.clientName}</td>
                                                        <td className="cell-secondary" style={{ fontWeight: 600 }}>₹{inv.total.toLocaleString()}</td>
                                                        <td><span className={`status-badge ${inv.status === 'paid' ? 'confirmed' : inv.status === 'sent' ? 'pending' : inv.status}`}>{inv.status}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mobile-cards">
                                        {recentInvoices.map(inv => (
                                            <div className="mobile-card" key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/invoices/${inv.id}`)}>
                                                <div className="mobile-card-top">
                                                    <div className="mobile-card-heading">
                                                        <div>
                                                            <div className="mobile-card-title" style={{ color: 'var(--accent)' }}>{inv.invoiceNumber}</div>
                                                            <div className="mobile-card-sub">{inv.clientName}</div>
                                                        </div>
                                                    </div>
                                                    <span className={`status-badge ${inv.status === 'paid' ? 'confirmed' : inv.status === 'sent' ? 'pending' : inv.status}`}>{inv.status}</span>
                                                </div>
                                                <div className="mobile-card-meta">
                                                    <div className="mobile-card-meta-item full">
                                                        <span className="mobile-card-meta-label">Total</span>
                                                        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>₹{inv.total.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Sidebar: Quick Stats */}
                <div>
                    {/* Revenue Summary */}
                    {!isReceptionist && (
                        <div className="admin-form-card" style={{ marginBottom: 20 }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: 14 }}>Revenue Summary</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>This Month</span>
                                    <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--success-light)' }}>₹{monthRevenue.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>All Time</span>
                                    <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-alt)' }}>₹{allPaidTotal.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="dashboard-revenue-divider">
                                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>INVOICES (PAID)</span>
                                    <span className="dashboard-counter-badge">{invoices.filter(i => i.status === 'paid').length}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Top Services */}
                    <div className="admin-form-card" style={{ marginBottom: 20 }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 14 }}>Popular Services</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {topServices.map(([name, count], i) => (
                                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                                    <span style={{ fontFamily: 'monospace', color: 'var(--text-dim)', fontSize: 12, width: 20 }}>{i + 1}.</span>
                                    <span className="cell-primary" style={{ flex: 1, fontSize: 13 }}>{name}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{count}x</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
