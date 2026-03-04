import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StaggerContainer, StaggerItem } from './Animations'
import { Sparkles } from 'lucide-react'
import featuredImg from '../assets/featured-service.png'
import './Services.css'

type Category = 'all' | 'hair' | 'skin' | 'korean' | 'bridal' | 'mens'

interface ServiceItem {
    name: string
    tag: string
    category: Category
    isKorean?: boolean
}

const services: ServiceItem[] = [
    // Hair
    { name: 'Precision Haircut', tag: 'U/V layer cut, advance creative cuts & kids styling', category: 'hair' },
    { name: 'Wash & Styling', tag: 'Wash, blast dry, conditioning & ironing', category: 'hair' },
    { name: 'Hair Color Studio', tag: 'Root touch up, global color, fashion shades & highlights', category: 'hair' },
    { name: 'Balayage', tag: 'Hand-painted natural gradients with premium colors', category: 'hair' },
    { name: 'Keratin & Smoothing', tag: 'Frizz-free finish with keratin, botox & nano plastia', category: 'hair' },
    { name: 'Nourishing Hair Spa', tag: 'Deep repair with Ola Plex, 3tenx & scalp therapy', category: 'hair' },
    // Skin & Beauty
    { name: 'Glass Skin Facials', tag: 'Hydra aloe, K elite glow & Korean glass skin hydra facial', category: 'skin', isKorean: true },
    { name: 'Skin Therapy', tag: 'Classic glow, anti-aging, acne defense & bridal radiance facials', category: 'skin' },
    { name: 'Essential Skin Cleanup', tag: 'Deep pore detox, radiant white & hydra cleanup', category: 'skin' },
    { name: 'Even Tone Therapy', tag: 'DTAN & lighting (bleach) for full body, face & arms', category: 'skin' },
    { name: 'Signature Threading', tag: 'Full face, eyebrows, upper lip & forehead', category: 'skin' },
    { name: 'Body Waxing', tag: 'Half/full arms, legs, back, brazilian & full body wax', category: 'skin' },
    { name: 'Manicure & Pedicure', tag: 'Classic, bomb, spa & herbal botanical treatments', category: 'skin' },
    { name: 'Nail Art & Extensions', tag: 'Gel polish, acrylic & gel extensions, custom nail art', category: 'skin' },
    { name: 'Wellness Massage', tag: 'Body massage, foot/back/hand, body scrub & body polish', category: 'skin' },
    // Korean Rituals
    { name: 'Deep Cleanse Revive', tag: 'Purifying scalp detox with K-beauty ingredients', category: 'korean', isKorean: true },
    { name: 'Hydra Calm Restore', tag: 'Deep hydration ritual for stressed, dry scalps', category: 'korean', isKorean: true },
    { name: 'Scalp Renewal Detox', tag: 'Advanced detoxification for scalp rejuvenation', category: 'korean', isKorean: true },
    { name: 'Ultimate K-Glow Ritual', tag: 'The pinnacle of Korean scalp and hair therapy', category: 'korean', isKorean: true },
    { name: 'K Elite Glow Facial', tag: 'Premium Korean routine for long-lasting brightness', category: 'korean', isKorean: true },
    { name: 'Korean Glass Skin Facial', tag: 'Where Korean skin science meets restorative hydration', category: 'korean', isKorean: true },
    // Bridal
    { name: 'Engagement Look', tag: 'Pre-wedding styling with premium makeup', category: 'bridal' },
    { name: 'Luxury Bridal Makeover', tag: 'MAC, Laura Mercier, Huda Beauty & Fenty options', category: 'bridal' },
    { name: 'HD & Airbrush Makeup', tag: 'High definition camera-ready bridal perfection', category: 'bridal' },
    { name: 'Saree Draping & Hair', tag: 'Professional draping with bespoke hair styling', category: 'bridal' },
    { name: 'Party Makeup', tag: 'Basic party, pro, MAC & HD makeup for any occasion', category: 'bridal' },
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
    { label: 'Bridal', value: 'bridal' },
    { label: "Men's", value: 'mens' },
]

export default function Services() {
    const [active, setActive] = useState<Category>('all')

    const filtered = active === 'all' ? services : services.filter(s => s.category === active)

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
                            From classic grooming to advanced Korean beauty rituals — every service is a curated experience.
                        </p>
                    </StaggerItem>
                </StaggerContainer>

                {/* Featured service — Korean Head Spa */}
                <motion.div
                    className="featured-service korean-featured"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="featured-service-image">
                        <img src={featuredImg} alt="Korean Head Spa Rituals" loading="lazy" />
                    </div>
                    <div className="featured-service-content">
                        <span className="featured-badge">
                            <Sparkles size={12} style={{ marginRight: 6, display: 'inline' }} />
                            Signature Experience
                        </span>
                        <h3 className="featured-service-name">Korean Head Spa Rituals</h3>
                        <p className="featured-service-desc">
                            Immerse yourself in our signature K-beauty head spa experience — a luxurious journey
                            combining deep cleansing, hydra restoration, scalp renewal, and the ultimate K-Glow
                            ritual. Designed to rejuvenate both scalp and soul.
                        </p>
                        <div className="featured-service-meta">
                            <span className="featured-service-tag">K-Beauty</span>
                            <span className="featured-service-tag">Head Spa</span>
                            <span className="featured-service-tag">Premium</span>
                        </div>
                    </div>
                </motion.div>

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
