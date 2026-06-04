import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const token = localStorage.getItem('adminToken')
    
    // In production this will be verified against the backend
    if (!token) {
        return <Navigate to="/admin/login" replace />
    }

    return <>{children}</>
}
