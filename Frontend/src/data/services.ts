export type Category = 'all' | 'hair' | 'skin' | 'korean' | 'womens' | 'mens'

export interface ServiceItem {
    name: string
    tag: string
    category: Category
    isKorean?: boolean
}

export const services: ServiceItem[] = [
    // Hair (Unisex)
    { name: 'Precision Haircut', tag: 'U/V layer cut, advance creative cuts & kids styling', category: 'hair' },
    { name: 'Wash & Styling', tag: 'Wash, blast dry, conditioning & ironing', category: 'hair' },
    { name: 'Hair Color Studio', tag: 'Root touch up, global color, fashion shades & highlights', category: 'hair' },
    { name: 'Balayage', tag: 'Hand-painted natural gradients with premium colors', category: 'hair' },
    { name: 'Keratin & Smoothing', tag: 'Frizz-free finish with keratin, botox & nano plastia', category: 'hair' },
    { name: 'Nourishing Hair Spa', tag: 'Deep repair with Ola Plex, 3tenx & scalp therapy', category: 'hair' },
    { name: 'Almond Oil Head Massage', tag: 'Nourishing hot almond oil scalp massage', category: 'hair' },
    // Skin & Beauty (Unisex)
    { name: 'Glass Skin Facials', tag: 'Hydra aloe, K elite glow & Korean glass skin hydra facial', category: 'skin', isKorean: true },
    { name: 'Crystal White Brightening Facial', tag: 'Illuminating whitening & brightening skin facial', category: 'skin' },
    { name: 'Skin Therapy', tag: 'Classic glow, anti-aging, acne defense & bridal radiance facials', category: 'skin' },
    { name: 'Essential Skin Cleanup', tag: 'Deep pore detox, radiant white & hydra cleanup', category: 'skin' },
    { name: 'Deep Pore Detox Cleanup', tag: 'Deep pore cleansing & blackhead extraction', category: 'skin' },
    { name: 'Even Tone Therapy', tag: 'DTAN & lighting (bleach) for full body, face & arms', category: 'skin' },
    { name: 'Calming Body Massage', tag: 'Relaxing tension-relief full body massage', category: 'skin' },
    { name: 'Wellness Massage', tag: 'Body massage, foot/back/hand, body scrub & body polish', category: 'skin' },
    // Korean Rituals (Unisex)
    { name: 'Deep Cleanse Revive', tag: 'Purifying scalp detox with K-beauty ingredients', category: 'korean', isKorean: true },
    { name: 'Hydra Calm Restore', tag: 'Deep hydration ritual for stressed, dry scalps', category: 'korean', isKorean: true },
    { name: 'Scalp Renewal Detox', tag: 'Advanced detoxification for scalp rejuvenation', category: 'korean', isKorean: true },
    { name: 'Ultimate K-Glow Ritual', tag: 'The pinnacle of Korean scalp and hair therapy', category: 'korean', isKorean: true },
    { name: 'K Elite Glow Facial', tag: 'Premium Korean routine for long-lasting brightness', category: 'korean', isKorean: true },
    { name: 'Korean Glass Skin Facial', tag: 'Where Korean skin science meets restorative hydration', category: 'korean', isKorean: true },
    // Women's
    { name: 'Engagement Look', tag: 'Pre-wedding styling with premium makeup', category: 'womens' },
    { name: 'Mac Makeover', tag: 'MAC products party glam makeover', category: 'womens' },
    { name: 'High Definition Look', tag: 'HD camera-ready bridal perfection', category: 'womens' },
    { name: 'Luxury Bridal Makeover', tag: 'MAC, Laura Mercier, Huda Beauty & Fenty options', category: 'womens' },
    { name: 'AIRBRUSH Makeup', tag: 'Flawless airbrush bridal makeover', category: 'womens' },
    { name: 'Saree Draping', tag: 'Professional elegant saree draping', category: 'womens' },
    { name: 'Basic Party Makeup', tag: 'Basic party, pro & HD makeup for any occasion', category: 'womens' },
    { name: 'Pro Makeup', tag: 'Professional event & evening makeover', category: 'womens' },
    { name: 'Signature Threading', tag: 'Full face, eyebrows, upper lip & forehead', category: 'womens' },
    { name: 'Full Body Waxing', tag: 'Half/full arms, legs, back, brazilian & full body wax', category: 'womens' },
    { name: 'Classic Manicure & Pedicure', tag: 'Classic, bomb, spa & herbal botanical treatments', category: 'womens' },
    { name: 'Acrylic Extension with Art', tag: 'Gel polish, acrylic & gel extensions, custom nail art', category: 'womens' },
    // Men's
    { name: 'Classic & Creative Cuts', tag: 'Wash & blast dry, head shave, and creative haircuts', category: 'mens' },
    { name: 'Beard Grooming', tag: 'Beard trim, shave, beard colour & moustache colour', category: 'mens' },
    { name: "Men's Hair Treatments", tag: 'Keratin, smoothening & botox for men', category: 'mens' },
    { name: "Men's Hair Colouring", tag: 'Streaks, side locks color & global ammonia-free color', category: 'mens' },
]

export const serviceTabs: { label: string; value: Category; highlight?: boolean }[] = [
    { label: 'Hair', value: 'hair' },
    { label: 'Skin & Beauty', value: 'skin' },
    { label: 'Korean Rituals', value: 'korean', highlight: true },
    { label: "Women's", value: 'womens' },
    { label: "Men's", value: 'mens' },
]
