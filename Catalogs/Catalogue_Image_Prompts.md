# Catalogue image prompts

One text-to-image prompt for each of the **103 images** in [Catalogue_Image_Shot_List.md](Catalogue_Image_Shot_List.md). File names match, so a generated image can go straight into `Frontend/src/assets/catalogue/`.

## How to use

- **Copy a prompt as is.** The shared style (light, palette, lens, 4:5 framing, no text) is already at the end of every prompt, so all images come out as one consistent set.
- **Aspect ratio:** 4:5 portrait. In Midjourney add `--ar 4:5 --style raw`. In tools with a size setting choose 1024×1280 or the nearest portrait 4:5. Upscale or export at 1200×1500.
- **Negative prompt** (Stable Diffusion, Leonardo, Firefly and others that take one):

```text
text, letters, watermark, logo, signature, price tag, extra fingers, deformed hands, distorted face, cross-eyed, harsh flash, neon colours, oversaturated, cluttered background, plastic-looking skin, cartoon, illustration, 3D render, low resolution
```

- **Batch generation:** the same prompts are in [catalogue_image_prompts.csv](catalogue_image_prompts.csv) with columns `file_name, prompt, negative_prompt`.
- **Before publishing:** check hands, fingers and jewellery closely, since generators often get these wrong, and keep the faces believable. If you use real client photos instead, the shot list is the brief.

## Women's catalogue (50)

### Bridal

**`women-engagement-look.jpg`**: Engagement Look

```text
a South Asian (Indian) woman in her late 20s with an elegant engagement makeup look, soft rose-gold eyes, nude-pink lips, luminous skin, wearing a pastel embroidered lehenga and delicate kundan earrings, head-and-shoulders portrait, gentle smile. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-mac-makeover.jpg`**: Mac Makeover

```text
a South Asian (Indian) woman in her late 20s with a flawless full-coverage MAC-style bridal makeup, defined brows, warm bronze smoky eyes, matte rosewood lips, red and gold bridal dupatta draped over the head, close-up beauty portrait. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-high-definition-look.jpg`**: High Definition Look

```text
a South Asian (Indian) woman in her late 20s with an HD bridal makeup look, perfectly smooth camera-ready skin, crisp winged liner, deep red lips, heavy gold maang tikka and nose ring, three-quarter beauty portrait. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-luxury-hd.jpg`**: Luxury HD

```text
a South Asian (Indian) woman in her late 20s as a luxury bride, premium HD makeup with soft glam glitter eyes, glossy berry lips, ornate polki jewellery, rich maroon velvet lehenga, regal three-quarter portrait. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-airbrush-makeup.jpg`**: AIRBRUSH Makeup

```text
a South Asian (Indian) woman in her late 20s with airbrush bridal makeup, poreless satin skin, soft blended champagne eyes, makeup artist's airbrush gun held near the cheek, close-up profile portrait. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### Party & Styling

**`women-saree-draping.jpg`**: Saree Draping

```text
a South Asian (Indian) woman in her late 20s wearing a perfectly draped silk saree in blush pink with neat pleats and a flowing pallu over the shoulder, three-quarter length, hands lightly holding the pleats. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-hair-style.jpg`**: Hair Style

```text
back view of a South Asian (Indian) woman in her late 20s's hair styled into an elegant low bun with soft face-framing waves and small pearl pins, no face visible, salon chair softly blurred. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-basic-party-makeup.jpg`**: Basic Party Makeup

```text
a South Asian (Indian) woman in her late 20s with fresh, natural party makeup, peach blush, soft brown eyes, glossy nude lips, simple statement earrings, relaxed smile, head-and-shoulders. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-pro-makeup.jpg`**: Pro Makeup

```text
a South Asian (Indian) woman in her late 20s with polished professional evening makeup, sculpted cheekbones, bronze shimmer eyes, satin mauve lips, sleek hair, confident three-quarter portrait. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-mac-makeup.jpg`**: Mac Makeup

```text
a South Asian (Indian) woman in her late 20s with bold MAC-style party makeup, sharp cut-crease eyes, fluttery lashes, classic red lips, glowing highlighted skin, close-up beauty shot. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-hd-makeup.jpg`**: HD Makeup

```text
a South Asian (Indian) woman in her late 20s with flawless HD party makeup, soft-focus skin finish, golden eyes, berry lips, earrings catching the light, close-up portrait with candle-like warm bokeh. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### Facials

**`women-crystal-white-brightening-facial.jpg`**: Crystal White Brightening Facial

```text
a South Asian (Indian) woman in her late 20s lying on a facial bed with eyes closed, a translucent brightening gel mask on her face, therapist's gloved hand applying it with a fan brush, top-down close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-signature-facial.jpg`**: Signature Facial

