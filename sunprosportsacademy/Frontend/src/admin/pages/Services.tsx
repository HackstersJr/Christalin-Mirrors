import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import { serviceStore } from '../data/store'
import type { ServiceRecord } from '../data/types'
import '../AdminShared.css'

const categories = ['hair', 'skin', 'korean', 'womens', 'mens'] as const
const categoryLabels: Record<string, string> = { hair: 'Hair', skin: 'Skin & Beauty', korean: 'Korean Rituals', womens: "Women's", mens: "Men's" }

const emptyForm: Omit<ServiceRecord, 'id'> = {
    name: '', category: 'hair', duration: 30, price: 0, isActive: true, description: '',
}

export default function Services() {
    const [services, setServices] = useState<ServiceRecord[]>([])
    const [search, setSearch] = useState('')
    const [catFilter, setCatFilter] = useState('all')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)

    const reload = () => setServices(serviceStore.getAll())
    useEffect(() => { reload() }, [])

    const filtered = services.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
        const matchCat = catFilter === 'all' || s.category === catFilter
        return matchSearch && matchCat
    })

    const startEdit = (svc: ServiceRecord) => {
        setEditingId(svc.id)
        const { id, ...rest } = svc
        setForm(rest)
        setShowForm(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (editingId) { serviceStore.update(editingId, form) }
        else { serviceStore.create(form) }
        resetForm()
        reload()
    }

    const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false) }

    const toggleActive = (id: string, current: boolean) => {
        serviceStore.update(id, { isActive: !current })
        reload()
    }

    const deleteSvc = (id: string) => {
        if (confirm('Delete this service?')) { serviceStore.delete(id); reload() }
    }

    return (
        <div>
            <div className="admin-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="admin-page-title">Services</h1>
                    <p className="admin-page-sub">Manage your salon service offerings</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => { resetForm(); setShowForm(!showForm) }}>
                    <Plus size={14} />
                    Add Service
                </button>
            </div>

            {showForm && (
                <div className="admin-form-card">
                    <h3>{editingId ? 'Edit Service' : 'New Service'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-grid">
                            <div className="admin-form-group">
                                <label className="admin-form-label">Service Name *</label>
                                <input className="admin-form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Category *</label>
                                <select className="admin-form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as ServiceRecord['category'] })}>
                                    {categories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Duration (minutes)</label>
                                <input className="admin-form-input" type="number" min={5} value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Price (₹)</label>
                                <input className="admin-form-input" type="number" min={0} value={form.price} onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="admin-form-group full">
                                <label className="admin-form-label">Description</label>
                                <textarea className="admin-form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                        </div>
                        <div className="admin-form-actions">
                            <button type="button" className="admin-btn admin-btn-secondary" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="admin-btn admin-btn-primary">{editingId ? 'Update' : 'Add'} Service</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="admin-toolbar">
                <input className="admin-search" placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="admin-filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}
                </select>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Category</th>
                            <th>Duration</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6}><div className="admin-empty" style={{ padding: 32 }}><Search size={28} className="admin-empty-icon" /><h3>No services found</h3></div></td></tr>
                        ) : filtered.map(svc => (
                            <tr key={svc.id} style={{ opacity: svc.isActive ? 1 : 0.5 }}>
                                <td>
                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{svc.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-dim)', maxWidth: 300 }}>{svc.description}</div>
                                </td>
                                <td><span className={`category-badge ${svc.category}`}>{categoryLabels[svc.category]}</span></td>
                                <td>{svc.duration} min</td>
                                <td style={{ fontWeight: 600, color: 'var(--accent)' }}>₹{svc.price.toLocaleString()}</td>
                                <td>
                                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => toggleActive(svc.id, svc.isActive)} title={svc.isActive ? 'Deactivate' : 'Activate'}>
                                        {svc.isActive ? <ToggleRight size={18} style={{ color: 'var(--success-light)' }} /> : <ToggleLeft size={18} />}
                                    </button>
                                </td>
                                <td>
                                    <div className="admin-actions">
                                        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => startEdit(svc)}><Edit2 size={14} /></button>
                                        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => deleteSvc(svc.id)}><Trash2 size={14} /></button>
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
