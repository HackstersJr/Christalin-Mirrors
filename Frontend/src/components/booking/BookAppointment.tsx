import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Phone, X } from 'lucide-react'
import cmLogo from '../../assets/cm-logo-white.png'
import { emptyBookingData, STEP_LABELS, type BookingData } from './types'
import {
    StepAbout, StepBranch, StepServices, StepDateTime, StepConfirm,
    BookingSuccess, isStepValid,
} from './BookingSteps'
import './BookAppointment.css'

const STEP_COMPONENTS = [StepAbout, StepBranch, StepServices, StepDateTime]

const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 48 : -48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -48 : 48, opacity: 0 }),
}

export default function BookAppointment() {
    const location = useLocation()
    const preselectBranch = (location.state as { branchId?: string } | null)?.branchId

    const [step, setStep] = useState(0)
    const [direction, setDirection] = useState(1)
    const [data, setData] = useState<BookingData>({
        ...emptyBookingData,
        branchId: preselectBranch || '',
    })
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const update = (patch: Partial<BookingData>) => setData((d) => ({ ...d, ...patch }))

    const goTo = (target: number) => {
        setDirection(target > step ? 1 : -1)
        setStep(target)
    }

    const handleBack = () => {
        if (step === 0) return
        goTo(step - 1)
    }

    const handleContinue = (e: React.FormEvent) => {
        e.preventDefault()
        if (!isStepValid(step, data)) return
        if (step === STEP_LABELS.length - 1) {
            setSubmitted(true)
            return
        }
        goTo(step + 1)
    }

    const valid = isStepValid(step, data)
    const isLastStep = step === STEP_LABELS.length - 1
    const StepComponent = STEP_COMPONENTS[step]

    return (
        <div className="booking-page" data-theme="light">
            <div className="booking-ambient">
                <span className="booking-blob booking-blob-1" />
                <span className="booking-blob booking-blob-2" />
            </div>

            {/* Top Bar */}
            <header className="booking-topbar">
                <Link to="/" className="booking-logo-link">
                    <img src={cmLogo} alt="Christalin Mirrors" className="booking-logo-img" />
                </Link>

                {!submitted && (
                    <div className="booking-progress">
                        <span className="booking-progress-text">
                            Step {step + 1} of {STEP_LABELS.length} — {STEP_LABELS[step]}
                        </span>
                        <div className="booking-progress-track">
                            {STEP_LABELS.map((label, i) => (
                                <span
                                    key={label}
                                    className={`booking-progress-seg ${i <= step ? 'filled' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <Link to="/" className="booking-close-btn" aria-label="Close booking">
                    <X size={20} />
                </Link>
            </header>

            <div className="booking-help-bar">
                <Phone size={13} />
                <span>Need help? Call us at <a href="tel:+919900118383">+91 99001 18383</a></span>
            </div>

            {/* Content */}
            <main className="booking-main">
                <div className="booking-content">
                    {submitted ? (
                        <>
                            <BookingSuccess data={data} />
                            <div className="booking-success-actions">
                                <Link to="/" className="booking-btn booking-btn-primary">
                                    Back to Home
                                </Link>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleContinue}>
                            <AnimatePresence mode="wait" custom={direction} initial={false}>
                                <motion.div
                                    key={step}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    {isLastStep
                                        ? <StepConfirm data={data} update={update} onEdit={goTo} />
                                        : <StepComponent data={data} update={update} />}
                                </motion.div>
                            </AnimatePresence>

                            <div className="booking-nav">
                                <button
                                    type="button"
                                    className="booking-btn booking-btn-ghost"
                                    onClick={handleBack}
                                    style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
                                >
                                    <ArrowLeft size={16} /> Back
                                </button>
                                <button
                                    type="submit"
                                    className="booking-btn booking-btn-primary"
                                    disabled={!valid}
                                >
                                    {isLastStep ? 'Confirm Booking' : 'Continue'}
                                    {!isLastStep && <ArrowRight size={16} />}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    )
}
