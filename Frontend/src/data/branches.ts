const branchBengaluru = "https://res.cloudinary.com/djrtoihj8/image/upload/v1780593536/WhatsApp_Image_2026-03-26_at_9.24.34_PM_w3eof8.jpg"
const branchKalaburagi = "https://res.cloudinary.com/djrtoihj8/image/upload/v1780593844/WhatsApp_Image_2026-06-04_at_2.56.43_PM_1_xatxwk.jpg"
const branchBelgaum = "/images/branches/belgaum.jpeg"

export interface Branch {
    id: string
    name: string
    city: string
    address: string
    hours: string
    phone: string
    mapUrl: string
    image: string
    isUnderCeo?: boolean
    status?: 'operational' | 'upcoming'
    targetLaunch?: string
    excludeFromBooking?: boolean
}

export const branches: Branch[] = [
    {
        id: 'branch_blr',
        name: 'CM — Bengaluru',
        city: 'Bengaluru, Karnataka',
        address: 'Century Ethos Club House, Bellary Rd, Bengaluru 560092',
        hours: 'Everyday: 10:00 AM – 9:00 PM',
        phone: '+91 7204236981',
        mapUrl: 'https://maps.google.com/?q=Century+Ethos+Club+House+Bellary+Road+Bengaluru',
        image: branchBengaluru,
        status: 'operational',
    },
    {
        id: 'branch_klb',
        name: 'CM — Kalaburagi (Gulbarga)',
        city: 'Kalaburagi, Karnataka',
        address: '2nd floor, Orchid Mall, Mahaveer Nagar, Khuba Plot, Brhampur, Kalaburagi, Karnataka 585102',
        hours: 'Everyday: 10:00 AM – 9:00 PM',
        phone: '+91 918715909',
        mapUrl: 'https://maps.google.com/?q=Orchid+Mall+Kalaburagi',
        image: branchKalaburagi,
        status: 'operational',
    },
    {
        id: 'branch_bgm',
        name: 'CM — Belgaum (Belagavi)',
        city: 'Belgaum, Karnataka',
        address: 'Ground Floor, Shop No. 2 Jadhav Nagar, Double Rd, Doordarshan Nagar, Belagavi, Karnataka 590019',
        hours: 'Everyday: 10:00 AM – 9:00 PM',
        phone: '+91 8050153999',
        mapUrl: 'https://maps.app.goo.gl/yyaWwhcgf2MnbfbP8',
        image: branchBelgaum,
        status: 'operational',
    },
    {
        id: 'branch_manea',
        name: 'CM — Manea',
        city: 'Kalaburagi, Karnataka',
        address: '',
        hours: 'Everyday: 10:00 AM – 9:00 PM',
        phone: '',
        mapUrl: '',
        image: branchKalaburagi,
        isUnderCeo: true,
        status: 'operational',
        excludeFromBooking: true,
    },
    {
        id: 'branch_upc_1',
        name: 'CM — Upcoming Branch 1 (Yelahanka)',
        city: 'Yelahanka Phase 1, Bengaluru',
        address: 'Major Arterial Rd, Yelahanka New Town, Bengaluru 560064',
        hours: 'Pre-Opening / Fitout Stage',
        phone: '+91 99001 18385',
        mapUrl: 'https://maps.google.com/?q=Yelahanka+Bengaluru',
        image: branchBengaluru,
        status: 'upcoming',
        targetLaunch: 'November 2026',
    },
    {
        id: 'branch_upc_2',
        name: 'CM — Upcoming Branch 2 (Hassan)',
        city: 'Hassan, Karnataka',
        address: 'BM Road, Hassan 573201',
        hours: 'Pre-Opening / Fitout Stage',
        phone: '+91 99001 18386',
        mapUrl: 'https://maps.google.com/?q=Hassan+Karnataka',
        image: branchBelgaum,
        status: 'upcoming',
        targetLaunch: 'January 2027',
    },
]

export function getCleanBranchName(name: string): string {
    return name.replace('CM — ', '').trim()
}

export const OPERATIONAL_BRANCH_NAMES = ['Bengaluru', 'Kalaburagi', 'Belgaum', 'Manea']
export const UPCOMING_BRANCH_NAMES = ['Upcoming Branch 1 (Yelahanka)', 'Upcoming Branch 2 (Hassan)']
export const ALL_SALON_BRANCH_NAMES = [...OPERATIONAL_BRANCH_NAMES, ...UPCOMING_BRANCH_NAMES]

// Active branches available for online client booking (excluding Manea which is booked separately)
export const bookableBranches = branches.filter(b => b.status === 'operational' && !b.excludeFromBooking)

