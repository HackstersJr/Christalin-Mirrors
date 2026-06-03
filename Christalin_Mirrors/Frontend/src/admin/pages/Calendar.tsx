import { useEffect, useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { appointmentStore } from '../data/store'
import type { Appointment } from '../data/types'
import '../AdminShared.css'
import './Calendar.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    useEffect(() => { setAppointments(appointmentStore.getAll()) }, [])

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const calendarDays = useMemo(() => {
        const days: (number | null)[] = []
        for (let i = 0; i < firstDay; i++) days.push(null)
        for (let i = 1; i <= daysInMonth; i++) days.push(i)
        return days
    }, [firstDay, daysInMonth])

    const getDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    const aptsByDate = useMemo(() => {
        const map: Record<string, Appointment[]> = {}
        appointments.forEach(a => {
            if (!map[a.date]) map[a.date] = []
            map[a.date].push(a)
        })
        return map
    }, [appointments])

    const prev = () => setCurrentDate(new Date(year, month - 1, 1))
    const next = () => setCurrentDate(new Date(year, month + 1, 1))
    const today = new Date().toISOString().split('T')[0]

    const selectedApts = selectedDate ? (aptsByDate[selectedDate] || []).sort((a, b) => a.time.localeCompare(b.time)) : []

    return (
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Calendar</h1>
                <p className="admin-page-sub">Monthly view of appointments</p>
            </div>

            <div className="calendar-layout">
                {/* Calendar Grid */}
                <div className="admin-form-card" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <button className="admin-btn admin-btn-ghost" onClick={prev}><ChevronLeft size={18} /></button>
                        <h3 style={{ margin: 0, fontSize: 16 }}>
                            {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button className="admin-btn admin-btn-ghost" onClick={next}><ChevronRight size={18} /></button>
                    </div>

                    {/* Day Headers */}
                    <div className="calendar-day-headers">
                        {DAYS.map(d => (
                            <div key={d} className="calendar-day-header">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Date Cells */}
                    <div className="calendar-grid">
                        {calendarDays.map((day, i) => {
                            if (day === null) return <div key={`e-${i}`} />
                            const dateStr = getDateStr(day)
                            const dayApts = aptsByDate[dateStr] || []
                            const isToday = dateStr === today
                            const isSelected = dateStr === selectedDate
                            const pending = dayApts.filter(a => a.status === 'pending').length
                            const confirmed = dayApts.filter(a => a.status === 'confirmed').length

                            return (
                                <div
                                    key={day}
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={`calendar-cell${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}`}
                                >
                                    <div className="calendar-day-number">
                                        {day}
                                    </div>
                                    {dayApts.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {confirmed > 0 && <div className="calendar-apt-tag confirmed">{confirmed} confirmed</div>}
                                            {pending > 0 && <div className="calendar-apt-tag pending">{pending} pending</div>}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Day Detail */}
                <div className="admin-form-card" style={{ marginBottom: 0, alignSelf: 'start' }}>
                    <h3 style={{ marginBottom: 16, fontSize: 14 }}>
                        {selectedDate
                            ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
                            : 'Select a date'}
                    </h3>

                    {!selectedDate ? (
                        <div className="admin-empty" style={{ padding: 24 }}>
                            <p style={{ fontSize: 13 }}>Click on a date to see appointments</p>
                        </div>
                    ) : selectedApts.length === 0 ? (
                        <div className="admin-empty" style={{ padding: 24 }}>
                            <h3>No appointments</h3>
                            <p style={{ fontSize: 13 }}>This day is free</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {selectedApts.map(apt => (
                                <div key={apt.id} className="calendar-apt-card" style={{
                                    borderLeft: `3px solid ${apt.status === 'confirmed' ? 'var(--success-light)' : apt.status === 'pending' ? 'var(--warning-light)' : apt.status === 'completed' ? 'var(--info)' : 'var(--danger)'}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{apt.clientName}</span>
                                        <span className={`status-badge ${apt.status}`}>{apt.status}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                                        <Clock size={11} /> {apt.time}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{apt.service}</div>
                                    {apt.stylist && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>with {apt.stylist}</div>}
                                    {apt.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>📝 {apt.notes}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
