import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Users, TrendingUp, Clock, AlertTriangle, Package, FileText } from 'lucide-react'
import { appointmentStore, clientStore, invoiceStore, inventoryStore, visitStore } from '../data/store'
import type { Appointment, Invoice } from '../data/types'
import '../AdminShared.css'
import './Dashboard.css'

export default function Dashboard() {
    const navigate = useNavigate()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const today = new Date().toISOString().split('T')[0]

    useEffect(() => { setAppointments(appointmentStore.getAll()) }, [])

    const clients = clientStore.getAll()
    const invoices = invoiceStore.getAll()
    const lowStock = inventoryStore.getLowStock()
    const visits = visitStore.getAll()

    const todayApts = appointments.filter(a => a.date === today)
    const pendingApts = appointments.filter(a => a.status === 'pending')
    const upcoming = appointments.filter(a => a.date >= today && (a.status === 'confirmed' || a.status === 'pending')).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 6)

    // Revenue calculations
    const thisMonthInvoices = invoices.filter(i => i.status === 'paid' && i.date.startsWith(today.slice(0, 7)))
    const monthRevenue = thisMonthInvoices.reduce((s, i) => s + i.total, 0)
    const allPaidTotal = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)

    // Top services by frequency
    const serviceCount: Record<string, number> = {}
    visits.forEach(v => v.services.forEach(s => { serviceCount[s.name] = (serviceCount[s.name] || 0) + 1 }))
    const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

    // Recent invoices
    const recentInvoices = invoices.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

    return (
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Dashboard</h1>
                <p className="admin-page-sub">Overview of salon operations</p>
            </div>

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
                <div className="admin-stat-card" onClick={() => navigate('/admin/invoices')} style={{ cursor: 'pointer', borderTop: '4px solid var(--accent-alt)' }}>
                    <div className="stat-icon"><TrendingUp size={20} /></div>
                    <div className="stat-label">This Month Revenue</div>
                    <div className="stat-value accent">₹{monthRevenue.toLocaleString()}</div>
                </div>
            </div>

            {/* Alerts */}
            {(pendingApts.length > 0 || lowStock.length > 0) && (
                <div className="dashboard-alerts">
                    {pendingApts.length > 0 && (
                        <div className="dashboard-alert alert-warning" onClick={() => navigate('/admin/appointments')}>
                            <Clock size={16} className="dashboard-alert-icon" />
                            <span className="dashboard-alert-text">
                                <strong>{pendingApts.length}</strong> pending appointment{pendingApts.length > 1 ? 's' : ''} need{pendingApts.length === 1 ? 's' : ''} confirmation
                            </span>
                            <button className="admin-btn admin-btn-ghost admin-btn-sm dashboard-alert-action">Review &rarr;</button>
                        </div>
                    )}
                    {lowStock.length > 0 && (
                        <div className="dashboard-alert alert-danger" onClick={() => navigate('/admin/inventory')}>
                            <AlertTriangle size={16} className="dashboard-alert-icon" />
                            <span className="dashboard-alert-text">
                                <strong>{lowStock.length}</strong> product{lowStock.length > 1 ? 's' : ''} running low on stock
                            </span>
                            <button className="admin-btn admin-btn-ghost admin-btn-sm dashboard-alert-action">Review &rarr;</button>
                        </div>
                    )}
                </div>
            )}

            <div className="dashboard-grid">
                <div>
                    {/* Upcoming Appointments */}
                    <div className="admin-form-card" style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: 14 }}>Upcoming Appointments</h3>
                            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => navigate('/admin/calendar')}>View Calendar →</button>
                        </div>
                        <div className="admin-table-wrapper" style={{ marginBottom: 0 }}>
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
                    </div>

                    {/* Recent Invoices */}
                    <div className="admin-form-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: 14 }}>Recent Invoices</h3>
                            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => navigate('/admin/invoices')}>View All →</button>
                        </div>
                        <div className="admin-table-wrapper" style={{ marginBottom: 0 }}>
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
                    </div>
                </div>

                {/* Sidebar: Quick Stats */}
                <div>
                    {/* Revenue Summary */}
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

                    {/* Low Stock */}
                    {lowStock.length > 0 && (
                        <div className="admin-form-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
                                <Package size={14} style={{ color: 'var(--danger)' }} />
                                <h3 style={{ margin: 0, fontSize: 14, color: 'var(--danger)' }}>Low Stock</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {lowStock.map(item => (
                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{item.currentStock} left</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
