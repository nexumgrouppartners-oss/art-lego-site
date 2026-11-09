// quality.mjs — shared quality gate for every client blog (identical file in each repo's _routine/).
// Imported by gate.mjs:  import { quality } from './quality.mjs';  errors.push(...quality({ p, t, voice, root, body, text, words }));
// CLI after render:      node _routine/quality.mjs --rendered <slug>   (checks the JSON-LD + visible FAQ of the page render.mjs wrote)
// Rules come from Google's spam + helpful-content guidance (see Summit Knowledge/sops/RESEARCH-scaled-content-aeo-2026-11-09.md):
// answer-first opener, question headings, a real client fact, no near-duplicates (same site or other clients), no AI tells,
// honest structure, links that resolve, schema that matches visible text.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const strip = s => String(s || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&(rsquo|lsquo|#39|apos);/g, "'").replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const wc = s => (strip(s).match(/\S+/g) || []).length;
const toks = s => strip(s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
const shingles = (s, n = 5) => { const w = toks(s), o = new Set(); for (let i = 0; i + n <= w.length; i++) o.add(w.slice(i, i + n).join(' ')); return o; };
const containment = (D, P) => { if (!D.size) return 0; let i = 0; for (const x of D) if (P.has(x)) i++; return i / D.size; };

// page resolver shared with the topic lint: static (cleanUrls), pages/ layout, Next.js app router, JSON posts
export function resolves(root, href) {
  if (/^(tel|mailto):/.test(href)) return true;
  if (/^https?:/.test(href)) return false;
  const p = href.split('#')[0].split('?')[0].replace(/^\/+|\/+$/g, '');
  const c = p === '' ? ['index.html', 'pages/index.html', 'app/page.tsx', 'src/app/page.tsx']
    : [p + '.html', p + '/index.html', 'pages/' + p + '.html', 'pages/' + p + '/index.html', 'app/' + p + '/page.tsx', 'src/app/' + p + '/page.tsx'];
  if (p.startsWith('blog/')) { const s = p.slice(5); c.push('content/blog/' + s + '.json', 'content/blog/' + s + '.md'); }
  if (c.some(f => fs.existsSync(path.join(root, f)))) return true;
  const parts = p.split('/'); if (parts.length < 2) return false;
  const parent = path.join(root, 'app', ...parts.slice(0, -1));
  try { return fs.readdirSync(parent).some(n => /^\[[^\]]+\]$/.test(n) && fs.existsSync(path.join(parent, n, 'page.tsx'))); } catch { return false; }
}

