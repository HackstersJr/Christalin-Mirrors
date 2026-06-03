import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Star, FileText, Clock, CreditCard } from 'lucide-react'
import { clientStore, visitStore, invoiceStore, appointmentStore } from '../data/store'
import type { Client, ServiceVisit, Invoice, Appointment } from '../data/types'
import '../AdminShared.css'

type Tab = 'history' | 'invoices' | 'appointments'

export default function ClientDetail() {
    const { clientId } = useParams<{ clientId: string }>()
    const navigate = useNavigate()
    const [client, setClient] = useState<Client | null>(null)
    const [visits, setVisits] = useState<ServiceVisit[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [tab, setTab] = useState<Tab>('history')

    useEffect(() => {
        if (!clientId) return
        const c = clientStore.getById(clientId)
        if (c) {
            setClient(c)
            setVisits(visitStore.getByClientId(clientId))
            setInvoices(invoiceStore.getByClientId(clientId))
            setAppointments(
                appointmentStore.getAll()
                    .filter(a => a.clientEmail === c.email)
                    .sort((a, b) => b.date.localeCompare(a.date))
            )
        }
    }, [clientId])

    if (!client) {
        return (
            <div className="admin-empty" style={{ padding: 60 }}>
                <h3>Client not found</h3>
                <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/clients')}>Back to Clients</button>
            </div>
        )
    }

    const totalSpent = visits.reduce((sum, v) => sum + v.total, 0)
    const avgSpend = visits.length > 0 ? Math.round(totalSpent / visits.length) : 0

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <button className="admin-btn admin-btn-ghost" onClick={() => navigate('/admin/clients')}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="admin-page-title" style={{ marginBottom: 0 }}>{client.name}</h1>
                    <p className="admin-page-sub">Client since {new Date(client.joinedDate + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            {/* Profile + Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                {/* Profile Card */}
                <div className="admin-form-card" style={{ margin: 0 }}>
                    <h3 style={{ marginBottom: 16, fontSize: 14 }}>Profile</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                            <Mail size={14} style={{ color: 'var(--text-muted)' }} /> {client.email}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                            <Phone size={14} style={{ color: 'var(--text-muted)' }} /> {client.phone}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                            <MapPin size={14} style={{ color: 'var(--text-muted)' }} /> {client.branch}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                            Gender: {client.gender} &nbsp;|&nbsp; Preferred Stylist: {client.preferredStylist || '—'}
                        </div>
                        {client.notes && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, padding: '8px 12px', background: 'var(--bg-card-alt)', borderRadius: 6 }}>
                                📝 {client.notes}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                            {client.tags.map(t => <span key={t} className="admin-tag">{t}</span>)}
                        </div>
                    </div>
                </div>

                {/* Stats Card */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="admin-stat-card">
                        <div className="stat-label">Total Visits</div>
                        <div className="stat-value accent">{client.totalVisits}</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-label">Total Spent</div>
                        <div className="stat-value green">₹{totalSpent.toLocaleString()}</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-label">Avg Spend</div>
                        <div className="stat-value">₹{avgSpend.toLocaleString()}</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-label">Last Visit</div>
                        <div className="stat-value" style={{ fontSize: 18 }}>
                            {client.lastVisit ? new Date(client.lastVisit + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                {(['history', 'invoices', 'appointments'] as Tab[]).map(t => (
                    <button key={t} className={`admin-btn ${tab === t ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                        onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
                        {t === 'history' && <Clock size={14} />}
                        {t === 'invoices' && <FileText size={14} />}
                        {t === 'appointments' && <CreditCard size={14} />}
                        {t === 'history' ? `Service History (${visits.length})` : t === 'invoices' ? `Invoices (${invoices.length})` : `Appointments (${appointments.length})`}
                    </button>
                ))}
            </div>

            {/* Service History Tab */}
            {tab === 'history' && (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Date</th><th>Services</th><th>Stylist</th><th>Total</th><th>Payment</th><th>Rating</th></tr>
                        </thead>
                        <tbody>
                            {visits.length === 0 ? (
                                <tr><td colSpan={6}><div className="admin-empty" style={{ padding: 32 }}><h3>No service history</h3></div></td></tr>
                            ) : visits.map(v => (
                                <tr key={v.id}>
                                    <td>{new Date(v.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td>
                                        {v.services.map((s, i) => (
                                            <div key={i} style={{ fontSize: 12 }}>
                                                <span style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                                                <span style={{ color: 'var(--text-dim)', marginLeft: 6 }}>₹{s.price.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </td>
                                    <td>{v.stylist}</td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--accent)' }}>₹{v.total.toLocaleString()}</div>
                                        {v.discount > 0 && <div style={{ fontSize: 10, color: 'var(--success-light)' }}>-₹{v.discount} discount</div>}
                                    </td>
                                    <td style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>{v.paymentMethod}</td>
                                    <td>
                                        {v.rating ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--warning-light)' }}>
                                                <Star size={12} fill="#FBBF24" /> {v.rating}/5
                                            </span>
                                        ) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Invoices Tab */}
            {tab === 'invoices' && (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Invoice #</th><th>Date</th><th>Items</th><th>Subtotal</th><th>Tax</th><th>Total</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr><td colSpan={7}><div className="admin-empty" style={{ padding: 32 }}><h3>No invoices</h3></div></td></tr>
                            ) : invoices.map(inv => (
                                <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/invoices/${inv.id}`)}>
                                    <td style={{ fontWeight: 500, color: 'var(--accent)' }}>{inv.invoiceNumber}</td>
                                    <td>{new Date(inv.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td>{inv.items.map(i => i.service).join(', ')}</td>
                                    <td>₹{inv.subtotal.toLocaleString()}</td>
                                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹{inv.taxAmount.toLocaleString()}</td>
                                    <td style={{ fontWeight: 600 }}>₹{inv.total.toLocaleString()}</td>
                                    <td><span className={`status-badge ${inv.status === 'paid' ? 'confirmed' : inv.status === 'sent' ? 'pending' : inv.status}`}>{inv.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Appointments Tab */}
            {tab === 'appointments' && (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Date</th><th>Time</th><th>Service</th><th>Stylist</th><th>Branch</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {appointments.length === 0 ? (
                                <tr><td colSpan={6}><div className="admin-empty" style={{ padding: 32 }}><h3>No appointments</h3></div></td></tr>
                            ) : appointments.map(apt => (
                                <tr key={apt.id}>
                                    <td>{new Date(apt.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td>{apt.time}</td>
                                    <td>{apt.service}</td>
                                    <td>{apt.stylist || '—'}</td>
                                    <td>{apt.branch}</td>
                                    <td><span className={`status-badge ${apt.status}`}>{apt.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
