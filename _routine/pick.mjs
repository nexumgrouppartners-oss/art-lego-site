import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const topics = JSON.parse(fs.readFileSync(path.join(dir, 'topics.json'), 'utf8'));
const voice = JSON.parse(fs.readFileSync(path.join(dir, 'voice.json'), 'utf8'));
const next = topics.filter(t => t.status === 'pending').sort((a, b) => a.priority - b.priority)[0];
const recent = topics.filter(t => t.status === 'published').map(t => t.title);
process.stdout.write(JSON.stringify(next ? { ...next, voice, recent_titles: recent } : {}, null, 2));
