import { motion } from 'framer-motion'
import { StaggerContainer, StaggerItem } from './Animations'
import founderImg from '../assets/founder.jpeg'
import './FoundersNote.css'

export default function FoundersNote() {
    return (
        <section className="founders-note-section" id="founders-note">
            <div className="container">
                <StaggerContainer className="founders-note-inner">
                    {/* Text Side */}
                    <StaggerItem>
                        <div className="founders-note-text-side">
                            <h2 className="founders-note-title">Founder's<br />Note</h2>

                            <div className="founders-note-quote-open">&ldquo;</div>

                            <h3 className="founders-note-name">
                                I am<br />Sushmitha<br />Cristalin A.
                            </h3>

                            <div className="founders-note-body">
                                <p>
                                    My journey in the beauty industry has been guided by passion,
                                    perseverance, and a deep belief in standing confidently in my own
                                    identity guided by values instilled in me early on.
                                </p>
                                <p>
                                    Before creating a brand of my own, I spent several formative years
                                    learning from within the professional salon space—building a strong
                                    foundation in discipline, service standards, and the responsibility
                                    that comes with earning a client's trust. These experiences shaped
                                    my respect for consistency and the intimate role beauty plays in confidence.
                                </p>
                                <p>
                                    As my perspective evolved, I later associated with a Hyderabad-based
                                    salon brand, contributing to its growth alongside trusted collaborators.
                                    This phase refined my understanding of leadership and scale, and clarified
                                    what mattered most to me: integrity, refinement, and thoughtfully crafted
                                    experiences over volume.
                                </p>
                                <p>
                                    With the encouragement of friends, family, and loyal clients, that shared
                                    trust gave shape to Christalin Mirrors—a brand built on experience,
                                    intention, and care.
                                </p>
                                <p>
                                    Christalin Mirrors is more than a salon; it is a reflection of skill,
                                    empowerment, and quiet confidence—guided by thoughtful growth and an
                                    unwavering commitment to excellence.
                                </p>
                            </div>

                            <div className="founders-note-sign-off">
                                <p className="founders-note-gratitude">With gratitude,</p>
                                <p className="founders-note-signature">Sushmitha Cristalin A.</p>
                            </div>

                            <div className="founders-note-quote-close">&rdquo;</div>
                        </div>
                    </StaggerItem>

                    {/* Image Side */}
                    <StaggerItem className="founders-note-image-side" xOffset={40} yOffset={0}>
                        <img src={founderImg} alt="Sushmitha Cristalin A." className="founders-note-image" />
                    </StaggerItem>
                </StaggerContainer>
            </div>
        </section>
    )
}
