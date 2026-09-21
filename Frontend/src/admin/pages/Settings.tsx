import { useEffect, useState } from 'react'
import { Save, RotateCcw, FileSpreadsheet, RefreshCw, ExternalLink, CheckCircle2, Cloud } from 'lucide-react'
import { settingsStore, resetStore } from '../data/store'
import type { SalonSettings } from '../data/types'
import { googleSheetsSyncService, extractSpreadsheetId, type GoogleSheetConfig, DEFAULT_DRIVE_CONFIG } from '../data/googleSheetsSyncService'
import { useToast } from '../components/Toast'
import '../AdminShared.css'

export default function SettingsPage() {
    const { showToast } = useToast()
    const [settings, setSettings] = useState<SalonSettings>({
        name: 'Christalin Mirrors',
        email: '',
        phone: '',
        hours: '',
        branches: [],
        socialLinks: {},
    })

    const [driveConfig, setDriveConfig] = useState<GoogleSheetConfig>(() => googleSheetsSyncService.getConfig())
    const [isSyncingDrive, setIsSyncingDrive] = useState(false)
    const [syncFeedback, setSyncFeedback] = useState<string | null>(null)

    useEffect(() => {
        settingsStore.get().then(s => setSettings(s))
        setDriveConfig(googleSheetsSyncService.getConfig())
    }, [])

    const handleSave = async () => {
        await settingsStore.update(settings)
        googleSheetsSyncService.saveConfig(driveConfig)
        showToast('success', 'Settings & Google Drive integration saved successfully')
    }

    const handleDriveSyncNow = async () => {
        setIsSyncingDrive(true)
        setSyncFeedback(null)
        try {
            // Save currently entered config first
            googleSheetsSyncService.saveConfig(driveConfig)
            const res = await googleSheetsSyncService.performSync()
            if (res.success) {
                setDriveConfig(googleSheetsSyncService.getConfig())
                setSyncFeedback(res.message)
                showToast('success', res.message)
            } else {
                setSyncFeedback(res.message)
                showToast('error', res.message)
            }
        } catch (err: any) {
            setSyncFeedback(err.message || 'Sync encountered an error.')
            showToast('error', err.message || 'Sync failed')
        } finally {
            setIsSyncingDrive(false)
        }
    }

    const handleResetDriveConfig = () => {
        if (confirm('Reset Google Drive configuration to the default Christalin Mirrors Drive Ledger?')) {
            const def = googleSheetsSyncService.resetToDefault()
            setDriveConfig(def)
            showToast('info', 'Google Drive ledger reset to defaults')
        }
    }

    const handleSpreadsheetUrlChange = (val: string) => {
        const extracted = extractSpreadsheetId(val)
        setDriveConfig(prev => ({
            ...prev,
            spreadsheetUrl: val,
            spreadsheetId: extracted || prev.spreadsheetId,
        }))
    }

    const handleReset = async () => {
        if (confirm('Reset all data to defaults? This will clear all appointments, clients, etc.')) {
            resetStore()
            const s = await settingsStore.get()
            setSettings(s)
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
                    <p className="admin-page-sub">Configure your salon details and Google Drive ledger synchronization</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="admin-btn admin-btn-primary" onClick={handleSave}>
                        <Save size={14} />
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Google Drive & Sheets Integration Card */}
            <div className="admin-form-card" id="google-drive-sync-settings" style={{ border: '1px solid rgba(16, 185, 129, 0.25)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                            <FileSpreadsheet size={22} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <h3 style={{ margin: 0 }}>Google Drive &amp; Sheets Synchronization</h3>
                                <span style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: 12,
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10b981',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                }}>
                                    <CheckCircle2 size={11} /> Auto-Sync Active
                                </span>
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                                Hardcoded with your Google Drive salon database. Edits to Daily Sales &amp; OpEx/CapEx synchronize automatically.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={handleDriveSyncNow}
                            disabled={isSyncingDrive}
                            style={{ fontSize: 12, padding: '6px 12px', gap: 6 }}
                        >
                            <RefreshCw size={13} className={isSyncingDrive ? 'spin' : ''} />
                            {isSyncingDrive ? 'Syncing…' : 'Sync Now with Drive'}
                        </button>
                        <button
                            type="button"
                            className="admin-btn admin-btn-ghost"
                            onClick={handleResetDriveConfig}
                            title="Reset to default Drive Master Ledger"
                            style={{ fontSize: 12, padding: '6px 10px', gap: 4 }}
                        >
                            <RotateCcw size={13} /> Reset
                        </button>
                    </div>
                </div>

                {syncFeedback && (
                    <div style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        fontSize: 12,
                        marginBottom: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        <CheckCircle2 size={15} />
                        <span>{syncFeedback}</span>
                    </div>
                )}

                <div className="admin-form-grid">
                    <div className="admin-form-group full">
                        <label className="admin-form-label">
                            Google Drive Spreadsheet Link or ID
                        </label>
                        <input
                            className="admin-form-input"
                            value={driveConfig.spreadsheetUrl || driveConfig.spreadsheetId}
                            onChange={e => handleSpreadsheetUrlChange(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                Extracted Spreadsheet ID: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{driveConfig.spreadsheetId || 'Default Drive Master'}</strong>
                            </span>
                            {driveConfig.spreadsheetUrl && (
                                <a
                                    href={driveConfig.spreadsheetUrl.startsWith('http') ? driveConfig.spreadsheetUrl : `https://docs.google.com/spreadsheets/d/${driveConfig.spreadsheetId}/edit`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                    Open Spreadsheet in Google Drive <ExternalLink size={12} />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="admin-form-group full">
                        <label className="admin-form-label">Spreadsheet Display Title</label>
                        <input
                            className="admin-form-input"
                            value={driveConfig.spreadsheetTitle || ''}
                            onChange={e => setDriveConfig({ ...driveConfig, spreadsheetTitle: e.target.value })}
                            placeholder="Christalin Mirrors — Master Google Drive Sales & Financial Ledger"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Daily Sales Sheet Tab</label>
                        <input
                            className="admin-form-input"
                            value={driveConfig.dailySalesTab}
                            onChange={e => setDriveConfig({ ...driveConfig, dailySalesTab: e.target.value })}
                            placeholder="Daily Sales"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Expenses &amp; CapEx Sheet Tab</label>
                        <input
                            className="admin-form-input"
                            value={driveConfig.expensesTab}
                            onChange={e => setDriveConfig({ ...driveConfig, expensesTab: e.target.value })}
                            placeholder="Expenses & CapEx"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Sync Direction</label>
                        <select
                            className="admin-form-input"
                            value={driveConfig.syncDirection}
                            onChange={e => setDriveConfig({ ...driveConfig, syncDirection: e.target.value as any })}
                        >
                            <option value="two-way">Two-Way Synchronization (Recommended)</option>
                            <option value="pull-only">Pull Only from Drive (Read into Salon)</option>
                            <option value="push-only">Push Only to Drive (Write Salon Records)</option>
                        </select>
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Last Synced Timestamp</label>
                        <div style={{
                            padding: '10px 12px',
                            background: 'var(--counter-bg, rgba(255,255,255,0.03))',
                            borderRadius: 6,
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                        }}>
                            {driveConfig.lastSyncedAt
                                ? new Date(driveConfig.lastSyncedAt).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })
                                : 'Synchronized upon app startup'}
                        </div>
                    </div>

                    <div className="admin-form-group full" style={{ marginTop: 4 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                checked={driveConfig.autoSyncOnSave}
                                onChange={e => setDriveConfig({ ...driveConfig, autoSyncOnSave: e.target.checked })}
                                style={{ width: 16, height: 16, accentColor: '#10b981' }}
                            />
                            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                                <strong>Automatic Real-Time Sync:</strong> Automatically save and sync changes to Google Drive whenever daily sales or OpEx/CapEx entries are updated.
                            </span>
                        </label>
                    </div>
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
        </div>
    )
}
