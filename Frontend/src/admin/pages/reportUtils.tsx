import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// Shared date/trend helpers for the printable filed reports (Reports,
// Daily Sales Report, P&L Statement) — kept in one place so "vs. previous
// period" math and formatting stay consistent across all three.

export function pad(n: number) { return String(n).padStart(2, '0') }
export function toIso(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
export function todayIso() { return toIso(new Date()) }

export function addDays(iso: string, n: number) {
    const d = new Date(iso + 'T00:00:00')
    d.setDate(d.getDate() + n)
    return toIso(d)
}

export function monthKeyOf(iso: string) { return iso.slice(0, 7) }

export function shiftMonth(monthKey: string, dir: 1 | -1) {
    const [y, m] = monthKey.split('-').map(Number)
    const d = new Date(y, m - 1 + dir, 1)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function monthLabel(monthKey: string) {
    const [y, m] = monthKey.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function computeTrend(curr: number, prev: number): { label: string; dir: 'up' | 'down' | 'flat' } {
    if (prev === 0) {
        if (curr === 0) return { label: '0%', dir: 'flat' }
        return { label: 'New', dir: 'up' }
    }
    const pct = ((curr - prev) / prev) * 100
    const dir = pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat'
    return { label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, dir }
}

export function Trend({ curr, prev }: { curr: number; prev: number }) {
    const t = computeTrend(curr, prev)
    const Icon = t.dir === 'up' ? TrendingUp : t.dir === 'down' ? TrendingDown : Minus
    return (
        <span className={`report-trend report-trend-${t.dir}`}>
            <Icon size={12} /> {t.label}
        </span>
    )
}
