# Design System: CM Hair Salon — "Warm Noir"
**Project ID:** `17736084193682925594`

## 1. Visual Theme & Atmosphere

A **contemporary luxury** aesthetic that feels alive and current — warm, inviting, and deeply sophisticated without relying on the clichéd gold tropes of traditional luxury. The mood is best described as "evening at a high-end boutique" — intimate, curated, and effortlessly chic. Rich espresso-toned blacks create an enveloping warmth, while warm copper accents add a bespoke, artisanal quality that sets the brand apart. The overall density is **spacious and editorial** — generous whitespace lets each element breathe, rejecting clutter in favor of confident minimalism.

## 2. Color Palette & Roles

| Descriptive Name | Hex Code | Functional Role |
|---|---|---|
| **Warm Near-Black** | `#1A1614` | Primary background — a rich, espresso-toned black that radiates warmth |
| **Dark Espresso** | `#2A2320` | Cards, elevated surfaces, and secondary backgrounds |
| **Deep Mocha** | `#3D322C` | Accent surfaces, stats bars, and subtle highlights |
| **Champagne White** | `#F5EDE6` | Primary headings and high-emphasis text |
| **Muted Tan** | `#B8A99A` | Body text, descriptions, and secondary content |
| **Warm Copper** | `#C9A87C` | Primary accent — CTAs, decorative lines, icons, links |
| **Light Copper** | `#D4B88D` | Hover states and interactive highlights |
| **Copper Whisper** | `rgba(200,168,124,0.15)` | Borders, dividers, and subtle separation lines |
| **Warm Ivory** *(Light Mode)* | `#FAF6F1` | Light mode primary background |
| **Soft Cream** *(Light Mode)* | `#F0EAE2` | Light mode cards and secondary surfaces |
| **Rich Bronze** *(Light Mode)* | `#9B7B5E` | Light mode accent color |

## 3. Typography Rules

- **Headings:** Playfair Display (serif), 700 weight — used for all section titles, hero headlines, and brand identity. Creates an editorial, high-fashion authority. Sizes range from 96px (hero) to 22px (card titles).
- **Body:** Inter (sans-serif), 400 weight, 16px — clean, highly legible, and modern. Used for descriptions, paragraphs, and general content with generous 1.7 line-height.
- **Labels & Tags:** Inter, 600 weight, 12-14px, uppercase with 2-3px letter-spacing — used for section labels ("ABOUT US", "GALLERY"), category tags, and small functional text. Always in warm copper.
- **Hierarchy:** The contrast between the ornate serif headings and the clean sans-serif body creates a sophisticated visual cadence — the editorial meets the functional.

## 4. Component Stylings

* **Buttons:**
  - *Primary:* Pill-shaped with generous padding (12px radius), warm copper background (#C9A87C) with dark text (#1A1614). On hover: lifts with a soft copper glow shadow.
  - *Secondary:* Outlined with copper border, transparent background. On hover: fills with copper at 10% opacity.
  - *Navigation CTA:* "Book Now" — always visible, solid copper, pill-shaped.

* **Cards/Containers:** Generously rounded corners (16px), dark espresso (#2A2320) background, whisper-soft diffused shadow. On hover: subtle lift (translateY -4px) with a thin copper top border accent appearing.

* **Inputs/Forms:** Dark espresso background, 12px rounded corners, subtle border at rest. On focus: warm copper border appears with a faint copper glow. Labels positioned above in uppercase copper.

* **Decorative Lines:** Thin (2px), 60px wide, warm copper — used as section dividers below headings. Also used as vertical accents alongside text blocks.

* **Icons:** Minimal line-style icons in warm copper. Used sparingly for services, contact methods, and social media.

## 5. Layout Principles

- **Section Padding:** 100-140px vertical padding between major sections — creates a breathing, unhurried scroll experience.
- **Max Width:** Content constrained to ~1200px centered container with 24-40px horizontal padding.
- **Asymmetric Layouts:** Key sections (About, Featured Branch) use 60/40 or similar uneven splits for editorial dynamism.
- **Masonry/Bento Grids:** Gallery uses varying-size placeholders for visual intrigue.
- **Stats/Metrics:** Displayed in horizontal strips with generous spacing, large numbers in Playfair Display (copper), descriptors in Inter (muted tan), separated by 15% opacity vertical copper lines.

## 6. Design System Notes for Stitch Generation

When generating new screens for this project, always include:

```
**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark mode, warm luxury, contemporary chic
- Background: Warm Near-Black (#1A1614)
- Secondary Background: Dark Espresso (#2A2320) for cards
- Accent Surface: Deep Mocha (#3D322C)
- Primary Text: Champagne White (#F5EDE6)
- Secondary Text: Muted Tan (#B8A99A)
- Accent Color: Warm Copper (#C9A87C)
- Heading Font: Playfair Display serif, 700 weight
- Body Font: Inter sans-serif, 400 weight
- Labels: Inter, 600 weight, 12px, uppercase, letter-spacing 2px
- Buttons: Rounded 12px, copper background
- Cards: Rounded 16px, dark espresso bg, whisper-soft shadow
```
