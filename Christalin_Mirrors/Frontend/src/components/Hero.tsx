import { motion } from 'framer-motion'
import { Instagram, ArrowDown } from 'lucide-react'
import { StaggerContainer, StaggerItem } from './Animations'
import heroImg from '../assets/hero.png'
import nordicImg from '../assets/collection-nordic.png'
import balayageImg from '../assets/collection-balayage.png'
import editorialImg from '../assets/collection-editorial.png'
import './Hero.css'

const collections = [
    { num: '01', name: 'Korean Head Spa', tag: 'K-Beauty Rituals', img: nordicImg },
    { num: '02', name: 'Bridal Elegance', tag: 'Luxury Makeovers', img: balayageImg },
    { num: '03', name: 'Colours Studio', tag: 'Balayage & Beyond', img: editorialImg },
]

export default function Hero() {
    return (
        <>
            {/* ─── Full-Viewport Hero ─── */}
            <section className="hero" id="hero">
                <div className="hero-image-wrapper">
                    <motion.img
                        src={heroImg}
                        alt="Christalin Mirrors — Refined Unisex Salon"
                        className="hero-image"
                        initial={{ scale: 1.15 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                    <div className="hero-overlay" />
                </div>

                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h1 className="hero-title">
                        Christalin<br />
                        <span className="hero-title-accent">Mirrors</span>
                    </h1>
                    <p className="hero-tagline">
                        Refine &bull; Reflect &bull; Radiate
                    </p>
                    <div className="hero-cta-row">
                        <a href="#contact" className="btn btn-primary" onClick={(e) => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }) }}>
                            Book Appointment
                        </a>
                        <a href="#services" className="btn btn-outline" style={{ borderColor: 'rgba(250,250,250,0.3)', color: '#FAFAFA' }} onClick={(e) => { e.preventDefault(); document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' }) }}>
                            Explore Services
                        </a>
                    </div>
                </motion.div>

                <div className="hero-scroll-indicator">
                    <span>Scroll</span>
                    <div className="scroll-line" />
                    <ArrowDown size={14} />
                </div>
            </section>

            {/* ─── Intro Section ─── */}
            <section className="hero-intro">
                <StaggerContainer className="container hero-intro-inner">
                    <StaggerItem>
                        <h2 className="hero-intro-heading">
                            Where beauty & grooming become personal journeys
                        </h2>
                    </StaggerItem>
                    <StaggerItem>
                        <div className="hero-intro-text">
                            <p>
                                Christalin Mirrors is a refined unisex salon, created for individuals who
                                appreciate quality, comfort, and elevated grooming experiences. We offer
                                expert hair, skin, and beauty services for both women and men, combining
                                skilled artistry with premium products and personalised attention.
                            </p>
                            <p>
                                From classic grooming to advanced Korean beauty treatments, we focus on
                                enhancing your natural features while maintaining the integrity of hair
                                and skin.
                            </p>
                        </div>
                    </StaggerItem>
                </StaggerContainer>
            </section>

            {/* ─── Collections ─── */}
            <section className="hero-collections">
                <div className="container">
                    <div className="collections-header">
                        <span className="collections-label">Signature Collections</span>
                        <div className="collections-line" />
                        <span className="collections-count">03 Specialties</span>
                    </div>

                    <StaggerContainer className="collections-grid">
                        {collections.map((col) => (
                            <StaggerItem key={col.num}>
                                <div className="collection-card">
                                    <img src={col.img} alt={col.name} loading="lazy" />
                                    <div className="collection-card-overlay">
                                        <span className="collection-number">{col.num}</span>
                                        <span className="collection-name">{col.name}</span>
                                        <span className="collection-tag">{col.tag}</span>
                                    </div>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* ─── Social Strip ─── */}
            <div className="hero-social-strip">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link">
                    <Instagram size={16} />
                    Instagram
                </a>
                <a href="tel:+917204236981" className="social-link">Call Us</a>
                <a href="#services" className="social-link" onClick={(e) => { e.preventDefault(); document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' }) }}>Our Services</a>
            </div>
        </>
    )
}
