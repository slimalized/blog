import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
	if (!context.site) {
		throw new Error("Site is required.");
	}

	const publicPosts = (await getCollection("posts"))
		.filter((post) => post.data.hide !== true)
		.sort(
			(a, b) =>
				new Date(b.data.publishedDate).getTime() -
				new Date(a.data.publishedDate).getTime(),
		);

	return rss({
		trailingSlash: false,
		title: "書いたもの / RSS フィード",
		description: "slimalizedが書いたもののRSSフィードです。",
		site: context.site,
		items: publicPosts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.publishedDate,
			link: `/posts/${post.id}`,
		})),
	});
};
