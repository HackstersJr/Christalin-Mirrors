import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react'
import { clientStore } from '../data/store'
import type { Client } from '../data/types'
import '../AdminShared.css'

const emptyForm: Omit<Client, 'id'> = {
    name: '', email: '', phone: '', gender: 'female',
    branch: 'Bengaluru', joinedDate: new Date().toISOString().split('T')[0],
    totalVisits: 0, tags: [], notes: '',
}

const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : '?';
const getAvatarColor = (name: string) => {
    const colors = ['#f43f5e', '#8b5cf6', '#3b82f6', 'var(--success)', 'var(--warning)'];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

const getTagStyle = (tag: string) => {
    const lower = tag.toLowerCase();
    if (lower === 'vip') return { background: 'var(--accent-alt)', color: 'var(--bg-card)', fontWeight: 600 };
    if (lower === 'new') return { background: 'rgba(59,130,246,0.15)', color: '#3b82f6' };
    if (lower === 'bridal') return { background: 'rgba(244,63,94,0.15)', color: '#f43f5e' };
    return { background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' };
};

export default function Clients() {
    const navigate = useNavigate()
    const [clients, setClients] = useState<Client[]>([])
    const [search, setSearch] = useState('')
    const [branchFilter, setBranchFilter] = useState('all')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [tagInput, setTagInput] = useState('')

    const reload = () => setClients(clientStore.getAll())
    useEffect(() => { reload() }, [])

    const filtered = clients.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
        const matchBranch = branchFilter === 'all' || c.branch === branchFilter
        return matchSearch && matchBranch
    })

    const startEdit = (client: Client) => {
        setEditingId(client.id)
        const { id, ...rest } = client
        setForm(rest)
        setShowForm(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (editingId) {
            clientStore.update(editingId, form)
        } else {
            clientStore.create(form)
        }
        resetForm()
        reload()
    }

    const resetForm = () => {
        setForm(emptyForm)
        setEditingId(null)
        setShowForm(false)
        setTagInput('')
    }

    const deleteClient = (id: string) => {
        if (confirm('Delete this client?')) { clientStore.delete(id); reload() }
    }

    const addTag = () => {
        if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
            setForm({ ...form, tags: [...form.tags, tagInput.trim()] })
            setTagInput('')
        }
    }

    const removeTag = (tag: string) => {
        setForm({ ...form, tags: form.tags.filter(t => t !== tag) })
    }

    return (
        <div>
            <div className="admin-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="admin-page-title">Clients</h1>
                    <p className="admin-page-sub">Manage your client database</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => { resetForm(); setShowForm(!showForm) }}>
                    <Plus size={14} />
                    Add Client
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="admin-form-card">
                    <h3>{editingId ? 'Edit Client' : 'New Client'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-grid">
                            <div className="admin-form-group">
                                <label className="admin-form-label">Name *</label>
                                <input className="admin-form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Email *</label>
                                <input className="admin-form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Phone *</label>
                                <input className="admin-form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Gender</label>
                                <select className="admin-form-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as Client['gender'] })}>
                                    <option value="female">Female</option>
                                    <option value="male">Male</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Branch</label>
                                <select className="admin-form-select" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}>
                                    <option value="Bengaluru">Bengaluru</option>
                                    <option value="Kalaburagi">Kalaburagi</option>
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Preferred Stylist</label>
                                <input className="admin-form-input" value={form.preferredStylist || ''} onChange={e => setForm({ ...form, preferredStylist: e.target.value })} />
                            </div>
                            <div className="admin-form-group full">
                                <label className="admin-form-label">Tags</label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                                    {form.tags.map(tag => (
                                        <span key={tag} className="admin-tag" style={{ cursor: 'pointer' }} onClick={() => removeTag(tag)}>{tag} ×</span>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input className="admin-form-input" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add tag..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} />
                                    <button type="button" className="admin-btn admin-btn-secondary" onClick={addTag}>Add</button>
                                </div>
                            </div>
                            <div className="admin-form-group full">
                                <label className="admin-form-label">Notes</label>
                                <textarea className="admin-form-textarea" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>
                        </div>
                        <div className="admin-form-actions">
                            <button type="button" className="admin-btn admin-btn-secondary" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="admin-btn admin-btn-primary">{editingId ? 'Update' : 'Add'} Client</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="admin-toolbar">
                <input className="admin-search" placeholder="Search by name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="admin-filter-select" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                    <option value="all">All Branches</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Kalaburagi">Kalaburagi</option>
                </select>
            </div>

            {/* Table */}
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Phone</th>
                            <th>Gender</th>
                            <th>Branch</th>
                            <th>Visits</th>
                            <th>Last Visit</th>
                            <th>Tags</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={8}>
                                <div className="admin-empty" style={{ padding: 32 }}>
                                    <Search size={28} className="admin-empty-icon" />
                                    <h3>No clients found</h3>
                                </div>
                            </td></tr>
                        ) : filtered.map(client => (
                            <tr key={client.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: getAvatarColor(client.name), color: 'var(--text-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16 }}>
                                            {getInitial(client.name)}
                                        </div>
                                        <div>
                                            <div className="cell-primary" style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/clients/${client.id}`)}>{client.name}</div>
                                            <div className="cell-secondary">{client.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="cell-primary" style={{ fontSize: 13 }}>{client.phone}</td>
                                <td style={{ textTransform: 'capitalize' }} className="cell-secondary">{client.gender}</td>
                                <td className="cell-secondary">{client.branch}</td>
                                <td style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>{client.totalVisits}</td>
                                <td className="cell-secondary">{client.lastVisit ? new Date(client.lastVisit + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                                <td>{client.tags.map(t => <span key={t} className="admin-tag" style={getTagStyle(t)}>{t}</span>)}</td>
                                <td>
                                    <div className="admin-actions">
                                        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => navigate(`/admin/clients/${client.id}`)}><Eye size={14} /></button>
                                        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => startEdit(client)}><Edit2 size={14} /></button>
                                        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => deleteClient(client.id)}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
