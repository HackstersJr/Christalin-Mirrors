import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, MapPin, Clock as ClockIcon, Sparkles, User, Mail, Phone as PhoneIcon } from 'lucide-react'
import { branches } from '../../data/branches'
import { services, serviceTabs, type Category } from '../../data/services'
import WheelDatePicker from './WheelDatePicker'
import type { StepProps } from './types'

const TIME_SLOTS = [
    '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM',
    '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM',
]

function getMinDate() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
}

export function isStepValid(step: number, data: StepProps['data']): boolean {
    switch (step) {
        case 0: return data.name.trim().length > 1
            && /\S+@\S+\.\S+/.test(data.email)
            && /^\d{10}$/.test(data.phone.replace(/\D/g, ''))
        case 1: return data.branchId !== ''
        case 2: return data.serviceNames.length > 0
        case 3: return data.date !== '' && data.time !== ''
        default: return true
    }
}

/* ─── Step 1: About You ─────────────────────────────────────── */
export function StepAbout({ data, update }: StepProps) {
    return (
        <div className="booking-step">
            <p className="booking-step-eyebrow">Step 1 of 5</p>
            <h2 className="booking-step-title">Tell us about yourself</h2>
            <p className="booking-step-sub">Let's start with the basics so we know who's coming in and how to reach you.</p>

            <div className="booking-field">
                <label className="booking-label" htmlFor="bk-name"><User size={14} /> Full Name</label>
                <input
                    id="bk-name"
                    type="text"
                    className="booking-input"
                    placeholder="e.g. Ananya Rao"
                    value={data.name}
                    onChange={(e) => update({ name: e.target.value })}
                    autoFocus
                    required
                />
            </div>

            <div className="booking-field">
                <label className="booking-label" htmlFor="bk-email"><Mail size={14} /> Email Address</label>
                <input
                    id="bk-email"
                    type="email"
                    className="booking-input"
                    placeholder="hello@example.com"
                    value={data.email}
                    onChange={(e) => update({ email: e.target.value })}
                    required
                />
            </div>

            <div className="booking-field">
                <label className="booking-label" htmlFor="bk-phone"><PhoneIcon size={14} /> Phone Number</label>
                <div className="booking-phone-row">
                    <span className="booking-phone-prefix">+91</span>
                    <input
                        id="bk-phone"
                        type="tel"
                        inputMode="numeric"
                        className="booking-input"
                        placeholder="98765 43210"
                        value={data.phone}
                        onChange={(e) => update({ phone: e.target.value.replace(/[^\d\s]/g, '') })}
                        required
                    />
                </div>
            </div>
        </div>
    )
}

/* ─── Step 2: Branch ─────────────────────────────────────────── */
export function StepBranch({ data, update }: StepProps) {
    return (
        <div className="booking-step">
            <p className="booking-step-eyebrow">Step 2 of 5</p>
            <h2 className="booking-step-title">Choose your studio</h2>
            <p className="booking-step-sub">Select the Christalin Mirrors location you'd like to visit.</p>

            <div className="booking-branch-grid">
                {branches.map((branch) => (
                    <button
                        key={branch.id}
                        type="button"
                        className={`booking-branch-card ${data.branchId === branch.id ? 'selected' : ''}`}
                        onClick={() => update({ branchId: branch.id })}
                    >
                        {data.branchId === branch.id && <span className="booking-check"><Check size={14} /></span>}
                        <h3>{branch.name.replace('CM — ', '')}</h3>
                        <p className="booking-branch-address"><MapPin size={13} /> {branch.address}</p>
                        <p className="booking-branch-hours"><ClockIcon size={13} /> {branch.hours}</p>
                    </button>
                ))}
            </div>
        </div>
    )
}

