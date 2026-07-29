// ═══════════════════════════════════════════════════════════════
//  Admin Auth — mock login + session (Backend-Ready)
//  Replace validate() with a real POST /api/auth/login call later.
// ═══════════════════════════════════════════════════════════════

export type AdminRole = 'owner' | 'manager' | 'receptionist'

export interface AdminUser {
    email: string
    password: string
    name: string
    role: AdminRole
    branch: string | null // null = every branch (owner only)
}

export interface AdminSession {
    email: string
    name: string
    role: AdminRole
    branch: string | null
}

// Demo accounts — OWNER sees every branch, MANAGER / RECEPTIONIST are
// pinned to the one branch they work at.
export const mockAdminUsers: AdminUser[] = [
    { email: 'owner@christalinmirrors.com', password: 'Admin@1234', name: 'Sushmitha Cristalin A.', role: 'owner', branch: null },
    { email: 'manager.bengaluru@christalinmirrors.com', password: 'Manager@123', name: 'Rohit Bhandari', role: 'manager', branch: 'Bengaluru' },
    { email: 'manager.kalaburagi@christalinmirrors.com', password: 'Manager@123', name: 'Divya Menon', role: 'manager', branch: 'Kalaburagi' },
    { email: 'reception.bengaluru@christalinmirrors.com', password: 'Reception@123', name: 'Preethi S.', role: 'receptionist', branch: 'Bengaluru' },
]

const SESSION_KEY = 'cm_admin_session'

export const authStore = {
    /** Validates credentials against the mock user list. Returns the session on success. */
    login(email: string, password: string): AdminSession | null {
        const user = mockAdminUsers.find(
            (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
        )
        if (!user) return null

        const session: AdminSession = { email: user.email, name: user.name, role: user.role, branch: user.branch }
        localStorage.setItem('adminToken', 'dev-token')
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        return session
    },

    getSession(): AdminSession | null {
        const raw = localStorage.getItem(SESSION_KEY)
        return raw ? JSON.parse(raw) : null
    },

    logout() {
        localStorage.removeItem('adminToken')
        localStorage.removeItem(SESSION_KEY)
    },
}

/** The logged-in user's branch, or null for owner (every branch). */
export function getBranchScope(): string | null {
    return authStore.getSession()?.branch || null
}

/** Filters a branch-tagged list down to the current session's branch. Owner sees everything. */
export function scopeByBranch<T extends { branch: string }>(items: T[]): T[] {
    const scope = getBranchScope()
    return scope ? items.filter((i) => i.branch === scope) : items
}
