import type { Link, Paragraph, Root, Text } from "mdast";
import type { Plugin } from "unified";
import type { Parent } from "unist";
import { type Visitor, visit } from "unist-util-visit";

export interface VideoProps {
	src: string;
	caption?: string;
}

const isVideoNode = (node: Paragraph, parent: Parent | undefined) => {
	return (
		parent?.type !== "listItem" &&
		node.children.length === 2 &&
		node.children[0].type === "text" &&
		node.children[0].value === "@video" &&
		node.children[1].type === "link"
	);
};

const visitor: Visitor<Paragraph> = (node, index, parent) => {
	if (parent === undefined || index === undefined) return;
	if (!isVideoNode(node, parent)) return;

	const link = node.children[1] as Link;
	const src = link.url;
	const caption =
		link.children.length > 0 ? (link.children[0] as Text).value : undefined;

	const video: Paragraph = {
		data: {
			hName: "video",
			hProperties: {
				src,
				caption,
			} satisfies VideoProps,
		},
		...node,
		children: [],
	};

	parent.children.splice(index, 1, video);
};

export const video: Plugin<[], Root> = () => {
	return (tree: Root) => {
		visit(tree, "paragraph", visitor);
	};
};
