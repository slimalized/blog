import type { Link, Paragraph, Root } from "mdast";
import ogs from "open-graph-scraper";
import type { ErrorResult } from "open-graph-scraper/types";
import type { Plugin } from "unified";
import type { Parent } from "unist";
import { type Visitor, visit } from "unist-util-visit";
import { isTwitterUrl } from "./twitterQuote";

type Transformer = () => Promise<void>;

interface OgData {
	title: string;
	hostname: string;
	faviconUrlString?: string;
	description?: string;
}

export interface LinkProps extends OgData {
	type?: "linkCard";
	href: string;
	id?: string;
}

export const isValidUrl = (urlString: string) => {
	return URL.canParse(urlString);
};

const getOpenGraph = async (url: URL) => {
	try {
		const ogResponse = await ogs({ url: url.toString() });
		return ogResponse.result;
	} catch (error) {
		console.error(
			"[getOpenGraph] Failed to get Open Graph: ",
			(error as ErrorResult).result?.error,
		);
		return undefined;
	}
};

/**
 * faviconURLは以下の3パターン：
 * - 絶対パス：e.g. "https://github.githubassets.com/favicons/favicon.svg"
 * - 相対パス：e.g. "/favicon.svg"
 * - undefined
 *
 * 相対パスの場合は絶対パスに変換。undefinedの場合は`https://www.google.com/s2/favicons?domain=${url}`の形に変換する
 */
const resolveFaviconUrl = async (_faviconUrl: string | undefined, url: URL) => {
	const isRelativePath = _faviconUrl && !isValidUrl(_faviconUrl);
	let faviconUrl = isRelativePath
		? new URL(_faviconUrl, url.origin).toString()
		: _faviconUrl;
	if (faviconUrl === undefined) {
		faviconUrl = `https://www.google.com/s2/favicons?domain=${url}`;

		const response = await fetch(faviconUrl, {
			method: "HEAD",
			signal: AbortSignal.timeout(10000),
		});
		if (!response.ok) {
			return undefined;
		}
	}
	return faviconUrl;
};

const getLinkCardData = async (url: URL) => {
	const ogObject = await getOpenGraph(url);
	if (ogObject === undefined) return;
	return {
		title: ogObject.ogTitle || url.hostname,
		hostname: new URL(url).hostname,
		faviconUrlString: await resolveFaviconUrl(ogObject.favicon, url),
		description: ogObject.ogDescription,
	} satisfies OgData;
};

export const isSingleLinkParagraph = (
	node: Paragraph,
	parent: Parent | undefined,
) => {
	return (
		parent?.type !== "listItem" &&
		node.children.length === 1 &&
		node.children[0].type === "link"
	);
};

export const linkCard: Plugin<[], Root> = () => {
	return async (tree: Root) => {
		const transformers: Transformer[] = [];

		const addTransformer = (link: Link, index: number, parent: Parent) => {
			transformers.push(async () => {
				const linkCardData = await getLinkCardData(new URL(link.url));
				if (linkCardData === undefined) return;
				const linkCardNode = createLinkCardNode(link, linkCardData);
				parent.children.splice(index, 1, linkCardNode);
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

			const link = node.children[0] as Link;
			const urlString = link.url;
			if (isValidUrl(urlString) && !isTwitterUrl(urlString)) {
				addTransformer(link, index, parent);
			}
		};

		visit(tree, "paragraph", visitor);

		const results = await Promise.allSettled(transformers.map((t) => t()));
		for (const [index, result] of results.entries()) {
			if (result.status === "rejected") {
				console.error(
					`[linkCard] Failed to transform link at index ${index}`,
					result.reason,
				);
			}
		}
	};
};

const createLinkCardNode = (link: Link, data: OgData) => {
	const { title, faviconUrlString, description, hostname } = data;
	return {
		title,
		data: {
			hProperties: {
				type: "linkCard",
				title,
				hostname,
				...(faviconUrlString ? { faviconUrlString } : {}),
				...(description ? { description } : {}),
			} satisfies Omit<LinkProps, "href">,
		},
		...link,
	} satisfies Link;
};
