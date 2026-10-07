import React, { useState, useEffect } from 'react'
import {
    FileSpreadsheet, Check, AlertCircle, X, RefreshCw,
    ExternalLink, ArrowLeftRight, Download, Upload,
    Layers, Sparkles, LogOut, CheckCircle2
} from 'lucide-react'
import { googleAuthService } from '../data/googleAuthService'
import {
    googleSheetsSyncService,
    extractSpreadsheetId,
    downloadCsvTemplate,
    type GoogleSheetConfig,
    type SyncResult,
} from '../data/googleSheetsSyncService'
import type { User } from 'firebase/auth'
import './GoogleSheetsSyncModal.css'

interface Props {
    isOpen: boolean
    onClose: () => void
    onSyncComplete?: (result: SyncResult) => void
    targetBranch?: string
    syncType?: 'manual-sales' | 'daily-sales' | 'all'
}

export default function GoogleSheetsSyncModal({
    isOpen,
    onClose,
    onSyncComplete,
    targetBranch = 'all',
    syncType = 'all',
}: Props) {
    const [user, setUser] = useState<User | null>(googleAuthService.getCurrentUser())
    const [token, setToken] = useState<string | null>(googleAuthService.getAccessToken())
    const [isSigningIn, setIsSigningIn] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)

    const [selectedBranch, setSelectedBranch] = useState<string>(targetBranch)
    const [selectedType, setSelectedType] = useState<'manual-sales' | 'daily-sales' | 'all'>(syncType)
    const [config, setConfig] = useState<GoogleSheetConfig>(() => googleSheetsSyncService.getConfig())
    
    // Resolve current active sheet based on branch and type
    const activeBranchConfig = selectedBranch !== 'all' ? config.branches?.[selectedBranch] : null
    const currentSheetUrl = selectedBranch === 'all'
        ? (config.spreadsheetUrl || (config.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit` : ''))
        : selectedType === 'daily-sales'
            ? (activeBranchConfig?.dailySalesSpreadsheetUrl || '')
            : (activeBranchConfig?.manualSalesSpreadsheetUrl || '')

    const [urlInput, setUrlInput] = useState<string>(currentSheetUrl)
    const [availableTabs, setAvailableTabs] = useState<string[]>([])
    const [isInspecting, setIsInspecting] = useState(false)
    const [inspectError, setInspectError] = useState<string | null>(null)

    const [isSyncing, setIsSyncing] = useState(false)
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

    const [isAutoCreatingInDrive, setIsAutoCreatingInDrive] = useState(false)
    const [autoCreateFeedback, setAutoCreateFeedback] = useState<string | null>(null)

    // Listen for Google Auth state changes
    useEffect(() => {
        const unsubscribe = googleAuthService.subscribe((newUser, newToken) => {
            setUser(newUser)
            setToken(newToken)
        })
        return unsubscribe
    }, [])

    // Update state when modal props change
    useEffect(() => {
        if (isOpen) {
            setSelectedBranch(targetBranch)
            setSelectedType(syncType)
            const latest = googleSheetsSyncService.getConfig()
            setConfig(latest)
            const bConf = targetBranch !== 'all' ? latest.branches?.[targetBranch] : null
            const u = targetBranch === 'all'
                ? (latest.spreadsheetUrl || (latest.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${latest.spreadsheetId}/edit` : ''))
                : syncType === 'daily-sales'
                    ? (bConf?.dailySalesSpreadsheetUrl || '')
                    : (bConf?.manualSalesSpreadsheetUrl || '')
            setUrlInput(u)
        }
    }, [isOpen, targetBranch, syncType])

    // Update url input when selected branch or type changes
    useEffect(() => {
        const bConf = selectedBranch !== 'all' ? config.branches?.[selectedBranch] : null
        const u = selectedBranch === 'all'
            ? (config.spreadsheetUrl || (config.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit` : ''))
            : selectedType === 'daily-sales'
                ? (bConf?.dailySalesSpreadsheetUrl || '')
                : (bConf?.manualSalesSpreadsheetUrl || '')
        setUrlInput(u)
    }, [selectedBranch, selectedType, config])

    if (!isOpen) return null

    const handleGoogleSignIn = async () => {
        setIsSigningIn(true)
        setAuthError(null)
        try {
            const result = await googleAuthService.signIn()
            setUser(result.user)
            setToken(result.accessToken)
        } catch (err: any) {
            const errStr = String(err?.message || err)
            const isCancelled = err?.code === 'auth/popup-closed-by-user' ||
                                err?.isCancelled ||
                                err?.message?.includes('popup-closed-by-user') ||
                                errStr.includes('popup-closed-by-user')
            const isBlocked = err?.code === 'auth/popup-blocked' ||
                              err?.message?.includes('popup-blocked') ||
                              errStr.includes('popup-blocked')

            if (isCancelled) {
                setAuthError('Sign-in popup was closed before completing. Click Connect Google Account to try again.')
            } else if (isBlocked) {
                setAuthError('Popups are currently blocked by your browser. Please allow popups to authorize Google Sheets.')
            } else {
                setAuthError(err.message || 'Failed to authenticate with Google. Please try again.')
            }
        } finally {
            setIsSigningIn(false)
        }
    }

    const handleGoogleSignOut = async () => {
        await googleAuthService.signOut()
        setUser(null)
        setToken(null)
        setAvailableTabs([])
    }

    const handleSaveSheetUrl = async () => {
        const id = extractSpreadsheetId(urlInput)
        if (!id && urlInput.trim()) {
            setInspectError('Please provide a valid Google Sheet URL or spreadsheet ID.')
            return
        }

        setInspectError(null)
        if (selectedBranch === 'all') {
            const updated = await googleSheetsSyncService.saveConfig({
                spreadsheetId: id || config.spreadsheetId,
                spreadsheetUrl: urlInput.trim(),
            })
            setConfig(updated)
        } else {
            const branches = { ...(config.branches || {}) }
            const bConf = branches[selectedBranch] || {
                dailySalesSpreadsheetUrl: '',
                dailySalesSpreadsheetId: '',
                dailySalesTab: `${selectedBranch} POS Sales`,
                manualSalesSpreadsheetUrl: '',
                manualSalesSpreadsheetId: '',
                manualSalesTab: `${selectedBranch} Daily Sales`,
            }

            if (selectedType === 'daily-sales') {
                bConf.dailySalesSpreadsheetUrl = urlInput.trim()
                bConf.dailySalesSpreadsheetId = id || ''
            } else {
                bConf.manualSalesSpreadsheetUrl = urlInput.trim()
                bConf.manualSalesSpreadsheetId = id || ''
            }
            branches[selectedBranch] = bConf

            const updated = await googleSheetsSyncService.saveConfig({ branches })
            setConfig(updated)
        }
    }

    const handleAutoCreateInDrive = async () => {
        let activeToken = token
        if (!activeToken) {
            try {
                setIsSigningIn(true)
                const res = await googleAuthService.signIn()
                setUser(res.user)
                setToken(res.accessToken)
                activeToken = res.accessToken
            } catch (authErr: any) {
                setAuthError('Google sign-in required to create files in your Drive folder.')
                setIsSigningIn(false)
                return
            } finally {
                setIsSigningIn(false)
            }
        }

        if (!activeToken) return

        setIsAutoCreatingInDrive(true)
        setAutoCreateFeedback('Creating "Christalin mirror" folder in Google Drive…')
        try {
            const res = await googleSheetsSyncService.autoCreateAllBranchSheetsInDrive(activeToken, msg => {
                setAutoCreateFeedback(msg)
            })
            const updated = googleSheetsSyncService.getConfig()
            setConfig(updated)
            setAutoCreateFeedback(`All branch spreadsheets created in Drive folder "Christalin mirror"! Config synchronized for all Branch Managers.`)
        } catch (err: any) {
            setAutoCreateFeedback(`Drive creation note: ${err.message}`)
        } finally {
            setIsAutoCreatingInDrive(false)
        }
    }

    const handleInitTabs = async () => {
        if (!token || !config.spreadsheetId) return
        setIsInspecting(true)
        setInspectError(null)
        try {
            await googleSheetsSyncService.initializeStandardTabs(config.spreadsheetId, token, ['Daily Sales', 'Expenses & CapEx'])
            const meta = await googleSheetsSyncService.getSpreadsheetMetadata(config.spreadsheetId, token)
            setAvailableTabs(meta.tabs)
        } catch (err: any) {
            setInspectError(err.message || 'Failed to initialize sheet tabs.')
        } finally {
            setIsInspecting(false)
        }
    }

    const handleRunSync = async () => {
        setIsSyncing(true)
        setSyncResult(null)

        try {
            const res = await googleSheetsSyncService.performSync({
                branch: selectedBranch,
                sheetType: selectedType
            })
            setSyncResult(res)
            setConfig(googleSheetsSyncService.getConfig())
            if (onSyncComplete) {
                onSyncComplete(res)
            }
        } catch (err: any) {
            setSyncResult({
                success: false,
                message: err.message || 'Sync encountered an error.',
                pulledSales: 0,
                pushedSales: 0,
                pulledExpenses: 0,
                pushedExpenses: 0,
                timestamp: new Date().toISOString(),
                error: err.message,
            })
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <div className="gs-sync-overlay" onClick={onClose}>
            <div className="gs-sync-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="gs-sync-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="gs-sync-badge-icon">
                            <FileSpreadsheet size={24} style={{ color: '#10b981' }} />
                        </div>
                        <div>
                            <h2 className="gs-sync-title">
                                Google Sheets Two-Way Synchronization
                            </h2>
                            <p className="gs-sync-subtitle">
                                Connect your existing salon spreadsheet and keep Daily Sales, OpEx &amp; CapEx synced on both sides
                            </p>
                        </div>
                    </div>
                    <button className="gs-sync-close-btn" onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="gs-sync-body">
                    {/* Step 1: Google Authentication */}
                    <div className="gs-auth-card">
                        {user ? (
                            <>
                                <div className="gs-auth-connected">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.displayName || 'Google User'} className="gs-user-avatar" />
                                    ) : (
                                        <div className="gs-user-initial">
                                            {(user.displayName || user.email || 'G')[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-bright)' }}>
                                                {user.displayName || user.email}
                                            </span>
                                            <span className="gs-auth-badge">
                                                <CheckCircle2 size={12} /> Connected
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {user.email} · Google Sheets API authorized
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-ghost admin-btn-sm"
                                    onClick={handleGoogleSignOut}
                                    style={{ gap: 6, fontSize: 12 }}
                                >
                                    <LogOut size={13} /> Disconnect
                                </button>
                            </>
                        ) : (
                            <>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-bright)' }}>
                                        Connect Google Account
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                        Authorize secure read and write access to your Google Spreadsheets
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="gsi-material-button"
                                    onClick={handleGoogleSignIn}
                                    disabled={isSigningIn}
                                >
                                    <div className="gsi-material-button-content-wrapper">
                                        <div className="gsi-material-button-icon">
                                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                                <path fill="none" d="M0 0h48v48H0z"></path>
                                            </svg>
                                        </div>
                                        <span className="gsi-material-button-contents">
                                            {isSigningIn ? 'Connecting…' : 'Sign in with Google'}
                                        </span>
                                    </div>
                                </button>
                            </>
                        )}
                    </div>

                    {authError && (
                        <div className="gs-result-card error" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                                <span style={{ fontSize: 13, lineHeight: 1.4 }}>{authError}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4, paddingLeft: 24, flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-sm admin-btn-secondary"
                                    onClick={handleGoogleSignIn}
                                    disabled={isSigningIn}
                                    style={{ fontSize: 11, padding: '4px 10px' }}
                                >
                                    {isSigningIn ? 'Connecting…' : 'Try Connecting Again'}
                                </button>
                                {typeof window !== 'undefined' && window.self !== window.top && (
                                    <a
                                        href={window.location.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="admin-btn admin-btn-sm admin-btn-ghost"
                                        style={{ fontSize: 11, padding: '4px 10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                        <ExternalLink size={12} /> Open App in New Tab
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 1.5: Branch & Sales Type Selection */}
                    <div className="gs-config-section" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                            <label className="gs-label" style={{ margin: 0 }}>
                                <Layers size={15} className="text-primary" />
                                Target Salon Branch &amp; Sales Stream
                            </label>
                            <span style={{ fontSize: 11, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 10 }}>
                                <CheckCircle2 size={11} /> Admin Controlled · Shared with Branch Managers
                            </span>
                        </div>

                        {/* Branch Selection Pills */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                            <button
                                type="button"
                                className={`admin-btn admin-btn-sm ${selectedBranch === 'all' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                                onClick={() => setSelectedBranch('all')}
                                style={{ fontSize: 11, padding: '4px 10px' }}
                            >
                                🏢 All Branches (Consolidated Master)
                            </button>
                            {['Bengaluru', 'Kalaburagi', 'Belgaum', 'Upcoming Branch 1 (Yelahanka)', 'Upcoming Branch 2 (Hassan)'].map(b => (
                                <button
                                    key={b}
                                    type="button"
                                    className={`admin-btn admin-btn-sm ${selectedBranch === b ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                                    onClick={() => setSelectedBranch(b)}
                                    style={{ fontSize: 11, padding: '4px 10px' }}
                                >
                                    {b.includes('Upcoming') ? '🏗️' : '📍'} {b}
                                </button>
                            ))}
                        </div>

                        {/* Stream Selection */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sales Stream:</span>
                            <button
                                type="button"
                                className={`admin-btn admin-btn-sm ${selectedType === 'manual-sales' ? 'admin-btn-secondary' : 'admin-btn-ghost'}`}
                                onClick={() => setSelectedType('manual-sales')}
                                style={{ fontSize: 11, padding: '3px 8px', borderColor: selectedType === 'manual-sales' ? '#b59458' : undefined }}
                            >
                                📝 Manual Daily Sales (Cash + UPI + Retail)
                            </button>
                            <button
                                type="button"
                                className={`admin-btn admin-btn-sm ${selectedType === 'daily-sales' ? 'admin-btn-secondary' : 'admin-btn-ghost'}`}
                                onClick={() => setSelectedType('daily-sales')}
                                style={{ fontSize: 11, padding: '3px 8px', borderColor: selectedType === 'daily-sales' ? '#b59458' : undefined }}
                            >
                                🧾 POS Daily Sales (Invoices)
                            </button>
                            <button
                                type="button"
                                className={`admin-btn admin-btn-sm ${selectedType === 'all' ? 'admin-btn-secondary' : 'admin-btn-ghost'}`}
                                onClick={() => setSelectedType('all')}
                                style={{ fontSize: 11, padding: '3px 8px' }}
                            >
                                🔄 All Streams
                            </button>
                        </div>
                    </div>

                    {/* Drive 1-Click Auto Creation */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(181, 148, 88, 0.08), rgba(16, 185, 129, 0.08))',
                        border: '1px solid rgba(181, 148, 88, 0.25)',
                        borderRadius: 8,
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12
                    }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Sparkles size={14} style={{ color: '#b59458' }} />
                                Google Drive: &quot;Christalin mirror&quot; Folder
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                Auto-create separate spreadsheets in your Drive folder for every salon branch and save links in Settings.
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                className="admin-btn admin-btn-sm admin-btn-secondary"
                                onClick={handleAutoCreateInDrive}
                                disabled={isAutoCreatingInDrive}
                                style={{ fontSize: 12, gap: 5, background: 'rgba(181, 148, 88, 0.15)', borderColor: '#b59458' }}
                            >
                                <Sparkles size={12} className={isAutoCreatingInDrive ? 'spin' : ''} />
                                {isAutoCreatingInDrive ? 'Creating in Drive…' : '✨ Auto-Create in "Christalin mirror"'}
                            </button>
                            <button
                                type="button"
                                className="admin-btn admin-btn-sm admin-btn-ghost"
                                onClick={() => downloadCsvTemplate(selectedBranch === 'all' ? 'Bengaluru' : selectedBranch, selectedType === 'daily-sales' ? 'daily-sales' : 'manual-sales')}
                                style={{ fontSize: 12, gap: 5 }}
                            >
                                <Download size={12} />
                                <span>Get Template (.csv)</span>
                            </button>
                        </div>
                    </div>

                    {autoCreateFeedback && (
                        <div style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            color: '#10b981',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                        }}>
                            <CheckCircle2 size={14} />
                            <span>{autoCreateFeedback}</span>
                        </div>
                    )}

                    {/* Step 2: Spreadsheet URL / ID Input */}
                    <div className="gs-config-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <label className="gs-label" style={{ margin: 0 }}>
                                <FileSpreadsheet size={15} className="text-primary" />
                                {selectedBranch === 'all'
                                    ? 'Master Google Spreadsheet Link'
                                    : `${selectedBranch} — ${selectedType === 'daily-sales' ? 'POS Daily Sales' : 'Manual Daily Sales'} Link`}
                            </label>
                            {urlInput && (
                                <a
                                    href={urlInput.startsWith('http') ? urlInput : `https://docs.google.com/spreadsheets/d/${extractSpreadsheetId(urlInput) || urlInput}/edit`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: 11, color: '#10b981', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                >
                                    Open in Drive <ExternalLink size={11} />
                                </a>
                            )}
                        </div>

                        <div className="gs-input-group">
                            <input
                                type="text"
                                className="gs-input"
                                placeholder={`https://docs.google.com/spreadsheets/d/.../edit (${selectedBranch === 'all' ? 'Master' : `${selectedBranch} dedicated sheet`})`}
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                            />
                            <button
                                type="button"
                                className="admin-btn admin-btn-secondary admin-btn-sm"
                                onClick={handleSaveSheetUrl}
                                disabled={!urlInput.trim()}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                Save Link
                            </button>
                        </div>

                        {inspectError && (
                            <div className="gs-result-card error">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <AlertCircle size={15} />
                                    <span>{inspectError}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Tab Mapping & Salon Format */}
                    {config.spreadsheetId && (
                        <div className="gs-config-section">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <label className="gs-label">
                                    <Layers size={15} className="text-primary" />
                                    Spreadsheet Tab Mapping
                                </label>
                                {token && (
                                    <button
                                        type="button"
                                        className="admin-btn admin-btn-ghost admin-btn-sm"
                                        onClick={handleInitTabs}
                                        disabled={isInspecting}
                                        title="Automatically creates standard 'Daily Sales' and 'Expenses & CapEx' tabs with headers in your Google Sheet"
                                        style={{ fontSize: 11, gap: 4 }}
                                    >
                                        <Sparkles size={12} className="text-primary" /> Auto-Format Standard Salon Tabs
                                    </button>
                                )}
                            </div>

                            <div className="gs-tabs-grid">
                                <div className="gs-tab-col">
                                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
                                        Daily Sales Tab:
                                    </span>
                                    {availableTabs.length > 0 ? (
                                        <select
                                            className="gs-select"
                                            value={config.dailySalesTab}
                                            onChange={e => {
                                                const val = e.target.value
                                                setConfig(prev => ({ ...prev, dailySalesTab: val }))
                                                googleSheetsSyncService.saveConfig({ dailySalesTab: val })
                                            }}
                                        >
                                            {availableTabs.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            className="gs-input"
                                            value={config.dailySalesTab}
                                            onChange={e => {
                                                const val = e.target.value
                                                setConfig(prev => ({ ...prev, dailySalesTab: val }))
                                                googleSheetsSyncService.saveConfig({ dailySalesTab: val })
                                            }}
                                            placeholder="Daily Sales"
                                        />
                                    )}
                                </div>

                                <div className="gs-tab-col">
                                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
                                        OpEx &amp; CapEx Tab:
                                    </span>
                                    {availableTabs.length > 0 ? (
                                        <select
                                            className="gs-select"
                                            value={config.expensesTab}
                                            onChange={e => {
                                                const val = e.target.value
                                                setConfig(prev => ({ ...prev, expensesTab: val }))
                                                googleSheetsSyncService.saveConfig({ expensesTab: val })
                                            }}
                                        >
                                            {availableTabs.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            className="gs-input"
                                            value={config.expensesTab}
                                            onChange={e => {
                                                const val = e.target.value
                                                setConfig(prev => ({ ...prev, expensesTab: val }))
                                                googleSheetsSyncService.saveConfig({ expensesTab: val })
                                            }}
                                            placeholder="Expenses & CapEx"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Sync Options & Direction */}
                    {config.spreadsheetId && (
                        <div className="gs-config-section">
                            <label className="gs-label">
                                <ArrowLeftRight size={15} className="text-primary" />
                                Synchronization Mode
                            </label>

                            <div className="gs-sync-options-row">
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <label className="gs-checkbox-label">
                                        <input
                                            type="radio"
                                            name="syncDir"
                                            checked={config.syncDirection === 'two-way'}
                                            onChange={() => {
                                                setConfig(prev => ({ ...prev, syncDirection: 'two-way' }))
                                                googleSheetsSyncService.saveConfig({ syncDirection: 'two-way' })
                                            }}
                                        />
                                        <span style={{ fontWeight: 600 }}>Two-Way Sync (Save on Both Sides)</span>
                                    </label>
                                    <label className="gs-checkbox-label">
                                        <input
                                            type="radio"
                                            name="syncDir"
                                            checked={config.syncDirection === 'pull-only'}
                                            onChange={() => {
                                                setConfig(prev => ({ ...prev, syncDirection: 'pull-only' }))
                                                googleSheetsSyncService.saveConfig({ syncDirection: 'pull-only' })
                                            }}
                                        />
                                        <span>Pull from Sheet only</span>
                                    </label>
                                    <label className="gs-checkbox-label">
                                        <input
                                            type="radio"
                                            name="syncDir"
                                            checked={config.syncDirection === 'push-only'}
                                            onChange={() => {
                                                setConfig(prev => ({ ...prev, syncDirection: 'push-only' }))
                                                googleSheetsSyncService.saveConfig({ syncDirection: 'push-only' })
                                            }}
                                        />
                                        <span>Push to Sheet only</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sync Results Banner */}
                    {syncResult && (
                        <div className={`gs-result-card ${syncResult.success ? 'success' : 'error'}`}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                                {syncResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
                                <span>{syncResult.message}</span>
                            </div>
                            {syncResult.success && (
                                <div className="gs-sync-stats-row">
                                    <span>Daily Sales: {syncResult.pulledSales} pulled · {syncResult.pushedSales} pushed</span>
                                    <span>Expenses &amp; CapEx: {syncResult.pulledExpenses} pulled · {syncResult.pushedExpenses} pushed</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="gs-sync-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {config.lastSyncedAt ? (
                            <span>Last synced with Drive: {new Date(config.lastSyncedAt).toLocaleTimeString()}</span>
                        ) : (
                            <span>Synced with Drive Master Ledger</span>
                        )}
                        <a
                            href="/admin/settings#google-drive-sync-settings"
                            style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'underline' }}
                            onClick={onClose}
                        >
                            Change in Settings
                        </a>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            type="button"
                            className="admin-btn admin-btn-ghost"
                            onClick={onClose}
                        >
                            Close
                        </button>

                        <button
                            type="button"
                            className="admin-btn admin-btn-primary"
                            onClick={handleRunSync}
                            disabled={isSyncing || !config.spreadsheetId}
                            style={{ gap: 8, background: '#10b981', borderColor: '#10b981' }}
                        >
                            <RefreshCw size={15} className={isSyncing ? 'spin' : ''} />
                            {isSyncing ? 'Syncing Both Sides…' : 'Sync Both Sides Now'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
