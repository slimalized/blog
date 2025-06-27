import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { generateOgpImage } from "../../../components/OgpImage";
import { formatDate } from "../../../utils/formatDate";

export const getStaticPaths = async () => {
	const works = await getCollection("works");
	return works.map((work) => ({
		params: {
			id: work.id,
		},
		props: {
			title: work.data.title,
			date: work.data.publishedDate,
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
	const body = await generateOgpImage(
		props.title,
		formatDate(props.date).slice(0, 4),
	);

	return new Response(body, {
		headers: {
			"Content-Type": "image/png",
		},
		status: 200,
	});
};
