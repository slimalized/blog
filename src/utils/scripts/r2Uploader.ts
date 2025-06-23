import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import {
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import kleur from "kleur";
import { site } from "../consts";
import { isValidImageSource } from "./mediaConverter";

const ACCOUNT_ID = process.env.ACCOUNT_ID ?? "";
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID ?? "";
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY ?? "";
const BUCKET_NAME = process.env.BUCKET_NAME ?? "";

const handleR2Upload = async (dirName: string, shouldUpdate: boolean) => {
	const dirPath = path.resolve(__dirname, "../../../media", dirName);

	let imageEntries: Dirent[];
	try {
		imageEntries = (await fs.readdir(dirPath, { withFileTypes: true })).filter(
			(entry) => {
				if (!entry.isFile()) return false;
				const { isAVIF, isSVG } = isValidImageSource(entry.name);
				return isAVIF || isSVG;
			},
		);
	} catch (error) {
		console.error(`Failed to read directory ${dirPath}:`, error);
		process.exit(1);
	}

	if (imageEntries.length === 0) {
		console.log(
			kleur.yellow(
				`Nothing to upload: No .avif or .svg files found in media/${dirName}`,
			),
		);
		return;
	}

	console.log(`\nR2 upload for ${kleur.cyan(`media/${dirName}`)}`);

	const r2Client = new S3Client({
		region: "auto",
		endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: ACCESS_KEY_ID,
			secretAccessKey: SECRET_ACCESS_KEY,
		},
	});

	const { Contents } = await r2Client.send(
		new ListObjectsV2Command({
			Bucket: BUCKET_NAME,
			Prefix: `posts/${dirName}/`,
		}),
	);

	const existingKeys = new Set(
		Contents?.map((content) => content.Key).filter(Boolean) || [],
	);

	for (const [index, entry] of imageEntries.entries()) {
		const filePath = path.join(dirPath, entry.name);
		console.log(
			kleur.gray(`+ (${index + 1}/${imageEntries.length}) ${entry.name}`),
		);

		const { isSVG } = isValidImageSource(entry.name);

		let imageBuffer: Buffer;
		try {
			imageBuffer = await fs.readFile(filePath);
		} catch (error) {
			console.error(`Failed to read file ${entry.name}:`, error);
			continue;
		}

		const key = `posts/${dirName}/${entry.name}`;
		const url = `https://${site.r2SubDomain}/${key}`;
		if (existingKeys.has(key) && !shouldUpdate) {
			console.log(
				kleur.yellow(
					`- Skipped uploading "${entry.name}". File already exists in R2.`,
				),
				kleur.gray(`(${url})`),
			);
			continue;
		}

		const uploadParams = {
			Bucket: BUCKET_NAME,
			Key: key,
			Body: imageBuffer,
			ContentType: isSVG ? "image/svg+xml" : "image/avif",
		};
		try {
			await r2Client.send(new PutObjectCommand(uploadParams));
			console.log(
				[
					kleur.green("✓"),
					existingKeys.has(key)
						? kleur.yellow("Updated: ")
						: kleur.gray("Uploaded:"),
					kleur.green(`+ ${entry.name}`),
					kleur.gray(`(${url})`),
				].join(" "),
			);
		} catch (error) {
			console.error(`Failed to upload ${key}:`, error);
		}
	}
};

const main = async () => {
	if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
		console.error(
			"Environment variables ACCOUNT_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY and BUCKET_NAME must be set.",
		);
		process.exit(1);
	}

	const args = process.argv.slice(2);
	const dirName = args[0];
	const shouldUpdate = args.includes("--update");
	if (!dirName) {
		console.error("Usage: bun run r2Uploader.ts <directory> [--update]");
		process.exit(1);
	}
	await handleR2Upload(dirName, shouldUpdate);
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
	main();
}
