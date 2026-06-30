// PackersHub v10 — Astro 7.0.3 content config
// Uses z from 'astro:content' (Astro 7 canonical re-export of Zod)
// Inline loaders map slug->id since Astro's file() loader requires an `id` field
// and our JSON uses `slug` as primary key.

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import citiesData from './data/cities.json';
import statesData from './data/states.json';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title:       z.string(),
    description: z.string(),
    pubDate:     z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author:      z.string().default('PackersHub Team'),
    category:    z.string().default('Tips'),
    tags:        z.array(z.string()).default([]),
    featured:    z.boolean().default(false),
    readTime:    z.number().default(5),
    // v10.6.6 — image() ties this into Astro's built-in image optimizer
    // (astro:assets), so blog images get real resizing/format conversion
    // instead of being served as unoptimized static files from public/.
    image:       image().optional(),
  }),
});

// Inline loaders validate city + state JSON at build time.
// Direct `import cities from '../data/cities.json'` in pages still works —
// these collections are a safety net only (build fails loudly on bad data).
const cities = defineCollection({
  loader: () =>
    (citiesData as Array<Record<string, unknown>>).map((c) => ({
      id: String(c.slug),
      ...c,
    })),
  schema: z.object({
    slug:          z.string(),
    name:          z.string(),
    state:         z.string(),
    stateName:     z.string(),
    pop:           z.string(),
    landmark:      z.string(),
    lat:           z.number().optional(),
    lng:           z.number().optional(),
    content_intro: z.string().min(1),
    popular_routes: z.array(z.string()).default([]),
    faq_text:      z.string().optional(),
  }),
});

const states = defineCollection({
  loader: () =>
    (statesData as Array<Record<string, unknown>>).map((s) => ({
      id: String(s.slug),
      ...s,
    })),
  schema: z.object({
    slug:         z.string(),
    name:         z.string(),
    abbr:         z.string(),
    flag:         z.string().optional(),
    tagline:      z.string().optional(),
    hero:         z.string().optional(),
    description:  z.string(),
    keywords:     z.array(z.string()).default([]),
    content_intro: z.string().optional(),
  }),
});

export const collections = { blog, cities, states };
