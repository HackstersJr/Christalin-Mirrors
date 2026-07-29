import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StaggerContainer, StaggerItem } from './Animations'
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { SERVICE_IMAGES } from '../data/assets'
import { cld, cldSrcSet } from '../lib/cld'
import { services, serviceTabs as tabs, type Category } from '../data/services'
import './Services.css'

// Featured services for the horizontal scroll cards
const featuredServices = [
    {
        name: 'Korean Head Spa Rituals',
        badge: 'Signature Experience',
        desc: 'Immerse yourself in our signature K-beauty head spa experience — a luxurious journey combining deep cleansing, hydra restoration, scalp renewal, and the ultimate K-Glow ritual. Designed to rejuvenate both scalp and soul.',
        tags: ['K-Beauty', 'Head Spa', 'Premium'],
        isKorean: true,
        image: SERVICE_IMAGES[0]
    },
    {
        name: 'Luxury Bridal Makeover',
        badge: 'Bridal Exclusive',
        desc: 'Complete bridal transformation combining high-definition HD or Airbrush makeup, professional hair styling, intricate saree draping, and essential skincare prep tailored for your perfect day.',
        tags: ['Bridal', 'Makeup', 'Styling'],
        isKorean: false,
        image: SERVICE_IMAGES[1]
    },
    {
        name: 'Balayage & Color Mastery',
        badge: 'Trending',
        desc: 'Expert hand-painted natural gradients and sun-kissed looks created with premium ammonia-free colors. Express your unique style with fashion shades and meticulously crafted creative highlights.',
        tags: ['Color', 'Balayage', 'Creative'],
        isKorean: false,
        image: SERVICE_IMAGES[2]
    },
    {
        name: 'Glass Skin Facial',
        badge: 'K-Beauty Ritual',
        desc: 'Achieve the coveted flawless glass skin glow with our signature Korean hydra facial protocol. Utilizing premium imported serums and advanced restorative hydration techniques to deeply nourish your skin.',
        tags: ['Korean', 'Facial', 'Glow'],
        isKorean: true,
        image: SERVICE_IMAGES[3]
    },
    {
        name: "Men's Premium Grooming Suite",
        badge: 'For Him',
        desc: 'The complete elevated men\'s experience. Precision creative cuts, master beard sculpting, smoothing keratin treatments, and premium hair coloring, all delivered in a refined environment.',
        tags: ['Grooming', 'Cuts', 'Beard'],
        isKorean: false,
        image: SERVICE_IMAGES[10]
    },
]

export default function Services() {
    const [active, setActive] = useState<Category>('korean')
    const [showAllServices, setShowAllServices] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const filtered = active === 'all' ? services : services.filter(s => s.category === active)

    const scroll = (dir: 'left' | 'right') => {
        if (scrollRef.current) {
            // Scroll by exactly one visible card width, accounting for the gap
            const cardWidth = scrollRef.current.clientWidth
            const gap = 18 // CSS gap value
            const amount = cardWidth + gap
            scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
        }
    }

    return (
        <section className="services section" id="services">
            <div className="container">
                <StaggerContainer className="services-header">
                    <StaggerItem>
                        <p className="section-label">What We Offer</p>
                    </StaggerItem>
                    <StaggerItem>
                        <h2 className="services-heading">Our Services</h2>
                    </StaggerItem>
                    <StaggerItem>
                        <p className="services-subtitle">
                            From classic grooming to advanced Korean beauty rituals — curated services for women and men.
                        </p>
                    </StaggerItem>
                </StaggerContainer>

                {/* Featured Services — Horizontal Scroll Cards */}
                <StaggerItem className="featured-scroll-wrapper">
                    <div className="featured-scroll-header">
                        <span className="featured-scroll-label">✦ Featured</span>
                    </div>
                    <div className="featured-carousel-container">
                        <button className="carousel-arrow arrow-left" onClick={() => scroll('left')} aria-label="Scroll left"><ChevronLeft size={24} /></button>
                        <button className="carousel-arrow arrow-right" onClick={() => scroll('right')} aria-label="Scroll right"><ChevronRight size={24} /></button>
                    <div className="featured-scroll-track" ref={scrollRef}>
                        {featuredServices.map((svc) => (
                            <div key={svc.name} className={`featured-scroll-card ${svc.isKorean ? 'korean-card' : ''}`}>
                                <div className="featured-scroll-image">
                                    <img
                                        src={cld(svc.image, 900)}
                                        srcSet={cldSrcSet(svc.image, [400, 600, 800, 1000, 1200])}
                                        sizes="(max-width: 768px) 90vw, 920px"
                                        alt={svc.name}
                                        loading="lazy"
                                    />
                                </div>
                                <div className="featured-scroll-content">
                                    <span className="featured-card-badge">
                                        {svc.isKorean && <Sparkles size={11} style={{ marginRight: 4 }} />}
                                        {svc.badge}
                                    </span>
                                    <h3 className="featured-card-name">{svc.name}</h3>
                                    <p className="featured-card-desc">{svc.desc}</p>
                                    <div className="featured-card-tags">
                                        {svc.tags.map(t => <span key={t} className="featured-card-tag">{t}</span>)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    </div>
                </StaggerItem>

                <div className="services-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.value}
                            className={`services-tab ${active === tab.value ? 'active' : ''} ${tab.highlight ? 'korean-tab' : ''}`}
                            onClick={() => {
                                setActive(tab.value)
                                setShowAllServices(false)
                            }}
                        >
                            {tab.highlight && <Sparkles size={12} />}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Services Grid */}
                <div className={`services-list-container ${showAllServices ? 'expanded' : ''}`}>
                    <motion.div
                        key={active}
                        className="services-grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {filtered.map((service, i) => (
                            <motion.div
                                key={service.name}
                                className={`service-item ${service.isKorean ? 'korean-item' : ''}`}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.4 }}
                            >
                                <div className="service-info">
                                    <div className="service-name">
                                        {service.isKorean && <Sparkles size={14} className="korean-icon" />}
                                        {service.name}
                                    </div>
                                    <div className="service-tag">{service.tag}</div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {filtered.length > 5 && (
                    <div className="services-show-more-mobile">
                        <button 
                            className="services-show-more-btn" 
                            onClick={() => setShowAllServices(!showAllServices)}
                        >
                            {showAllServices ? 'Show Less' : `Show All ${filtered.length} Services`}
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}
