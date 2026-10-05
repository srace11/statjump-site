// Serves the static site, and permanently redirects the old
// volleyball.shaneracey.com address to the same path on statjump.shaneracey.com.
const OLD_HOST = 'volleyball.shaneracey.com';
const NEW_HOST = 'statjump.shaneracey.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === OLD_HOST) {
      url.hostname = NEW_HOST;
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
