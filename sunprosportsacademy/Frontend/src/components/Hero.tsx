import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import logo from '../assets/Logo/Logo.png'
import './Hero.css'

// Using a premium stadium glass architecture image as placeholder
const heroImg = 'https://images.unsplash.com/photo-1599735073323-1d643878b39a?q=80&w=2670&auto=format&fit=crop';

export default function Hero({ isAppLoading, isScrolled }: { isAppLoading?: boolean, isScrolled?: boolean }) {
    return (
        <section className="hero" id="home">
            <div className="hero-image-wrapper">
                <motion.img
                    src={heroImg}
                    alt="Modern Sports Infrastructure"
                    className="hero-image"
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                />
                <div className="hero-overlay" />
            </div>

            <motion.div
                className="hero-content container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <motion.div 
                    className="hero-badge"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <span className="dot" /> Premier Sports Infrastructure
                </motion.div>
                
                <h1 className="hero-title-container">
                    <div className="hero-title-split">
                        <div className="title-side title-left">
                            <span>Building</span>
                            <span>The</span>
                            <span>Future</span>
                        </div>
                        
                        <div className="hero-logo-center">
                            {!isScrolled && (
                                <motion.div 
                                    layoutId="hero-logo"
                                    transition={{
                                        type: "spring",
                                        stiffness: 120,
                                        damping: 24,
                                        mass: 1
                                    }}
                                    style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <img src={logo} alt="Sun Pro" />
                                </motion.div>
                            )}
                        </div>

                        <div className="title-side title-right">
                            <span className="text-gold">Sports</span>
                            <span className="text-gold">Infrastructure</span>
                        </div>
                    </div>
                </h1>
                
                <motion.p 
                    className="hero-description"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    Transforming university campuses into vibrant hubs of athletic excellence through state-of-the-art stadium development and multi-sport facility design.
                </motion.p>
                
                <motion.div 
                    className="hero-actions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <a href="#contact" className="btn btn-primary">
                        Request a Consultation <ChevronRight size={18} style={{ marginLeft: '8px' }} />
                    </a>
                    <a href="#what-we-do" className="btn btn-outline" style={{ marginLeft: '1rem' }}>
                        Our Services
                    </a>
                </motion.div>
            </motion.div>

            <div className="hero-scroll-indicator">
                <div className="mouse">
                    <div className="wheel" />
                </div>
                <span>Explore More</span>
            </div>
        </section>
    )
}
