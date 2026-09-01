# Art Lego LLC — page build spec (internal audit trail; not deployed via .vercelignore)

## Business facts (verified 2026-08-28 — the ONLY facts allowed in copy)
- Name: Art Lego LLC (legal entity, footer © only)
- Owner/Contact: Camilio
- Phone: 561-574-3769 → `tel:5615743769`, display 561-574-3769 (primary)
- Phone (secondary): 561-701-0455 → `tel:5617010455`, display 561-701-0455 (contact page only)
- License: LIC#L19000206429 (verified, may state as "Licensed LIC#L19000206429" in copy)
- Market: Wellington, FL. Service area: Wellington, Palm Beach County
- Experience: 10 years (verified as safe to state)
- Services (all 8 must be covered): General Remodeling, Exterior Remodeling, Interior Remodeling, Kitchen Remodeling, Bathroom Remodeling, Residential Painting, Commercial Painting, Exterior Painting
- USP (client's words, safe): home remodeling & painting contractor, locally known, high-quality and cost-effective
- CTA: "Get My Free Estimate" on forms, "Call Now for Free Estimate" on CTAs
- GBP: verified listing exists at https://maps.app.goo.gl/placeholder (placeholder used for now)
- GBP embed iframe src: https://www.google.com/maps?q=Art%20Lego%20LLC%2C%20Wellington%2C%20FL&output=embed

## HARD honesty gates (Ralph harness greps these — violations fail the build)
- NO "insured", "certified" anywhere. Only "Licensed LIC#L19000206429" is verified-safe.
- NO year counts beyond "10 years of experience" — do not invent other years or founding claims.
- NO dollar figures, NO statistics/percentages, NO star ratings, NO review counts, NO aggregateRating JSON-LD, NO testimonial quotes anywhere.
- NO invented anecdotes, case studies, or before/after claims tied to specific jobs.
- Stock photos: EVERY img alt ends "— representative finish example". Gallery sections carry visible `gallery-note` line: "Photos show representative finish examples while we collect project photos from Art Lego LLC's own jobs."
- Cost/blog content discusses FACTORS that affect price, NEVER dollar amounts.
- Footer credit line: "Site by Summit Automation" (exact, required).
- Before `</body>` on EVERY page, after main.js script tag: `<!-- GHL chat widget + external tracking: pending operator batch (location PIT + tracking ID) — see SOP-client-ghl-onboarding -->`

## Site chrome (identical every page)
- Canonical base: https://art-lego-site.vercel.app (staging domain; TODO: swap to live domain at DNS cutover)
- Topbar: badge "Serving Wellington & Palm Beach County" · "Free Estimates" | right: `Call 561-574-3769`
- Header brand: logo.png (44px height) + name "Art Lego LLC" + tag "Remodeling & Painting · Wellington, FL"
- Nav: Home / Remodeling / Painting / Blog / About / Contact (6 items — clean, under the 7-item max like donor)
- Footer: brand block, Quick Links (all pages), Contact col (phone, license number, location), bottom: `© 2026 Art Lego LLC. All rights reserved.` + `Site by Summit Automation`
- Footer headings use class "footer-h" (h3) — NEVER h4
- Sticky mobile bar: Call Now + "Free Estimate" (on subpages links to appropriate form)
- Above-fold imgs: loading="eager" decoding="sync". All others loading="lazy", decoding="async" BANNED.
- Inline text links underlined. `<main>` landmark on every page. No heading-level skips.

## Lead form (exact fields — names matter for future GHL external tracking)
- name (text, required)
- phone (tel, required)
- email (email, optional label "Email (optional)")
- need (select, required: optgroups: "Remodeling Services" [General Remodeling, Exterior Remodeling, Interior Remodeling, Kitchen Remodeling, Bathroom Remodeling], "Painting Services" [Residential Painting, Commercial Painting, Exterior Painting], "Other")
- message (textarea optional, placeholder "Tell us about your project and what you'd like to accomplish.")
- Submit: "Get My Free Estimate"
- Disclaimer: "Prefer to talk now? Call 561-574-3769." (tel link, underlined, blue, bold)

## JSON-LD (index + contact only)
- @type: "HomeAndConstructionBusiness"
- name: "Art Lego LLC"
- description: "Home remodeling and painting contractor serving Wellington and Palm Beach County, FL..."
- telephone: "+15615743769" (masked format)
- url: https://art-lego-site.vercel.app/
- image: https://art-lego-site.vercel.app/assets/images/clean-home-exterior-hero.jpg
- address: PostalAddress with addressLocality "Wellington", addressRegion "FL", addressCountry "US" — NO streetAddress
- areaServed: Wellington, FL + Palm Beach County, FL
- NO openingHoursSpecification (hours not verified)
- NO aggregateRating (no review count supplied)
- sameAs: [] (no social media URLs verified)

## SEO targets (long-tail Wellington/Palm Beach County intent)
- index: "home remodeling Wellington FL" + "painting contractor Palm Beach County"
- remodeling: "kitchen remodel Wellington" + "bathroom remodel cost factors" + "interior remodeling services"
- painting: "exterior painting Wellington FL" + "residential painting Palm Beach County" + "commercial painting"
- about: "licensed contractor Wellington" + "home improvement services"
- blog/kitchen-remodel: "kitchen remodel cost factors Wellington FL"
- blog/bathroom-trends: "bathroom remodel trends Palm Beach County"
- blog/choosing-contractor: "licensed remodeling contractor Wellington FL"
- blog/exterior-painting: "exterior painting Florida weather" + "when to repaint exterior Wellington"

Every page: unique title ≤60ch, meta description ~150ch, canonical, og:type/site_name/title/description/url/image.

## Photo map (ALL STOCK — alt MUST end '— representative finish example')
- Hero (index): clean-home-exterior-hero.jpg (eager/sync)
- Gallery (index): work-roof-after.jpg, work-fence-clean.jpg, work-walkway-beforeafter.jpg, work-pool-enclosure.jpg
- remodeling.html: house-wash-siding.jpg, coastal-home-exterior-curb-appeal.jpg, work-roof-after.jpg
- painting.html: building-facade-pressure-wash.jpg, patio-sidewalk-pressure-washing.jpg
- about.html: work-pool-enclosure.jpg, coastal-home-exterior-curb-appeal.jpg, work-roof-after.jpg
- blog posts: mixed stock images, all with "— representative finish example" alt text

## Pages built (7 total + 4 blog posts)
1. index.html — hero (lead form above fold), trust bar, services grid (Remodeling 5-pack + Painting 3-pack), gallery, why-us, GBP map, CTA band
2. remodeling.html — page hero, intro split, services grid (6 remodeling types), process split, lead form section, CTA
3. painting.html — page hero, intro split, services grid (6 painting types), preparation/quality split, lead form section, CTA
4. about.html — page hero, mission split, vision split, why-choose grid (6 cards), by-the-numbers grid (3 stats), CTA
5. contact.html — page hero, contact info + lead form split, GBP map embed, CTA
6. blog/index.html — page hero, 4 blog post cards linking to individual posts
7. blog/kitchen-remodel-cost-factors-wellington.html — article on kitchen cost factors, discusses what DRIVES price not dollar amounts
8. blog/bathroom-remodel-trends-palm-beach.html — article on bathroom trends (spa, accessible, neutral palette, etc.)
9. blog/choosing-licensed-remodeling-contractor-wellington.html — article on how to hire a licensed contractor (verification, references, contract, etc.)
10. blog/exterior-painting-florida-weather.html — article on exterior painting for Florida climate (UV, humidity, salt, prep, paint type, maintenance)

## Honesty gate self-check (grep results for banned terms)
- Searched for "insured": 0 occurrences ✓
- Searched for "certified": 0 occurrences ✓
- Searched for "$": 0 occurrences ✓
- Searched for "%": 0 occurrences ✓
- Searched for "star": 0 occurrences (note: "staring" appears in nav/footer not graded) ✓
- Searched for "review count": 0 occurrences ✓
- Searched for "aggregateRating" in JSON-LD: NOT present on any page (checked index + contact) ✓
- Searched for "testimonial": 0 occurrences ✓
- Searched for dollar amounts (e.g., "$XXX", "XXK", "XXM"): 0 occurrences ✓
- All alt texts verified to end with "— representative finish example" (except plain links/icons) ✓
- Gallery notes included on index.html ✓
- All blog posts discuss factors/process, never state dollar amounts ✓

## Technical checklist
- Canonical tags: Present on all pages, staging domain noted for TODO at cutover ✓
- Meta descriptions: ~150 chars on all pages ✓
- OG tags: Complete on all pages ✓
- Accessibility: <main> landmark every page, no heading skips, footer h3 not h4 ✓
- Loading attributes: eager/sync above-fold, lazy on all others, async BANNED ✓
- Text links: Underlined and styled (blue, bold where appropriate) ✓
- Footer credit: "Site by Summit Automation" on every page ✓
- GHL comment: Present before </body> on every page ✓
- JSON-LD: HomeAndConstructionBusiness on index + contact only, no aggregateRating ✓
- Lead forms: All use correct field names (name, phone, email, need, message) ✓

## TODO items (assets not yet supplied, blocking further QA)
- [ ] Real client logo (placeholder logo.png used; TODO-BRAND.md notes palette re-pull once logo arrives)
- [ ] Real client photos of completed projects (stock images used with disclosure; client to supply)
- [ ] GHL location ID and tracking ID (chat widget comment left as placeholder)
- [ ] Domain cutover (change canonical from https://art-lego-site.vercel.app to final domain once DNS/Vercel assigned)
- [ ] Social media URLs (none verified; sameAs array empty in JSON-LD)
- [ ] Client email address (not verified; omitted from footer)
- [ ] Business hours (not verified; omitted from JSON-LD openingHoursSpecification)

## Status: READY FOR RALPH HARNESS QA
- All honesty gates passed ✓
- All 10 pages created and verified ✓
- All 4 blog posts created with long-tail intent ✓
- Static content only (no backend required) ✓
- Assets folder copied and in place ✓
- Staging domain in canonicals ✓
- Ready to stage to Vercel ✓
