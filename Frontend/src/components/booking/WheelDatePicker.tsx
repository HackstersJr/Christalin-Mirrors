import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import './WheelDatePicker.css'

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toISO(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseISO(iso: string): { year: number; month: number; day: number } | null {
    if (!iso) return null
    const parts = iso.split('-').map(Number)
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return { year: parts[0], month: parts[1] - 1, day: parts[2] }
    }
    return null
}

export default function WheelDatePicker({
    value,
    onChange,
    minDate,
}: {
    value: string
    onChange: (iso: string) => void
    minDate: string
}) {
    const minObj = useMemo(() => {
        const p = parseISO(minDate)
        if (p) return p
        const today = new Date()
        return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() }
    }, [minDate])

    const minISO = useMemo(() => toISO(minObj.year, minObj.month, minObj.day), [minObj])

    const parsedVal = useMemo(() => parseISO(value) || minObj, [value, minObj])

    // Current month view state
    const [viewYear, setViewYear] = useState(parsedVal.year)
    const [viewMonth, setViewMonth] = useState(parsedVal.month)

    useEffect(() => {
        if (!value) {
            onChange(minISO)
        }
    }, [])

    useEffect(() => {
        if (parsedVal) {
            setViewYear(parsedVal.year)
            setViewMonth(parsedVal.month)
        }
    }, [value])

    // Quick chips calculations
    const todayISO = useMemo(() => {
        const d = new Date()
        return toISO(d.getFullYear(), d.getMonth(), d.getDate())
    }, [])

    const tomorrowISO = useMemo(() => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        return toISO(d.getFullYear(), d.getMonth(), d.getDate())
    }, [])

    const saturdayISO = useMemo(() => {
        const d = new Date()
        const day = d.getDay()
        const diff = day === 6 ? 7 : (6 - day)
        d.setDate(d.getDate() + diff)
        return toISO(d.getFullYear(), d.getMonth(), d.getDate())
    }, [])

    // Calendar grid calculations
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    const canGoPrev = useMemo(() => {
        if (viewYear > minObj.year) return true
        if (viewYear === minObj.year && viewMonth > minObj.month) return true
        return false
    }, [viewYear, viewMonth, minObj])

    const handlePrevMonth = () => {
        if (!canGoPrev) return
        if (viewMonth === 0) {
            setViewMonth(11)
            setViewYear(viewYear - 1)
        } else {
            setViewMonth(viewMonth - 1)
        }
    }

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0)
            setViewYear(viewYear + 1)
        } else {
            setViewMonth(viewMonth + 1)
        }
    }

    const isDayDisabled = (day: number) => {
        const currentIso = toISO(viewYear, viewMonth, day)
        return currentIso < minISO
    }

    const handleSelectDay = (day: number) => {
        const selectedIso = toISO(viewYear, viewMonth, day)
        if (selectedIso < minISO) return
        onChange(selectedIso)
    }

    return (
        <div className="booking-datepicker-wrapper">
            {/* Quick Choice Chips */}
            <div className="booking-quick-chips">
                <button
                    type="button"
                    className={`booking-chip ${value === todayISO ? 'selected' : ''}`}
                    onClick={() => onChange(todayISO)}
                >
                    Today
                </button>
                <button
                    type="button"
                    className={`booking-chip ${value === tomorrowISO ? 'selected' : ''}`}
                    onClick={() => onChange(tomorrowISO)}
                >
                    Tomorrow
                </button>
                <button
                    type="button"
                    className={`booking-chip ${value === saturdayISO ? 'selected' : ''}`}
                    onClick={() => onChange(saturdayISO)}
                >
                    This Saturday
                </button>
            </div>

            {/* Interactive Calendar Card */}
            <div className="booking-calendar-card">
                {/* Header */}
                <div className="booking-calendar-header">
                    <button
                        type="button"
                        className="booking-calendar-nav"
                        onClick={handlePrevMonth}
                        disabled={!canGoPrev}
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="booking-calendar-title">
                        {MONTH_NAMES[viewMonth]} {viewYear}
                    </div>
                    <button
                        type="button"
                        className="booking-calendar-nav"
                        onClick={handleNextMonth}
                        aria-label="Next month"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Weekday Labels */}
                <div className="booking-calendar-weekdays">
                    {WEEKDAY_NAMES.map((w) => (
                        <div key={w} className="booking-calendar-weekday">
                            {w}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="booking-calendar-days">
                    {/* Padding cells */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="booking-calendar-empty" />
                    ))}

                    {/* Day cells */}
                    {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                        const dayNum = i + 1
                        const cellIso = toISO(viewYear, viewMonth, dayNum)
                        const isSelected = value === cellIso
                        const isToday = cellIso === todayISO
                        const disabled = isDayDisabled(dayNum)

                        return (
                            <button
                                key={dayNum}
                                type="button"
                                className={`booking-calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'is-today' : ''}`}
                                disabled={disabled}
                                onClick={() => handleSelectDay(dayNum)}
                            >
                                {dayNum}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Direct Native Input Fallback */}
            <div className="booking-native-date">
                <CalendarIcon size={14} style={{ color: 'var(--text-muted)' }} />
                <input
                    type="date"
                    className="booking-native-input"
                    value={value || minISO}
                    min={minISO}
                    onChange={(e) => {
                        if (e.target.value) onChange(e.target.value)
                    }}
                />
            </div>
        </div>
    )
}
