// Summit Rank crawler logger (SOP-SUMMIT-RANK 4b). Vercel Routing Middleware: runs before the static files,
// never blocks and never changes the response. Only bot user agents trigger one background POST to the brain.
// Master copy: Desktop\Summit\Ops\summit-rank\middleware.js (same file in every site repo root).
const BOT = /GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-User|Claude-SearchBot|anthropic-ai|Perplexity|DuckAssistBot|MistralAI-User|meta-external|Amazonbot|Bytespider|CCBot|cohere-ai|YouBot|Diffbot|GoogleOther|Google-CloudVertexBot|Googlebot|bingbot|Applebot|DuckDuckBot/i;

export const config = {
  matcher: '/((?!_astro/|_vercel/|.*\\.(?:png|jpe?g|webp|avif|gif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|mp4|webm|mp3|pdf)$).*)',
};

export default function middleware(request, context) {
  try {
    const ua = request.headers.get('user-agent') || '';
    const key = typeof process !== 'undefined' && process.env ? process.env.AI_HIT_KEY : '';
    if (!key || !BOT.test(ua)) return;
    const u = new URL(request.url);
    const p = fetch('https://pfkhlsmwiohzamjjqdtm.supabase.co/functions/v1/ai-hit', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hit-key': key },
      body: JSON.stringify({ host: u.host, path: u.pathname, ua, ip: request.headers.get('x-real-ip') }),
    }).catch(() => {});
    if (context && typeof context.waitUntil === 'function') context.waitUntil(p);
    else return p.then(() => undefined); // ponytail: no waitUntil -> bots wait ~100 ms for the log, humans never do
  } catch {
    return; // logging must never break the site
  }
}
