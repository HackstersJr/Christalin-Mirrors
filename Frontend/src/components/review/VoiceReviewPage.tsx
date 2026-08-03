import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Star, CheckCircle, RefreshCw, Sparkles, MapPin, User, ArrowLeft, Volume2 } from 'lucide-react'
import cmLogo from '../../assets/cm-logo-white.png'
import { branches } from '../../data/branches'
import { reviewStore } from '../../admin/data/store'
import './VoiceReviewPage.css'

// SpeechRecognition type declarations for TS
declare global {
    interface Window {
        SpeechRecognition: any
        webkitSpeechRecognition: any
    }
}

// Sentiment & Star calculation from speech transcript
function analyzeVoiceTranscript(text: string): { rating: number; sentiment: 'positive' | 'neutral' | 'negative'; tags: string[] } {
    const lower = text.toLowerCase()
    if (!lower.trim()) return { rating: 5, sentiment: 'positive', tags: ['Voice Feedback'] }

    const positiveWords = [
        'amazing', 'love', 'loved', 'great', 'good', 'relaxing', 'hydrated', 'perfect',
        'best', 'wonderful', 'excellent', 'happy', 'clean', 'friendly', 'awesome',
        'glowing', 'refreshing', 'soft', 'beautiful', 'gentle', 'recommending', 'recommend'
    ]
    const negativeWords = [
        'bad', 'dirty', 'late', 'horrible', 'poor', 'terrible', 'worst', 'rude',
        'pain', 'unhappy', 'slow', 'waste', 'disappointed', 'disappointing', 'rough'
    ]

    let posScore = 0
    let negScore = 0
    const matchedTags: string[] = []

    positiveWords.forEach(w => {
        if (lower.includes(w)) {
            posScore++
            if (['relaxing', 'hydrated', 'glowing', 'soft', 'clean'].includes(w) && !matchedTags.includes(w)) {
                matchedTags.push(w.charAt(0).toUpperCase() + w.slice(1))
            }
        }
    })

    negativeWords.forEach(w => {
        if (lower.includes(w)) negScore++
    })

    if (lower.includes('facial') || lower.includes('skin') || lower.includes('glow')) matchedTags.push('Skin & Glow')
    if (lower.includes('hair') || lower.includes('cut') || lower.includes('color') || lower.includes('colour')) matchedTags.push('Hair Styling')
    if (lower.includes('massage') || lower.includes('spa')) matchedTags.push('Wellness Spa')

    if (matchedTags.length === 0) matchedTags.push('Voice Verified')

    if (negScore > posScore) {
        return { rating: Math.max(1, 3 - negScore), sentiment: 'negative', tags: matchedTags }
    } else if (posScore === 0 && negScore === 0) {
        return { rating: 4, sentiment: 'neutral', tags: matchedTags }
    } else {
        const calculatedRating = Math.min(5, 4 + (posScore > 2 ? 1 : 0))
        return { rating: calculatedRating, sentiment: 'positive', tags: matchedTags }
    }
}

