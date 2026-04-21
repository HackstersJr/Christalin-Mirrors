import { motion } from 'framer-motion'
import { Building2, Layout, Sliders, BarChart3 } from 'lucide-react'
import './WhatWeDo.css'

const services = [
  {
    icon: <Building2 />,
    title: "Indoor Stadium Development",
    desc: "State-of-the-art climate-controlled environments for basketball, badminton, and multi-sport use."
  },
  {
    icon: <Layout />,
    title: "Multi-Sport Facility Design",
    desc: "Architectural excellence in designing versatile spaces that maximize utility and athlete performance."
  },
  {
    icon: <Sliders />,
    title: "End-to-End Execution",
    desc: "From blueprint to grand opening, we manage the entire project lifecycle with precision."
  },
  {
    icon: <BarChart3 />,
    title: "Strategic Consulting",
    desc: "Board-level advisory for universities and organizations looking to upgrade their sports portfolio."
  }
]

export default function WhatWeDo() {
  return (
    <section className="what-we-do section" id="what-we-do">
      <div className="container">
        <header className="wwd-header">
          <motion.span 
            className="section-label"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Core Expertise
          </motion.span>
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            What We Do
          </motion.h2>
          <motion.p 
            className="section-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            Delivering high-performance sports infrastructure that serves as the foundation for the next generation of athletic legends.
          </motion.p>
        </header>

        <div className="wwd-grid">
          {services.map((item, index) => (
            <motion.div 
              key={index}
              className="card-premium"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
            >
              <div className="wwd-icon">
                {item.icon}
              </div>
              <h3 className="wwd-card-title">{item.title}</h3>
              <p className="wwd-card-desc">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
