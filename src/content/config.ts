import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
    author: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    readTime: z.number().optional(),
    image: z.string().optional(),
  }),
});

export const collections = { blog };
