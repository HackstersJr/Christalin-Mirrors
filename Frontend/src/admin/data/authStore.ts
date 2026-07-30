import { supabase } from '../../lib/supabase'

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

/**
 * Demo credentials shown on the login screen for convenience only.
 * These are NOT the source of truth — authentication is performed by
 * Supabase Auth (see login()). Each of these emails must exist as a
 * Supabase Auth user (see supabase/create_admin_auth_users.sql).
 */
export const mockAdminUsers: AdminUser[] = [
    { email: 'manager.bengaluru@christalinmirrors.com', password: 'Manager@123', name: 'Bangalore Manager', role: 'manager', branch: 'Bengaluru' },
    { email: 'manager.kalaburagi@christalinmirrors.com', password: 'Manager@123', name: 'Soniya', role: 'manager', branch: 'Kalaburagi' },
    { email: 'manager.belgaum@christalinmirrors.com', password: 'Manager@123', name: 'Manager Belgaum', role: 'manager', branch: 'Belgaum' },
    { email: 'owner@christalinmirrors.com', password: 'Owner@123', name: 'Sushmitha Cristalin A.', role: 'owner', branch: null },
]

const SESSION_KEY = 'cm_admin_session'

function normalizeRole(role: unknown): AdminRole {
    const r = String(role || '').toLowerCase()
    if (r === 'owner' || r === 'manager' || r === 'receptionist') return r
    return 'receptionist'
}

export const authStore = {
    /**
     * Authenticates against Supabase Auth. The signed-in session's JWT is
     * automatically attached by the supabase-js client to every subsequent
     * query, which is what RLS policies use to grant admin access.
     * Role/branch/name are read from the user's metadata.
     */
    async login(email: string, password: string): Promise<AdminSession | null> {
        const cleanEmail = email.trim().toLowerCase()

        const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
        })

        if (error || !data.user || !data.session) return null

        const meta = { ...data.user.app_metadata, ...data.user.user_metadata } as Record<string, unknown>
        const role = normalizeRole(meta.role)
        const branch = role === 'owner' ? null : ((meta.branch as string) || null)

        const session: AdminSession = {
            email: data.user.email || cleanEmail,
            name: (meta.name as string) || data.user.email || cleanEmail,
            role,
            branch,
        }

        // Kept for backward-compat with existing route guards.
        localStorage.setItem('adminToken', data.session.access_token)
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        return session
    },

    getSession(): AdminSession | null {
        const raw = localStorage.getItem(SESSION_KEY)
        return raw ? JSON.parse(raw) : null
    },

    async logout() {
        try { await supabase.auth.signOut() } catch { /* ignore */ }
        localStorage.removeItem('adminToken')
        localStorage.removeItem(SESSION_KEY)
    },
}

export function getBranchScope(): string | null {
    return authStore.getSession()?.branch || null
}

export function scopeByBranch<T extends { branch?: string; branchId?: string }>(items: T[]): T[] {
    const scope = getBranchScope()
    if (!scope) return items
    const cleanScope = scope.toLowerCase()

    return items.filter((i) => {
        const b = (i.branch || '').toLowerCase()
        const bId = (i.branchId || '').toLowerCase()

        if (cleanScope.includes('bengaluru') || cleanScope.includes('blr')) {
            return b.includes('bengaluru') || b.includes('blr') || bId.includes('blr')
        }
        if (cleanScope.includes('kalaburagi') || cleanScope.includes('kalburgi') || cleanScope.includes('klb')) {
            return b.includes('kalaburagi') || b.includes('kalburgi') || b.includes('klb')
        }
        if (cleanScope.includes('belgaum') || cleanScope.includes('belagavi') || cleanScope.includes('bgm')) {
            return b.includes('belgaum') || b.includes('belagavi') || b.includes('bgm')
        }
        return b === cleanScope || bId === cleanScope || b.includes(cleanScope)
    })
}
