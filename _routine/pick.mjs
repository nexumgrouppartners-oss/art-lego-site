// Prints the next topic as JSON (with voice card, recent titles and real internal links), or {} when nothing should be written.
// {} reasons go to stderr: "queue empty" or "daily cap N reached". Cap = voice.posts_per_day (default 3), counted per ET day.
// Rotation: picks the lowest-priority pending topic whose format differs from the last published post's format.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');
const topics = JSON.parse(fs.readFileSync(path.join(dir, 'topics.json'), 'utf8'));
const voice = JSON.parse(fs.readFileSync(path.join(dir, 'voice.json'), 'utf8'));
const logp = path.join(dir, 'publish-log.json');
const log = fs.existsSync(logp) ? JSON.parse(fs.readFileSync(logp, 'utf8')) : [];
const etDay = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(d));
const today = etDay(Date.now());
const cap = Number.isInteger(voice.posts_per_day) ? voice.posts_per_day : 3;
const done = log.filter(e => e.status === 'published' && etDay(e.at) === today).length;
if (done >= cap) { console.error(`daily cap ${cap} reached (${done} published today ET)`); process.stdout.write('{}'); process.exit(0); }
const pending = topics.filter(t => t.status === 'pending').sort((a, b) => a.priority - b.priority);
if (!pending.length) { console.error('queue empty'); process.stdout.write('{}'); process.exit(0); }
const published = topics.filter(t => t.status === 'published').sort((a, b) => String(a.published_at).localeCompare(String(b.published_at)));
const lastFmt = (published[published.length - 1] || {}).format;
const next = pending.slice(0, 5).find(t => !t.format || t.format !== lastFmt) || pending[0];
// internal pages the writer may link to (non-blog pages from the sitemap, or Next.js app routes)
let link_options = [];
try {
  const sm = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  link_options = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname.replace(/\/$/, '') || '/').filter(p => !/^\/blog\//.test(p) && p !== '/');
} catch {
  const walk = (d, pre) => { let o = []; for (const n of fs.readdirSync(d, { withFileTypes: true })) if (n.isDirectory() && !/^[\[(_]/.test(n.name) && n.name !== 'blog' && n.name !== 'api') { const p = pre + '/' + n.name; if (fs.existsSync(path.join(d, n.name, 'page.tsx'))) o.push(p); o = o.concat(walk(path.join(d, n.name), p)); } return o; };
  try { link_options = walk(path.join(root, 'app'), ''); } catch { /* none */ }
}
process.stdout.write(JSON.stringify({ ...next, voice, recent_titles: published.slice(-40).map(t => t.title), link_options: [...new Set(link_options)].slice(0, 40), published_today: done, daily_cap: cap }, null, 2));
