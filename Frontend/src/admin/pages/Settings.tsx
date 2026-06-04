import { useEffect, useState } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import { settingsStore, resetStore } from '../data/store'
import type { SalonSettings } from '../data/types'
import { useToast } from '../components/Toast'
import '../AdminShared.css'

export default function SettingsPage() {
    const { showToast } = useToast()
    const [settings, setSettings] = useState<SalonSettings>(settingsStore.get())

    useEffect(() => { setSettings(settingsStore.get()) }, [])

    const handleSave = () => {
        settingsStore.update(settings)
        showToast('success', 'Settings saved successfully')
    }

    const handleReset = () => {
        if (confirm('Reset all data to defaults? This will clear all appointments, clients, etc.')) {
            resetStore()
            setSettings(settingsStore.get())
        }
    }

    const updateBranch = (idx: number, field: string, value: string | boolean) => {
        const branches = [...settings.branches]
        branches[idx] = { ...branches[idx], [field]: value }
        setSettings({ ...settings, branches })
    }

    return (
        <div>
            <div className="admin-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="admin-page-title">Settings</h1>
                    <p className="admin-page-sub">Configure your salon details</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="admin-btn admin-btn-primary" onClick={handleSave}>
                        <Save size={14} />
                        Save Changes
                    </button>
                </div>
            </div>

            {/* General Info */}
            <div className="admin-form-card">
                <h3>General Information</h3>
                <div className="admin-form-grid">
                    <div className="admin-form-group">
                        <label className="admin-form-label">Salon Name</label>
                        <input className="admin-form-input" value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-form-label">Email</label>
                        <input className="admin-form-input" type="email" value={settings.email} onChange={e => setSettings({ ...settings, email: e.target.value })} />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-form-label">Phone</label>
                        <input className="admin-form-input" value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-form-label">Operating Hours</label>
                        <input className="admin-form-input" value={settings.hours} onChange={e => setSettings({ ...settings, hours: e.target.value })} />
                    </div>
                </div>
            </div>

            {/* Branches */}
            <div className="admin-form-card">
                <h3>Branches</h3>
                {settings.branches.map((branch, idx) => (
                    <div key={idx} style={{ marginBottom: 28, paddingBottom: 20, borderBottom: idx < settings.branches.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent)' }}>{branch.name}</span>
                            <span className={`status-badge ${branch.isActive ? 'confirmed' : 'cancelled'}`} style={{ cursor: 'pointer' }}
                                  onClick={() => updateBranch(idx, 'isActive', !branch.isActive)}>
                                {branch.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="admin-form-grid">
                            <div className="admin-form-group">
                                <label className="admin-form-label">Name</label>
                                <input className="admin-form-input" value={branch.name} onChange={e => updateBranch(idx, 'name', e.target.value)} />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">City</label>
                                <input className="admin-form-input" value={branch.city} onChange={e => updateBranch(idx, 'city', e.target.value)} />
                            </div>
                            <div className="admin-form-group full">
                                <label className="admin-form-label">Address</label>
                                <input className="admin-form-input" value={branch.address} onChange={e => updateBranch(idx, 'address', e.target.value)} />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Phone</label>
                                <input className="admin-form-input" value={branch.phone} onChange={e => updateBranch(idx, 'phone', e.target.value)} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Social Links */}
            <div className="admin-form-card">
                <h3>Social Media</h3>
                <div className="admin-form-grid">
                    <div className="admin-form-group">
                        <label className="admin-form-label">Instagram URL</label>
                        <input className="admin-form-input" value={settings.socialLinks.instagram || ''} onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value } })} placeholder="https://instagram.com/..." />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-form-label">Facebook URL</label>
                        <input className="admin-form-input" value={settings.socialLinks.facebook || ''} onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })} placeholder="https://facebook.com/..." />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-form-label">Website URL</label>
                        <input className="admin-form-input" value={settings.socialLinks.website || ''} onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, website: e.target.value } })} placeholder="https://..." />
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="admin-form-card" style={{ borderColor: 'rgba(232, 93, 93, 0.2)' }}>
                <h3 style={{ color: 'var(--danger)' }}>Danger Zone</h3>
                <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
                    Reset all admin data to mock defaults. This will clear all appointments, clients, services, and staff.
                </p>
                <button className="admin-btn admin-btn-danger" onClick={handleReset}>
                    <RotateCcw size={14} />
                    Reset All Data
                </button>
            </div>
        </div>
    )
}
