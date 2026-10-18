// Serves the static site at statjump.app. Every other address attached to this Worker (www and the old
// statjump.shaneracey.com and volleyball.shaneracey.com subdomains) permanently redirects to the same path
// and query on statjump.app, so links already posted keep working.
// Also turns short links like /tiktok into the home page tagged with that source,
// so links in bios and videos stay short but signups still record where they came from.
// On the waitlist page, the email box starts unticked for visitors where GDPR or UK GDPR applies (see below).
const HOST = 'statjump.app';

// EU 27, the rest of the EEA (Iceland, Liechtenstein, Norway) and the UK, as Cloudflare country codes.
// A pre-ticked box isn't valid consent there, so the box starts unticked for these visitors.
const OPT_IN_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU',
  'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO',
  'GB',
]);

// Short path -> utm_source. Keep labels lowercase; they show in the waitlist export as-is.
const SHORT_LINKS = {
  reddit: 'reddit',
  ig: 'instagram',
  instagram: 'instagram',
  tiktok: 'tiktok',
  tt: 'tiktok',
  yt: 'youtube',
  youtube: 'youtube',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== HOST || url.protocol !== 'https:') {
      url.hostname = HOST;
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    const source = SHORT_LINKS[url.pathname.replace(/^\/|\/$/g, '').toLowerCase()];
    if (source) {
      // 302, not 301: browsers don't cache it, so a label can be changed later.
      return Response.redirect(`https://${HOST}/?utm_source=${source}`, 302);
    }
    if (url.pathname.endsWith('.mp4')) {
      // Ask for the whole file (the binding mishandles Range) and slice it below.
      const plain = new Headers(request.headers);
      plain.delete('Range');
      plain.delete('If-Range');
      return withRanges(request, await env.ASSETS.fetch(new Request(request, { headers: plain })));
    }
    if (/^\/waitlist(\.html)?\/?$/.test(url.pathname)) {
      // GEO_OVERRIDE is for local testing only (wrangler dev --var GEO_OVERRIDE:DE); it's never set in production.
      const country = env.GEO_OVERRIDE || request.cf?.country || '';
      return waitlistPage(request, env, OPT_IN_COUNTRIES.has(country));
    }
    return env.ASSETS.fetch(request);
  },
};

// The waitlist page differs by visitor country, so it's never served from a browser cache validated for
// someone else: conditional headers are dropped and the response is marked private and uncached.
async function waitlistPage(request, env, optIn) {
  const plain = new Headers(request.headers);
  plain.delete('If-None-Match');
  plain.delete('If-Modified-Since');
  const res = await env.ASSETS.fetch(new Request(request, { headers: plain }));
  if (res.status !== 200) return res;
  const headers = new Headers(res.headers);
  headers.set('Cache-Control', 'private, no-cache');
  headers.delete('ETag');
  const page = new Response(res.body, { status: 200, headers });
  if (!optIn) return page;
  return new HTMLRewriter().on('input#wl-consent', { element: (el) => el.removeAttribute('checked') }).transform(page);
}

// iPhone Safari only plays video from a server that answers byte-range requests with 206 Partial
// Content. The assets binding returns the whole file with 200, so slice it here. Videos are a few MB.
async function withRanges(request, res) {
  if (res.status !== 200) return res;
  const headers = new Headers(res.headers);
  headers.set('Accept-Ranges', 'bytes');
  const range = request.headers.get('Range');
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!m || (m[1] === '' && m[2] === '')) return new Response(res.body, { status: 200, headers });

  const body = await res.arrayBuffer();
  const size = body.byteLength;
  // "bytes=500-" is from 500 to the end; "bytes=-500" is the last 500 bytes.
  const start = m[1] === '' ? Math.max(size - Number(m[2]), 0) : Number(m[1]);
  const end = m[1] === '' || m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  if (start >= size || start > end) {
    headers.set('Content-Range', `bytes */${size}`);
    headers.delete('Content-Length');
    return new Response(null, { status: 416, headers });
  }
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(body.slice(start, end + 1), { status: 206, headers });
}
