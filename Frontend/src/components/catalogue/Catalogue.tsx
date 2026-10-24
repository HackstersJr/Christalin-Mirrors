import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, WheelEvent } from 'react'
import { FLAT, GROUPS, formatPrice } from './data'
import { ICONS } from './icons'
import logo from './logo.png'
import './Catalogue.css'

type Phase = 'in' | 'out' | 'pre'
type Axis = 'x' | 'y' | null

interface Gesture {
    x: number; y: number; t: number
    axis: Axis
    inIll: boolean
    held: boolean
    lx: number; ly: number; lt: number
    v: number
}

const BG_A = [[0, 0], [30, 18], [12, 46], [-8, 10], [26, -4], [6, 30]]
const BG_B = [[0, 0], [-24, -20], [-6, 18], [-30, -34], [-12, 24], [-26, -8]]
const BG_C = [[0, 0], [20, -24], [36, -8], [8, -40], [-14, -18], [30, -30]]

function phase(ph: Phase) {
    if (ph === 'out') return { op: 0, y: -6, tr: 'opacity .22s ease, transform .22s ease' }
    if (ph === 'pre') return { op: 0, y: 10, tr: 'none' }
    return { op: 1, y: 0, tr: 'opacity .8s ease, transform .8s cubic-bezier(.22,.8,.2,1)' }
}