export default function VoiceReviewPage() {
    const [clientName, setClientName] = useState('')
    const [clientPhone, setClientPhone] = useState('')
    const [branchId, setBranchId] = useState('branch_blr')
    const [staffName, setStaffName] = useState('')
    const [transcript, setTranscript] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [isSpeechSupported, setIsSpeechSupported] = useState(true)
    const [submitted, setSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [manualRating, setManualRating] = useState<number | null>(null)

    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRec) {
            setIsSpeechSupported(false)
            return
        }

        const recognition = new SpeechRec()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-IN'

        recognition.onresult = (event: any) => {
            let currentText = ''
            for (let i = 0; i < event.results.length; i++) {
                currentText += event.results[i][0].transcript + ' '
            }
            setTranscript(currentText.trim())
        }

        recognition.onerror = (err: any) => {
            console.error('Speech Recognition Error:', err)
            setIsListening(false)
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition
    }, [])

    const toggleListening = () => {
        if (!recognitionRef.current) return

        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        } else {
            setTranscript('')
            recognitionRef.current.start()
            setIsListening(true)
        }
    }

    const { rating: autoRating, sentiment, tags } = analyzeVoiceTranscript(transcript)
    const activeRating = manualRating ?? autoRating

    const selectedBranchObj = branches.find(b => b.id === branchId)
    const branchNameClean = selectedBranchObj ? selectedBranchObj.name.replace('CM — ', '') : 'Bengaluru'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!transcript.trim() || !clientName.trim()) return

        setIsSubmitting(true)
        try {
            await reviewStore.create({
                clientName,
                clientPhone: clientPhone || undefined,
                branchId,
                branch: branchNameClean,
                staffName: staffName.trim() || undefined,
                transcript,
                derivedRating: activeRating,
                sentiment,
                tags,
                status: 'published',
            })
            setSubmitted(true)
        } catch (err) {
            console.error('Failed to submit voice review:', err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="voice-review-page">
            <header className="voice-review-header">
                <Link to="/" className="voice-logo-link">
                    <img src={cmLogo} alt="Christalin Mirrors" className="voice-logo-img" />
                </Link>
                <Link to="/" className="voice-back-btn">
                    <ArrowLeft size={16} /> Back to Home
                </Link>
            </header>

            <main className="voice-review-container">
                <AnimatePresence mode="wait">
                    {submitted ? (
                        <motion.div
                            key="success"
                            className="voice-success-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="voice-success-icon">
                                <CheckCircle size={48} />
                            </div>
                            <h2>Thank You, {clientName.split(' ')[0]}!</h2>
                            <p>Your voice review has been recorded & transcribed. We appreciate your feedback to make Christalin Mirrors {branchNameClean} even better.</p>

                            <div className="voice-rating-display">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={22}
                                        className={star <= activeRating ? 'star-gold' : 'star-muted'}
                                    />
                                ))}
                            </div>

                            <Link to="/" className="voice-btn voice-btn-primary">
                                Done
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.form
                            key="form"
                            className="voice-card"
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="voice-badge">
                                <Sparkles size={14} /> Voice Experience
                            </div>

                            <h1 className="voice-title">Tell Us About Your Visit</h1>
                            <p className="voice-sub">Speak naturally into your mic — we'll transcribe your voice in real time.</p>

                            {/* Mic Button & Waveform Ring */}
                            <div className="voice-mic-wrapper">
                                <button
                                    type="button"
                                    className={`voice-mic-button ${isListening ? 'listening' : ''}`}
                                    onClick={toggleListening}
                                    title={isListening ? 'Tap to stop recording' : 'Tap to speak'}
                                >
                                    <span className="voice-mic-pulse" />
                                    <span className="voice-mic-pulse-outer" />
                                    {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                                </button>
                                <p className="voice-mic-label">
                                    {isListening ? 'Listening... Speak your review clearly' : 'Tap the microphone & start speaking'}
                                </p>
                            </div>

                            {!isSpeechSupported && (
                                <div className="voice-warning">
                                    Speech recognition is not natively active on this browser. You can type your review in the text box below!
                                </div>
                            )}

                            {/* Live Transcript Preview */}
                            <div className="voice-field">
                                <label className="voice-label">
                                    <Volume2 size={14} /> Voice Transcript & Feedback
                                </label>
                                <textarea
                                    className="voice-textarea"
                                    rows={4}
                                    placeholder="e.g. The Korean Glass Skin Facial with Soniya was super relaxing! Loved the scalp massage..."
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Auto Sentiment & Star Rating */}
                            {transcript.trim().length > 0 && (
                                <div className="voice-sentiment-box">
                                    <div className="voice-sentiment-header">
                                        <span>Auto-Detected Sentiment & Rating:</span>
                                        <span className={`voice-sentiment-tag ${sentiment}`}>
                                            {sentiment.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="voice-stars-row">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                type="button"
                                                key={star}
                                                className="voice-star-btn"
                                                onClick={() => setManualRating(star)}
                                            >
                                                <Star
                                                    size={24}
                                                    className={star <= activeRating ? 'star-gold' : 'star-muted'}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Client & Branch Form Info */}
                            <div className="voice-form-grid">
                                <div className="voice-field">
                                    <label className="voice-label"><User size={14} /> Your Name *</label>
                                    <input
                                        type="text"
                                        className="voice-input"
                                        placeholder="e.g. Ananya Rao"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="voice-field">
                                    <label className="voice-label"><MapPin size={14} /> Salon Location</label>
                                    <select
                                        className="voice-select"
                                        value={branchId}
                                        onChange={(e) => setBranchId(e.target.value)}
                                    >
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name.replace('CM — ', '')}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="voice-field">
                                    <label className="voice-label">Stylist Name (optional)</label>
                                    <input
                                        type="text"
                                        className="voice-input"
                                        placeholder="e.g. Soniya / Deep"
                                        value={staffName}
                                        onChange={(e) => setStaffName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="voice-btn voice-btn-primary"
                                disabled={!transcript.trim() || !clientName.trim() || isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Voice Review'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
