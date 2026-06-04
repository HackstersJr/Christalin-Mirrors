import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { staffStore } from '../data/store'
import type { StaffMember } from '../data/types'
import '../AdminShared.css'

const roles = ['stylist', 'therapist', 'manager', 'receptionist'] as const
const roleLabels: Record<string, string> = { stylist: 'Stylist', therapist: 'Therapist', manager: 'Manager', receptionist: 'Receptionist' }

const emptyForm: Omit<StaffMember, 'id'> = {
    name: '', role: 'stylist', branch: 'Bengaluru', phone: '', email: '',
    specialties: [], isActive: true, joinedDate: new Date().toISOString().split('T')[0],
}

const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : '?';
const getRoleAvatarColor = (role: string) => {
    switch(role) {
        case 'manager': return 'var(--accent-alt)';
        case 'stylist': return '#3b82f6';
        case 'therapist': return '#8b5cf6';
        case 'receptionist': return '#14b8a6';
        default: return 'var(--text-dim)';
    }
};

export default function Staff() {
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [search, setSearch] = useState('')
    const [branchFilter, setBranchFilter] = useState('all')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [specInput, setSpecInput] = useState('')

    const reload = () => setStaff(staffStore.getAll())
    useEffect(() => { reload() }, [])

    const filtered = staff.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.role.includes(search.toLowerCase())
        const matchBranch = branchFilter === 'all' || s.branch === branchFilter
        return matchSearch && matchBranch
    })

    const bengaluruCount = staff.filter(s => s.branch === 'Bengaluru').length
    const kalaburagiCount = staff.filter(s => s.branch === 'Kalaburagi').length

    const startEdit = (member: StaffMember) => {
        setEditingId(member.id)
        const { id, ...rest } = member
        setForm(rest)
        setShowForm(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (editingId) { staffStore.update(editingId, form) }
        else { staffStore.create(form) }
        resetForm()
        reload()
    }

    const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); setSpecInput('') }

    const deleteStaff = (id: string) => {
        if (confirm('Remove this staff member?')) { staffStore.delete(id); reload() }
    }

    const addSpec = () => {
        if (specInput.trim() && !form.specialties.includes(specInput.trim())) {
            setForm({ ...form, specialties: [...form.specialties, specInput.trim()] })
            setSpecInput('')
        }
    }

    return (
        <div>
            <div className="admin-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="admin-page-title">Staff</h1>
                    <p className="admin-page-sub">Manage your team members</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => { resetForm(); setShowForm(!showForm) }}>
                    <Plus size={14} />
                    Add Staff
                </button>
            </div>

            {/* Branch Counts */}
            <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="admin-stat-card" style={{ cursor: 'pointer', borderColor: branchFilter === 'all' ? 'rgba(193,127,89,0.3)' : undefined }} onClick={() => setBranchFilter('all')}>
                    <div className="stat-label">All Staff</div><div className="stat-value">{staff.length}</div>
                </div>
                <div className="admin-stat-card" style={{ cursor: 'pointer', borderColor: branchFilter === 'Bengaluru' ? 'rgba(193,127,89,0.3)' : undefined }} onClick={() => setBranchFilter('Bengaluru')}>
                    <div className="stat-label">Bengaluru</div><div className="stat-value accent">{bengaluruCount}</div>
                </div>
                <div className="admin-stat-card" style={{ cursor: 'pointer', borderColor: branchFilter === 'Kalaburagi' ? 'rgba(193,127,89,0.3)' : undefined }} onClick={() => setBranchFilter('Kalaburagi')}>
                    <div className="stat-label">Kalaburagi</div><div className="stat-value accent">{kalaburagiCount}</div>
                </div>
            </div>

            {showForm && (
                <div className="admin-form-card">
                    <h3>{editingId ? 'Edit Staff Member' : 'New Staff Member'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-grid">
                            <div className="admin-form-group">
                                <label className="admin-form-label">Name *</label>
                                <input className="admin-form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Role</label>
                                <select className="admin-form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as StaffMember['role'] })}>
                                    {roles.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Email *</label>
                                <input className="admin-form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Phone</label>
                                <input className="admin-form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Branch</label>
                                <select className="admin-form-select" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}>
                                    <option value="Bengaluru">Bengaluru</option>
                                    <option value="Kalaburagi">Kalaburagi</option>
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Joined Date</label>
                                <input className="admin-form-input" type="date" value={form.joinedDate} onChange={e => setForm({ ...form, joinedDate: e.target.value })} />
                            </div>
                            <div className="admin-form-group full">
                                <label className="admin-form-label">Specialties</label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                                    {form.specialties.map(s => (
                                        <span key={s} className="admin-tag" style={{ cursor: 'pointer' }} onClick={() => setForm({ ...form, specialties: form.specialties.filter(x => x !== s) })}>{s} ×</span>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input className="admin-form-input" value={specInput} onChange={e => setSpecInput(e.target.value)} placeholder="Add specialty..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSpec() } }} />
                                    <button type="button" className="admin-btn admin-btn-secondary" onClick={addSpec}>Add</button>
                                </div>
                            </div>
                        </div>
                        <div className="admin-form-actions">
                            <button type="button" className="admin-btn admin-btn-secondary" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="admin-btn admin-btn-primary">{editingId ? 'Update' : 'Add'} Staff</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="admin-toolbar">
                <input className="admin-search" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="admin-filter-select" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                    <option value="all">All Branches</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Kalaburagi">Kalaburagi</option>
                </select>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Branch</th>
                            <th>Contact</th>
                            <th>Specialties</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7}><div className="admin-empty" style={{ padding: 32 }}><Search size={28} className="admin-empty-icon" /><h3>No staff found</h3></div></td></tr>
                        ) : filtered.map(member => (
                            <tr key={member.id} style={{ opacity: member.isActive ? 1 : 0.5 }}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: getRoleAvatarColor(member.role), color: 'var(--text-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16 }}>
                                            {getInitial(member.name)}
                                        </div>
                                        <div className="cell-primary" style={{ fontSize: 14 }}>{member.name}</div>
                                    </div>
                                </td>
                                <td><span className={`role-badge ${member.role}`} style={{ padding: '6px 12px' }}>{roleLabels[member.role]}</span></td>
                                <td className="cell-secondary">{member.branch}</td>
                                <td>
                                    <div className="cell-primary" style={{ fontSize: 13 }}>{member.phone}</div>
                                    <div className="cell-secondary">{member.email}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {member.specialties.slice(0, 3).map(s => <span key={s} className="admin-tag" style={{ padding: '4px 10px' }}>{s}</span>)}
                                        {member.specialties.length > 3 && <span className="admin-tag" style={{ padding: '4px 10px' }}>+{member.specialties.length - 3}</span>}
                                    </div>
                                </td>
                                <td><span className={`status-badge ${member.isActive ? 'confirmed' : 'cancelled'}`}>{member.isActive ? 'Active' : 'Inactive'}</span></td>
                                <td>
                                    <div className="admin-actions">
                                        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => startEdit(member)}><Edit2 size={14} /></button>
                                        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => deleteStaff(member.id)}><Trash2 size={14} /></button>
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
