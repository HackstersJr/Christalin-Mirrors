import { Instagram, Mail, Phone, ArrowRight } from 'lucide-react'
import './Footer.css'

export default function Footer() {
    const currentYear = new Date().getFullYear()

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
                            <li><a href="#about" onClick={(e) => { e.preventDefault(); document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' }) }}>About Us</a></li>
                            <li><a href="#services" onClick={(e) => { e.preventDefault(); document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' }) }}>Services</a></li>
                            <li><a href="#gallery" onClick={(e) => { e.preventDefault(); document.querySelector('#gallery')?.scrollIntoView({ behavior: 'smooth' }) }}>Gallery</a></li>
                            <li><a href="#contact" onClick={(e) => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }) }}>Contact</a></li>
                            <li>
                                <a
                                    href="mailto:info@christalinmirrors.com?subject=Franchise%20Enquiry"
                                    className="footer-franchise-link"
                                >
                                    Franchise Enquiry
                                </a>
                            </li>
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

                    {/* Newsletter */}
                    <div>
                        <h4 className="footer-col-title">Stay Updated</h4>
                        <p className="footer-newsletter-desc">
                            Get styling tips, exclusive offers, and salon updates delivered to your inbox.
                        </p>
                        <form className="footer-newsletter-form" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                className="footer-newsletter-input"
                                placeholder="your@email.com"
                                aria-label="Email for newsletter"
                            />
                            <button type="submit" className="footer-newsletter-btn" aria-label="Subscribe">
                                <ArrowRight size={18} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="footer-bottom">
                    <span className="footer-copyright">
                        © {currentYear} Christalin Mirrors. All rights reserved.
                    </span>
                    <div className="footer-social-links">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
                            <Instagram size={18} />
                        </a>
                        <a href="tel:+917204236981" className="footer-social-link" aria-label="Phone">
                            <Phone size={18} />
                        </a>
                        {/* TODO: Replace with actual official email */}
                        <a href="mailto:info@christalinmirrors.com" className="footer-social-link" aria-label="Email">
                            <Mail size={18} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
