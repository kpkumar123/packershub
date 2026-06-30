// PackersHub v10.1 — Astro 7.0.3 config
// Tailwind v3 + @astrojs/tailwind replaced with Tailwind v4 + the official
// @tailwindcss/vite plugin (the @astrojs/tailwind integration is deprecated
// upstream and only kept around for Tailwind v3 projects).

import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://www.packershub.in',
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
    // platformProxy: { enabled: true },
  }),
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date(),
      filter: (page) =>
        !page.includes('/admin') && !page.includes('/api/'),
    }),
    mdx(),
  ],
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
    assets: '_assets',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
    remotePatterns: [{ protocol: 'https' }],
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: true,
    },
  },
});
