import React, { useState, useEffect } from 'react'
import {
    X, Fingerprint, Clock, RefreshCw, Cpu, CheckCircle2,
    Play, Calendar, UserCheck, ShieldCheck, ArrowRight, Zap, Eye
} from 'lucide-react'
import { biometricService, type StaffPunchSummary } from '../data/biometricService'
import { staffStore } from '../data/store'
import type { AttendanceRawPunch, StaffMember } from '../data/types'
import { useToast } from './Toast'
import './BiometricPunchesModal.css'

interface BiometricPunchesModalProps {
    isOpen: boolean
    onClose: () => void
    targetDate?: string
    onAttendanceSynced?: () => void
}

export default function BiometricPunchesModal({
    isOpen,
    onClose,
    targetDate = new Date().toISOString().split('T')[0],
    onAttendanceSynced,
}: BiometricPunchesModalProps) {
    const { showToast } = useToast()
    const [selectedDate, setSelectedDate] = useState<string>(targetDate)
    const [rawPunches, setRawPunches] = useState<AttendanceRawPunch[]>([])
    const [allStaff, setAllStaff] = useState<StaffMember[]>([])
    const [summaries, setSummaries] = useState<StaffPunchSummary[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)

    // Test Simulator State
    const [testPin, setTestPin] = useState<string>('')
    const [testTime, setTestTime] = useState<string>('')
    const [isSimulating, setIsSimulating] = useState(false)

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [punches, staffList] = await Promise.all([
                biometricService.getRawPunches(),
                staffStore.getAll(),
            ])
            setRawPunches(punches)
            setAllStaff(staffList)

            const activeBelgaumStaff = staffList.filter(
                s => s.isActive && (s.branch === 'Belgaum' || s.branchId === 'branch_bgm' || s.biometricPin != null)
            )

            const calculated = biometricService.calculateDailySummaries(punches, activeBelgaumStaff, selectedDate)
            setSummaries(calculated)

            // Default test pin to first staff member who has a pin
            if (!testPin) {
                const firstWithPin = activeBelgaumStaff.find(s => s.biometricPin != null)
                if (firstWithPin) setTestPin(String(firstWithPin.biometricPin))
            }
        } catch (err) {
            console.error('Failed to load biometric data:', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            loadData()
        }
    }, [isOpen, selectedDate])

    // Sync calculated punch in & punch out into Attendance table
    const handleSyncToAttendance = async () => {
        setIsSyncing(true)
        try {
            const result = await biometricService.syncToAttendanceTable(selectedDate)
            showToast(
                'success',
                `Biometric Attendance Synced: ${result.syncedCount} Belgaum staff records calculated!`
            )
            if (onAttendanceSynced) onAttendanceSynced()
            await loadData()
        } catch (err: any) {
            showToast('error', 'Failed to sync biometric attendance')
        } finally {
            setIsSyncing(false)
        }
    }

    // Simulate punch
    const handleSimulatePunch = async (statusLabel: string = '0') => {
        const pinNum = parseInt(testPin, 10)
        if (!pinNum || pinNum <= 0) {
            showToast('error', 'Please enter a valid positive numeric biometric PIN')
            return
        }

        setIsSimulating(true)
        try {
            let punchIso = new Date().toISOString()
            if (testTime) {
                punchIso = new Date(`${selectedDate}T${testTime}:00`).toISOString()
            }

            const punch = await biometricService.recordPunch(pinNum, punchIso, statusLabel)
            const matchedStaff = allStaff.find(s => s.biometricPin === pinNum)
            showToast(
                'success',
                `Punch recorded: PIN #${pinNum} (${matchedStaff?.name || 'Device User'}) at ${new Date(punch.punchTime).toLocaleTimeString()}`
            )
            setTestTime('')
            await loadData()
        } catch (err) {
            showToast('error', 'Error recording punch')
        } finally {
            setIsSimulating(false)
        }
    }

    if (!isOpen) return null

    // Mapped Belgaum staff
    const belgaumStaffWithPins = allStaff.filter(
        s => s.isActive && (s.branch === 'Belgaum' || s.branchId === 'branch_bgm') && s.biometricPin != null
    )

    // Punches for the selected date
    const datePunches = rawPunches.filter(p => {
        try {
            return new Date(p.punchTime).toISOString().split('T')[0] === selectedDate
        } catch {
            return false
        }
    })

    return (
        <div className="biometric-modal-backdrop" onClick={onClose}>
            <div className="biometric-modal-content punch-modal-large" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="biometric-modal-header">
                    <div className="biometric-modal-title-group">
                        <div className="biometric-icon-badge">
                            <Clock size={22} className="text-accent" />
                        </div>
                        <div>
                            <h2 className="biometric-modal-title">Belgaum Biometric Attendance Monitor</h2>
                            <p className="biometric-modal-subtitle">
                                First Punch = Punch In • Last Punch = Punch Out • Live calculations from device
                            </p>
                        </div>
                    </div>
                    <button className="biometric-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Sub Bar with Date & Actions */}
                <div className="biometric-branch-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dim)' }}>Select Date:</span>
                        <input
                            type="date"
                            className="admin-form-input"
                            style={{ padding: '6px 12px', fontSize: 13, width: 160 }}
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                        />
                        <button
                            type="button"
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            onClick={loadData}
                            disabled={isLoading}
                            title="Refresh punches"
                        >
                            <RefreshCw size={13} className={isLoading ? 'spin-icon' : ''} /> Refresh
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                            type="button"
                            className="admin-btn admin-btn-primary"
                            onClick={handleSyncToAttendance}
                            disabled={isSyncing || summaries.length === 0}
                        >
                            <Zap size={14} />
                            {isSyncing ? 'Calculating & Syncing...' : 'Calculate & Sync into Attendance'}
                        </button>
                    </div>
                </div>

                <div className="biometric-modal-body">
                    {/* Live Calculation Cards Grid */}
                    <div className="biometric-summary-section">
                        <div className="section-title-wrap">
                            <h3 className="section-title">
                                <ShieldCheck size={16} color="var(--accent)" />
                                Calculated Daily Attendance for Belgaum Staff ({summaries.length} Punched Today)
                            </h3>
                            <span className="text-dim" style={{ fontSize: 12 }}>
                                {belgaumStaffWithPins.length} staff mapped to biometric PINs
                            </span>
                        </div>

                        {summaries.length === 0 ? (
                            <div className="biometric-empty-state">
                                <Cpu size={36} color="var(--accent)" />
                                <h4>No Biometric Punches Recorded for {selectedDate}</h4>
                                <p>
                                    When Belgaum branch staff press their finger or face on the machine,
                                    their first punch will automatically mark Punch In and the last punch will mark Punch Out.
                                </p>
                            </div>
                        ) : (
                            <div className="staff-punch-cards-grid">
                                {summaries.map(s => (
                                    <div key={s.staff.id} className="staff-punch-card">
                                        <div className="card-top">
                                            <div className="staff-info-inline">
                                                <div className="staff-avatar-sm">
                                                    {s.staff.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="staff-name-bold">{s.staff.name}</div>
                                                    <div className="staff-meta-row">
                                                        <span className="device-pin-tag">Device PIN: {s.biometricPin}</span>
                                                        <span className={`status-pill ${s.suggestedStatus}`}>
                                                            {s.suggestedStatus.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="punch-count-pill">
                                                {s.punches.length} {s.punches.length === 1 ? 'Punch' : 'Punches'}
                                            </div>
                                        </div>

                                        <div className="punch-times-grid">
                                            <div className="time-block first-in">
                                                <div className="time-label">First Punch (Punch In)</div>
                                                <div className="time-value">{s.punchInFormatted}</div>
                                            </div>

                                            <div className="time-block last-out">
                                                <div className="time-label">Last Punch (Punch Out)</div>
                                                <div className="time-value">
                                                    {s.punchOutFormatted ? (
                                                        s.punchOutFormatted
                                                    ) : (
                                                        <span className="shift-pending">Shift In-Progress</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-bottom">
                                            <div className="duration-info">
                                                {s.workingHours > 0 ? (
                                                    <span>
                                                        Duration: <strong>{s.workingHours} hrs</strong>
                                                    </span>
                                                ) : (
                                                    <span className="text-dim">Punched In • Awaiting checkout</span>
                                                )}
                                            </div>
                                            <span className="verified-badge">
                                                <CheckCircle2 size={12} color="#10b981" /> Biometric Verified
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Machine Simulation / Testing Box */}
                    <div className="biometric-sim-box">
                        <div className="sim-box-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Play size={15} color="var(--accent)" />
                                <strong style={{ fontSize: 13, color: 'var(--text-bright)' }}>
                                    Hardware Punch Simulator (Device Gateway Test)
                                </strong>
                            </div>
                            <span className="text-dim" style={{ fontSize: 11 }}>
                                Push a test punch to verify First In & Last Out calculations
                            </span>
                        </div>

                        <div className="sim-box-body">
                            <div className="sim-field">
                                <label>Staff Machine PIN</label>
                                <select
                                    className="admin-form-select"
                                    value={testPin}
                                    onChange={e => setTestPin(e.target.value)}
                                >
                                    <option value="">Select Mapped Staff...</option>
                                    {belgaumStaffWithPins.map(s => (
                                        <option key={s.id} value={s.biometricPin!}>
                                            PIN #{s.biometricPin} — {s.name} ({s.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sim-field">
                                <label>Custom Time (Optional)</label>
                                <input
                                    type="time"
                                    className="admin-form-input"
                                    value={testTime}
                                    onChange={e => setTestTime(e.target.value)}
                                />
                            </div>

                            <div className="sim-actions">
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-secondary"
                                    disabled={isSimulating || !testPin}
                                    onClick={() => handleSimulatePunch('0')}
                                >
                                    Record Punch In
                                </button>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-secondary"
                                    disabled={isSimulating || !testPin}
                                    onClick={() => handleSimulatePunch('1')}
                                >
                                    Record Punch Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Raw Punches Log Stream */}
                    <div className="biometric-raw-feed-wrap">
                        <div className="section-title-wrap">
                            <h3 className="section-title">
                                <Clock size={15} /> Device Raw Punches Stream for {selectedDate} ({datePunches.length} Logs)
                            </h3>
                        </div>

                        {datePunches.length === 0 ? (
                            <div className="text-dim" style={{ fontSize: 12, padding: 12 }}>
                                No raw punch events found for this date.
                            </div>
                        ) : (
                            <div className="raw-punches-table-container">
                                <table className="raw-punches-table">
                                    <thead>
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>Biometric PIN</th>
                                            <th>Staff Member</th>
                                            <th>Raw Status</th>
                                            <th>Log ID</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {datePunches.map(p => {
                                            const matched = allStaff.find(s => s.biometricPin === p.biometricPin)
                                            return (
                                                <tr key={p.id}>
                                                    <td style={{ fontWeight: 600 }}>
                                                        {new Date(p.punchTime).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                            hour12: true,
                                                        })}
                                                    </td>
                                                    <td>
                                                        <span className="pin-badge-inline">PIN #{p.biometricPin}</span>
                                                    </td>
                                                    <td>
                                                        {matched ? (
                                                            <strong>{matched.name}</strong>
                                                        ) : (
                                                            <span className="text-dim">Unmapped Machine User</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="raw-status-tag">
                                                            {p.punchStatus === '0' ? 'Check-In' : p.punchStatus === '1' ? 'Check-Out' : p.punchStatus || 'Device'}
                                                        </span>
                                                    </td>
                                                    <td className="text-dim" style={{ fontSize: 11 }}>
                                                        {p.id.substring(0, 16)}...
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="biometric-modal-footer">
                    <span className="text-dim">
                        Belgaum Biometric Engine • Automated Backend Trigger & Live Sync
                    </span>
                    <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
