# _routine — Client Daily Posts (cloud routine, v2 2026-11-09)

Runs from the Claude Code cloud routine "Client Daily Posts" (trig_013Z4A1CfyZ3YVqhhaoMnYPY), 3 fires a day.
Each fire writes at most one post per repo; `voice.posts_per_day` caps posts per ET day. No brain access from the cloud.
Source of the shared files: `Desktop\Summit\Ops\client-daily-posts\kit\` (install with `install-kit.mjs`). SOP: `SOP-client-blog-engine.md`.

Files
- `COPYWRITER.md`  how to write the post (shape, formats, voice, honesty). Same file in every repo.
- `voice.json`     business card: name, phone, cities, services, may_state, never_claim, tone, site_url, title_suffix, posts_per_day
- `topics.json`    topic bank: slug, title, target_query, angle, links, image, priority, status (pending|published|parked) and
                   (v2) intent, format, source, evidence, client_fact, fact_source, must_include, outline, answer_seed, words, city_reason
- `pick.mjs`       next topic as JSON, or `{}` (stderr says "queue empty" or "daily cap N reached")
- `gate.mjs`       `node _routine/gate.mjs draft.json` -> PASS or the list of fixes. Client-specific bans live here; shared checks in `quality.mjs`
- `quality.mjs`    shared checks: answer-first opener, question H2s, client fact, format structure, AI tells, links resolve, FAQ, uniqueness
                   (this site + other clients), doorway titles. `node _routine/quality.mjs --rendered <slug>` checks the written page's schema.
- `render.mjs`     writes the post, updates blog index, sitemap, llms.txt, marks the topic published, appends publish-log.json
- `park.mjs`       `node _routine/park.mjs <slug> "<reason>"` parks a topic that cannot pass
- `publish-log.json` read by the outage watcher and `Ops/client-daily-posts/sync-brain.mjs`

Agent procedure (one topic per fire): pick -> write draft.json per COPYWRITER.md -> gate (max 4 tries, else park)
-> render -> quality --rendered (fail: revert + park) -> commit + push -> after all repos, curl each live_url (not 200: park).
