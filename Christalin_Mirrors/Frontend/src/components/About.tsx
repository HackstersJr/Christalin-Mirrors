import { motion } from 'framer-motion'
import { StaggerContainer, StaggerItem } from './Animations'
import aboutImg from '../assets/about-salon.png'
import './About.css'

const stats = [
    { number: '200+', label: 'Happy Clients' },
    { number: '5', label: 'Branches' },
    { number: '15+', label: 'Expert Stylists' },
    { number: '12+', label: 'Years Experience' },
]

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
                        <img src={aboutImg} alt="CM Salon Interior" className="about-image" loading="lazy" />
                    </motion.div>

                    {/* Text */}
                    <StaggerContainer>
                        <StaggerItem>
                            <p className="section-label about-label">Our Story</p>
                        </StaggerItem>
                        <StaggerItem>
                            <h2 className="about-heading">The Story of CM</h2>
                        </StaggerItem>
                        <StaggerItem>
                            <p className="about-text">
                                Born from a passion for artistry and self-expression, Christalin Mirrors began
                                with a single vision — to create a space where beauty meets individuality. From
                                our roots in Kalaburagi to our growing presence across Karnataka, every salon is
                                a studio of transformation.
                            </p>
                        </StaggerItem>
                        <StaggerItem>
                            <p className="about-text">
                                Our master stylists blend international techniques with a deep understanding of
                                Indian hair textures and trends. We don't just style hair — we craft confidence,
                                one look at a time.
                            </p>
                        </StaggerItem>
                    </StaggerContainer>
                </div>

                {/* Stats Row */}
                <StaggerContainer className="about-stats">
                    {stats.map(stat => (
                        <StaggerItem key={stat.label}>
                            <div className="about-stat">
                                <div className="about-stat-number">{stat.number}</div>
                                <div className="about-stat-label">{stat.label}</div>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    )
}
