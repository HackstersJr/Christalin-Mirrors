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
                    <StaggerItem className="about-image-wrapper" xOffset={-40} yOffset={0}>
                        <img src={aboutImg} alt="Christalin Mirrors Salon" className="about-image" loading="lazy" />
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
