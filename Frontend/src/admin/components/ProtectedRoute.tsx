import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { adminApi, auth } from '../../lib/api'

interface ProtectedRouteProps {
    children: React.ReactNode
}

/**
 * Verifies the token against the backend rather than trusting that a string
 * exists in localStorage. A forged or expired token fails here.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [state, setState] = useState<'checking' | 'ok' | 'denied'>(
        auth.token() ? 'checking' : 'denied'
    )

    useEffect(() => {
        if (!auth.token()) { setState('denied'); return }
        let alive = true
        adminApi.get('/auth/me')
            .then(({ data }) => {
                if (!alive) return
                auth.set(auth.token()!, data)   // refresh cached role/branch
                setState('ok')
            })
            .catch(() => { if (alive) { auth.clear(); setState('denied') } })
        return () => { alive = false }
    }, [])

    if (state === 'checking') {
        return <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', opacity: 0.6 }}>Loading…</div>
    }
    if (state === 'denied') return <Navigate to="/admin/login" replace />
    return <>{children}</>
}
