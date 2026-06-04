# Christalin Mirrors Image Assets

This folder contains the centralized configuration for all Cloudinary image URLs used across the website. By keeping them here, you can easily update images without having to dig through React component code.

## How to use or update images

Open `src/data/assets.ts` in your code editor.

1. **HERO_IMAGE**: The large image displayed at the very top of the homepage. Replace the URL string to change it.
2. **ABOUT_IMAGE**: The image displayed in the "About Us" section.
3. **FOUNDER_IMAGE**: The portrait image used in the Founder's Note section.
4. **CONTACT_IMAGE**: The aesthetic image displayed next to the "Book an Appointment" form.
5. **SERVICE_IMAGES**: An array (list) of URLs showing models or services. 
   - *Note*: The first 5 images in this list are automatically used for the horizontal scrolling "Featured Services" cards in the Services section.
   - All of these images will appear in the "Services" tab of the Gallery.
5. **BRANCH_IMAGES**: An array of aesthetic, room, or team photos. These appear in the "Branches" tab of the Gallery.

To change an image, simply replace the URL inside the quotation marks `""`. To add more images to the Gallery, simply add a comma after the last URL in the list, and paste your new URL in quotes.
