                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            import { StaggerContainer, StaggerItem } from './Animations'
import gallery1 from '../assets/gallery-1.png'
import gallery2 from '../assets/gallery-2.png'
import gallery3 from '../assets/gallery-3.png'
import gallery4 from '../assets/gallery-4.png'
import gallery5 from '../assets/gallery-5.png'
import gallery6 from '../assets/gallery-6.png'
import './Gallery.css'

const galleryItems = [
    { img: gallery1, label: 'Glossy Waves' },
    { img: gallery2, label: 'Bridal Elegance' },
    { img: gallery3, label: 'Natural Curls' },
    { img: gallery4, label: 'Men\'s Grooming' },
    { img: gallery5, label: 'Creative Color' },
    { img: gallery6, label: 'K-Beauty Glow' },
]

export default function Gallery() {
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
                        <p className="gallery-sub">A curated showcase of our artistry</p>
                    </StaggerItem>
                </StaggerContainer>

                <StaggerContainer className="gallery-masonry">
                    {galleryItems.map((item) => (
                        <StaggerItem key={item.label}>
                            <div className="gallery-item">
                                <img src={item.img} alt={item.label} loading="lazy" />
                                <div className="gallery-item-overlay">
                                    <span className="gallery-item-label">{item.label}</span>
                                </div>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    )
}
