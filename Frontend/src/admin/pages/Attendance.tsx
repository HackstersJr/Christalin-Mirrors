import { useEffect, useState, useMemo } from 'react'
import {
    UserCheck, Clock, Calendar, Upload, Plus, Edit2,
    Check, Filter, ChevronLeft, ChevronRight, ShieldAlert, Sparkles
} from 'lucide-react'
import { staffStore, attendanceStore } from '../data/store'
import { authStore, getBranchScope, scopeByBranch, isOwnerLevel } from '../data/authStore'
import type { AttendanceRecord, StaffMember } from '../data/types'
import EditAttendanceModal, { calculateWorkingHours, formatTimeForInput } from '../components/EditAttendanceModal'
import BulkImportAttendanceModal from '../components/BulkImportAttendanceModal'
import { useToast } from '../components/Toast'
import '../AdminShared.css'
import './Attendance.css'

const ATTENDANCE_LABELS: Record<AttendanceRecord['status'], string> = {
    present: 'P',
    absent: 'A',
    'half-day': 'H',
    leave: 'L',
}

const ATTENDANCE_TITLES: Record<AttendanceRecord['status'], string> = {
    present: 'Present (Full Day)',
    absent: 'Absent',
    'half-day': 'Half Day Shift',
    leave: 'Approved Leave',
}

