import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

interface ScrollRevealProps {
    children: React.ReactNode
    direction?: Direction
    delay?: number
    duration?: number
    distance?: number
    once?: boolean
    className?: string
    style?: React.CSSProperties
}

const getInitial = (direction: Direction, distance: number) => {
    switch (direction) {
        case 'up': return { opacity: 0, y: distance }
        case 'down': return { opacity: 0, y: -distance }
        case 'left': return { opacity: 0, x: distance }
        case 'right': return { opacity: 0, x: -distance }
        case 'none': return { opacity: 0 }
    }
}

export default function ScrollReveal({
    children,
    direction = 'up',
    delay = 0,
    duration = 0.7,
    distance = 40,
    once = true,
    className,
    style,
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref, { once, margin: '-60px 0px' })

    return (
        <motion.div
            ref={ref}
            initial={getInitial(direction, distance)}
            animate={isInView ? { opacity: 1, x: 0, y: 0 } : getInitial(direction, distance)}
            transition={{
                duration,
                delay,
                ease: [0.16, 1, 0.3, 1],
            }}
            className={className}
            style={style}
        >
            {children}
        </motion.div>
    )
}
