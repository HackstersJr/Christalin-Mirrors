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

    const handleAddBranch = () => {
        const newBranch = {
            id: `branch_${Date.now()}`,
            name: `CM — New Branch ${settings.branches.length + 1}`,
            city: 'Karnataka, India',
            address: '',
            phone: '',
            isActive: true,
            status: 'operational' as const,
        }
        setSettings({
            ...settings,
            branches: [...settings.branches, newBranch]
        })
        showToast('info', 'New branch added. Fill in details and click "Save Changes".')
    }

    const handleRemoveBranch = (idx: number) => {
        if (confirm(`Are you sure you want to remove ${settings.branches[idx].name}?`)) {
            const branches = settings.branches.filter((_, i) => i !== idx)
            setSettings({ ...settings, branches })
            showToast('info', 'Branch removed from settings.')
        }
    }

    const handleRestoreDefaultBranches = async () => {
        if (confirm('Restore default corporate branch registry (Bengaluru, Kalaburagi, Belgaum, Manea, Yelahanka, Hassan)?')) {
            const { defaultSettings } = await import('../data/mockData')
            const updated = {
                ...settings,
                branches: [...defaultSettings.branches]
            }
            setSettings(updated)
            await settingsStore.update(updated)
            showToast('success', 'Restored 6 corporate branches successfully')
        }
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

                {/* Google Sheets Schema & Column Blueprint Guide */}
                <div style={{
                    marginTop: 20,
                    padding: 16,
                    borderRadius: 8,
                    background: 'var(--counter-bg, rgba(255,255,255,0.02))',
                    border: '1px dashed var(--border-color, #333)'
                }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent, #b59458)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📋</span> Google Sheets Maintenance Format (Tab Structure &amp; Column Headers)
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                        To maintain your Google Sheet in perfect sync with this salon app, structure your Google Spreadsheet with these exact 3 tabs and column headers:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                        {/* Tab 1 */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 6, border: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: '#3b82f6', marginBottom: 4 }}>
                                Tab 1: Daily Sales
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                Log daily tickets for operational salons (Bengaluru, Kalaburagi, Belgaum, Manea)
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-primary)', background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 4, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                Date | Branch | Client Count | Service Sales | Retail Sales | Total Revenue | Cash | Digital | Notes
                            </div>
                        </div>

                        {/* Tab 2 */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 6, border: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: '#10b981', marginBottom: 4 }}>
                                Tab 2: Expenses &amp; CapEx
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                Log monthly salon operational overheads (OpEx) &amp; equipment assets
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-primary)', background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 4, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                Month | Branch | Rent | Electricity | Payroll | Product Cost | Comm. | Fees | Maintenance | CapEx
                            </div>
                        </div>

                        {/* Tab 3 */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 6, border: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: '#a855f7', marginBottom: 4 }}>
                                Tab 3: Capital Infusions (Equity)
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                Dedicated expansion funds from CEO &amp; Partner (Yelahanka &amp; Hassan)
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-primary)', background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 4, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                Date | Branch | Contributor (CEO/Partner) | Amount | Category | Description | Vendor | Invoice Ref
                            </div>
                        </div>
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

            {/* Branches Management */}
            <div className="admin-form-card" id="branches-registry-settings">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h3 style={{ margin: 0 }}>Salon Branches Registry ({settings.branches.length})</h3>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                            Manage operational salons, pre-launch expansion projects, contact information, and ownership oversight.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={handleAddBranch}
                            style={{ fontSize: 12, padding: '6px 12px' }}
                        >
                            + Add Branch
                        </button>
                        <button
                            type="button"
                            className="admin-btn admin-btn-ghost"
                            onClick={handleRestoreDefaultBranches}
                            title="Reset to 6 core corporate branches"
                            style={{ fontSize: 12, padding: '6px 10px', gap: 4 }}
                        >
                            <RotateCcw size={12} /> Reset to 6 Core Branches
                        </button>
                    </div>
                </div>

                {settings.branches.map((branch, idx) => {
                    const isUpcoming = branch.status === 'upcoming' || branch.name.toLowerCase().includes('upcoming')
                    const isManea = branch.isUnderCeo || branch.name.toLowerCase().includes('manea')

                    return (
                        <div
                            key={idx}
                            style={{
                                marginBottom: 24,
                                padding: 20,
                                borderRadius: 10,
                                background: isUpcoming ? 'rgba(99, 102, 241, 0.03)' : 'var(--bg-card-alt, rgba(255, 255, 255, 0.02))',
                                border: isUpcoming ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid var(--border-color)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-bright)' }}>{branch.name}</span>
                                    {isUpcoming ? (
                                        <span style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            padding: '2px 8px',
                                            borderRadius: 12,
                                            background: 'rgba(99, 102, 241, 0.15)',
                                            color: '#818cf8',
                                        }}>
                                            Pre-Launch / Fitout Stage
                                        </span>
                                    ) : isManea ? (
                                        <span style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            padding: '2px 8px',
                                            borderRadius: 12,
                                            background: 'rgba(217, 119, 6, 0.15)',
                                            color: '#f59e0b',
                                        }}>
                                            Under Direct CEO Oversight
                                        </span>
                                    ) : (
                                        <span style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            padding: '2px 8px',
                                            borderRadius: 12,
                                            background: 'rgba(16, 185, 129, 0.15)',
                                            color: '#10b981',
                                        }}>
                                            Operational
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span
                                        className={`status-badge ${branch.isActive ? 'confirmed' : 'cancelled'}`}
                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                        onClick={() => updateBranch(idx, 'isActive', !branch.isActive)}
                                    >
                                        {branch.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    {settings.branches.length > 1 && (
                                        <button
                                            type="button"
                                            className="admin-btn admin-btn-ghost"
                                            onClick={() => handleRemoveBranch(idx)}
                                            style={{ padding: '4px 8px', color: 'var(--danger, #ef4444)' }}
                                            title="Delete branch"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="admin-form-grid">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Branch Name</label>
                                    <input className="admin-form-input" value={branch.name} onChange={e => updateBranch(idx, 'name', e.target.value)} />
                                </div>

                                <div className="admin-form-group">
                                    <label className="admin-form-label">Branch Lifecycle Status</label>
                                    <select
                                        className="admin-form-input"
                                        value={branch.status || (isUpcoming ? 'upcoming' : 'operational')}
                                        onChange={e => updateBranch(idx, 'status', e.target.value)}
                                    >
                                        <option value="operational">Operational Salon (Active Services &amp; Daily Sales)</option>
                                        <option value="upcoming">Pre-Launch Expansion (Fitout &amp; CapEx Phase)</option>
                                    </select>
                                </div>

                                <div className="admin-form-group">
                                    <label className="admin-form-label">City / State</label>
                                    <input className="admin-form-input" value={branch.city} onChange={e => updateBranch(idx, 'city', e.target.value)} />
                                </div>

                                <div className="admin-form-group">
                                    <label className="admin-form-label">Phone Contact</label>
                                    <input className="admin-form-input" value={branch.phone} onChange={e => updateBranch(idx, 'phone', e.target.value)} />
                                </div>

                                <div className="admin-form-group full">
                                    <label className="admin-form-label">Premises Address</label>
                                    <input className="admin-form-input" value={branch.address} onChange={e => updateBranch(idx, 'address', e.target.value)} />
                                </div>

                                {isUpcoming && (
                                    <div className="admin-form-group">
                                        <label className="admin-form-label">Target Launch Date</label>
                                        <input
                                            className="admin-form-input"
                                            value={branch.targetLaunch || ''}
                                            onChange={e => updateBranch(idx, 'targetLaunch', e.target.value)}
                                            placeholder="e.g. November 2026"
                                        />
                                    </div>
                                )}

                                <div className="admin-form-group full">
                                    <label className="admin-form-label">Management / Ownership Note</label>
                                    <input
                                        className="admin-form-input"
                                        value={branch.ownershipNote || ''}
                                        onChange={e => updateBranch(idx, 'ownershipNote', e.target.value)}
                                        placeholder={isManea ? 'CEO (Sole Owner — 100% Under CEO)' : isUpcoming ? 'CEO (Sole Owner — 100% Pre-Launch)' : 'e.g. CEO (70%) · Partner (30%)'}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
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
