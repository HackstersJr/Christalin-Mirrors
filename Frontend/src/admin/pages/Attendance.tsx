import { useEffect, useState, useMemo } from 'react'
import {
    UserCheck, Clock, Calendar, Upload, Plus, Edit2,
    Check, Filter, ChevronLeft, ChevronRight, ShieldAlert, Sparkles, MapPin, ArrowRightLeft, UserPlus, X,
    Fingerprint, Zap, Cpu
} from 'lucide-react'
import { staffStore, attendanceStore } from '../data/store'
import { authStore, getBranchScope, isOwnerLevel } from '../data/authStore'
import type { AttendanceRecord, StaffMember } from '../data/types'
import EditAttendanceModal, { calculateWorkingHours, formatTimeForInput } from '../components/EditAttendanceModal'
import BulkImportAttendanceModal from '../components/BulkImportAttendanceModal'
import BiometricPunchesModal from '../components/BiometricPunchesModal'
import { biometricService } from '../data/biometricService'
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

const SALON_BRANCHES = ['Bengaluru', 'Kalaburagi', 'Belgaum']

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

    // Navigation & Filters
    const [activeTab, setActiveTab] = useState<'today' | 'history' | 'summary'>('today')
    const [todayBranchFilter, setTodayBranchFilter] = useState<string>(branchScope || 'all')
    const [selectedDate, setSelectedDate] = useState<string>(today)
    const [selectedBranch, setSelectedBranch] = useState<string>(branchScope || 'all')
    const [selectedStaffId, setSelectedStaffId] = useState<string>('all')

    // Visiting Staff Quick Add Modal State
    const [isVisitingModalOpen, setIsVisitingModalOpen] = useState(false)
    const [visitingStaffId, setVisitingStaffId] = useState('')

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
    const [prefillStaffId, setPrefillStaffId] = useState<string>('')
    const [prefillDate, setPrefillDate] = useState<string>('')
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [isBiometricPunchesModalOpen, setIsBiometricPunchesModalOpen] = useState(false)
    const [isSyncingBiometric, setIsSyncingBiometric] = useState(false)

    const reloadData = async () => {
        const [att, stfs] = await Promise.all([
            attendanceStore.getAll(),
            staffStore.getAll(),
        ])
        setAttendance(att)
        const activeStfs = stfs.filter(s => s.isActive && s.role.toLowerCase() !== 'owner')
        setAllStaff(activeStfs)
    }

    // Auto-calculate biometric attendance for Belgaum branch
    const handleSyncBiometric = async () => {
        setIsSyncingBiometric(true)
        try {
            const dateToSync = activeTab === 'today' ? today : selectedDate
            const res = await biometricService.syncToAttendanceTable(dateToSync)
            const updated = await attendanceStore.getAll()
            setAttendance(updated)
            showToast(
                'success',
                `Belgaum Biometric Synced: Calculated ${res.syncedCount} staff attendance records (First In & Last Out)`
            )
        } catch {
            showToast('error', 'Error syncing biometric attendance')
        } finally {
            setIsSyncingBiometric(false)
        }
    }

    useEffect(() => {
        reloadData()
    }, [])

    // Today map: staffId -> AttendanceRecord
    const todayRecordsByStaff = useMemo(() => {
        const map = new Map<string, AttendanceRecord>()
        attendance.filter(a => a.date === today).forEach(a => map.set(a.staffId, a))
        return map
    }, [attendance, today])

    // Helper to get effective shift branch for a staff on a given date (defaults to record branch, or staff base branch)
    const getShiftBranch = (staff: StaffMember, record?: AttendanceRecord): string => {
        if (record?.branch && record.branch !== 'All Branches') return record.branch
        if (staff.branch && staff.branch !== 'All Branches') return staff.branch
        if (branchScope) return branchScope
        return 'Bengaluru'
    }

    // Filter staff for Today's view:
    // If todayBranchFilter is specific, include staff assigned to that branch today OR staff whose base branch is that branch
    const visibleTodayStaff = useMemo(() => {
        if (todayBranchFilter === 'all') return allStaff
        return allStaff.filter(staff => {
            const rec = todayRecordsByStaff.get(staff.id)
            const currentShiftBranch = getShiftBranch(staff, rec)
            return currentShiftBranch.toLowerCase().includes(todayBranchFilter.toLowerCase())
        })
    }, [allStaff, todayRecordsByStaff, todayBranchFilter])

    // Visiting staff candidates: staff not currently showing in the filtered list
    const visitingCandidates = useMemo(() => {
        if (todayBranchFilter === 'all') return []
        const currentIds = new Set(visibleTodayStaff.map(s => s.id))
        return allStaff.filter(s => !currentIds.has(s.id))
    }, [allStaff, visibleTodayStaff, todayBranchFilter])

    // Quick today status mark (retaining shift branch)
    const handleQuickMark = async (staff: StaffMember, status: AttendanceRecord['status']) => {
        const existing = todayRecordsByStaff.get(staff.id)
        const targetBranch = getShiftBranch(staff, existing)
        await attendanceStore.mark(
            staff.id,
            staff.name,
            targetBranch,
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
        showToast('success', `${staff.name} marked ${status} at ${targetBranch}`)
    }

    // Change shift branch dynamically (interchange support!)
    const handleUpdateShiftBranch = async (staff: StaffMember, newBranch: string) => {
        const existing = todayRecordsByStaff.get(staff.id)
        const isInterchanged = staff.branch !== newBranch && staff.branch !== 'All Branches'
        await attendanceStore.mark(
            staff.id,
            staff.name,
            newBranch,
            today,
            existing?.status || 'present',
            {
                punchIn: existing?.punchIn,
                punchOut: existing?.punchOut,
                notes: existing?.notes || (isInterchanged ? `Stationed interchanged at ${newBranch}` : undefined),
                updatedBy: isOwner ? 'owner' : (session?.role || 'manager')
            }
        )
        const updated = await attendanceStore.getAll()
        setAttendance(updated)
        showToast('success', `${staff.name} stationed at ${newBranch} branch for today's shift`)
    }

    // Quick Punch In for Today
    const handleQuickPunchIn = async (staff: StaffMember) => {
        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const existing = todayRecordsByStaff.get(staff.id)
        const targetBranch = getShiftBranch(staff, existing)
        await attendanceStore.mark(
            staff.id,
            staff.name,
            targetBranch,
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
        showToast('success', `Punched in ${staff.name} at ${timeStr} (${targetBranch})`)
    }

    // Quick Punch Out for Today
    const handleQuickPunchOut = async (staff: StaffMember) => {
        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const existing = todayRecordsByStaff.get(staff.id)
        const targetBranch = getShiftBranch(staff, existing)
        await attendanceStore.mark(
            staff.id,
            staff.name,
            targetBranch,
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
        showToast('success', `Punched out ${staff.name} at ${timeStr} (${targetBranch})`)
    }

    // Add visiting staff into today's branch
    const handleAddVisitingStaff = async () => {
        if (!visitingStaffId) return
        const staff = allStaff.find(s => s.id === visitingStaffId)
        if (!staff) return
        const targetBranch = todayBranchFilter !== 'all' ? todayBranchFilter : 'Bengaluru'
        await attendanceStore.mark(
            staff.id,
            staff.name,
            targetBranch,
            today,
            'present',
            {
                notes: `Visiting interchange shift from ${staff.branch}`,
                updatedBy: isOwner ? 'owner' : (session?.role || 'manager')
            }
        )
        const updated = await attendanceStore.getAll()
        setAttendance(updated)
        setIsVisitingModalOpen(false)
        setVisitingStaffId('')
        showToast('success', `${staff.name} added to ${targetBranch} branch attendance for today`)
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
        setPrefillStaffId(allStaff[0]?.id || '')
        setPrefillDate(selectedDate)
        setIsEditModalOpen(true)
    }

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
        return allStaff.map(staff => {
            const records = attendance.filter(a => a.staffId === staff.id && a.date.startsWith(thisMonthPrefix))
            // Count shifts at specific branches if filtered
            const matchingRecords = selectedBranch === 'all'
                ? records
                : records.filter(r => r.branch.toLowerCase().includes(selectedBranch.toLowerCase()))

            const present = matchingRecords.filter(r => r.status === 'present').length
            const halfDay = matchingRecords.filter(r => r.status === 'half-day').length
            const leave = matchingRecords.filter(r => r.status === 'leave').length
            const absent = matchingRecords.filter(r => r.status === 'absent').length
            const totalDays = matchingRecords.length
            const attendancePercent = totalDays > 0 ? Math.round(((present + halfDay * 0.5) / totalDays) * 100) : 0

            // Breakdown of branches worked
            const branchBreakdown: Record<string, number> = {}
            records.forEach(r => {
                branchBreakdown[r.branch] = (branchBreakdown[r.branch] || 0) + 1
            })

            return { staff, present, halfDay, leave, absent, totalDays, attendancePercent, branchBreakdown }
        }).filter(m => selectedBranch === 'all' || m.totalDays > 0 || m.staff.branch.toLowerCase().includes(selectedBranch.toLowerCase()))
    }, [allStaff, attendance, thisMonthPrefix, selectedBranch])

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
                        Dynamic branch interchange supported — track shift station, punch in, punch out, and attendance across Bengaluru, Kalaburagi, and Belgaum.
                    </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        className="admin-btn admin-btn-secondary"
                        onClick={() => setIsBiometricPunchesModalOpen(true)}
                        style={{ gap: 6 }}
                        title="Belgaum Biometric Device Monitor — First Punch In & Last Punch Out tracker"
                    >
                        <Fingerprint size={14} style={{ color: 'var(--accent)' }} />
                        <span>Biometric Monitor</span>
                    </button>
                    {isOwner ? (
                        <>
                            <button
                                className="admin-btn admin-btn-secondary"
                                onClick={() => setIsImportModalOpen(true)}
                                style={{ gap: 6 }}
                                title="Bulk upload attendance records with branch interchange support from CSV"
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
                            <span>Daily register active.</span>
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
                    <span>Today's Shift Register</span>
                    <span className="attendance-count-badge">
                        {visibleTodayStaff.length}
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <UserCheck size={16} style={{ color: 'var(--accent)' }} /> Today's Staff Register — {new Date(today + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </h3>
                            <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '4px 0 0' }}>
                                Staff can interchange between branches. Adjust their shift station below as needed.
                            </p>
                        </div>

                        {/* Branch filter & Visiting staff check-in */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Filter Branch:</label>
                                <select
                                    className="admin-filter-select"
                                    value={todayBranchFilter}
                                    onChange={e => setTodayBranchFilter(e.target.value)}
                                >
                                    <option value="all">All Branches (Full Team)</option>
                                    <option value="Bengaluru">Bengaluru Branch</option>
                                    <option value="Kalaburagi">Kalaburagi Branch</option>
                                    <option value="Belgaum">Belgaum Branch</option>
                                </select>
                            </div>

                            {todayBranchFilter !== 'all' && visitingCandidates.length > 0 && (
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-secondary admin-btn-sm"
                                    onClick={() => {
                                        setVisitingStaffId(visitingCandidates[0]?.id || '')
                                        setIsVisitingModalOpen(true)
                                    }}
                                    style={{ gap: 6 }}
                                    title="Check in staff visiting from another branch"
                                >
                                    <UserPlus size={13} style={{ color: 'var(--accent)' }} />
                                    <span>+ Check In Visiting Staff</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Belgaum Biometric Banner */}
                    {(todayBranchFilter === 'all' || todayBranchFilter.toLowerCase().includes('belg')) && (
                        <div style={{
                            marginBottom: 16,
                            padding: '12px 16px',
                            borderRadius: 10,
                            background: 'rgba(193, 127, 89, 0.08)',
                            border: '1px solid rgba(193, 127, 89, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 12
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    background: 'rgba(193, 127, 89, 0.2)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--accent)'
                                }}>
                                    <Fingerprint size={18} />
                                </span>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-bright)' }}>
                                        Belgaum Biometric Hardware Integration
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                                        First punch sets Punch In • Last punch sets Punch Out • Auto-calculates into attendance
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-secondary admin-btn-sm"
                                    onClick={() => setIsBiometricPunchesModalOpen(true)}
                                    style={{ fontSize: 12, padding: '5px 10px' }}
                                >
                                    <Clock size={12} /> View Punches Feed
                                </button>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-primary admin-btn-sm"
                                    onClick={handleSyncBiometric}
                                    disabled={isSyncingBiometric}
                                    style={{ fontSize: 12, padding: '5px 12px' }}
                                >
                                    <Zap size={12} /> {isSyncingBiometric ? 'Syncing...' : 'Sync Biometric Punches'}
                                </button>
                            </div>
                        </div>
                    )}

                    {visibleTodayStaff.length === 0 ? (
                        <div className="admin-empty" style={{ padding: 32 }}>
                            <h3 style={{ fontSize: 14 }}>No staff currently stationed at {todayBranchFilter} today</h3>
                            <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '4px 0 12px' }}>
                                You can check in visiting staff from another branch or view all branches.
                            </p>
                            {visitingCandidates.length > 0 && (
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-primary admin-btn-sm"
                                    onClick={() => {
                                        setVisitingStaffId(visitingCandidates[0]?.id || '')
                                        setIsVisitingModalOpen(true)
                                    }}
                                    style={{ gap: 6 }}
                                >
                                    <UserPlus size={14} />
                                    <span>Check In Staff at {todayBranchFilter}</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {visibleTodayStaff.map(staff => {
                                const rec = todayRecordsByStaff.get(staff.id)
                                const currentStatus = rec?.status
                                const currentShiftBranch = getShiftBranch(staff, rec)
                                const isInterchanged = staff.branch !== 'All Branches' && staff.branch !== currentShiftBranch
                                const punchInVal = rec?.punchIn
                                const punchOutVal = rec?.punchOut
                                const duration = calculateWorkingHours(punchInVal, punchOutVal)

                                return (
                                    <div key={staff.id} className="attendance-card-row">
                                        {/* Staff Meta */}
                                        <div className="attendance-staff-info">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span className="cell-primary" style={{ fontSize: 14, fontWeight: 600 }}>
                                                    {staff.name}
                                                </span>
                                                <span className="attendance-branch-pill" title={`Base branch: ${staff.branch}`}>
                                                    Base: {staff.branch}
                                                </span>
                                                {staff.biometricPin != null && (
                                                    <span className="attendance-branch-pill" style={{ color: 'var(--accent)', borderColor: 'rgba(193,127,89,0.3)' }} title={`Biometric Machine User PIN: ${staff.biometricPin}`}>
                                                        <Fingerprint size={10} style={{ display: 'inline', marginRight: 2 }} /> PIN #{staff.biometricPin}
                                                    </span>
                                                )}
                                                {(rec?.notes?.toLowerCase().includes('biometric') || rec?.updatedBy === 'biometric-system') && (
                                                    <span
                                                        style={{
                                                            fontSize: 10,
                                                            padding: '2px 6px',
                                                            borderRadius: 4,
                                                            background: 'rgba(193, 127, 89, 0.15)',
                                                            color: 'var(--accent)',
                                                            fontWeight: 600,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 3
                                                        }}
                                                        title={rec.notes || 'Calculated from Belgaum Biometric Device'}
                                                    >
                                                        <Zap size={10} /> Biometric Synced
                                                    </span>
                                                )}
                                            </div>
                                            <span className="cell-secondary" style={{ textTransform: 'capitalize', fontSize: 12 }}>
                                                {staff.role}
                                            </span>
                                        </div>

                                        {/* Dynamic Shift Branch Selector (Interchange Support) */}
                                        <div className="attendance-interchange-control" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                                                Shift:
                                            </span>
                                            <select
                                                className="admin-filter-select"
                                                style={{ padding: '4px 8px', fontSize: 12, height: 'auto', minWidth: 115 }}
                                                value={currentShiftBranch}
                                                onChange={e => handleUpdateShiftBranch(staff, e.target.value)}
                                                title="Select which branch this staff member is working at today"
                                            >
                                                {SALON_BRANCHES.map(b => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                            </select>
                                            {isInterchanged && (
                                                <span
                                                    style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                                    title={`Interchanged from ${staff.branch} to ${currentShiftBranch}`}
                                                >
                                                    <ArrowRightLeft size={10} />
                                                    <span>Visiting</span>
                                                </span>
                                            )}
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

            {/* TAB 2: DAILY LOGS & ANY DAY HISTORY */}
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

                        {/* Shift Branch & Staff Filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Shift Branch:</label>
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

                            <select
                                className="admin-filter-select"
                                value={selectedStaffId}
                                onChange={e => setSelectedStaffId(e.target.value)}
                            >
                                <option value="all">All Staff Members</option>
                                {allStaff.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} (Base: {s.branch})
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
                                    <span>Add Record</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Belgaum Biometric Banner in History */}
                    {(selectedBranch === 'all' || selectedBranch.toLowerCase().includes('belg')) && (
                        <div style={{
                            marginBottom: 16,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: 'rgba(193, 127, 89, 0.07)',
                            border: '1px solid rgba(193, 127, 89, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 10
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Fingerprint size={16} style={{ color: 'var(--accent)' }} />
                                <span style={{ fontSize: 12, color: 'var(--text-bright)' }}>
                                    Belgaum Biometric Hardware: Calculate & sync First In and Last Out for <strong>{selectedDate}</strong>
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-secondary admin-btn-sm"
                                    onClick={() => setIsBiometricPunchesModalOpen(true)}
                                    style={{ fontSize: 11, padding: '4px 8px' }}
                                >
                                    <Clock size={11} /> View Raw Punches
                                </button>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-primary admin-btn-sm"
                                    onClick={handleSyncBiometric}
                                    disabled={isSyncingBiometric}
                                    style={{ fontSize: 11, padding: '4px 10px' }}
                                >
                                    <Zap size={11} /> {isSyncingBiometric ? 'Syncing...' : 'Calculate Day from Biometric'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Day Records Table */}
                    <div className="admin-table-wrapper" style={{ marginBottom: 0 }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Staff Member</th>
                                    <th>Shift Branch</th>
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
                                                        ? 'As Owner, you can record or backfill attendance, punch times, and shift branch for this day.'
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
                                        const isInterchanged = stf && stf.branch !== 'All Branches' && stf.branch !== r.branch

                                        return (
                                            <tr key={r.id}>
                                                <td className="cell-primary" style={{ fontWeight: 600 }}>
                                                    <div>{r.staffName}</div>
                                                    {stf && (
                                                        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 400 }}>
                                                            Base: {stf.branch}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="attendance-branch-pill" style={{ color: isInterchanged ? '#f59e0b' : undefined, borderColor: isInterchanged ? 'rgba(245, 158, 11, 0.3)' : undefined }}>
                                                        {r.branch}
                                                        {isInterchanged && (
                                                            <span title={`Visiting from ${stf?.branch}`} style={{ marginLeft: 4 }}>🔄</span>
                                                        )}
                                                    </span>
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
                                Shows cumulative attendance score and shift branch locations where staff served this month.
                            </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Shift Branch Filter:</label>
                            <select
                                className="admin-filter-select"
                                value={selectedBranch}
                                onChange={e => setSelectedBranch(e.target.value)}
                            >
                                <option value="all">All Salon Locations</option>
                                <option value="Bengaluru">Bengaluru</option>
                                <option value="Kalaburagi">Kalaburagi</option>
                                <option value="Belgaum">Belgaum</option>
                            </select>
                        </div>
                    </div>

                    <div className="admin-table-wrapper" style={{ marginBottom: 0 }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Staff Member</th>
                                    <th>Base Branch</th>
                                    <th>Role</th>
                                    <th>Shift Branches Worked</th>
                                    <th>Present</th>
                                    <th>Half Day</th>
                                    <th>Leave</th>
                                    <th>Absent</th>
                                    <th>Total Shifts</th>
                                    <th>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyAttendance.length === 0 ? (
                                    <tr>
                                        <td colSpan={10}>
                                            <div className="admin-empty" style={{ padding: 32 }}>
                                                <h3 style={{ fontSize: 14 }}>No staff records found for this filter</h3>
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
                                            <td>
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    {Object.entries(m.branchBreakdown).map(([bName, count]) => (
                                                        <span
                                                            key={bName}
                                                            style={{
                                                                fontSize: 10,
                                                                padding: '2px 6px',
                                                                borderRadius: 4,
                                                                background: 'var(--bg-card-alt)',
                                                                border: '1px solid var(--border-color)',
                                                                color: bName !== m.staff.branch ? '#f59e0b' : 'var(--text-secondary)'
                                                            }}
                                                        >
                                                            {bName}: <strong>{count}d</strong>
                                                        </span>
                                                    ))}
                                                    {Object.keys(m.branchBreakdown).length === 0 && '—'}
                                                </div>
                                            </td>
                                            <td className="cell-secondary">{m.present}</td>
                                            <td className="cell-secondary">{m.halfDay}</td>
                                            <td className="cell-secondary">{m.leave}</td>
                                            <td className="cell-secondary">{m.absent}</td>
                                            <td className="cell-secondary" style={{ fontWeight: 600 }}>{m.totalDays}</td>
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

            {/* Quick Visiting Staff Check-in Modal */}
            {isVisitingModalOpen && (
                <div className="admin-modal-overlay" onClick={() => setIsVisitingModalOpen(false)}>
                    <div className="admin-modal-card" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <UserPlus size={18} style={{ color: 'var(--accent)' }} />
                                <h3 style={{ margin: 0, fontSize: 16 }}>Check In Visiting Staff</h3>
                            </div>
                            <button className="admin-modal-close-btn" onClick={() => setIsVisitingModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '8px 0 16px' }}>
                            Staff members can interchange between branches. Select a staff member to check in at <strong>{todayBranchFilter}</strong> for today's shift.
                        </p>

                        <div style={{ marginBottom: 16 }}>
                            <label className="admin-form-label">Select Staff Member</label>
                            <select
                                className="admin-form-select"
                                value={visitingStaffId}
                                onChange={e => setVisitingStaffId(e.target.value)}
                            >
                                {visitingCandidates.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} (Base: {s.branch} · {s.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                onClick={() => setIsVisitingModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="admin-btn admin-btn-primary"
                                onClick={handleAddVisitingStaff}
                                disabled={!visitingStaffId}
                            >
                                Check In at {todayBranchFilter}
                            </button>
                        </div>
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

            <BiometricPunchesModal
                isOpen={isBiometricPunchesModalOpen}
                onClose={() => setIsBiometricPunchesModalOpen(false)}
                targetDate={activeTab === 'today' ? today : selectedDate}
                onAttendanceSynced={reloadData}
            />
        </div>
    )
}
