import { useState, useEffect } from 'react'
import { X, Clock, Calendar, User, Save, Trash2, AlertCircle } from 'lucide-react'
import type { AttendanceRecord, StaffMember } from '../data/types'
import { attendanceStore } from '../data/store'
import { useToast } from './Toast'

interface EditAttendanceModalProps {
    isOpen: boolean
    onClose: () => void
    onSaved: () => void
    initialStaffId?: string
    initialDate?: string
    existingRecord?: AttendanceRecord | null
    staffList: StaffMember[]
    isOwner: boolean
}

export function formatTimeForInput(val?: string): string {
    if (!val) return ''
    const clean = val.trim()
    // If it's already HH:MM in 24hr format
    if (/^\d{1,2}:\d{2}$/.test(clean)) {
        const [h, m] = clean.split(':')
        return `${h.padStart(2, '0')}:${m}`
    }
    // If it's 12-hour AM/PM format (e.g. 09:30 AM, 6:45 PM)
    const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (match) {
        let hour = parseInt(match[1], 10)
        const min = match[2]
        const period = match[3].toUpperCase()
        if (period === 'PM' && hour < 12) hour += 12
        if (period === 'AM' && hour === 12) hour = 0
        return `${hour.toString().padStart(2, '0')}:${min}`
    }
    return clean
}

