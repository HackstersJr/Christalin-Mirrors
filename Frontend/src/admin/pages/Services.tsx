import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Edit2, Trash2, Search, ToggleLeft, ToggleRight, Package as PackageIcon, X } from 'lucide-react'
import { serviceStore, packageStore } from '../data/store'
import type { ServiceRecord, ServicePackage, PackageServiceLine } from '../data/types'
import '../AdminShared.css'

const categories = ['hair', 'colours_studio', 'skin', 'korean', 'womens', 'mens'] as const
const categoryLabels: Record<string, string> = { hair: 'Hair', colours_studio: 'Colours Studio', skin: 'Skin & Beauty', korean: 'Korean Rituals', womens: "Women's", mens: "Men's" }

const emptyForm: Omit<ServiceRecord, 'id'> = {
    name: '', category: 'colours_studio', duration: 30, price: 0, isActive: true, description: '',
}

const emptyPackageForm: Omit<ServicePackage, 'id'> = {
    name: '', description: '', bundlePrice: 0, badge: '', isActive: true, services: [],
}

export default function Services() {
    const location = useLocation()
    const [tab, setTab] = useState<'services' | 'packages'>('services')

    const [services, setServices] = useState<ServiceRecord[]>([])
    const [search, setSearch] = useState('')
    const [catFilter, setCatFilter] = useState('all')
    const [showForm, setShowForm] = useState(Boolean((location.state as { openForm?: boolean } | null)?.openForm))
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)

    const [packages, setPackages] = useState<ServicePackage[]>([])
    const [pkgSearch, setPkgSearch] = useState('')
    const [showPkgForm, setShowPkgForm] = useState(false)
    const [editingPkgId, setEditingPkgId] = useState<string | null>(null)
    const [pkgForm, setPkgForm] = useState(emptyPackageForm)
    const [pkgServiceToAdd, setPkgServiceToAdd] = useState('')

    const reload = async () => {
        const data = await serviceStore.getAll()
        setServices(data)
    }
    const reloadPackages = async () => {
        const data = await packageStore.getAll()
        setPackages(data)
    }
    useEffect(() => { reload(); reloadPackages() }, [])

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (editingId) { await serviceStore.update(editingId, form) }
        else { await serviceStore.create(form) }
        resetForm()
        await reload()
    }

    const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false) }

    const toggleActive = async (id: string, current: boolean) => {
        await serviceStore.update(id, { isActive: !current })
        await reload()
    }

    const deleteSvc = async (id: string) => {
        if (confirm('Delete this service?')) {
            await serviceStore.delete(id)
            await reload()
        }
    }

    // ─── Packages ────────────────────────────────────────────
    const filteredPackages = packages.filter(p => p.name.toLowerCase().includes(pkgSearch.toLowerCase()))

    const fullPriceOf = (pkg: Omit<ServicePackage, 'id'> | ServicePackage) =>
        pkg.services.reduce((s, line) => s + line.price * line.quantity, 0)

    const startEditPkg = (pkg: ServicePackage) => {
        setEditingPkgId(pkg.id)
        const { id, ...rest } = pkg
        setPkgForm(rest)
        setShowPkgForm(true)
    }

    const resetPkgForm = () => { setPkgForm(emptyPackageForm); setEditingPkgId(null); setShowPkgForm(false); setPkgServiceToAdd('') }

    const addServiceToPkg = () => {
        const svc = services.find(s => s.id === pkgServiceToAdd)
        if (!svc || pkgForm.services.some(l => l.serviceId === svc.id)) return
        const line: PackageServiceLine = { serviceId: svc.id, serviceName: svc.name, price: svc.price, quantity: 1 }
        setPkgForm({ ...pkgForm, services: [...pkgForm.services, line] })
        setPkgServiceToAdd('')
    }

    const removeServiceFromPkg = (serviceId: string) => {
        setPkgForm({ ...pkgForm, services: pkgForm.services.filter(l => l.serviceId !== serviceId) })
    }

    const updatePkgLineQty = (serviceId: string, quantity: number) => {
        setPkgForm({ ...pkgForm, services: pkgForm.services.map(l => l.serviceId === serviceId ? { ...l, quantity: Math.max(1, quantity) } : l) })
    }

    const handlePkgSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (pkgForm.services.length === 0) return
        if (editingPkgId) { await packageStore.update(editingPkgId, pkgForm) }
        else { await packageStore.create(pkgForm) }
        resetPkgForm()
        await reloadPackages()
    }

    const togglePkgActive = async (id: string, current: boolean) => {
        await packageStore.update(id, { isActive: !current })
        await reloadPackages()
    }

    const deletePkg = async (id: string) => {
        if (confirm('Delete this package?')) {
            await packageStore.delete(id)
            await reloadPackages()
        }
    }

    return (
        <div>
            <div className="admin-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="admin-page-title">Services</h1>
                    <p className="admin-page-sub">Manage your salon service offerings and bundled packages</p>
                </div>
                {tab === 'services' ? (
                    <button className="admin-btn admin-btn-primary" onClick={() => { resetForm(); setShowForm(!showForm) }}>
                        <Plus size={14} /> Add Service
                    </button>
                ) : (
                    <button className="admin-btn admin-btn-primary" onClick={() => { resetPkgForm(); setShowPkgForm(!showPkgForm) }}>
                        <Plus size={14} /> Add Package
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button className={`admin-btn ${tab === 'services' ? 'admin-btn-primary' : 'admin-btn-secondary'}`} onClick={() => setTab('services')}>Services</button>
                <button className={`admin-btn ${tab === 'packages' ? 'admin-btn-primary' : 'admin-btn-secondary'}`} onClick={() => setTab('packages')}>
                    <PackageIcon size={14} /> Packages
                </button>
            </div>

            {tab === 'services' && (
                <>
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
                </>
            )}

            {tab === 'packages' && (
                <>
                    {showPkgForm && (
                        <div className="admin-form-card">
                            <h3>{editingPkgId ? 'Edit Package' : 'New Package'}</h3>
                            <form onSubmit={handlePkgSubmit}>
                                <div className="admin-form-grid">
                                    <div className="admin-form-group">
                                        <label className="admin-form-label">Package Name *</label>
                                        <input className="admin-form-input" value={pkgForm.name} onChange={e => setPkgForm({ ...pkgForm, name: e.target.value })} required />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-form-label">Badge (optional)</label>
                                        <input className="admin-form-input" placeholder="e.g. Bridal Special, Best Value" value={pkgForm.badge} onChange={e => setPkgForm({ ...pkgForm, badge: e.target.value })} />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-form-label">Bundle Price (₹) *</label>
                                        <input className="admin-form-input" type="number" min={0} value={pkgForm.bundlePrice} onChange={e => setPkgForm({ ...pkgForm, bundlePrice: parseInt(e.target.value) || 0 })} required />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-form-label">Full Price (sum of services)</label>
                                        <input className="admin-form-input" value={`₹${fullPriceOf(pkgForm).toLocaleString()}`} disabled />
                                    </div>
                                    <div className="admin-form-group full">
                                        <label className="admin-form-label">Description</label>
                                        <textarea className="admin-form-textarea" value={pkgForm.description} onChange={e => setPkgForm({ ...pkgForm, description: e.target.value })} />
                                    </div>

                                    <div className="admin-form-group full">
                                        <label className="admin-form-label">Included Services *</label>
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                            <select className="admin-form-select" value={pkgServiceToAdd} onChange={e => setPkgServiceToAdd(e.target.value)}>
                                                <option value="">Select a service to add...</option>
                                                {services.filter(s => s.isActive && !pkgForm.services.some(l => l.serviceId === s.id)).map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>
                                                ))}
                                            </select>
                                            <button type="button" className="admin-btn admin-btn-secondary" onClick={addServiceToPkg} disabled={!pkgServiceToAdd}>Add</button>
                                        </div>

                                        {pkgForm.services.length === 0 ? (
                                            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>No services added yet — add at least one.</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {pkgForm.services.map(line => (
                                                    <div key={line.serviceId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-card-alt)', borderRadius: 8 }}>
                                                        <span style={{ flex: 1, fontSize: 13 }}>{line.serviceName}</span>
                                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹{line.price}</span>
                                                        <input
                                                            className="admin-form-input"
                                                            type="number"
                                                            min={1}
                                                            value={line.quantity}
                                                            onChange={e => updatePkgLineQty(line.serviceId, parseInt(e.target.value) || 1)}
                                                            style={{ width: 60 }}
                                                        />
                                                        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => removeServiceFromPkg(line.serviceId)}><X size={14} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {pkgForm.services.length > 0 && pkgForm.bundlePrice > 0 && (
                                            <p style={{ fontSize: 12, color: 'var(--success-light)', marginTop: 10 }}>
                                                Customer saves ₹{Math.max(0, fullPriceOf(pkgForm) - pkgForm.bundlePrice).toLocaleString()} vs. booking separately
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="admin-form-actions">
                                    <button type="button" className="admin-btn admin-btn-secondary" onClick={resetPkgForm}>Cancel</button>
                                    <button type="submit" className="admin-btn admin-btn-primary" disabled={pkgForm.services.length === 0}>{editingPkgId ? 'Update' : 'Add'} Package</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="admin-toolbar">
                        <input className="admin-search" placeholder="Search packages..." value={pkgSearch} onChange={e => setPkgSearch(e.target.value)} />
                    </div>

                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Package</th>
                                    <th>Includes</th>
                                    <th>Full Price</th>
                                    <th>Bundle Price</th>
                                    <th>Savings</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPackages.length === 0 ? (
                                    <tr><td colSpan={7}><div className="admin-empty" style={{ padding: 32 }}><PackageIcon size={28} className="admin-empty-icon" /><h3>No packages found</h3></div></td></tr>
                                ) : filteredPackages.map(pkg => {
                                    const full = fullPriceOf(pkg)
                                    return (
                                        <tr key={pkg.id} style={{ opacity: pkg.isActive ? 1 : 0.5 }}>
                                            <td>
                                                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{pkg.name}</div>
                                                {pkg.badge && <span className="admin-tag" style={{ marginTop: 4, display: 'inline-block' }}>{pkg.badge}</span>}
                                            </td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 260 }}>
                                                {pkg.services.map(l => `${l.serviceName}${l.quantity > 1 ? ` x${l.quantity}` : ''}`).join(', ')}
                                            </td>
                                            <td className="cell-secondary">₹{full.toLocaleString()}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--accent)' }}>₹{pkg.bundlePrice.toLocaleString()}</td>
                                            <td style={{ color: 'var(--success-light)' }}>₹{Math.max(0, full - pkg.bundlePrice).toLocaleString()}</td>
                                            <td>
                                                <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => togglePkgActive(pkg.id, pkg.isActive)} title={pkg.isActive ? 'Deactivate' : 'Activate'}>
                                                    {pkg.isActive ? <ToggleRight size={18} style={{ color: 'var(--success-light)' }} /> : <ToggleLeft size={18} />}
                                                </button>
                                            </td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => startEditPkg(pkg)}><Edit2 size={14} /></button>
                                                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => deletePkg(pkg.id)}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    )
}