export default function Attendance() {
    const { showToast } = useToast()
    const session = authStore.getSession()
    const isOwner = isOwnerLevel(session?.role) || session?.role === 'owner'
    const branchScope = getBranchScope()

    const today = new Date().toISOString().split('T')[0]
    const thisMonthPrefix = today.slice(0, 7)

    // Data State
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
    const [allStaff, setAllStaff] = useState<StaffMember[]>([])
    const [branchStaff, setBranchStaff] = useState<StaffMember[]>([])

    // Navigation & Filters
    const [activeTab, setActiveTab] = useState<'today' | 'history' | 'summary'>('today')
    const [selectedDate, setSelectedDate] = useState<string>(today)
    const [selectedBranch, setSelectedBranch] = useState<string>(branchScope || 'all')
    const [selectedStaffId, setSelectedStaffId] = useState<string>('all')

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
    const [prefillStaffId, setPrefillStaffId] = useState<string>('')
    const [prefillDate, setPrefillDate] = useState<string>('')
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)

    const reloadData = async () => {
        const [att, stfs] = await Promise.all([
            attendanceStore.getAll(),
            staffStore.getAll(),
        ])
        setAttendance(att)
        const activeStfs = stfs.filter(s => s.isActive && s.role.toLowerCase() !== 'owner')
        setAllStaff(activeStfs)
        setBranchStaff(scopeByBranch(activeStfs))
    }

    useEffect(() => {
        reloadData()
    }, [])

    // Quick today marking
    const handleQuickMark = async (staff: StaffMember, status: AttendanceRecord['status']) => {
        const existing = attendance.find(a => a.staffId === staff.id && a.date === today)
        await attendanceStore.mark(
            staff.id,
            staff.name,
            staff.branch,
            today,
            status,
            {
                punchIn: existing?.punchIn,
                punchOut: existing?.punchOut,
                notes: existing?.notes,
                updatedBy: isOwner ? 'owner' : (session?.role || 'manager')
            }
        )
        const updated = await attendanceStore.getAll()
        setAttendance(updated)
        showToast('success', `${staff.name} marked ${status}`)
    }

    // Quick Punch In for Today
    const handleQuickPunchIn = async (staff: StaffMember) => {
        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const existing = attendance.find(a => a.staffId === staff.id && a.date === today)
        await attendanceStore.mark(
            staff.id,
            staff.name,
            staff.branch,
            today,
            existing?.status || 'present',
            {
                punchIn: timeStr,
                punchOut: existing?.punchOut,
                notes: existing?.notes,
                updatedBy: isOwner ? 'owner' : (session?.role || 'manager')
            }
        )
        const updated = await attendanceStore.getAll()
        setAttendance(updated)
        showToast('success', `Punched in ${staff.name} at ${timeStr}`)
    }

    // Quick Punch Out for Today
    const handleQuickPunchOut = async (staff: StaffMember) => {
        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const existing = attendance.find(a => a.staffId === staff.id && a.date === today)
        await attendanceStore.mark(
            staff.id,
            staff.name,
            staff.branch,
            today,
            existing?.status || 'present',
            {
                punchIn: existing?.punchIn,
                punchOut: timeStr,
                notes: existing?.notes,
                updatedBy: isOwner ? 'owner' : (session?.role || 'manager')
            }
        )
        const updated = await attendanceStore.getAll()
        setAttendance(updated)
        showToast('success', `Punched out ${staff.name} at ${timeStr}`)
    }

    // Open Edit Modal for a specific staff on any date (Owner Only)
    const handleOpenEdit = (staff: StaffMember, targetDate: string) => {
        if (!isOwner) {
            showToast('error', 'Only the Owner account can edit or modify attendance records.')
            return
        }
        const existing = attendance.find(a => a.staffId === staff.id && a.date === targetDate) || null
        setEditingRecord(existing)
        setPrefillStaffId(staff.id)
        setPrefillDate(targetDate)
        setIsEditModalOpen(true)
    }

    // Open Add Attendance for custom date/staff
    const handleOpenAdd = () => {
        if (!isOwner) {
            showToast('error', 'Only the Owner account can add historical or future attendance.')
            return
        }
        setEditingRecord(null)
        setPrefillStaffId(branchStaff[0]?.id || '')
        setPrefillDate(selectedDate)
        setIsEditModalOpen(true)
    }

    // Today map
    const todayRecordsByStaff = useMemo(() => {
        const map = new Map<string, AttendanceRecord>()
        attendance.filter(a => a.date === today).forEach(a => map.set(a.staffId, a))
        return map
    }, [attendance, today])

    // Filtered records for History view
    const historyRecords = useMemo(() => {
        return attendance.filter(a => {
            const matchesDate = a.date === selectedDate
            const matchesBranch = selectedBranch === 'all' || a.branch.toLowerCase().includes(selectedBranch.toLowerCase())
            const matchesStaff = selectedStaffId === 'all' || a.staffId === selectedStaffId
            return matchesDate && matchesBranch && matchesStaff
        })
    }, [attendance, selectedDate, selectedBranch, selectedStaffId])

    // Monthly summary calculation
    const monthlyAttendance = useMemo(() => {
        const targetStaff = selectedBranch === 'all'
            ? branchStaff
            : branchStaff.filter(s => s.branch.toLowerCase().includes(selectedBranch.toLowerCase()))

        return targetStaff.map(staff => {
            const records = attendance.filter(a => a.staffId === staff.id && a.date.startsWith(thisMonthPrefix))
            const present = records.filter(r => r.status === 'present').length
            const halfDay = records.filter(r => r.status === 'half-day').length
            const leave = records.filter(r => r.status === 'leave').length
            const absent = records.filter(r => r.status === 'absent').length
            const totalDays = records.length
            const attendancePercent = totalDays > 0 ? Math.round(((present + halfDay * 0.5) / totalDays) * 100) : 0
            return { staff, present, halfDay, leave, absent, totalDays, attendancePercent }
        })
    }, [branchStaff, attendance, thisMonthPrefix, selectedBranch])

    return (
        <div className="attendance-page-container">
            {/* Page Header */}
            <div className="admin-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>Staff Attendance & Time Clock</span>
                        {isOwner && (
                            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent)', border: '1px solid var(--accent)', fontWeight: 600 }}>
                                ★ Owner Admin Control
                            </span>
                        )}
                    </h1>
                    <p className="admin-page-sub">
                        {branchScope
                            ? `Tracking punch-in, punch-out, and attendance for ${branchScope} branch`
                            : 'Complete attendance register with punch-in/out tracking across all salon branches'}
                    </p>
                </div>

                {/* Owner Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {isOwner ? (
                        <>
                            <button
                                className="admin-btn admin-btn-secondary"
                                onClick={() => setIsImportModalOpen(true)}
                                style={{ gap: 6 }}
                                title="Bulk upload attendance records from a CSV file"
                            >
                                <Upload size={14} style={{ color: '#10b981' }} />
                                <span>Bulk Import CSV</span>
                            </button>
                            <button
                                className="admin-btn admin-btn-primary"
                                onClick={handleOpenAdd}
                                style={{ gap: 6 }}
                                title="Add or edit attendance record for any staff on any date"
                            >
                                <Plus size={15} />
                                <span>Add / Edit Any Day</span>
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px', borderRadius: 8, background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                            <ShieldAlert size={14} style={{ color: 'var(--warning)' }} />
                            <span>Branch Manager mode: Daily check-in active. Owner access required for past day edits & CSV import.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="attendance-nav-tabs" style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                <button
                    className={`attendance-tab-btn ${activeTab === 'today' ? 'active' : ''}`}
                    onClick={() => setActiveTab('today')}
                >
                    <UserCheck size={14} />
                    <span>Today's Register</span>
                    <span className="attendance-count-badge">
                        {branchStaff.length}
                    </span>
                </button>
                <button
                    className={`attendance-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <Calendar size={14} />
                    <span>Daily Logs & Any Day History</span>
                </button>
                <button
                    className={`attendance-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    <Clock size={14} />
                    <span>Monthly Summary</span>
                </button>
            </div>

            {/* TAB 1: TODAY'S REGISTER */}
            {activeTab === 'today' && (
                <div className="admin-form-card" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <UserCheck size={16} style={{ color: 'var(--accent)' }} /> Today's Staff Register — {new Date(today + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </h3>
                            <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '4px 0 0' }}>
                                Record attendance status, punch in, and punch out times for active team members.
                            </p>
                        </div>
                    </div>

                    {branchStaff.length === 0 ? (
                        <div className="admin-empty" style={{ padding: 32 }}>
                            <h3 style={{ fontSize: 14 }}>No active staff found{isOwner ? '' : ' at this branch'}</h3>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {branchStaff.map(staff => {
                                const rec = todayRecordsByStaff.get(staff.id)
                                const currentStatus = rec?.status
                                const punchInVal = rec?.punchIn
                                const punchOutVal = rec?.punchOut
                                const duration = calculateWorkingHours(punchInVal, punchOutVal)

                                return (
                                    <div key={staff.id} className="attendance-card-row">
                                        {/* Staff Meta */}
                                        <div className="attendance-staff-info">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span className="cell-primary" style={{ fontSize: 14, fontWeight: 600 }}>
                                                    {staff.name}
                                                </span>
                                                <span className="attendance-branch-pill">
                                                    {staff.branch}
                                                </span>
                                            </div>
                                            <span className="cell-secondary" style={{ textTransform: 'capitalize', fontSize: 12 }}>
                                                {staff.role}
                                            </span>
                                        </div>

                                        {/* Punch Time Badges & Controls */}
                                        <div className="attendance-punch-controls">
                                            <div className="attendance-punch-group">
                                                <span className="attendance-punch-label">IN</span>
                                                {punchInVal ? (
                                                    <span className="attendance-punch-val in">
                                                        {punchInVal}
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="attendance-punch-action-btn"
                                                        onClick={() => handleQuickPunchIn(staff)}
                                                        title="Punch In Now"
                                                    >
                                                        Punch In
                                                    </button>
                                                )}
                                            </div>

                                            <div className="attendance-punch-group">
                                                <span className="attendance-punch-label">OUT</span>
                                                {punchOutVal ? (
                                                    <span className="attendance-punch-val out">
                                                        {punchOutVal}
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="attendance-punch-action-btn"
                                                        onClick={() => handleQuickPunchOut(staff)}
                                                        title="Punch Out Now"
                                                    >
                                                        Punch Out
                                                    </button>
                                                )}
                                            </div>

                                            {duration !== '—' && (
                                                <span className="attendance-duration-badge" title="Total hours worked today">
                                                    {duration}
                                                </span>
                                            )}
                                        </div>

                                        {/* Status Toggle Buttons */}
                                        <div className="attendance-toggles">
                                            {(['present', 'half-day', 'leave', 'absent'] as const).map(status => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    className={`attendance-toggle attendance-${status} ${currentStatus === status ? 'active' : ''}`}
                                                    title={ATTENDANCE_TITLES[status]}
                                                    onClick={() => handleQuickMark(staff, status)}
                                                >
                                                    {ATTENDANCE_LABELS[status]}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Owner Edit Action */}
                                        {isOwner && (
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-ghost admin-btn-sm"
                                                onClick={() => handleOpenEdit(staff, today)}
                                                title="Edit detailed punch times and notes (Owner privilege)"
                                                style={{ padding: '6px 8px', color: 'var(--text-muted)' }}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: DAILY LOGS & ANY DAY HISTORY (Add / Edit Any Day for Any Staff) */}
            {activeTab === 'history' && (
                <div className="admin-form-card">
                    {/* Filters bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                        {/* Date Navigator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                                type="button"
                                className="admin-btn admin-btn-ghost admin-btn-sm"
                                onClick={() => {
                                    const d = new Date(selectedDate)
                                    d.setDate(d.getDate() - 1)
                                    setSelectedDate(d.toISOString().split('T')[0])
                                }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <input
                                type="date"
                                className="admin-form-input"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                style={{ width: 160 }}
                            />
                            <button
                                type="button"
                                className="admin-btn admin-btn-ghost admin-btn-sm"
                                onClick={() => {
                                    const d = new Date(selectedDate)
                                    d.setDate(d.getDate() + 1)
                                    setSelectedDate(d.toISOString().split('T')[0])
                                }}
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                type="button"
                                className="admin-btn admin-btn-secondary admin-btn-sm"
                                onClick={() => setSelectedDate(today)}
                            >
                                Today
                            </button>
                        </div>

                        {/* Branch & Staff Filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <select
                                className="admin-filter-select"
                                value={selectedBranch}
                                onChange={e => setSelectedBranch(e.target.value)}
                            >
                                <option value="all">All Branches</option>
                                <option value="Bengaluru">Bengaluru</option>
                                <option value="Kalaburagi">Kalaburagi</option>
                                <option value="Belgaum">Belgaum</option>
                            </select>

                            <select
                                className="admin-filter-select"
                                value={selectedStaffId}
                                onChange={e => setSelectedStaffId(e.target.value)}
                            >
                                <option value="all">All Staff Members</option>
                                {allStaff.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.branch})
                                    </option>
                                ))}
                            </select>

                            {isOwner && (
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-primary admin-btn-sm"
                                    onClick={handleOpenAdd}
                                    style={{ gap: 6 }}
                                >
                                    <Plus size={14} />
                                    <span>Add Attendance</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Day Records Table */}
                    <div className="admin-table-wrapper" style={{ marginBottom: 0 }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Staff Member</th>
                                    <th>Branch</th>
                                    <th>Status</th>
                                    <th>Punch In</th>
                                    <th>Punch Out</th>
                                    <th>Hours Worked</th>
                                    <th>Notes</th>
                                    {isOwner && <th style={{ textAlign: 'right' }}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {historyRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={isOwner ? 8 : 7}>
                                            <div className="admin-empty" style={{ padding: 40 }}>
                                                <Calendar size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                                                <h3 style={{ fontSize: 14 }}>No attendance records found for {selectedDate}</h3>
                                                <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '4px 0 12px' }}>
                                                    {isOwner
                                                        ? 'As Owner, you can record or backfill attendance and punch times for this day.'
                                                        : 'No marks recorded on this date.'}
                                                </p>
                                                {isOwner && (
                                                    <button
                                                        type="button"
                                                        className="admin-btn admin-btn-primary admin-btn-sm"
                                                        onClick={handleOpenAdd}
                                                        style={{ gap: 6 }}
                                                    >
                                                        <Plus size={14} />
                                                        <span>Add Record for {selectedDate}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    historyRecords.map(r => {
                                        const dur = calculateWorkingHours(r.punchIn, r.punchOut)
                                        const stf = allStaff.find(s => s.id === r.staffId)
                                        return (
                                            <tr key={r.id}>
                                                <td className="cell-primary" style={{ fontWeight: 600 }}>
                                                    {r.staffName}
                                                </td>
                                                <td>
                                                    <span className="attendance-branch-pill">{r.branch}</span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${r.status === 'present' ? 'confirmed' : r.status === 'half-day' ? 'pending' : 'cancelled'}`} style={{ textTransform: 'capitalize' }}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {r.punchIn ? <strong style={{ color: '#10b981' }}>{r.punchIn}</strong> : '—'}
                                                </td>
                                                <td>
                                                    {r.punchOut ? <strong style={{ color: '#f59e0b' }}>{r.punchOut}</strong> : '—'}
                                                </td>
                                                <td>
                                                    {dur !== '—' ? (
                                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dur}</span>
                                                    ) : '—'}
                                                </td>
                                                <td style={{ maxWidth: 200, fontSize: 12, color: 'var(--text-dim)' }}>
                                                    {r.notes || '—'}
                                                </td>
                                                {isOwner && (
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button
                                                            type="button"
                                                            className="admin-btn admin-btn-secondary admin-btn-sm"
                                                            onClick={() => {
                                                                if (stf) handleOpenEdit(stf, r.date)
                                                                else {
                                                                    setEditingRecord(r)
                                                                    setPrefillStaffId(r.staffId)
                                                                    setPrefillDate(r.date)
                                                                    setIsEditModalOpen(true)
                                                                }
                                                            }}
                                                            style={{ gap: 4 }}
                                                        >
                                                            <Edit2 size={12} />
                                                            <span>Edit</span>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: MONTHLY SUMMARY */}
            {activeTab === 'summary' && (
                <div className="admin-form-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 15 }}>
                                Monthly Attendance Summary — {new Date(today + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                            </h3>
                            <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '4px 0 0' }}>
                                Cumulative attendance score based on Present (100%), Half Day (50%), Leave, and Absent.
                            </p>
                        </div>

                        <select
                            className="admin-filter-select"
                            value={selectedBranch}
                            onChange={e => setSelectedBranch(e.target.value)}
                        >
                            <option value="all">All Branches</option>
                            <option value="Bengaluru">Bengaluru</option>
                            <option value="Kalaburagi">Kalaburagi</option>
                            <option value="Belgaum">Belgaum</option>
                        </select>
                    </div>

                    <div className="admin-table-wrapper" style={{ marginBottom: 0 }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Staff Member</th>
                                    <th>Branch</th>
                                    <th>Role</th>
                                    <th>Present</th>
                                    <th>Half Day</th>
                                    <th>Leave</th>
                                    <th>Absent</th>
                                    <th>Total Tracked</th>
                                    <th>Attendance Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyAttendance.length === 0 ? (
                                    <tr>
                                        <td colSpan={9}>
                                            <div className="admin-empty" style={{ padding: 32 }}>
                                                <h3 style={{ fontSize: 14 }}>No staff records found for this branch</h3>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    monthlyAttendance.map(m => (
                                        <tr key={m.staff.id}>
                                            <td className="cell-primary" style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                                                {m.staff.name}
                                            </td>
                                            <td>
                                                <span className="attendance-branch-pill">{m.staff.branch}</span>
                                            </td>
                                            <td className="cell-secondary" style={{ textTransform: 'capitalize' }}>
                                                {m.staff.role}
                                            </td>
                                            <td className="cell-secondary">{m.present}</td>
                                            <td className="cell-secondary">{m.halfDay}</td>
                                            <td className="cell-secondary">{m.leave}</td>
                                            <td className="cell-secondary">{m.absent}</td>
                                            <td className="cell-secondary" style={{ fontWeight: 500 }}>{m.totalDays} days</td>
                                            <td>
                                                <span className={`status-badge ${m.attendancePercent >= 90 ? 'confirmed' : m.attendancePercent >= 75 ? 'pending' : 'cancelled'}`}>
                                                    {m.attendancePercent}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            <EditAttendanceModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSaved={reloadData}
                initialStaffId={prefillStaffId}
                initialDate={prefillDate}
                existingRecord={editingRecord}
                staffList={allStaff}
                isOwner={isOwner}
            />

            <BulkImportAttendanceModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImported={reloadData}
                staffList={allStaff}
                isOwner={isOwner}
            />
        </div>
    )
}
