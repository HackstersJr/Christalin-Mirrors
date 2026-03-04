import { motion } from 'framer-motion'
import { StaggerContainer, StaggerItem } from './Animations'
import aboutImg from '../assets/about-salon.png'
import './About.css'

export default function About() {
    return (
        <section className="about section" id="about">
            <div className="container">
                <div className="about-inner">
                    {/* Image */}
                    <motion.div
                        className="about-image-wrapper"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="about-image-ring" />
                        <img src={aboutImg} alt="Christalin Mirrors Salon" className="about-image" loading="lazy" />
                    </motion.div>

                    {/* Text */}
                    <StaggerContainer>
                        <StaggerItem>
                            <p className="section-label about-label">About Us</p>
                        </StaggerItem>
                        <StaggerItem>
                            <h2 className="about-heading">About Christalin Mirrors</h2>
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
                    </StaggerContainer>
                </div>
            </div>
        </section>
    )
}
