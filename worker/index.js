// Serves the static site, and permanently redirects the old
// volleyball.shaneracey.com address to the same path on statjump.shaneracey.com.
// Also turns short links like /tiktok into the home page tagged with that source,
// so links in bios and videos stay short but signups still record where they came from.
const OLD_HOST = 'volleyball.shaneracey.com';
const NEW_HOST = 'statjump.shaneracey.com';

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
    if (url.hostname === OLD_HOST) {
      url.hostname = NEW_HOST;
      return Response.redirect(url.toString(), 301);
    }
    const source = SHORT_LINKS[url.pathname.replace(/^\/|\/$/g, '').toLowerCase()];
    if (source) {
      // 302, not 301: browsers don't cache it, so a label can be changed later.
      return Response.redirect(`https://${NEW_HOST}/?utm_source=${source}`, 302);
    }
    if (url.pathname.endsWith('.mp4')) {
      // Ask for the whole file (the binding mishandles Range) and slice it below.
      const plain = new Headers(request.headers);
      plain.delete('Range');
      plain.delete('If-Range');
      return withRanges(request, await env.ASSETS.fetch(new Request(request, { headers: plain })));
    }
    return env.ASSETS.fetch(request);
  },
};

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
