// Everything app-specific lives here. For a new app, edit this file,
// replace the images in public/, and rewrite src/policies/*.md.

export const app = {
  // Basics
  name: 'Stat Jump',
  tagline: 'Jump higher, hit harder',
  description:
    'Stat Jump turns a phone video of your volleyball approach and jump into numbers you can train against.',

  // Full URL of this mini-site, no trailing slash. Used for SEO, the sitemap and link previews.
  url: 'https://statjump.app',

  // Developer / legal entity shown on the policy pages.
  developer: 'Shane Racey',
  hubUrl: 'https://shaneracey.com',

  // Support contact. This address is published on the support, privacy and terms pages.
  contactEmail: 'hello@statjump.app',
  // Shown on the privacy notice (deletion requests) and in the About section. Forwards to Gmail via Cloudflare Email Routing.
  privacyEmail: 'hello@statjump.app',

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
      q: 'How should I film my jump?',
      a: 'Film from the side, 10 to 15 ft (3 to 4.5 m) away, with the phone at hip height on a tripod or held still. Keep it level, record at 60 fps or higher at normal speed (not slow motion), and stand still for a second before your approach. Keep your whole approach and landing in frame, one jump per video, under 20 seconds, with nobody crossing the shot.',
    },
    {
      q: 'My jump height looks wrong. What can I check?',
      a: 'First check your height and standing reach in your profile, since every number is scaled from them. Then check the filming setup above: side-on, level, still, 60 fps, and a second of standing still at the start. Results are estimates, and a 30 fps clip or someone crossing the frame makes them less precise. If it still looks off, email us using the address below.',
    },
    {
      q: 'Are my videos uploaded?',
      a: 'No. Stat Jump analyzes your video on your phone, and your videos, results and profile stay there. There are no accounts. See the Privacy Policy for details.',
    },
    {
      q: 'How do I delete my data?',
      a: 'In the app, go to Profile > Settings > Delete all my data. That erases your profile, results and stored clips from your phone. Deleting the app does the same. We hold no copy, so there is nothing to delete on our side. Videos in your photo library stay there until you delete them.',
    },
    {
      q: 'What do I get for free, and what does Stat Jump Pro add?',
      a: 'Free gives you unlimited analyses with your touch height, vertical, hit speed, overall score and hang time, plus your history, personal bests, drills and a share video. Your first analysis is fully unlocked. Stat Jump Pro, monthly or yearly, adds strengths and fixes, the full breakdown on every jump, progress trends, and the overall score and score bars on your share video.',
    },
    {
      q: 'How do I restore a purchase?',
      a: 'Go to Profile > Settings > Restore purchases, or tap Restore purchases on the plans screen. Make sure you are signed in to the same Apple ID or Google account you subscribed with.',
    },
    {
      q: 'How do I cancel or get a refund?',
      a: 'Apple and Google handle billing. Cancel in your Apple ID or Google Play subscription settings. Deleting the app does not cancel your subscription. After cancelling you keep Pro until the end of the period you paid for. Refunds are handled by Apple or Google under their policies, so request one from them.',
    },
    {
      q: 'I found a bug. How do I report it?',
      a: 'Email the address below with your device model, OS version and the steps that caused the problem. Screenshots help a lot.',
    },
  ],
} as const;

export type AppConfig = typeof app;
