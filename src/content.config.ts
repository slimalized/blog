import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
	loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		publishedDate: z.date(),
		thumbnail: z.string().optional(),
		hide: z.literal(true).optional(),
	}),
});

export const worksTypes = ["tech", "design"] as const;

const works = defineCollection({
	loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/works" }),
	schema: z.object({
		title: z.string(),
		publishedDate: z.date(),
		thumbnail: z.string().optional(),
		type: z.enum(worksTypes),
		hide: z.literal(true).optional(),
	}),
});

export const collections = { posts, works };
