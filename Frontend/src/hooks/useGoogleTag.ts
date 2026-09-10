import { useEffect } from 'react'

// Loads Google tag (gtag.js) only for the page that calls this hook — the
// site is a single-page app sharing one index.html across every route
// (including /admin), so a static <script> there would load on every page.
const GA_MEASUREMENT_ID = 'G-9N9HY1MXTY'

export function useGoogleTag() {
    useEffect(() => {
        const loaderScript = document.createElement('script')
        loaderScript.async = true
        loaderScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
        document.head.appendChild(loaderScript)

        const inlineScript = document.createElement('script')
        inlineScript.text = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
        `
        document.head.appendChild(inlineScript)

        return () => {
            loaderScript.remove()
            inlineScript.remove()
        }
    }, [])
}
