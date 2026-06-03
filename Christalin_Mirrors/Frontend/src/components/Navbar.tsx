import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Menu, X } from 'lucide-react'
import cmLogo from '../assets/cm-logo-white.png'
import './Navbar.css'

interface NavbarProps {
    theme: 'dark' | 'light'
    toggleTheme: () => void
    isAppLoading?: boolean
}

export default function Navbar({ theme, toggleTheme, isAppLoading }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navLinks = [
        { label: 'About Us', href: '#about' },
        { label: 'Services', href: '#services' },
        { label: 'Gallery', href: '#gallery' },
        { label: 'Contacts', href: '#contact' },
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
                    {/* Left Side Links */}
                    <motion.ul
                        className="navbar-links left"
                        animate={{ opacity: isAppLoading ? 0 : 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                    >
                        {navLinks.slice(0, 2).map(link => (
                            <li key={link.href}>
                                <a
                                    href={link.href}
                                    className="navbar-link"
                                    onClick={(e) => { e.preventDefault(); scrollTo(link.href) }}
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </motion.ul>

                    {/* Centered Logo Container */}
                    <div className="navbar-logo-container">
                        {!isAppLoading && scrolled && (
                            <motion.a
                                href="#"
                                className="navbar-logo"
                                onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                layoutId="main-logo"
                                transition={{
                                    type: "spring",
                                    stiffness: 70,
                                    damping: 24,
                                    mass: 1.2
                                }}
                            >
                                <img src={cmLogo} alt="CM" className="navbar-logo-img" />
                            </motion.a>
                        )}
                    </div>

                    {/* Right Side Links & Actions */}
                    <div className="navbar-actions-group">
                        <motion.ul
                            className="navbar-links right"
                            animate={{ opacity: isAppLoading ? 0 : 1 }}
                            transition={{ delay: 1, duration: 0.5 }}
                        >
                            {navLinks.slice(2).map(link => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        className="navbar-link"
                                        onClick={(e) => { e.preventDefault(); scrollTo(link.href) }}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </motion.ul>

                        <motion.div
                            className="navbar-actions"
                            animate={{ opacity: isAppLoading ? 0 : 1 }}
                            transition={{ delay: 1, duration: 0.5 }}
                        >
                            <button
                                className="theme-toggle"
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            <a href="#contact" className="navbar-cta desktop-only" onClick={(e) => { e.preventDefault(); scrollTo('#contact') }}>
                                Book Appointment
                            </a>

                            <button
                                className="navbar-menu-btn"
                                onClick={() => setMobileOpen(true)}
                                aria-label="Open menu"
                            >
                                <Menu size={24} />
                            </button>
                        </motion.div>
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
                            Book Appointment
                        </motion.a>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
