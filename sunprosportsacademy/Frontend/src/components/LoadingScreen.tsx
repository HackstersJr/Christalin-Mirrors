import { motion } from 'framer-motion'
import logo from '../assets/Logo/Logo.png'
import './LoadingScreen.css'

export default function LoadingScreen() {
    return (
        <div className="loading-screen">
            <motion.div
                className="loading-bg"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
            />
            <motion.div
                className="loading-logo-container"
                layoutId="hero-logo"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 70,
                    damping: 24,
                    mass: 1.2
                }}
            >
                <img src={logo} alt="Sun Pro Sports Academy" className="loading-logo-img" />
            </motion.div>
        </div>
    )
}