```text
a South Asian (Indian) woman in her late 20s relaxing during a luxurious facial, warm towel wrapped around her hair, cream mask on the face, therapist's hands gently massaging her temples, top-down view. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-hydra-aloe-facial.jpg`**: Hydra Aloe Facial

```text
a South Asian (Indian) woman in her late 20s receiving a hydrating aloe facial, cool green aloe gel glistening on her cheeks, a slice of aloe leaf beside her, fresh dewy look, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-korean-glass-skin-hydra-facial.jpg`**: Korean Glass Skin Hydra Facial

```text
a South Asian (Indian) woman in her late 20s with glass-like, dewy, reflective skin after a Korean hydra facial, hydra-facial wand near her cheek, minimal makeup, ultra close-up beauty shot. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-herbal-facial.jpg`**: Herbal Facial

```text
a South Asian (Indian) woman in her late 20s with a soft green herbal paste mask, eyes covered with cucumber slices, small bowls of herbs and petals beside her on the bed, top-down. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-bridal-radiance-signature-facial.jpg`**: Bridal Radiance Signature Facial

```text
a South Asian (Indian) woman in her late 20s with radiant, glowing pre-bridal skin, a thin gold-flecked mask being brushed on, mehndi-decorated hand resting near her face, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-shine-and-glow-illuminating-facial.jpg`**: Shine & Glow Illuminating Facial

```text
a South Asian (Indian) woman in her late 20s with luminous illuminated skin, light catching her cheekbones, a sheet mask being peeled away to reveal glow, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-classic-glow-facial.jpg`**: Classic Glow Facial

```text
a South Asian (Indian) woman in her late 20s during a classic facial, therapist's hands doing a gentle upward massage on her cheeks, soft towel headband, calm expression, top-down. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-clear-skin-acne-defense-facial.jpg`**: Clear Skin Acne Defense Facial

```text
a South Asian (Indian) woman in her late 20s with clear, calm, even skin, a light clay mask applied to the T-zone only, therapist using a cotton pad, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-youth-revival-anti-aging-facial.jpg`**: Youth Revival Anti-Aging Facial

```text
a South Asian (Indian) woman in her late 20s in her late 30s with firm, lifted, glowing skin, therapist using a rose-quartz roller along her jawline, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-deep-pore-detox-clean-up.jpg`**: Deep Pore Detox Clean-up

```text
a South Asian (Indian) woman in her late 20s with a charcoal-grey detox mask on her face, eyes closed, therapist steaming her skin with a facial steamer, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-radiant-white-clean-up.jpg`**: Radiant White Clean-Up

```text
a South Asian (Indian) woman in her late 20s with fresh, bright skin, wiping her face with a soft white cotton pad, a white creamy cleanser on a ceramic dish beside her, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### Bleach

**`women-bleach.jpg`**: all 8 Bleach services

```text
close-up of a woman's forearm and hand with smooth, bright, even-toned skin, a soft cream bleach application with a flat spatula on part of the arm. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### D-Tan Raga

**`women-d-tan-raga.jpg`**: all 10 D-Tan Raga services

```text
close-up of a woman's shoulder and upper arm with smooth, brightened skin, a light peach de-tan pack being applied with a brush. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### D-Tan O3+

**`women-d-tan-o3plus.jpg`**: all 10 D-Tan O3+ services

```text
close-up of a woman's glowing face and neck after a de-tan, a premium white jar of O3+ style de-tan cream and a brush on a marble tray beside her. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### Waxing

**`women-waxing.jpg`**: all 16 Waxing services

```text
close-up of a woman's smooth, hair-free leg, a therapist's hand pressing a cloth wax strip, a small pot of warm honey-coloured wax nearby. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### Nails

**`women-nail-art-per-nail.jpg`**: Nail Art (per nail)

```text
macro of a woman's hand with delicate custom nail art, each nail different, tiny pearls, gold foil and floral line art, resting on a blush satin cloth. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-extension-removal.jpg`**: Extension Removal

```text
macro of a nail technician gently removing nail extensions with a soft file and cuticle pusher, healthy natural nails underneath. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-gel-nail-paint-removal.jpg`**: Gel Nail Paint Removal

```text
macro of fingertips wrapped in small foil wraps for gel removal, a cotton pad and nail tools on a cream towel. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-gel-polish.jpg`**: Gel Polish

```text
macro of a woman's hand with glossy nude-pink gel polish, a mini UV nail lamp glowing softly in the background. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-acrylic-extension-with-art.jpg`**: Acrylic Extension with Art

