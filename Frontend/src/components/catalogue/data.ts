// Self-contained catalogue data, taken from Catalogs/Christalin_Mirrors_Services_{women,men}.md.
// Intentionally not linked to the admin services store, bookings or the landing-page services list.
export type Audience = 'women' | 'men'

export interface CatalogueItem {
    id: string
    gi: number
    si: number
    group: string
    name: string
    /** Sub-category from the price list, shown under the name in the detail sheet. */
    sub?: string
    icon: string
    priceN: number
    price: string
}

export interface CatalogueGroup {
    name: string
    items: CatalogueItem[]
}

// [name, icon, price, sub-category?, price footnote?]
type Raw = [name: string, icon: string, price: number, sub?: string, star?: boolean]

const WOMEN: { name: string; items: Raw[] }[] = [
    { name: 'Bridal', items: [
        ['Engagement Look', 'updo', 7000, 'Bridal Package'],
        ['Mac Makeover', 'lipstick', 10000, 'Bridal Package'],
        ['High Definition Look', 'brush', 15000, 'Bridal Package'],
        ['Luxury HD', 'lipstick', 18000, 'Bridal Package'],
        ['AIRBRUSH Makeup', 'brush', 23000, 'Bridal Package'],
    ] },
    { name: 'Party & Styling', items: [
        ['Saree Draping', 'hanger', 500, 'Non Bridal Package'],
        ['Hair Style', 'updo', 500, 'Non Bridal Package', true],
        ['Basic Party Makeup', 'lipstick', 3500, 'Non Bridal Package'],
        ['Pro Makeup', 'brush', 5000, 'Non Bridal Package'],
        ['Mac Makeup', 'lipstick', 7000, 'Non Bridal Package'],
        ['HD Makeup', 'brush', 10000, 'Non Bridal Package'],
    ] },
    { name: 'Facials', items: [
        ['Crystal White Brightening Facial', 'sparkle', 4200, 'Deep Hydration Facials'],
        ['Signature Facial', 'face', 4500, 'Deep Hydration Facials'],
        ['Hydra Aloe Facial', 'drops', 2500, 'Glass Skin Facials'],
        ['Korean Glass Skin Hydra Facial', 'drops', 6000, 'Glass Skin Facials'],
        ['Herbal Facial', 'face', 1100, 'Skin Therapy'],
        ['Bridal Radiance Signature Facial', 'sparkle', 4000, 'Skin Therapy'],
        ['Shine & Glow Illuminating Facial', 'sparkle', 2000, 'Skin Therapy'],
        ['Classic Glow Facial', 'face', 2000, 'Skin Therapy'],
        ['Clear Skin Acne Defense Facial', 'face', 3500, 'Skin Therapy'],
        ['Youth Revival Anti-Aging Facial', 'face', 3500, 'Skin Therapy'],
        ['Deep Pore Detox Clean-up', 'sparkle', 1000, 'Essential Skin Cleanup'],
        ['Radiant White Clean-Up', 'sparkle', 1500, 'Essential Skin Cleanup'],
    ] },
    { name: 'Bleach', items: [
        ['Face & Neck', 'sun', 600, 'Even Tone Therapy'],
        ['Full Arms', 'sun', 900, 'Even Tone Therapy'],
        ['Half Arms', 'sun', 700, 'Even Tone Therapy'],
        ['Full Legs', 'sun', 1500, 'Even Tone Therapy'],
        ['Half Legs', 'sun', 1000, 'Even Tone Therapy'],
        ['Under Arms', 'sun', 300, 'Even Tone Therapy'],
        ['Feet', 'sun', 800, 'Even Tone Therapy'],
        ['Full Body', 'sun', 1000, 'Even Tone Therapy'],
    ] },
    { name: 'D-Tan Raga', items: [
        ['Face & Neck', 'sun', 700, 'DTAN · Raga'],
        ['Full Arms', 'sun', 1000, 'DTAN · Raga'],
        ['Half Arms', 'sun', 800, 'DTAN · Raga'],
        ['Full Legs', 'sun', 1500, 'DTAN · Raga'],
        ['Half Legs', 'sun', 1000, 'DTAN · Raga'],
        ['Under Arms', 'sun', 300, 'DTAN · Raga'],
        ['Feet', 'sun', 500, 'DTAN · Raga'],
        ['Full Body', 'sun', 4000, 'DTAN · Raga'],
        ['Full Back', 'sun', 1000, 'DTAN · Raga'],
        ['Blouse Line', 'sun', 800, 'DTAN · Raga'],
    ] },
    { name: 'D-Tan O3+', items: [
        ['Face & Neck', 'sun', 1000, 'DTAN · O3+'],
        ['Full Arms', 'sun', 1500, 'DTAN · O3+'],
        ['Half Arms', 'sun', 1000, 'DTAN · O3+'],
        ['Full Legs', 'sun', 2000, 'DTAN · O3+'],
        ['Half Legs', 'sun', 1500, 'DTAN · O3+'],
        ['Under Arms', 'sun', 400, 'DTAN · O3+'],
        ['Feet', 'sun', 800, 'DTAN · O3+'],
        ['Full Body', 'sun', 6000, 'DTAN · O3+'],
        ['Full Back', 'sun', 1500, 'DTAN · O3+'],
        ['Blouse Line', 'sun', 1000, 'DTAN · O3+'],
    ] },
    { name: 'Waxing', items: [
        ['Full Arms', 'lotus', 700, 'Signature Beauty Rituals'],
        ['Half Arms', 'lotus', 400, 'Signature Beauty Rituals'],
        ['Full Legs', 'lotus', 900, 'Signature Beauty Rituals'],
        ['Half Legs', 'lotus', 500, 'Signature Beauty Rituals'],
        ['Under Arms', 'lotus', 250, 'Signature Beauty Rituals'],
        ['Full Body', 'lotus', 4000, 'Signature Beauty Rituals'],
        ['Brazilian / Bikini Wax', 'lotus', 2000, 'Signature Beauty Rituals'],
        ['Stomach / Chest', 'lotus', 600, 'Signature Beauty Rituals'],
        ['Back / Side', 'lotus', 600, 'Signature Beauty Rituals'],
        ['Chin / Ear', 'lotus', 150, 'Signature Beauty Rituals'],
        ['Nostrils', 'lotus', 300, 'Signature Beauty Rituals'],
        ['Nose / Upper Lip', 'lotus', 150, 'Signature Beauty Rituals'],
        ['Side Locks', 'lotus', 150, 'Signature Beauty Rituals'],
        ['Forehead', 'lotus', 150, 'Signature Beauty Rituals'],
        ['Jawline Cheeks', 'lotus', 150, 'Signature Beauty Rituals'],
        ['Full Face', 'lotus', 600, 'Signature Beauty Rituals'],
    ] },
    { name: 'Nails', items: [
        ['Nail Art (per nail)', 'polish', 100, 'Nails'],
        ['Extension Removal', 'polish', 900, 'Nails'],
        ['Gel Nail Paint Removal', 'polish', 400, 'Nails'],
        ['Gel Polish', 'polish', 700, 'Nails'],
        ['Acrylic Extension with Art', 'polish', 2500, 'Nails'],
        ['Gel Extended with Art', 'polish', 3000, 'Nails'],
        ['Temporary Extension with Art', 'polish', 1500, 'Nails'],
    ] },
    { name: 'Mani & Pedi', items: [
        ['Classic Manicure', 'polish', 600, 'Manicure'],
        ['Bomb Manicure', 'polish', 1200, 'Manicure'],
        ['Spa Manicure', 'polish', 1500, 'Manicure'],
        ['Classic Pedicure', 'lotus', 800, 'Pedicure'],
        ['Bomb Pedicure', 'lotus', 1500, 'Pedicure'],
        ['Spa Pedicure', 'lotus', 2000, 'Pedicure'],
    ] },
    { name: 'Massage', items: [
        ['Calming Body Massage', 'lotus', 2000, 'Wellness Massage Therapies'],
        ['Body Scrub', 'bowl', 1500, 'Wellness Massage Therapies'],
        ['Body Polish', 'sparkle', 4000, 'Wellness Massage Therapies'],
        ['Radiance Treatment', 'sparkle', 7000, 'Wellness Massage Therapies'],
        ['Foot Massage', 'lotus', 600, 'Wellness Massage Therapies'],
        ['Back Massage', 'lotus', 600, 'Wellness Massage Therapies'],
        ['Hand Massage', 'lotus', 600, 'Wellness Massage Therapies'],
        ['Coconut Oil Head Massage', 'dome', 600, 'Head Massage'],
        ['Almond Oil Head Massage', 'dome', 700, 'Head Massage'],
        ['Olive Oil Head Massage', 'dome', 900, 'Head Massage'],
    ] },
]

