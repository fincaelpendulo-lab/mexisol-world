import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// BASE_PATH is "/mexisol-world" while the site is served from GitHub Pages'
// project URL, and "/" once mexisol.world is connected.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site: 'https://mexisol.world',
  base,
  trailingSlash: 'never',
  build: {
    format: 'file',
    inlineStylesheets: 'always',
  },
  integrations: [
    sitemap({
      filter: (page) => !/\/404$/.test(page),
    }),
  ],
  image: {
    responsiveStyles: false,
  },
});
