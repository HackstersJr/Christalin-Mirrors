import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Send } from 'lucide-react'
import emailjs from '@emailjs/browser'
import contactImg from '../assets/contact-portrait.png'
import './Contact.css'

export default function Contact() {
    const formRef = useRef<HTMLFormElement>(null)
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formRef.current) return

        setSending(true)
        try {
            await emailjs.sendForm(
                'YOUR_SERVICE_ID',
                'YOUR_TEMPLATE_ID',
                formRef.current,
                'YOUR_PUBLIC_KEY'
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
                <motion.div
                    className="contact-split"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Image Side */}
                    <div className="contact-image-side">
                        <img src={contactImg} alt="CM Salon" loading="lazy" />
                        <div className="contact-image-overlay">
                            <span className="contact-image-text">
                                Let's Create<br />Something<br />Beautiful
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
                                <h3>Message Sent!</h3>
                                <p>We'll get back to you within 24 hours.</p>
                            </motion.div>
                        ) : (
                            <>
                                <h2 className="contact-heading">Book an Appointment</h2>
                                <p className="contact-sub">
                                    We'd love to hear from you. Fill out the form below and we'll be in touch.
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

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="contact-phone">Phone</label>
                                        <input
                                            id="contact-phone"
                                            name="user_phone"
                                            type="tel"
                                            className="form-input"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="contact-service">Service Interest</label>
                                        <select
                                            id="contact-service"
                                            name="service_interest"
                                            className="form-select"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Select a service</option>
                                            <option value="haircut">Haircut & Styling</option>
                                            <option value="color">Color & Highlights</option>
                                            <option value="treatment">Hair Treatment</option>
                                            <option value="bridal">Bridal Package</option>
                                            <option value="grooming">Grooming</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="contact-message">Message</label>
                                        <textarea
                                            id="contact-message"
                                            name="message"
                                            className="form-textarea"
                                            placeholder="Tell us what you're looking for..."
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
                                                Send Message
                                                <Send size={16} style={{ marginLeft: 8, display: 'inline' }} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
