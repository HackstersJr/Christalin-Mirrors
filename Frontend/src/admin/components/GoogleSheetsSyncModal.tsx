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
    type GoogleSheetConfig,
    type SyncResult,
} from '../data/googleSheetsSyncService'
import type { User } from 'firebase/auth'
import './GoogleSheetsSyncModal.css'

interface Props {
    isOpen: boolean
    onClose: () => void
    onSyncComplete?: (result: SyncResult) => void
}

export default function GoogleSheetsSyncModal({
    isOpen,
    onClose,
    onSyncComplete,
}: Props) {
    const [user, setUser] = useState<User | null>(googleAuthService.getCurrentUser())
    const [token, setToken] = useState<string | null>(googleAuthService.getAccessToken())
    const [isSigningIn, setIsSigningIn] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)

    const [config, setConfig] = useState<GoogleSheetConfig>(googleSheetsSyncService.getConfig())
    const [urlInput, setUrlInput] = useState(config.spreadsheetUrl || (config.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit` : ''))
    const [availableTabs, setAvailableTabs] = useState<string[]>([])
    const [isInspecting, setIsInspecting] = useState(false)
    const [inspectError, setInspectError] = useState<string | null>(null)

    const [isSyncing, setIsSyncing] = useState(false)
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

    // Listen for Google Auth state changes
    useEffect(() => {
        const unsubscribe = googleAuthService.subscribe((newUser, newToken) => {
            setUser(newUser)
            setToken(newToken)
        })
        return unsubscribe
    }, [])

    // Whenever sheet ID or token changes, inspect available tabs if we have a valid ID and token
    useEffect(() => {
        if (isOpen && token && config.spreadsheetId) {
            handleInspectSheet(config.spreadsheetId, token)
        }
    }, [isOpen, token, config.spreadsheetId])

    if (!isOpen) return null

    const handleGoogleSignIn = async () => {
        setIsSigningIn(true)
        setAuthError(null)
        try {
            const result = await googleAuthService.signIn()
            setUser(result.user)
            setToken(result.accessToken)

            // If spreadsheet already entered, inspect immediately
            if (config.spreadsheetId) {
                await handleInspectSheet(config.spreadsheetId, result.accessToken)
            }
        } catch (err: any) {
            console.error('Google Sign-In Error', err)
            setAuthError(err.message || 'Failed to authenticate with Google. Please try again.')
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

    const handleUrlBlurOrSubmit = async () => {
        const id = extractSpreadsheetId(urlInput)
        if (!id) {
            if (urlInput.trim()) {
                setInspectError('Please provide a valid Google Sheet URL or spreadsheet ID.')
            }
            return
        }

        setInspectError(null)
        const updated = googleSheetsSyncService.saveConfig({
            spreadsheetId: id,
            spreadsheetUrl: urlInput.trim(),
        })
        setConfig(updated)

        if (token) {
            await handleInspectSheet(id, token)
        }
    }

    const handleInspectSheet = async (id: string, currentToken: string) => {
        setIsInspecting(true)
        setInspectError(null)
        try {
            const meta = await googleSheetsSyncService.getSpreadsheetMetadata(id, currentToken)
            setAvailableTabs(meta.tabs)
            const updated = googleSheetsSyncService.saveConfig({
                spreadsheetTitle: meta.title,
                // If Daily Sales tab not found in sheet, keep default or select first tab
                dailySalesTab: meta.tabs.includes(config.dailySalesTab) ? config.dailySalesTab : (meta.tabs[0] || 'Daily Sales'),
                expensesTab: meta.tabs.includes(config.expensesTab) ? config.expensesTab : (meta.tabs[1] || meta.tabs[0] || 'Expenses & CapEx'),
            })
            setConfig(updated)
        } catch (err: any) {
            console.error('Inspect failed', err)
            setInspectError(err.message || 'Unable to inspect spreadsheet. Verify permissions and sharing settings.')
        } finally {
            setIsInspecting(false)
        }
    }

    const handleInitTabs = async () => {
        if (!token || !config.spreadsheetId) return
        setIsInspecting(true)
        setInspectError(null)
        try {
            await googleSheetsSyncService.initializeStandardTabs(config.spreadsheetId, token, ['Daily Sales', 'Expenses & CapEx'])
            await handleInspectSheet(config.spreadsheetId, token)
        } catch (err: any) {
            setInspectError(err.message || 'Failed to initialize sheet tabs.')
        } finally {
            setIsInspecting(false)
        }
    }

    const handleRunSync = async () => {
        if (!config.spreadsheetId) {
            setInspectError('Please connect your Google Sheet first.')
            return
        }
        if (!token) {
            setAuthError('Please sign in with Google to authorize sync.')
            return
        }

        setIsSyncing(true)
        setSyncResult(null)

        try {
            const res = await googleSheetsSyncService.performSync()
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
                        <div className="gs-result-card error">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertCircle size={15} />
                                <span>{authError}</span>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Spreadsheet URL / ID Input */}
                    <div className="gs-config-section">
                        <label className="gs-label">
                            <FileSpreadsheet size={15} className="text-primary" />
                            Existing Google Spreadsheet Link or ID
                        </label>
                        <div className="gs-input-group">
                            <input
                                type="text"
                                className="gs-input"
                                placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                onBlur={handleUrlBlurOrSubmit}
                            />
                            <button
                                type="button"
                                className="admin-btn admin-btn-secondary admin-btn-sm"
                                onClick={handleUrlBlurOrSubmit}
                                disabled={isInspecting || !urlInput.trim()}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                {isInspecting ? (
                                    <>
                                        <RefreshCw size={13} className="spin" /> Checking…
                                    </>
                                ) : (
                                    'Connect Sheet'
                                )}
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

                        {/* Connected Sheet Details Banner */}
                        {config.spreadsheetId && config.spreadsheetTitle && (
                            <div className="gs-sheet-banner">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                                            {config.spreadsheetTitle}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            ID: <code>{config.spreadsheetId}</code>
                                        </div>
                                    </div>
                                </div>
                                <a
                                    href={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="admin-btn admin-btn-ghost admin-btn-sm"
                                    style={{ gap: 6, fontSize: 12, color: '#10b981' }}
                                >
                                    Open Sheet <ExternalLink size={12} />
                                </a>
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
                                                const updated = googleSheetsSyncService.saveConfig({ dailySalesTab: e.target.value })
                                                setConfig(updated)
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
                                                const updated = googleSheetsSyncService.saveConfig({ dailySalesTab: e.target.value })
                                                setConfig(updated)
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
                                                const updated = googleSheetsSyncService.saveConfig({ expensesTab: e.target.value })
                                                setConfig(updated)
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
                                                const updated = googleSheetsSyncService.saveConfig({ expensesTab: e.target.value })
                                                setConfig(updated)
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
                                                const updated = googleSheetsSyncService.saveConfig({ syncDirection: 'two-way' })
                                                setConfig(updated)
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
                                                const updated = googleSheetsSyncService.saveConfig({ syncDirection: 'pull-only' })
                                                setConfig(updated)
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
                                                const updated = googleSheetsSyncService.saveConfig({ syncDirection: 'push-only' })
                                                setConfig(updated)
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
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {config.lastSyncedAt ? (
                            <span>Last synced: {new Date(config.lastSyncedAt).toLocaleString()}</span>
                        ) : (
                            <span>Not synced yet</span>
                        )}
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
                            disabled={isSyncing || !config.spreadsheetId || !token}
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
