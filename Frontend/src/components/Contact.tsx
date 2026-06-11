import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Send, Calendar, Clock, Phone } from 'lucide-react'
import emailjs from '@emailjs/browser'
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
        try {
            await emailjs.sendForm(
                'YOUR_SERVICE_ID',    // TODO: Replace with actual EmailJS Service ID
                'YOUR_TEMPLATE_ID',   // TODO: Replace with actual EmailJS Template ID
                formRef.current,
                'YOUR_PUBLIC_KEY'     // TODO: Replace with actual EmailJS Public Key
            )
            setSent(true)
        } catch {
            alert('Something went wrong. Please try again.')
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
                                <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                                    <h2 className="contact-heading" style={{ margin: 0 }}>Book an Appointment</h2>
                                    <span style={{ color: 'var(--accent)', fontSize: 'var(--text-sm)', textShadow: '0 0 10px rgba(212, 175, 55, 0.3)', letterSpacing: '1px' }}>
                                        Available Soon
                                    </span>
                                </div>
                                <p className="contact-sub">
                                    Our online booking system is launching soon. In the meantime, please reach out to us directly via phone or WhatsApp to secure your slot.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                                    {[
                                        { name: 'Bengaluru Studio', phone: '+917204236981', displayPhone: '+91 72042 36981' },
                                        { name: 'Kalaburagi Studio', phone: '+91918715909', displayPhone: '+91 91871 5909' }
                                    ].map((branch) => (
                                        <div key={branch.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{branch.name}</h4>
                                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{branch.displayPhone}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <a href={`tel:${branch.phone}`} className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', padding: 0, backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-muted)', transition: 'all 0.3s ease' }} aria-label={`Call ${branch.name}`}>
                                                    <Phone size={20} />
                                                </a>
                                                <a href={`https://wa.me/${branch.phone.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', padding: 0, backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-muted)', transition: 'all 0.3s ease' }} aria-label={`WhatsApp ${branch.name}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <form ref={formRef} className="contact-form" onSubmit={handleSubmit} style={{ display: 'none' }}>
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
