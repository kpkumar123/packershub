import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://www.packershub.in',
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => 
        !page.endsWith('/404') && 
        !page.endsWith('/404/') && 
        !page.endsWith('/privacy') && 
        !page.endsWith('/privacy/') && 
        !page.endsWith('/terms') && 
        !page.endsWith('/terms/'),
      serialize(item) {
        const url = new URL(item.url);
        const path = url.pathname;

        if (path === '/' || path === '') {
          item.changefreq = 'daily';
          item.priority = 1.0;
        } else if (path.match(/^\/(about|services|contact|blog)\/?$/)) {
          item.changefreq = 'weekly';
          item.priority = 0.9;
        } else if (path.startsWith('/blog/')) {
          item.changefreq = 'monthly';
          item.priority = 0.7;
        } else {
          // Dynamic city pages and others
          item.changefreq = 'weekly';
          item.priority = 0.8;
        }
        item.lastmod = new Date().toISOString();
        return item;
      },
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
