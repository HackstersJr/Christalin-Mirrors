import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Privacy() {
    const { theme, toggleTheme } = useTheme()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <>
            <Navbar theme={theme} toggleTheme={toggleTheme} />
            <main className="legal-page" style={{ paddingTop: '120px', paddingBottom: '80px', minHeight: '80vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Link to="/" className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 'var(--radius-full)', color: 'var(--text-primary)', textDecoration: 'none', transition: 'all 0.3s ease' }}>
                            <ArrowLeft size={16} /> Back to Home
                        </Link>
                        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-4xl)', marginBottom: '32px' }}>Privacy Policy</h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>Last updated: June 2026</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            <section>
                                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: 'var(--text-2xl)', marginBottom: '16px' }}>1. Information We Collect</h2>
                                <p>We collect information that you provide directly to us, such as when you create or modify your account, request services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, and other information you choose to provide.</p>
                            </section>

                            <section>
                                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: 'var(--text-2xl)', marginBottom: '16px' }}>2. How We Use Information</h2>
                                <p>We may use the information we collect about you to: provide, maintain, and improve our services; process transactions and send related information; send you technical notices, updates, security alerts, and support messages; respond to your comments, questions, and requests.</p>
                            </section>

                            <section>
                                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: 'var(--text-2xl)', marginBottom: '16px' }}>3. Information Sharing</h2>
                                <p>We do not share your personal information with third parties except as described in this privacy policy, such as with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>
                            </section>

                            <section>
                                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: 'var(--text-2xl)', marginBottom: '16px' }}>4. Contact Us</h2>
                                <p>If you have any questions about this Privacy Policy, please contact us at Support@christalinmirrors.com.</p>
                            </section>
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </>
    )
}
