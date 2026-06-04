import { MapPin, Clock, Phone, ExternalLink, Navigation, Globe } from 'lucide-react'
import { StaggerContainer, StaggerItem } from './Animations'
import branchBengaluru from '../assets/branch-bengaluru.png'
import branchKalaburagi from '../assets/branch-kalaburagi.png'
import branchDubai from '../assets/branch-dubai.png'
import './Branches.css'

const branches = [
    {
        name: 'CM — Bengaluru',
        city: 'Bengaluru, Karnataka',
        address: 'Century Ethos Club House, Bellary Rd, Bengaluru 560092',
        hours: 'Everyday: 10:00 AM – 9:00 PM',
        phone: '+91 72042 36981',
        mapUrl: 'https://maps.google.com/?q=Century+Ethos+Club+House+Bellary+Road+Bengaluru',
        image: branchBengaluru,
    },
    {
        name: 'CM — Kalaburagi',
        city: 'Kalaburagi, Karnataka',
        address: 'Orchid Mall, Mahaveer Nagar, Khuba Plot, Brahmpur, Kalaburagi 585105',
        hours: 'Everyday: 10:00 AM – 9:00 PM',
        phone: '+91 XXXXX XXXXX', // TODO: Replace with actual phone number
        mapUrl: 'https://maps.google.com/?q=Orchid+Mall+Kalaburagi',
        image: branchKalaburagi,
    },
]

export default function Branches() {
    return (
        <section className="branches section" id="branches">
            <div className="container">
                <StaggerContainer className="branches-header">
                    <StaggerItem>
                        <p className="section-label">Find Us</p>
                    </StaggerItem>
                    <StaggerItem>
                        <h2 className="branches-heading">Our Locations</h2>
                    </StaggerItem>
                    <StaggerItem>
                        <p className="branches-sub">Visit us at our studios across India</p>
                    </StaggerItem>
                </StaggerContainer>

                <StaggerContainer className="branches-grid">
                    {branches.map((branch) => (
                        <StaggerItem key={branch.name}>
                            <div className="branch-card branch-card-with-image">
                                <div className="branch-image-wrapper">
                                    <img src={branch.image} alt={branch.name} className="branch-image" loading="lazy" />
                                    <div className="branch-image-overlay" />
                                </div>
                                <div className="branch-card-body">
                                    <div className="branch-name">{branch.name}</div>
                                    <div className="branch-city">{branch.city}</div>

                                    <div className="branch-detail">
                                        <MapPin size={16} className="branch-detail-icon" />
                                        <span>{branch.address}</span>
                                    </div>
                                    <div className="branch-detail">
                                        <Clock size={16} className="branch-detail-icon" />
                                        <span>{branch.hours}</span>
                                    </div>
                                    <div className="branch-detail">
                                        <Phone size={16} className="branch-detail-icon" />
                                        <span>{branch.phone}</span>
                                    </div>

                                    <div className="branch-actions">
                                        <a
                                            href={branch.mapUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="branch-link"
                                        >
                                            <Navigation size={14} />
                                            Directions
                                        </a>
                                        <a href={`tel:${branch.phone.replace(/\s/g, '')}`} className="branch-link">
                                            <Phone size={14} />
                                            Call
                                        </a>
                                        <a href="#contact" className="branch-link" onClick={(e) => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }) }}>
                                            <ExternalLink size={14} />
                                            Book
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </StaggerItem>
                    ))}

                    {/* Dubai — Coming Soon */}
                    <StaggerItem>
                        <div className="branch-card branch-card-with-image branch-card-coming-soon">
                            <div className="branch-image-wrapper">
                                <img src={branchDubai} alt="CM Dubai — Coming Soon" className="branch-image" loading="lazy" />
                                <div className="branch-image-overlay coming-soon-overlay" />
                                <div className="coming-soon-badge-overlay">
                                    <span className="coming-soon-pulse" />
                                    Opening Soon
                                </div>
                            </div>
                            <div className="branch-card-body">
                                <div className="branch-name">CM — Dubai</div>
                                <div className="branch-city">Dubai, UAE</div>

                                <div className="branch-detail">
                                    <Globe size={16} className="branch-detail-icon" />
                                    <span>Location to be announced</span>
                                </div>
                                <div className="branch-detail">
                                    <Clock size={16} className="branch-detail-icon" />
                                    <span>Coming Soon</span>
                                </div>

                                <div className="coming-soon-text">
                                    We're bringing the Christalin Mirrors experience to Dubai. Stay tuned for updates.
                                </div>
                            </div>
                        </div>
                    </StaggerItem>
                </StaggerContainer>
            </div>
        </section>
    )
}
