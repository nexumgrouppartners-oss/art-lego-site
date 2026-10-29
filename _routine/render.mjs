// Usage: node _routine/render.mjs draft.json   (run gate.mjs first)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');
const voice = JSON.parse(fs.readFileSync(path.join(dir, 'voice.json'), 'utf8'));
const topics = JSON.parse(fs.readFileSync(path.join(dir, 'topics.json'), 'utf8'));
const p = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const t = topics.find(x => x.slug === p.slug); if (!t) throw new Error('unknown slug');
const site = voice.site_url.replace(/\/$/, '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const now = new Date();
const et = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
const human = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric' }).format(now);
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const files = { tpl: fs.readFileSync(path.join(dir, 'post-template.html'), 'utf8'), index: rd('blog/index.html'), sitemap: rd('sitemap.xml'), llms: rd('llms.txt') };
for (const [k, v] of Object.entries(files)) if (v.length < 200) throw new Error(k + ' looks empty');
if (files.sitemap.includes('/blog/' + t.slug + '<')) throw new Error('slug already in sitemap: ' + t.slug);
const faq = p.faq.slice(0, 5);
const text = p.body_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const words = text.split(' ').length;
const body = p.body_html.replace(/<a href="([^"]+)">/g, '<a href="$1" style="text-decoration:underline;">')
  .split(/(?=<h2>|<p>|<ul>)/).map(l => '    ' + l.trim()).join('\n');
const faqJson = JSON.stringify(faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })), null, 2).replace(/\n/g, '\n  ');
const faqHtml = '\n\n    <h2>Frequently Asked Questions</h2>\n' + faq.map(f => '    <h3>' + esc(f.q) + '</h3>\n    <p>' + esc(f.a) + '</p>').join('\n');
const map = {
  '{{SEO_TITLE}}': esc(p.seo_title), '{{DESC}}': esc(p.description), '{{SLUG}}': t.slug, '{{IMG}}': t.image, '{{IMG_ALT}}': esc(t.image_alt),
  '{{TITLE_JSON}}': JSON.stringify(t.title), '{{DESC_JSON}}': JSON.stringify(p.description), '{{DATE}}': et, '{{DATE_HUMAN}}': human,
  '{{FAQ_JSON}}': faqJson, '{{CRUMB_JSON}}': JSON.stringify(p.crumb), '{{CRUMB}}': esc(p.crumb), '{{TITLE}}': esc(t.title),
  '{{BODY}}': body + faqHtml, '{{CTA}}': esc(p.cta),
};
let html = files.tpl;
for (const [k, v] of Object.entries(map)) html = html.split(k).join(v);
if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error('unfilled placeholder in template');
const url = site + '/blog/' + t.slug;
const card = '\n      <div class="service-card">\n        <img src="/assets/images/' + t.image + '" alt="' + esc(t.image_alt) + '" loading="lazy" style="border-radius:10px;margin-bottom:14px;aspect-ratio:4/3;object-fit:cover;">\n' +
  '        <h3><a href="/blog/' + t.slug + '" style="color:var(--navy-dark);">' + esc(t.title) + '</a></h3>\n        <p>' + esc(p.description) + '</p>\n' +
  '        <a href="/blog/' + t.slug + '" class="learn">Read more &rarr;</a>\n      </div>';
const need = (s, m) => { if (!s.includes(m)) throw new Error('marker missing: ' + m); };
need(files.index, '<!-- POSTS:START -->'); need(files.sitemap, '<!-- POSTS:END -->'); need(files.llms, '<!-- POSTS:START -->');
fs.writeFileSync(path.join(root, 'blog', t.slug + '.html'), html);
fs.writeFileSync(path.join(root, 'blog/index.html'), files.index.replace('<!-- POSTS:START -->', '<!-- POSTS:START -->' + card));
fs.writeFileSync(path.join(root, 'sitemap.xml'), files.sitemap.replace('<!-- POSTS:END -->', '  <url>\n    <loc>' + url + '</loc>\n    <lastmod>' + et + '</lastmod>\n  </url>\n<!-- POSTS:END -->'));
fs.writeFileSync(path.join(root, 'llms.txt'), files.llms.replace('<!-- POSTS:START -->', '<!-- POSTS:START -->\n- [' + t.title + '](' + url + ')'));
t.status = 'published'; t.published_at = now.toISOString(); t.live_url = url; t.attempts = (t.attempts || 0) + 1; t.last_error = null;
fs.writeFileSync(path.join(dir, 'topics.json'), JSON.stringify(topics, null, 1));
const logp = path.join(dir, 'publish-log.json'); const log = fs.existsSync(logp) ? JSON.parse(fs.readFileSync(logp, 'utf8')) : [];
log.push({ at: now.toISOString(), slug: t.slug, title: t.title, status: 'published', live_url: url, words, writer: 'claude-cloud-routine' });
fs.writeFileSync(logp, JSON.stringify(log, null, 1));
console.log(JSON.stringify({ live_url: url, words, commit_message: 'Daily post: ' + t.title + ' (cloud routine, ' + words + 'w)' }));
