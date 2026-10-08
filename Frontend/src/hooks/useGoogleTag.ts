import { useEffect } from 'react'

// Loads Google tag (gtag.js) ONLY for the landing page — the
// site is a single-page app sharing one index.html across every route
// (including /admin and /book), so a static <script> in index.html would load everywhere.
const GA_MEASUREMENT_ID = 'G-9N9HY1MXTY'

declare global {
    interface Window {
        dataLayer: unknown[]
        gtag: (...args: unknown[]) => void
    }
}

let gtagInitialized = false

// Custom event helper for landing page conversions (call, WhatsApp, location clicks, book CTA).
// Strictly scoped to the landing page only.
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
    if (typeof window === 'undefined') return
    if (window.location.pathname !== '/' && window.location.pathname !== '') return
    window.gtag?.('event', eventName, params)
}

export function useGoogleTag() {
    useEffect(() => {
        if (typeof window === 'undefined') return
        // Only load and run on the landing page route
        if (window.location.pathname !== '/' && window.location.pathname !== '') {
            return
        }

        if (!gtagInitialized) {
            gtagInitialized = true

            // <!-- Google tag (gtag.js) -->
            const loaderScript = document.createElement('script')
            loaderScript.async = true
            loaderScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
            document.head.appendChild(loaderScript)

            window.dataLayer = window.dataLayer || []
            window.gtag = function gtag(...args: unknown[]) { window.dataLayer.push(args) }
            window.gtag('js', new Date())
            window.gtag('config', GA_MEASUREMENT_ID)
        } else {
            // Already loaded earlier this visit and returned to landing page
            window.gtag?.('event', 'page_view', { page_path: '/' })
        }
    }, [])
}
