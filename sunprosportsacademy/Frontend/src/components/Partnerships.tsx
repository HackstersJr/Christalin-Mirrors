import { motion } from 'framer-motion'
import './Partnerships.css'

const partners = [
  { name: "Karnataka News Beat", category: "Media Partner" },
  { name: "PlayVue", category: "Tech Partner" },
  { name: "Bridgeport Labs", category: "R&D Partner" },
  { name: "Athletiq", category: "Performance Partner" },
  { name: "Aquatein", category: "Nutrition Partner" },
  { name: "Jindal Sports", category: "Strategic Partner" }
]

export default function Partnerships() {
  return (
    <section className="partnerships section" id="partnerships">
      <div className="container">
        <header className="wwd-header" style={{ textAlign: 'center', margin: '0 auto 80px' }}>
          <motion.span 
            className="section-label"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Strategic Network
          </motion.span>
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Our Partnerships
          </motion.h2>
          <motion.p 
            className="section-subtitle"
            style={{ margin: '0 auto' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            Collaborating with industry leaders to bring world-class excellence to Indian sports infrastructure.
          </motion.p>
        </header>

        <div className="partners-grid">
          {partners.map((partner, index) => (
            <motion.div 
              key={index}
              className="partner-card"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
            >
              <div className="partner-logo-placeholder">
                <span className="placeholder-text">{partner.name}</span>
              </div>
              <div className="partner-info">
                <span className="partner-category">{partner.category}</span>
                <h4 className="partner-name">{partner.name}</h4>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
