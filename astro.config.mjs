// @ts-check

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { fontOptimizer } from "./src/integrations/fontOptimizer";
import { codeBlock } from "./src/utils/remark/codeBlock";
import { details } from "./src/utils/remark/details";
import { headingAnchor } from "./src/utils/remark/headingAnchor";
import { linkCard } from "./src/utils/remark/linkCard";
import { twitterQuote } from "./src/utils/remark/twitterQuote";
import { video } from "./src/utils/remark/video";

// https://astro.build/config
export default defineConfig({
	site:
		process.env.NODE_ENV === "development"
			? "http://localhost:4321"
			: "https://slimalized.dev",
	integrations: [mdx(), react(), fontOptimizer(), sitemap()],
	markdown: {
		// "details" changes the structure of the tree, so call it first.
		remarkPlugins: [
			details,
			headingAnchor,
			linkCard,
			twitterQuote,
			codeBlock,
			video,
		],
		remarkRehype: {
			clobberPrefix: "",
			footnoteLabel: "脚注",
		},
	},
});
