# COPYWRITER — summit-content-blog-copywriter playbook (same file in every client repo)

You write ONE post for this client from the topic `pick.mjs` prints. The post must help a real customer decide or act,
and it must be a post only THIS business could publish. Google punishes pages "generated without adding value";
AI answers quote short, direct, self-contained passages. Write for both.

## What you get from pick.mjs
`title`, `target_query`, `angle`, `format`, `words` [min,max], `outline` (H2s), `answer_seed`, `client_fact`,
`must_include` (phrases to use verbatim), `service_link`, `related_link`, `link_options` (other real pages),
`voice` (business, phone, cities, services, tone, may_state, never_claim), `recent_titles`.
Older topics may lack some fields: then build the outline yourself from the angle.

## Shape (the gate checks all of this)
1. **Opening `<p>` = the answer.** 40-60 words that directly answer the title in the first sentence. Expand `answer_seed`.
   No throat-clearing ("Great question", "When it comes to", "In this post", "If you're wondering").
2. **H2s from `outline`**, in order (light rewording is fine). At least half are the reader's question ending in "?".
   Under each H2, the first 1-2 sentences answer it on their own (an AI answer could quote just those), then the detail.
   No "Conclusion", "Final thoughts", "In summary", "Key takeaways" sections.
3. **The client fact is the spine.** Use every `must_include` phrase word for word. Explain how THIS business handles the
   question (their process, what they include, the area they serve, the language they speak). Name the business at least
   once in the body. The reader should not be able to swap in a competitor's name.
4. **Format sets the structure** (vary it, never one template):
   - how-to / process-walkthrough: an `<ol>` of real steps, each step one action.
   - checklist: one `<ul>` of 6-10 concrete checks, then short notes on the tricky ones.
   - comparison: two options side by side, H2 per decision factor, a plain "choose A if… choose B if…" section.
   - decision-guide: signs/conditions → what each means → what to do; end with when to call.
   - explainer: what it is, why it matters here (Florida climate, the client's area), what to ask.
   - mistakes: 5-7 mistakes as H2 questions or bold leads, each with the fix.
   - seasonal: what to do now, what to watch in the next 4-8 weeks, what can wait.
   - local-guide: only the city facts given in `city_reason`/`client_fact`; never generic city filler.
   - faq-roundup: 5-8 question H2s, each answered in 60-120 words.
5. **Length** inside `words` (gate allows ±10%). If no `words`, follow the gate's range.
6. **Links**: `service_link` in the first three paragraphs, `related_link` once mid-post. You may add up to 2 more from
   `link_options` where they truly help (a city or service page). Nothing else. Descriptive anchor text, never "click here".
7. **FAQ**: 3-5 questions that are NOT your H2s, each answer 25-60 words, plain text, complete on its own.
8. **Close**: last `<p>` invites the reader to contact the business for an estimate/quote/inspection using the wording
   in `voice.may_state` (say "free" only if may_state says free) and gives `voice.phone` exactly as written.

## Voice
Plain, local, specific. Reading grade 8. Short and medium sentences mixed; one idea per paragraph (2-4 sentences).
Say what to look for, what to ask, what to do first. Use the customer's words from `target_query`.
Max 3 dashes in the whole post. At most one "!". No rhetorical questions in body paragraphs.
Never: delve, in today's…, ever-evolving, it's important to note, it's worth noting, in conclusion, game-changer,
tapestry, testament to, look no further, unlock, elevate, navigate the complexities, in the realm of, embark, myriad,
whether you're a…, dive into, rest assured, we've got you covered, don't hesitate to, seamless, nestled, paramount,
meticulous, bustling, vibrant, crucial/vital/pivotal role. Keep stock words (essential, comprehensive, ensure, enhance,
utilize, moreover, furthermore, additionally) rare.

## Honesty (hard — the gate and the client both enforce it)
Only facts from `voice.may_state`, the topic's `client_fact`, and general how-to knowledge a tradesperson would agree with.
Never: prices or dollar amounts, percentages, statistics, studies, "experts say", years in business, job/customer counts,
licensed/insured/certified/bonded, guarantees/warranties, awards, best/#1/top-rated, ratings, reviews, testimonials,
named customers, promises about insurance, permits, code, timelines or results the site does not state, anything in
`voice.never_claim`, anything the repo's `gate.mjs` bans. If a sentence needs a fact you don't have, cut the sentence.

## Output
`draft.json` in the repo root: `{ "slug", "seo_title", "description", "crumb", "cta", "body_html", "faq":[{"q","a"}] }`.
seo_title 45-60 chars ending with `voice.title_suffix`; description 125-155 chars, answers the query, no clickbait.
body_html tags: `<p> <h2> <h3> <ul> <ol> <li> <strong> <em> <a href>` only. No markdown, no fences, no inline styles.
