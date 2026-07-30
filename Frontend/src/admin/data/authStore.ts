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

export const mockAdminUsers: AdminUser[] = [
    { email: 'christalinmirrors.admin@gmail.com', password: 'Admin@1234', name: 'Sushmitha Cristalin A.', role: 'owner', branch: null },
    { email: 'owner@christalinmirrors.com', password: 'Admin@1234', name: 'Sushmitha Cristalin A.', role: 'owner', branch: null },
    { email: 'manager.bengaluru@christalinmirrors.com', password: 'Manager@123', name: 'Rohit Bhandari', role: 'manager', branch: 'Bengaluru' },
    { email: 'manager.kalaburagi@christalinmirrors.com', password: 'Manager@123', name: 'Divya Menon', role: 'manager', branch: 'Kalaburagi' },
    { email: 'reception.bengaluru@christalinmirrors.com', password: 'Reception@123', name: 'Preethi S.', role: 'receptionist', branch: 'Bengaluru' },
]

const SESSION_KEY = 'cm_admin_session'

export const authStore = {
    /** Validates credentials against Supabase / fallback demo accounts. */
    async login(email: string, password: string): Promise<AdminSession | null> {
        const cleanEmail = email.trim().toLowerCase()

        // 1. Check Supabase DB first
        try {
            const { data: dbUser } = await supabase
                .from('User')
                .select('*, staff:Staff(*, branch:Branch(*))')
                .eq('email', cleanEmail)
                .single()

            if (dbUser && dbUser.isActive) {
                const roleLower = String(dbUser.role).toLowerCase() as AdminRole
                const branchName = dbUser.staff?.branch?.name ? dbUser.staff.branch.name.replace('CM — ', '') : null
                const session: AdminSession = {
                    email: dbUser.email,
                    name: dbUser.staff?.name || dbUser.email,
                    role: roleLower === ('owner' as any) ? 'owner' : roleLower,
                    branch: roleLower === 'owner' ? null : branchName,
                }
                localStorage.setItem('adminToken', dbUser.id)
                localStorage.setItem(SESSION_KEY, JSON.stringify(session))
                return session
            }
        } catch {
            // fallback below if db error or missing table entry
        }

        // 2. Demo fallback
        const user = mockAdminUsers.find(
            (u) => u.email.toLowerCase() === cleanEmail && u.password === password
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

export function getBranchScope(): string | null {
    return authStore.getSession()?.branch || null
}

export function scopeByBranch<T extends { branch: string }>(items: T[]): T[] {
    const scope = getBranchScope()
    return scope ? items.filter((i) => i.branch === scope) : items
}