```text
macro of a hand with long almond-shaped acrylic nails, glossy blush base with gold marble art, holding a small glass perfume bottle. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-gel-extended-with-art.jpg`**: Gel Extended with Art

```text
macro of a hand with natural-length gel extensions, French tips with fine gold lines, fingers resting on a ceramic dish. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-temporary-extension-with-art.jpg`**: Temporary Extension with Art

```text
macro of a hand with glamorous press-on style extensions in champagne shimmer with tiny crystals, ready for a party. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### Mani & Pedi

**`women-classic-manicure.jpg`**: Classic Manicure

```text
a woman's hands resting on a soft towel, neat short nails with a clean nude polish, nail technician shaping one nail with a file. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-bomb-manicure.jpg`**: Bomb Manicure

```text
a woman's hands soaking in a glass bowl of fizzing water with a dissolving pink bath bomb and floating petals. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-spa-manicure.jpg`**: Spa Manicure

```text
a woman's hands receiving a moisturising hand massage with cream, warm towels and a small bowl of petals nearby. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-classic-pedicure.jpg`**: Classic Pedicure

```text
a woman's feet resting on a white towel with neatly shaped toenails painted soft blush, pedicure tools beside them. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-bomb-pedicure.jpg`**: Bomb Pedicure

```text
a woman's feet in a copper foot bath with a fizzing bath bomb, rose petals floating on the water. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-spa-pedicure.jpg`**: Spa Pedicure

```text
a woman's feet being massaged with a sugar scrub over a basin, warm towel, candles softly glowing in the background. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### Massage

**`women-calming-body-massage.jpg`**: Calming Body Massage

```text
a South Asian (Indian) woman in her late 20s lying face down on a massage bed under a cream towel, therapist's hands applying long gliding strokes on her back. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-body-scrub.jpg`**: Body Scrub

```text
close-up of a body scrub being applied on a woman's shoulder and back, coarse sugar granules glistening, a wooden bowl of scrub beside her. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-body-polish.jpg`**: Body Polish

```text
close-up of a woman's glowing, silky shoulder and arm after a body polish, light reflecting off the skin, a small bottle of oil nearby. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-radiance-treatment.jpg`**: Radiance Treatment

```text
a South Asian (Indian) woman in her late 20s relaxed on a spa bed, a shimmering radiance body mask on her back, therapist's brush, warm candlelight. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-foot-massage.jpg`**: Foot Massage

```text
a therapist's hands massaging a woman's foot with oil over a soft towel, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-back-massage.jpg`**: Back Massage

```text
therapist's palms pressing along a woman's upper back and shoulders, towel draped at the waist, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-hand-massage.jpg`**: Hand Massage

```text
therapist's hands massaging a woman's palm and fingers with cream, close-up on a soft towel. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-coconut-oil-head-massage.jpg`**: Coconut Oil Head Massage

```text
therapist massaging a woman's scalp with coconut oil, a halved coconut and a small glass bottle of oil in the foreground. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-almond-oil-head-massage.jpg`**: Almond Oil Head Massage

```text
therapist massaging a woman's scalp with warm almond oil, a small bowl of almonds and an amber oil bottle in the foreground. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`women-olive-oil-head-massage.jpg`**: Olive Oil Head Massage

```text
therapist massaging a woman's long dark hair at the scalp with olive oil, a sprig of olives and a green glass oil bottle in the foreground. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

## Men's catalogue (53)

### Haircut

**`men-classic-haircut.jpg`**: Classic Haircut

```text
a South Asian (Indian) man in his late 20s with a sharp, classic short side-part haircut, neat sideburns, clean shave, three-quarter portrait in a barber chair. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-wash-conditioning-and-styling.jpg`**: Wash, Conditioning & Styling

```text
a South Asian (Indian) man in his late 20s having his hair washed at a salon basin, foam in his hair, eyes closed and relaxed, side view. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-creative-haircut.jpg`**: Creative Haircut

```text
a South Asian (Indian) man in his late 20s with a modern textured crop and a sharp low fade, side profile showing the clean fade lines. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-kids-u-12.jpg`**: Kids (U-12)

```text
a cheerful South Asian boy around 8 years old in a barber chair wearing a cape, fresh neat haircut, smiling. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-head-shave.jpg`**: Head Shave

```text
a South Asian (Indian) man in his late 20s with a smooth, freshly shaved head, a straight razor and shaving brush on a tray beside him, side portrait. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-beard-trim-shave.jpg`**: Beard Trim / Shave

