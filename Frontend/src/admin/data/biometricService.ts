import { supabase } from '../../lib/supabase'
import type { AttendanceRawPunch, AttendanceRecord, StaffMember } from './types'
import { attendanceStore, staffStore } from './store'

export const BIOMETRIC_BRANCH_ID = 'branch_bgm'
export const BIOMETRIC_BRANCH_NAME = 'Belgaum'

const LOCAL_PUNCHES_KEY = 'cm_attendance_raw_punches'

// Helper to format ISO timestamp to "HH:MM AM/PM" or 24-hr time
export function formatPunchTime(isoString: string): string {
    try {
        const d = new Date(isoString)
        if (isNaN(d.getTime())) return isoString
        return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        })
    } catch {
        return isoString
    }
}

// Helper to get local YYYY-MM-DD date from ISO timestamp
export function getPunchDateStr(isoString: string): string {
    try {
        const d = new Date(isoString)
        if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0]
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    } catch {
        return new Date().toISOString().split('T')[0]
    }
}

// Calculate hours between two ISO timestamps
export function getDurationHours(startIso: string, endIso: string): number {
    try {
        const start = new Date(startIso).getTime()
        const end = new Date(endIso).getTime()
        if (end <= start) return 0
        return Number(((end - start) / (1000 * 60 * 60)).toFixed(2))
    } catch {
        return 0
    }
}

export interface StaffPunchSummary {
    staff: StaffMember
    biometricPin: number
    date: string
    punches: AttendanceRawPunch[]
    firstPunch: AttendanceRawPunch
    lastPunch?: AttendanceRawPunch
    punchInFormatted: string
    punchOutFormatted?: string
    workingHours: number
    suggestedStatus: AttendanceRecord['status']
}

