import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StaggerContainer, StaggerItem } from './Animations'
import { ABOUT_IMAGE } from '../data/assets'
import './About.css'

export default function About() {
    const [showMore, setShowMore] = useState(false)

    return (
        <section className="about section" id="about">
            <div className="container">
                <div className="about-inner">
                    {/* Image */}
                    <StaggerItem className="about-image-wrapper" xOffset={-40} yOffset={0}>
                        <img src={ABOUT_IMAGE} alt="Christalin Mirrors Salon" className="about-image" loading="lazy" />
                    </StaggerItem>

                    {/* Text */}
                    <StaggerContainer>
                        <StaggerItem>
                            <p className="section-label about-label">About Us</p>
                        </StaggerItem>
                        <StaggerItem>
                            <h2 className="about-heading">A Refined Unisex Salon</h2>
                        </StaggerItem>
                        <StaggerItem>
                            <p className="about-text">
                                <strong>Christalin Mirrors</strong> is a refined unisex salon, created for individuals who
                                appreciate quality, comfort, and elevated grooming experiences. We offer
                                expert hair, skin, and beauty services for both women and men, combining
                                skilled artistry with premium products and personalised attention. Our
                                space is thoughtfully designed to feel calm, welcoming, and sophisticated,
                                where every client is treated with care and precision.
                            </p>
                        </StaggerItem>
                        <AnimatePresence>
                            {showMore && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <StaggerItem>
                                        <p className="about-text">
                                            At Christalin Mirrors, we believe beauty and grooming are personal journeys.
                                            Our goal is to refine your look, reflect your individuality, and help you
                                            radiate confidence every day.
                                        </p>
                                    </StaggerItem>
                                    <StaggerItem>
                                        <div className="founder-note">
                                            <p className="founder-label">Founder</p>
                                            <p className="founder-name">Sushmitha Cristalin A.</p>
                                        </div>
                                    </StaggerItem>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <StaggerItem>
                            <button 
                                className="btn btn-outline" 
                                style={{ marginTop: '1rem', borderColor: 'var(--border)' }} 
                                onClick={() => setShowMore(!showMore)}
                            >
                                {showMore ? 'Read Less' : 'Read More'}
                            </button>
                        </StaggerItem>
                    </StaggerContainer>
                </div>
            </div>
        </section>
    )
}
