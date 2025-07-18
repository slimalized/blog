import type { Heading, Node, Root, Text } from "mdast";
import type { Plugin } from "unified";
import { type Visitor, visit } from "unist-util-visit";

export interface HeadingProps {
	value?: string;
	depth?: string;
	id: string;
	class?: string; // Astro's footnotes specify a class "sr-only"
}

const visitor: Visitor<Heading> = (node, index, parent) => {
	if (parent === undefined || index === undefined) return;

	const heading: Heading = {
		data: {
			hProperties: {
				value: (node.children[0] as Text).value,
				depth: node.depth.toString(),
			} satisfies Pick<HeadingProps, "value" | "depth">,
		},
		...node,
	};

	parent.children.splice(index, 1, heading);
};

export const headingAnchor: Plugin<[], Root> = () => {
	return (tree: Node) => {
		visit(tree, "heading", visitor);
	};
};
