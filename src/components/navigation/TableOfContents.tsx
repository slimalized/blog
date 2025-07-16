import type { MarkdownHeading } from "astro";
import type { JSX, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./TableOfContents.module.css";

// Only headings of levels 2, 3, and 4 are used in the article.
const depth = [2, 3, 4] as const;
type Depth = (typeof depth)[number];

const isValidDepth = (number: number): number is Depth => {
	return depth.some((d) => d === number);
};

const CreateTableOfContentsList = (
	headings: MarkdownHeading[],
	baseDepth: Depth,
	activeIds: Set<string>,
	itemRefs: RefObject<Record<string, HTMLAnchorElement | null>>,
) => {
	const toc: JSX.Element[] = [];
	for (const [index, heading] of headings.entries()) {
		const { depth: currentDepth, slug, text } = heading;

		if (!isValidDepth(currentDepth)) {
			console.error("[TableOfContents] Invalid heading depth:", currentDepth);
			continue;
		}

		if (currentDepth < baseDepth) break;

		if (currentDepth === baseDepth) {
			const nextIndex = index + 1;
			const nextDepth: number | undefined = headings[nextIndex]?.depth;
			toc.push(
				<li key={slug}>
					<a
						href={`#${slug}`}
						ref={(AnchorElement) => {
							itemRefs.current[slug] = AnchorElement;
						}}
						data-is-active={activeIds?.has(slug) ? "true" : undefined}
					>
						{text}
					</a>
					{isValidDepth(nextDepth) &&
						nextDepth > baseDepth &&
						CreateTableOfContentsList(
							headings.slice(nextIndex),
							nextDepth,
							activeIds,
							itemRefs,
						)}
				</li>,
			);
		}
	}

	return toc.length > 0 ? (
		<ol className={styles[`ol-depth-${baseDepth}`]}>{[...toc]}</ol>
	) : null;
};

const observerOptions: IntersectionObserverInit = {
	root: null, // viewport
	rootMargin: "0px 0px",
	threshold: 0,
};

export const TableOfContents = ({
	headings: _headings,
	depthLimit = 3,
}: {
	headings: MarkdownHeading[];
	depthLimit?: Depth;
}) => {
	const headings = _headings.filter((heading) => heading.depth <= depthLimit);
	const headingElementsRef = useRef<HTMLElement[]>([]);
	const scrollDirectionRef = useRef<"down" | "up" | undefined>(undefined);
	const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
	const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

	// Only retrieve DOM elements when headings change.
	useEffect(() => {
		headingElementsRef.current = headings
			.map((h) => document.getElementById(h.slug))
			.filter(Boolean) as HTMLElement[];
	}, [headings]);

	// Automatically scroll if the active table of contents item is out of view.
	useEffect(() => {
		const lastActiveId = Array.from(activeIds).pop();
		if (!lastActiveId) return;
		itemRefs.current[lastActiveId]?.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
		});
	}, [activeIds]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (headingElementsRef.current.length === 0) return;

		const headingIds = headingElementsRef.current.map((heading) => heading.id);

		const observer = new IntersectionObserver((entries) => {
			setActiveIds((prev) => {
				const next: Set<string> = new Set(
					scrollDirectionRef.current !== undefined ? [] : prev,
				);
				scrollDirectionRef.current = undefined;
				for (const entry of entries) {
					const id = entry.target.id;
					if (!id) continue;
					if (entry.isIntersecting) {
						next.add(id);
					} else {
						next.delete(id);
					}
				}

				// When there are no heading elements visible in the viewport.
				if (
					next.size === 0 &&
					entries.length === 1 &&
					!entries[0].isIntersecting
				) {
					scrollDirectionRef.current =
						entries[0].boundingClientRect.y < 0 ? "down" : "up";
					if (scrollDirectionRef.current === "down") {
						return new Set([entries[0].target.id]);
					}
					if (scrollDirectionRef.current === "up") {
						const index = headingIds.indexOf(entries[0].target.id);
						const prevHeadingId = index > 0 ? headingIds[index - 1] : null;
						return new Set([prevHeadingId ?? entries[0].target.id]);
					}
				}

				if (prev.size !== next.size || [...prev].some((id) => !next.has(id))) {
					return next;
				}
				return prev;
			});
		}, observerOptions);

		for (const headingElement of headingElementsRef.current) {
			observer.observe(headingElement);
		}

		return () => observer.disconnect();
	}, []);

	if (headings.length === 0) return null;

	return (
		<div id={styles["table-of-contents-wrapper"]}>
			<nav id={styles["table-of-contents"]}>
				{CreateTableOfContentsList(headings, 2, activeIds, itemRefs)}
			</nav>
		</div>
	);
};
