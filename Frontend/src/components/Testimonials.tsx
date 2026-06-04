import { Star } from 'lucide-react'
import { StaggerContainer, StaggerItem } from './Animations'
import './Testimonials.css'

const reviews = [
    {
        quote: `The services provided here are very good and the ambiance is beautiful. It felt like I was visiting a salon in Delhi, Bangalore, or Hyderabad. It's amazing that they've brought such a high-standard salon experience to our city.`,
        name: 'Salon Visitor',
        initials: 'SV',
        source: 'Google Review',
        stars: 5,
    },
    {
        // TODO: Replace with real Instagram/GMaps review from client
        quote: `Absolutely love the Korean Head Spa experience at Christalin Mirrors. The staff is incredibly professional and the results are outstanding. My hair has never felt this good.`,
        name: 'Client Review',
        initials: 'CR',
        source: 'Pending — Replace with real review',
        stars: 5,
    },
    {
        // TODO: Replace with real Instagram/GMaps review from client
        quote: `From the moment you walk in, the ambiance sets the tone. The stylists truly listen and deliver exactly what you envision. A premium experience that's worth every visit.`,
        name: 'Client Review',
        initials: 'CR',
        source: 'Pending — Replace with real review',
        stars: 5,
    },
]

const marqueeItems = [
    { text: 'KOREAN HEAD SPA', type: 'large' as const },
    { text: 'unisex salon', type: 'accent' as const },
    { text: 'BRIDAL MAKEOVER', type: 'outline' as const },
    { text: 'glass skin facial', type: 'accent' as const },
    { text: 'BALAYAGE & COLOR', type: 'large' as const },
    { text: 'premium grooming', type: 'accent' as const },
    { text: 'KERATIN TREATMENT', type: 'outline' as const },
    { text: 'nail art & extensions', type: 'accent' as const },
]

export default function Testimonials() {
    return (
        <section className="testimonials section" id="testimonials">
            {/* ─── Marquee Banner ─── */}
            <div className="testimonials-marquee">
                <div className="marquee-track">
                    {[...marqueeItems, ...marqueeItems].map((item, i) => (
                        <div className="marquee-item" key={i}>
                            <span className={`marquee-text ${item.type}`}>{item.text}</span>
                            <span className="marquee-dot" />
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Reviews ─── */}
            <div className="testimonials-content container">
                <div className="testimonials-header">
                    <h2 className="testimonials-heading">What Our Clients Say</h2>
                    <p className="testimonials-sub">Honest words from the people who matter most</p>
                </div>

                <StaggerContainer className="testimonials-grid">
                    {reviews.map((review, idx) => (
                        <StaggerItem key={idx}>
                            <div className="testimonial-card">
                                <div className="testimonial-stars">
                                    {Array.from({ length: review.stars }).map((_, i) => (
                                        <Star key={i} size={16} fill="currentColor" />
                                    ))}
                                </div>
                                <p className="testimonial-quote">"{review.quote}"</p>
                                <div className="testimonial-author">
                                    <div className="testimonial-avatar">{review.initials}</div>
                                    <div className="testimonial-author-info">
                                        <div className="testimonial-name">{review.name}</div>
                                        <div className="testimonial-source">{review.source}</div>
                                    </div>
                                </div>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    )
}
