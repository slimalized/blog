import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
	loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		publishedDate: z.date(),
		hide: z.literal(true).optional(),
	}),
});

export const collections = { posts };
