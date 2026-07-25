import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Send, Calendar, Clock } from 'lucide-react'
import { publicApi } from '../lib/api'
import { StaggerItem } from './Animations'
import { CONTACT_IMAGE } from '../data/assets'
import './Contact.css'

const timeSlots = [
    '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM',
    '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM',
]

export default function Contact() {
    const formRef = useRef<HTMLFormElement>(null)
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    // Get tomorrow's date as minimum selectable date
    const getMinDate = () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formRef.current) return

        setSending(true)
        setError('')

        // Booking request → backend contact submission. Date/time/note are folded
        // into the message so no schema change is needed for v1.
        const fd = new FormData(formRef.current)
        const name = String(fd.get('user_name') ?? '')
        const email = String(fd.get('user_email') ?? '')
        const date = String(fd.get('preferred_date') ?? '')
        const time = String(fd.get('preferred_time') ?? '')
        const note = String(fd.get('note') ?? '')

        const message = [
            `Preferred date: ${date}`,
            `Preferred time: ${time}`,
            note ? `Note: ${note}` : null,
        ].filter(Boolean).join('\n')

        try {
            await publicApi.post('/public/contact', {
                name,
                email,
                subject: 'Appointment request',
                message,
                website: String(fd.get('website') ?? ''), // honeypot
            })
            setSent(true)
        } catch (err: any) {
            setError(
                err?.response?.status === 429
                    ? 'Too many requests. Please try again later.'
                    : 'Something went wrong. Please try again.'
            )
        } finally {
            setSending(false)
        }
    }

    return (
        <section className="contact section" id="contact">
            <div className="container">
                <StaggerItem className="contact-split">
                    {/* Image Side */}
                    <div className="contact-image-side">
                        <img src={CONTACT_IMAGE} alt="Christalin Mirrors Salon" loading="lazy" />
                        <div className="contact-image-overlay">
                            <span className="contact-image-text">
                                Refine<br />Reflect<br />Radiate
                            </span>
                        </div>
                    </div>

                    {/* Form Side */}
                    <div className="contact-form-side">
                        {sent ? (
                            <motion.div
                                className="contact-success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <CheckCircle size={48} className="contact-success-icon" />
                                <h3>Appointment Request Sent!</h3>
                                <p>We'll confirm your booking within 24 hours.</p>
                            </motion.div>
                        ) : (
                            <>
                                <h2 className="contact-heading">Book an Appointment</h2>
                                <p className="contact-sub">
                                    Choose your preferred slot and we'll confirm your booking shortly.
                                </p>

                                <form ref={formRef} className="contact-form" onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="contact-name">Name</label>
                                        <input
                                            id="contact-name"
                                            name="user_name"
                                            type="text"
                                            className="form-input"
                                            placeholder="Your full name"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="contact-email">Email</label>
                                        <input
                                            id="contact-email"
                                            name="user_email"
                                            type="email"
                                            className="form-input"
                                            placeholder="hello@example.com"
                                            required
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="contact-date">
                                                <Calendar size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
                                                Preferred Date
                                            </label>
                                            <input
                                                id="contact-date"
                                                name="preferred_date"
                                                type="date"
                                                className="form-input"
                                                min={getMinDate()}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" htmlFor="contact-time">
                                                <Clock size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
                                                Preferred Time
                                            </label>
                                            <select
                                                id="contact-time"
                                                name="preferred_time"
                                                className="form-select"
                                                defaultValue=""
                                                required
                                            >
                                                <option value="" disabled>Select a time slot</option>
                                                {timeSlots.map(slot => (
                                                    <option key={slot} value={slot}>{slot}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="contact-note">
                                            Add a Note <span className="form-optional">(optional)</span>
                                        </label>
                                        <textarea
                                            id="contact-note"
                                            name="note"
                                            className="form-textarea"
                                            placeholder="Any special requests or preferences..."
                                            rows={3}
                                        />
                                    </div>

                                    {/* Honeypot — hidden from users, filled only by bots */}
                                    <input
                                        type="text"
                                        name="website"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        aria-hidden="true"
                                        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
                                    />

                                    {error && (
                                        <div style={{
                                            color: '#f43f5e', fontSize: 14, marginBottom: 12,
                                            background: 'rgba(244,63,94,0.1)', padding: '10px 12px', borderRadius: 8,
                                        }}>
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="contact-submit"
                                        disabled={sending}
                                    >
                                        {sending ? 'Sending...' : (
                                            <>
                                                Book Appointment
                                                <Send size={16} style={{ marginLeft: 8, display: 'inline' }} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </StaggerItem>
            </div>
        </section>
    )
}
