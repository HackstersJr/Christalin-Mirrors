import { useState } from 'react'
import { X, Plus, DollarSign, Building2, Calendar, Tag, Briefcase } from 'lucide-react'
import { OPERATIONAL_BRANCH_NAMES, UPCOMING_BRANCH_NAMES } from '../../data/branches'
import { manualProfitLossStore } from '../data/manualProfitLossStore'
import './ImportExcelExpensesModal.css'

interface AddExpenseItemModalProps {
    isOpen: boolean
    onClose: () => void
    defaultBranch?: string
    defaultType?: 'opex' | 'capex'
    currentMonthKey: string
    onSuccess: (branch: string, type: 'opex' | 'capex', amount: number) => void
}

const OPEX_CATEGORIES = [
    { value: 'salaries_wages', label: 'Staff Salaries & Wages' },
    { value: 'rent_lease', label: 'Rent & Premises Lease' },
    { value: 'utilities', label: 'Electricity & Utilities' },
    { value: 'general_admin', label: 'General Admin & Software' },
    { value: 'repairs_maintenance', label: 'Repairs & Salon Maintenance' },
    { value: 'benefits_insurance', label: 'Benefits & Insurance' },
    { value: 'payroll_tax', label: 'Payroll & Local Taxes' },
    { value: 'marketing', label: 'Marketing & Promotions' },
    { value: 'other', label: 'Other Operating Expense' },
]

const CAPEX_CATEGORIES = [
    { value: 'fitout', label: 'Interior Fitout & Civil Works' },
    { value: 'salon_chairs', label: 'Hydraulic Styling Chairs & Mirrors' },
    { value: 'wash_stations', label: 'Shampoo Stations & Backwash Units' },
    { value: 'hvac', label: 'AC & Climate Control Infrastructure' },
    { value: 'signage', label: 'Storefront Facia Signage & Branding' },
    { value: 'deposit', label: 'Commercial Security Deposit' },
    { value: 'pos_hardware', label: 'POS Terminal & Sound System' },
    { value: 'equipment', label: 'Hair Dryers, Steamers & Tools' },
    { value: 'other', label: 'Other Capital Investment' },
]

