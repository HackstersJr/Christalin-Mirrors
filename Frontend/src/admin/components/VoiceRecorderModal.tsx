import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Star, X, Check, Volume2, Sparkles, User, MapPin } from 'lucide-react'
import { reviewStore } from '../data/store'
import type { ClientReview } from '../data/types'
import './VoiceRecorderModal.css'

declare global {
    interface Window {
        SpeechRecognition: any
        webkitSpeechRecognition: any
    }
}

function analyzeVoiceTranscript(text: string): { rating: number; sentiment: 'positive' | 'neutral' | 'negative'; tags: string[] } {
    const lower = text.toLowerCase()
    if (!lower.trim()) return { rating: 5, sentiment: 'positive', tags: ['Voice Verified'] }

    const positiveWords = [
        'amazing', 'love', 'loved', 'great', 'good', 'relaxing', 'hydrated', 'perfect',
        'best', 'wonderful', 'excellent', 'happy', 'clean', 'friendly', 'awesome',
        'glowing', 'refreshing', 'soft', 'beautiful', 'gentle', 'recommend', 'nice'
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

interface VoiceRecorderModalProps {
    isOpen: boolean
    onClose: () => void
    onReviewSaved: (review: ClientReview) => void
    defaultClientName?: string
    defaultClientPhone?: string
    defaultBranch?: string
    defaultStaffName?: string
    title?: string
}

export default function VoiceRecorderModal({
    isOpen,
    onClose,
    onReviewSaved,
    defaultClientName = '',
    defaultClientPhone = '',
    defaultBranch = 'Bengaluru',
    defaultStaffName = '',
    title = 'Record Client Voice Review'
}: VoiceRecorderModalProps) {
    const [clientName, setClientName] = useState(defaultClientName)
    const [clientPhone, setClientPhone] = useState(defaultClientPhone)
    const [branch, setBranch] = useState(defaultBranch)
    const [staffName, setStaffName] = useState(defaultStaffName)
    const [transcript, setTranscript] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [isSpeechSupported, setIsSpeechSupported] = useState(true)
    const [manualRating, setManualRating] = useState<number | null>(null)
    const [saving, setSaving] = useState(false)

    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        if (defaultClientName) setClientName(defaultClientName)
        if (defaultClientPhone) setClientPhone(defaultClientPhone)
        if (defaultBranch) setBranch(defaultBranch)
        if (defaultStaffName) setStaffName(defaultStaffName)
    }, [defaultClientName, defaultClientPhone, defaultBranch, defaultStaffName])

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

        recognition.onerror = () => setIsListening(false)
        recognition.onend = () => setIsListening(false)

        recognitionRef.current = recognition
    }, [])

    if (!isOpen) return null

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

    const handleSave = async () => {
        if (!transcript.trim() || !clientName.trim()) return
        setSaving(true)
        try {
            const saved = await reviewStore.create({
                clientName,
                clientPhone: clientPhone || undefined,
                branchId: branch.toLowerCase().includes('kalaburagi') ? 'branch_klb' : branch.toLowerCase().includes('belgaum') ? 'branch_bgm' : 'branch_blr',
                branch,
                staffName: staffName || undefined,
                transcript,
                derivedRating: activeRating,
                sentiment,
                tags,
                status: 'published',
            })
            onReviewSaved(saved)
            onClose()
        } catch (err) {
            console.error('Failed to save voice review:', err)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="voice-modal-overlay">
            <div className="voice-modal-card">
                <div className="voice-modal-header">
                    <div>
                        <div className="voice-modal-badge"><Sparkles size={12} /> Pre-Billing Feedback</div>
                        <h2>{title}</h2>
                    </div>
                    <button className="voice-modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="voice-modal-body">
                    {/* Big Mic Button */}
                    <div className="voice-modal-mic-zone">
                        <button
                            type="button"
                            className={`voice-modal-mic-btn ${isListening ? 'listening' : ''}`}
                            onClick={toggleListening}
                        >
                            <span className="voice-mic-pulse" />
                            {isListening ? <MicOff size={36} /> : <Mic size={36} />}
                        </button>
                        <p className="voice-modal-mic-hint">
                            {isListening ? '🎙️ Listening... Ask client to speak review' : 'Tap mic to start client voice recording'}
                        </p>
                    </div>

                    {!isSpeechSupported && (
                        <div className="voice-modal-warning">
                            Browser speech recognition is inactive. Type client review text directly below.
                        </div>
                    )}

                    <div className="voice-modal-field">
                        <label><Volume2 size={13} /> Voice Transcript</label>
                        <textarea
                            className="admin-form-textarea"
                            rows={3}
                            placeholder="Client voice transcript will stream live here..."
                            value={transcript}
                            onChange={e => setTranscript(e.target.value)}
                        />
                    </div>

                    {transcript.trim() && (
                        <div className="voice-modal-sentiment">
                            <div className="sentiment-meta">
                                <span>Detected Rating & Sentiment:</span>
                                <span className={`sentiment-badge ${sentiment}`}>{sentiment.toUpperCase()}</span>
                            </div>
                            <div className="modal-stars-row">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star
                                        key={s}
                                        size={20}
                                        fill={s <= activeRating ? '#f59e0b' : 'none'}
                                        color={s <= activeRating ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setManualRating(s)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="voice-modal-grid">
                        <div>
                            <label className="admin-form-label"><User size={13} /> Client Name *</label>
                            <input
                                className="admin-form-input"
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                                placeholder="Client name..."
                            />
                        </div>
                        <div>
                            <label className="admin-form-label"><MapPin size={13} /> Branch</label>
                            <input
                                className="admin-form-input"
                                value={branch}
                                onChange={e => setBranch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="voice-modal-footer">
                    <button className="admin-btn admin-btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="admin-btn admin-btn-primary"
                        disabled={!transcript.trim() || !clientName.trim() || saving}
                        onClick={handleSave}
                    >
                        {saving ? 'Saving...' : 'Confirm Voice Review'}
                    </button>
                </div>
            </div>
        </div>
    )
}
