import { Navigate } from 'react-router-dom'
import { authStore, type AdminRole } from '../data/authStore'

interface RoleRouteProps {
    allow: AdminRole[]
    redirectTo?: string
    children: React.ReactNode
}

/** Gates a nested admin route to specific roles — e.g. Settings/Services are owner-only. */
export default function RoleRoute({ allow, redirectTo = '/admin', children }: RoleRouteProps) {
    const session = authStore.getSession()
    if (!session || !allow.includes(session.role)) {
        return <Navigate to={redirectTo} replace />
    }
    return <>{children}</>
}
