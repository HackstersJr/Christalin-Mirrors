import type { Audience } from './data'

const kebab = (s: string) =>
    s.toLowerCase().replace(/&/g, 'and').replace(/\+/g, 'plus').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// Body-area services (Bleach, D-Tan, Waxing) share one photo per collection instead of one per area.
const SHARED_IMAGE_GROUPS = new Set(['Bleach', 'D-Tan Raga', 'D-Tan O3+', 'Waxing'])

/** File name (without extension) of the photo for a service, e.g. `women-signature-facial`. */
export const slugFor = (aud: Audience, group: string, name: string) =>
    `${aud}-${SHARED_IMAGE_GROUPS.has(group) ? kebab(group) : kebab(name)}`

// Short, catchy lines shown when a card is zoomed. A key of `men:Name` / `women:Name` beats a plain `Name`.
const BLURBS: Record<string, string> = {
    // Bridal
    'Engagement Look': 'Your first big moment, camera-ready and glowing.',
    'Mac Makeover': 'Iconic MAC finish for a flawless, photo-perfect face.',
    'High Definition Look': 'HD-smooth skin that stays flawless in every frame.',
    'Luxury HD': 'Premium HD glam, made for a day you will never forget.',
    'AIRBRUSH Makeup': 'Featherlight, poreless perfection that lasts all night.',
    // Party & styling
    'Saree Draping': 'Pleats pinned to perfection, every fold in place.',
    'women:Hair Style': 'Curls, waves or sleek, styled for your occasion.',
    'Basic Party Makeup': 'Fresh, polished and party-ready in no time.',
    'Pro Makeup': 'Professional glam that turns heads all evening.',
    'Mac Makeup': 'MAC artistry for a bold, long-lasting look.',
    'HD Makeup': 'Flawless HD finish, camera and candlelight ready.',
    // Facials & skin
    'Crystal White Brightening Facial': 'Brighter, clearer skin with a crystal glow.',
    'Signature Facial': 'Our signature indulgence for deeply hydrated skin.',
    'Hydra Aloe Facial': 'Aloe-fresh hydration for cool, dewy skin.',
    'Korean Glass Skin Hydra Facial': 'Glass-skin glow, K-beauty style: dewy, smooth, luminous.',
    'Herbal Facial': 'Pure herbal care for calm, naturally fresh skin.',
    'Bridal Radiance Signature Facial': 'The pre-wedding glow that lights up every photo.',
    'Shine & Glow Illuminating Facial': 'From dull to dazzling: a radiant lift for tired skin.',
    'Classic Glow Facial': 'A timeless glow-up for fresh, healthy skin.',
    'Clear Skin Acne Defense Facial': 'Calm breakouts, clear pores, confident skin.',
    'Youth Revival Anti-Aging Facial': 'Turn back the clock with firmer, younger-looking skin.',
    'Deep Pore Detox Clean-up': 'Deep-clean pores, banish dullness, instant freshness.',
    'Radiant White Clean-Up': 'A quick brightening clean-up for a lit-from-within look.',
    'Classic Facial': 'Clean, hydrated, healthy-looking skin.',
    'Anti Aging Facial': 'Firm, smooth and visibly younger-looking skin.',
    'Shine and Glow Facial': 'Dull to dazzling, a radiant boost for tired skin.',
    'Acne Reduction Facial': 'Calm breakouts and clear the way to confident skin.',
    'Perfect Radiant Facial': 'Peak radiance for skin that looks its absolute best.',
    'Whitening Facial': 'Brighter, more even skin with a fresh glow.',
    'D-Tan · Raga': 'Lift the tan and bring back your natural tone.',
    'D-Tan · O3+': 'Premium O3+ de-tan for visibly brighter skin.',
    'Pore Clean-up': 'Deep-clean pores and clear dullness for fresh skin.',
    'Whitening Clean-up': 'A brightening clean-up for a fresher, clearer look.',
    // Nails
    'Nail Art (per nail)': 'Tiny canvases, big personality. Custom art on every nail.',
    'Extension Removal': 'Gentle, safe removal that protects your natural nails.',
    'Gel Nail Paint Removal': 'Clean gel removal with no damage to your nails.',
    'Gel Polish': 'Glossy colour that stays chip-free for weeks.',
    'Acrylic Extension with Art': 'Length, shape and art: nails that make a statement.',
    'Gel Extended with Art': 'Light, natural-feel extensions with stunning art.',
    'Temporary Extension with Art': 'Instant glam length, perfect for events.',
    // Hands & feet
    'Classic Manicure': 'Neat, polished hands with a clean finish.',
    'Bomb Manicure': 'Fizzy, fragrant and fabulous: a spa pop for your hands.',
    'Spa Manicure': 'Soak, scrub, massage and shine. Hands fully pampered.',
    'Classic Pedicure': 'Fresh, soft feet with a perfectly clean finish.',
    'Bomb Pedicure': 'Fizz, scrub and bliss for tired feet.',
    'Spa Pedicure': 'The full foot-spa ritual: soft, smooth, restored.',
    // Massage
    'Calming Body Massage': 'Melt tension away with slow, soothing strokes.',
    'Body Scrub': 'Slough away dullness for soft, glowing skin.',
    'Body Polish': 'Silky, radiant skin from head to toe.',
    'Radiance Treatment': 'Our top-to-toe glow ritual for luminous skin.',
    'Foot Massage': 'Walk out lighter. Tired feet, instantly relieved.',
    'Back Massage': 'Knots out, shoulders down, pure relief.',
    'Hand Massage': 'Gentle relief for hardworking hands.',
    'Coconut Oil Head Massage': 'Cool coconut oil calm for a relaxed scalp.',
    'Almond Oil Head Massage': 'Warm almond nourishment for scalp and hair.',
    'Olive Oil Head Massage': 'Rich olive oil care for deeply nourished hair.',
    // Men: hair
    'Classic Haircut': 'Sharp, clean and effortlessly you.',
    'Wash, Conditioning & Styling': 'Fresh, soft and styled, ready to go.',
    'Creative Haircut': 'A bold new look, cut just for you.',
    'Kids (U-12)': 'Fun, fuss-free cuts for little champs.',
    'Head Shave': 'Clean, smooth and confident.',
    'Beard Trim / Shave': 'Crisp lines and a sharp, groomed beard.',
    'Wash & Blast Dry': 'Quick wash, big volume, ready in minutes.',
    'men:Hair Style': 'Styled to stay. Your look, finished.',
    'Streaks (per streak)': 'A pop of colour exactly where you want it.',
    'Global Ammonia Free': 'Full colour without the harshness: rich and gentle.',
    'Beard Colour': 'Even, natural-looking beard colour.',
    'Moustache Colour': 'A sharp tone for a standout moustache.',
    'Side Locks Colour': 'Subtle colour on the sides for a polished finish.',
    Smoothening: 'Sleek, frizz-free hair that stays smooth.',
    Keratin: 'Silky, manageable hair, month after month.',
    Botox: 'Deep repair and shine for tired, damaged hair.',
    'Nourishing Spa': 'A deep-nourish ritual for soft, healthy hair.',
    'Repair and Rejuvenate': 'Bring damaged hair back to life.',
    'Anti Hair Fall Treatment': 'Strengthen roots and keep every strand where it belongs.',
    'Anti Dandruff Treatment': 'Clear flakes, calm the scalp, fresh confidence.',
    'Scalp Therapy': 'Targeted scalp care for healthier hair from the root.',
    '3tenx Nourishing Spa': 'Advanced nourishment for visibly healthier hair.',
    'Ola Plex Spa Rituals': 'Bond-building care for strong, resilient hair.',
    'Ola Plex Bond Repair Treatment': 'Rebuild broken bonds for stronger, smoother hair.',
}

const area = (name: string) => name.toLowerCase()

const BY_GROUP: Record<string, (name: string) => string | undefined> = {
    Bleach: n => `Fade the tan and reveal a brighter, even-toned ${area(n)}.`,
    'D-Tan Raga': n => `Gentle de-tan for ${area(n)}: tan out, glow in.`,
    'D-Tan O3+': n => `Premium O3+ de-tan for ${area(n)}: a deeper, brighter glow.`,
    Waxing: n => {
        if (n.startsWith('Brazilian')) return 'Smooth, confident and comfortable, done with care.'
        if (n === 'Nostrils') return 'Quick, tidy nostril wax with no fuss.'
        return `Clean, smooth ${area(n)} with long-lasting results.`
    },
}

/** One short, catchy line for the zoomed card. */
export const blurbFor = (aud: Audience, group: string, name: string): string =>
    BY_GROUP[group]?.(name) ?? BLURBS[`${aud}:${name}`] ?? BLURBS[name] ?? ''
