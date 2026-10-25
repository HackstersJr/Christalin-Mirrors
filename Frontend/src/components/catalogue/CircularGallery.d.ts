import type { ComponentType, CSSProperties } from 'react'

export interface GalleryItem {
    image: string
    text?: string
    description?: string
    alt?: string
}

export interface CircularGalleryProps {
    items?: GalleryItem[]
    bend?: number
    textColor?: string
    borderRadius?: number
    font?: string
    fontUrl?: string
    scrollSpeed?: number
    scrollEase?: number
    itemSize?: number
    itemAspect?: number
    gap?: number
    wave?: number
    fadeEdges?: number
    shadow?: number
    grayscale?: boolean
    showTitles?: boolean
    snap?: boolean
    autoScroll?: number
    openOnClick?: boolean
    intro?: boolean
    onItemClick?: (item: GalleryItem, index: number) => void
    onActiveChange?: (index: number) => void
    /** Added for the catalogue: fires when a card is zoomed open (with its index) or closed. */
    onOpenChange?: (open: boolean, index?: number) => void
    /** Added for the catalogue: changing it returns to the first card without remounting. */
    resetKey?: string | number
    /** Added for the catalogue: px kept free below an opened card. */
    openReserve?: number
    dpr?: number
    className?: string
    style?: CSSProperties
}

declare const CircularGallery: ComponentType<CircularGalleryProps>
export default CircularGallery