export const biometricService = {
    // 1. Fetch raw punches from Supabase AttendanceRawPunch
    getRawPunches: async (): Promise<AttendanceRawPunch[]> => {
        const localPunches: AttendanceRawPunch[] = JSON.parse(localStorage.getItem(LOCAL_PUNCHES_KEY) || '[]')
        try {
            const { data, error } = await supabase
                .from('AttendanceRawPunch')
                .select('*')
                .order('punchTime', { ascending: false })

            if (!error && data) {
                // Merge remote + local test punches
                const remoteIds = new Set(data.map((p: any) => p.id))
                const merged: AttendanceRawPunch[] = [
                    ...data.map((p: any) => ({
                        id: String(p.id),
                        biometricPin: Number(p.biometricPin),
                        punchTime: p.punchTime,
                        punchStatus: p.punchStatus,
                        receivedAt: p.receivedAt || p.punchTime,
                    })),
                    ...localPunches.filter(lp => !remoteIds.has(lp.id)),
                ]
                return merged
            }
        } catch (err) {
            console.error('Failed to query AttendanceRawPunch:', err)
        }
        return localPunches
    },

    // 2. Record or simulate a punch from device
    recordPunch: async (biometricPin: number, punchTime?: string, punchStatus: string = '0'): Promise<AttendanceRawPunch> => {
        const nowIso = punchTime || new Date().toISOString()
        const newPunch: AttendanceRawPunch = {
            id: `raw-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            biometricPin,
            punchTime: nowIso,
            punchStatus,
            receivedAt: nowIso,
        }

        // Try Supabase insert
        try {
            const { data, error } = await supabase
                .from('AttendanceRawPunch')
                .insert({
                    biometricPin: newPunch.biometricPin,
                    punchTime: newPunch.punchTime,
                    punchStatus: newPunch.punchStatus,
                    receivedAt: newPunch.receivedAt,
                })
                .select()
                .maybeSingle()

            if (!error && data) {
                newPunch.id = String(data.id)
            }
        } catch {
            // Buffer locally
        }

        // Cache locally
        const list: AttendanceRawPunch[] = JSON.parse(localStorage.getItem(LOCAL_PUNCHES_KEY) || '[]')
        list.unshift(newPunch)
        localStorage.setItem(LOCAL_PUNCHES_KEY, JSON.stringify(list.slice(0, 300)))

        return newPunch
    },

    // 3. Clear raw punches buffer (for testing or reset)
    clearLocalPunches: () => {
        localStorage.removeItem(LOCAL_PUNCHES_KEY)
    },

    // 4. Calculate First and Last punch in/out per staff on a given date
    calculateDailySummaries: (
        punches: AttendanceRawPunch[],
        staffList: StaffMember[],
        targetDate: string = new Date().toISOString().split('T')[0]
    ): StaffPunchSummary[] => {
        // Map PIN -> Staff
        const pinToStaff = new Map<number, StaffMember>()
        staffList.forEach(s => {
            if (s.biometricPin != null && s.biometricPin > 0) {
                pinToStaff.set(Number(s.biometricPin), s)
            }
        })

        // Filter punches for targetDate
        const dayPunches = punches.filter(p => getPunchDateStr(p.punchTime) === targetDate)

        // Group by biometricPin
        const punchesByPin = new Map<number, AttendanceRawPunch[]>()
        dayPunches.forEach(p => {
            const pin = Number(p.biometricPin)
            if (!punchesByPin.has(pin)) punchesByPin.set(pin, [])
            punchesByPin.get(pin)!.push(p)
        })

        const summaries: StaffPunchSummary[] = []

        punchesByPin.forEach((pinPunches, pin) => {
            const staff = pinToStaff.get(pin)
            if (!staff) return // Unmapped PIN

            // Sort ascending by time
            const sorted = [...pinPunches].sort(
                (a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime()
            )

            const firstPunch = sorted[0]
            const lastPunch = sorted.length > 1 ? sorted[sorted.length - 1] : undefined

            const punchInFormatted = formatPunchTime(firstPunch.punchTime)
            const punchOutFormatted = lastPunch ? formatPunchTime(lastPunch.punchTime) : undefined

            const workingHours = lastPunch ? getDurationHours(firstPunch.punchTime, lastPunch.punchTime) : 0

            // Determine suggested attendance status
            let suggestedStatus: AttendanceRecord['status'] = 'present'
            if (lastPunch) {
                if (workingHours >= 7.5) {
                    suggestedStatus = 'present'
                } else if (workingHours >= 4.0) {
                    suggestedStatus = 'half-day'
                } else {
                    suggestedStatus = 'half-day'
                }
            } else {
                suggestedStatus = 'present' // Punched in, active shift
            }

            summaries.push({
                staff,
                biometricPin: pin,
                date: targetDate,
                punches: sorted,
                firstPunch,
                lastPunch,
                punchInFormatted,
                punchOutFormatted,
                workingHours,
                suggestedStatus,
            })
        })

        return summaries
    },

    // 5. Sync and calculate into existing Attendance records for Belgaum branch
    syncToAttendanceTable: async (targetDate: string = new Date().toISOString().split('T')[0]): Promise<{
        syncedCount: number
        summaries: StaffPunchSummary[]
    }> => {
        const [punches, allStaff] = await Promise.all([
            biometricService.getRawPunches(),
            staffStore.getAll(),
        ])

        const activeBelgaumStaff = allStaff.filter(
            s => s.isActive && (s.branch === 'Belgaum' || s.branchId === BIOMETRIC_BRANCH_ID || s.biometricPin != null)
        )

        const summaries = biometricService.calculateDailySummaries(punches, activeBelgaumStaff, targetDate)

        let syncedCount = 0

        for (const summary of summaries) {
            try {
                const notes = `Biometric Device (PIN ${summary.biometricPin}) • First: ${summary.punchInFormatted}${
                    summary.punchOutFormatted ? ` • Last: ${summary.punchOutFormatted} (${summary.workingHours} hrs)` : ' • Shift In-Progress'
                }`

                await attendanceStore.mark(
                    summary.staff.id,
                    summary.staff.name,
                    'Belgaum',
                    targetDate,
                    summary.suggestedStatus,
                    {
                        punchIn: summary.punchInFormatted,
                        punchOut: summary.punchOutFormatted,
                        notes,
                        updatedBy: 'biometric-system',
                    }
                )
                syncedCount++
            } catch (err) {
                console.error(`Error saving attendance for staff ${summary.staff.name}:`, err)
            }
        }

        return { syncedCount, summaries }
    },
}
