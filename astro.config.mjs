// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { headingAnchor } from "./src/utils/remark/headingAnchor";
import { linkCard } from "./src/utils/remark/linkCard";
import { twitterQuote } from "./src/utils/remark/twitterQuote";
import { codeBlock } from "./src/utils/remark/codeBlock";

// https://astro.build/config
export default defineConfig({
	site: "https://slimalized.dev",
	integrations: [mdx(), react()],
	markdown: {
		remarkPlugins: [headingAnchor, linkCard, twitterQuote, codeBlock],
		shikiConfig: {
			themes: {
				light: "github-light",
				dark: "github-dark",
			},
		},
	},
});
