import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Menu, X } from 'lucide-react'
import sunProLogo from '../assets/Logo/Logo.png'
import './Navbar.css'

interface NavbarProps {
    theme: 'dark' | 'light'
    toggleTheme: () => void
    isAppLoading?: boolean
    scrolled: boolean
}

export default function Navbar({ theme, toggleTheme, isAppLoading, scrolled }: NavbarProps) {
    const [mobileOpen, setMobileOpen] = useState(false)

    const navLinks = [
        { label: 'Home', href: '#home' },
        { label: 'What We Do', href: '#what-we-do' },
        { label: 'Partnerships', href: '#partnerships' },
        { label: 'Why Choose Us', href: '#why-choose-us' },
        { label: 'Contact', href: '#contact' },
    ]

    const scrollTo = (href: string) => {
        setMobileOpen(false)
        const el = document.querySelector(href)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <>
            <motion.nav
                className={`navbar ${scrolled ? 'scrolled' : ''} ${isAppLoading ? 'loading' : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="navbar-inner">
                    {/* Left Group */}
                    <div className="nav-group nav-left desktop-only-flex">
                        {navLinks.slice(0, 3).map(link => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="navbar-link"
                                onClick={(e) => { e.preventDefault(); scrollTo(link.href) }}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Center Logo Area */}
                    <div className="nav-center">
                        <AnimatePresence>
                            {scrolled && (
                                <motion.a
                                    href="#"
                                    className="navbar-logo-center"
                                    onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                    layoutId="hero-logo"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 120,
                                        damping: 24,
                                        mass: 1
                                    }}
                                >
                                    <img src={sunProLogo} alt="Sun Pro" className="navbar-logo-img" />
                                </motion.a>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Group & Actions */}
                    <div className="nav-group nav-right">
                        <div className="nav-links-right desktop-only-flex">
                            {navLinks.slice(3).map(link => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="navbar-link"
                                    onClick={(e) => { e.preventDefault(); scrollTo(link.href) }}
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>

                        <div className="navbar-actions">
                            <button
                                className="theme-toggle"
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            <a href="#contact" className="navbar-cta desktop-only" onClick={(e) => { e.preventDefault(); scrollTo('#contact') }}>
                                Consultation
                            </a>

                            <button
                                className="navbar-menu-btn"
                                onClick={() => setMobileOpen(true)}
                                aria-label="Open menu"
                            >
                                <Menu size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.nav>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        className="navbar-mobile-overlay open"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <button className="mobile-close-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                            <X size={28} />
                        </button>
                        {navLinks.map((link, i) => (
                            <motion.a
                                key={link.href}
                                href={link.href}
                                className="navbar-link"
                                onClick={(e) => { e.preventDefault(); scrollTo(link.href) }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.4 }}
                            >
                                {link.label}
                            </motion.a>
                        ))}
                        <motion.a
                            href="#contact"
                            className="navbar-cta"
                            onClick={(e) => { e.preventDefault(); scrollTo('#contact') }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                        >
                            Consultation
                        </motion.a>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
