import { JSDOM } from "jsdom";
import type { Blockquote, Link, Paragraph, Root } from "mdast";
import type { Plugin } from "unified";
import type { Parent } from "unist";
import { type Visitor, visit } from "unist-util-visit";
import { isSingleLinkParagraph, isValidUrl } from "./linkCard";

type Transformer = () => Promise<void>;

interface TweetData {
	tweetUrlString: string;
	authorName: string;
	authorUrlString: string;
	html: string;
	postedDateString: string;
	referencedDateString: string;
}

interface TweetOEmbedResponse {
	url: string;
	author_name: string;
	author_url: string;
	html: string;
	width: number | null;
	height: number | null;
	type: string;
	cache_age: string;
	provider_name: "Twitter";
	provider_url: "https://twitter.com";
	version: "1.0";
}

export interface BlockquoteProps extends TweetData {
	type?: "twitterQuote";
}

export const isTwitterUrl = (urlString: string) => {
	if (!isValidUrl(urlString)) {
		return false;
	}
	const url = new URL(urlString);
	return url.hostname === "twitter.com" || url.hostname === "x.com";
};

/**
 * Check if the urlString is a tweet (not just a Twitter URL, but specifically a tweet).
 */
const isTweet = (urlString: string) => {
	if (!isTwitterUrl(urlString)) {
		return false;
	}
	const tweetRegex = /^\/[a-zA-Z0-9_]+\/status\/[0-9]+$/; // `/{string}/status/{number}`
	return tweetRegex.test(new URL(urlString).pathname);
};

/**
 *
 *
 * @param _html - _html is as follows:
 * ```
 * '<blockquote class="twitter-tweet" ...>
 *  	<p ...>{tweet contents}</p>
 * 		&mdash; {user name} (@{user id})
 * 		<a href="https://twitter.com/{user id}/status/{tweet id}?...">{posted date info. e.g. April 1, 2025}</a>
 * </blockquote>\n' +
 * '<script async src="https://platform.twitter.com/widgets.js" ...></script>\n' +
 * '\n',
 * ```
 * @param tweetUrlString - `https://twitter.com/{user id}/status/{tweet id}`
 */
const extractTwitterQuote = (_html: string, tweetUrlString: string) => {
	// 1. Remove script of widget.js and emulate DOM.
	const dom = new JSDOM(_html.split("\n")[0]);
	const { document } = dom.window;

	let postedDate: Date | undefined = undefined;
	const aTags = document.getElementsByTagName("a");
	for (const aTag of aTags) {
		// 2. Set attributes to open a link as an external link.
		aTag.setAttribute("target", "_blank");
		aTag.setAttribute("rel", "noopener noreferrer nofollow");

		const href = aTag.getAttribute("href") || "";
		if (!isValidUrl(href)) continue;

		// 3. Get the posted date from <a> tag at the end and delete the <a> tag".
		const hrefPath = new URL(href).pathname;
		const tweetPath = new URL(tweetUrlString).pathname;
		if (hrefPath === tweetPath && aTag.textContent) {
			postedDate = new Date(aTag.textContent);
			aTag.parentNode?.removeChild(aTag);
		}
	}
	// 4. Remove the username display, which is the sibling node of the <p> tag.
	const userNameText = document.getElementsByTagName("p")[0].nextSibling;
	if (userNameText && userNameText.nodeType === dom.window.Node.TEXT_NODE) {
		userNameText.parentNode?.removeChild(userNameText);
	}
	// 5. Convert dom to a string and extract only the inside of the blockquote.
	const htmlRegex =
		/^<html><head><\/head><body><blockquote class="twitter-tweet" data-cards="hidden">([\s\S]*?)<\/blockquote><\/body><\/html>$/;
	const html = dom.serialize().match(htmlRegex)?.[1];

	return { html, postedDate };
};

const getTweetData = async (tweet: URL) => {
	const oEmbedUrl = new URL(
		`https://publish.twitter.com/oembed?url=${tweet}&hide_media=true&hide_thread=true`,
	);
	const response = await fetch(oEmbedUrl, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});
	if (!response.ok) {
		return undefined;
	}
	const result = (await response.json()) as TweetOEmbedResponse;
	const { html, postedDate } = extractTwitterQuote(result.html, result.url);
	if (html === undefined || postedDate === undefined) {
		return undefined;
	}
	return {
		tweetUrlString: result.url,
		authorName: result.author_name,
		authorUrlString: result.author_url,
		html,
		postedDateString: postedDate.toString(),
		referencedDateString: new Date().toString(),
	} satisfies TweetData;
};

export const twitterQuote: Plugin<[], Root> = () => {
	return async (tree: Root) => {
		const transformers: Transformer[] = [];

		const addTransformer = (url: URL, index: number, parent: Parent) => {
			transformers.push(async () => {
				const tweetData = await getTweetData(url);
				if (tweetData === undefined) return;
				parent.children.splice(index, 1, createTweetQuoteNode(tweetData));
			});
		};

		const visitor: Visitor<Paragraph> = (node, index, parent) => {
			if (
				!isSingleLinkParagraph(node, parent) ||
				index === undefined ||
				parent === undefined
			) {
				return;
			}

			const urlString = (node.children[0] as Link).url;
			if (isTweet(urlString)) {
				addTransformer(new URL(urlString), index, parent);
			}
		};

		visit(tree, "paragraph", visitor);

		const results = await Promise.allSettled(transformers.map((t) => t()));
		for (const [index, result] of results.entries()) {
			if (result.status === "rejected") {
				console.error(
					`[twitterQuote] Failed to transform tweet at index ${index}`,
					result.reason,
				);
			}
		}
	};
};

const createTweetQuoteNode = (data: TweetData) => {
	return {
		type: "blockquote",
		data: {
			hProperties: {
				type: "twitterQuote",
				...data,
			} satisfies BlockquoteProps,
		},
		children: [],
	} satisfies Blockquote;
};