export default function AddExpenseItemModal({
    isOpen,
    onClose,
    defaultBranch = 'Bengaluru',
    defaultType = 'opex',
    currentMonthKey,
    onSuccess,
}: AddExpenseItemModalProps) {
    const [expenseType, setExpenseType] = useState<'opex' | 'capex'>(defaultType)
    const [branch, setBranch] = useState(defaultBranch === 'all' ? 'Bengaluru' : defaultBranch)
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState(defaultType === 'opex' ? 'salaries_wages' : 'fitout')
    const [amount, setAmount] = useState('')
    const [date, setDate] = useState(`${currentMonthKey}-01`)
    const [vendor, setVendor] = useState('')
    const [notes, setNotes] = useState('')
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const numAmount = parseFloat(amount.replace(/[^\d.-]/g, ''))
        if (!title.trim()) {
            setError('Please enter a description or asset name.')
            return
        }
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid expense amount greater than 0.')
            return
        }

        try {
            if (expenseType === 'capex') {
                manualProfitLossStore.addCapExItem(currentMonthKey, branch, {
                    title: title.trim(),
                    amount: numAmount,
                    category,
                    date: date || `${currentMonthKey}-01`,
                    notes: [vendor ? `Vendor: ${vendor}` : '', notes].filter(Boolean).join(' | '),
                })
            } else {
                manualProfitLossStore.addOpExItem(currentMonthKey, branch, {
                    title: title.trim(),
                    amount: numAmount,
                    category,
                    date: date || `${currentMonthKey}-01`,
                    notes: [vendor ? `Vendor: ${vendor}` : '', notes].filter(Boolean).join(' | '),
                })
            }

            onSuccess(branch, expenseType, numAmount)
            onClose()
            // Reset fields
            setTitle('')
            setAmount('')
            setVendor('')
            setNotes('')
        } catch (err: any) {
            console.error('Failed to save expense item', err)
            setError(err.message || 'Failed to save expense item.')
        }
    }

    const categories = expenseType === 'opex' ? OPEX_CATEGORIES : CAPEX_CATEGORIES

    return (
        <div className="admin-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
            <div
                className="admin-modal-content"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: 540, width: '92%' }}
            >
                <div className="admin-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h2 className="admin-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Plus size={18} className="text-primary" />
                            Add Dedicated Expense
                        </h2>
                        <p className="admin-modal-sub">
                            Log dedicated OpEx or CapEx investments for operational or pre-launch branches.
                        </p>
                    </div>
                    <button className="admin-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Expense Type Switcher */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 4, background: 'var(--bg-card-subtle, rgba(255,255,255,0.04))', borderRadius: 8 }}>
                        <button
                            type="button"
                            onClick={() => {
                                setExpenseType('opex')
                                setCategory('salaries_wages')
                            }}
                            className={`admin-btn ${expenseType === 'opex' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                            style={{ justifyContent: 'center' }}
                        >
                            Operating Expense (OpEx)
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setExpenseType('capex')
                                setCategory('fitout')
                            }}
                            className={`admin-btn ${expenseType === 'capex' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                            style={{ justifyContent: 'center' }}
                        >
                            Capital Investment (CapEx)
                        </button>
                    </div>

                    {/* Target Branch */}
                    <div>
                        <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 size={14} className="text-primary" />
                            Target Branch
                        </label>
                        <select
                            className="admin-form-select"
                            value={branch}
                            onChange={e => setBranch(e.target.value)}
                            required
                        >
                            <optgroup label="Operational Salons">
                                {OPERATIONAL_BRANCH_NAMES.map(b => (
                                    <option key={b} value={b}>
                                        {b === 'Manea' ? 'Manea ★ (Under CEO)' : b}
                                    </option>
                                ))}
                            </optgroup>
                            <optgroup label="Upcoming / Pre-Opening Branches">
                                {UPCOMING_BRANCH_NAMES.map(b => (
                                    <option key={b} value={b}>
                                        {b} (Pre-Launch)
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    {/* Title and Amount */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
                        <div>
                            <label className="admin-form-label">
                                {expenseType === 'capex' ? 'Asset / Equipment Name' : 'Expense Description'}
                            </label>
                            <input
                                type="text"
                                className="admin-form-input"
                                placeholder={expenseType === 'capex' ? 'e.g. Hydraulic Chairs (4 Nos)' : 'e.g. Electricity Bill March'}
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="admin-form-label">Amount (₹)</label>
                            <input
                                type="number"
                                step="any"
                                className="admin-form-input"
                                placeholder="e.g. 45000"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Category & Date */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                        <div>
                            <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Tag size={14} className="text-primary" />
                                Category
                            </label>
                            <select
                                className="admin-form-select"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                            >
                                {categories.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Calendar size={14} className="text-primary" />
                                Date
                            </label>
                            <input
                                type="date"
                                className="admin-form-input"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Vendor / Supplier */}
                    <div>
                        <label className="admin-form-label">Vendor / Supplier / Contractor (Optional)</label>
                        <input
                            type="text"
                            className="admin-form-input"
                            placeholder="e.g. Salon Interiors Pvt Ltd / BESCOM"
                            value={vendor}
                            onChange={e => setVendor(e.target.value)}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="admin-form-label">Internal Notes / Invoice Reference</label>
                        <input
                            type="text"
                            className="admin-form-input"
                            placeholder="e.g. Bill #4829, warranty 2 yrs, advance 50%"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: 6 }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="admin-btn admin-btn-primary">
                            Save {expenseType === 'capex' ? 'CapEx Investment' : 'OpEx Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
