import { motion } from 'framer-motion'
import { ShieldCheck, Zap, TrendingUp, Users } from 'lucide-react'
import './WhyChooseUs.css'

const reasons = [
  {
    icon: <ShieldCheck />,
    title: "Proven Expertise",
    desc: "Over a decade of experience in delivering high-fidelity sports facilities across Karnataka."
  },
  {
    icon: <Zap />,
    title: "Efficiency First",
    desc: "Our project management methodology ensures on-time delivery without compromising on quality."
  },
  {
    icon: <Users />,
    title: "Athlete-Centric",
    desc: "Every design is vetted by professional athletes to ensure the highest performance standards."
  },
  {
    icon: <TrendingUp />,
    title: "Board-Level Advisory",
    desc: "We provide strategic insights that help organizations treat sports infrastructure as a valuable asset."
  }
]

export default function WhyChooseUs() {
  return (
    <section className="why-choose-us section" id="why-choose-us">
      <div className="container">
        <div className="wcu-inner">
          <div className="wcu-content">
            <motion.span 
              className="section-label"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              The Sun Pro Advantage
            </motion.span>
            <motion.h2 
              className="section-title"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Why Choose <span className="text-gold">Sun Pro?</span>
            </motion.h2>
            <motion.p 
              className="section-subtitle"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              We don't just build stadiums; we build legacies. Our holistic approach to sports infrastructure combines engineering precision with a deep understanding of athletic requirements.
            </motion.p>
          </div>

          <div className="wcu-grid">
            {reasons.map((reason, index) => (
              <motion.div 
                key={index}
                className="wcu-item"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="wcu-icon-box">
                  {reason.icon}
                </div>
                <div className="wcu-text">
                  <h4>{reason.title}</h4>
                  <p>{reason.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
