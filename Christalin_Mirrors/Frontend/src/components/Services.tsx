import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StaggerContainer, StaggerItem } from './Animations'
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import featuredService1 from '../assets/featured-service.png'
import featuredService2 from '../assets/collection-editorial.png'
import featuredService3 from '../assets/collection-balayage.png'
import featuredService4 from '../assets/gallery-1.png'
import featuredService5 from '../assets/gallery-4.png'
import './Services.css'

type Category = 'all' | 'hair' | 'skin' | 'korean' | 'womens' | 'mens'

interface ServiceItem {
    name: string
    tag: string
    category: Category
    isKorean?: boolean
}

const services: ServiceItem[] = [
    // Hair (Unisex)
    { name: 'Precision Haircut', tag: 'U/V layer cut, advance creative cuts & kids styling', category: 'hair' },
    { name: 'Wash & Styling', tag: 'Wash, blast dry, conditioning & ironing', category: 'hair' },
    { name: 'Hair Color Studio', tag: 'Root touch up, global color, fashion shades & highlights', category: 'hair' },
    { name: 'Balayage', tag: 'Hand-painted natural gradients with premium colors', category: 'hair' },
    { name: 'Keratin & Smoothing', tag: 'Frizz-free finish with keratin, botox & nano plastia', category: 'hair' },
    { name: 'Nourishing Hair Spa', tag: 'Deep repair with Ola Plex, 3tenx & scalp therapy', category: 'hair' },
    // Skin & Beauty (Unisex)
    { name: 'Glass Skin Facials', tag: 'Hydra aloe, K elite glow & Korean glass skin hydra facial', category: 'skin', isKorean: true },
    { name: 'Skin Therapy', tag: 'Classic glow, anti-aging, acne defense & bridal radiance facials', category: 'skin' },
    { name: 'Essential Skin Cleanup', tag: 'Deep pore detox, radiant white & hydra cleanup', category: 'skin' },
    { name: 'Even Tone Therapy', tag: 'DTAN & lighting (bleach) for full body, face & arms', category: 'skin' },
    { name: 'Wellness Massage', tag: 'Body massage, foot/back/hand, body scrub & body polish', category: 'skin' },
    // Korean Rituals (Unisex)
    { name: 'Deep Cleanse Revive', tag: 'Purifying scalp detox with K-beauty ingredients', category: 'korean', isKorean: true },
    { name: 'Hydra Calm Restore', tag: 'Deep hydration ritual for stressed, dry scalps', category: 'korean', isKorean: true },
    { name: 'Scalp Renewal Detox', tag: 'Advanced detoxification for scalp rejuvenation', category: 'korean', isKorean: true },
    { name: 'Ultimate K-Glow Ritual', tag: 'The pinnacle of Korean scalp and hair therapy', category: 'korean', isKorean: true },
    { name: 'K Elite Glow Facial', tag: 'Premium Korean routine for long-lasting brightness', category: 'korean', isKorean: true },
    { name: 'Korean Glass Skin Facial', tag: 'Where Korean skin science meets restorative hydration', category: 'korean', isKorean: true },
    // Women's
    { name: 'Engagement Look', tag: 'Pre-wedding styling with premium makeup', category: 'womens' },
    { name: 'Luxury Bridal Makeover', tag: 'MAC, Laura Mercier, Huda Beauty & Fenty options', category: 'womens' },
    { name: 'HD & Airbrush Makeup', tag: 'High definition camera-ready bridal perfection', category: 'womens' },
    { name: 'Saree Draping & Hair', tag: 'Professional draping with bespoke hair styling', category: 'womens' },
    { name: 'Party Makeup', tag: 'Basic party, pro, MAC & HD makeup for any occasion', category: 'womens' },
    { name: 'Signature Threading', tag: 'Full face, eyebrows, upper lip & forehead', category: 'womens' },
    { name: 'Body Waxing', tag: 'Half/full arms, legs, back, brazilian & full body wax', category: 'womens' },
    { name: 'Manicure & Pedicure', tag: 'Classic, bomb, spa & herbal botanical treatments', category: 'womens' },
    { name: 'Nail Art & Extensions', tag: 'Gel polish, acrylic & gel extensions, custom nail art', category: 'womens' },
    // Men's
    { name: 'Classic & Creative Cuts', tag: 'Wash & blast dry, head shave, and creative haircuts', category: 'mens' },
    { name: 'Beard Grooming', tag: 'Beard trim, shave, beard colour & moustache colour', category: 'mens' },
    { name: "Men's Hair Treatments", tag: 'Keratin, smoothening & botox for men', category: 'mens' },
    { name: "Men's Hair Colouring", tag: 'Streaks, side locks color & global ammonia-free color', category: 'mens' },
]

const tabs: { label: string; value: Category; highlight?: boolean }[] = [
    { label: 'All', value: 'all' },
    { label: 'Hair', value: 'hair' },
    { label: 'Skin & Beauty', value: 'skin' },
    { label: 'Korean Rituals', value: 'korean', highlight: true },
    { label: "Women's", value: 'womens' },
    { label: "Men's", value: 'mens' },
]

// Featured services for the horizontal scroll cards
const featuredServices = [
    {
        name: 'Korean Head Spa Rituals',
        badge: 'Signature Experience',
        desc: 'Immerse yourself in our signature K-beauty head spa experience — a luxurious journey combining deep cleansing, hydra restoration, scalp renewal, and the ultimate K-Glow ritual. Designed to rejuvenate both scalp and soul.',
        tags: ['K-Beauty', 'Head Spa', 'Premium'],
        isKorean: true,
        image: featuredService1
    },
    {
        name: 'Luxury Bridal Makeover',
        badge: 'Bridal Exclusive',
        desc: 'Complete bridal transformation combining high-definition HD or Airbrush makeup, professional hair styling, intricate saree draping, and essential skincare prep tailored for your perfect day.',
        tags: ['Bridal', 'Makeup', 'Styling'],
        isKorean: false,
        image: featuredService2
    },
    {
        name: 'Balayage & Color Mastery',
        badge: 'Trending',
        desc: 'Expert hand-painted natural gradients and sun-kissed looks created with premium ammonia-free colors. Express your unique style with fashion shades and meticulously crafted creative highlights.',
        tags: ['Color', 'Balayage', 'Creative'],
        isKorean: false,
        image: featuredService3
    },
    {
        name: 'Glass Skin Facial',
        badge: 'K-Beauty Ritual',
        desc: 'Achieve the coveted flawless glass skin glow with our signature Korean hydra facial protocol. Utilizing premium imported serums and advanced restorative hydration techniques to deeply nourish your skin.',
        tags: ['Korean', 'Facial', 'Glow'],
        isKorean: true,
        image: featuredService4
    },
    {
        name: "Men's Premium Grooming Suite",
        badge: 'For Him',
        desc: 'The complete elevated men\'s experience. Precision creative cuts, master beard sculpting, smoothing keratin treatments, and premium hair coloring, all delivered in a refined environment.',
        tags: ['Grooming', 'Cuts', 'Beard'],
        isKorean: false,
        image: featuredService5
    },
]

export default function Services() {
    const [active, setActive] = useState<Category>('all')
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
                                    <img src={svc.image} alt={svc.name} loading="lazy" />
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
                            onClick={() => setActive(tab.value)}
                        >
                            {tab.highlight && <Sparkles size={12} />}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Services Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        className="services-grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
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
                </AnimatePresence>
            </div>
        </section>
    )
}
