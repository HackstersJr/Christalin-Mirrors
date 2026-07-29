import { MapPin, Clock, Phone, ExternalLink, Navigation, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StaggerContainer, StaggerItem } from './Animations'
import { cld, cldSrcSet } from '../lib/cld'
import { branches, comingSoonBranches } from '../data/branches'
import './Branches.css'

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
                                    <img
                                        src={cld(branch.image, 600)}
                                        srcSet={cldSrcSet(branch.image, [300, 450, 600, 800, 1000])}
                                        sizes="(max-width: 768px) 90vw, 450px"
                                        alt={branch.name}
                                        className="branch-image"
                                        loading="lazy"
                                    />
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
                                        <Link to="/book" state={{ branchId: branch.id }} className="branch-link">
                                            <ExternalLink size={14} />
                                            Book
                                        </Link>
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