/* ─── Step 4: Services (multi-select) ───────────────────────── */
export function StepServices({ data, update }: StepProps) {
    const [active, setActive] = useState<Category>(serviceTabs[0].value)
    const filtered = services.filter((s) => s.category === active)

    const toggle = (name: string) => {
        const exists = data.serviceNames.includes(name)
        update({
            serviceNames: exists
                ? data.serviceNames.filter((n) => n !== name)
                : [...data.serviceNames, name],
        })
    }

    return (
        <div className="booking-step">
            <p className="booking-step-eyebrow">Step 3 of 5</p>
            <h2 className="booking-step-title">
                Select your services
                {data.serviceNames.length > 0 && <span className="booking-count-badge">{data.serviceNames.length} selected</span>}
            </h2>
            <p className="booking-step-sub">Pick one or more services — combine as you like.</p>
            <p className="booking-hint">Not sure yet? You can always add or change services once you're at the salon.</p>

            <div className="booking-tabs">
                {serviceTabs.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        className={`booking-tab ${active === tab.value ? 'active' : ''}`}
                        onClick={() => setActive(tab.value)}
                    >
                        {tab.highlight && <Sparkles size={12} />}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="booking-service-list">
                {filtered.map((service) => {
                    const checked = data.serviceNames.includes(service.name)
                    return (
                        <button
                            type="button"
                            key={service.name}
                            className={`booking-service-item ${checked ? 'selected' : ''}`}
                            onClick={() => toggle(service.name)}
                        >
                            <span className={`booking-checkbox ${checked ? 'checked' : ''}`}>
                                {checked && <Check size={12} />}
                            </span>
                            <span className="booking-service-info">
                                <span className="booking-service-name">
                                    {service.isKorean && <Sparkles size={12} className="booking-korean-icon" />}
                                    {service.name}
                                </span>
                                <span className="booking-service-tag">{service.tag}</span>
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

/* ─── Step 5: Date & Time ────────────────────────────────────── */
export function StepDateTime({ data, update }: StepProps) {
    return (
        <div className="booking-step">
            <p className="booking-step-eyebrow">Step 4 of 5</p>
            <h2 className="booking-step-title">Pick a date & time</h2>
            <p className="booking-step-sub">Choose when you'd like to come in — we'll confirm availability shortly after.</p>

            <div className="booking-field">
                <label className="booking-label">Preferred Date</label>
                <WheelDatePicker
                    value={data.date}
                    onChange={(date) => update({ date })}
                    minDate={getMinDate()}
                />
            </div>

            <div className="booking-field">
                <label className="booking-label">Preferred Time</label>
                <div className="booking-slot-grid">
                    {TIME_SLOTS.map((slot) => (
                        <button
                            key={slot}
                            type="button"
                            className={`booking-slot ${data.time === slot ? 'selected' : ''}`}
                            onClick={() => update({ time: slot })}
                        >
                            {slot}
                        </button>
                    ))}
                </div>
            </div>

            <div className="booking-field">
                <label className="booking-label" htmlFor="bk-notes">
                    Special Requests <span className="booking-optional">(optional)</span>
                </label>
                <textarea
                    id="bk-notes"
                    className="booking-textarea"
                    placeholder="Any preferences, allergies, or notes for our stylists..."
                    rows={3}
                    value={data.notes}
                    onChange={(e) => update({ notes: e.target.value })}
                />
            </div>
        </div>
    )
}

/* ─── Step 6: Confirm ────────────────────────────────────────── */
export function StepConfirm({ data, onEdit }: StepProps & { onEdit: (step: number) => void }) {
    const branch = branches.find((b) => b.id === data.branchId)

    const rows: { label: string; value: string; step: number }[] = [
        { label: 'Name', value: data.name, step: 0 },
        { label: 'Email', value: data.email, step: 0 },
        { label: 'Phone', value: `+91 ${data.phone}`, step: 0 },
        { label: 'Studio', value: branch?.name.replace('CM — ', '') || '', step: 1 },
        { label: 'Services', value: data.serviceNames.join(', '), step: 2 },
        { label: 'Date', value: data.date ? new Date(data.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '', step: 3 },
        { label: 'Time', value: data.time, step: 3 },
    ]

    return (
        <div className="booking-step">
            <p className="booking-step-eyebrow">Step 5 of 5</p>
            <h2 className="booking-step-title">Review your booking</h2>
            <p className="booking-step-sub">Double-check the details below before confirming.</p>

            <div className="booking-summary">
                {rows.filter((r) => r.value).map((row) => (
                    <div className="booking-summary-row" key={row.label}>
                        <span className="booking-summary-label">{row.label}</span>
                        <span className="booking-summary-value">{row.value}</span>
                        <button type="button" className="booking-summary-edit" onClick={() => onEdit(row.step)}>Edit</button>
                    </div>
                ))}
                {data.notes && (
                    <div className="booking-summary-row">
                        <span className="booking-summary-label">Notes</span>
                        <span className="booking-summary-value">{data.notes}</span>
                        <button type="button" className="booking-summary-edit" onClick={() => onEdit(3)}>Edit</button>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ─── Success State ──────────────────────────────────────────── */
export function BookingSuccess({ data }: { data: StepProps['data'] }) {
    const branch = branches.find((b) => b.id === data.branchId)
    return (
        <motion.div
            className="booking-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
            <motion.span
                className="booking-success-icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 14 }}
            >
                <Check size={32} />
            </motion.span>
            <h2>Booking Requested, {data.name.split(' ')[0]}!</h2>
            <p>
                Thank you for choosing Christalin Mirrors. Our {branch?.name.replace('CM — ', '')} team will confirm your
                appointment on <strong>{data.date && new Date(data.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</strong> at <strong>{data.time}</strong> within 24 hours.
            </p>
            <p className="booking-success-note">
                For urgent bookings, call or WhatsApp {branch?.name.replace('CM — ', '')} directly at {branch?.phone}.
            </p>
        </motion.div>
    )
}
