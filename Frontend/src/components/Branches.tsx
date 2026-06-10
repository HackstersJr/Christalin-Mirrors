import { MapPin, Clock, Phone, ExternalLink, Navigation, Globe } from 'lucide-react'
import { StaggerContainer, StaggerItem } from './Animations'
const branchBengaluru = "https://res.cloudinary.com/djrtoihj8/image/upload/v1780593536/WhatsApp_Image_2026-03-26_at_9.24.34_PM_w3eof8.jpg"
const branchKalaburagi = "https://res.cloudinary.com/djrtoihj8/image/upload/v1780593844/WhatsApp_Image_2026-06-04_at_2.56.43_PM_1_xatxwk.jpg"
import './Branches.css'

const branches = [
    {
        name: 'CM — Bengaluru',
        city: 'Bengaluru, Karnataka',
        address: 'Century Ethos Club House, Bellary Rd, Bengaluru 560092',
        hours: 'Everyday: 10:00 AM – 9:00 PM',
        phone: '+91 7204236981',
        mapUrl: 'https://maps.google.com/?q=Century+Ethos+Club+House+Bellary+Road+Bengaluru',
        image: branchBengaluru,
    },
    {
        name: 'CM — Kalaburagi',
        city: 'Kalaburagi, Karnataka',
        address: 'Orchid Mall, Mahaveer Nagar, Khuba Plot, Brahmpur, Kalaburagi 585105',
        hours: 'Everyday: 10:00 AM – 9:00 PM',
        phone: '+91 918715909',
        mapUrl: 'https://maps.google.com/?q=Orchid+Mall+Kalaburagi',
        image: branchKalaburagi,
    },
]

const comingSoonBranches = [
    { name: 'CM — Hassan', city: 'Hassan, Karnataka' },
    { name: 'CM — Hubballi', city: 'Hubballi, Karnataka' },
    { name: 'CM — Belagavi', city: 'Belagavi, Karnataka' },
    { name: 'CM — Dubai', city: 'Dubai, UAE' },
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
                        <div key={branch.name} className="branch-card-wrapper">
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
                        </div>
                    ))}

                    {/* Coming Soon Branches */}
                    {comingSoonBranches.map((branch) => (
                        <div key={branch.name} className="branch-card-wrapper">
                            <div className="branch-card branch-card-coming-soon">
                                <div className="branch-card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ marginBottom: '24px' }}>
                                        <div className="coming-soon-badge">
                                            <span className="coming-soon-pulse" />
                                            Opening Soon
                                        </div>
                                    </div>
                                    <div className="branch-name">{branch.name}</div>
                                    <div className="branch-city">{branch.city}</div>

                                    <div className="branch-detail">
                                        <Globe size={16} className="branch-detail-icon" />
                                        <span>Location to be announced</span>
                                    </div>
                                    <div className="branch-detail">
                                        <Clock size={16} className="branch-detail-icon" />
                                        <span>Coming Soon</span>
                                    </div>

                                    <div className="coming-soon-text">
                                        We're bringing the Christalin Mirrors experience to {branch.city.split(',')[0]}. Stay tuned for updates.
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    )
}
