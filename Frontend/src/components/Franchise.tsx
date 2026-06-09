import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Franchise() {
    const { theme, toggleTheme } = useTheme()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

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
                        <Link to="/" className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 'var(--radius-full)', color: 'var(--text-primary)', textDecoration: 'none', transition: 'all 0.3s ease' }}>
                            <ArrowLeft size={16} /> Back to Home
                        </Link>
                        
                        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-4xl)', marginBottom: '16px' }}>Franchise Enquiry</h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', lineHeight: 1.6 }}>Partner with Christalin Mirrors and bring our refined salon experience to your city.</p>

                        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 215, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                <Clock size={32} style={{ color: '#FFD700' }} />
                            </div>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', marginBottom: '12px' }}>Applications Opening Soon</h3>
                            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                                We are currently finalizing our franchise partnership program. Please check back later to submit your enquiry.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </>
    )
}
