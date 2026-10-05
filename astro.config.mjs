import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { app } from './src/app.config.ts';

export default defineConfig({
  site: app.url,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap()],
});
