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
    return env.ASSETS.fetch(request);
  },
};
