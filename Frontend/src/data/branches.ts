const branchBengaluru = "https://res.cloudinary.com/djrtoihj8/image/upload/v1780593536/WhatsApp_Image_2026-03-26_at_9.24.34_PM_w3eof8.jpg"
const branchKalaburagi = "https://res.cloudinary.com/djrtoihj8/image/upload/v1780593844/WhatsApp_Image_2026-06-04_at_2.56.43_PM_1_xatxwk.jpg"

export interface Branch {
    id: string
    name: string
    city: string
    address: string
    hours: string
    phone: string
    mapUrl: string
    image: string
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
    },
    {
        id: 'branch_bgm',
        name: 'CM — Belgaum (Belagavi)',
        city: 'Belgaum, Karnataka',
        address: 'College Road, Belgaum 590001',
        hours: 'Everyday: 10:00 AM – 9:00 PM',
        phone: '+91 8050153999',
        mapUrl: 'https://maps.app.goo.gl/yyaWwhcgf2MnbfbP8',
        image: branchBengaluru,
    },
]

export const comingSoonBranches = [
    { name: 'CM — Yelahanka', city: 'Yelahanka Phase 1, Bengaluru' },
    { name: 'CM — Hassan', city: 'Hassan, Karnataka' },
    { name: 'CM — Hubballi', city: 'Hubballi, Karnataka' },
    { name: 'CM — Dubai', city: 'Dubai, UAE' },
]
