import { useEffect, useState } from 'react'
import { Mic, Star, Search, MessageSquare, MapPin, RefreshCw, Plus } from 'lucide-react'
import { reviewStore } from '../data/store'
import { authStore, getBranchScope, scopeByBranch } from '../data/authStore'
import type { ClientReview } from '../data/types'
import VoiceRecorderModal from '../components/VoiceRecorderModal'
import '../AdminShared.css'
import './VoiceReviews.css'

export default function VoiceReviews() {
    const session = authStore.getSession()
    const branchScope = getBranchScope()
    const [reviews, setReviews] = useState<ClientReview[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [ratingFilter, setRatingFilter] = useState<string>('all')
    const [sentimentFilter, setSentimentFilter] = useState<string>('all')
    const [branchFilter, setBranchFilter] = useState<string>('all')
    const [showRecordModal, setShowRecordModal] = useState(false)

    const loadReviews = async () => {
        setLoading(true)
        try {
            const data = await reviewStore.getAll()
            setReviews(scopeByBranch(data))
        } catch (err) {
            console.error('Failed to load reviews:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadReviews()
    }, [])

    const filteredReviews = reviews.filter(r => {
        const matchesSearch =
            r.clientName.toLowerCase().includes(search.toLowerCase()) ||
            r.transcript.toLowerCase().includes(search.toLowerCase()) ||
            (r.staffName && r.staffName.toLowerCase().includes(search.toLowerCase())) ||
            (r.serviceName && r.serviceName.toLowerCase().includes(search.toLowerCase()))

        const matchesRating = ratingFilter === 'all' || r.derivedRating === Number(ratingFilter)
        const matchesSentiment = sentimentFilter === 'all' || r.sentiment.toLowerCase() === sentimentFilter.toLowerCase()
        const matchesBranch = branchFilter === 'all' || r.branch.toLowerCase().includes(branchFilter.toLowerCase())

        return matchesSearch && matchesRating && matchesSentiment && matchesBranch
    })

    const totalReviews = reviews.length
    const avgRating = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + r.derivedRating, 0) / totalReviews).toFixed(1) : '5.0'
    const positiveCount = reviews.filter(r => r.sentiment === 'positive').length
    const positivePercent = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 100

    return (
        <div className="voice-admin-page">
            <div className="admin-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Mic size={24} style={{ color: 'var(--accent-alt)' }} /> Client Voice Reviews
                    </h1>
                    <p className="admin-page-sub">
                        {branchScope ? `Speech-recognized client feedback for ${branchScope} branch` : 'Speech-recognized client feedback across all branches'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="admin-btn admin-btn-primary" onClick={() => setShowRecordModal(true)}>
                        <Mic size={16} /> Record Voice Review
                    </button>
                    <button className="admin-btn admin-btn-secondary" onClick={loadReviews}>
                        <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            <VoiceRecorderModal
                isOpen={showRecordModal}
                onClose={() => setShowRecordModal(false)}
                onReviewSaved={() => loadReviews()}
                defaultBranch={branchScope || 'Bengaluru'}
            />

            {/* Summary Metrics */}
            <div className="admin-stats-grid">
                <div className="admin-stat-card">
                    <div className="stat-label">Total Voice Reviews</div>
                    <div className="stat-value">{totalReviews}</div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-label">Avg Voice Rating</div>
                    <div className="stat-value accent" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {avgRating} <Star size={18} fill="currentColor" />
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-label">Positive Sentiment</div>
                    <div className="stat-value" style={{ color: '#4ade80' }}>{positivePercent}%</div>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="admin-toolbar" style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <input
                        className="admin-search"
                        placeholder="Search voice transcript, client, or stylist..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {!branchScope && (
                    <select
                        className="admin-filter-select"
                        value={branchFilter}
                        onChange={e => setBranchFilter(e.target.value)}
                    >
                        <option value="all">All Branches</option>
                        <option value="Bengaluru">Bengaluru</option>
                        <option value="Kalaburagi">Kalaburagi</option>
                        <option value="Belgaum">Belgaum</option>
                    </select>
                )}

                <select
                    className="admin-filter-select"
                    value={ratingFilter}
                    onChange={e => setRatingFilter(e.target.value)}
                >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                </select>

                <select
                    className="admin-filter-select"
                    value={sentimentFilter}
                    onChange={e => setSentimentFilter(e.target.value)}
                >
                    <option value="all">All Sentiments</option>
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                </select>
            </div>

            {/* Voice Reviews Grid / List */}
            {loading ? (
                <div className="admin-empty" style={{ padding: 48 }}>
                    <RefreshCw size={28} className="spin" />
                    <h3 style={{ marginTop: 12 }}>Loading Client Voice Reviews...</h3>
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="admin-empty" style={{ padding: 48 }}>
                    <MessageSquare size={32} className="admin-empty-icon" />
                    <h3>No voice reviews found</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Clients can leave voice feedback at /review or via WhatsApp links.</p>
                </div>
            ) : (
                <div className="voice-reviews-grid">
                    {filteredReviews.map(r => (
                        <div key={r.id} className="voice-review-card">
                            <div className="voice-review-card-top">
                                <div className="voice-review-client">
                                    <div className="voice-client-avatar">
                                        {r.clientName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="voice-client-name">{r.clientName}</div>
                                        <div className="voice-client-meta">
                                            <MapPin size={12} /> {r.branch} {r.staffName ? `· Stylist: ${r.staffName}` : ''}
                                        </div>
                                    </div>
                                </div>

                                <div className="voice-review-rating">
                                    <span className={`sentiment-badge ${r.sentiment}`}>
                                        {r.sentiment.toUpperCase()}
                                    </span>
                                    <div className="stars-row">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={14} fill={s <= r.derivedRating ? '#f59e0b' : 'none'} color={s <= r.derivedRating ? '#f59e0b' : 'rgba(255,255,255,0.2)'} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="voice-review-transcript">
                                <p>"{r.transcript}"</p>
                            </div>

                            <div className="voice-review-footer">
                                <div className="voice-tags">
                                    {r.tags.map(t => (
                                        <span key={t} className="admin-tag">{t}</span>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span className="voice-date">
                                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
