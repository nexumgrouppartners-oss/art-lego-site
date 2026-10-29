import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const [slug, err] = process.argv.slice(2);
const topics = JSON.parse(fs.readFileSync(path.join(dir, 'topics.json'), 'utf8'));
const t = topics.find(x => x.slug === slug); if (!t) { console.error('no topic ' + slug); process.exit(1); }
t.status = 'parked'; t.last_error = err || 'parked'; t.attempts = (t.attempts || 0) + 1;
fs.writeFileSync(path.join(dir, 'topics.json'), JSON.stringify(topics, null, 1));
const logp = path.join(dir, 'publish-log.json'); const log = fs.existsSync(logp) ? JSON.parse(fs.readFileSync(logp, 'utf8')) : [];
log.push({ at: new Date().toISOString(), slug, status: 'parked', error: t.last_error });
fs.writeFileSync(logp, JSON.stringify(log, null, 1));
console.log('parked ' + slug);
