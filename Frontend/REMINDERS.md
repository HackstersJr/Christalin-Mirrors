# Christalin Mirrors — Production Reminders & Checklist

> **⚠️ Replace all placeholders below before deploying to production.**

## 1. EmailJS Configuration
These placeholders are in `src/components/Contact.tsx`:

- [ ] `YOUR_SERVICE_ID` — Replace with actual EmailJS Service ID
- [ ] `YOUR_TEMPLATE_ID` — Replace with actual EmailJS Template ID  
- [ ] `YOUR_PUBLIC_KEY` — Replace with actual EmailJS Public Key

**Setup steps:**
1. Create an account at [emailjs.com](https://www.emailjs.com/)
2. Create an Email Service (Gmail, Outlook, etc.)
3. Create an Email Template with these variables:
   - `{{user_name}}` — Client's name
   - `{{user_email}}` — Client's email
   - `{{preferred_date}}` — Preferred appointment date
   - `{{preferred_time}}` — Preferred time slot
   - `{{note}}` — Optional note
4. Copy the Service ID, Template ID, and Public Key into Contact.tsx

## 2. Official Email Address
Placeholder `info@christalinmirrors.com` is used in:

- [ ] `src/components/Footer.tsx` — Footer email link
- [ ] `src/components/Footer.tsx` — Franchise Enquiry mailto link

## 3. Phone Numbers
- [ ] Kalaburagi branch phone number — Replace `+91 XXXXX XXXXX` in `src/components/Branches.tsx`

## 4. Testimonials
2 placeholder reviews need to be replaced with real customer reviews:

- [ ] Review #2 in `src/components/Testimonials.tsx` — Replace with real Instagram/GMaps review
- [ ] Review #3 in `src/components/Testimonials.tsx` — Replace with real Instagram/GMaps review

## 5. Images
The following images are AI-generated and should be replaced with actual salon photos:

- [ ] `src/assets/about-salon.png` — About section image
- [ ] `src/assets/featured-service.png` — Services featured image
- [ ] `src/assets/gallery-1.png` through `gallery-6.png` — Gallery images
- [ ] `src/assets/collection-balayage.png` — Collection image
- [ ] `src/assets/collection-editorial.png` — Collection image
- [ ] `src/assets/collection-nordic.png` — Collection image

## 6. Social Media Links
- [ ] Instagram URL in `src/components/Footer.tsx` — Replace `https://instagram.com` with actual profile URL

## 7. Google Maps Links
- [ ] Verify Kalaburagi branch Google Maps URL in `src/components/Branches.tsx`