export default function Catalogue() {
    const [gi, setGi] = useState(0)
    const [mem, setMem] = useState<number[]>(() => GROUPS.map(() => 0))
    const [shown, setShown] = useState({ g: 0, s: 0 })
    const [topPh, setTopPh] = useState<Phase>('in')
    const [botPh, setBotPh] = useState<Phase>('in')
    const [drag, setDrag] = useState({ on: false, axis: null as Axis, dx: 0, dy: 0 })
    const [holding, setHolding] = useState(false)
    const [sel, setSel] = useState<Record<string, true>>({})
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<'detail' | 'summary'>('detail')
    const [hintGone, setHintGone] = useState(false)

    const gesture = useRef<Gesture | null>(null)
    const timers = useRef<{ t1?: number; t2?: number; h1?: number; h2?: number }>({})
    const wheelAt = useRef(0)
    const live = useRef({ gi, mem, open })
    live.current = { gi, mem, open }

    useEffect(() => {
        const prev = document.title
        document.title = 'Service Catalogue | Christalin Mirrors'
        return () => {
            document.title = prev
            Object.values(timers.current).forEach(t => clearTimeout(t))
        }
    }, [])

    const active = FLAT.find(f => f.gi === gi && f.si === mem[gi])!
    const selected = FLAT.filter(f => sel[f.id])
    const total = selected.reduce((a, f) => a + f.priceN, 0)
    const isSel = !!sel[active.id]

    const go = (gi2: number, si2: number) => {
        const { gi: g0, mem: m0 } = live.current
        if (gi2 === g0 && si2 === m0[gi2]) return
        const gChanged = gi2 !== g0
        const next = m0.slice()
        next[gi2] = si2
        clearTimeout(timers.current.t1)
        clearTimeout(timers.current.t2)
        setGi(gi2)
        setMem(next)
        setBotPh('out')
        if (gChanged) setTopPh('out')
        setHintGone(true)
        timers.current.t1 = window.setTimeout(() => {
            setShown({ g: gi2, s: si2 })
            setBotPh('pre')
            setTopPh(gChanged ? 'pre' : 'in')
            timers.current.t2 = window.setTimeout(() => {
                setBotPh('in')
                setTopPh('in')
            }, 40)
        }, 240)
    }

    const stepSvc = (dir: number) => {
        const { gi: g0, mem: m0 } = live.current
        const n = GROUPS[g0].items.length
        go(g0, Math.max(0, Math.min(n - 1, m0[g0] + dir)))
    }

    const stepGrp = (dir: number) => {
        const { gi: g0, mem: m0 } = live.current
        const g2 = Math.max(0, Math.min(GROUPS.length - 1, g0 + dir))
        go(g2, m0[g2])
    }

    const toggleSelection = () => {
        const { gi: g0, mem: m0 } = live.current
        const id = `${g0}-${m0[g0]}`
        setSel(s => {
            const n = { ...s }
            if (n[id]) delete n[id]
            else n[id] = true
            return n
        })
    }

    const openDetail = () => { setMode('detail'); setOpen(true); setHintGone(true) }

    const onDown = (e: PointerEvent) => {
        if (live.current.open) return
        const t = e.target as HTMLElement
        const inIll = !!t.closest?.('[data-ill]')
        const now = Date.now()
        gesture.current = { x: e.clientX, y: e.clientY, t: now, axis: null, inIll, held: false, lx: e.clientX, ly: e.clientY, lt: now, v: 0 }
        clearTimeout(timers.current.h1)
        clearTimeout(timers.current.h2)
        if (inIll) {
            timers.current.h1 = window.setTimeout(() => {
                if (gesture.current && !gesture.current.axis) setHolding(true)
            }, 140)
            timers.current.h2 = window.setTimeout(() => {
                const g = gesture.current
                if (g && !g.axis) {
                    g.held = true
                    toggleSelection()
                    setHolding(false)
                    try { navigator.vibrate?.(18) } catch { /* unsupported */ }
                }
            }, 790)
        }
    }

    const onMove = (e: PointerEvent) => {
        const g = gesture.current
        if (!g) return
        const dx = e.clientX - g.x
        const dy = e.clientY - g.y
        if (!g.axis) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) <= 9) return
            if (g.held) return
            g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
            clearTimeout(timers.current.h1)
            clearTimeout(timers.current.h2)
            setHolding(false)
            setHintGone(true)
        }
        const { gi: g0, mem: m0 } = live.current
        let d = g.axis === 'x' ? dx : dy
        const now = Date.now()
        const pos = g.axis === 'x' ? e.clientX : e.clientY
        const last = g.axis === 'x' ? g.lx : g.ly
        if (now > g.lt) g.v = (pos - last) / (now - g.lt)
        g.lx = e.clientX; g.ly = e.clientY; g.lt = now
        if (g.axis === 'x') {
            const n = GROUPS[g0].items.length
            if ((d > 0 && m0[g0] === 0) || (d < 0 && m0[g0] === n - 1)) d *= 0.3
        } else if ((d > 0 && g0 === 0) || (d < 0 && g0 === GROUPS.length - 1)) {
            d *= 0.3
        }
        setDrag({ on: true, axis: g.axis, dx: g.axis === 'x' ? d : 0, dy: g.axis === 'y' ? d : 0 })
    }

    const onEnd = (e: PointerEvent) => {
        const g = gesture.current
        if (!g) return
        gesture.current = null
        clearTimeout(timers.current.h1)
        clearTimeout(timers.current.h2)
        if (g.held) { setHolding(false); return }
        if (!g.axis) {
            setHolding(false)
            if (g.inIll && e.type === 'pointerup' && Date.now() - g.t < 780) openDetail()
            return
        }
        const d = g.axis === 'x' ? e.clientX - g.x : e.clientY - g.y
        const commit = Math.abs(d) > 70 || Math.abs(g.v) > 0.45
        const dir = (d < 0 || (Math.abs(d) <= 70 && g.v < 0)) ? 1 : -1
        setDrag({ on: false, axis: null, dx: 0, dy: 0 })
        if (commit) {
            if (g.axis === 'x') stepSvc(dir)
            else stepGrp(dir)
        }
    }

    const onWheel = (e: WheelEvent) => {
        if (live.current.open) return
        const now = Date.now()
        if (now - wheelAt.current < 700) return
        const ax = Math.abs(e.deltaX)
        const ay = Math.abs(e.deltaY)
        if (Math.max(ax, ay) < 24) return
        wheelAt.current = now
        if (ay >= ax) stepGrp(e.deltaY > 0 ? 1 : -1)
        else stepSvc(e.deltaX > 0 ? 1 : -1)
    }

    const onKey = (e: KeyboardEvent) => {
        const move: Record<string, () => void> = {
            ArrowLeft: () => stepSvc(-1),
            ArrowRight: () => stepSvc(1),
            ArrowUp: () => stepGrp(-1),
            ArrowDown: () => stepGrp(1),
        }
        const fn = move[e.key]
        if (fn) { e.preventDefault(); fn() }
    }

    const dx = drag.on && drag.axis === 'x' ? drag.dx : 0
    const dy = drag.on && drag.axis === 'y' ? drag.dy : 0

    const shownItem = FLAT.find(f => f.gi === shown.g && f.si === shown.s)!
    const p = drag.on ? Math.min(1, Math.max(Math.abs(drag.dx), Math.abs(drag.dy)) / 170) : 0
    const top = phase(topPh)
    const bot = phase(botPh)

    const bg = (arr: number[][]) => {
        const v = arr[gi % 6]
        return `translate(${v[0]}%, ${v[1]}%)`
    }

    return (
        <div className="cat-root">
            <div className="cat-bg" aria-hidden="true">
                <div className="cat-bg-a" style={{ transform: bg(BG_A) }}><div className="cat-blob cat-blob-a" /></div>
                <div className="cat-bg-b" style={{ transform: bg(BG_B) }}><div className="cat-blob cat-blob-b" /></div>
                <div className="cat-bg-c" style={{ transform: bg(BG_C) }}><div className="cat-blob cat-blob-c" /></div>
            </div>

            <div
                className="cat-stage"
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onEnd}
                onPointerCancel={onEnd}
                onPointerLeave={onEnd}
                onWheel={onWheel}
            >
                {FLAT.map(f => {
                    const X = f.si - mem[f.gi]
                    const Y = f.gi - gi
                    const dxe = f.gi === gi ? dx : 0
                    const Xf = X + dxe / 230
                    const Yf = Y + dy / 720
                    const ax = Math.abs(Xf)
                    const ay = Math.abs(Yf)
                    const opX = ax <= 1 ? 1 - ax * 0.55 : Math.max(0, 0.45 - (ax - 1) * 0.45)
                    const opY = Math.max(0, 1 - ay * 1.1)
                    const sc = (1 - Math.min(ax, 2) * 0.26) * (1 - Math.min(ay, 1) * 0.14)
                    const rot = -Math.max(-1, Math.min(1, Xf)) * 38
                    const isActive = f.gi === gi && X === 0
                    const hold = isActive && holding
                    const picked = !!sel[f.id]
                    return (
                        <div
                            key={f.id}
                            className="cat-slide"
                            style={{
                                transform: `translate3d(calc(${X} * min(62%, 46vh) + ${dxe}px), calc(${Y * 100}% + ${dy}px), 0) rotateY(${rot}deg) scale(${sc})`,
                                transition: drag.on ? 'none' : 'transform .75s cubic-bezier(.22,.8,.2,1)',
                            }}
                        >
                            <button
                                data-ill="1"
                                className="cat-card"
                                aria-label={`${f.name}, ${f.price}. Press Enter for details.`}
                                tabIndex={isActive ? 0 : -1}
                                onClick={e => { if (e.detail === 0) openDetail() }}
                                onKeyDown={onKey}
                                style={{
                                    borderColor: picked ? '#9B7B5E' : 'rgba(255,255,255,0.8)',
                                    pointerEvents: isActive ? 'auto' : 'none',
                                    opacity: opX * opY,
                                    transition: drag.on ? 'none' : 'opacity .75s ease, border-color .5s ease',
                                }}
                            >
                                <span className="cat-card-sheen" aria-hidden="true" />
                                <svg className="cat-card-outline" viewBox="0 0 80 100" preserveAspectRatio="none" aria-hidden="true">
                                    <rect
                                        x="0.5" y="0.5" width="79" height="99" rx="13.6" fill="none" stroke="#8A6B50"
                                        strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke"
                                        pathLength={100} strokeDasharray={100}
                                        style={{
                                            strokeDashoffset: hold ? 0 : 100,
                                            transition: hold ? 'stroke-dashoffset .65s linear' : 'stroke-dashoffset .25s ease',
                                        }}
                                    />
                                </svg>
                                <svg className="cat-card-icon" viewBox="0 0 120 120" aria-hidden="true">
                                    <g
                                        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                                        dangerouslySetInnerHTML={{ __html: ICONS[f.icon] }}
                                    />
                                </svg>
                                {picked && (
                                    <span className="cat-card-check" aria-hidden="true">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FAF6F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M2.5 7.5 L5.8 10.5 L11.5 3.8" />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        </div>
                    )
                })}
            </div>

            <div className="cat-top">
                <img className="cat-logo" src={logo} alt="Christalin Mirrors" />
                <div
                    className="cat-top-title"
                    style={{ opacity: top.op * (1 - 0.6 * p), transform: `translateY(${top.y}px)`, transition: drag.on ? 'none' : top.tr }}
                >
                    <h1>{GROUPS[shown.g].name}</h1>
                </div>
            </div>

            {selected.length > 0 && (
                <button
                    className="cat-selpill"
                    aria-label={`${selected.length} selected. View selection.`}
                    onClick={() => { setMode('summary'); setOpen(true) }}
                >
                    {selected.length} selected
                </button>
            )}

            <div className="cat-groupdots" aria-hidden="true">
                {GROUPS.map((_, i) => (
                    <div key={i} style={{ height: i === gi ? 24 : 6, background: i === gi ? '#9B7B5E' : 'rgba(111,95,82,0.4)' }} />
                ))}
            </div>

            <div className="cat-bottom">
                <div className="cat-info">
                    <div className="cat-svcdots" aria-hidden="true">
                        {GROUPS[gi].items.map((_, i) => (
                            <div key={i} style={{ width: i === mem[gi] ? 22 : 6, background: i === mem[gi] ? '#9B7B5E' : 'rgba(111,95,82,0.4)' }} />
                        ))}
                    </div>
                    <div
                        className="cat-info-text"
                        style={{ opacity: bot.op * (1 - 0.6 * p), transform: `translateY(${bot.y}px)`, transition: drag.on ? 'none' : bot.tr }}
                    >
                        <h2>{shownItem.name}</h2>
                        <div className="cat-info-meta">
                            <span className="cat-price">{shownItem.price}</span>
                            <span className="cat-time">{shownItem.time}</span>
                        </div>
                    </div>
                </div>
                <p className="cat-hint">
                    {!hintGone
                        ? 'Swipe up or down for collections, sideways for services'
                        : isSel ? 'Selected. Hold to remove' : 'Tap for details. Hold to select'}
                </p>
            </div>

            <button
                className="cat-backdrop"
                aria-label="Close"
                tabIndex={-1}
                onClick={() => setOpen(false)}
                style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
            />

            <div
                className="cat-sheet"
                role="dialog"
                aria-modal="true"
                aria-label={mode === 'detail' ? active.name : 'Your selection'}
                style={{
                    opacity: open ? 1 : 0,
                    transform: `translate(-50%, -50%) ${open ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.96)'}`,
                    transition: open
                        ? 'transform .65s cubic-bezier(.22,.8,.2,1), opacity .5s ease, visibility 0s'
                        : 'transform .4s ease, opacity .3s ease, visibility 0s linear .4s',
                    visibility: open ? 'visible' : 'hidden',
                }}
            >
                <div className="cat-sheet-close">
                    <button onClick={() => setOpen(false)} aria-label="Close details">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M3 3 L13 13 M13 3 L3 13" />
                        </svg>
                    </button>
                </div>

                <div style={{ opacity: open ? 1 : 0, transition: open ? 'opacity .7s ease .2s' : 'opacity .2s ease' }}>
                    {mode === 'detail' ? (
                        <div className="cat-sheet-body">
                            <span className="cat-eyebrow">{active.group}</span>
                            <h3>{active.name}</h3>
                            <div className="cat-rule" />
                            <p className="cat-desc">{active.desc}</p>
                            <div className="cat-facts">
                                <div><span className="cat-eyebrow-sm">Price</span><span className="cat-fact cat-price">{active.price}</span></div>
                                <div><span className="cat-eyebrow-sm">Time</span><span className="cat-fact">{active.time}</span></div>
                            </div>
                            <button
                                className="cat-primary"
                                onClick={toggleSelection}
                                style={{ background: isSel ? 'transparent' : '#2A2320', color: isSel ? '#2A2320' : '#FAF6F1' }}
                            >
                                {isSel ? 'Remove from selection' : 'Select this service'}
                            </button>
                        </div>
                    ) : (
                        <div className="cat-sheet-body">
                            <span className="cat-eyebrow">Your selection</span>
                            <h3>{selected.length} selected</h3>
                            <div className="cat-rule" />
                            <div className="cat-rows">
                                {selected.map(r => (
                                    <div key={r.id} className="cat-row">
                                        <div><span className="cat-row-name">{r.name}</span><span className="cat-row-group">{r.group}</span></div>
                                        <span className="cat-row-price">{r.price}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="cat-rule" />
                            <div className="cat-total">
                                <span className="cat-eyebrow-sm">Estimated total</span>
                                <span className="cat-total-value">{formatPrice(total)}</span>
                            </div>
                            <div className="cat-actions">
                                <button className="cat-secondary" onClick={() => { setSel({}); setOpen(false) }}>Clear</button>
                                <button className="cat-primary cat-grow" onClick={() => setOpen(false)}>Continue browsing</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