const MEN: { name: string; items: Raw[] }[] = [
    { name: 'Haircut', items: [
        ['Classic Haircut', 'scissors', 300, 'Haircut & Styling'],
        ['Wash, Conditioning & Styling', 'dryer', 300, 'Haircut & Styling'],
        ['Creative Haircut', 'scissors', 500, 'Haircut & Styling'],
        ['Kids (U-12)', 'scissors', 200, 'Haircut & Styling'],
        ['Head Shave', 'razor', 200, 'Haircut & Styling'],
        ['Beard Trim / Shave', 'comb', 150, 'Haircut & Styling'],
        ['Wash & Blast Dry', 'dryer', 150, 'Haircut & Styling'],
        ['Hair Style', 'dryer', 150, 'Haircut & Styling'],
    ] },
    { name: 'Colouring', items: [
        ['Streaks (per streak)', 'foil', 250, 'Hair Colouring'],
        ['Global Ammonia Free', 'bowl', 1500, 'Hair Colouring'],
        ['Beard Colour', 'bottle', 500, 'Hair Colouring'],
        ['Moustache Colour', 'bottle', 250, 'Hair Colouring'],
        ['Side Locks Colour', 'bottle', 250, 'Hair Colouring'],
    ] },
    { name: 'Treatments', items: [
        ['Smoothening', 'strands', 3500, 'Hair Treatments'],
        ['Keratin', 'strands', 3000, 'Hair Treatments'],
        ['Botox', 'strands', 4000, 'Hair Treatments'],
    ] },
    { name: 'Hair Care', items: [
        ['Nourishing Spa', 'drop', 1000, 'Hair Care'],
        ['Repair and Rejuvenate', 'drop', 1500, 'Hair Care'],
        ['Anti Hair Fall Treatment', 'strands', 2000, 'Hair Care'],
        ['Anti Dandruff Treatment', 'drop', 2000, 'Hair Care'],
        ['Scalp Therapy', 'dome', 2500, 'Hair Care'],
        ['3tenx Nourishing Spa', 'drop', 1500, 'Hair Care'],
        ['3tenx Nourishing Spa', 'drop', 2000, 'Hair Care'],
        ['Ola Plex Spa Rituals', 'drop', 2000, 'Hair Care'],
        ['Ola Plex Bond Repair Treatment', 'strands', 3000, 'Hair Care'],
    ] },
    { name: 'Skin Care', items: [
        ['D-Tan · Raga', 'sun', 700, 'Detan'],
        ['D-Tan · O3+', 'sun', 1000, 'Detan'],
        ['Pore Clean-up', 'sparkle', 1000, 'Cleanup'],
        ['Whitening Clean-up', 'sparkle', 1500, 'Cleanup'],
    ] },
    { name: 'Facials', items: [
        ['Herbal Facial', 'face', 1100, 'Even Tone Therapy'],
        ['Classic Facial', 'face', 2000, 'Even Tone Therapy'],
        ['Anti Aging Facial', 'face', 3500, 'Even Tone Therapy'],
        ['Shine and Glow Facial', 'sparkle', 3000, 'Even Tone Therapy'],
        ['Acne Reduction Facial', 'face', 2500, 'Even Tone Therapy'],
        ['Perfect Radiant Facial', 'sparkle', 4000, 'Even Tone Therapy'],
        ['Whitening Facial', 'sparkle', 4200, 'Even Tone Therapy'],
        ['Hydra Aloe Facial', 'drops', 2000, 'Glass Skin Hydra Facial'],
        ['Korean Glass Skin Hydra Facial', 'drops', 6000, 'Glass Skin Hydra Facial'],
    ] },
    { name: 'Hands & Feet', items: [
        ['Classic Manicure', 'polish', 600, 'Manicure'],
        ['Bomb Manicure', 'polish', 1200, 'Manicure'],
        ['Spa Manicure', 'polish', 1500, 'Manicure'],
        ['Classic Pedicure', 'lotus', 800, 'Pedicure'],
        ['Bomb Pedicure', 'lotus', 1500, 'Pedicure'],
        ['Spa Pedicure', 'lotus', 2000, 'Pedicure'],
    ] },
    { name: 'Massage', items: [
        ['Calming Body Massage', 'lotus', 2000, 'Wellness Massage Therapies'],
        ['Body Scrub', 'bowl', 1500, 'Wellness Massage Therapies'],
        ['Body Polish', 'sparkle', 4000, 'Wellness Massage Therapies'],
        ['Radiance Treatment', 'sparkle', 7000, 'Wellness Massage Therapies'],
        ['Foot Massage', 'lotus', 600, 'Wellness Massage Therapies'],
        ['Back Massage', 'lotus', 600, 'Wellness Massage Therapies'],
        ['Hand Massage', 'lotus', 600, 'Wellness Massage Therapies'],
        ['Coconut Oil Head Massage', 'dome', 600, 'Head Massage'],
        ['Almond Oil Head Massage', 'dome', 700, 'Head Massage'],
        ['Olive Oil Head Massage', 'dome', 900, 'Head Massage'],
    ] },
]

export const formatPrice = (n: number, star = false) => '₹ ' + n.toLocaleString('en-IN') + (star ? '*' : '')

const build = (aud: Audience, raw: typeof WOMEN): CatalogueGroup[] =>
    raw.map((g, gi) => ({
        name: g.name,
        items: g.items.map((it, si) => ({
            id: `${aud}-${gi}-${si}`, gi, si, group: g.name, name: it[0], sub: it[3], icon: it[1],
            priceN: it[2], price: formatPrice(it[2], it[4]),
        })),
    }))

export const CATALOGUES: Record<Audience, CatalogueGroup[]> = {
    women: build('women', WOMEN),
    men: build('men', MEN),
}

export const FLAT: Record<Audience, CatalogueItem[]> = {
    women: CATALOGUES.women.flatMap(g => g.items),
    men: CATALOGUES.men.flatMap(g => g.items),
}

/** Every item across both lists, so a selection survives switching Women/Men. */
export const ALL_ITEMS: CatalogueItem[] = [...FLAT.women, ...FLAT.men]
