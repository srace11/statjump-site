// Everything app-specific lives here. For a new app, edit this file,
// replace the images in public/, and rewrite src/policies/*.md.

export const app = {
  // Basics
  name: 'Stat Jump',
  tagline: 'Kill it with data.',
  description:
    'Stat Jump turns a phone video of your volleyball approach and jump into numbers you can train against.',

  // Full URL of this mini-site, no trailing slash. Used for SEO, the sitemap and link previews.
  url: 'https://statjump.shaneracey.com',

  // Developer / legal entity shown on the policy pages.
  developer: 'Shane Racey',
  hubUrl: 'https://shaneracey.com',

  // Support contact. This address is published on the support, privacy and terms pages.
  contactEmail: '', // Not published yet. Set it before restoring the support and terms pages.
  // Shown only on the privacy notice, for deletion requests.
  privacyEmail: 'hello@shaneracey.com',

  // Images in public/. Replace the files or point these at new ones.
  icon: '/brand/stat-jump-app-icon.svg',
  ogImage: '/og.png',

  // Brand colors. `accent` is used for buttons and highlights,
  // `accentText` for text sitting on top of the accent color.
  colors: {
    accent: '#347a1a',
    accentDark: '#9be15d',
    accentText: '#0b1b33',
  },

  // Store links. Leave a value empty ('') to hide that badge.
  stores: {
    appStore: '',
    googlePlay: '',
  },


  // Screenshots in public/screenshots/. Portrait phone shots work best (e.g. 1290x2796).
  screenshots: [] as { src: string; alt: string }[],

  faq: [
    {
      q: 'How do I delete my account and data?',
      a: 'TODO: Describe the in-app path (for example Settings > Account > Delete account), or tell people to email the address below. Both stores require this for apps with accounts.',
    },
    {
      q: 'How do I restore a purchase?',
      a: 'TODO: Describe how to restore purchases, or remove this question if the app has none.',
    },
    {
      q: 'I found a bug. How do I report it?',
      a: 'Email the address below with your device model, OS version and the steps that caused the problem. Screenshots help a lot.',
    },
  ],
} as const;

export type AppConfig = typeof app;
