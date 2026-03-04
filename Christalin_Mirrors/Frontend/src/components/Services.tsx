import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StaggerContainer, StaggerItem } from './Animations'
import featuredImg from '../assets/featured-service.png'
import './Services.css'

type Category = 'all' | 'haircuts' | 'body' | 'treatments'

interface ServiceItem {
    name: string
    tag: string
    price: string
    duration: string
    category: Category
}

const services: ServiceItem[] = [
    { name: 'Premium Cut', tag: 'Precision styling with consultation', price: '₹800', duration: '45 min', category: 'haircuts' },
    { name: 'Color & Highlights', tag: 'Full color or partial highlights', price: '₹2,500', duration: '90 min', category: 'treatments' },
    { name: 'Scalp Treatment', tag: 'Deep cleansing & nourishment', price: '₹1,200', duration: '60 min', category: 'body' },
    { name: 'Balayage', tag: 'Hand-painted natural gradients', price: '₹3,500', duration: '120 min', category: 'treatments' },
    { name: 'Keratin Smoothing', tag: 'Frizz-free, silky finish', price: '₹4,000', duration: '150 min', category: 'treatments' },
    { name: 'Bridal Package', tag: 'Trial + wedding day styling', price: '₹8,000', duration: '180 min', category: 'haircuts' },
    { name: 'Head Massage', tag: 'Relaxation & blood circulation', price: '₹600', duration: '30 min', category: 'body' },
    { name: 'Beard Grooming', tag: 'Shape, trim & conditioning', price: '₹500', duration: '30 min', category: 'haircuts' },
]

const tabs: { label: string; value: Category }[] = [
    { label: 'All', value: 'all' },
    { label: 'Haircuts', value: 'haircuts' },
    { label: 'Body Rituals', value: 'body' },
    { label: 'Hair Treatments', value: 'treatments' },
]

export default function Services() {
    const [active, setActive] = useState<Category>('all')

    const filtered = active === 'all' ? services : services.filter(s => s.category === active)

    return (
        <section className="services section" id="services">
            <div className="container">
                <StaggerContainer className="services-header">
                    <StaggerItem>
                        <p className="section-label">What We Do</p>
                    </StaggerItem>
                    <StaggerItem>
                        <h2 className="services-heading">Our Services</h2>
                    </StaggerItem>
                    <StaggerItem>
                        <p className="services-subtitle">
                            Every service is a curated experience, from consultation to final look.
                        </p>
                    </StaggerItem>
                </StaggerContainer>

                <div className="services-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.value}
                            className={`services-tab ${active === tab.value ? 'active' : ''}`}
                            onClick={() => setActive(tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Featured service */}
                <motion.div
                    className="featured-service"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="featured-service-image">
                        <img src={featuredImg} alt="The Signature Cut" loading="lazy" />
                    </div>
                    <div className="featured-service-content">
                        <span className="featured-badge">Featured</span>
                        <h3 className="featured-service-name">The Signature Cut</h3>
                        <p className="featured-service-desc">
                            Our signature experience — a bespoke consultation followed by a precision cut
                            tailored to your face shape, hair texture, and personal style. Includes wash,
                            styling, and custom hair care recommendations.
                        </p>
                        <div className="featured-service-meta">
                            <span className="featured-service-price">₹1,500</span>
                            <span className="featured-service-duration">60 MIN</span>
                        </div>
                    </div>
                </motion.div>

                {/* Pricing Grid */}
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
                                className="service-item"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.4 }}
                            >
                                <div className="service-info">
                                    <div className="service-name">{service.name}</div>
                                    <div className="service-tag">{service.tag}</div>
                                </div>
                                <div className="service-meta">
                                    <div className="service-price">{service.price}</div>
                                    <div className="service-duration">{service.duration}</div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    )
}
