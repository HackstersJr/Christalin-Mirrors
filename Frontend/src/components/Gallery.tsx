import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StaggerContainer, StaggerItem } from './Animations'
import { SERVICE_IMAGES, BRANCH_IMAGES } from '../data/assets'
import './Gallery.css'

type Tab = 'all' | 'services' | 'branches'

export default function Gallery() {
    const [activeTab, setActiveTab] = useState<Tab>('all')
    const [visibleCount, setVisibleCount] = useState(8)

    // Interleave arrays for 'all' tab
    const allImages: { src: string; type: 'services' | 'branches' }[] = []
    const maxLen = Math.max(SERVICE_IMAGES.length, BRANCH_IMAGES.length)
    for (let i = 0; i < maxLen; i++) {
        if (i < SERVICE_IMAGES.length) allImages.push({ src: SERVICE_IMAGES[i], type: 'services' })
        if (i < BRANCH_IMAGES.length) allImages.push({ src: BRANCH_IMAGES[i], type: 'branches' })
    }

    const getFilteredImages = () => {
        if (activeTab === 'services') return SERVICE_IMAGES.map(src => ({ src, type: 'services' }))
        if (activeTab === 'branches') return BRANCH_IMAGES.map(src => ({ src, type: 'branches' }))
        return allImages
    }

    const currentImages = getFilteredImages()
    const displayedImages = currentImages.slice(0, visibleCount)

    return (
        <section className="gallery section" id="gallery">
            <div className="container">
                <StaggerContainer className="gallery-header">
                    <StaggerItem>
                        <p className="section-label">Our Work</p>
                    </StaggerItem>
                    <StaggerItem>
                        <h2 className="gallery-heading">Gallery</h2>
                    </StaggerItem>
                    <StaggerItem>
                        <p className="gallery-sub">A curated showcase of our artistry and aesthetic spaces</p>
                    </StaggerItem>
                </StaggerContainer>

                <div className="services-tabs" style={{ marginBottom: 40 }}>
                    <button className={`services-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => { setActiveTab('all'); setVisibleCount(8); }}>All</button>
                    <button className={`services-tab ${activeTab === 'services' ? 'active' : ''}`} onClick={() => { setActiveTab('services'); setVisibleCount(8); }}>Services</button>
                    <button className={`services-tab ${activeTab === 'branches' ? 'active' : ''}`} onClick={() => { setActiveTab('branches'); setVisibleCount(8); }}>Branches</button>
                </div>

                <div className="gallery-masonry">
                    <AnimatePresence mode="popLayout">
                        {displayedImages.map((img) => (
                            <motion.div 
                                key={img.src}
                                className="gallery-item"
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                            >
                                <img src={img.src} alt="Gallery" loading="lazy" />
                                <div className="gallery-item-overlay">
                                    <span className="gallery-item-label">{img.type === 'services' ? 'Service' : 'Branch'}</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {visibleCount < currentImages.length && (
                    <div className="gallery-load-more">
                        <button className="gallery-load-btn" onClick={() => setVisibleCount(prev => prev + 8)}>
                            Load More
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}
