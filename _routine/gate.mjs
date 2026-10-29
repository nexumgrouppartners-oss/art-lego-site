// Quality gate. Usage: node _routine/gate.mjs draft.json
// draft.json = { "slug", "seo_title", "description", "crumb", "cta", "body_html", "faq":[{"q","a"}] }
// RULES (the writer must follow these):
//  seo_title 45-60 chars, ends with voice.title_suffix | description 125-155 | crumb <=40 | cta <=55
//  body_html 850-1150 words, tags only <p><h2><ul><li><strong><a>; first <p> = 2-3 sentence direct answer
//  exactly two links: topic.service_link and topic.related_link (tel: allowed); name >=1 city from voice.cities
//  no $ amounts, %, studies/stats, licensed/insured/certified/bonded, guarantee/warranty, tenure, awards, job counts
//  faq 3-5 plain-text items; reading grade <= 9; last <p> invites a free estimate + phone
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');
const voice = JSON.parse(fs.readFileSync(path.join(dir, 'voice.json'), 'utf8'));
const topics = JSON.parse(fs.readFileSync(path.join(dir, 'topics.json'), 'utf8'));
const p = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const t = topics.find(x => x.slug === p.slug);
if (!t) { console.error('FAIL: unknown slug ' + p.slug); process.exit(1); }
const errors = [];
const s = k => (typeof p[k] === 'string' ? p[k].trim() : '');
const seo = s('seo_title'), desc = s('description'), crumb = s('crumb'), cta = s('cta'), body = s('body_html');
if (seo.length < 40 || seo.length > 66) errors.push('seo_title length ' + seo.length + ' (need 45-60)');
if (voice.title_suffix && !seo.endsWith(voice.title_suffix)) errors.push('seo_title must end with "' + voice.title_suffix + '"');
if (desc.length < 110 || desc.length > 160) errors.push('description length ' + desc.length + ' (need 125-155)');
if (!crumb || crumb.length > 45) errors.push('crumb missing or too long');
if (!cta || cta.length > 60) errors.push('cta missing or too long');
const text = body.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const words = text ? text.split(' ').length : 0;
if (words < 800 || words > 1400) errors.push('body word count ' + words + ' (need 850-1150)');
const badTag = (body.match(/<\/?([a-z0-9]+)/gi) || []).map(m => m.replace(/[<\/]/g, '').toLowerCase()).filter(tg => !['p','h2','h3','ul','ol','li','strong','em','a'].includes(tg));
if (badTag.length) errors.push('disallowed tags: ' + [...new Set(badTag)].join(','));
const hrefs = [...body.matchAll(/href="([^"]*)"/g)].map(m => m[1]);
if (!hrefs.includes(t.service_link)) errors.push('missing link to ' + t.service_link);
if (!hrefs.includes(t.related_link)) errors.push('missing link to ' + t.related_link);
const extra = hrefs.filter(h => h !== t.service_link && h !== t.related_link && !/^tel:/.test(h));
if (extra.length) errors.push('links not allowed: ' + extra.join(', '));
if (!(voice.cities || []).some(c => text.includes(c))) errors.push('no service-area city named');
if (voice.phone && !text.includes(voice.phone)) errors.push('phone ' + voice.phone + ' missing from body');
const all = [seo, desc, text, JSON.stringify(p.faq || [])].join(' ');
const banned = [
  [/\$\s?\d/, 'dollar amount'], [/\d\s?%|percent/i, 'percentage'],
  [/studies show|research shows|according to|survey|statistic/i, 'unsourced study/stat'],
  [/licensed|insured|certified|bonded/i, 'license/insurance claim'],
  [/guarantee|warrant(y|ies)/i, 'guarantee claim'], [/years of experience|\d+\+? years in business|since (19|20)\d\d/i, 'tenure claim'],
  [/award|best in|#1|number one|top[- ]rated/i, 'superlative/award claim'],
  [/\d{2,}[,\d]* (homes|customers|clients|jobs|roofs|driveways)/i, 'job-count claim'],
  [/lorem ipsum|TODO|FIXME|\[placeholder\]|\[insert/i, 'placeholder text'],
];
for (const [re, label] of banned) if (re.test(all)) errors.push('banned: ' + label + ' ("' + (all.match(re) || [''])[0] + '")');
const faq = Array.isArray(p.faq) ? p.faq.filter(f => f && f.q && f.a) : [];
if (faq.length < 3) errors.push('need 3-5 faq items');
if (faq.some(f => /<[^>]+>/.test(f.q + f.a))) errors.push('faq must be plain text');
if (topics.some(x => x.status === 'published' && x.slug !== t.slug && x.title.toLowerCase() === t.title.toLowerCase())) errors.push('duplicate title');
if (fs.existsSync(path.join(root, 'blog', t.slug + '.html'))) errors.push('blog/' + t.slug + '.html already exists');
const sentences = Math.max(1, (text.match(/[.!?]+(\s|$)/g) || []).length);
const syl = w => { w = w.toLowerCase().replace(/[^a-z]/g, ''); if (w.length <= 3) return 1; w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, ''); return Math.max(1, (w.match(/[aeiouy]{1,2}/g) || []).length); };
const ws = text.split(' ').filter(Boolean);
const grade = 0.39 * (ws.length / sentences) + 11.8 * (ws.reduce((a, w) => a + syl(w), 0) / Math.max(1, ws.length)) - 15.59;
if (grade > 9.5) errors.push('reading grade ' + grade.toFixed(1) + ' (need <= 9; shorter sentences, plainer words)');
if (errors.length) { console.error('FAIL\n- ' + errors.join('\n- ')); process.exit(1); }
console.log('PASS ' + words + 'w grade ' + grade.toFixed(1));
