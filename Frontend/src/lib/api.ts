import axios from 'axios'
import { config } from './config'

const TOKEN_KEY = 'adminToken'
const USER_KEY = 'adminUser'

export interface AuthUser {
    id: string
    email: string
    role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST'
    staffId: string
    name: string
    branch: string
    branchId: string
}

export const auth = {
    token: () => localStorage.getItem(TOKEN_KEY),
    user: (): AuthUser | null => {
        const raw = localStorage.getItem(USER_KEY)
        return raw ? JSON.parse(raw) : null
    },
    set(token: string, user: AuthUser) {
        localStorage.setItem(TOKEN_KEY, token)
        localStorage.setItem(USER_KEY, JSON.stringify(user))
    },
    clear() {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
    },
}

// Public API instance (landing page — branches, services, contact)
export const publicApi = axios.create({
    baseURL: `${config.apiBaseUrl}/api`,
    headers: { 'Content-Type': 'application/json' },
})

// Admin API instance (authenticated)
export const adminApi = axios.create({
    baseURL: `${config.apiBaseUrl}/api`,
    headers: { 'Content-Type': 'application/json' },
})

adminApi.interceptors.request.use((requestConfig: any) => {
    const token = auth.token()
    if (token && requestConfig.headers) {
        requestConfig.headers.Authorization = `Bearer ${token}`
    }
    return requestConfig
})

/**
 * v1 has a single 12-hour access token and no refresh flow, so a 401 simply
 * means the session is over: clear it and send the user to login.
 * Deliberately no refresh-retry interceptor — see MVP_DEFERRED_TECH_DEBT.md.
 */
adminApi.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
        if (error.response?.status === 401) {
            auth.clear()
            if (!window.location.pathname.startsWith('/admin/login')) {
                window.location.href = '/admin/login'
            }
        }
        return Promise.reject(error)
    }
)

/** Pull a usable message out of an axios error for toasts. */
export function apiError(err: any): string {
    const d = err?.response?.data
    if (d?.details?.length) return d.details.map((x: any) => `${x.field}: ${x.message}`).join(', ')
    return d?.message || err?.message || 'Something went wrong'
}
