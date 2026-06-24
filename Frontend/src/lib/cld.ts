// Cloudinary on-the-fly image transforms.
//
// Injects three transforms into the delivery URL so images are served
// right-sized per device, WITHOUT any visible loss of quality:
//   f_auto  — auto format (WebP / AVIF when the browser supports it)
//   q_auto  — auto quality (perceptually lossless; this is what keeps
//             images looking sharp, not low-res)
//   c_limit — only ever scales DOWN, never upscales past the source,
//             so requesting a large width can never blur an image.
//
// Non-Cloudinary URLs (or anything unexpected) are returned untouched.

const UPLOAD = '/image/upload/'

/** Return `url` with transforms applied, optionally capped to `width` px. */
export function cld(url: string, width?: number): string {
    if (!url || !url.includes(UPLOAD)) return url
    const [base, rest] = url.split(UPLOAD)
    const t = ['f_auto', 'q_auto', 'c_limit']
    if (width) t.push(`w_${width}`)
    return `${base}${UPLOAD}${t.join(',')}/${rest}`
}

/** Build a responsive `srcset` string across the given candidate widths. */
export function cldSrcSet(url: string, widths: number[]): string {
    if (!url || !url.includes(UPLOAD)) return ''
    return widths.map((w) => `${cld(url, w)} ${w}w`).join(', ')
}
