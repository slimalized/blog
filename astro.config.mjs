// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { headingAnchor } from "./src/utils/remark/headingAnchor";
import { linkCard } from "./src/utils/remark/linkCard";


// https://astro.build/config
export default defineConfig({
	site: "https://slimalized.dev",
	integrations: [mdx(), react()],
	markdown: {
		remarkPlugins: [headingAnchor, linkCard],
		shikiConfig: {
			themes: {
				light: "github-light",
				dark: "github-dark",
			},
		},
	},
});
