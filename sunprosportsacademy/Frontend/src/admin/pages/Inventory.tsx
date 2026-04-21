import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Search, AlertTriangle, Package } from 'lucide-react'
import { inventoryStore } from '../data/store'
import type { InventoryItem } from '../data/types'
import '../AdminShared.css'

const categories = ['hair-care', 'skin-care', 'color', 'tools', 'consumables'] as const
const catLabels: Record<string, string> = { 'hair-care': 'Hair Care', 'skin-care': 'Skin Care', color: 'Color', tools: 'Tools', consumables: 'Consumables' }

const emptyForm: Omit<InventoryItem, 'id'> = {
    name: '', brand: '', category: 'hair-care', sku: '', currentStock: 0,
    minStock: 3, costPrice: 0, retailPrice: 0, branch: 'Bengaluru', isActive: true,
}

export default function Inventory() {
    const [items, setItems] = useState<InventoryItem[]>([])
    const [search, setSearch] = useState('')
    const [catFilter, setCatFilter] = useState('all')
    const [branchFilter, setBranchFilter] = useState('all')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)

    const reload = () => setItems(inventoryStore.getAll())
    useEffect(() => { reload() }, [])

    const lowStock = items.filter(i => i.isActive && i.currentStock <= i.minStock)
    const filtered = items.filter(i => {
        const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.brand.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())
        const matchCat = catFilter === 'all' || i.category === catFilter
        const matchBranch = branchFilter === 'all' || i.branch === branchFilter
        return matchSearch && matchCat && matchBranch
    })

    const bengaluruItems = items.filter(i => i.branch === 'Bengaluru')
    const kalaburagiItems = items.filter(i => i.branch === 'Kalaburagi')

    const startEdit = (item: InventoryItem) => {
        setEditingId(item.id); const { id, ...rest } = item; setForm(rest); setShowForm(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (editingId) { inventoryStore.update(editingId, form) } else { inventoryStore.create(form) }
        resetForm(); reload()
    }

    const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false) }

    const deleteItem = (id: string) => { if (confirm('Delete this item?')) { inventoryStore.delete(id); reload() } }

    return (
        <div>
            <div className="admin-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="admin-page-title">Inventory</h1>
                    <p className="admin-page-sub">Track products and supplies</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => { resetForm(); setShowForm(!showForm) }}>
                    <Plus size={14} /> Add Product
                </button>
            </div>

            {/* Low Stock Alert */}
            {lowStock.length > 0 && (
                <div style={{ marginBottom: 20, padding: '14px 20px', background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--danger)' }}>{lowStock.length} product{lowStock.length > 1 ? 's' : ''}</strong> low on stock:
                        {' '}{lowStock.map(i => i.name).join(', ')}
                    </span>
                </div>
            )}

            {/* Stats */}
            <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="admin-stat-card"><div className="stat-label">Total Products</div><div className="stat-value">{items.length}</div></div>
                <div className="admin-stat-card"><div className="stat-label">Low Stock</div><div className="stat-value red">{lowStock.length}</div></div>
                <div className="admin-stat-card"><div className="stat-label">Inventory Value</div><div className="stat-value accent">₹{items.reduce((s, i) => s + i.costPrice * i.currentStock, 0).toLocaleString()}</div></div>
                <div className="admin-stat-card"><div className="stat-label">Categories</div><div className="stat-value">{new Set(items.map(i => i.category)).size}</div></div>
            </div>

            {/* Branch Split */}
            <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
                <div className="admin-stat-card" style={{ cursor: 'pointer', borderColor: branchFilter === 'all' ? 'rgba(193,127,89,0.3)' : undefined }} onClick={() => setBranchFilter('all')}>
                    <div className="stat-label">All Branches</div><div className="stat-value">{items.length} items</div>
                </div>
                <div className="admin-stat-card" style={{ cursor: 'pointer', borderColor: branchFilter === 'Bengaluru' ? 'rgba(193,127,89,0.3)' : undefined }} onClick={() => setBranchFilter('Bengaluru')}>
                    <div className="stat-label">Bengaluru</div>
                    <div className="stat-value accent">{bengaluruItems.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>₹{bengaluruItems.reduce((s, i) => s + i.costPrice * i.currentStock, 0).toLocaleString()} value</div>
                </div>
                <div className="admin-stat-card" style={{ cursor: 'pointer', borderColor: branchFilter === 'Kalaburagi' ? 'rgba(193,127,89,0.3)' : undefined }} onClick={() => setBranchFilter('Kalaburagi')}>
                    <div className="stat-label">Kalaburagi</div>
                    <div className="stat-value accent">{kalaburagiItems.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>₹{kalaburagiItems.reduce((s, i) => s + i.costPrice * i.currentStock, 0).toLocaleString()} value</div>
                </div>
            </div>

            {showForm && (
                <div className="admin-form-card">
                    <h3>{editingId ? 'Edit Product' : 'New Product'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-grid">
                            <div className="admin-form-group"><label className="admin-form-label">Product Name *</label><input className="admin-form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                            <div className="admin-form-group"><label className="admin-form-label">Brand</label><input className="admin-form-input" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></div>
                            <div className="admin-form-group"><label className="admin-form-label">Category</label><select className="admin-form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as InventoryItem['category'] })}>{categories.map(c => <option key={c} value={c}>{catLabels[c]}</option>)}</select></div>
                            <div className="admin-form-group"><label className="admin-form-label">SKU</label><input className="admin-form-input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
                            <div className="admin-form-group"><label className="admin-form-label">Current Stock</label><input className="admin-form-input" type="number" min={0} value={form.currentStock} onChange={e => setForm({ ...form, currentStock: parseInt(e.target.value) || 0 })} /></div>
                            <div className="admin-form-group"><label className="admin-form-label">Min Stock (Alert)</label><input className="admin-form-input" type="number" min={0} value={form.minStock} onChange={e => setForm({ ...form, minStock: parseInt(e.target.value) || 0 })} /></div>
                            <div className="admin-form-group"><label className="admin-form-label">Cost Price (₹)</label><input className="admin-form-input" type="number" min={0} value={form.costPrice} onChange={e => setForm({ ...form, costPrice: parseInt(e.target.value) || 0 })} /></div>
                            <div className="admin-form-group"><label className="admin-form-label">Retail Price (₹)</label><input className="admin-form-input" type="number" min={0} value={form.retailPrice} onChange={e => setForm({ ...form, retailPrice: parseInt(e.target.value) || 0 })} placeholder="0 = not for retail" /></div>
                            <div className="admin-form-group"><label className="admin-form-label">Branch</label><select className="admin-form-select" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}><option value="Bengaluru">Bengaluru</option><option value="Kalaburagi">Kalaburagi</option></select></div>
                        </div>
                        <div className="admin-form-actions"><button type="button" className="admin-btn admin-btn-secondary" onClick={resetForm}>Cancel</button><button type="submit" className="admin-btn admin-btn-primary">{editingId ? 'Update' : 'Add'} Product</button></div>
                    </form>
                </div>
            )}

            <div className="admin-toolbar">
                <input className="admin-search" placeholder="Search products, brands, SKUs..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="admin-filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{catLabels[c]}</option>)}
                </select>
                <select className="admin-filter-select" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                    <option value="all">All Branches</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Kalaburagi">Kalaburagi</option>
                </select>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Cost</th><th>Retail</th><th>Branch</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={8}><div className="admin-empty" style={{ padding: 32 }}><Package size={28} className="admin-empty-icon" /><h3>No products found</h3></div></td></tr>
                        ) : filtered.map(item => (
                            <tr key={item.id} style={{ opacity: item.isActive ? 1 : 0.5, backgroundColor: item.currentStock <= item.minStock ? 'rgba(239, 68, 68, 0.06)' : undefined }}>
                                <td><div className="cell-primary">{item.name}</div><div className="cell-secondary">{item.brand || <span className="cell-secondary">—</span>}</div></td>
                                <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{item.sku || <span className="cell-secondary">—</span>}</td>
                                <td><span className={`category-badge ${item.category === 'hair-care' ? 'hair' : item.category === 'skin-care' ? 'skin' : ''}`}>{catLabels[item.category]}</span></td>
                                <td>
                                    <span style={{ fontWeight: 600, color: item.currentStock <= item.minStock ? 'var(--danger-strong)' : 'var(--success)' }}>
                                        {item.currentStock}
                                    </span>
                                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}> / min {item.minStock}</span>
                                    {item.currentStock <= item.minStock && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: 'var(--danger-strong)', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5 }}>LOW</span>}
                                </td>
                                <td className="cell-secondary">₹{item.costPrice.toLocaleString()}</td>
                                <td className="cell-primary">{item.retailPrice > 0 ? `₹${item.retailPrice.toLocaleString()}` : <span className="cell-secondary">—</span>}</td>
                                <td className="cell-secondary">{item.branch}</td>
                                <td>
                                    <div className="admin-actions">
                                        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => startEdit(item)}><Edit2 size={14} /></button>
                                        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => deleteItem(item.id)}><Trash2 size={14} /></button>
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
