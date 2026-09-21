import { initializeApp, getApps } from 'firebase/app'
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    type User,
} from 'firebase/auth'
import firebaseConfig from '../../firebase-applet-config.json'

// Ensure single Firebase App initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)

export const GOOGLE_SHEETS_SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
]

const provider = new GoogleAuthProvider()
for (const scope of GOOGLE_SHEETS_SCOPES) {
    provider.addScope(scope)
}
// Prompt user to select account if needed
provider.setCustomParameters({
    prompt: 'select_account',
})

// In-memory token cache (strictly NOT stored in localStorage/sessionStorage as required by security guidelines)
let cachedAccessToken: string | null = null
let currentUser: User | null = null
let isSigningIn = false

type AuthListener = (user: User | null, token: string | null) => void
const listeners: Set<AuthListener> = new Set()

function notifyListeners() {
    for (const listener of listeners) {
        try {
            listener(currentUser, cachedAccessToken)
        } catch (e) {
            console.error('Error in auth listener', e)
        }
    }
}

// Initialize auth state observer
onAuthStateChanged(auth, async (user: User | null) => {
    currentUser = user
    if (!user) {
        cachedAccessToken = null
    }
    notifyListeners()
})

export const googleAuthService = {
    /**
     * Subscribe to Google Auth state changes
     */
    subscribe(listener: AuthListener): () => void {
        listeners.add(listener)
        // Immediately invoke with current state
        listener(currentUser, cachedAccessToken)
        return () => {
            listeners.delete(listener)
        }
    },

    /**
     * Sign in via official Google popup and obtain access token
     */
    async signIn(): Promise<{ user: User; accessToken: string }> {
        try {
            isSigningIn = true
            const result = await signInWithPopup(auth, provider)
            const credential = GoogleAuthProvider.credentialFromResult(result)

            if (!credential?.accessToken) {
                throw new Error('Google sign-in completed, but no access token was returned for Google Sheets.')
            }

            cachedAccessToken = credential.accessToken
            currentUser = result.user
            notifyListeners()

            return {
                user: result.user,
                accessToken: credential.accessToken,
            }
        } catch (error: any) {
            console.error('Google Sign-in failed:', error)
            throw error
        } finally {
            isSigningIn = false
        }
    },

    /**
     * Disconnect Google account and clear token from memory
     */
    async signOut(): Promise<void> {
        await auth.signOut()
        cachedAccessToken = null
        currentUser = null
        notifyListeners()
    },

    getAccessToken(): string | null {
        return cachedAccessToken
    },

    getCurrentUser(): User | null {
        return currentUser || auth.currentUser
    },

    isAuthenticated(): boolean {
        return !!currentUser && !!cachedAccessToken
    },
}
