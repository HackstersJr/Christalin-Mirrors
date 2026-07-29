import { Navigate } from 'react-router-dom'
import { authStore } from '../data/authStore'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const token = localStorage.getItem('adminToken')
    const session = authStore.getSession()

    // In production this will be verified against the backend
    if (!token || !session) {
        return <Navigate to="/admin/login" replace />
    }

    return <>{children}</>
}
