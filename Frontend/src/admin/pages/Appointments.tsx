import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Clock, CalendarClock, Phone, MessageCircle, Eye } from 'lucide-react'
import { appointmentStore, serviceStore, clientStore, staffStore } from '../data/store'
import { getBranchScope, scopeByBranch } from '../data/authStore'
import type { Appointment, ServiceRecord, Client, StaffMember } from '../data/types'
import Dropdown from '../components/Dropdown'
import '../AdminShared.css'

const timeSlots = [
    '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM',
    '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM',
]

// Digits only, for tel:/wa.me links
const waNumber = (phone: string) => phone.replace(/\D/g, '')

const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'arrived', label: 'Arrived' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
]

const emptyForm = {
    clientName: '', clientEmail: '', clientPhone: '',
    date: '', time: '', service: '', stylist: '',
    status: 'pending' as const, notes: '', branch: 'Bengaluru',
    clientId: '', staffId: '', serviceId: ''
}

export default function Appointments() {
    const navigate = useNavigate()
    const branchScope = getBranchScope()
    const scopedEmptyForm = { ...emptyForm, branch: branchScope || 'Bengaluru' }
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(scopedEmptyForm)

    // Reschedule modal state
    const [rescheduleId, setRescheduleId] = useState<string | null>(null)
    const [reDate, setReDate] = useState('')
    const [reTime, setReTime] = useState('')

    // Data for dropdowns (Fix 7)
    const [services, setServices] = useState<ServiceRecord[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [staffList, setStaffList] = useState<StaffMember[]>([])

    const reload = () => setAppointments(scopeByBranch(appointmentStore.getAll()))
    useEffect(() => {
        reload()
        setServices(serviceStore.getAll().filter(s => s.isActive))
        // Clients are shared across branches; staff stays branch-scoped.
        setClients(clientStore.getAll())
        setStaffList(scopeByBranch(staffStore.getAll().filter(s => s.isActive)))
    }, [])

    const filtered = appointments.filter(a => {
        const matchSearch = a.clientName.toLowerCase().includes(search.toLowerCase()) || a.service.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'all' || a.status === statusFilter
        return matchSearch && matchStatus
    }).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Service & Time use the custom Dropdown (no native `required`),
        // so validate them explicitly before creating the appointment.
        if (!form.service || !form.time) {
            alert('Please select a service and time.')
            return
        }
        // Find entities to get IDs (Fix 7 / Task 1)
        const matchedClient = clients.find(c => c.name === form.clientName)
        const matchedStaff = staffList.find(s => s.name === form.stylist)
        const matchedService = services.find(s => s.name === form.service)
        
        appointmentStore.create({
            ...form,
            clientId: matchedClient?.id || '',
            staffId: matchedStaff?.id || '',
            serviceId: matchedService?.id || '',
        })
        setForm(scopedEmptyForm)
        setShowForm(false)
        reload()
    }

    const updateStatus = (id: string, status: Appointment['status']) => {
        appointmentStore.update(id, { status })
        reload()
    }

    // Resolve the client record linked to an appointment by id, name, or email
    // (seed appointments may not store a clientId directly).
    const getClient = (apt: Appointment) => clients.find(c =>
        (apt.clientId && c.id === apt.clientId) ||
        c.name === apt.clientName ||
        c.email === apt.clientEmail
    )

    // Appointments may not carry a phone directly, so fall back to the client's.
    const getPhone = (apt: Appointment) => apt.clientPhone || getClient(apt)?.phone || ''

    const viewClient = (apt: Appointment) => {
        const c = getClient(apt)
        if (c) navigate(`/admin/clients/${c.id}`)
    }

    const startReschedule = (apt: Appointment) => {
        setRescheduleId(apt.id)
        setReDate(apt.date)
        setReTime(apt.time)
    }

    const cancelReschedule = () => {
        setRescheduleId(null)
        setReDate('')
        setReTime('')
    }

    const saveReschedule = () => {
        if (!rescheduleId) return
        if (!reDate || !reTime) {
            alert('Please choose a new date and time.')
            return
        }
        appointmentStore.update(rescheduleId, { date: reDate, time: reTime })
        cancelReschedule()
        reload()
    }

    const renderActions = (apt: Appointment) => (
        <div className="admin-actions" style={{ alignItems: 'center' }}>
            {getClient(apt) && (
                <button
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                    title="View client"
                    onClick={() => viewClient(apt)}
                >
                    <Eye size={16} />
                </button>
            )}
            <button
                className="admin-btn admin-btn-ghost admin-btn-sm"
                title="Reschedule date & time"
                onClick={() => startReschedule(apt)}
            >
                <CalendarClock size={16} />
            </button>
            <Dropdown
                variant="status"
                value={apt.status}
                onChange={v => updateStatus(apt.id, v as Appointment['status'])}
                options={statusOptions}
                aria-label="Change status"
            />
        </div>
    )

    return (
        <div>
            <div className="admin-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="admin-page-title">Appointments</h1>
                    <p className="admin-page-sub">Manage all bookings and appointment requests</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Plus size={14} />
                    New Appointment
                </button>
            </div>

            {/* New Appointment Form */}
            {showForm && (
                <div className="admin-form-card">
                    <h3>New Appointment</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-grid">
                            <div className="admin-form-group">
                                <label className="admin-form-label">Client Name *</label>
                                <input className="admin-form-input" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} placeholder="Full name" required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Email *</label>
                                <input className="admin-form-input" type="email" value={form.clientEmail} onChange={e => setForm({ ...form, clientEmail: e.target.value })} placeholder="email@example.com" required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Phone</label>
                                <input className="admin-form-input" value={form.clientPhone} onChange={e => setForm({ ...form, clientPhone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Service *</label>
                                <Dropdown
                                    value={form.service}
                                    onChange={v => setForm({ ...form, service: v })}
                                    placeholder="Select service"
                                    options={services.map(s => ({ value: s.name, label: s.name }))}
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Date *</label>
                                <input className="admin-form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Time *</label>
                                <Dropdown
                                    value={form.time}
                                    onChange={v => setForm({ ...form, time: v })}
                                    placeholder="Select time"
                                    options={timeSlots.map(s => ({ value: s, label: s }))}
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Stylist</label>
                                <Dropdown
                                    value={form.stylist}
                                    onChange={v => setForm({ ...form, stylist: v })}
                                    placeholder="Select stylist (optional)"
                                    options={staffList.map(s => ({ value: s.name, label: `${s.name} (${s.role})` }))}
                                />
                            </div>
                            {!branchScope && (
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Branch</label>
                                    <Dropdown
                                        value={form.branch}
                                        onChange={v => setForm({ ...form, branch: v })}
                                        options={[
                                            { value: 'Bengaluru', label: 'Bengaluru' },
                                            { value: 'Kalaburagi', label: 'Kalaburagi' },
                                        ]}
                                    />
                                </div>
                            )}
                            <div className="admin-form-group full">
                                <label className="admin-form-label">Notes</label>
                                <textarea className="admin-form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any special notes..." />
                            </div>
                        </div>
                        <div className="admin-form-actions">
                            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setShowForm(false); setForm(scopedEmptyForm) }}>Cancel</button>
                            <button type="submit" className="admin-btn admin-btn-primary">Create Appointment</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="admin-toolbar">
                <input className="admin-search" placeholder="Search by name or service..." value={search} onChange={e => setSearch(e.target.value)} />
                <Dropdown
                    variant="filter"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[{ value: 'all', label: 'All Status' }, ...statusOptions]}
                />
            </div>

            {/* Table */}
            <div className="admin-table-wrapper mobile-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Service</th>
                            <th>Stylist</th>
                            {!branchScope && <th>Branch</th>}
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={branchScope ? 7 : 8}>
                                <div className="admin-empty" style={{ padding: 32 }}>
                                    <Search size={28} className="admin-empty-icon" />
                                    <h3>No appointments found</h3>
                                    <p>Try adjusting your filters</p>
                                </div>
                            </td></tr>
                        ) : filtered.map(apt => (
                            <tr key={apt.id}>
                                <td>
                                    <div className="cell-primary" style={{ fontSize: 14 }}>{apt.clientName}</div>
                                    <div className="cell-secondary">{apt.clientEmail}</div>
                                    {getPhone(apt) && (
                                        <a href={`tel:${getPhone(apt)}`} className="apt-contact-phone" style={{ fontSize: 12 }}>
                                            <Phone size={11} /> {getPhone(apt)}
                                        </a>
                                    )}
                                </td>
                                <td>{new Date(apt.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{apt.time}</span></td>
                                <td className="cell-secondary">{apt.service}</td>
                                <td className="cell-secondary">{apt.stylist || '—'}</td>
                                {!branchScope && <td className="cell-secondary">{apt.branch}</td>}
                                <td>
                                    <span className={`status-badge ${apt.status}`}>
                                        <span className="status-dot"></span>
                                        {apt.status}
                                    </span>
                                </td>
                                <td>{renderActions(apt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card List */}
            <div className="mobile-cards">
                {filtered.length === 0 ? (
                    <div className="admin-empty" style={{ padding: 32 }}>
                        <Search size={28} className="admin-empty-icon" />
                        <h3>No appointments found</h3>
                        <p>Try adjusting your filters</p>
                    </div>
                ) : filtered.map(apt => (
                    <div className="mobile-card" key={apt.id}>
                        <div className="mobile-card-top">
                            <div className="mobile-card-heading">
                                <div>
                                    <div className="mobile-card-title">{apt.clientName}</div>
                                    <div className="mobile-card-sub">{apt.clientEmail}</div>
                                </div>
                            </div>
                            <span className={`status-badge ${apt.status}`}>
                                <span className="status-dot"></span>
                                {apt.status}
                            </span>
                        </div>
                        <div className="mobile-card-meta">
                            <div className="mobile-card-meta-item">
                                <span className="mobile-card-meta-label">Date</span>
                                <span>{new Date(apt.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="mobile-card-meta-item">
                                <span className="mobile-card-meta-label">Time</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{apt.time}</span>
                            </div>
                            <div className="mobile-card-meta-item">
                                <span className="mobile-card-meta-label">Service</span>
                                <span>{apt.service}</span>
                            </div>
                            <div className="mobile-card-meta-item">
                                <span className="mobile-card-meta-label">Stylist</span>
                                <span>{apt.stylist || '—'}</span>
                            </div>
                            {getPhone(apt) && (
                                <div className="mobile-card-meta-item full">
                                    <span className="mobile-card-meta-label">Contact</span>
                                    <span className="apt-contact">
                                        <a href={`tel:${getPhone(apt)}`} className="apt-contact-phone">
                                            <Phone size={13} /> {getPhone(apt)}
                                        </a>
                                        <a
                                            href={`https://wa.me/${waNumber(getPhone(apt))}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="apt-contact-wa"
                                            title="Message on WhatsApp"
                                        >
                                            <MessageCircle size={13} /> WhatsApp
                                        </a>
                                    </span>
                                </div>
                            )}
                            {!branchScope && (
                                <div className="mobile-card-meta-item">
                                    <span className="mobile-card-meta-label">Branch</span>
                                    <span>{apt.branch}</span>
                                </div>
                            )}
                        </div>
                        <div className="mobile-card-actions">
                            {renderActions(apt)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Reschedule Modal */}
            {rescheduleId && (
                <div className="admin-modal-overlay" onClick={cancelReschedule}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <h3><CalendarClock size={18} /> Reschedule Appointment</h3>
                        <div className="admin-form-group">
                            <label className="admin-form-label">New Date *</label>
                            <input className="admin-form-input" type="date" value={reDate} onChange={e => setReDate(e.target.value)} />
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-form-label">New Time *</label>
                            <Dropdown
                                value={reTime}
                                onChange={setReTime}
                                placeholder="Select time"
                                options={timeSlots.map(s => ({ value: s, label: s }))}
                            />
                        </div>
                        <div className="admin-form-actions">
                            <button type="button" className="admin-btn admin-btn-secondary" onClick={cancelReschedule}>Cancel</button>
                            <button type="button" className="admin-btn admin-btn-primary" onClick={saveReschedule}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