export function calculateWorkingHours(punchIn?: string, punchOut?: string): string {
    if (!punchIn || !punchOut) return '—'
    const toMinutes = (t: string): number | null => {
        const time24 = formatTimeForInput(t)
        const parts = time24.split(':')
        if (parts.length < 2) return null
        const h = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10)
        if (isNaN(h) || isNaN(m)) return null
        return h * 60 + m
    }
    const inMin = toMinutes(punchIn)
    const outMin = toMinutes(punchOut)
    if (inMin === null || outMin === null) return '—'
    let diff = outMin - inMin
    if (diff < 0) diff += 24 * 60 // wrap past midnight
    const hrs = Math.floor(diff / 60)
    const mins = diff % 60
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`
}

export default function EditAttendanceModal({
    isOpen,
    onClose,
    onSaved,
    initialStaffId,
    initialDate,
    existingRecord,
    staffList,
    isOwner
}: EditAttendanceModalProps) {
    const { showToast } = useToast()
    const today = new Date().toISOString().split('T')[0]

    const [staffId, setStaffId] = useState(initialStaffId || existingRecord?.staffId || (staffList[0]?.id || ''))
    const [date, setDate] = useState(initialDate || existingRecord?.date || today)
    const [status, setStatus] = useState<AttendanceRecord['status']>(existingRecord?.status || 'present')
    const [punchIn, setPunchIn] = useState(formatTimeForInput(existingRecord?.punchIn))
    const [punchOut, setPunchOut] = useState(formatTimeForInput(existingRecord?.punchOut))
    const [notes, setNotes] = useState(existingRecord?.notes || '')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (existingRecord) {
            setStaffId(existingRecord.staffId)
            setDate(existingRecord.date)
            setStatus(existingRecord.status)
            setPunchIn(formatTimeForInput(existingRecord.punchIn))
            setPunchOut(formatTimeForInput(existingRecord.punchOut))
            setNotes(existingRecord.notes || '')
        } else {
            if (initialStaffId) setStaffId(initialStaffId)
            if (initialDate) setDate(initialDate)
            setStatus('present')
            setPunchIn('')
            setPunchOut('')
            setNotes('')
        }
    }, [existingRecord, initialStaffId, initialDate, isOpen])

    if (!isOpen) return null

    const selectedStaff = staffList.find(s => s.id === staffId) || staffList[0]

    const handleNowPunchIn = () => {
        const now = new Date()
        const h = now.getHours().toString().padStart(2, '0')
        const m = now.getMinutes().toString().padStart(2, '0')
        setPunchIn(`${h}:${m}`)
    }

    const handleNowPunchOut = () => {
        const now = new Date()
        const h = now.getHours().toString().padStart(2, '0')
        const m = now.getMinutes().toString().padStart(2, '0')
        setPunchOut(`${h}:${m}`)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isOwner) {
            showToast('error', 'Only the Owner account is permitted to add or modify attendance records.')
            return
        }

        if (!selectedStaff) {
            showToast('error', 'Please select a staff member.')
            return
        }
        if (!date) {
            showToast('error', 'Please choose a date.')
            return
        }

        setIsSaving(true)
        try {
            await attendanceStore.mark(
                selectedStaff.id,
                selectedStaff.name,
                selectedStaff.branch,
                date,
                status,
                {
                    punchIn: punchIn.trim() || undefined,
                    punchOut: punchOut.trim() || undefined,
                    notes: notes.trim() || undefined,
                    updatedBy: 'owner'
                }
            )
            showToast('success', `Attendance updated for ${selectedStaff.name} on ${date}`)
            onSaved()
            onClose()
        } catch (err) {
            console.error('Failed to save attendance', err)
            showToast('error', 'Failed to save attendance record. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!isOwner) {
            showToast('error', 'Only the Owner can delete attendance records.')
            return
        }
        if (!confirm(`Are you sure you want to delete the attendance record for ${selectedStaff?.name || 'this staff'} on ${date}?`)) {
            return
        }

        setIsSaving(true)
        try {
            if (selectedStaff) {
                await attendanceStore.deleteRecord(selectedStaff.id, date)
                showToast('success', `Attendance deleted for ${selectedStaff.name} on ${date}`)
                onSaved()
                onClose()
            }
        } catch (err) {
            console.error('Failed to delete attendance record', err)
            showToast('error', 'Failed to delete attendance record.')
        } finally {
            setIsSaving(false)
        }
    }

    const hoursDuration = calculateWorkingHours(punchIn, punchOut)

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal-card" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
                <div className="admin-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={18} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16 }}>
                                {existingRecord ? 'Modify Attendance & Punch Times' : 'Add Staff Day Attendance'}
                            </h3>
                            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                                ★ Owner Account Privilege
                            </span>
                        </div>
                    </div>
                    <button className="admin-modal-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {!isOwner && (
                    <div style={{ margin: '16px 0', padding: 12, borderRadius: 8, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', gap: 10, alignItems: 'center', color: '#ef4444', fontSize: 13 }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>Only the Owner account can add, edit, or modify staff attendance records across past or custom dates.</span>
                    </div>
                )}

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
                    {/* Staff selection */}
                    <div>
                        <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={14} /> Staff Member *
                        </label>
                        <select
                            className="admin-form-select"
                            value={staffId}
                            onChange={e => setStaffId(e.target.value)}
                            disabled={!isOwner}
                            required
                        >
                            {staffList.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.branch} · {s.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date selection */}
                    <div>
                        <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} /> Attendance Date *
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="date"
                                className="admin-form-input"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                disabled={!isOwner}
                                required
                            />
                            <button
                                type="button"
                                className="admin-btn admin-btn-ghost admin-btn-sm"
                                onClick={() => setDate(today)}
                                disabled={!isOwner}
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                className="admin-btn admin-btn-ghost admin-btn-sm"
                                onClick={() => {
                                    const yest = new Date()
                                    yest.setDate(yest.getDate() - 1)
                                    setDate(yest.toISOString().split('T')[0])
                                }}
                                disabled={!isOwner}
                            >
                                Yesterday
                            </button>
                        </div>
                    </div>

                    {/* Status selection */}
                    <div>
                        <label className="admin-form-label">Attendance Status *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                            {[
                                { val: 'present', label: 'Present (P)', color: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },
                                { val: 'half-day', label: 'Half Day (H)', color: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' },
                                { val: 'leave', label: 'Leave (L)', color: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: '#3b82f6' },
                                { val: 'absent', label: 'Absent (A)', color: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' },
                            ].map(s => (
                                <button
                                    key={s.val}
                                    type="button"
                                    onClick={() => setStatus(s.val as AttendanceRecord['status'])}
                                    disabled={!isOwner}
                                    style={{
                                        padding: '10px 4px',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textAlign: 'center',
                                        cursor: isOwner ? 'pointer' : 'not-allowed',
                                        border: status === s.val ? `2px solid ${s.border}` : '1px solid var(--border-light)',
                                        background: status === s.val ? s.color : 'var(--bg-card)',
                                        color: status === s.val ? s.text : 'var(--text-secondary)',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Punch In and Punch Out */}
                    <div style={{ background: 'var(--bg-card-alt)', padding: 14, borderRadius: 10, border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Clock size={14} style={{ color: 'var(--accent)' }} /> Punch In & Punch Out Times
                            </span>
                            {hoursDuration !== '—' && (
                                <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                                    Duration: {hoursDuration}
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {/* Punch In */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 500 }}>
                                        Punch In
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleNowPunchIn}
                                        disabled={!isOwner}
                                        style={{ fontSize: 10, background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}
                                    >
                                        Set Current Time
                                    </button>
                                </div>
                                <input
                                    type="time"
                                    className="admin-form-input"
                                    value={punchIn}
                                    onChange={e => setPunchIn(e.target.value)}
                                    disabled={!isOwner}
                                />
                            </div>

                            {/* Punch Out */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 500 }}>
                                        Punch Out
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleNowPunchOut}
                                        disabled={!isOwner}
                                        style={{ fontSize: 10, background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}
                                    >
                                        Set Current Time
                                    </button>
                                </div>
                                <input
                                    type="time"
                                    className="admin-form-input"
                                    value={punchOut}
                                    onChange={e => setPunchOut(e.target.value)}
                                    disabled={!isOwner}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="admin-form-label">Shift Notes / Reason for Modification</label>
                        <input
                            type="text"
                            className="admin-form-input"
                            placeholder="e.g. Approved overtime, early departure, branch coverage"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            disabled={!isOwner}
                        />
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                        {existingRecord && isOwner ? (
                            <button
                                type="button"
                                className="admin-btn admin-btn-ghost"
                                style={{ color: 'var(--danger)', gap: 6 }}
                                onClick={handleDelete}
                                disabled={isSaving}
                            >
                                <Trash2 size={14} />
                                <span>Delete Record</span>
                            </button>
                        ) : <div />}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={!isOwner || isSaving}
                                style={{ gap: 6 }}
                            >
                                <Save size={14} />
                                <span>{isSaving ? 'Saving...' : 'Save Attendance'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
