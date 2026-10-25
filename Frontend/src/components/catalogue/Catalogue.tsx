import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import { ALL_ITEMS, CATALOGUES, formatPrice } from './data'
import type { Audience } from './data'
import { cardArt } from './cardArt'
import CircularGallery from './CircularGallery'
import GlassSurface from './GlassSurface'
import SilkBackground from './SilkBackground'
import logo from './logo.png'
import './Catalogue.css'

export default function Catalogue() {
    const [aud, setAud] = useState<Audience>('women')
    const [gi, setGi] = useState(0)
    const [idx, setIdx] = useState(0)
    const [sel, setSel] = useState<Record<string, true>>({})
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<'detail' | 'summary'>('detail')
    const swipe = useRef<{ x: number; y: number } | null>(null)

    const groups = CATALOGUES[aud]
    const group = groups[gi]
    const active = group.items[Math.min(idx, group.items.length - 1)]
    const selected = ALL_ITEMS.filter(f => sel[f.id])
    const total = selected.reduce((a, f) => a + f.priceN, 0)
    const isSel = !!sel[active.id]

    useEffect(() => {
        const prev = document.title
        document.title = 'Service Catalogue | Christalin Mirrors'
        return () => { document.title = prev }
    }, [])

    // Regenerated only when the collection or the selection changes, so the gallery keeps its textures.
    const galleryItems = useMemo(
        () => group.items.map(it => ({ image: cardArt(it.icon, !!sel[it.id]), text: it.name, alt: `${it.name}, ${it.price}` })),
        [group, sel],
    )

    const goGroup = (next: number) => {
        if (next === gi || next < 0 || next >= groups.length) return
        setGi(next)
        setIdx(0)
    }

    const switchAudience = (next: Audience) => {
        if (next === aud) return
        setAud(next)
        setGi(0)
        setIdx(0)
    }

    const toggleSelection = () => {
        setSel(s => {
            const n = { ...s }
            if (n[active.id]) delete n[active.id]
            else n[active.id] = true
            return n
        })
    }

    const openDetail = (index: number) => {
        setIdx(index)
        setMode('detail')
        setOpen(true)
    }

    // The gallery handles sideways dragging; a clear vertical swipe changes collection.
    const onSwipeDown = (e: PointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY } }
    const onSwipeUp = (e: PointerEvent) => {
        const s = swipe.current
        swipe.current = null
        if (!s) return
        const dx = e.clientX - s.x
        const dy = e.clientY - s.y
        if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.4) goGroup(gi + (dy < 0 ? 1 : -1))
    }

    return (
        <div className="cat-root" onContextMenu={e => e.preventDefault()}>
            <div className="cat-bg" aria-hidden="true">
                <SilkBackground />
            </div>

            <div className="cat-top">
                <img className="cat-logo" src={logo} alt="Christalin Mirrors" />
                <div className="cat-top-title">
                    <h1 key={`${aud}-${gi}`} className="cat-fade" style={{ '--len': group.name.length } as CSSProperties}>{group.name}</h1>
                </div>
            </div>

            <div className="cat-gallery" onPointerDown={onSwipeDown} onPointerUp={onSwipeUp} onPointerCancel={() => { swipe.current = null }}>
                <CircularGallery
                    key={`${aud}-${gi}`}
                    items={galleryItems}
                    bend={2}
                    textColor="#8A6B50"
                    borderRadius={0.14}
                    itemSize={1.3}
                    itemAspect={0.8}
                    gap={0.2}
                    wave={0.6}
                    fadeEdges={0.08}
                    shadow={0.18}
                    showTitles={false}
                    openOnClick={false}
                    scrollEase={0.08}
                    onActiveChange={setIdx}
                    onItemClick={(_, i) => openDetail(i)}
                />
            </div>

            <div className="cat-bar">
                {selected.length > 0 && (
                    <button
                        className="cat-selpill"
                        aria-label={`${selected.length} selected. View selection.`}
                        onClick={() => { setMode('summary'); setOpen(true) }}
                    >
                        {selected.length} selected
                    </button>
                )}
            </div>

            <div className="cat-groupdots" role="group" aria-label="Collections">
                {groups.map((g, i) => (
                    <button key={g.name} className="cat-gdot" aria-label={g.name} aria-current={i === gi ? 'true' : undefined} onClick={() => goGroup(i)}>
                        <span style={{ height: i === gi ? 24 : 6, background: i === gi ? '#9B7B5E' : 'rgba(111,95,82,0.4)' }} />
                    </button>
                ))}
            </div>

            <div className="cat-bottom">
                <div className="cat-info">
                    <div className="cat-svcdots" aria-hidden="true">
                        {group.items.map((it, i) => (
                            <div key={it.id} style={{ width: i === idx ? 22 : 6, background: i === idx ? '#9B7B5E' : 'rgba(111,95,82,0.4)' }} />
                        ))}
                    </div>
                    <div key={active.id} className="cat-info-text cat-fade">
                        <h2 style={{ '--len': active.name.length } as CSSProperties}>{active.name}</h2>
                        <div className="cat-info-meta">
                            <span className="cat-price">{active.price}</span>
                        </div>
                    </div>
                </div>

                <GlassSurface
                    width={196} height={50} borderRadius={25}
                    distortionScale={-90} displace={0.4} backgroundOpacity={0.22} blur={10}
                    className="cat-switch-glass"
                >
                    <div className="cat-switch" role="group" aria-label="Choose catalogue">
                        {(['women', 'men'] as const).map(a => (
                            <button
                                key={a}
                                className={a === aud ? 'cat-switch-on' : ''}
                                aria-pressed={a === aud}
                                onClick={() => switchAudience(a)}
                            >
                                {a === 'women' ? 'Women' : 'Men'}
                            </button>
                        ))}
                    </div>
                </GlassSurface>
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
                            {active.sub && <p className="cat-desc">{active.sub}</p>}
                            <div className="cat-facts">
                                <div><span className="cat-eyebrow-sm">Price</span><span className="cat-fact cat-price">{active.price}</span></div>
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
