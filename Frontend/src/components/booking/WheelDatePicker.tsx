import { useEffect, useMemo, useRef } from 'react'
import './WheelDatePicker.css'

const ITEM_HEIGHT = 28
const VISIBLE_COUNT = 3
const PAD = Math.floor(VISIBLE_COUNT / 2) * ITEM_HEIGHT

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}

function toISO(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function clampDate(year: number, month: number, day: number, min: Date) {
    const lowMonth = year === min.getFullYear() ? min.getMonth() : 0
    const m = Math.max(month, lowMonth)
    const lowDay = (year === min.getFullYear() && m === min.getMonth()) ? min.getDate() : 1
    const dim = daysInMonth(year, m)
    const d = Math.min(Math.max(day, lowDay), dim)
    return new Date(year, m, d)
}

interface WheelColumnProps<T> {
    items: T[]
    selectedIndex: number
    onSelect: (index: number) => void
    renderItem: (item: T) => React.ReactNode
    ariaLabel: string
}

function WheelColumn<T>({ items, selectedIndex, onSelect, renderItem, ariaLabel }: WheelColumnProps<T>) {
    const ref = useRef<HTMLDivElement>(null)
    const isUserScrolling = useRef(false)
    const rafId = useRef<number | undefined>(undefined)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const target = selectedIndex * ITEM_HEIGHT
        if (Math.abs(el.scrollTop - target) > 1) {
            el.scrollTo({ top: target, behavior: isUserScrolling.current ? 'auto' : 'smooth' })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIndex, items.length])

    const handleScroll = () => {
        isUserScrolling.current = true
        if (rafId.current) cancelAnimationFrame(rafId.current)
        rafId.current = requestAnimationFrame(() => {
            const el = ref.current
            if (!el) return
            const idx = Math.round(el.scrollTop / ITEM_HEIGHT)
            const clamped = Math.max(0, Math.min(items.length - 1, idx))
            if (clamped !== selectedIndex) onSelect(clamped)
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp') { e.preventDefault(); onSelect(Math.max(0, selectedIndex - 1)) }
        if (e.key === 'ArrowDown') { e.preventDefault(); onSelect(Math.min(items.length - 1, selectedIndex + 1)) }
        if (e.key === 'Home') { e.preventDefault(); onSelect(0) }
        if (e.key === 'End') { e.preventDefault(); onSelect(items.length - 1) }
    }

    return (
        <div
            className="wheel-scroll"
            ref={ref}
            role="listbox"
            aria-label={ariaLabel}
            tabIndex={0}
            onScroll={handleScroll}
            onTouchEnd={() => { isUserScrolling.current = false }}
            onMouseUp={() => { isUserScrolling.current = false }}
            onKeyDown={handleKeyDown}
            style={{ paddingTop: PAD, paddingBottom: PAD }}
        >
            {items.map((item, i) => {
                const dist = Math.abs(i - selectedIndex)
                return (
                    <div
                        key={i}
                        role="option"
                        aria-selected={i === selectedIndex}
                        className={`wheel-item ${i === selectedIndex ? 'active' : ''}`}
                        style={{
                            height: ITEM_HEIGHT,
                            opacity: Math.max(0.22, 1 - dist * 0.38),
                            transform: `scale(${Math.max(0.72, 1 - dist * 0.14)})`,
                        }}
                        onClick={() => onSelect(i)}
                    >
                        {renderItem(item)}
                    </div>
                )
            })}
        </div>
    )
}

export default function WheelDatePicker({
    value, onChange, minDate,
}: {
    value: string
    onChange: (iso: string) => void
    minDate: string
}) {
    const min = useMemo(() => new Date(minDate + 'T00:00:00'), [minDate])

    useEffect(() => {
        if (!value) onChange(toISO(min))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const parsed = value ? new Date(value + 'T00:00:00') : min
    const year = parsed.getFullYear()
    const month = parsed.getMonth()
    const day = parsed.getDate()

    const years = [min.getFullYear(), min.getFullYear() + 1]

    const monthStart = year === min.getFullYear() ? min.getMonth() : 0
    const monthItems = MONTHS.map((label, i) => ({ label, i })).filter((m) => m.i >= monthStart)

    const dayStart = (year === min.getFullYear() && month === min.getMonth()) ? min.getDate() : 1
    const totalDays = daysInMonth(year, month)
    const dayItems = Array.from({ length: totalDays - dayStart + 1 }, (_, i) => dayStart + i)

    const dayIndex = Math.max(0, dayItems.indexOf(day))
    const monthIndex = Math.max(0, monthItems.findIndex((m) => m.i === month))
    const yearIndex = Math.max(0, years.indexOf(year))

    const commit = (y: number, m: number, d: number) => onChange(toISO(clampDate(y, m, d, min)))

    return (
        <div className="wheel-picker">
            <div className="wheel-labels">
                <span>Day</span>
                <span>Month</span>
                <span>Year</span>
            </div>
            <div className="wheel-picker-row">
                <div className="wheel-highlight-band" aria-hidden="true" />
                <WheelColumn
                    items={dayItems}
                    selectedIndex={dayIndex}
                    onSelect={(i) => commit(year, month, dayItems[i])}
                    renderItem={(d) => d}
                    ariaLabel="Day"
                />
                <WheelColumn
                    items={monthItems}
                    selectedIndex={monthIndex}
                    onSelect={(i) => commit(year, monthItems[i].i, day)}
                    renderItem={(m) => m.label}
                    ariaLabel="Month"
                />
                <WheelColumn
                    items={years}
                    selectedIndex={yearIndex}
                    onSelect={(i) => commit(years[i], month, day)}
                    renderItem={(y) => y}
                    ariaLabel="Year"
                />
            </div>
        </div>
    )
}
