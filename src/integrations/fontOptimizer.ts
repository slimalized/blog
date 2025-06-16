import * as fs from "node:fs/promises";
import type { AstroIntegration, AstroIntegrationLogger } from "astro";
import { JSDOM } from "jsdom";
import kleur from "kleur";
import subsetFont from "subset-font";
import { fileKBSize } from "../utils/fileKBSize";

type TagName = keyof HTMLElementTagNameMap;

interface FontOptimizingOption {
	fontPath: string; // Specify the relative path from public/
	includeTagNames: TagName[];
	excludeTagNames?: TagName[];
}

interface FontOptimizingLogInfo {
	fontPath: string;
	prevFileSize: number;
	optimizedFileSize: number;
	charsLength: number;
}

const headers: TagName[] = ["h1", "h2", "h3", "h4"];

const fontOptimizingOptions: FontOptimizingOption[] = [
	{
		// 1. Noto Sans JP 400: Basic characters
		fontPath: "fonts/noto-sans-jp_regular_400.woff2",
		includeTagNames: ["body"],
		excludeTagNames: ["script", "strong", ...headers],
	},
	{
		// 2. Noto Sans JP 700: <strong>
		fontPath: "fonts/noto-sans-jp_bold_700.woff2",
		includeTagNames: ["strong"],
	},
	{
		// 3. Zen Kaku Gothic New 500: <h1> <h2> <h3> <h4>
		fontPath: "fonts/zen-kaku-gothic-new_medium_500.woff2",
		includeTagNames: [...headers],
	},
	// JetBrains Mono and Oldenburg are already subset in advance, so it is excluded.
];

/**
 * Extracts text content from specified HTML file and tags.
 * @param htmlFilePath Path to the HTML file.
 * @param fontOptimizingOption {@link FontOptimizingOption}.
 * @returns Concatenated text content.
 */
const collectTextContentFromHTML = async (
	htmlFilePath: string,
	fontOptimizingOption: FontOptimizingOption,
): Promise<string> => {
	const { includeTagNames, excludeTagNames } = fontOptimizingOption;
	const textContents: string[] = [];

	try {
		const htmlContent = await fs.readFile(htmlFilePath, "utf-8");
		const { document } = new JSDOM(htmlContent).window;

		// 1. Remove unnecessary doms.
		const ExcludeDoms = (excludeTagNames ?? []).flatMap((tagName) =>
			Array.from(document.getElementsByTagName(tagName)),
		);
		for (const dom of ExcludeDoms) {
			dom.remove();
		}

		// 2. collect text content from specified doms.
		const IncludeDoms = includeTagNames.flatMap((tagName) =>
			Array.from(document.getElementsByTagName(tagName)),
		);
		for (const dom of IncludeDoms) {
			const textContent = dom.textContent?.replace(/\n/g, "").trim() ?? "";
			textContents.push(textContent);
		}
	} catch (error) {
		console.error(
			`[collectTextContentFromHTML] Failed to process HTML file: ${htmlFilePath}`,
			error,
		);
	}

	return textContents.join("");
};

/**
 * Extract used characters (no duplicates).
 * @param htmlFilePaths Array of HTML file paths.
 * @param fontOptimizingOption Font optimizing option.
 * @returns Used characters (no duplicates).
 */
const extractUsedCharacters = async (
	htmlFilePaths: string[],
	fontOptimizingOption: FontOptimizingOption,
): Promise<string> => {
	const textContents: string[] = [];
	for (const htmlFilePath of htmlFilePaths) {
		const textContent = await collectTextContentFromHTML(
			htmlFilePath,
			fontOptimizingOption,
		);
		textContents.push(textContent);
	}
	const characterSet = new Set(textContents.join(""));
	const usedCharacters = Array.from(characterSet).join("");
	return usedCharacters;
};

/**
 * Subsets the font file and returns optimization log info.
 * @param htmlFilePaths Array of HTML file paths.
 * @param fontOptimizingOption Font optimizing option.
 * @param dir Output directory URL.
 * @returns Optimization log info ({@link FontOptimizingOption}) (undefined if failed).
 */
const optimizeFonts = async (
	htmlFilePaths: string[],
	fontOptimizingOption: FontOptimizingOption,
	dir: URL,
): Promise<FontOptimizingLogInfo | undefined> => {
	const { fontPath } = fontOptimizingOption;

	// 1. Extract used characters from HTML files.
	const usedCharacters = await extractUsedCharacters(
		htmlFilePaths,
		fontOptimizingOption,
	);

	// 2. Generate the font file path.
	let fontFilePath: string;
	if (URL.canParse(fontPath, dir)) {
		fontFilePath = new URL(fontPath, dir).pathname;
	} else {
		console.error(`[optimizeFonts] Invalid font file path: ${fontPath}`);
		return;
	}

	const prevFileSize = (await fs.stat(fontFilePath)).size;

	// 3. Read the font file.
	let rawFontData: Buffer;
	try {
		rawFontData = await fs.readFile(fontFilePath);
	} catch (error) {
		console.error(
			`[optimizeFonts] Failed to read font file: ${fontFilePath}`,
			error,
		);
		return;
	}

	// 4. Subset the font.
	let optimizedFontData: Buffer;
	try {
		optimizedFontData = await subsetFont(rawFontData, usedCharacters, {
			targetFormat: "woff2",
		});
	} catch (error) {
		console.error(`[optimizeFonts] Failed to subset font: ${fontPath}`, error);
		return;
	}

	// 5. Write the optimized font file.
	try {
		await fs.writeFile(fontFilePath, optimizedFontData);
	} catch (error) {
		console.error(
			`[optimizeFonts] Failed to write optimized font file: ${fontFilePath}`,
			error,
		);
		return;
	}

	// 6. Return log info.
	const optimizedFileSize = (await fs.stat(fontFilePath)).size;
	const charsLength = usedCharacters.length;

	return {
		fontPath,
		prevFileSize,
		optimizedFileSize,
		charsLength,
	};
};

export const fontOptimizer = (): AstroIntegration => ({
	name: "font-optimizer",
	hooks: {
		"astro:build:done": async (options: {
			dir: URL;
			assets: Map<string, URL[]>;
			logger: AstroIntegrationLogger;
		}) => {
			const urls: URL[] = Array.from(options.assets.values()).flat();
			const htmlFilePaths = urls
				.map((url) => url.pathname)
				.filter((pathname) => pathname.endsWith("html"));

			if (htmlFilePaths.length === 0) {
				options.logger.info("No html files. Font optimizer skipped.");
				return;
			}

			console.log(kleur.bgGreen().black(" optimizing fonts ")); // log start

			for (const fontOptimizingOption of fontOptimizingOptions) {
				const logInfo = await optimizeFonts(
					htmlFilePaths,
					fontOptimizingOption,
					options.dir,
				);
				if (logInfo) {
					const logMessage = [
						kleur.gray("Optimized"),
						logInfo.fontPath,
						kleur.gray(
							`(${kleur.yellow(fileKBSize(logInfo.prevFileSize))} kB ->`,
						),
						kleur.green(fileKBSize(logInfo.optimizedFileSize)),
						kleur.gray(`kB | ${logInfo.charsLength} chars)`),
					].join(" ");
					options.logger.info(logMessage);
				}
			}

			console.log(" "); // log line break
		},
	},
});
