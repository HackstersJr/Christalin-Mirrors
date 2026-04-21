import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Send, Building } from 'lucide-react'
import './Contact.css'

export default function Contact() {
    const formRef = useRef<HTMLFormElement>(null)
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSending(true)
        // Simulated send
        setTimeout(() => {
            setSending(false)
            setSent(true)
        }, 1500)
    }

    return (
        <section className="contact section" id="contact">
            <div className="container">
                <div className="contact-split">
                    {/* Image Side */}
                    <div className="contact-image-side">
                        <img 
                            src="https://images.unsplash.com/photo-1541339907198-e08756ebafe1?q=80&w=2670&auto=format&fit=crop" 
                            alt="Consultation" 
                            loading="lazy" 
                        />
                        <div className="contact-image-overlay">
                            <span className="contact-image-text">
                                Vision<br />Design<br />Execution
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
                                <h3>Consultation Request Sent!</h3>
                                <p>Our infrastructure experts will contact you within 24 hours.</p>
                            </motion.div>
                        ) : (
                            <>
                                <h2 className="contact-heading">Request a Consultation</h2>
                                <p className="contact-sub">
                                    Partner with us to build state-of-the-art sports facilities for your organization.
                                </p>

                                <form ref={formRef} className="contact-form" onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="contact-name">Full Name</label>
                                        <input
                                            id="contact-name"
                                            name="user_name"
                                            type="text"
                                            className="form-input"
                                            placeholder="Enter your name"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="contact-email">Email Address</label>
                                        <input
                                            id="contact-email"
                                            name="user_email"
                                            type="email"
                                            className="form-input"
                                            placeholder="hello@organization.com"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="contact-org">
                                            <Building size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
                                            Organization
                                        </label>
                                        <input
                                            id="contact-org"
                                            name="organization"
                                            type="text"
                                            className="form-input"
                                            placeholder="School, University or Club name"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="contact-note">
                                            Project Details
                                        </label>
                                        <textarea
                                            id="contact-note"
                                            name="note"
                                            className="form-textarea"
                                            placeholder="Briefly describe your infrastructure needs..."
                                            rows={4}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="contact-submit btn btn-primary"
                                        disabled={sending}
                                    >
                                        {sending ? 'Processing...' : (
                                            <>
                                                Submit Request
                                                <Send size={16} style={{ marginLeft: 8, display: 'inline' }} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
