// Everything app-specific lives here. For a new app, edit this file,
// replace the images in public/, and rewrite src/policies/*.md.

export const app = {
  // Basics
  name: 'Volleyball Jump Mechanics',
  tagline: 'Film your approach and jump, then see exactly where you can gain height at the net.',
  description:
    'Record your volleyball approach and jump on your phone and get feedback on the mechanics that add height. Placeholder page.',

  // Full URL of this mini-site, no trailing slash. Used for SEO, the sitemap and link previews.
  url: 'https://volleyball.shaneracey.com',

  // Developer / legal entity shown on the policy pages.
  developer: 'Shane Racey',
  hubUrl: 'https://shaneracey.com',

  // Support contact. This address is published on the support, privacy and terms pages.
  contactEmail: 'support@shaneracey.com',

  // Images in public/. Replace the files or point these at new ones.
  icon: '/icon.svg',
  ogImage: '/og.png',

  // Brand colors. `accent` is used for buttons and highlights,
  // `accentText` for text sitting on top of the accent color.
  colors: {
    accent: '#1d4ed8',
    accentDark: '#60a5fa',
    accentText: '#ffffff',
  },

  // Store links. Leave a value empty ('') to hide that badge.
  stores: {
    appStore: '',
    googlePlay: '',
  },

  features: [
    { icon: '🎥', title: 'Film it', body: 'Record your approach and jump with just your phone. Placeholder text.' },
    { icon: '📐', title: 'See the mechanics', body: 'Approach speed, plant angles, arm swing and jump height, rep by rep. Placeholder text.' },
    { icon: '📈', title: 'Jump higher', body: 'Get one clear fix to work on and track your progress over time. Placeholder text.' },
  ],

  // Screenshots in public/screenshots/. Portrait phone shots work best (e.g. 1290x2796).
  screenshots: [
    { src: '/screenshots/1.svg', alt: 'Home screen' },
    { src: '/screenshots/2.svg', alt: 'Detail screen' },
    { src: '/screenshots/3.svg', alt: 'Settings screen' },
  ],

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