// Looks up a branch's address by its name (e.g. "Belgaum", "Bengaluru", "Kalaburagi"),
// checking localStorage overrides first, then registered branch data.
export function getBranchAddress(branchName?: string): string {
    if (!branchName) return 'Ground Floor, Shop No. 2 Jadhav Nagar, Double Rd, Doordarshan Nagar, Belagavi, Karnataka 590019'
    const cleanBranch = branchName.replace('CM — ', '').replace(/\s*\([^)]*\)$/, '').trim()

    // 1. Check custom user-defined override from localStorage
    if (typeof window !== 'undefined') {
        try {
            const overrides = JSON.parse(localStorage.getItem('cm_branch_addresses') || '{}')
            if (overrides[cleanBranch]) return overrides[cleanBranch]
            if (overrides[branchName]) return overrides[branchName]
            // Case-insensitive match in overrides
            const matchedKey = Object.keys(overrides).find(k =>
                k.toLowerCase() === cleanBranch.toLowerCase() ||
                k.toLowerCase() === branchName.toLowerCase()
            )
            if (matchedKey && overrides[matchedKey]) return overrides[matchedKey]

            // Check admin salon settings in localStorage
            const savedSettings = localStorage.getItem('cm_settings')
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings)
                if (Array.isArray(parsed.branches)) {
                    const b = parsed.branches.find((br: any) =>
                        br.name?.toLowerCase().includes(cleanBranch.toLowerCase()) ||
                        cleanBranch.toLowerCase().includes(br.name?.toLowerCase() || '')
                    )
                    if (b?.address) return b.address
                }
            }
        } catch (_) {}
    }

    // 2. Match in corporate branch registry
    const lower = cleanBranch.toLowerCase()
    const matched = branches.find(b => {
        const bLower = b.name.toLowerCase()
        const bClean = b.name.replace('CM — ', '').replace(/\s*\([^)]*\)$/, '').trim().toLowerCase()
        return bLower === lower || bClean === lower || bLower.includes(lower) || lower.includes(bClean)
    })
    if (matched?.address) return matched.address

    // 3. Robust branch defaults
    if (lower.includes('belg') || lower.includes('bgm')) {
        return 'Ground Floor, Shop No. 2 Jadhav Nagar, Double Rd, Doordarshan Nagar, Belagavi, Karnataka 590019'
    }
    if (lower.includes('beng') || lower.includes('blr')) {
        return 'Century Ethos Club House, Bellary Rd, Bengaluru 560092'
    }
    if (lower.includes('kala') || lower.includes('gulb') || lower.includes('klb') || lower.includes('brham')) {
        return '2nd floor, Orchid Mall, Mahaveer Nagar, Khuba Plot, Brhampur, Kalaburagi, Karnataka 585102'
    }
    if (lower.includes('yelah')) {
        return 'Major Arterial Rd, Yelahanka New Town, Bengaluru 560064'
    }
    if (lower.includes('hassan')) {
        return 'BM Road, Hassan 573201'
    }

    return 'Ground Floor, Shop No. 2 Jadhav Nagar, Double Rd, Doordarshan Nagar, Belagavi, Karnataka 590019'
}

// Get phone number for a branch
export function getBranchPhone(branchName?: string): string {
    if (!branchName) return '+91 8050153999'
    const cleanBranch = branchName.replace('CM — ', '').replace(/\s*\([^)]*\)$/, '').trim()
    const lower = cleanBranch.toLowerCase()

    const matched = branches.find(b => {
        const bLower = b.name.toLowerCase()
        const bClean = b.name.replace('CM — ', '').replace(/\s*\([^)]*\)$/, '').trim().toLowerCase()
        return bLower === lower || bClean === lower || bLower.includes(lower) || lower.includes(bClean)
    })
    if (matched?.phone) return matched.phone

    if (lower.includes('belg') || lower.includes('bgm')) return '+91 8050153999'
    if (lower.includes('beng') || lower.includes('blr')) return '+91 7204236981'
    if (lower.includes('kala') || lower.includes('klb')) return '+91 918715909'
    return '+91 8050153999'
}

// Save custom address for any branch
export function saveCustomBranchAddress(branchName: string, address: string): void {
    if (typeof window === 'undefined') return
    try {
        const cleanBranch = branchName.replace('CM — ', '').replace(/\s*\([^)]*\)$/, '').trim()
        const overrides = JSON.parse(localStorage.getItem('cm_branch_addresses') || '{}')
        overrides[cleanBranch] = address
        localStorage.setItem('cm_branch_addresses', JSON.stringify(overrides))
    } catch (_) {}
}

export const comingSoonBranches = [
    { name: 'CM — Yelahanka', city: 'Yelahanka Phase 1, Bengaluru' },
    { name: 'CM — Hassan', city: 'Hassan, Karnataka' },
    { name: 'CM — Hubballi', city: 'Hubballi, Karnataka' },
    { name: 'CM — Dubai', city: 'Dubai, UAE' },
]
