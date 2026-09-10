import { useEffect } from 'react'

// Loads Google tag (gtag.js) only for the page that calls this hook — the
// site is a single-page app sharing one index.html across every route
// (including /admin), so a static <script> there would load on every page.
const GA_MEASUREMENT_ID = 'G-9N9HY1MXTY'

declare global {
    interface Window {
        dataLayer: unknown[]
        gtag: (...args: unknown[]) => void
    }
}

let gtagInitialized = false

// Custom event helper for anything beyond GA4's automatic page_view/scroll/
// outbound-click tracking — e.g. the booking funnel steps and the
// booking-submitted conversion. No-ops safely if gtag hasn't loaded yet
// (page not tracked, or fired before the script finished loading).
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
    window.gtag?.('event', eventName, params)
}

export function useGoogleTag() {
    useEffect(() => {
        if (!gtagInitialized) {
            gtagInitialized = true

            const loaderScript = document.createElement('script')
            loaderScript.async = true
            loaderScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
            document.head.appendChild(loaderScript)

            window.dataLayer = window.dataLayer || []
            window.gtag = function gtag(...args: unknown[]) { window.dataLayer.push(args) }
            window.gtag('js', new Date())
            window.gtag('config', GA_MEASUREMENT_ID)
        } else {
            // Already loaded earlier this visit (e.g. navigated Book -> Home
            // -> Book again) — record the view without re-initializing gtag,
            // which would otherwise send a duplicate config/page_view hit.
            window.gtag?.('event', 'page_view', { page_path: window.location.pathname })
        }
    }, [])
}
