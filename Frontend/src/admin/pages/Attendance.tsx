import { useEffect, useState } from 'react'
import { UserCheck } from 'lucide-react'
import { staffStore, attendanceStore } from '../data/store'
import { authStore, getBranchScope, scopeByBranch } from '../data/authStore'
import type { AttendanceRecord, StaffMember } from '../data/types'
import '../AdminShared.css'
import './Attendance.css'

const ATTENDANCE_LABELS: Record<AttendanceRecord['status'], string> = {
    present: 'P', absent: 'A', 'half-day': 'H', leave: 'L',
}

export default function Attendance() {
    const session = authStore.getSession()
    const branchScope = getBranchScope()
    const today = new Date().toISOString().split('T')[0]
    const thisMonthPrefix = today.slice(0, 7)

    const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
    const [branchStaff, setBranchStaff] = useState<StaffMember[]>([])

    useEffect(() => {
        setAttendance(attendanceStore.getAll())
        setBranchStaff(scopeByBranch(staffStore.getAll().filter(s => s.isActive)))
    }, [])

    const markAttendance = (staff: StaffMember, status: AttendanceRecord['status']) => {
        attendanceStore.mark(staff.id, staff.name, staff.branch, today, status)
        setAttendance(attendanceStore.getAll())
    }

    const todayAttendanceByStaff = new Map(
        attendance.filter(a => a.date === today).map(a => [a.staffId, a.status])
    )

    const monthlyAttendance = branchStaff.map(staff => {
        const records = attendance.filter(a => a.staffId === staff.id && a.date.startsWith(thisMonthPrefix))
        const present = records.filter(r => r.status === 'present').length
        const halfDay = records.filter(r => r.status === 'half-day').length
        const leave = records.filter(r => r.status === 'leave').length
        const absent = records.filter(r => r.status === 'absent').length
        const totalDays = records.length
        const attendancePercent = totalDays > 0 ? Math.round(((present + halfDay * 0.5) / totalDays) * 100) : 0
        return { staff, present, halfDay, leave, absent, totalDays, attendancePercent }
    })

    return (
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Staff Attendance</h1>
                <p className="admin-page-sub">
                    {branchScope ? `Tracking attendance for the ${branchScope} branch` : 'Tracking attendance across all branches'}
                </p>
            </div>

            <div className="admin-form-card" style={{ marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserCheck size={15} /> Today — {new Date(today + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '4px 0 16px' }}>
                    Mark each team member's status for today.
                </p>

                {branchStaff.length === 0 ? (
                    <div className="admin-empty" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 14 }}>No active staff{session?.role === 'owner' ? '' : ' at this branch'}</h3>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {branchStaff.map(staff => {
                            const currentStatus = todayAttendanceByStaff.get(staff.id)
                            return (
                                <div key={staff.id} className="attendance-row">
                                    <div className="attendance-staff">
                                        <span className="cell-primary" style={{ fontSize: 13 }}>{staff.name}</span>
                                        <span className="cell-secondary" style={{ textTransform: 'capitalize' }}>{staff.role} · {staff.branch}</span>
                                    </div>
                                    <div className="attendance-toggles">
                                        {(['present', 'half-day', 'leave', 'absent'] as const).map(status => (
                                            <button
                                                key={status}
                                                className={`attendance-toggle attendance-${status} ${currentStatus === status ? 'active' : ''}`}
                                                title={status.replace('-', ' ')}
                                                onClick={() => markAttendance(staff, status)}
                                            >
                                                {ATTENDANCE_LABELS[status]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="admin-form-card">
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>
                    Monthly Attendance — {new Date(today + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long' })}
                </h3>
                <div className="admin-table-wrapper" style={{ marginBottom: 0 }}>
                    <table className="admin-table">
                        <thead><tr><th>Staff</th><th>Present</th><th>Half Day</th><th>Leave</th><th>Absent</th><th>Attendance</th></tr></thead>
                        <tbody>
                            {monthlyAttendance.length === 0 ? (
                                <tr><td colSpan={6}>
                                    <div className="admin-empty" style={{ padding: 32 }}>
                                        <h3 style={{ fontSize: 14 }}>No attendance data yet</h3>
                                    </div>
                                </td></tr>
                            ) : monthlyAttendance.map(m => (
                                <tr key={m.staff.id}>
                                    <td className="cell-primary" style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{m.staff.name}</td>
                                    <td className="cell-secondary">{m.present}</td>
                                    <td className="cell-secondary">{m.halfDay}</td>
                                    <td className="cell-secondary">{m.leave}</td>
                                    <td className="cell-secondary">{m.absent}</td>
                                    <td>
                                        <span className={`status-badge ${m.attendancePercent >= 90 ? 'confirmed' : m.attendancePercent >= 75 ? 'pending' : 'cancelled'}`}>
                                            {m.attendancePercent}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
