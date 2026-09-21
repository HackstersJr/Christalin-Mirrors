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
        address: 'Orchid Mall, Mahaveer Nagar, Khuba Plot, Brahmpur, Kalaburagi 585105',
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
        address: 'College Road, Belgaum 590001',
        hours: 'Everyday: 10:00 AM – 9:00 PM',
        phone: '+91 8050153999',
        mapUrl: 'https://maps.app.goo.gl/yyaWwhcgf2MnbfbP8',
        image: branchBelgaum,
        status: 'operational',
    },
    {
        id: 'branch_manea',
        name: 'CM — Manea',
        city: 'Bengaluru, Karnataka',
        address: 'Sadashivanagar, Bengaluru 560080',
        hours: 'Everyday: 10:00 AM – 9:00 PM',
        phone: '+91 99001 18384',
        mapUrl: 'https://maps.google.com/?q=Sadashivanagar+Bengaluru',
        image: branchBengaluru,
        isUnderCeo: true,
        status: 'operational',
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

// Looks up a branch's address by its clean short name (e.g. "Belgaum", "Manea"), as
// stored on invoices/appointments/clients via mapBranch() in admin/data/store.ts
export function getBranchAddress(cleanBranchName: string): string | undefined {
    return branches.find(b => {
        const clean = b.name.replace('CM — ', '').replace(/\s*\([^)]*\)$/, '').trim()
        const fullClean = b.name.replace('CM — ', '').trim()
        return clean === cleanBranchName || fullClean === cleanBranchName || b.name === cleanBranchName
    })?.address
}

export const comingSoonBranches = [
    { name: 'CM — Yelahanka', city: 'Yelahanka Phase 1, Bengaluru' },
    { name: 'CM — Hassan', city: 'Hassan, Karnataka' },
    { name: 'CM — Hubballi', city: 'Hubballi, Karnataka' },
    { name: 'CM — Dubai', city: 'Dubai, UAE' },
]
