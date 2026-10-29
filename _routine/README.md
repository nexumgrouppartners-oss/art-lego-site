# _routine — Client Daily Posts (cloud routine)

Runs from a Claude Code cloud routine ("Client Daily Posts", claude.ai/code/routines) three times a day.
Everything the agent needs is in this folder. No brain/Supabase access from the cloud.

Files
- `voice.json`     business voice card: name, phone, cities, may_state, never_claim, tone, site_url, title_suffix
- `topics.json`    topic bank. Each: slug, title, target_query, angle, service_link, related_link, image, image_alt, priority, status (pending|published|parked), published_at, live_url, last_error
- `post-template.html` page template with {{PLACEHOLDERS}}
- `pick.mjs`       prints the next pending topic (lowest priority number) as JSON, or `{}` if none
- `gate.mjs`       `node _routine/gate.mjs draft.json`  -> exit 0 PASS / exit 1 with the list of failures (same rules as the n8n quality gate)
- `render.mjs`     `node _routine/render.mjs draft.json` -> writes blog/<slug>.html, updates blog/index.html, sitemap.xml, llms.txt, marks topic published in topics.json
- `publish-log.json` appended by render.mjs; synced to the brain from Sir's PC by `Ops/client-daily-posts/sync-brain.mjs`

Agent procedure (one topic per run):
1. `node _routine/pick.mjs` -> topic. None -> stop, say "queue empty".
2. Write the post as JSON to `/tmp/draft.json` following `voice.json` + the topic + the rules in `gate.mjs` header.
3. `node _routine/gate.mjs /tmp/draft.json`. Fail -> fix every listed error, rerun. Two fails -> `node _routine/park.mjs <slug> "<errors>"`, commit, stop.
4. `node _routine/render.mjs /tmp/draft.json` -> commit all changes to main, push.
5. Wait ~120s, `curl -sI <live_url>` must be 200. Not 200 -> `node _routine/park.mjs <slug> "live check HTTP <code>"`, commit, push.
