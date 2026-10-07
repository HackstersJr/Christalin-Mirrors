import React, { useState, useEffect } from 'react'
import { X, Calculator, Save, CheckCircle2, ShoppingBag, Banknote, Smartphone, Users } from 'lucide-react'
import { manualSalesStore, OPERATIONAL_BRANCHES, UPCOMING_BRANCHES } from '../data/manualSalesStore'
import { todayIso } from '../pages/reportUtils'
import './PutDailySalesModal.css'

interface PutDailySalesModalProps {
    isOpen: boolean
    onClose: () => void
    initialBranch?: string
    initialDate?: string
    onSaveSuccess?: (info: { branch: string; date: string; upi: number; cash: number; retail: number; total: number }) => void
}

export default function PutDailySalesModal({
    isOpen,
    onClose,
    initialBranch = 'Bengaluru',
    initialDate,
    onSaveSuccess,
}: PutDailySalesModalProps) {
    const defaultBranch = initialBranch === 'all' || !initialBranch ? 'Bengaluru' : initialBranch
    const [branch, setBranch] = useState(defaultBranch)
    const [date, setDate] = useState(initialDate || todayIso())
    const [clientCount, setClientCount] = useState<number | ''>('')
    const [upi, setUpi] = useState<number | ''>('')
    const [cash, setCash] = useState<number | ''>('')
    const [retail, setRetail] = useState<number | ''>('')
    const [notes, setNotes] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [existingFound, setExistingFound] = useState(false)

    // Load existing record whenever branch or date changes
    useEffect(() => {
        if (!isOpen) return
        const cleanBranch = branch === 'all' ? 'Bengaluru' : branch
        const existing = manualSalesStore.getRecord(cleanBranch, date)
        if (existing && (existing.upi || existing.cash || existing.retail || existing.clientCount || existing.service)) {
            setClientCount(existing.clientCount || '')
            setUpi(existing.upi || '')
            setCash(existing.cash || '')
            setRetail(existing.retail || '')
            setNotes(existing.notes || '')
            setExistingFound(true)
        } else {
            setClientCount('')
            setUpi('')
            setCash('')
            setRetail('')
            setNotes('')
            setExistingFound(false)
        }
    }, [branch, date, isOpen])

    // Update branch/date when initial props change
    useEffect(() => {
        if (isOpen) {
            if (initialBranch && initialBranch !== 'all') {
                setBranch(initialBranch)
            }
            if (initialDate) {
                setDate(initialDate)
            }
        }
    }, [isOpen, initialBranch, initialDate])

    if (!isOpen) return null

    // Exact numeric calculations
    const numUpi = typeof upi === 'number' ? Math.max(0, upi) : 0
    const numCash = typeof cash === 'number' ? Math.max(0, cash) : 0
    const numRetail = typeof retail === 'number' ? Math.max(0, retail) : 0
    const numClients = typeof clientCount === 'number' ? Math.max(0, clientCount) : 0

    // TOTAL = UPI + CASH + RETAIL
    const totalDailySales = numUpi + numCash + numRetail

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        const targetBranch = branch === 'all' ? 'Bengaluru' : branch
        setIsSaving(true)

        try {
            manualSalesStore.setRecord(
                targetBranch,
                date,
                {
                    clientCount: numClients,
                    upi: numUpi,
                    cash: numCash,
                    retail: numRetail,
                    service: numUpi + numCash,
                    total: totalDailySales,
                    notes: notes.trim(),
                }
            )

            onSaveSuccess?.({
                branch: targetBranch,
                date,
                upi: numUpi,
                cash: numCash,
                retail: numRetail,
                total: totalDailySales,
            })

            onClose()
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="put-sales-modal-backdrop no-print" onClick={onClose}>
            <div className="put-sales-modal" onClick={e => e.stopPropagation()}>
                <div className="put-sales-modal-header">
                    <h3 className="put-sales-modal-title">
                        <Calculator size={18} style={{ color: 'var(--color-primary, #b59458)' }} />
                        <span>Put Daily Sales</span>
                    </h3>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSave}>
                    <div className="put-sales-modal-body">
                        {existingFound && (
                            <div style={{
                                background: 'rgba(181, 148, 88, 0.08)',
                                border: '1px solid rgba(181, 148, 88, 0.25)',
                                borderRadius: 8,
                                padding: '8px 12px',
                                fontSize: 12,
                                color: 'var(--color-primary, #b59458)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}>
                                <CheckCircle2 size={14} />
                                <span>Existing entry found for this date. Editing will update and recalculate total sales.</span>
                            </div>
                        )}

                        <div className="put-sales-form-grid">
                            <div className="put-sales-field-group">
                                <label className="put-sales-label">Select Date</label>
                                <input
                                    type="date"
                                    className="put-sales-input"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="put-sales-field-group">
                                <label className="put-sales-label">Branch</label>
                                <select
                                    className="put-sales-input"
                                    value={branch}
                                    onChange={e => setBranch(e.target.value)}
                                >
                                    <optgroup label="Operational Salons">
                                        {OPERATIONAL_BRANCHES.map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Upcoming Branches">
                                        {UPCOMING_BRANCHES.map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        <div className="put-sales-field-group">
                            <label className="put-sales-label">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Users size={13} /> Client / Bills Count
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Distinct clients served</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                className="put-sales-input"
                                placeholder="0"
                                value={clientCount}
                                onChange={e => setClientCount(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                            />
                        </div>

                        {/* Three Sales Inputs: Cash, UPI, Retail */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                            {/* Cash Input */}
                            <div className="put-sales-field-group">
                                <label className="put-sales-label" style={{ color: '#34d399' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Banknote size={12} /> Cash Sales
                                    </span>
                                </label>
                                <div className="put-sales-input-wrapper">
                                    <span className="put-sales-input-prefix">₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        className="put-sales-input with-prefix"
                                        placeholder="0"
                                        value={cash}
                                        onChange={e => setCash(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                                    />
                                </div>
                            </div>

                            {/* UPI Input */}
                            <div className="put-sales-field-group">
                                <label className="put-sales-label" style={{ color: '#818cf8' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Smartphone size={12} /> UPI Sales
                                    </span>
                                </label>
                                <div className="put-sales-input-wrapper">
                                    <span className="put-sales-input-prefix">₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        className="put-sales-input with-prefix"
                                        placeholder="0"
                                        value={upi}
                                        onChange={e => setUpi(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                                    />
                                </div>
                            </div>

                            {/* Retail Input */}
                            <div className="put-sales-field-group">
                                <label className="put-sales-label" style={{ color: '#fbbf24' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <ShoppingBag size={12} /> Retail Sales
                                    </span>
                                </label>
                                <div className="put-sales-input-wrapper">
                                    <span className="put-sales-input-prefix">₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        className="put-sales-input with-prefix"
                                        placeholder="0"
                                        value={retail}
                                        onChange={e => setRetail(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* LIVE AUTO-CALCULATED TOTAL BOX */}
                        <div className="put-sales-calc-card">
                            <div className="put-sales-calc-header">
                                <span>Live Calculation Breakdown</span>
                                <span>Cash + UPI + Retail</span>
                            </div>

                            <div className="put-sales-breakdown-row">
                                <div className="put-sales-chip">
                                    <span className="put-sales-chip-tag" style={{ color: '#34d399' }}>Cash</span>
                                    <span className="put-sales-chip-val">₹{numCash.toLocaleString('en-IN')}</span>
                                </div>
                                <span className="put-sales-op-sign">+</span>
                                <div className="put-sales-chip">
                                    <span className="put-sales-chip-tag" style={{ color: '#818cf8' }}>UPI</span>
                                    <span className="put-sales-chip-val">₹{numUpi.toLocaleString('en-IN')}</span>
                                </div>
                                <span className="put-sales-op-sign">+</span>
                                <div className="put-sales-chip">
                                    <span className="put-sales-chip-tag" style={{ color: '#fbbf24' }}>Retail</span>
                                    <span className="put-sales-chip-val">₹{numRetail.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className="put-sales-total-row">
                                <div>
                                    <div className="put-sales-total-label">Total Daily Sales</div>
                                    <div className="put-sales-total-sub">Automatically summed for reports &amp; analytics</div>
                                </div>
                                <div className="put-sales-total-value">
                                    ₹{totalDailySales.toLocaleString('en-IN')}
                                </div>
                            </div>
                        </div>

                        <div className="put-sales-field-group">
                            <label className="put-sales-label">
                                <span>Notes / Remarks</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Optional closing remarks</span>
                            </label>
                            <input
                                type="text"
                                className="put-sales-input"
                                placeholder="e.g. Festival peak day, Bridal makeup booking"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="put-sales-modal-footer">
                        <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="admin-btn admin-btn-primary"
                            disabled={isSaving}
                            style={{ gap: 6 }}
                        >
                            <Save size={15} />
                            <span>Save Daily Sales (₹{totalDailySales.toLocaleString('en-IN')})</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