```text
close-up of a barber trimming a South Asian (Indian) man in his late 20s's beard with a trimmer, sharp cheek line and neckline, comb in the other hand. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-wash-and-blast-dry.jpg`**: Wash & Blast Dry

```text
a South Asian (Indian) man in his late 20s getting his hair blow-dried with a round brush for volume, motion in the hair, side view. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-hair-style.jpg`**: Hair Style

```text
a South Asian (Indian) man in his late 20s with a polished quiff hairstyle, slight shine, clean groomed look, three-quarter portrait. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### Colouring

**`men-streaks-per-streak.jpg`**: Streaks (per streak)

```text
close-up of a South Asian (Indian) man in his late 20s's textured hair with a few subtle caramel streaks, natural daylight. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-global-ammonia-free.jpg`**: Global Ammonia Free

```text
a South Asian (Indian) man in his late 20s with rich, even, natural dark-brown hair colour, healthy shine, three-quarter portrait. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-beard-colour.jpg`**: Beard Colour

```text
close-up of a South Asian (Indian) man in his late 20s's full beard with even, natural black colour, a small colour brush and bowl nearby. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-moustache-colour.jpg`**: Moustache Colour

```text
close-up of a South Asian (Indian) man in his late 20s's neatly shaped, evenly coloured moustache, a fine detail brush nearby. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-side-locks-colour.jpg`**: Side Locks Colour

```text
close-up side view of a South Asian (Indian) man in his late 20s's neatly coloured sideburns and temples blending into a short haircut. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### Treatments

**`men-smoothening.jpg`**: Smoothening

```text
a South Asian (Indian) man in his late 20s with sleek, straight, frizz-free medium-length hair, a flat iron on the counter, side portrait. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-keratin.jpg`**: Keratin

```text
close-up of a South Asian (Indian) man in his late 20s's smooth, shiny, manageable hair being combed through, healthy gloss. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-botox.jpg`**: Botox

```text
close-up of a South Asian (Indian) man in his late 20s's visibly repaired, glossy hair, a hair treatment being brushed through the lengths. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### Hair Care

**`men-nourishing-spa.jpg`**: Nourishing Spa

```text
a South Asian (Indian) man in his late 20s relaxing with a nourishing hair-spa mask and a warm towel wrapped around his head, eyes closed. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-repair-and-rejuvenate.jpg`**: Repair and Rejuvenate

```text
close-up of a stylist applying a creamy repair mask to a South Asian (Indian) man in his late 20s's hair section by section. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-anti-hair-fall-treatment.jpg`**: Anti Hair Fall Treatment

```text
close-up of a stylist applying a serum along the parting of a South Asian (Indian) man in his late 20s's scalp with a dropper. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-anti-dandruff-treatment.jpg`**: Anti Dandruff Treatment

```text
close-up of a stylist massaging a clarifying scalp treatment into a South Asian (Indian) man in his late 20s's scalp, clean healthy scalp visible. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-scalp-therapy.jpg`**: Scalp Therapy

```text
close-up of a scalp-therapy session, stylist using a soft scalp massage brush on a South Asian (Indian) man in his late 20s's scalp. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-3tenx-nourishing-spa.jpg`**: 3tenx Nourishing Spa

```text
a South Asian (Indian) man in his late 20s at a basin receiving a nourishing hair-spa treatment, rich mask in his hair, stylist's hands massaging. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-ola-plex-spa-rituals.jpg`**: Ola Plex Spa Rituals

```text
close-up of a stylist applying a bond-building treatment to a South Asian (Indian) man in his late 20s's hair, glossy result on the lengths. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-ola-plex-bond-repair-treatment.jpg`**: Ola Plex Bond Repair Treatment

```text
close-up of a South Asian (Indian) man in his late 20s's strong, shiny, smooth hair after a bond-repair treatment, hand running through it. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### Skin Care

**`men-d-tan-raga.jpg`**: D-Tan · Raga

```text
a South Asian (Indian) man in his late 20s with a light de-tan pack on his face, eyes closed, relaxed on a facial bed, top-down. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-d-tan-o3plus.jpg`**: D-Tan · O3+

```text
a South Asian (Indian) man in his late 20s with a premium white de-tan cream on his face and a white jar of O3+ style cream beside him, top-down. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-pore-clean-up.jpg`**: Pore Clean-up

```text
a South Asian (Indian) man in his late 20s with a clay pore-cleansing mask on his T-zone, steam rising softly from a facial steamer. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-whitening-clean-up.jpg`**: Whitening Clean-up

```text
a South Asian (Indian) man in his late 20s with fresh, bright skin, wiping his face with a white towel after a clean-up, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### Facials

**`men-herbal-facial.jpg`**: Herbal Facial

