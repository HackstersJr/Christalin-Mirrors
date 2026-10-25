import { useEffect, useRef } from 'react'

// Silk pattern adapted from the "silk-background-animation" component: same flowing-fold maths and
// noise, recoloured to the Christalin light theme. It paints at a low resolution and is scaled up
// by CSS, which keeps the per-pixel loop cheap enough for phones.
const SPEED = 0.02
const SCALE = 2
const NOISE = 0.8
const MAX_WIDTH = 220

// light -> dark ramp: cream, soft blush, sand
const CREAM = [252, 248, 243]
const BLUSH = [244, 226, 212]
const SAND = [228, 200, 176]

const noise = (x: number, y: number) => {
    const G = 2.71828
    return (G * Math.sin(G * x) * G * Math.sin(G * y) * (1 + x)) % 1
}

const ramp = (t: number, out: number[]) => {
    // t 0..1 -> sand..blush..cream
    const [a, b, k] = t < 0.5 ? [SAND, BLUSH, t * 2] : [BLUSH, CREAM, (t - 0.5) * 2]
    out[0] = a[0] + (b[0] - a[0]) * k
    out[1] = a[1] + (b[1] - a[1]) * k
    out[2] = a[2] + (b[2] - a[2]) * k
}

export default function SilkBackground() {
    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const wrap = wrapRef.current
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!wrap || !canvas || !ctx) return undefined

        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
        const rgb = [0, 0, 0]
        let time = 0
        let raf = 0
        let image: ImageData | null = null

        const size = () => {
            const aspect = Math.max(0.2, wrap.clientHeight / Math.max(1, wrap.clientWidth))
            canvas.width = Math.min(MAX_WIDTH, Math.max(60, Math.round(wrap.clientWidth / 3)))
            canvas.height = Math.max(60, Math.round(canvas.width * aspect))
            image = ctx.createImageData(canvas.width, canvas.height)
        }

        const draw = () => {
            if (!image) return
            const { width, height } = canvas
            const data = image.data
            const t = SPEED * time
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const u = (x / width) * SCALE
                    const v = (y / height) * SCALE
                    const ty = v + 0.03 * Math.sin(8 * u - t)
                    const pattern =
                        0.6 +
                        0.4 *
                            Math.sin(
                                5 * (u + ty + Math.cos(3 * u + 5 * ty) + 0.02 * t) + Math.sin(20 * (u + ty - 0.1 * t)),
                            )
                    const level = Math.min(1, Math.max(0, pattern - (noise(x, y) / 15) * NOISE))
                    ramp(Math.min(1, Math.max(0, (level - 0.2) / 0.8)), rgb)
                    const i = (y * width + x) * 4
                    data[i] = rgb[0]
                    data[i + 1] = rgb[1]
                    data[i + 2] = rgb[2]
                    data[i + 3] = 255
                }
            }
            ctx.putImageData(image, 0, 0)
        }

        const frame = () => {
            raf = 0
            if (document.hidden) return
            time += 1
            draw()
            raf = requestAnimationFrame(frame)
        }

        const start = () => {
            if (reduce || raf) return
            raf = requestAnimationFrame(frame)
        }

        const resize = () => {
            size()
            draw()
        }
        const onVisibility = () => { if (!document.hidden) start() }

        const observer = new ResizeObserver(resize)
        observer.observe(wrap)
        document.addEventListener('visibilitychange', onVisibility)
        resize()
        start()

        return () => {
            cancelAnimationFrame(raf)
            observer.disconnect()
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [])

    return (
        <div ref={wrapRef} className="silk-bg" aria-hidden="true">
            <canvas ref={canvasRef} className="silk-bg-canvas" />
            <div className="silk-bg-veil" />
        </div>
    )
}
