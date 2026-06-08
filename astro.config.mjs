import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://www.packershub.in',
  integrations: [
    tailwind(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      customPages: [
        'https://www.packershub.in/',
        'https://www.packershub.in/about',
        'https://www.packershub.in/services',
        'https://www.packershub.in/contact',
        'https://www.packershub.in/blog',
      ],
    }),
    mdx(),
  ],
  build: { format: 'file', inlineStylesheets: 'auto' },
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  },
});
