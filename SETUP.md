# App site template: setup guide

This repo is the mini-site for one app, served at `appname.shaneracey.com`. It has four pages:

| Page | URL | Used for |
| --- | --- | --- |
| Landing | `https://appname.shaneracey.com/` | Marketing URL |
| Privacy | `https://appname.shaneracey.com/privacy` | Privacy Policy URL (App Store Connect and Google Play) |
| Terms | `https://appname.shaneracey.com/terms` | Terms of Use / EULA link |
| Support | `https://appname.shaneracey.com/support` | Support URL (App Store Connect) |

## Files you edit per app

| File | What to change |
| --- | --- |
| `src/app.config.ts` | Name, tagline, URL, colors, contact email, store links, features, screenshots, FAQ |
| `src/policies/privacy.md` | The privacy policy. Replace every `TODO` truthfully. |
| `src/policies/terms.md` | The terms. Replace every `TODO`. |
| `public/icon.svg` | App icon (SVG or PNG; update `icon` in the config if you change the file name) |
| `public/screenshots/` | Phone screenshots (update `screenshots` in the config) |
| `public/og.png` | Link preview image. Regenerate with `npm run og` after editing the config. |

The privacy and terms pages show a yellow "Draft" banner as long as the markdown file still contains the word `TODO`. Do not submit an app while that banner is visible.

> **The policy text is a starting template, not legal advice.** Before every launch, check the privacy policy against what the app really collects: every SDK (analytics, crash reporting, ads, auth, payments), every permission, and every server call. It must match your App Store "App Privacy" answers and your Google Play "Data safety" form.

## Run it locally

Requires Node 22.12 or newer.

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs to dist/
npm run preview   # serves dist/ locally
```

## Deploy to Cloudflare Pages (first time for a new app)

1. Push the repo to GitHub (see the launch checklist below for creating it).
2. In the Cloudflare dashboard go to **Workers & Pages > Create > Pages > Connect to Git**.
3. Authorize GitHub if asked, then pick the app's repo.
4. Build settings:
   - **Project name:** the app's slug, for example `sampleapp`. This becomes `sampleapp.pages.dev`.
   - **Production branch:** `main`
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variables:** add `NODE_VERSION` = `22`
5. Click **Save and Deploy**. After about a minute the site is live at `https://<project>.pages.dev`. Check it there before adding the domain.

Every push to `main` redeploys automatically. Pushes to other branches get their own preview URLs.

## Add the subdomain (appname.shaneracey.com)

shaneracey.com's DNS is hosted on Cloudflare (nameservers `aspen` and `rocky`), in the same account as the Pages project, so Cloudflare can create the DNS record for you.

**Do it in this order.** If you only create the CNAME without step 1, the subdomain returns a 522 error, because the Pages project does not yet know to answer for that hostname.

1. Open the Pages project > **Custom domains > Set up a custom domain**.
2. Enter `appname.shaneracey.com` and click **Continue**.
3. Cloudflare shows the record it will create:

   | Type | Name | Target | Proxy |
   | --- | --- | --- | --- |
   | CNAME | `appname` | `<project>.pages.dev` | Proxied (orange cloud) |

   Click **Activate domain**. Cloudflare adds the CNAME to the shaneracey.com zone.
4. Wait for the status to show **Active** (usually 1 to 5 minutes; it issues the HTTPS certificate in this time).
5. Visit `https://appname.shaneracey.com/privacy` and `/support` to confirm.

**If the subdomain already has a DNS record** (for example you created one earlier by hand), go to **DNS > Records** for shaneracey.com. Either delete the old record and repeat the steps above, or edit it to exactly match the table (CNAME, name `appname`, target `<project>.pages.dev`, proxied). Then retry step 1.

**If the status stays "Pending"** for more than 15 minutes, check that there is exactly one record for `appname` in **DNS > Records**, that it is proxied, and that no Worker route in **Workers Routes** matches `appname.shaneracey.com/*`.

## Launch checklist for a new app

- [ ] **Copy the template.** On GitHub, open `srace11/app-site-template`, click **Use this template > Create a new repository** and name it `appname-site`. Clone it. (Or from the CLI: `gh repo create appname-site --template srace11/app-site-template --public --clone`.)
- [ ] **Edit `src/app.config.ts`:** name, tagline, description, `url` (`https://appname.shaneracey.com`), colors, contact email, features, FAQ. Leave the store links empty until the app is approved.
- [ ] **Replace the images:** `public/icon.svg`, the screenshots, then run `npm run og` to rebuild the link preview image.
- [ ] **Write the privacy policy** in `src/policies/privacy.md`. List every data type, SDK and permission truthfully, fill in the deletion instructions and set `effectiveDate`. No `TODO` left.
- [ ] **Write the terms** in `src/policies/terms.md`. Fill in subscriptions (if any), governing law and `effectiveDate`. No `TODO` left.
- [ ] **Answer the support FAQ** (account deletion, purchases) in the config.
- [ ] **Build locally:** `npm run build` finishes with no errors and `npm run preview` shows no Draft banner.
- [ ] **Commit and push** to `main`.
- [ ] **Deploy** a new Cloudflare Pages project from the repo (steps above).
- [ ] **Add the subdomain** `appname.shaneracey.com` (steps above) and confirm it is Active.
- [ ] **App Store Connect:**
  - App Information > **Privacy Policy URL**: `https://appname.shaneracey.com/privacy`
  - Version page > **Support URL**: `https://appname.shaneracey.com/support`
  - Version page > **Marketing URL** (optional): `https://appname.shaneracey.com`
  - If you use custom terms instead of Apple's standard EULA, link `https://appname.shaneracey.com/terms` in App Information > License Agreement, or in the app description for subscriptions.
  - App Privacy answers match `privacy.md`.
- [ ] **Google Play Console:**
  - Policy and programs > App content > **Privacy policy**: `https://appname.shaneracey.com/privacy`
  - Store presence > Store settings > **Website**: `https://appname.shaneracey.com` and **Email**: the contact email
  - **Data safety** form matches `privacy.md`.
  - If the app has accounts, fill in the **account deletion URL** (the support page, which explains how to delete).
- [ ] **After approval:** paste the store links into `stores` in the config, push, and add the app to the hub (`shaneracey-hub/src/data/apps.json`).

## Store badges

The badges are simple text buttons, so they work without extra assets. If you want the official artwork, download it from Apple's App Store marketing guidelines and Google Play's badge generator, put the files in `public/`, and swap them into `src/components/StoreBadges.astro`.
