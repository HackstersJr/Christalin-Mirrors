import { useEffect, useState } from 'react'
import {
    Save, RotateCcw, FileSpreadsheet, RefreshCw, ExternalLink,
    CheckCircle2, Cloud, Download, Folder, Layers, ShieldCheck, Sparkles
} from 'lucide-react'
import { settingsStore, resetStore } from '../data/store'
import type { SalonSettings } from '../data/types'
import {
    googleSheetsSyncService,
    extractSpreadsheetId,
    type GoogleSheetConfig,
    DEFAULT_DRIVE_CONFIG,
    downloadCsvTemplate,
    createDefaultBranchDetail,
    DEFAULT_BRANCHES
} from '../data/googleSheetsSyncService'
import { googleAuthService } from '../data/googleAuthService'
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
    const [selectedBranchTab, setSelectedBranchTab] = useState<string>('Bengaluru')
    const [isSyncingDrive, setIsSyncingDrive] = useState(false)
    const [isSavingAll, setIsSavingAll] = useState(false)
    const [syncFeedback, setSyncFeedback] = useState<string | null>(null)
    const [isAutoCreatingInDrive, setIsAutoCreatingInDrive] = useState(false)
    const [driveCreationStatus, setDriveCreationStatus] = useState<string | null>(null)

    const handleAutoCreateInDrive = async () => {
        let token = googleAuthService.getAccessToken()
        if (!token) {
            try {
                const res = await googleAuthService.signIn()
                token = res.accessToken
            } catch (authErr: any) {
                showToast('error', 'Google sign-in is required to create spreadsheets in your Google Drive.')
                return
            }
        }

        if (!token) return

        setIsAutoCreatingInDrive(true)
        setDriveCreationStatus('Locating or creating "Christalin mirror" folder in Google Drive…')
        try {
            const res = await googleSheetsSyncService.autoCreateAllBranchSheetsInDrive(token, msg => {
                setDriveCreationStatus(msg)
            })
            const updated = googleSheetsSyncService.getConfig()
            setDriveConfig(updated)
            setDriveCreationStatus(`All branch spreadsheets created successfully in Drive folder "Christalin mirror"! Saved and synchronized for all Branch Managers.`)
            showToast('success', `Created all 10 branch sheets in Drive folder "Christalin mirror"!`)
        } catch (err: any) {
            setDriveCreationStatus(`Drive creation note: ${err.message}`)
            showToast('error', err.message || 'Drive creation failed')
        } finally {
            setIsAutoCreatingInDrive(false)
        }
    }

    useEffect(() => {
        settingsStore.get().then(s => setSettings(s))
        // Load cloud-synced config so Branch Managers & Admin share identical sheets
        googleSheetsSyncService.fetchSharedConfigFromCloud().then(cfg => {
            setDriveConfig(cfg)
        })
    }, [])

    const handleSave = async () => {
        setIsSavingAll(true)
        try {
            await settingsStore.update(settings)
            const savedCfg = await googleSheetsSyncService.saveConfig(driveConfig)
            setDriveConfig(savedCfg)
            showToast('success', 'Settings & Branch Google Sheets saved and synchronized for all Branch Managers!')
        } catch (e: any) {
            showToast('error', e.message || 'Failed to save settings')
        } finally {
            setIsSavingAll(false)
        }
    }

    const handleDriveSyncNow = async () => {
        setIsSyncingDrive(true)
        setSyncFeedback(null)
        try {
            await googleSheetsSyncService.saveConfig(driveConfig)
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

    const updateBranchSheetDetail = (
        branchName: string,
        field: 'manualSalesSpreadsheetUrl' | 'manualSalesTab' | 'dailySalesSpreadsheetUrl' | 'dailySalesTab',
        val: string
    ) => {
        setDriveConfig(prev => {
            const existingBranches = prev.branches || {}
            const branchDetail = existingBranches[branchName] || createDefaultBranchDetail(branchName)

            let updatedDetail = { ...branchDetail, [field]: val }
            if (field === 'manualSalesSpreadsheetUrl') {
                const ext = extractSpreadsheetId(val)
                updatedDetail.manualSalesSpreadsheetId = ext || ''
            } else if (field === 'dailySalesSpreadsheetUrl') {
                const ext = extractSpreadsheetId(val)
                updatedDetail.dailySalesSpreadsheetId = ext || ''
            }

            return {
                ...prev,
                branches: {
                    ...existingBranches,
                    [branchName]: updatedDetail,
                },
            }
        })
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

            {/* Google Drive & Multi-Branch Sheets Integration Card */}
            <div className="admin-form-card" id="google-drive-sync-settings" style={{ border: '1px solid rgba(16, 185, 129, 0.25)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <h3 style={{ margin: 0 }}>Multi-Branch Google Sheets Synchronization</h3>
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
                                    <ShieldCheck size={12} /> Admin Controlled · Cloud Synced
                                </span>
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                                Configure separate Google Sheets for each salon branch (Manual typed sales &amp; POS). Links saved here are synchronized across Supabase and automatically applied for all Branch Managers.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={handleDriveSyncNow}
                            disabled={isSyncingDrive}
                            style={{ fontSize: 12, padding: '6px 12px', gap: 6 }}
                        >
                            <RefreshCw size={13} className={isSyncingDrive ? 'spin' : ''} />
                            {isSyncingDrive ? 'Syncing…' : 'Sync All with Drive'}
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

                {/* Google Drive "Christalin mirror" Folder & Template Tools Card */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(181, 148, 88, 0.06), rgba(16, 185, 129, 0.06))',
                    border: '1px solid rgba(181, 148, 88, 0.25)',
                    borderRadius: 10,
                    padding: '18px 20px',
                    marginBottom: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-bright)' }}>
                                <Folder size={18} style={{ color: '#b59458' }} />
                                <span>Google Drive Folder: &quot;Christalin mirror&quot;</span>
                                <span style={{ fontSize: 11, background: 'rgba(181, 148, 88, 0.15)', color: 'var(--color-primary, #b59458)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                                    Automated Multi-Branch Folders &amp; Sheets
                                </span>
                            </div>
                            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)', maxWidth: 680 }}>
                                Automatically create separate Google Spreadsheets for each salon branch (both POS Daily Sales &amp; Manual Daily Sales) organized inside your Google Drive in the <strong>&quot;Christalin mirror&quot;</strong> folder.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                className="admin-btn admin-btn-primary"
                                onClick={handleAutoCreateInDrive}
                                disabled={isAutoCreatingInDrive}
                                style={{
                                    gap: 7,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    background: '#10b981',
                                    borderColor: '#10b981',
                                    color: '#fff',
                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                                }}
                            >
                                <Sparkles size={15} className={isAutoCreatingInDrive ? 'spin' : ''} />
                                <span>{isAutoCreatingInDrive ? 'Creating in Drive…' : '✨ Auto-Create All Branch Sheets in Drive'}</span>
                            </button>
                            <a
                                href="https://drive.google.com/drive/search?q=name%3D'Christalin%20mirror'"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-btn admin-btn-ghost"
                                style={{ fontSize: 13, gap: 6, textDecoration: 'none' }}
                            >
                                <ExternalLink size={14} /> Open Drive Folder
                            </a>
                        </div>
                    </div>

                    {driveCreationStatus && (
                        <div style={{
                            padding: '10px 14px',
                            borderRadius: 6,
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            color: '#10b981',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}>
                            <CheckCircle2 size={15} />
                            <span>{driveCreationStatus}</span>
                        </div>
                    )}

                    {/* Column Layout & Template Guidance */}
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.15)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-bright)' }}>
                                📋 Standard Salon Google Sheet Column Layouts:
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-sm admin-btn-ghost"
                                    onClick={() => downloadCsvTemplate(selectedBranchTab === 'master' ? 'Bengaluru' : selectedBranchTab, 'manual-sales')}
                                    style={{ fontSize: 11, padding: '3px 8px', gap: 4 }}
                                >
                                    <Download size={11} /> Manual Template (.csv)
                                </button>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-sm admin-btn-ghost"
                                    onClick={() => downloadCsvTemplate(selectedBranchTab === 'master' ? 'Bengaluru' : selectedBranchTab, 'daily-sales')}
                                    style={{ fontSize: 11, padding: '3px 8px', gap: 4 }}
                                >
                                    <Download size={11} /> POS Template (.csv)
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12, fontSize: 11 }}>
                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 10, borderRadius: 6, border: '1px solid var(--border-color)' }}>
                                <div style={{ fontWeight: 600, color: 'var(--color-primary, #b59458)', marginBottom: 4 }}>
                                    1. Manual Daily Sales Sheet Columns:
                                </div>
                                <code style={{ color: '#10b981', display: 'block', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                    Date · Branch · Client Count · Cash Sales (₹) · UPI Sales (₹) · Retail Sales (₹) · Total Sales (₹) · Notes
                                </code>
                            </div>

                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 10, borderRadius: 6, border: '1px solid var(--border-color)' }}>
                                <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: 4 }}>
                                    2. POS / System Invoices Sheet Columns:
                                </div>
                                <code style={{ color: '#38bdf8', display: 'block', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                    Date · Branch · Client Count · Cash Sales (₹) · UPI Sales (₹) · Retail Sales (₹) · Service Sales (₹) · Total Revenue (₹) · Notes
                                </code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branch Selection Tabs */}
                <div style={{
                    display: 'flex',
                    gap: 6,
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: 12,
                    marginBottom: 20,
                    overflowX: 'auto'
                }}>
                    <button
                        type="button"
                        onClick={() => setSelectedBranchTab('master')}
                        className={`admin-btn admin-btn-sm ${selectedBranchTab === 'master' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                        style={{ borderRadius: 6, fontSize: 12 }}
                    >
                        <span>🏢</span> Master Consolidated Sheet
                    </button>
                    {DEFAULT_BRANCHES.map(bName => {
                        const bConf = driveConfig.branches?.[bName]
                        const isSet = !!(bConf?.manualSalesSpreadsheetId || bConf?.dailySalesSpreadsheetId)
                        return (
                            <button
                                key={bName}
                                type="button"
                                onClick={() => setSelectedBranchTab(bName)}
                                className={`admin-btn admin-btn-sm ${selectedBranchTab === bName ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                                style={{ borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <span>{bName.includes('Upcoming') ? '🏗️' : '📍'}</span>
                                <span>{bName}</span>
                                {isSet && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />}
                            </button>
                        )
                    })}
                </div>

                {/* Tab Content: Master Sheet vs Specific Branch Sheet */}
                {selectedBranchTab === 'master' ? (
                    <div className="admin-form-grid">
                        <div className="admin-form-group full" style={{
                            background: 'rgba(181, 148, 88, 0.05)',
                            padding: 12,
                            borderRadius: 8,
                            border: '1px solid rgba(181, 148, 88, 0.15)'
                        }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-primary, #b59458)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>🏢</span> Master Consolidated Salon Ledger (Default Fallback)
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                Used when a branch does not have its own dedicated sheet, and for executive reports across all salons combined.
                            </div>
                        </div>

                        <div className="admin-form-group full">
                            <label className="admin-form-label">
                                Master Google Drive Spreadsheet Link or ID
                            </label>
                            <input
                                className="admin-form-input"
                                value={driveConfig.spreadsheetUrl || driveConfig.spreadsheetId}
                                onChange={e => handleSpreadsheetUrlChange(e.target.value)}
                                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    Spreadsheet ID: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{driveConfig.spreadsheetId || 'Default Drive Master'}</strong>
                                </span>
                                {driveConfig.spreadsheetUrl && (
                                    <a
                                        href={driveConfig.spreadsheetUrl.startsWith('http') ? driveConfig.spreadsheetUrl : `https://docs.google.com/spreadsheets/d/${driveConfig.spreadsheetId}/edit`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: 12, color: 'var(--accent, #b59458)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                        Open Master in Google Drive <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-form-label">Master Daily Sales Tab Name</label>
                            <input
                                className="admin-form-input"
                                value={driveConfig.dailySalesTab}
                                onChange={e => setDriveConfig({ ...driveConfig, dailySalesTab: e.target.value })}
                                placeholder="Daily Sales"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-form-label">Master Expenses &amp; CapEx Tab Name</label>
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
                                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })
                                    : 'Synchronized'}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Specific Branch Sheet Settings */
                    <div>
                        {(() => {
                            const bName = selectedBranchTab
                            const bConf = driveConfig.branches?.[bName] || createDefaultBranchDetail(bName)
                            const hasManual = !!bConf.manualSalesSpreadsheetId
                            const hasDaily = !!bConf.dailySalesSpreadsheetId

                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {/* Branch Status Header */}
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 8,
                                        padding: '14px 18px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: 12
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span>📍</span> {bName} Branch Dedicated Google Sheets
                                                {hasManual || hasDaily ? (
                                                    <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                                                        Dedicated Branch Sheets Active
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: 11, background: 'rgba(181, 148, 88, 0.15)', color: 'var(--color-primary, #b59458)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                                                        Using Master Sheet Fallback
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                                                Branch Managers at {bName} will automatically sync daily numbers with these exact spreadsheets.
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-sm admin-btn-secondary"
                                                onClick={() => downloadCsvTemplate(bName, 'manual-sales')}
                                                style={{ fontSize: 12, gap: 5 }}
                                            >
                                                <Download size={13} />
                                                <span>Download Manual Sales Template</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-sm admin-btn-ghost"
                                                onClick={() => downloadCsvTemplate(bName, 'daily-sales')}
                                                style={{ fontSize: 12, gap: 5 }}
                                            >
                                                <Download size={13} />
                                                <span>Download POS Template</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* 1. Manual Daily Sales Sheet (Cash + UPI + Retail) */}
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 8,
                                        padding: 16
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-bright)' }}>
                                                    1. Manual Daily Sales Google Sheet (Cash, UPI &amp; Retail)
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                    For {bName} daily tickets entered via WhatsApp parser or typed entry.
                                                </div>
                                            </div>
                                            {bConf.manualSalesSpreadsheetUrl && (
                                                <a
                                                    href={bConf.manualSalesSpreadsheetUrl.startsWith('http') ? bConf.manualSalesSpreadsheetUrl : `https://docs.google.com/spreadsheets/d/${bConf.manualSalesSpreadsheetId}/edit`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontSize: 12, color: 'var(--color-primary, #b59458)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    Open Sheet <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>

                                        <div className="admin-form-grid">
                                            <div className="admin-form-group full">
                                                <label className="admin-form-label">Google Sheet Link or ID</label>
                                                <input
                                                    className="admin-form-input"
                                                    value={bConf.manualSalesSpreadsheetUrl || bConf.manualSalesSpreadsheetId || ''}
                                                    onChange={e => updateBranchSheetDetail(bName, 'manualSalesSpreadsheetUrl', e.target.value)}
                                                    placeholder={`https://docs.google.com/spreadsheets/d/.../edit (or leave blank to use Master)`}
                                                />
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                                    ID: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{bConf.manualSalesSpreadsheetId || 'None (Falls back to Master Sheet)'}</strong>
                                                </div>
                                            </div>

                                            <div className="admin-form-group">
                                                <label className="admin-form-label">Sheet Tab Name</label>
                                                <input
                                                    className="admin-form-input"
                                                    value={bConf.manualSalesTab || `${bName} Daily Sales`}
                                                    onChange={e => updateBranchSheetDetail(bName, 'manualSalesTab', e.target.value)}
                                                    placeholder={`${bName} Daily Sales`}
                                                />
                                            </div>

                                            <div className="admin-form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                <button
                                                    type="button"
                                                    className="admin-btn admin-btn-sm admin-btn-ghost"
                                                    onClick={() => downloadCsvTemplate(bName, 'manual-sales')}
                                                    style={{ width: '100%', gap: 6, fontSize: 12 }}
                                                >
                                                    <Download size={13} />
                                                    <span>Get .CSV Template for {bName}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. POS / Invoices Daily Sales Sheet */}
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 8,
                                        padding: 16
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-bright)' }}>
                                                    2. POS / System Invoices Google Sheet
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                    For {bName} front-desk billing invoices &amp; computerized receipts.
                                                </div>
                                            </div>
                                            {bConf.dailySalesSpreadsheetUrl && (
                                                <a
                                                    href={bConf.dailySalesSpreadsheetUrl.startsWith('http') ? bConf.dailySalesSpreadsheetUrl : `https://docs.google.com/spreadsheets/d/${bConf.dailySalesSpreadsheetId}/edit`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontSize: 12, color: 'var(--color-primary, #b59458)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    Open Sheet <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>

                                        <div className="admin-form-grid">
                                            <div className="admin-form-group full">
                                                <label className="admin-form-label">Google Sheet Link or ID</label>
                                                <input
                                                    className="admin-form-input"
                                                    value={bConf.dailySalesSpreadsheetUrl || bConf.dailySalesSpreadsheetId || ''}
                                                    onChange={e => updateBranchSheetDetail(bName, 'dailySalesSpreadsheetUrl', e.target.value)}
                                                    placeholder={`https://docs.google.com/spreadsheets/d/.../edit (or leave blank to use Master)`}
                                                />
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                                    ID: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{bConf.dailySalesSpreadsheetId || 'None (Falls back to Master Sheet)'}</strong>
                                                </div>
                                            </div>

                                            <div className="admin-form-group">
                                                <label className="admin-form-label">Sheet Tab Name</label>
                                                <input
                                                    className="admin-form-input"
                                                    value={bConf.dailySalesTab || `${bName} POS Sales`}
                                                    onChange={e => updateBranchSheetDetail(bName, 'dailySalesTab', e.target.value)}
                                                    placeholder={`${bName} POS Sales`}
                                                />
                                            </div>

                                            <div className="admin-form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                <button
                                                    type="button"
                                                    className="admin-btn admin-btn-sm admin-btn-ghost"
                                                    onClick={() => downloadCsvTemplate(bName, 'daily-sales')}
                                                    style={{ width: '100%', gap: 6, fontSize: 12 }}
                                                >
                                                    <Download size={13} />
                                                    <span>Get POS Template for {bName}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}
                    </div>
                )}

                {/* Auto-Sync Checkbox */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                        <input
                            type="checkbox"
                            checked={driveConfig.autoSyncOnSave}
                            onChange={e => setDriveConfig({ ...driveConfig, autoSyncOnSave: e.target.checked })}
                            style={{ width: 16, height: 16, accentColor: '#10b981' }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                            <strong>Automatic Real-Time Sync:</strong> Automatically push and sync changes to the configured Google Sheet whenever daily sales or expenses are saved.
                        </span>
                    </label>
                </div>

                {/* Google Drive "Christalin Mirrors" Folder & Template Blueprint Guide */}
                <div style={{
                    marginTop: 24,
                    padding: 18,
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed var(--border-color, #444)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-primary, #b59458)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Folder size={16} />
                            <span>Google Drive "Christalin Mirrors" Folder Setup &amp; Template Blueprints</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                className="admin-btn admin-btn-xs admin-btn-secondary"
                                onClick={() => downloadCsvTemplate('Bengaluru', 'manual-sales')}
                            >
                                <Download size={11} /> Bengaluru Template
                            </button>
                            <button
                                type="button"
                                className="admin-btn admin-btn-xs admin-btn-secondary"
                                onClick={() => downloadCsvTemplate('Kalaburagi', 'manual-sales')}
                            >
                                <Download size={11} /> Kalaburagi Template
                            </button>
                            <button
                                type="button"
                                className="admin-btn admin-btn-xs admin-btn-secondary"
                                onClick={() => downloadCsvTemplate('Belgaum', 'manual-sales')}
                            >
                                <Download size={11} /> Belgaum Template
                            </button>
                            <button
                                type="button"
                                className="admin-btn admin-btn-xs admin-btn-ghost"
                                onClick={() => downloadCsvTemplate('Bengaluru', 'expenses')}
                            >
                                <Download size={11} /> Expenses Template
                            </button>
                        </div>
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                        Organize your Google Drive with a main folder named <strong>Christalin Mirrors</strong>. For clean bookkeeping, create subfolders for each branch and paste each sheet link in the corresponding branch tab above:
                    </p>

                    {/* Folder Structure Visualization */}
                    <div style={{
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        padding: '14px 18px',
                        fontFamily: 'monospace',
                        fontSize: 12,
                        lineHeight: 1.6,
                        color: 'var(--text-primary)',
                        marginBottom: 16,
                        overflowX: 'auto'
                    }}>
                        <div>📁 Google Drive / <strong>Christalin Mirrors</strong> /</div>
                        <div style={{ paddingLeft: 20 }}>├── 📁 <strong>Bengaluru</strong> /</div>
                        <div style={{ paddingLeft: 40 }}>│   ├── 📊 CM Bengaluru — Manual Daily Sales (Cash, UPI &amp; Retail)</div>
                        <div style={{ paddingLeft: 40 }}>│   └── 📊 CM Bengaluru — POS Billing Daily Sales</div>
                        <div style={{ paddingLeft: 20 }}>├── 📁 <strong>Kalaburagi</strong> /</div>
                        <div style={{ paddingLeft: 40 }}>│   ├── 📊 CM Kalaburagi — Manual Daily Sales</div>
                        <div style={{ paddingLeft: 40 }}>│   └── 📊 CM Kalaburagi — POS Billing Daily Sales</div>
                        <div style={{ paddingLeft: 20 }}>├── 📁 <strong>Belgaum</strong> /</div>
                        <div style={{ paddingLeft: 40 }}>│   ├── 📊 CM Belgaum — Manual Daily Sales</div>
                        <div style={{ paddingLeft: 40 }}>│   └── 📊 CM Belgaum — POS Billing Daily Sales</div>
                        <div style={{ paddingLeft: 20 }}>└── 📁 <strong>Master &amp; Financials</strong> /</div>
                        <div style={{ paddingLeft: 40 }}>    ├── 📊 CM Master Executive Ledger</div>
                        <div style={{ paddingLeft: 40 }}>    └── 📊 CM Monthly OpEx &amp; CapEx Expenses</div>
                    </div>

                    {/* Column Headers Guide */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                        {/* Tab 1 */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 6, border: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: '#3b82f6', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Manual Daily Sales Format</span>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>8 Columns</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                Standard format for Cash, UPI, and Retail ticketing:
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-primary)', background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 4, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                Date | Branch | Client Count | Cash Sales (₹) | UPI Sales (₹) | Retail Sales (₹) | Total Sales (₹) | Notes / Remarks
                            </div>
                        </div>

                        {/* Tab 2 */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 6, border: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: '#10b981', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>POS / Invoices Sales Format</span>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>9 Columns</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                Standard format for computerized salon invoices:
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-primary)', background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 4, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                Date | Branch | Client Count | Cash Sales (₹) | UPI Sales (₹) | Retail Sales (₹) | Service Sales (₹) | Total Revenue (₹) | Notes
                            </div>
                        </div>

                        {/* Tab 3 */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 6, border: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: '#f59e0b', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Expenses &amp; CapEx Format</span>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>6 Columns</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                Standard format for salon overheads &amp; equipment:
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-primary)', background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 4, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                Date | Branch | Type (OpEx / CapEx) | Category | Amount (₹) | Description
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
