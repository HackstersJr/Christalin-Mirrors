import { Instagram, Mail, Phone, ArrowRight } from 'lucide-react'
import './Footer.css'

import { Link, useNavigate } from 'react-router-dom'

export default function Footer() {
    const currentYear = new Date().getFullYear()
    const navigate = useNavigate()

    const scrollTo = (href: string) => {
        const el = document.querySelector(href)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
        } else {
            window.location.href = '/' + href
        }
    }

    return (
        <footer className="footer" id="footer">
            <div className="container">
                <div className="footer-inner">
                    {/* Brand */}
                    <div>
                        <div className="footer-brand-name">Christalin Mirrors</div>
                        <div className="footer-brand-tagline">Refine &bull; Reflect &bull; Radiate</div>
                        <p className="footer-brand-desc">
                            A refined unisex salon combining skilled artistry with premium
                            products and personalised attention to help you radiate confidence
                            every day.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="footer-col-title">Navigate</h4>
                        <ul className="footer-col-list">
                            <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('#about') }}>About Us</a></li>
                            <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollTo('#services') }}>Services</a></li>
                            <li><a href="#gallery" onClick={(e) => { e.preventDefault(); scrollTo('#gallery') }}>Gallery</a></li>
                            <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo('#contact') }}>Contact</a></li>
                            <li><a href="https://mail.google.com/mail/?view=cm&fs=1&to=christalinmirrors.admin@gmail.com" target="_blank" rel="noopener noreferrer" className="footer-franchise-link">Franchise Enquiry</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="footer-col-title">Legal</h4>
                        <ul className="footer-col-list">
                            <li><Link to="/privacy" onClick={() => window.scrollTo(0,0)}>Privacy Policy</Link></li>
                            <li><Link to="/terms" onClick={() => window.scrollTo(0,0)}>Terms of Service</Link></li>
                        </ul>
                    </div>

                    {/* Locations */}
                    <div>
                        <h4 className="footer-col-title">Visit Us</h4>
                        <ul className="footer-col-list">
                            <li><strong>Bengaluru</strong></li>
                            <li>Century Ethos Club House</li>
                            <li>Bellary Rd, Bengaluru 560092</li>
                            <li style={{ marginTop: 12 }}><strong>Kalaburagi</strong></li>
                            <li>Orchid Mall, Mahaveer Nagar</li>
                            <li>Khuba Plot, Kalaburagi 585105</li>
                            <li style={{ marginTop: 12 }}>Everyday: 10 AM — 9 PM</li>
                        </ul>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="footer-bottom">
                    <span className="footer-copyright">
                        © {currentYear} Christalin Mirrors. All rights reserved.
                    </span>
                    <div className="footer-social-links">
                        <a href="https://www.instagram.com/christalin.mirrors/" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
                            <Instagram size={18} />
                        </a>
                        <a href="tel:+919900118383" className="footer-social-link" aria-label="Phone">
                            <Phone size={18} />
                        </a>
                        <a href="mailto:Support@christalinmirrors.com" className="footer-social-link" aria-label="Email">
                            <Mail size={18} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
