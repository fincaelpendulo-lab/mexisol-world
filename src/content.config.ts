// Blog posts: one Markdown file per post in src/content/blog/en/ or src/content/blog/es/.
// The file name is the URL: en/what-is-satori.md → /blog/what-is-satori.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '{en,es}/*.md', base: './src/content/blog' }),
  schema: z.object({
    /** Shown on the page and in search results. Keep it under about 60 characters. */
    title: z.string().max(70),
    /** The search result snippet. 120 to 160 characters. */
    description: z.string().min(80).max(170),
    /** Publication date, YYYY-MM-DD. Posts dated in the future are not built. */
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** A photo from src/assets/photos, by file name without .jpg. */
    image: z.string(),
    imageAlt: z.string(),
    /** One of the images in public/og (home, finca, ayahuasca, psilocybin, prepare, medical, about...). */
    ogImage: z.string().default('home'),
    tags: z.array(z.string()).default([]),
    author: z.string().default('MexiSol World'),
    /** The file name of the same post in the other language, if there is one. */
    translation: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
