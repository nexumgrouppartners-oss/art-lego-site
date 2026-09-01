# TODO: Brand Assets for Art Lego LLC

## Status: PLACEHOLDER BRAND IN USE
This site currently uses placeholder branding and stock images while waiting for the client to supply brand assets. Once Camilio provides the brand guidelines and project photos, update this site accordingly.

## Brand Assets Needed
- [ ] **Logo file** (SVG or high-res PNG, 44px height minimum for header)
  - Current placeholder: logo.png (generic business logo)
  - TODO: Update /assets/images/logo.png once received
  - Update brand tag color palette CSS (see section below)

- [ ] **Brand color palette** (hex codes for primary, secondary, accent colors)
  - Current placeholder: Neutral warm grays with blue/navy accents (NOT Summit brand)
  - Location: /assets/style.css, :root variables (--navy, --blue, --gold, etc.)
  - Affected pages: all (header, buttons, links, trust bar)
  - Action: Camilio to provide palette; dev to update --navy, --navy-dark, --blue, --cyan, --gold variables

- [ ] **Project photos** (4-6 completed remodeling and painting projects)
  - Current: Stock images with "— representative finish example" alt text and disclosure note
  - Location: /assets/images/ (see list below)
  - Usage: Gallery sections on index.html, service pages, about.html, blog posts
  - Action: Camilio to provide completed project photos; rename and replace stock images; remove "— representative finish example" suffix from alt text and remove gallery-note disclosure line once real photos are live

## Stock Image Map (Current Placeholders)
| Current File | Page | Usage | Notes |
|---|---|---|---|
| clean-home-exterior-hero.jpg | index, hero | Hero image (eager/sync) | Replace with remodeled home |
| work-roof-after.jpg | index gallery, blog | Portfolio example | Replace with Art Lego project photo |
| work-fence-clean.jpg | index gallery | Portfolio example | Replace with Art Lego project photo |
| work-walkway-beforeafter.jpg | index gallery | Portfolio example | Replace with Art Lego project photo |
| work-pool-enclosure.jpg | index gallery | Portfolio example | Replace with Art Lego project photo |
| house-wash-siding.jpg | remodeling page | Split image | Replace with remodeled exterior |
| coastal-home-exterior-curb-appeal.jpg | about, remodeling | Split image | Replace with Art Lego exterior work |
| building-facade-pressure-wash.jpg | painting page | Split image | Replace with painted exterior |
| patio-sidewalk-pressure-washing.jpg | painting page | Split image | Replace with painted patio/outdoor |

## Color Palette Placeholder (Current CSS)
Located in /assets/style.css :root block. These are contractor-appropriate warm tones (NOT Summit brand):
```
--navy: #0f2657          (dark blue, main accent)
--navy-dark: #081a3f     (darker blue, headers)
--blue: #1667c9          (bright blue, links/CTAs)
--cyan: #2fa8e1          (light blue, icons)
--cyan-light: #8fd2f2    (very light blue, badges)
--gray: #5a6572          (medium gray, body text)
--light: #f4f7fb         (very light blue, sections)
--white: #ffffff         (white)
--ink: #16213a           (dark text)
--ink-soft: #46536b      (softer dark text)
--gold: #de242f          (accent red — currently not used, override to brand color)
```

**Action:** Once Camilio provides logo and brand colors, update --navy, --blue, --gold, and --light to match brand palette.

## Gallery Note Disclosure
Currently active on index.html, remodeling.html, and painting.html:
```
"Photos show representative finish examples while we collect project photos from Art Lego LLC's own jobs."
```
**Action:** Remove this line once real client project photos are live (search for "gallery-note" class).

## Image Alt Text Updates
All current alt texts end with "— representative finish example"
**Action:** Remove this suffix and update to describe actual Art Lego projects once photos are supplied (e.g., "Kitchen remodel completed in Wellington" instead of "Kitchen remodeling project completed — representative finish example").

## Pages Affected by Brand Changes
- index.html (hero, gallery, trust bar, CTAs)
- remodeling.html (split image, CTA buttons)
- painting.html (split image, CTA buttons)
- about.html (split images, CTA buttons, vision/mission)
- contact.html (CTA buttons, form)
- blog/index.html (4 post card images)
- All 4 blog post pages (featured images, CTA buttons)
- /assets/style.css (color variables — single point of update)

## QA Gate Notes
This placeholder branding is acceptable for:
- ✓ Ralph harness QA (honesty gates pass; brand is legally safe generic contractor palette)
- ✓ Staging to Vercel (static assets only)
- ✓ Final copy review (all client facts verified; no branding lies)

This placeholder branding is NOT acceptable for:
- ✗ Client handoff / launch to Camilio
- ✗ Live production (must use real logo + brand colors)
- ✗ Any external sharing until brand is finalized

## Timeline
1. **Today (2026-08-28):** Site built with placeholder brand, ready for Ralph QA
2. **TODO: Camilio provides:** Logo file, brand color hex codes, 4-6 project photos
3. **TODO: Summit dev:** Update /assets/images/logo.png, update /assets/style.css :root variables, replace stock images, remove gallery disclosure note
4. **TODO: Ralph re-QA:** Verify image replacements, re-run honesty gates, approve for launch
5. **TODO: DNS cutover:** Update canonical domain from art-lego-site.vercel.app to final domain

## Contact
Camilio (Art Lego LLC owner) — awaiting brand assets and project photos.
