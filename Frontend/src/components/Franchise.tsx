import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Building, MapPin, IndianRupee } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Franchise() {
    const { theme, toggleTheme } = useTheme()
    const formRef = useRef<HTMLFormElement>(null)
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSending(true)
        
        // Simulate API call for now since we are ignoring backend
        setTimeout(() => {
            setSending(false)
            setSent(true)
        }, 1500)
    }

    return (
        <>
            <Navbar theme={theme} toggleTheme={toggleTheme} />
            <main className="franchise-page" style={{ paddingTop: '120px', paddingBottom: '80px', minHeight: '80vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-4xl)', marginBottom: '16px' }}>Franchise Enquiry</h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', lineHeight: 1.6 }}>Partner with Christalin Mirrors and bring our refined salon experience to your city. Fill out the form below and our franchise team will get back to you.</p>

                        {sent ? (
                            <motion.div
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center' }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <CheckCircle size={48} style={{ color: 'var(--accent)', margin: '0 auto 16px' }} />
                                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', marginBottom: '8px' }}>Enquiry Received!</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>Our franchise partnership team will contact you within 48 hours to discuss the opportunity.</p>
                            </motion.div>
                        ) : (
                            <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px', background: 'var(--bg-secondary)', padding: '40px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500, color: 'var(--text-secondary)' }}>First Name</label>
                                        <input type="text" required style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500, color: 'var(--text-secondary)' }}>Last Name</label>
                                        <input type="text" required style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500, color: 'var(--text-secondary)' }}>Email</label>
                                        <input type="email" required style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500, color: 'var(--text-secondary)' }}>Phone Number</label>
                                        <input type="tel" required style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>
                                </div>

                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                        <MapPin size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}/>
                                        Proposed City/Location
                                    </label>
                                    <input type="text" required placeholder="e.g., Mumbai, Maharashtra" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }} />
                                </div>

                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                        <IndianRupee size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}/>
                                        Available Investment Capital
                                    </label>
                                    <select required style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', appearance: 'none' }}>
                                        <option value="" disabled selected>Select an option</option>
                                        <option value="15-25">₹15 Lakhs - ₹25 Lakhs</option>
                                        <option value="25-40">₹25 Lakhs - ₹40 Lakhs</option>
                                        <option value="40+">₹40 Lakhs +</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                        <Building size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}/>
                                        Do you already own a commercial space?
                                    </label>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input type="radio" name="space" value="yes" required /> Yes
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input type="radio" name="space" value="no" /> No
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={sending}
                                    style={{
                                        marginTop: '16px',
                                        padding: '16px',
                                        background: 'var(--accent)',
                                        color: '#FAFAFA',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        fontFamily: 'var(--font-heading)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'background 0.3s'
                                    }}
                                >
                                    {sending ? 'Submitting...' : 'Submit Enquiry'}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </main>
            <Footer />
        </>
    )
}
