import { Star } from 'lucide-react'
import { StaggerContainer, StaggerItem } from './Animations'
import './Testimonials.css'

const reviews = [
    {
        quote: `The best salon experience I've ever had. The attention to detail and the personalized care made me feel truly special. My balayage is absolutely flawless.`,
        name: 'Priya Sharma',
        initials: 'PS',
        since: 'Client since 2022',
        stars: 5,
    },
    {
        quote: 'CM transformed my look completely. The stylists here are true artists — they listened to exactly what I wanted and delivered beyond my expectations.',
        name: 'Rahul Desai',
        initials: 'RD',
        since: 'Client since 2021',
        stars: 5,
    },
    {
        quote: 'From the moment you walk in, you know this is different. The ambiance, the expertise, the results — everything is world-class. Worth every penny.',
        name: 'Ananya Kulkarni',
        initials: 'AK',
        since: 'Client since 2023',
        stars: 5,
    },
]

const marqueeItems = [
    { text: 'REAL RESULTS', type: 'large' as const },
    { text: 'no filters', type: 'accent' as const },
    { text: 'NO RETOUCHING', type: 'outline' as const },
    { text: 'just real people', type: 'accent' as const },
    { text: 'REAL RESULTS', type: 'large' as const },
    { text: 'no filters', type: 'accent' as const },
    { text: 'NO RETOUCHING', type: 'outline' as const },
    { text: 'just real people', type: 'accent' as const },
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
                    {reviews.map((review) => (
                        <StaggerItem key={review.name}>
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
                                        <div className="testimonial-since">{review.since}</div>
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
