import type { Code, Parent, Root } from "mdast";
import type { Plugin } from "unified";
import type { Node } from "unist";
import { type Visitor, visit } from "unist-util-visit";

export interface CodeBlockProps {
	lang: string;
	title?: string;
	code: string;
}

const visitor: Visitor<Code> = (node, index, parent) => {
	if (!parent || index === undefined) {
		return;
	}

	const { lang, meta, value } = node;
	const title = meta;

	const code: Parent = {
		type: "pre",
		data: {
			hName: "pre",
			hProperties: {
				code: encodeURIComponent(value),
				...(lang ? { lang } : { lang: "text" }),
				...(title ? { title } : {}),
			} satisfies CodeBlockProps,
		},
		children: [],
	};

	parent.children.splice(index, 1, code);
};

export const codeBlock: Plugin<[], Root> = () => {
	return (tree: Node) => {
		visit(tree, "code", visitor);
	};
};
