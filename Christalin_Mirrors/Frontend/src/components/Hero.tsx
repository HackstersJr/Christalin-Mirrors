import { motion } from 'framer-motion'
import { Instagram, ArrowDown } from 'lucide-react'
import { StaggerContainer, StaggerItem } from './Animations'
import heroImg from '../assets/hero.png'
import nordicImg from '../assets/collection-nordic.png'
import balayageImg from '../assets/collection-balayage.png'
import editorialImg from '../assets/collection-editorial.png'
import './Hero.css'

const collections = [
    { num: '01', name: 'Nordic Minimal', tag: 'Precision Cut', img: nordicImg },
    { num: '02', name: 'Bespoke Balayage', tag: 'Color Art', img: balayageImg },
    { num: '03', name: 'The Editorial Cut', tag: 'Avant-Garde', img: editorialImg },
]

export default function Hero() {
    return (
        <>
            {/* ─── Full-Viewport Hero ─── */}
            <section className="hero" id="hero">
                <div className="hero-image-wrapper">
                    <motion.img
                        src={heroImg}
                        alt="CM Hair Salon — Editorial Portrait"
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
                        HAIR<br />
                        <span className="hero-title-accent">SALON</span>
                    </h1>
                    <p className="hero-tagline">
                        Where artistry meets precision. Crafting signature looks that define individuality.
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
                            We help create moments of beauty for you and your style
                        </h2>
                    </StaggerItem>
                    <StaggerItem>
                        <div className="hero-intro-text">
                            <p>
                                At CM Hair Salon, we believe hair is an art form — a bold expression of who you are.
                                Our master stylists blend global trends with personalized artistry to craft looks
                                that feel uniquely, authentically you.
                            </p>
                            <p>
                                From precision cuts to bespoke color treatments, every service is a curated
                                experience designed to elevate not just your style, but your confidence.
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
                        <span className="collections-count">03 Looks</span>
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
                <a href="#" className="social-link">Pinterest</a>
                <a href="#" className="social-link">Vogue Portfolio</a>
            </div>
        </>
    )
}