```text
a South Asian (Indian) man in his late 20s with a green herbal mask on his face, eyes closed, small bowls of herbs nearby, top-down. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-classic-facial.jpg`**: Classic Facial

```text
a South Asian (Indian) man in his late 20s during a classic facial, therapist's hands massaging his cheeks, towel headband, calm expression. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-anti-aging-facial.jpg`**: Anti Aging Facial

```text
a South Asian (Indian) man in his late 20s in his late 30s with firm, refreshed skin, therapist using a jade roller along his jawline. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-shine-and-glow-facial.jpg`**: Shine and Glow Facial

```text
a South Asian (Indian) man in his late 20s with healthy glowing skin, a sheet mask being peeled off, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-acne-reduction-facial.jpg`**: Acne Reduction Facial

```text
a South Asian (Indian) man in his late 20s with clear, calm skin, a light clay mask on his forehead and nose, therapist with a cotton pad. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-perfect-radiant-facial.jpg`**: Perfect Radiant Facial

```text
a South Asian (Indian) man in his late 20s with radiant, even skin, a gold-flecked mask being brushed on his cheeks, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-whitening-facial.jpg`**: Whitening Facial

```text
a South Asian (Indian) man in his late 20s with a white brightening cream mask, eyes closed, relaxed, top-down. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-hydra-aloe-facial.jpg`**: Hydra Aloe Facial

```text
a South Asian (Indian) man in his late 20s with cool aloe gel on his face, a slice of aloe leaf beside him, fresh dewy skin, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-korean-glass-skin-hydra-facial.jpg`**: Korean Glass Skin Hydra Facial

```text
a South Asian (Indian) man in his late 20s with clear, dewy, well-hydrated skin after a Korean hydra facial, hydra-facial wand near his cheek, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### Hands & Feet

**`men-classic-manicure.jpg`**: Classic Manicure

```text
a man's hands resting on a dark towel, clean short buffed nails, technician filing one nail. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-bomb-manicure.jpg`**: Bomb Manicure

```text
a man's hands soaking in a glass bowl of fizzing water with a dissolving bath bomb. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-spa-manicure.jpg`**: Spa Manicure

```text
a man's hands receiving a moisturising hand massage, warm towels nearby. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-classic-pedicure.jpg`**: Classic Pedicure

```text
a man's feet on a towel with neat, clean, buffed toenails, pedicure tools beside them. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-bomb-pedicure.jpg`**: Bomb Pedicure

```text
a man's feet in a copper foot bath with a fizzing bath bomb. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-spa-pedicure.jpg`**: Spa Pedicure

```text
a man's feet being scrubbed with a sugar scrub over a basin, warm towel nearby. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

### Massage

**`men-calming-body-massage.jpg`**: Calming Body Massage

```text
a South Asian (Indian) man in his late 20s lying face down on a massage bed under a towel, therapist's hands applying long strokes on his back. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-body-scrub.jpg`**: Body Scrub

```text
close-up of a coffee body scrub being applied to a man's shoulder and upper back. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-body-polish.jpg`**: Body Polish

```text
close-up of a man's smooth, polished, healthy-looking shoulder and arm, a small bottle of oil nearby. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-radiance-treatment.jpg`**: Radiance Treatment

```text
a South Asian (Indian) man in his late 20s relaxed on a spa bed with a radiance body mask on his back, warm candlelight. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-foot-massage.jpg`**: Foot Massage

```text
therapist's hands massaging a man's foot with oil over a towel, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-back-massage.jpg`**: Back Massage

```text
therapist's palms pressing along a man's upper back and shoulders, towel at the waist, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-hand-massage.jpg`**: Hand Massage

```text
therapist's hands massaging a man's palm with cream on a towel, close-up. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-coconut-oil-head-massage.jpg`**: Coconut Oil Head Massage

```text
therapist massaging a man's scalp with coconut oil, a halved coconut and a glass oil bottle in the foreground. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-almond-oil-head-massage.jpg`**: Almond Oil Head Massage

```text
therapist massaging a man's scalp with warm almond oil, a small bowl of almonds and an amber bottle in the foreground. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```

**`men-olive-oil-head-massage.jpg`**: Olive Oil Head Massage

```text
therapist massaging a man's scalp with olive oil, a sprig of olives and a green glass bottle in the foreground. editorial beauty and salon photography, soft natural window light, warm cream, blush pink and sand colour palette, softly blurred minimal luxury salon interior in the background, shallow depth of field, 85mm lens, natural realistic skin texture, calm and premium mood, subject centred with breathing room around it, portrait orientation, 4:5 aspect ratio, no text, no logos.
```
