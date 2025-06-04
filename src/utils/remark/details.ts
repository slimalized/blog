import type {
	Heading,
	Node,
	Paragraph,
	Parent,
	Root,
	RootContent,
	Text,
} from "mdast";
import type { Plugin } from "unified";
import { type Visitor, visit } from "unist-util-visit";
import type { HeadingProps } from "./headingAnchor";

export interface DetailsProps {
	summaryValue?: string;
}

interface Details {
	summaryValue: string;
	isHeading: boolean;
	startFenceIndex: number;
	endFenceIndex: number | undefined;
}

type Transformer = (shiftAmount: number) => number;

const detailsFenceRegex = {
	start: /^:::details\s+(.+)$/, // `:::details {summary title}`
	end: /^:::$/, // `:::`
};
const isStartFence = (value: string) => detailsFenceRegex.start.test(value);
const isEndFence = (value: string) => detailsFenceRegex.end.test(value);

const updateDetailsArray = (
	value: string,
	index: number,
	detailsArray: Details[],
) => {
	// A. If the end fence index is not undefined, i.e., the previous details block is closed, add a new one.
	if (isStartFence(value)) {
		let summaryValue = value.match(detailsFenceRegex.start)?.[1];
		if (!summaryValue) return;
		const isHeading = summaryValue.startsWith("#");
		if (isHeading) {
			summaryValue = summaryValue.slice(1);
		}
		if (
			detailsArray.length === 0 ||
			detailsArray.at(-1)?.endFenceIndex !== undefined
		) {
			detailsArray.push({
				summaryValue,
				isHeading,
				startFenceIndex: index,
				endFenceIndex: undefined,
			});
		}
		return;
	}
	// B. Each time an end fence is found, update the end fence index of the last details element.
	if (isEndFence(value)) {
		const last = detailsArray.at(-1);
		if (last !== undefined) {
			last.endFenceIndex = index;
		}
	}
};

export const details: Plugin<[], Root> = () => {
	return (tree: Root) => {
		const detailsArray: Details[] = [];

		const visitor: Visitor<Paragraph> = (node, index, parent) => {
			// - Do not allow nesting details.
			// - Index is needed to determine the start and end positions of details fence.
			if (parent?.type !== "root" || index === undefined) return;
			// - Details fence must be a paragraph with a single text node as its child.
			const children = node.children;
			if (children.length !== 1 && children[0].type !== "text") return;

			const value = (children[0] as Text).value;
			updateDetailsArray(value, index, detailsArray);
		};

		visit(tree, "paragraph", visitor);

		const transformers: Transformer[] = detailsArray
			.filter((details) => details.endFenceIndex !== undefined)
			.map((details) => {
				return (shiftAmount: number) => {
					const { startFenceIndex, endFenceIndex } = details;

					const start = startFenceIndex - shiftAmount;
					const end = (endFenceIndex as number) - shiftAmount;
					const detailsContent = tree.children.slice(start + 1, end);

					const detailsNode = createDetailsNode(details, detailsContent);
					(tree.children as Node[]).splice(start, end - start + 1, detailsNode);

					const nextShiftAmount = end - start;
					return nextShiftAmount;
				};
			});

		transformers.reduce((shiftAmount, t) => t(shiftAmount) + shiftAmount, 0);
	};
};

const createDetailsNode = (details: Details, content: RootContent[]) => {
	const { summaryValue, isHeading } = details;

	const heading: Heading = {
		type: "heading",
		depth: 4,
		data: {
			hProperties: {
				value: summaryValue,
				depth: "4",
				slot: "details-header", // name of named-slot. https://docs.astro.build/en/basics/astro-components/#named-slots
			} satisfies Pick<HeadingProps, "value" | "depth"> & {
				slot: "details-header";
			},
		},
		children: [
			{
				type: "text",
				value: summaryValue,
			},
		],
	};

	return {
		type: "details",
		data: {
			hName: "details",
			hProperties: {
				...(!isHeading ? { summaryValue } : {}),
			} satisfies DetailsProps,
		},
		children: isHeading ? [heading, ...content] : content,
	} satisfies Parent;
};
