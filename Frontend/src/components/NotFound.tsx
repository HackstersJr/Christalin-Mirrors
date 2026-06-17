import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'
import Navbar from './Navbar'
import Footer from './Footer'

export default function NotFound() {
    const { theme, toggleTheme } = useTheme()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <>
            <Navbar theme={theme} toggleTheme={toggleTheme} />
            <main
                className="not-found-page"
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: '120px',
                    paddingBottom: '80px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                }}
            >
                <div className="container" style={{ maxWidth: '640px', margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
                    >
                        <span
                            style={{
                                fontFamily: 'var(--font-heading)',
                                fontStyle: 'italic',
                                letterSpacing: '0.25em',
                                textTransform: 'uppercase',
                                fontSize: 'var(--text-sm)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            Christalin Mirrors
                        </span>

                        <h1
                            style={{
                                fontFamily: 'var(--font-heading)',
                                fontStyle: 'italic',
                                fontWeight: 700,
                                fontSize: 'clamp(96px, 18vw, 200px)',
                                lineHeight: 1,
                                margin: '8px 0',
                                background: 'linear-gradient(135deg, #B08968 0%, #A07858 40%, #8B6545 100%)',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            404
                        </h1>

                        <h2
                            style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 'var(--text-3xl)',
                                marginBottom: '8px',
                            }}
                        >
                            This reflection isn&rsquo;t here
                        </h2>

                        <p
                            style={{
                                color: 'var(--text-secondary)',
                                lineHeight: 1.8,
                                maxWidth: '460px',
                                marginBottom: '12px',
                            }}
                        >
                            The page you&rsquo;re looking for may have moved or never existed. Let&rsquo;s
                            guide you back to where beauty begins.
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                marginTop: '8px',
                            }}
                        >
                            <Link
                                to="/"
                                className="btn"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: '1px solid var(--border)',
                                    padding: '12px 24px',
                                    borderRadius: 'var(--radius-full)',
                                    color: 'var(--text-primary)',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                <ArrowLeft size={16} /> Back to Home
                            </Link>
                            <Link
                                to="/#contact"
                                className="btn"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'linear-gradient(135deg, #B08968 0%, #8B6545 100%)',
                                    padding: '12px 24px',
                                    borderRadius: 'var(--radius-full)',
                                    color: '#FAFAFA',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Contact Us
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </>
    )
}
