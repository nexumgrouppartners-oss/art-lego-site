#!/usr/bin/env node
// Head check for the Art Lego static site. Dependency-free.
// Usage: node tools/head-check.mjs   (run from the site folder or anywhere; exits 1 on any failure)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://artlegoremodeling.com';
const GA4 = 'G-XDBTG69ST6';
const LOCAL_TYPES = ['LocalBusiness', 'HomeAndConstructionBusiness', 'GeneralContractor', 'HousePainter'];
const SKIP_DIRS = /^(\.|node_modules$|tools$|api$|assets$|_)/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.test(e.name)) walk(p, out); }
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function urlPath(file) {
  let rel = path.relative(ROOT, file).split(path.sep).join('/').replace(/\.html$/, '');
  if (rel === 'index') return '/';
  return '/' + rel.replace(/\/index$/, '');
}

function collectTypes(node, set) {
  if (Array.isArray(node)) return node.forEach(n => collectTypes(n, set));
  if (node && typeof node === 'object') {
    const t = node['@type'];
    if (t) (Array.isArray(t) ? t : [t]).forEach(x => set.add(x));
    Object.values(node).forEach(v => collectTypes(v, set));
  }
}

// Which structured data each page kind must carry.
function required(p) {
  if (p === '/' || p === '/about' || p === '/contact') return ['local'];
  if (p === '/remodeling' || p === '/painting') return ['local', 'Service', 'FAQPage'];
  if (p === '/areas') return ['local'];
  if (p.startsWith('/areas/')) return ['local', 'Service', 'FAQPage'];
  if (p === '/blog') return [];
  if (p.startsWith('/blog/')) return ['BlogPosting'];
  return [];
}

let failures = 0, pages = 0;
for (const file of walk(ROOT).sort()) {
  pages++;
  const html = fs.readFileSync(file, 'utf8');
  const p = urlPath(file);
  const errs = [];

  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
  if (!title || !title.trim()) errs.push('missing <title>');
  else if (title.length > 75) errs.push(`title too long (${title.length})`);

  const desc = (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1];
  if (!desc || !desc.trim()) errs.push('missing meta description');
  else if (desc.length > 200) errs.push(`meta description too long (${desc.length})`);

  const canon = (html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i) || [])[1];
  if (!canon) errs.push('missing canonical');
  else if (canon !== ORIGIN + (p === '/' ? '/' : p)) errs.push(`canonical ${canon} != ${ORIGIN}${p}`);

  if (!html.includes('googletagmanager.com/gtag/js?id=' + GA4) || !html.includes(`gtag('config', '${GA4}')`)) errs.push('GA4 tag missing');
  if (!/<meta\s+name="google-site-verification"\s+content="[^"]+"/i.test(html)) errs.push('GSC verification meta missing');

  const types = new Set();
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const faqSchemaQs = [];
  for (const b of blocks) {
    try {
      const j = JSON.parse(b[1]);
      collectTypes(j, types);
      if (j['@type'] === 'FAQPage') for (const q of j.mainEntity || []) faqSchemaQs.push(q.name);
    } catch (e) { errs.push('invalid JSON-LD: ' + e.message); }
  }
  for (const need of required(p)) {
    if (need === 'local') { if (!LOCAL_TYPES.some(t => types.has(t))) errs.push('LocalBusiness JSON-LD missing'); }
    else if (!types.has(need)) errs.push(need + ' JSON-LD missing');
  }
  // FAQ schema questions must be visible on the page.
  for (const q of faqSchemaQs) {
    const plain = q.replace(/&/g, '&amp;');
    if (!html.includes(q) && !html.includes(plain) && !html.includes(q.replace(/'/g, '&rsquo;')) && !html.includes(q.replace(/'/g, '&#39;'))) errs.push('FAQ question not visible on page: ' + q);
  }

  if (errs.length) { failures += errs.length; console.log('FAIL ' + p + '\n  - ' + errs.join('\n  - ')); }
  else console.log('ok   ' + p);
}
console.log(`\n${pages} pages checked, ${failures} problem(s)`);
process.exit(failures ? 1 : 0);
