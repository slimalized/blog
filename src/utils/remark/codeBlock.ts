import type { Code, Literal, Root } from "mdast";
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

	// Since the Code node type did not work as expected, we use the abstract Literal type and map it to the CodeBlock component via the hName property as a pre tag.
	const code: Literal = {
		// The required value property of Literal is not used, so any value is fine. The same applies to the type property.
		type: "element",
		value: "",
		data: {
			hName: "pre",
			hProperties: {
				code: encodeURIComponent(value),
				...(lang ? { lang } : { lang: "text" }),
				...(title ? { title } : {}),
			} satisfies CodeBlockProps,
		},
	};

	parent.children.splice(index, 1, code);
};

export const codeBlock: Plugin<[], Root> = () => {
	return (tree: Node) => {
		visit(tree, "code", visitor);
	};
};
