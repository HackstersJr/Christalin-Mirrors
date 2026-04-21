import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface MagneticProps {
    children: React.ReactNode
    className?: string
    intensity?: number
}

export function MagneticButton({ children, className, intensity = 0.3 }: MagneticProps) {
    const ref = useRef<HTMLDivElement>(null)

    const handleMouseMove = (e: React.MouseEvent) => {
        const el = ref.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const x = (e.clientX - rect.left - rect.width / 2) * intensity
        const y = (e.clientY - rect.top - rect.height / 2) * intensity
        el.style.transform = `translate(${x}px, ${y}px)`
    }

    const handleMouseLeave = () => {
        const el = ref.current
        if (!el) return
        el.style.transform = 'translate(0, 0)'
        el.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        setTimeout(() => { if (el) el.style.transition = '' }, 400)
    }

    return (
        <div
            ref={ref}
            className={className}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ willChange: 'transform' }}
        >
            {children}
        </div>
    )
}

interface ParallaxProps {
    children: React.ReactNode
    speed?: number
    className?: string
}

export function Parallax({ children, speed = 0.3, className }: ParallaxProps) {
    const ref = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    })
    const y = useTransform(scrollYProgress, [0, 1], [speed * -100, speed * 100])

    return (
        <div ref={ref} style={{ overflow: 'hidden' }} className={className}>
            <motion.div style={{ y }}>
                {children}
            </motion.div>
        </div>
    )
}

export function StaggerContainer({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
    stagger?: number
}) {
    return (
        <div className={className}>
            {children}
        </div>
    )
}

export function StaggerItem({
    children,
    className,
    yOffset = 40,
    xOffset = 0
}: {
    children: React.ReactNode
    className?: string
    yOffset?: number
    xOffset?: number
}) {
    const ref = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 95%", "end 5%"]
    })
    
    // Smoothly fade in/out and translate in/out based on viewport crossing
    const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0])
    const y = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [yOffset, 0, 0, -yOffset])
    const x = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [xOffset, 0, 0, -xOffset])

    const style = xOffset !== 0 ? { opacity, y, x } : { opacity, y }

    return (
        <motion.div ref={ref} className={className} style={style}>
            {children}
        </motion.div>
    )
}
