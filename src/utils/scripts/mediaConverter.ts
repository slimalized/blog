import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import kleur from "kleur";
import sharp from "sharp";

export const imageSizes = {
	small: 400,
	large: 720,
	original: 0, // Use 0 for original size to indicate no resizing
} as const;
type SizeLabel = keyof typeof imageSizes;

const validExts = [".png", ".jpg", ".jpeg", ".webp"];

export const isValidImageSource = (fileName: string) => {
	const lower = fileName.toLowerCase();
	const isAVIF = lower.endsWith(".avif");
	const isSVG = lower.endsWith(".svg");
	const isImage =
		isAVIF || isSVG || validExts.some((ext) => lower.endsWith(ext));
	return { isImage, isAVIF, isSVG };
};

const convertToAvif = async (filePath: string, sizeLabel: SizeLabel) => {
	const { base, name } = path.parse(filePath);

	const boundaryWidth = imageSizes[sizeLabel];
	let originalWidth: number | undefined;
	try {
		originalWidth = (await sharp(filePath).metadata()).width;
	} catch (error) {
		throw new Error(`Failed to get metadata for ${base}: ${error}`);
	}
	if (!originalWidth) {
		throw new Error(`Failed to get width for ${base}`);
	}

	if (originalWidth <= boundaryWidth) {
		console.log(
			[
				kleur.yellow(`- Skipped conversion to "${sizeLabel}" size.`),
				kleur.gray(
					`(original width ${originalWidth}px <= ${boundaryWidth}px for "${sizeLabel}")`,
				),
			].join(" "),
		);
		return;
	}

	let avifBuffer: Buffer;
	try {
		const sharpInstance = sharp(filePath);
		if (sizeLabel !== "original") {
			sharpInstance.resize({ width: boundaryWidth });
		}
		avifBuffer = await sharpInstance.avif({ quality: 80 }).toBuffer();
	} catch (error) {
		throw new Error(`Failed to convert ${base} to AVIF: ${error}`);
	}

	const outputFileName =
		sizeLabel !== "original" ? `${name}_${sizeLabel}.avif` : `${name}.avif`;
	const outputFilePath = path.join(path.dirname(filePath), outputFileName);

	try {
		await fs.writeFile(outputFilePath, avifBuffer);
		const { width, height } = await sharp(outputFilePath).metadata();
		console.log(
			[
				kleur.green("✓"),
				kleur.gray("Converted and saved:"),
				kleur.green(`+ ${outputFileName}`),
				kleur.gray(`(${width}x${height})`),
			].join(" "),
		);
		return outputFileName;
	} catch (error) {
		throw new Error(`Failed to write ${outputFileName}: ${error}`);
	}
};

const handleConversion = async (
	dirName: string,
	shouldDeleteOriginal: boolean,
) => {
	const dirPath = path.resolve(__dirname, "../../../media", dirName);

	let imageEntries: Dirent[];
	try {
		imageEntries = (await fs.readdir(dirPath, { withFileTypes: true })).filter(
			(entry) => {
				if (!entry.isFile()) return false;
				const { isImage, isAVIF, isSVG } = isValidImageSource(entry.name);
				return isImage && !isAVIF && !isSVG;
			},
		);
	} catch (error) {
		console.error(`Failed to read directory ${dirPath}:`, error);
		process.exit(1);
	}

	if (imageEntries.length === 0) {
		console.log(
			kleur.yellow(
				`Nothing to convert: No valid image files found in media/${dirName}`,
			),
		);
		return;
	}

	console.log(`\nAVIF conversion for ${kleur.cyan(`media/${dirName}`)}`);

	const sizeLabels = Object.keys(imageSizes) as Array<SizeLabel>;

	for (const [index, entry] of imageEntries.entries()) {
		const inputFilePath = path.join(dirPath, entry.name);
		console.log(
			kleur.gray(`+ (${index + 1}/${imageEntries.length}) ${entry.name}`),
		);

		const results = await Promise.allSettled(
			sizeLabels.map((sizeLabel) => convertToAvif(inputFilePath, sizeLabel)),
		);

		const allSucceeded = results.every((result) => {
			if (result.status === "rejected") {
				console.error(
					`✗ Failed to convert "${entry.name}" (${sizeLabels[index]}). ${result.reason}`,
				);
			}
			return result.status === "fulfilled";
		});

		if (!shouldDeleteOriginal) continue;

		if (allSucceeded) {
			try {
				await fs.unlink(inputFilePath);
				console.log(
					[
						kleur.green("✓"),
						kleur.gray("Deleted original:   "),
						kleur.red(`- ${entry.name}`),
					].join(" "),
				);
				continue;
			} catch (error) {
				console.error(`Failed to delete original file ${entry.name}:`, error);
			}
		}

		console.log(
			kleur.yellow(
				`! Skipped deleting original (${entry.name}) because some conversions failed.`,
			),
		);
	}
};

const main = async () => {
	const args = process.argv.slice(2);
	const dirName = args[0];
	const shouldDeleteOriginal = args.includes("--delete");
	if (!dirName) {
		console.error("Usage: bun run mediaConverter.ts <directory> [--delete]");
		process.exit(1);
	}
	await handleConversion(dirName, shouldDeleteOriginal);
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
	main();
}
