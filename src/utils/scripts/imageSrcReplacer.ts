import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import kleur from "kleur";
import { site } from "../consts";

// Matches `![<caption>](/media/<directory>/<file>)` with optional whitespace at the start and end
const markdownImageSourceRegex =
	/^\s*!\[(?<caption>[^\]]*)\]\(\/media\/(?<directory>[^)/\s]+)\/(?<file>[^)/\s]+)\)\s*$/im;

const main = async () => {
	const mdxFileName = process.argv[2];
	if (!mdxFileName) {
		console.error("Usage: bun run imageSrcReplacer.ts <mdx-file>");
		process.exit(1);
	}
	if (!mdxFileName.endsWith(".mdx")) {
		console.error("The input file must be an MDX file.");
		process.exit(1);
	}

	const mdxFilePath = path.resolve(
		__dirname,
		"../../content/posts/",
		mdxFileName,
	);
	if (!mdxFilePath) {
		console.error(`MDX file path not found for ${mdxFileName}.`);
		process.exit(1);
	}

	let content: string;
	try {
		content = await readFile(mdxFilePath, "utf-8");
	} catch (error) {
		console.error(`Failed to read file ${mdxFilePath}:`, error);
		process.exit(1);
	}

	console.log(
		`\nReplacing image sources in ${kleur.cyan(`posts/${mdxFileName}`)}`,
	);

	const logLines: string[] = [];

	const lines = content.split(/\n/).map((line, index) => {
		const { caption, directory, file } =
			markdownImageSourceRegex.exec(line)?.groups || {};
		if (caption && directory && file) {
			const imageUrl = `https://${site.r2SubDomain}/posts/${directory}/${file}`;
			logLines.push(
				[
					kleur.green("✓ "),
					kleur.gray(`Replaced image source in line ${index + 1}:\n`),
					kleur.gray("|"),
					` ![${caption}](`,
					kleur.yellow(`/media/${directory}/${file}`),
					kleur.gray(" -> "),
					kleur.green(imageUrl),
					")",
				].join(""),
			);
			return line.replace(
				markdownImageSourceRegex,
				`![${caption}](${imageUrl})`,
			);
		}
		return line;
	});

	try {
		await writeFile(mdxFilePath, lines.join("\n"), "utf-8");
		for (const logLine of logLines) {
			console.log(logLine);
		}
	} catch (error) {
		console.error(`Failed to write file ${mdxFilePath}:`, error);
		process.exit(1);
	}
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
	main();
}
