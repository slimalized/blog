import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import kleur from "kleur";
import { site } from "../consts";

// Matches ![<caption>](...) or @video[<caption>](...) with /media/<type>/<id>/<file> (with optional spaces at the start and end)
const markdownImageSourceRegex =
	/^\s*(?<syntax>!|@video)\[(?<caption>[^\]]*)\]\(\/media\/(?<contentType>[^)/\s]+)\/(?<id>[^)/\s]+)\/(?<file>[^)/\s]+)\)\s*$/i;

const main = async () => {
	const [contentType, mdxFileName] = process.argv[2].split("/");
	if (!contentType || !mdxFileName) {
		console.error(
			"Usage: bun run imageSrcReplacer.ts {posts|works}/{mdx file} ",
		);
		process.exit(1);
	}
	if (!mdxFileName.endsWith(".mdx")) {
		console.error("The input file must be an MDX file.");
		process.exit(1);
	}

	const mdxFilePath = path.resolve(
		__dirname,
		"../../content/",
		contentType,
		mdxFileName,
	);
	if (!mdxFilePath) {
		console.error(`MDX file path not found for ${contentType}/${mdxFileName}.`);
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
		`\nReplacing image sources in ${kleur.cyan(`${contentType}/${mdxFileName}`)}`,
	);

	const logLines: string[] = [];

	const lines = content.split(/\n/).map((line, index) => {
		const match = markdownImageSourceRegex.exec(line);
		const { syntax, caption, contentType, id, file } = match?.groups || {};
		if (syntax && contentType && id && file) {
			const safeCaption = caption ?? "";
			const imageUrl = `https://${site.r2SubDomain}/${contentType}/${id}/${file}`;
			logLines.push(
				[
					kleur.green("✓ "),
					kleur.gray(`Replaced image source in line ${index + 1}:\n`),
					kleur.gray("|"),
					` ${syntax}[${safeCaption}](`,
					kleur.yellow(`/media/${contentType}/${id}/${file}`),
					kleur.gray(" -> "),
					kleur.green(imageUrl),
					")",
				].join(""),
			);
			return line.replace(
				markdownImageSourceRegex,
				`${syntax}[${safeCaption}](${imageUrl})`,
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
