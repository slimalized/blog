import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { generateOgpImage } from "../../../components/OgpImage";

export const getStaticPaths = async () => {
	const posts = await getCollection("posts");
	return posts.map((post) => ({
		params: {
			id: post.id,
		},
		props: {
			title: post.data.title,
			date: post.data.publishedDate,
		},
	}));
};

export const GET: APIRoute = async ({ params, props }) => {
	if (!params.id) {
		return new Response(
			JSON.stringify({
				error: "Post ID is required.",
			}),
			{ status: 400 },
		);
	}
	const body = await generateOgpImage(props.title, props.date);

	return new Response(body, {
		headers: {
			"Content-Type": "image/png",
		},
		status: 200,
	});
};
