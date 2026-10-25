import { ICONS } from './icons'

const cache = new Map<string, string>()

/**
 * The carousel draws images, so each service gets a generated card in the brand's
 * cream / blush / sand palette with its line icon. A selected service gets a check badge.
 */
export function cardArt(icon: string, selected: boolean): string {
    const key = `${icon}:${selected ? 1 : 0}`
    const hit = cache.get(key)
    if (hit) return hit

    const badge = selected
        ? `<circle cx="408" cy="72" r="34" fill="#2A2320"/>
           <path d="M391 73 L404 86 L427 59" fill="none" stroke="#FAF6F1" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`
        : ''
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="600" viewBox="0 0 480 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFDFB"/>
      <stop offset="0.55" stop-color="#F9E7DD"/>
      <stop offset="1" stop-color="#EFD8C0"/>
    </linearGradient>
    <radialGradient id="h" cx="0.25" cy="0.15" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="480" height="600" fill="url(#g)"/>
  <rect width="480" height="600" fill="url(#h)"/>
  <g transform="translate(90 150) scale(2.5)" color="#8A6B50" fill="none" stroke="#8A6B50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[icon] ?? ''}</g>
  ${badge}
</svg>`
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    cache.set(key, url)
    return url
}
