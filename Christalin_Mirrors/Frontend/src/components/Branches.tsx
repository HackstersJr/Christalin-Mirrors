import { MapPin, Clock, Phone, ExternalLink, Navigation } from 'lucide-react'
import { StaggerContainer, StaggerItem } from './Animations'
import './Branches.css'

const branches = [
    {
        name: 'CM — Bengaluru',
        city: 'Bengaluru, Karnataka',
        address: 'Century Ethos Club House, Bellary Rd, Bengaluru 560092',
        hours: 'Mon – Sat: 10:00 AM – 8:00 PM | Sun: 11:00 AM – 6:00 PM',
        phone: '+91 72042 36981',
        mapUrl: 'https://maps.google.com/?q=Century+Ethos+Club+House+Bellary+Road+Bengaluru',
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
                        <h2 className="branches-heading">Our Location</h2>
                    </StaggerItem>
                    <StaggerItem>
                        <p className="branches-sub">Visit us at our studio in Bengaluru</p>
                    </StaggerItem>
                </StaggerContainer>

                <StaggerContainer className="branches-grid">
                    {branches.map((branch) => (
                        <StaggerItem key={branch.name}>
                            <div className="branch-card">
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
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    )
}
