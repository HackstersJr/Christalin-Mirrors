import React, { useState, useEffect, useMemo } from 'react'
import {
    X, Fingerprint, Check, AlertCircle, ShieldAlert, Cpu,
    Save, RotateCcw, Search, UserCheck, AlertTriangle, ArrowRight
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { staffStore } from '../data/store'
import type { StaffMember } from '../data/types'
import { useToast } from './Toast'
import './BiometricPinModal.css'

interface BiometricPinModalProps {
    isOpen: boolean
    onClose: () => void
    initialBranch?: string
    onStaffUpdated?: () => void
}

const BRANCH_OPTIONS = [
    { id: 'branch_bgm', name: 'Belgaum', isBiometric: true },
    { id: 'branch_blr', name: 'Bengaluru', isBiometric: false },
    { id: 'branch_klb', name: 'Kalaburagi', isBiometric: false },
]

export default function BiometricPinModal({
    isOpen,
    onClose,
    initialBranch = 'Belgaum',
    onStaffUpdated,
}: BiometricPinModalProps) {
    const { showToast } = useToast()
    const [selectedBranch, setSelectedBranch] = useState<string>(
        initialBranch.toLowerCase().includes('belg') ? 'Belgaum' : initialBranch
    )
    const [allStaff, setAllStaff] = useState<StaffMember[]>([])
    const [search, setSearch] = useState('')
    const [pinValues, setPinValues] = useState<Record<string, string>>({})
    const [savingId, setSavingId] = useState<string | null>(null)
    const [isSavingAll, setIsSavingAll] = useState(false)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    const isBiometricBranch = selectedBranch.toLowerCase().includes('belg')

    // Load staff
    const loadStaff = async () => {
        const staff = await staffStore.getAll()
        setAllStaff(staff)

        // Initialize PIN inputs map
        const initialPins: Record<string, string> = {}
        staff.forEach(s => {
            initialPins[s.id] = s.biometricPin != null ? String(s.biometricPin) : ''
        })
        setPinValues(initialPins)
        setValidationErrors({})
    }

    useEffect(() => {
        if (isOpen) {
            loadStaff()
        }
    }, [isOpen])

    // Active staff for selected branch
    const branchStaff = useMemo(() => {
        return allStaff.filter(s => {
            if (!s.isActive) return false
            if (s.role.toLowerCase() === 'owner') return false
            return s.branch.toLowerCase().includes(selectedBranch.toLowerCase())
        })
    }, [allStaff, selectedBranch])

    // Filtered by search
    const filteredStaff = useMemo(() => {
        if (!search.trim()) return branchStaff
        const q = search.toLowerCase()
        return branchStaff.filter(
            s => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || s.phone.includes(q)
        )
    }, [branchStaff, search])

    // Validate a specific staff PIN or entire set
    const validatePins = (newPins: Record<string, string>): Record<string, string> => {
        const errors: Record<string, string> = {}
        const usedPins = new Map<number, { staffId: string; staffName: string }>()

        // First pass: collect existing pins across all staff in the app
        allStaff.forEach(s => {
            const rawVal = newPins[s.id] !== undefined ? newPins[s.id] : (s.biometricPin != null ? String(s.biometricPin) : '')
            const trimmed = rawVal.trim()

            if (trimmed !== '') {
                const num = Number(trimmed)
                if (!Number.isInteger(num) || num <= 0) {
                    errors[s.id] = 'PIN must be a positive integer (e.g. 1, 2, 3)'
                } else if (usedPins.has(num)) {
                    const prev = usedPins.get(num)!
                    if (prev.staffId !== s.id) {
                        errors[s.id] = `PIN ${num} is already assigned to ${prev.staffName}`
                        errors[prev.staffId] = `PIN ${num} is already assigned to ${s.name}`
                    }
                } else {
                    usedPins.set(num, { staffId: s.id, staffName: s.name })
                }
            }
        })

        return errors
    }

    const handlePinChange = (staffId: string, val: string) => {
        const updated = { ...pinValues, [staffId]: val }
        setPinValues(updated)

        // Real-time duplicate & integer validation
        const errors = validatePins(updated)
        setValidationErrors(errors)
    }

    // Save individual PIN mapping to Supabase
    const handleSaveSingle = async (staffMember: StaffMember) => {
        const errors = validatePins(pinValues)
        if (errors[staffMember.id]) {
            showToast('error', errors[staffMember.id])
            return
        }

        const rawVal = pinValues[staffMember.id]?.trim() || ''
        const pinNumber = rawVal === '' ? null : parseInt(rawVal, 10)

        setSavingId(staffMember.id)
        try {
            // Save using Supabase client as requested:
            // update({ biometricPin: pin || null }).eq('id', staffId)
            const { error } = await supabase
                .from('Staff')
                .update({
                    biometricPin: pinNumber,
                    updatedAt: new Date().toISOString(),
                })
                .eq('id', staffMember.id)

            if (error) {
                console.error('Supabase update error:', error)
                showToast('error', `Failed to save: ${error.message}`)
                return
            }

            // Sync with local store
            await staffStore.updateBiometricPin(staffMember.id, pinNumber)

            // Update local state
            setAllStaff(prev =>
                prev.map(s => (s.id === staffMember.id ? { ...s, biometricPin: pinNumber } : s))
            )

            if (pinNumber != null) {
                showToast('success', `Mapped ${staffMember.name} to Device PIN ${pinNumber}`)
            } else {
                showToast('success', `Cleared Biometric PIN for ${staffMember.name}`)
            }

            if (onStaffUpdated) onStaffUpdated()
        } catch (err: any) {
            console.error('Save error:', err)
            showToast('error', 'Error updating biometric PIN')
        } finally {
            setSavingId(null)
        }
    }

    // Clear PIN for staff member
    const handleClear = async (staffMember: StaffMember) => {
        const updated = { ...pinValues, [staffMember.id]: '' }
        setPinValues(updated)
        const errors = validatePins(updated)
        setValidationErrors(errors)

        setSavingId(staffMember.id)
        try {
            const { error } = await supabase
                .from('Staff')
                .update({
                    biometricPin: null,
                    updatedAt: new Date().toISOString(),
                })
                .eq('id', staffMember.id)

            if (error) {
                showToast('error', `Failed to clear PIN: ${error.message}`)
                return
            }

            await staffStore.updateBiometricPin(staffMember.id, null)
            setAllStaff(prev =>
                prev.map(s => (s.id === staffMember.id ? { ...s, biometricPin: null } : s))
            )
            showToast('success', `Cleared PIN for ${staffMember.name}`)
            if (onStaffUpdated) onStaffUpdated()
        } catch (err: any) {
            showToast('error', 'Error clearing PIN')
        } finally {
            setSavingId(null)
        }
    }

    // Save all modified PINs
    const handleSaveAll = async () => {
        const errors = validatePins(pinValues)
        setValidationErrors(errors)
        if (Object.keys(errors).length > 0) {
            showToast('error', 'Please resolve PIN validation errors before saving')
            return
        }

        setIsSavingAll(true)
        let successCount = 0

        for (const staff of branchStaff) {
            const rawVal = pinValues[staff.id]?.trim() || ''
            const pinNumber = rawVal === '' ? null : parseInt(rawVal, 10)

            // Only update if changed
            if (pinNumber !== staff.biometricPin) {
                try {
                    const { error } = await supabase
                        .from('Staff')
                        .update({
                            biometricPin: pinNumber,
                            updatedAt: new Date().toISOString(),
                        })
                        .eq('id', staff.id)

                    if (!error) {
                        await staffStore.updateBiometricPin(staff.id, pinNumber)
                        successCount++
                    }
                } catch (err) {
                    console.error('Batch save error:', err)
                }
            }
        }

        setIsSavingAll(false)
        await loadStaff()
        if (onStaffUpdated) onStaffUpdated()
        showToast('success', `Saved biometric PIN mappings (${successCount} updated)`)
    }

    if (!isOpen) return null

    const mappedCount = branchStaff.filter(s => s.biometricPin != null).length

    return (
        <div className="biometric-modal-backdrop" onClick={onClose}>
            <div className="biometric-modal-content" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="biometric-modal-header">
                    <div className="biometric-modal-title-group">
                        <div className="biometric-icon-badge">
                            <Fingerprint size={22} className="text-accent" />
                        </div>
                        <div>
                            <h2 className="biometric-modal-title">Biometric Machine PIN Mapping</h2>
                            <p className="biometric-modal-subtitle">
                                Link physical biometric hardware machine User IDs with salon staff profiles
                            </p>
                        </div>
                    </div>
                    <button className="biometric-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Branch Selector Bar */}
                <div className="biometric-branch-bar">
                    <div className="biometric-branch-tabs">
                        {BRANCH_OPTIONS.map(b => (
                            <button
                                key={b.id}
                                type="button"
                                className={`biometric-branch-tab ${selectedBranch === b.name ? 'active' : ''}`}
                                onClick={() => setSelectedBranch(b.name)}
                            >
                                <span className="tab-name">{b.name}</span>
                                {b.isBiometric && (
                                    <span className="biometric-pill">
                                        <Cpu size={11} /> Hardware Device
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {isBiometricBranch && (
                        <div className="biometric-stat-pill">
                            <span className="dot online"></span>
                            <span>{mappedCount} of {branchStaff.length} Staff Mapped</span>
                        </div>
                    )}
                </div>

                {/* Body Content */}
                <div className="biometric-modal-body">
                    {!isBiometricBranch ? (
                        /* Notice for Non-Biometric Branches */
                        <div className="biometric-non-branch-card">
                            <div className="non-branch-icon">
                                <AlertTriangle size={36} color="var(--accent)" />
                            </div>
                            <h3>Biometric Hardware Only At Belgaum Branch</h3>
                            <p>
                                The biometric attendance machine (eSSL/ZKTeco device) is physically installed
                                exclusively at the <strong>Belgaum (Belagavi)</strong> salon branch.
                            </p>
                            <p className="sub-text">
                                <strong>{selectedBranch}</strong> branch records attendance through manual punch-in,
                                punch-out, and daily shift status dropdowns.
                            </p>
                            <button
                                className="admin-btn admin-btn-primary"
                                style={{ marginTop: 16 }}
                                onClick={() => setSelectedBranch('Belgaum')}
                            >
                                <Fingerprint size={16} /> Switch to Belgaum Device Mapping <ArrowRight size={14} />
                            </button>
                        </div>
                    ) : (
                        /* Biometric Mapping Table for Belgaum */
                        <div>
                            {/* Device Info Banner */}
                            <div className="biometric-info-banner">
                                <Cpu size={18} className="banner-icon" />
                                <div className="banner-text">
                                    <strong>Belgaum Biometric Device Active:</strong> Enter the numeric User PIN (1, 2, 3...)
                                    assigned to each staff member on the biometric machine. First and last punches will
                                    automatically calculate daily attendance.
                                </div>
                            </div>

                            {/* Search and Action Bar */}
                            <div className="biometric-table-toolbar">
                                <div className="biometric-search-wrap">
                                    <Search size={15} className="search-icon" />
                                    <input
                                        type="text"
                                        className="admin-form-input search-input"
                                        placeholder="Search Belgaum staff by name or role..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-primary"
                                    onClick={handleSaveAll}
                                    disabled={isSavingAll}
                                >
                                    <Save size={14} />
                                    {isSavingAll ? 'Saving...' : 'Save All Changes'}
                                </button>
                            </div>

                            {/* Staff Mapping List */}
                            <div className="biometric-table-container">
                                {filteredStaff.length === 0 ? (
                                    <div className="biometric-empty-state">
                                        <Search size={32} />
                                        <p>No active staff members found for Belgaum branch.</p>
                                    </div>
                                ) : (
                                    <table className="biometric-table">
                                        <thead>
                                            <tr>
                                                <th>Staff Member</th>
                                                <th>Role</th>
                                                <th>Contact</th>
                                                <th style={{ width: 220 }}>Biometric Machine PIN</th>
                                                <th style={{ width: 140 }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStaff.map(member => {
                                                const currentVal = pinValues[member.id] ?? ''
                                                const hasError = Boolean(validationErrors[member.id])
                                                const isAssigned = member.biometricPin != null
                                                const isModified = (currentVal.trim() === '' ? null : Number(currentVal.trim())) !== member.biometricPin
                                                const isBusy = savingId === member.id

                                                return (
                                                    <tr key={member.id} className={isAssigned ? 'row-mapped' : ''}>
                                                        <td>
                                                            <div className="staff-info-cell">
                                                                <div className="staff-avatar">
                                                                    {member.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="staff-name">{member.name}</div>
                                                                    <div className="staff-id">ID: {member.id.substring(0, 8)}...</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`role-badge ${member.role}`}>
                                                                {member.role.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="staff-contact">
                                                                <span>{member.phone || 'No phone'}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="pin-input-cell">
                                                                <div className="pin-input-group">
                                                                    <span className="pin-prefix">PIN #</span>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        step="1"
                                                                        placeholder="e.g. 1"
                                                                        className={`admin-form-input pin-input ${hasError ? 'input-error' : ''} ${isModified ? 'input-modified' : ''}`}
                                                                        value={currentVal}
                                                                        onChange={e => handlePinChange(member.id, e.target.value)}
                                                                        onKeyDown={e => {
                                                                            if (e.key === 'Enter') {
                                                                                e.preventDefault()
                                                                                handleSaveSingle(member)
                                                                            }
                                                                        }}
                                                                    />
                                                                    {currentVal && (
                                                                        <button
                                                                            type="button"
                                                                            className="clear-pin-btn"
                                                                            title="Clear PIN"
                                                                            onClick={() => handlePinChange(member.id, '')}
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {hasError && (
                                                                    <div className="pin-error-text">
                                                                        <AlertCircle size={11} /> {validationErrors[member.id]}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="pin-actions-cell">
                                                                <button
                                                                    type="button"
                                                                    className={`admin-btn admin-btn-sm ${isModified ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                                                                    disabled={isBusy || hasError}
                                                                    onClick={() => handleSaveSingle(member)}
                                                                    title="Save PIN mapping"
                                                                >
                                                                    {isBusy ? (
                                                                        'Saving...'
                                                                    ) : (
                                                                        <>
                                                                            <Save size={12} /> Save
                                                                        </>
                                                                    )}
                                                                </button>
                                                                {isAssigned && (
                                                                    <button
                                                                        type="button"
                                                                        className="admin-btn admin-btn-ghost admin-btn-sm"
                                                                        disabled={isBusy}
                                                                        onClick={() => handleClear(member)}
                                                                        title="Unlink PIN"
                                                                    >
                                                                        Unlink
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="biometric-modal-footer">
                    <div className="footer-left">
                        <span className="text-dim">
                            Device protocol: <strong>eSSL Standalone Biometric / ZKTeco Push</strong>
                        </span>
                    </div>
                    <div className="footer-right">
                        <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