export function postFiles(root) {
  const out = [];
  for (const d of ['pages/blog', 'blog', 'content/blog']) {
    const dir = path.join(root, d);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) if (/\.(html|json|md)$/.test(f) && !/^index\./.test(f)) out.push(path.join(dir, f));
  }
  return out;
}
const fileText = f => { const raw = fs.readFileSync(f, 'utf8'); return f.endsWith('.json') ? strip(raw.replace(/\\n/g, ' ').replace(/\\"/g, '"')) : strip(raw); };

const HARD_TELLS = ['delve', "in today's", 'fast-paced world', 'ever-evolving', "it's important to note", 'it is important to note', "it's worth noting",
  'it is worth noting', 'in conclusion', 'in summary', 'to sum up', 'game-changer', 'game changer', 'tapestry', 'testament to', 'look no further',
  'unlock the', 'elevate your', 'navigate the complexities', 'in the realm of', 'embark on', 'a myriad of', "whether you're a", 'whether you are a',
  "let's dive", 'dive into', 'deep dive', 'rest assured', "we've got you covered", "don't hesitate to", 'do not hesitate to', 'seamless', 'nestled',
  'the world of', 'look no further', 'when all is said and done', 'at the end of the day', 'stands as a', 'serves as a testament', 'a crucial role',
  'a vital role', 'a pivotal role', 'paramount', 'meticulous', 'bustling', 'vibrant community', 'treasure trove', 'beacon of'];
const SOFT_TELLS = ['crucial', 'vital', 'essential', 'robust', 'comprehensive', 'ultimately', 'moreover', 'furthermore', 'additionally', 'peace of mind',
  'when it comes to', 'a key role', 'stands out', 'top-notch', 'hassle-free', 'navigate', 'landscape', 'leverage', 'optimal', 'utilize', 'enhance',
  'ensure that', 'in order to', 'not only', 'it is essential', 'key factors', 'a variety of', 'wide range of'];
const FILLER_OPEN = /^(great question|when it comes to|if you're (like|wondering)|are you wondering|have you ever|in this (article|post|guide)|welcome to|as a (homeowner|parent)|let's)/i;
const BAD_H2 = /^(conclusion|final thoughts|in summary|wrapping up|summary|the bottom line|key takeaways)\b/i;

export function quality({ p, t, voice, root, body, text, words }) {
  const e = [];
  const exempt = [voice.business, voice.tone, ...(voice.services || []), ...(voice.may_state || [])].join(' ').toLowerCase();
  const lower = ' ' + (strip(body) + ' ' + (p.faq || []).map(f => f.q + ' ' + f.a).join(' ') + ' ' + p.description).toLowerCase().replace(/[’‘]/g, "'") + ' ';

  // 1. answer-first opener (AEO: the extractable 40-60 word answer)
  const first = /^\s*<p>([\s\S]*?)<\/p>/.exec(body);
  if (!first) e.push('answer-first: body_html must open with a <p> that answers the title directly');
  else {
    const n = wc(first[1]);
    if (n < 35 || n > 75) e.push(`answer-first: opening <p> is ${n} words (need 40-60, direct answer to the title)`);
    if (FILLER_OPEN.test(strip(first[1]))) e.push('answer-first: opening starts with filler ("' + strip(first[1]).slice(0, 30) + '..."); start with the answer');
  }
  // 2. question headings
  const h2 = [...body.matchAll(/<h2>([\s\S]*?)<\/h2>/g)].map(m => strip(m[1]));
  const q = h2.filter(h => /\?\s*$/.test(h));
  if (h2.length < 3) e.push(`headings: need >=3 <h2> sections (have ${h2.length})`);
  if (q.length < 2 || q.length < h2.length * 0.4) e.push(`headings: ${q.length}/${h2.length} <h2> are questions; need >=2 and >=40% phrased as the reader's question ending in "?"`);
  for (const h of h2) if (BAD_H2.test(h)) e.push('headings: drop the "' + h + '" section (summary/conclusion sections read as filler)');
  if (new Set(h2.map(h => h.toLowerCase())).size !== h2.length) e.push('headings: duplicate <h2>');
  // 3. client fact + business named (non-interchangeable)
  for (const m of t.must_include || []) if (!lower.includes(String(m).toLowerCase().replace(/[’‘]/g, "'"))) e.push(`client fact: must include the phrase "${m}" (from topic.client_fact)`);
  const biz = String(voice.business || '').toLowerCase().replace(/,? (inc|llc|co)\.?$/, '');
  const short = String(voice.title_suffix || '').replace(/^\s*\|\s*/, '').replace(/,? (llc|inc)\.?$/i, '').toLowerCase().trim();
  if (biz && !lower.includes(biz.split(' ').slice(0, 2).join(' ')) && !(short.length >= 4 && lower.includes(short))) e.push(`client fact: name the business ("${voice.business}") at least once in the body`);
  // 4. length per topic format
  if (Array.isArray(t.words)) { const [a, b] = t.words; if (words < Math.round(a * 0.9) || words > Math.round(b * 1.1)) e.push(`length: ${words} words; this topic's format wants ${a}-${b}`); }
  // 5. format structure (varied structure, no single template fingerprint)
  const li = (body.match(/<li>/g) || []).length;
  if (['how-to', 'process-walkthrough'].includes(t.format) && !/<ol>/.test(body)) e.push(`format ${t.format}: use an <ol> for the steps`);
  if (t.format === 'checklist' && li < 6) e.push('format checklist: need a list with >=6 <li> items');
  if (t.format === 'faq-roundup' && q.length < 5) e.push('format faq-roundup: need >=5 question <h2>s');
  // 6. AI tells (client's own wording exempt)
  const hard = HARD_TELLS.filter(x => lower.includes(x) && !exempt.includes(x));
  if (hard.length) e.push('AI-tell phrases (rewrite plainly): ' + hard.map(x => '"' + x + '"').join(', '));
  const soft = SOFT_TELLS.filter(x => lower.includes(' ' + x) && !exempt.includes(x));
  if (soft.length >= 5) e.push('AI-tell density: ' + soft.length + ' stock words (' + soft.join(', ') + '); keep under 5, use plain words');
  const dashes = (body.match(/—|&mdash;|–|&ndash;/g) || []).length;
  if (dashes > 3) e.push(`AI-tell: ${dashes} dashes; use at most 3 (write two sentences instead)`);
  const exclaim = (strip(body).match(/!/g) || []).length;
  if (exclaim > 1) e.push('tone: at most one "!"');
  // 7. links resolve (internal links to real service/area pages; max 5)
  const hrefs = [...body.matchAll(/href="([^"]*)"/g)].map(m => m[1]);
  const internal = hrefs.filter(h => !/^(tel|mailto):/.test(h));
  for (const h of internal) if (!resolves(root, h)) e.push('link does not resolve to a page on this site: ' + h);
  if (internal.length > 5) e.push(`links: ${internal.length} internal links; max 5`);
  // 8. FAQ quality (FAQPage schema must match visible, self-contained answers)
  for (const f of p.faq || []) {
    if (!/\?\s*$/.test(f.q || '')) e.push('faq: question must end with "?": ' + String(f.q).slice(0, 50));
    const n = wc(f.a); if (n < 12 || n > 90) e.push(`faq: answer is ${n} words (12-90): ` + String(f.q).slice(0, 40));
    if (h2.some(h => h.toLowerCase() === String(f.q).toLowerCase().trim())) e.push('faq: repeats an <h2> word for word: ' + f.q);
  }
  // 9. uniqueness — same site (near-duplicate / doorway) and other clients (interchangeable copy). Fails open on IO errors.
  try {
    const D = shingles(body);
    let worst = { c: 0, f: '' };
    for (const f of postFiles(root)) { if (path.basename(f).startsWith(t.slug + '.')) continue; const c = containment(D, shingles(fileText(f))); if (c > worst.c) worst = { c, f }; }
    if (worst.c > 0.12) e.push(`uniqueness: ${(worst.c * 100).toFixed(0)}% of 5-word phrases already on this site in ${path.basename(worst.f)} (max 12%); rewrite in fresh words`);
    const parent = path.dirname(path.resolve(root));
    for (const sib of fs.readdirSync(parent)) {
      const sr = path.join(parent, sib); if (path.resolve(sr) === path.resolve(root) || !fs.existsSync(path.join(sr, '_routine', 'voice.json'))) continue;
      for (const f of postFiles(sr)) { const c = containment(D, shingles(fileText(f))); if (c > 0.08) { e.push(`uniqueness: ${(c * 100).toFixed(0)}% overlap with another client's post (${sib}/${path.basename(f)}); this post must not be interchangeable`); break; } }
    }
  } catch { /* fail open */ }
  // 10. title near-duplicate after removing city names (doorway pattern)
  try {
    const cities = (voice.cities || []).map(c => c.toLowerCase());
    const STOP = new Set('a an the and or of in on for to with your you how what why when is are do does should can my vs our its it at by from'.split(' '));
    const ct = s => { let x = String(s).toLowerCase(); for (const c of cities) x = x.split(c).join(' '); return new Set(x.replace(/\b(fl|florida)\b/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w))); };
    const topics = JSON.parse(fs.readFileSync(path.join(root, '_routine', 'topics.json'), 'utf8'));
    const A = ct(t.title);
    for (const o of topics) { if (o.slug === t.slug || o.status !== 'published') continue; const B = ct(o.title); const i = [...A].filter(x => B.has(x)).length; const j = i / Math.max(1, A.size + B.size - i); if (j >= 0.6) { e.push(`doorway: title matches published "${o.title}" once city names are removed (${j.toFixed(2)}); park this topic`); break; } }
  } catch { /* fail open */ }
  return e;
}

// ---- CLI: validate what render.mjs wrote (schema present, parses, FAQ visible) ----
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--rendered'); const slug = process.argv[i + 1];
  if (i < 0 || !slug) { console.error('usage: node _routine/quality.mjs --rendered <slug>'); process.exit(2); }
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const f = postFiles(root).find(x => path.basename(x).replace(/\.(html|json|md)$/, '') === slug);
  if (!f) { console.error('FAIL no rendered file for ' + slug); process.exit(1); }
  const raw = fs.readFileSync(f, 'utf8'); const e = [];
  if (f.endsWith('.html')) {
    const blocks = [...raw.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
    const docs = []; for (const b of blocks) { try { const j = JSON.parse(b); docs.push(j, ...(Array.isArray(j['@graph']) ? j['@graph'] : [])); } catch (x) { e.push('JSON-LD does not parse: ' + x.message.slice(0, 80)); } }
    const ty = d => [].concat(d['@type'] || []);
    const bp = docs.find(d => ty(d).includes('BlogPosting') || ty(d).includes('Article'));
    if (!bp) e.push('missing BlogPosting JSON-LD'); else for (const k of ['headline', 'datePublished', 'author', 'image', 'mainEntityOfPage']) if (!bp[k]) e.push('BlogPosting missing ' + k);
    const fq = docs.find(d => ty(d).includes('FAQPage'));
    if (!fq || !Array.isArray(fq.mainEntity) || fq.mainEntity.length < 3) e.push('FAQPage JSON-LD missing or <3 questions');
    else { const vis = strip(raw).toLowerCase(); for (const qq of fq.mainEntity) if (!vis.includes(strip(qq.name).toLowerCase())) e.push('FAQ question in schema is not visible on the page: ' + qq.name); }
    const bc = docs.find(d => ty(d).includes('BreadcrumbList'));
    if (!bc || !(bc.itemListElement || []).length) e.push('missing BreadcrumbList JSON-LD');
    if (/\{\{[A-Z_]+\}\}/.test(raw)) e.push('unfilled {{PLACEHOLDER}} in page');
  } else {
    try { const j = JSON.parse(raw); for (const k of ['slug', 'title', 'description', 'body_html']) if (!j[k]) e.push('post JSON missing ' + k); if (!Array.isArray(j.faq) || j.faq.length < 3) e.push('post JSON needs >=3 faq (page.tsx renders FAQPage from it)'); } catch (x) { e.push('post JSON does not parse'); }
  }
  if (e.length) { console.error('FAIL\n- ' + e.join('\n- ')); process.exit(1); }
  console.log('PASS rendered ' + path.relative(root, f));
}
