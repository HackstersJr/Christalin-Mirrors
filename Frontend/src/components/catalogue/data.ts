// Self-contained catalogue data. Intentionally not linked to the admin services
// store, bookings or the landing-page services list.
export interface CatalogueItem {
    id: string
    gi: number
    si: number
    group: string
    name: string
    icon: string
    priceN: number
    price: string
    time: string
    desc: string
}

export interface CatalogueGroup {
    name: string
    items: CatalogueItem[]
}

type Raw = [name: string, icon: string, price: number, time: string, desc: string]

const RAW: { name: string; items: Raw[] }[] = [
    { name: 'Cut & Style', items: [
        ['Signature Haircut', 'scissors', 900, '45 min', 'A consultation-led cut shaped to your face, texture and routine, finished with a gentle wash and style.'],
        ['Blow-dry & Style', 'dryer', 600, '30 min', 'Wash, blow-dry and finish. Smooth, voluminous or softly waved, ready for the evening.'],
        ['Beard Styling', 'comb', 500, '30 min', 'Considered shaping and lining of the beard, completed with a warm towel finish.'],
        ['Razor Shave', 'razor', 400, '25 min', 'A traditional razor shave with hot towel and soothing aftercare.'],
    ] },
    { name: 'Colour', items: [
        ['Global Colour', 'bowl', 3500, '2 hr', 'One rich, even shade from root to tip, mixed to your tone and finished with a gloss.'],
        ['Highlights', 'foil', 4500, '2.5 hr', 'Hand-placed foils that add dimension and light, softly blended into your base.'],
        ['Balayage', 'balayage', 6500, '3 hr', 'Freehand-painted, sun-kissed colour that grows out gracefully.'],
        ['Root Touch-up', 'bottle', 1200, '1 hr', 'A precise refresh of the regrowth, matched to your existing shade.'],
    ] },
    { name: 'Treatments', items: [
        ['Hair Spa', 'drop', 1500, '1 hr', 'A deep nourishing mask, steam and massage to restore softness and shine.'],
        ['Keratin Smoothing', 'strands', 7000, '3 hr', 'A smoothing treatment that tames frizz and leaves hair sleek for months.'],
        ['Head Massage', 'dome', 500, '20 min', 'Slow, unhurried massage to release tension and ease the scalp.'],
    ] },
    { name: 'Skin', items: [
        ['Classic Facial', 'face', 1800, '1 hr', 'Cleansing, exfoliation, massage and mask for a calm, balanced complexion.'],
        ['Hydra Glow', 'drops', 3200, '75 min', 'A deeply hydrating ritual that leaves skin plump, luminous and dewy.'],
        ['Clean-up', 'sparkle', 900, '30 min', 'A gentle refresh to clear and brighten between facials.'],
        ['De-tan', 'sun', 1100, '40 min', 'A brightening treatment that lifts tan and evens skin tone.'],
    ] },
    { name: 'Hands & Feet', items: [
        ['Manicure', 'polish', 700, '40 min', 'Shaping, cuticle care, massage and polish for beautifully kept hands.'],
        ['Pedicure', 'lotus', 1000, '50 min', 'Soak, scrub, massage and polish. A full reset for tired feet.'],
    ] },
    { name: 'Bridal', items: [
        ['Bridal Makeup', 'lipstick', 18000, '2.5 hr', 'A trial-led, long-wear look designed around your outfit, your light and your day.'],
        ['Bridal Hair', 'updo', 6000, '90 min', 'Classic or contemporary styling, secured to last from the first ritual to the last dance.'],
        ['Party Glam', 'brush', 4500, '75 min', 'Polished makeup for evenings and celebrations, from soft glow to full glamour.'],
        ['Saree Draping', 'hanger', 800, '30 min', 'Neat, secure pleating and pinning, tailored to your blouse and silhouette.'],
    ] },
]

export const formatPrice = (n: number) => '₹ ' + n.toLocaleString('en-IN')

export const GROUPS: CatalogueGroup[] = RAW.map((g, gi) => ({
    name: g.name,
    items: g.items.map((it, si) => ({
        id: `${gi}-${si}`, gi, si, group: g.name, name: it[0], icon: it[1],
        priceN: it[2], price: formatPrice(it[2]), time: it[3], desc: it[4],
    })),
}))

export const FLAT: CatalogueItem[] = GROUPS.flatMap(g => g.items)
