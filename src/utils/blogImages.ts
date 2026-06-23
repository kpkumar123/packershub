import type { ImageMetadata } from 'astro';

// Blog post frontmatter stores images as plain string paths
// (e.g. "/blog/foo.jpg") for portability with the CMS / OG-tag usage.
// To get Astro's build-time image optimization (WebP/AVIF output,
// responsive sizing, lazy loading) we resolve that string to the
// matching imported asset under src/assets/blog/.
const blogImages = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/blog/*.{jpg,jpeg,png,webp}',
  { eager: true }
);

export function resolveBlogImage(path: string | undefined): ImageMetadata | undefined {
  if (!path) return undefined;
  const filename = path.split('/').pop();
  const match = Object.entries(blogImages).find(([key]) => key.endsWith(`/${filename}`));
  return match ? match[1].default : undefined;
}
