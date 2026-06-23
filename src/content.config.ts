import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const cities = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cities' }),
  schema: z.object({
    title: z.string(),
    city: z.string(),
    state: z.string(),
    stateSlug: z.string(),
    slug: z.string(),
    description: z.string(),
    lat: z.number(),
    lng: z.number(),
    rank: z.number(),
    tagline: z.string().optional(),
    phone: z.string().default('+91 77310 74075'),
    whatsapp: z.string().default('917731074075'),
  })
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('PackersHub Team'),
    category: z.string().default('Tips'),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    readTime: z.number().default(5),
    image: z.string().optional(),
  })
});

export const collections = { cities, blog };
