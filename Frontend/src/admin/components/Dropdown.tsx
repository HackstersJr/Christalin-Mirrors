import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import './Dropdown.css'

export interface DropdownOption {
    value: string
    label: ReactNode
    disabled?: boolean
}

export interface DropdownGroup {
    label: string
    options: DropdownOption[]
}

interface DropdownProps {
    value: string
    onChange: (value: string) => void
    options?: DropdownOption[]
    groups?: DropdownGroup[]
    placeholder?: string
    disabled?: boolean
    /** Visual style of the trigger. */
    variant?: 'form' | 'filter' | 'status'
    /** Extra class(es) on the root element. */
    className?: string
    'aria-label'?: string
}

interface PanelPos {
    left: number
    top: number
    width: number
    /** true when the panel is flipped above the trigger */
    above: boolean
    maxHeight: number
}

export default function Dropdown({
    value,
    onChange,
    options,
    groups,
    placeholder = 'Select...',
    disabled = false,
    variant = 'form',
    className = '',
    'aria-label': ariaLabel,
}: DropdownProps) {
    const [open, setOpen] = useState(false)
    const [pos, setPos] = useState<PanelPos | null>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    const computePos = useCallback(() => {
        const el = rootRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const margin = 8
        const spaceBelow = window.innerHeight - r.bottom - margin
        const spaceAbove = r.top - margin
        const desired = 280
        // Flip above only when there isn't room below but there is above.
        const above = spaceBelow < Math.min(desired, 200) && spaceAbove > spaceBelow
        const maxHeight = Math.min(desired, above ? spaceAbove : spaceBelow)
        setPos({
            left: r.left,
            top: above ? r.top - 4 : r.bottom + 4,
            width: r.width,
            above,
            maxHeight: Math.max(120, maxHeight),
        })
    }, [])

    useEffect(() => {
        if (!open) return
        computePos()
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node
            if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return
            setOpen(false)
        }
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
        // capture=true so we also catch scrolls inside overflow containers
        const onScroll = () => computePos()
        document.addEventListener('mousedown', onDoc)
        document.addEventListener('keydown', onKey)
        window.addEventListener('scroll', onScroll, true)
        window.addEventListener('resize', onScroll)
        return () => {
            document.removeEventListener('mousedown', onDoc)
            document.removeEventListener('keydown', onKey)
            window.removeEventListener('scroll', onScroll, true)
            window.removeEventListener('resize', onScroll)
        }
    }, [open, computePos])

    const flatOptions = groups ? groups.flatMap(g => g.options) : (options ?? [])
    const selected = flatOptions.find(o => o.value === value)

    const pick = (v: string) => { onChange(v); setOpen(false) }

    const statusClass = variant === 'status' && value ? `status-${value}` : ''

    const renderOption = (o: DropdownOption) => (
        <button
            key={o.value}
            type="button"
            role="option"
            aria-selected={o.value === value}
            className={`dd-option ${o.value === value ? 'selected' : ''}`}
            disabled={o.disabled}
            onClick={() => pick(o.value)}
        >
            {o.label}
        </button>
    )

    return (
        <div
            ref={rootRef}
            className={`dd dd--${variant} ${disabled ? 'dd--disabled' : ''} ${open ? 'dd--open' : ''} ${className}`}
        >
            <button
                type="button"
                className={`dd-trigger ${statusClass}`}
                onClick={() => !disabled && setOpen(o => !o)}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
            >
                <span className={`dd-value ${selected ? '' : 'dd-placeholder'}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown size={16} className={`dd-chevron ${open ? 'open' : ''}`} />
            </button>

            {open && pos && createPortal(
                <div
                    ref={panelRef}
                    className={`dd-panel ${pos.above ? 'dd-panel--above' : ''}`}
                    role="listbox"
                    style={{
                        left: pos.left,
                        top: pos.top,
                        minWidth: pos.width,
                        maxHeight: pos.maxHeight,
                        transform: pos.above ? 'translateY(-100%)' : undefined,
                    }}
                >
                    {groups
                        ? groups.map(g => (
                            <div key={g.label} className="dd-group">
                                <div className="dd-group-label">{g.label}</div>
                                {g.options.map(renderOption)}
                            </div>
                        ))
                        : (options ?? []).map(renderOption)}
                </div>,
                document.body,
            )}
        </div>
    )
}
