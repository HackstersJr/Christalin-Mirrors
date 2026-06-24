import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StaggerContainer, StaggerItem } from './Animations'
import { FOUNDER_IMAGE } from '../data/assets'
import { cld, cldSrcSet } from '../lib/cld'
import './FoundersNote.css'

export default function FoundersNote() {
    const [showMore, setShowMore] = useState(false)

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
                                    My journey in the beauty industry has been shaped by passion,
                                    perseverance, and purpose.
                                </p>
                                <p>
                                    My interest in this field began long before I formally stepped into
                                    the professional space. I was always attracted to the beauty sector
                                    from my college days and had always dreamt of a career in it.
                                </p>
                                <AnimatePresence>
                                    {showMore && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4 }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <p>
                                                My entry into this field began with the acquisition of one salon.
                                                Initially, I chose to gain hands-on experience by working closely
                                                with an established brand, where I spent several years understanding
                                                the fundamentals of salon operations and management.
                                            </p>
                                            <p>
                                                This phase allowed me to experience the industry from within—its
                                                strengths, its challenges, and the discipline required to build
                                                consistency, credibility and trust. It also allowed me to learn the
                                                expertise of successfully and professionally managing salons, the art
                                                of client retention, team leadership, estimating revenue growth,
                                                inventory management, business marketing and the other essentials
                                                which are mandatory to deliver in a highly competitive environment.
                                            </p>
                                            <p>
                                                The second phase of my journey began when I started taking a keener
                                                interest in the financial and administration part of the business.
                                                During this phase, I acquainted myself with learning the different
                                                work models of this business and varied management styles. The
                                                importance of expansion and the skill required for such was also a
                                                crucial development which I gained from this phase, which highlighted
                                                the value of co-operation, collaboration as well as competition.
                                            </p>
                                            <p>
                                                Along with growth, came development and I felt that the fruition of
                                                my childhood interest in this field should develop into something
                                                long lasting and worthwhile. Something which came from me, something
                                                created by me, something which reflected my values and my skills and
                                                something truly unique. I wanted to lay the foundation of my dreams
                                                in it and to ensure that it fulfills the dreams of others. I wanted
                                                to create beauty not just in a professional manner but I wanted to
                                                create beauty in a caring way as well. It was this dream that
                                                instilled in me a vision, a vision which became Christalin Mirrors—a
                                                brand built on experience, insight, and the intention to elevate
                                                everyday beauty through professionalism, consistency, excellence and
                                                most of all CARE.
                                            </p>
                                            <p>
                                                With the encouragement and belief of family, friends and thousands of
                                                loyal clients, my dream became reality. It is this reality that I now
                                                intend to take forward and make it a gift to everyone.
                                            </p>
                                            <p>
                                                As Christalin Mirrors continues to evolve, expand and fulfill the
                                                dreams of many, our core values remain the same: creating beauty
                                                through professionalism and CARE.
                                            </p>

                                            <div className="founders-note-sign-off" style={{ marginTop: '2rem' }}>
                                                <p className="founders-note-gratitude">With gratitude,</p>
                                                <p className="founders-note-signature">Sushmitha Cristalin A.</p>
                                                <p className="founders-note-gratitude" style={{ marginTop: '4px' }}>Founder, Christalin Mirrors</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button 
                                className="btn btn-outline" 
                                style={{ marginTop: '1.5rem', borderColor: 'var(--border)' }} 
                                onClick={() => setShowMore(!showMore)}
                            >
                                {showMore ? 'Read Less' : 'Read Full Note'}
                            </button>

                            <div className="founders-note-quote-close">&rdquo;</div>
                        </div>
                    </StaggerItem>

                    {/* Image Side */}
                    <StaggerItem className="founders-note-image-side" xOffset={40} yOffset={0}>
                        <img
                            src={cld(FOUNDER_IMAGE, 800)}
                            srcSet={cldSrcSet(FOUNDER_IMAGE, [400, 600, 800, 1000, 1280])}
                            sizes="(max-width: 768px) 90vw, 640px"
                            alt="Sushmitha Cristalin A."
                            className="founders-note-image"
                            loading="lazy"
                        />
                    </StaggerItem>
                </StaggerContainer>
            </div>
        </section>
    )
}
